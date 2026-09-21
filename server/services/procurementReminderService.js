// Renewal-reminder engine for „Регистар на набавки".
//
// evaluateAndSend(now):
//   Find active register items whose renewalDate is within reminderDaysBefore
//   (or just past) and that haven't been reminded for the CURRENT renewal cycle
//   (remindedAt is null). Email the owner a "time to re-quote" nudge and stamp
//   remindedAt. Changing renewalDate resets remindedAt (see controller.update),
//   so each renewal cycle fires at most one reminder — safe across restarts.

const { ObjectId } = require('mongodb');

const COLLECTION = 'procurement_register';
const DAY_MS = 86400000;
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CLIENT = () => (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

class ProcurementReminderService {
  constructor(db, emailService) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this.users = db.collection('users');
    this.emailService = emailService;
  }

  fmt(d) {
    const x = new Date(d);
    return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
  }

  async ownerEmail(ownerId) {
    try {
      const u = await this.users.findOne(
        { _id: new ObjectId(String(ownerId)) },
        { projection: { email: 1, 'companyInfo.companyName': 1 } }
      );
      return u ? { email: u.email, companyName: u.companyInfo?.companyName || '' } : null;
    } catch { return null; }
  }

  emailHtml(item, daysLeft) {
    const link = `${CLIENT()}/terminal/nabavki`;
    const sourcing = `${CLIENT()}/terminal/sourcing`;
    const when = daysLeft >= 0 ? `за ${daysLeft} ${daysLeft === 1 ? 'ден' : 'дена'}` : 'помина';
    return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0B1220;">
      <h2 style="color:#1e4db7;margin:0 0 12px;">Наближува обнова на набавка</h2>
      <p style="font-size:15px;line-height:1.6;color:#334155;">
        Датумот за обнова на <strong>${esc(item.title)}</strong> (${esc(item.category)}) ${when}
        — <strong>${this.fmt(item.renewalDate)}</strong>. Сега е добро време да побарате нови понуди
        и да проверите дали може подобра цена.
      </p>
      <p style="margin:22px 0;">
        <a href="${sourcing}" style="display:inline-block;background:#1e4db7;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9px;font-weight:600;">Побарај нови понуди</a>
        <a href="${link}" style="display:inline-block;margin-left:10px;color:#1e4db7;text-decoration:none;padding:12px 6px;font-weight:600;">Отвори регистар</a>
      </p>
      <p style="font-size:11.5px;color:#94a3b8;">— Nexa Terminal · Регистар на набавки</p>
    </div>`;
  }

  async evaluateAndSend(now = new Date()) {
    let evaluated = 0;
    let emailsSent = 0;
    const candidates = await this.col.find({
      status: 'active',
      renewalDate: { $ne: null },
      remindedAt: null,
    }).toArray();

    for (const item of candidates) {
      evaluated += 1;
      const daysLeft = Math.ceil((new Date(item.renewalDate).getTime() - now.getTime()) / DAY_MS);
      const window = item.reminderDaysBefore ?? 30;
      // Fire once the renewal is within the reminder window (or already past).
      if (daysLeft > window) continue;
      const owner = await this.ownerEmail(item.ownerId);
      if (owner?.email) {
        try {
          await this.emailService.sendEmail(owner.email, `Обнова на набавка: ${item.title}`, this.emailHtml(item, daysLeft));
          emailsSent += 1;
        } catch (e) {
          console.error('[procurementReminder] email failed:', e.message);
          continue; // leave remindedAt null → retry next run
        }
      }
      await this.col.updateOne({ _id: item._id }, { $set: { remindedAt: now } });
    }
    return { evaluated, emailsSent };
  }
}

module.exports = ProcurementReminderService;
