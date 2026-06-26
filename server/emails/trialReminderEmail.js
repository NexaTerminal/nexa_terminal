'use strict';

/**
 * Macedonian email for the trial → paid conversion reminder. The matching
 * "subscription offer" PDF (subscriptionOfferPdf.js) is attached by the caller.
 *
 * @param {object} p
 *   p.name        — recipient display name
 *   p.planLabel   — 'Про' | 'Основен'
 *   p.daysLeft    — whole days until the promo window lapses
 *   p.trialEndsAt — Date
 *   p.options     — [{ label, mkd }]  (monthly, quarterly, annual)
 *   p.appUrl      — link into the terminal subscription page
 *   p.final       — boolean; true for the last (2-days-left) nudge
 */
function trialReminderEmail(p = {}) {
  const {
    name = '', planLabel = 'Про', daysLeft = 0, trialEndsAt,
    options = [], appUrl = 'https://nexa.mk/terminal/subscription', final = false
  } = p;

  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`;
  };
  const fmtMkd = (n) => Number(n || 0).toLocaleString('mk-MK').replace(/\s/g, '.');

  const daysText = daysLeft <= 0 ? 'денес' : daysLeft === 1 ? 'утре' : `за ${daysLeft} дена`;
  const subject = final
    ? `Останаа ${daysLeft <= 1 ? '1 ден' : daysLeft + ' дена'} — активирајте ја вашата Nexa ${planLabel} претплата`
    : `Вашиот Nexa ${planLabel} пристап завршува ${daysText}`;

  const rows = options.map(o => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #EEF0F3;color:#0B1220;font-size:14px;">${o.label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #EEF0F3;color:#0B1220;font-size:14px;font-weight:700;text-align:right;">${fmtMkd(o.mkd)} ден</td>
    </tr>`).join('');

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;background:#F6F7F9;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E6E8EC;border-radius:12px;overflow:hidden;">
      <div style="padding:22px 28px;border-bottom:1px solid #EEF0F3;">
        <span style="font-size:13px;font-weight:700;letter-spacing:.08em;color:#1E4DB7;text-transform:uppercase;">Nexa</span>
      </div>
      <div style="padding:26px 28px;color:#1F2937;line-height:1.6;font-size:15px;">
        <p style="margin:0 0 12px;">Здраво${name ? ' ' + name : ''},</p>
        <p style="margin:0 0 16px;">
          Вашиот бесплатен пристап до <strong>Nexa ${planLabel}</strong> завршува
          <strong>${daysText}${trialEndsAt ? ' (' + fmtDate(trialEndsAt) + ')' : ''}</strong>.
          За да продолжите без прекин, изберете период и извршете уплата.
        </p>

        <table style="width:100%;border-collapse:collapse;border:1px solid #EEF0F3;border-radius:8px;margin:8px 0 18px;">
          <thead>
            <tr>
              <td style="padding:10px 14px;background:#FAFBFC;color:#6B7280;font-size:12px;font-weight:700;text-transform:uppercase;">Период</td>
              <td style="padding:10px 14px;background:#FAFBFC;color:#6B7280;font-size:12px;font-weight:700;text-transform:uppercase;text-align:right;">Износ (MKD)</td>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="margin:0 0 16px;color:#374151;">
          Во прилог е <strong>понуда (профактура)</strong> со банкарските податоци за уплата.
          Уплатата се извршува со банкарски трансфер; со примање на уплатата ја активираме
          соодветната претплата и Ви испраќаме оригинална фактура.
        </p>

        <p style="margin:0 0 20px;padding:12px 14px;background:#F0F6FF;border-radius:8px;color:#1E4DB7;font-size:14px;">
          💡 Совет: банките работат од 08:00 до 14:00 (пон–пет). Уплатата извршена во овие часови
          се обработува најбрзо.
        </p>

        <a href="${appUrl}" style="display:inline-block;background:#0B1220;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">
          Отвори ја мојата претплата
        </a>

        <p style="margin:22px 0 0;color:#6B7280;font-size:13px;">
          Прашања? Само одговорете на овој e-mail или пишете на
          <a href="mailto:info@nexa.mk" style="color:#1E4DB7;">info@nexa.mk</a>.
        </p>
      </div>
      <div style="padding:16px 28px;border-top:1px solid #EEF0F3;color:#9CA3AF;font-size:12px;">
        © ${new Date().getFullYear()} Nexa Terminal
      </div>
    </div>
  </div>`;

  return { subject, html };
}

module.exports = { trialReminderEmail };
