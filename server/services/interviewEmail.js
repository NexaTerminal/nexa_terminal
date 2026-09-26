// Emails for „Интервјуа": the respondent INVITE (candidate/employee) and the
// owner RESULTS notification (transcript + optional AI summary). Email-safe inline
// styles + table layout (no <style>, no SVG) so they survive Gmail/Outlook.

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TYPE_LABEL = { scan: 'Интервју', exit: 'Излезно интервју' };
const DISCLAIMER = 'Одговорите се доверливи и служат само за интерна проценка. — Nexa Terminal';

// ── Invite sent to the candidate / departing employee ────────────────────────
function inviteEmailHtml({ type, companyName, subjectName, link, count }) {
  const who = companyName ? esc(companyName) : 'работодавач';
  const isExit = type === 'exit';
  const title = isExit ? 'Покана за излезно интервју' : 'Покана за интервју';
  const intro = isExit
    ? `<strong>${who}</strong> Ве замолува да пополните кратко излезно интервју. Вашите искрени одговори ни помагаат да се подобриме — нема точни или погрешни одговори.`
    : `<strong>${who}</strong> Ве покани да одговорите на неколку кратки прашања пред разговорот. Одговарајте искрено и со свои зборови.`;
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0B1220;">
    <h2 style="color:#1e4db7;margin:0 0 12px;">${title}</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155;">
      Здраво${subjectName ? ' ' + esc(subjectName) : ''},<br/><br/>
      ${intro}<br/><br/>
      Прашалникот има ${count || 'неколку'} прашања и трае околу 5–10 минути.
    </p>
    <p style="text-align:center;margin:26px 0;">
      <a href="${link}" style="display:inline-block;background:#1e4db7;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
        Започни
      </a>
    </p>
    <p style="font-size:12.5px;color:#64748b;line-height:1.5;">
      Ако копчето не работи, копирајте го линкот: <br/>
      <a href="${link}" style="color:#1e4db7;">${esc(link)}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0;" />
    <p style="font-size:11.5px;color:#94a3b8;line-height:1.5;">${DISCLAIMER}</p>
  </div>`;
}

function ratingBar(v) {
  const n = Math.max(0, Math.min(5, Number(v) || 0));
  const dots = Array.from({ length: 5 }, (_, i) =>
    `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:3px;background:${i < n ? '#1e4db7' : '#dbe3f1'};"></span>`
  ).join('');
  return `${dots} <span style="font-size:12px;color:#1e4db7;font-weight:700;margin-left:4px;">${n}/5</span>`;
}

function qaRows(questions = [], answers = {}) {
  return questions.map((q, i) => {
    const a = answers[q.id];
    const body = q.kind === 'rating'
      ? ratingBar(a)
      : `<span style="font-size:14px;line-height:1.55;color:#334155;">${esc(a) || '<em style="color:#94a3b8;">(без одговор)</em>'}</span>`;
    return `
    <tr><td style="padding:12px 0 4px;font-size:13.5px;font-weight:700;color:#0B1220;font-family:Arial,sans-serif;">${i + 1}. ${esc(q.text)}</td></tr>
    <tr><td style="padding:0 0 10px;border-bottom:1px solid #eef2f7;">${body}</td></tr>`;
  }).join('');
}

function summaryBlock(aiSummary) {
  if (!aiSummary || !aiSummary.text) return '';
  let s = {};
  try { s = JSON.parse(aiSummary.text); } catch { s = {}; }
  const list = (arr) => (Array.isArray(arr) && arr.length)
    ? `<ul style="margin:4px 0 0;padding-left:18px;">${arr.map((x) => `<li style="font-size:13px;line-height:1.5;color:#334155;">${esc(x)}</li>`).join('')}</ul>`
    : '';
  const groups = [
    s.strengths?.length ? `<p style="margin:10px 0 0;font-size:12.5px;font-weight:800;color:#0B1220;">Силни страни</p>${list(s.strengths)}` : '',
    s.watchouts?.length ? `<p style="margin:10px 0 0;font-size:12.5px;font-weight:800;color:#0B1220;">За проверка</p>${list(s.watchouts)}` : '',
    s.themes?.length ? `<p style="margin:10px 0 0;font-size:12.5px;font-weight:800;color:#0B1220;">Теми</p>${list(s.themes)}` : '',
    s.actions?.length ? `<p style="margin:10px 0 0;font-size:12.5px;font-weight:800;color:#0B1220;">Предлози</p>${list(s.actions)}` : '',
  ].join('');
  return `
  <div style="background:#f8fafc;border:1px solid #e5e9f2;border-radius:10px;padding:14px 16px;margin:0 0 18px;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#1e4db7;">AI резиме</p>
    ${s.summary ? `<p style="margin:0;font-size:13.5px;line-height:1.55;color:#0B1220;">${esc(s.summary)}</p>` : ''}
    ${groups}
  </div>`;
}

/**
 * Results email to the OWNER once the respondent finishes.
 * @param {object} p { type, subjectName, role, companyName, questions, answers, aiSummary, link }
 */
function ownerResultsHtml({ type, subjectName, role, companyName, questions = [], answers = {}, aiSummary, link }) {
  const label = TYPE_LABEL[type] || 'Интервју';
  const subtitle = [esc(subjectName), role ? esc(role) : ''].filter(Boolean).join(' · ');
  return `
  <div style="background:#f1f5f9;padding:24px 0;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#12213f,#1e4db7);padding:22px 26px;">
        <h1 style="margin:0;color:#fff;font-size:19px;font-weight:800;">${label} · пополнето</h1>
        ${subtitle ? `<p style="margin:6px 0 0;color:#c7d6f5;font-size:13px;">${subtitle}</p>` : ''}
      </div>
      <div style="padding:24px 26px;">
        ${summaryBlock(aiSummary)}
        <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0B1220;">Одговори</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">${qaRows(questions, answers)}</table>
        ${link ? `<p style="margin:20px 0 0;font-size:13px;">Отворете во Nexa: <a href="${link}" style="color:#1e4db7;">${esc(link)}</a></p>` : ''}
        <p style="margin:16px 0 0;font-size:11.5px;line-height:1.5;color:#94a3b8;border-top:1px dashed #e5e7eb;padding-top:12px;">${DISCLAIMER}</p>
      </div>
    </div>
  </div>`;
}

module.exports = { inviteEmailHtml, ownerResultsHtml, DISCLAIMER };
