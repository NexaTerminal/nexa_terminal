/**
 * MK email templates for the newsletter banner-slot feature.
 *
 * Two triggers:
 *   - newsletterAdBookedAdmin   → to the platform admin on every new booking
 *                                 (the banner image arrives as an attachment;
 *                                 placement in Mailjet is manual)
 *   - newsletterAdCancelledUser → courtesy note to the member when admin
 *                                 cancels a booking (quota is restored)
 */

const wrap = (title, bodyHtml) => `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color:#0B1220; line-height:1.55; max-width:560px; margin:0 auto; padding:24px;">
  <h2 style="margin:0 0 16px; font-size:20px; color:#0B1220;">${title}</h2>
  ${bodyHtml}
  <p style="margin-top:32px; font-size:12px; color:#94a3b8;">Nexa Terminal · nexa.mk</p>
</body></html>`;

const esc = (s) => String(s || '').replace(/</g, '&lt;');

const newsletterAdBookedAdmin = ({ companyName, userEmail, monthKey, slotNumber, targetUrl, note }) => ({
  subject: `Нов банер за билтен — ${companyName} — ${monthKey} (слот ${slotNumber})`,
  html: wrap('Нова резервација на банер', `
    <p><strong>${esc(companyName)}</strong> (${esc(userEmail)}) резервираше банер во билтенот.</p>
    <table style="font-size:14px; border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Месец:</td><td><strong>${esc(monthKey)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Слот:</td><td><strong>${slotNumber} / 3</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Линк:</td><td>${targetUrl ? `<a href="${esc(targetUrl)}">${esc(targetUrl)}</a>` : '—'}</td></tr>
      <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Забелешка:</td><td>${esc(note) || '—'}</td></tr>
    </table>
    <p>Банерот е во прилог на овој email. Постави го рачно во Mailjet кампањата за ${esc(monthKey)}.</p>
    <p><a href="https://nexa.mk/terminal/admin/newsletter-ads">Отвори ги резервациите →</a></p>
  `)
});

const newsletterAdCancelledUser = ({ name, monthKey }) => ({
  subject: `Вашиот банер за билтенот (${monthKey}) е откажан`,
  html: wrap(`Здраво ${esc(name)},`, `
    <p>Вашата резервација за банер во Nexa билтенот за <strong>${esc(monthKey)}</strong> е откажана од администраторот.</p>
    <p>Вашата квартална квота е вратена — може да резервирате нов термин во секое време.</p>
    <p><a href="https://nexa.mk/terminal/marketing-hub?tab=banner" style="display:inline-block; background:#0B1220; color:#FFF; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">Резервирај нов термин →</a></p>
    <p>Доколку мислите дека ова е грешка, одговорете на овој email.</p>
  `)
});

module.exports = {
  newsletterAdBookedAdmin,
  newsletterAdCancelledUser
};
