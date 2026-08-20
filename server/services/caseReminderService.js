// Case-deadline reminder engine — daily scan of the cases registry.
//
// evaluateAndSend(now):
//   1. Find LIVE cases (status open|in_progress|waiting) with an upcoming,
//      not-done, remind-enabled deadline inside the reminder horizon.
//   2. For each due offset not yet recorded → collect (tightest fires; wider
//      offsets recorded as satisfied — same rule as hrReminderService).
//   3. Group due items by OWNER and send ONE digest email per owner.
//   4. Record fired + covered offsets in the deadline's remindersSent so re-runs
//      stay idempotent. Email failure records nothing → retried next run.

const { COLLECTION, ACTIVE_STATUSES } = require('./casesService');
const emailTemplates = require('../emails/caseReminderEmails');

const DAY_MS = 86400000;
const OFFSETS = [7, 3, 1]; // days before dueAt
const TYPE_OF = (o) => `deadline-${o}d`;

class CaseReminderService {
  constructor(db, emailService) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this.emailService = emailService;
  }

  /** Tightest applicable offset fires; wider ones recorded as satisfied. */
  dueOffsets(targetDate, now) {
    if (!targetDate) return null;
    const daysLeft = Math.ceil((new Date(targetDate).getTime() - now.getTime()) / DAY_MS);
    if (daysLeft < 0) return null; // past due — reminders no longer fire
    const applicable = OFFSETS.filter((o) => daysLeft <= o);
    if (!applicable.length) return null;
    return { fire: Math.min(...applicable), record: applicable, daysLeft };
  }

  alreadySent(deadline, type) {
    return (deadline.remindersSent || []).some((s) => s.type === type);
  }

  /** Pure: reminders that should fire NOW for one case. */
  dueForCase(kase, now = new Date()) {
    if (!kase || !ACTIVE_STATUSES.includes(kase.status)) return [];
    const out = [];
    for (const d of kase.deadlines || []) {
      if (d.done || d.remind === false || !d.dueAt) continue;
      const due = this.dueOffsets(d.dueAt, now);
      if (!due) continue;
      const type = TYPE_OF(due.fire);
      if (this.alreadySent(d, type)) continue;
      out.push({
        deadline: d,
        type,
        recordTypes: due.record.map(TYPE_OF),
        dueAt: d.dueAt,
        daysLeft: due.daysLeft
      });
    }
    return out;
  }

  async evaluateAndSend(now = new Date()) {
    const horizon = new Date(now.getTime() + Math.max(...OFFSETS) * DAY_MS);
    const cases = await this.col.find({
      status: { $in: ACTIVE_STATUSES },
      deadlines: { $elemMatch: { done: { $ne: true }, remind: { $ne: false }, dueAt: { $ne: null, $lte: horizon } } }
    }).toArray();

    const byOwner = new Map(); // ownerId → [{ kase, item }]
    for (const kase of cases) {
      for (const item of this.dueForCase(kase, now)) {
        const key = String(kase.ownerId);
        if (!byOwner.has(key)) byOwner.set(key, []);
        byOwner.get(key).push({ kase, item });
      }
    }

    let emailsSent = 0;
    for (const [ownerId, entries] of byOwner) {
      const sentOk = await this.sendDigestEmail(ownerId, entries, now);
      if (!sentOk) continue; // nothing recorded → retried next run
      emailsSent += 1;

      for (const { kase, item } of entries) {
        const records = item.recordTypes
          .filter((t) => !this.alreadySent(item.deadline, t))
          .map((t) => ({ type: t, at: now, fired: t === item.type }));
        if (!records.length) continue;
        item.deadline.remindersSent = [...(item.deadline.remindersSent || []), ...records];
        await this.col.updateOne(
          { _id: kase._id, 'deadlines._id': item.deadline._id },
          { $push: { 'deadlines.$.remindersSent': { $each: records } }, $set: { updatedAt: now } }
        );
      }
    }

    return { evaluated: cases.length, emailsSent };
  }

  async sendDigestEmail(ownerId, entries, now) { // eslint-disable-line no-unused-vars
    try {
      const { ObjectId } = require('mongodb');
      const owner = await this.db.collection('users').findOne(
        { _id: new ObjectId(String(ownerId)) },
        { projection: { email: 1, officialEmail: 1, fullName: 1, username: 1 } }
      );
      const to = owner?.officialEmail || owner?.email;
      if (!to || !this.emailService) return false;

      const t = emailTemplates.caseDeadlinesDigest({
        name: owner.fullName || owner.username || '',
        items: entries.map(({ kase, item }) => ({
          caseId: kase._id,
          caseTitle: kase.title,
          caseNumber: kase.caseNumber,
          deadlineTitle: item.deadline.title,
          type: item.deadline.type,
          dueAt: item.dueAt,
          daysLeft: item.daysLeft
        })),
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
      });

      await this.emailService.sendEmail(to, t.subject, t.html);
      return true;
    } catch (e) {
      console.error('[caseReminder] email failed:', e.message);
      return false;
    }
  }
}

module.exports = CaseReminderService;
module.exports.OFFSETS = OFFSETS;
