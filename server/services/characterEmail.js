// Results email for „Проценка на карактер" — sent to the employee/candidate after
// they finish. Renders the ranked, CliftonStrengths-style profile with email-safe
// inline styles + table layout (no <style>, no SVG — survives Gmail/Outlook).
const { DISCLAIMER } = require('../data/characterAssessmentQuestions');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A single ranked item: rank number · colored rule · label pill · score · narrative.
function itemRow(item, rank) {
  const c = item.color || { accent: '#1e4db7', bg: '#eef4ff', text: '#1a365d' };
  return `
  <tr>
    <td width="46" valign="top" style="font-size:26px;font-weight:800;color:#94a3b8;padding:14px 8px 14px 0;text-align:right;font-family:Arial,sans-serif;">${rank}</td>
    <td width="4" style="background:${c.accent};border-radius:2px;">&nbsp;</td>
    <td valign="top" style="padding:12px 0 12px 16px;font-family:Arial,sans-serif;">
      <span style="display:inline-block;background:${c.bg};color:${c.text};font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;padding:3px 9px;border-radius:5px;">${esc(item.label)}</span>
      <span style="font-size:12px;font-weight:700;color:${c.accent};margin-left:8px;">${esc(item.bandLabel)} · ${item.score}</span>
      <p style="margin:8px 0 0;font-size:14.5px;line-height:1.55;color:#334155;">${esc(item.narrative)}</p>
    </td>
  </tr>
  <tr><td colspan="3" style="height:6px;line-height:6px;">&nbsp;</td></tr>`;
}

/**
 * Build the full results email HTML.
 * @param {object} p { ranked, overall, candidateName, companyName, self }
 *   self=true → framed as the respondent's own results ("Вашите резултати").
 */
function resultsEmailHtml({ ranked = [], overall, candidateName, companyName, self = true }) {
  const items = ranked.map((it, i) => itemRow(it, i + 1)).join('');
  const who = companyName ? esc(companyName) : 'работодавач';
  const hello = candidateName ? `Здраво ${esc(candidateName)},` : 'Здраво,';

  return `
  <div style="background:#f1f5f9;padding:24px 0;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#12213f,#1e4db7);padding:22px 26px;">
        <h1 style="margin:0;color:#fff;font-size:19px;font-weight:800;">Вашите резултати · Проценка на карактер</h1>
        <p style="margin:6px 0 0;color:#c7d6f5;font-size:13px;">Модел „Големите пет“ (Big Five)</p>
      </div>

      <div style="padding:24px 26px;">
        <p style="margin:0 0 14px;font-size:14.5px;line-height:1.6;color:#334155;">
          ${hello}<br/>
          Ви благодариме што ја пополнивте проценката${self ? '' : ''} за <strong>${who}</strong>.
          Еве како вашите особини се пројавуваат — подредени од најизразена до најмалку изразена.
        </p>

        ${overall && overall.text ? `
        <div style="background:#f8fafc;border:1px solid #e5e9f2;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
          <p style="margin:0;font-size:13.5px;line-height:1.55;color:#0B1220;"><strong>Кратко:</strong> ${esc(overall.text)}</p>
        </div>` : ''}

        <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0B1220;">Еве како овие особини се пројавуваат:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          ${items}
        </table>

        <p style="margin:20px 0 0;font-size:11.5px;line-height:1.5;color:#94a3b8;border-top:1px dashed #e5e7eb;padding-top:12px;">
          ${esc(DISCLAIMER)}
        </p>
        <p style="margin:12px 0 0;font-size:11.5px;color:#94a3b8;">— Nexa Terminal</p>
      </div>
    </div>
  </div>`;
}

module.exports = { resultsEmailHtml };
