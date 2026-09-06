'use strict';

/**
 * Feature-education emails sent during the 8-day self-serve trial (see
 * trialReminderService). Unlike the conversion proforma, these carry no PDF —
 * they teach one or two features and deep-link straight into the terminal.
 *
 * @param {object} p
 *   p.stageKey    — 'edu_documents' | 'edu_lhc'
 *   p.name        — recipient display name
 *   p.daysLeft    — whole days left in the trial (for a light urgency line)
 *   p.appBase     — brand host (https://nexa.mk or https://leads.nexa.mk)
 *   p.product     — 'A' (SMB) | 'B' (lawyers/Pro); brands the header/footer
 */
function trialEducationEmail(p = {}) {
  const { stageKey, name = '', daysLeft = 0, appBase = 'https://nexa.mk', product = 'A' } = p;

  const brandName = product === 'B' ? 'Nexa за правници' : 'Nexa';
  const daysText = daysLeft <= 0 ? 'денес завршува' : daysLeft === 1 ? 'уште 1 ден' : `уште ${daysLeft} дена`;

  // A single feature block (icon + title + copy).
  const feature = (icon, title, copy) => `
    <div style="margin:0 0 16px;padding:16px 18px;border:1px solid #EEF0F3;border-radius:10px;">
      <div style="font-size:15px;font-weight:700;color:#0B1220;margin:0 0 6px;">${icon} ${title}</div>
      <div style="font-size:14px;color:#4B5563;line-height:1.55;">${copy}</div>
    </div>`;

  const cta = (href, label) => `
    <a href="${href}" style="display:inline-block;background:#0B1220;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">
      ${label}
    </a>`;

  let subject;
  let intro;
  let blocks;
  let ctaHtml;

  if (stageKey === 'edu_lhc') {
    subject = 'Дали вашата фирма е усогласена? Проверете за 5 минути';
    intro = 'Најчестите казни за фирмите доаѓаат од работи што лесно се проверуваат однапред — договори, ГДПР, безбедност при работа. Nexa го прави тоа за вас.';
    blocks =
      feature('🩺', 'Правен здравствен преглед',
        'Одговорете на неколку прашања и добијте извештај што покажува каде вашата фирма е изложена на ризик, подредено по приоритет — со конкретни чекори за поправка.') +
      feature('✅', 'Проверка на усогласеност',
        'Опфаќа вработување, заштита на лични податоци (ГДПР), даноци и безбедност при работа. Идеално да го поминете пред инспекција.');
    ctaHtml = cta(`${appBase}/terminal/legal-screening`, 'Започни го прегледот →');
  } else {
    // Default: edu_documents (day 2)
    subject = 'Направете правен документ за 2 минути — и проверете постоечки';
    intro = 'Еве двете работи што нашите корисници ги пробуваат прв ден — заштедуваат часови и пари уште од старт.';
    blocks =
      feature('📄', 'Автоматски правни документи',
        'Договори за вработување, одлуки, решенија и десетици други — пополнувате куса форма и добивате готов документ во Word за 2 минути, наместо да плаќате за секој поединечно.') +
      feature('🤖', 'AI проверка на договор',
        'Прикачете постоечки договор и добијте резиме на ризичните клаузули и што недостасува — пред да потпишете.');
    ctaHtml = cta(`${appBase}/terminal/documents`, 'Направи документ →');
  }

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;background:#F6F7F9;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E6E8EC;border-radius:12px;overflow:hidden;">
      <div style="padding:22px 28px;border-bottom:1px solid #EEF0F3;">
        <span style="font-size:13px;font-weight:700;letter-spacing:.08em;color:#1E4DB7;text-transform:uppercase;">${brandName}</span>
      </div>
      <div style="padding:26px 28px;color:#1F2937;line-height:1.6;font-size:15px;">
        <p style="margin:0 0 12px;">Здраво${name ? ' ' + name : ''},</p>
        <p style="margin:0 0 18px;">${intro}</p>

        ${blocks}

        <p style="margin:18px 0;">${ctaHtml}</p>

        <p style="margin:0 0 0;padding:12px 14px;background:#F0F6FF;border-radius:8px;color:#1E4DB7;font-size:13px;">
          ⏳ Вашиот бесплатен пристап трае ${daysText}. Пробајте додека е активен.
        </p>

        <p style="margin:22px 0 0;color:#6B7280;font-size:13px;">
          Прашања? Само одговорете на овој e-mail или пишете на
          <a href="mailto:info@nexa.mk" style="color:#1E4DB7;">info@nexa.mk</a>.
        </p>
      </div>
      <div style="padding:16px 28px;border-top:1px solid #EEF0F3;color:#9CA3AF;font-size:12px;">
        © ${new Date().getFullYear()} ${brandName}
      </div>
    </div>
  </div>`;

  return { subject, html };
}

module.exports = { trialEducationEmail };
