// Weekly lead-teaser digest email (Monday) for active Pro lawyers.
//
// Deliberately a TEASER: it shows the subject (topic), city and legal area of a
// few active leads — never the client's name, email, phone or full summary — so
// the only way to act on a case is to log in. "Cases are waiting for you."

const CATEGORY_LABEL = {
  labor:          'Работни односи',
  property:       'Сопственост и недвижности',
  insurance:      'Осигурување',
  company:        'Фирми',
  citizenship:    'Државјанство',
  residence:      'Регулирање на престој',
  tax:            'Даноци',
  family:         'Семејно право',
  inheritance:    'Наследување',
  ip:             'Авторско право и интелектуална сопственост',
  administrative: 'Административни постапки',
  other_legal:    'Друго (правно)',
  legal_questions: 'Правни прашања'
};

const CITY_LABEL = {
  Skopje: 'Скопје', Bitola: 'Битола', Kumanovo: 'Куманово', Prilep: 'Прилеп',
  Tetovo: 'Тетово', Veles: 'Велес', 'Štip': 'Штип', Ohrid: 'Охрид',
  Strumica: 'Струмица', Gostivar: 'Гостивар', Kavadarci: 'Кавадарци',
  Kočani: 'Кочани', Other: 'Друго', Anywhere: 'Каде било'
};

function categoryLabel(key) { return CATEGORY_LABEL[key] || 'Правно прашање'; }
function cityLabel(key) { return CITY_LABEL[key] || key || 'Каде било'; }

// "пред 2 дена" / "денес" / "вчера"
function agoLabel(postedAt, now = new Date()) {
  const days = Math.floor((now - new Date(postedAt)) / 86400000);
  if (days <= 0) return 'денес';
  if (days === 1) return 'вчера';
  return `пред ${days} дена`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * @param {object} opts
 * @param {string} opts.name       — lawyer display name
 * @param {Array}  opts.leads      — [{ topic, city, categories[], urgency, postedAt }]
 * @param {string} opts.portalUrl  — leads storefront origin (no trailing slash)
 * @param {Date}   [opts.now]
 * @returns {{subject:string, html:string}}
 */
function leadDigestEmail({ name, leads = [], portalUrl, now = new Date() }) {
  const count = leads.length;
  const subject = `Те чекаат ${count} предмети на Nexa`;
  const loginUrl = `${portalUrl}/terminal`;

  const rows = leads.map((l) => {
    const area = categoryLabel((l.categories || [])[0]);
    const urgent = l.urgency === 'urgent'
      ? ' &nbsp;<span style="background:#fde8e8;color:#b91c1c;border-radius:4px;padding:1px 6px;font-size:12px;font-weight:600;">Итно</span>'
      : '';
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #eee;">
          <div style="font-size:15px;font-weight:600;color:#111;line-height:1.4;">${escapeHtml(l.topic)}${urgent}</div>
          <div style="font-size:13px;color:#666;margin-top:4px;">
            ${escapeHtml(area)} · ${escapeHtml(cityLabel(l.city))} · ${agoLabel(l.postedAt, now)}
          </div>
        </td>
      </tr>`;
  }).join('');

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
    <h1 style="font-size:20px;margin:0 0 6px;">Здраво${name ? ', ' + escapeHtml(name) : ''},</h1>
    <p style="font-size:15px;color:#333;line-height:1.5;margin:0 0 20px;">
      Оваа недела на таблата има <strong>${count}</strong> активни побарувања што чекаат адвокат.
      Еве дел од нив — најави се за да ги видиш деталите и да изразиш интерес.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #eee;">
      ${rows}
    </table>

    <div style="margin:28px 0;text-align:center;">
      <a href="${loginUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:8px;">
        Отвори ги предметите →
      </a>
    </div>

    <p style="font-size:12px;color:#999;line-height:1.5;margin:0;">
      Детали за клиентот (име, контакт, целосен опис) се достапни само во терминалот, по најава.
      Ја добивате оваа порака како член на Nexa Pro.
    </p>
  </div>`;

  return { subject, html };
}

module.exports = { leadDigestEmail };
