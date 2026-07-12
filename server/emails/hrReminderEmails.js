// MK email templates for the HR reminder engine (hrReminderService).
// One digest per owner per run: fixed-term contract expiries + probation ends.

const fmt = (d) => new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
const inDays = (n) => (n === 0 ? 'денес' : n === 1 ? 'утре' : `за ${n} дена`);

const hrDeadlinesDigest = ({ name, items, clientUrl }) => {
  const base = clientUrl || 'http://localhost:3000';

  const rows = items.map((i) => {
    const what = i.kind === 'contract'
      ? `Договорот на определено време истекува на <strong>${fmt(i.targetDate)}</strong> (${inDays(i.daysLeft)})`
      : `Пробната работа завршува на <strong>${fmt(i.targetDate)}</strong> (${inDays(i.daysLeft)})`;
    const actions = i.kind === 'contract'
      ? `<div style="margin-top:4px;font-size:13px;">
           <a href="${base}/terminal/documents/employment/employment-annex" style="color:#1e4db7;">Генерирај анекс →</a>
           &nbsp;·&nbsp;
           <a href="${base}/terminal/documents/employment/employment-agreement" style="color:#1e4db7;">Нов договор →</a>
         </div>`
      : '';
    return `
      <li style="margin:0 0 14px;">
        <a href="${base}/terminal/employees/${i.employeeId}" style="color:#0B1220;font-weight:700;text-decoration:none;">${i.fullName}</a><br/>
        <span style="color:#334155;">${what}</span>
        ${actions}
      </li>`;
  }).join('');

  return {
    subject: 'Потсетник: рокови за вработени — Nexa Терминал',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
        <h2 style="color:#1e4db7;">Рокови за вработени</h2>
        <p style="color:#334155;">Здраво ${name || ''}, следниве рокови од Вашиот регистар на вработени наближуваат:</p>
        <ul style="padding-left:18px;list-style:disc;">${rows}</ul>
        <p><a href="${base}/terminal/employees" style="display:inline-block;background:#1e4db7;color:#fff;padding:10px 22px;
           border-radius:8px;text-decoration:none;font-weight:600;">Отвори го регистарот</a></p>
        <p style="font-size:12px;color:#9ca3af;">Nexa Терминал · Вработени — автоматски потсетник.</p>
      </div>`
  };
};

module.exports = { hrDeadlinesDigest };
