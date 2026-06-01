'use strict';

const CYCLE_LABEL_MK = { monthly: 'месечна', quarterly: 'квартална', annual: 'годишна' };

const fmtDate = (d) => {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${dt.getFullYear()}`;
};
const fmtMkd = (n) => Number(n || 0).toLocaleString('mk-MK').replace(/\s/g, '.');

function proInvoiceEmail(invoice) {
  const subject = `Профактура бр. ${invoice.number} — Nexa ${invoice.planLabel || ''}`.trim();
  const cycle = CYCLE_LABEL_MK[invoice.cycle] || invoice.cycle;
  const html = `
<!doctype html>
<html lang="mk">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #0B1220; line-height: 1.55; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 10px; font-size: 20px; color: #0B1220;">Вашата профактура е во прилог</h2>
  <p style="font-size: 14px; color: #334155;">
    Ви благодариме за изборот на <strong>${invoice.planLabel || ''}</strong> (${cycle}).
    Во прилог ќе ја најдете профактурата <strong>бр. ${invoice.number}</strong>.
  </p>

  <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
    <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Износ за плаќање:</td>
        <td style="padding: 6px 0; font-size: 14px;"><strong>${fmtMkd(invoice.amounts?.mkd)} ден</strong></td></tr>
    <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Рок на плаќање:</td>
        <td style="padding: 6px 0; font-size: 14px;"><strong>${fmtDate(invoice.dueAt)}</strong> (3 дена од издавање)</td></tr>
  </table>

  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 16px; font-size: 13px; line-height: 1.6;">
    <div style="font-weight: 700; color: #0B1220; margin-bottom: 6px;">Банкарски податоци за уплата</div>
    <div><strong>Банка:</strong> ${invoice.issuer?.bankName || ''}</div>
    <div><strong>Број на сметка:</strong> ${invoice.issuer?.bankAccount || ''}</div>
    <div><strong>Корисник:</strong> ${invoice.issuer?.name || ''}</div>
    <div><strong>Цел на дознака:</strong> Уплата по профактура бр. ${invoice.number}</div>
  </div>

  <p style="font-size: 13px; color: #475569; margin-top: 18px;">
    По уплата, претплатата се активира автоматски, а <strong>оригинална фактура</strong> ќе биде испратена
    по електронска пошта и на адресата на Вашата компанија. Ако имате прашања, одговорете на оваа порака.
  </p>
  <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #E5E7EB; padding-top: 14px;">
    ${invoice.issuer?.vatNote || ''}<br>
    ${invoice.issuer?.name || ''} · ${invoice.issuer?.address || ''} · Даночен бр. ${invoice.issuer?.taxNumber || ''}
  </p>
</body>
</html>`;
  return { subject, html };
}

module.exports = { proInvoiceEmail };
