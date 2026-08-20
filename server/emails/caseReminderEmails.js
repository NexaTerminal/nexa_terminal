// MK email template for the case-deadline reminder engine (caseReminderService).
// One digest per owner per run: upcoming рокови across all of the lawyer's cases.

const fmt = (d) => new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
const inDays = (n) => (n <= 0 ? 'денес' : n === 1 ? 'утре' : `за ${n} дена`);

const DEADLINE_LABEL = {
  rociste: 'Рочиште', zalba: 'Жалба', podnesok: 'Поднесок',
  zastarenost: 'Застареност', plakanje: 'Плаќање', drugo: 'Рок'
};

const caseDeadlinesDigest = ({ name, items, clientUrl }) => {
  const base = clientUrl || 'http://localhost:3000';

  const rows = items.map((i) => `
    <li style="margin:0 0 14px;">
      <a href="${base}/terminal/cases/${i.caseId}" style="color:#0B1220;font-weight:700;text-decoration:none;">${i.caseTitle}</a>
      ${i.caseNumber ? `<span style="color:#64748b;"> · ${i.caseNumber}</span>` : ''}<br/>
      <span style="color:#334155;">
        ${DEADLINE_LABEL[i.type] || 'Рок'}: <strong>${i.deadlineTitle}</strong> —
        ${fmt(i.dueAt)} (<strong>${inDays(i.daysLeft)}</strong>)
      </span>
    </li>`).join('');

  return {
    subject: 'Потсетник: рокови по предмети — Nexa Терминал',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
        <h2 style="color:#1e4db7;">Рокови по предмети</h2>
        <p style="color:#334155;">Здраво ${name || ''}, следниве рокови од Вашите предмети наближуваат:</p>
        <ul style="padding-left:18px;list-style:disc;">${rows}</ul>
        <p><a href="${base}/terminal/cases" style="display:inline-block;background:#1e4db7;color:#fff;padding:10px 22px;
           border-radius:8px;text-decoration:none;font-weight:600;">Отвори ги предметите</a></p>
        <p style="font-size:12px;color:#9ca3af;">Nexa Терминал · Предмети — автоматски потсетник.</p>
      </div>`
  };
};

module.exports = { caseDeadlinesDigest };
