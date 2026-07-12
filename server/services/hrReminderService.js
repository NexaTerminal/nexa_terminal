// HR reminder engine — daily scan of the employee registry.
//
// evaluateAndSend(now):
//   1. Find ACTIVE employees whose fixed-term contract end (определено) or
//      probation end falls inside the reminder horizon.
//   2. For each due reminder type not yet in remindersSent → collect.
//   3. Group due items by OWNER (userId) and send ONE digest email per owner.
//   4. On successful send, record the fired type AND every wider window it
//      covers (same "tightest fires, wider recorded" rule as
//      contractReminderService.dueOffsets) — re-runs stay idempotent.
//
// Email failure records nothing, so the reminder retries on the next run.

const { COLLECTION } = require('./employeeService');
const emailTemplates = require('../emails/hrReminderEmails');

const DAY_MS = 86400000;

const CONTRACT_OFFSETS = [30, 7];  // days before contractEndsAt
const PROBATION_OFFSETS = [7];     // days before probationEndsAt

const TYPE_OF = { contract: (o) => `contract-${o}d`, probation: (o) => `probation-${o}d` };

class HrReminderService {
  constructor(db, emailService) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this.emailService = emailService;
  }

  /**
   * Tightest applicable offset fires; wider ones are recorded as satisfied.
   * Returns { fire, record } (offsets in days) or null.
   */
  dueOffsets(targetDate, offsets, now) {
    if (!targetDate) return null;
    const daysLeft = Math.ceil((new Date(targetDate).getTime() - now.getTime()) / DAY_MS);
    if (daysLeft < 0) return null; // past due — nothing to warn about anymore
    const applicable = offsets.filter((o) => daysLeft <= o);
    if (!applicable.length) return null;
    return { fire: Math.min(...applicable), record: applicable, daysLeft };
  }

  alreadySent(employee, type) {
    return (employee.remindersSent || []).some((s) => s.type === type);
  }

  /**
   * Pure: the reminders that should fire NOW for one employee.
   * Returns [{ kind, type, recordTypes, targetDate, daysLeft }].
   */
  dueReminders(employee, now = new Date()) {
    if (!employee || employee.status !== 'active') return [];
    const due = [];

    if (employee.employmentType === 'определено' && employee.contractEndsAt) {
      const d = this.dueOffsets(employee.contractEndsAt, CONTRACT_OFFSETS, now);
      if (d && !this.alreadySent(employee, TYPE_OF.contract(d.fire))) {
        due.push({
          kind: 'contract',
          type: TYPE_OF.contract(d.fire),
          recordTypes: d.record.map(TYPE_OF.contract),
          targetDate: employee.contractEndsAt,
          daysLeft: d.daysLeft
        });
      }
    }

    if (employee.probationEndsAt) {
      const d = this.dueOffsets(employee.probationEndsAt, PROBATION_OFFSETS, now);
      if (d && !this.alreadySent(employee, TYPE_OF.probation(d.fire))) {
        due.push({
          kind: 'probation',
          type: TYPE_OF.probation(d.fire),
          recordTypes: d.record.map(TYPE_OF.probation),
          targetDate: employee.probationEndsAt,
          daysLeft: d.daysLeft
        });
      }
    }

    return due;
  }

  async evaluateAndSend(now = new Date()) {
    const contractHorizon = new Date(now.getTime() + Math.max(...CONTRACT_OFFSETS) * DAY_MS);
    const probationHorizon = new Date(now.getTime() + Math.max(...PROBATION_OFFSETS) * DAY_MS);

    const employees = await this.col.find({
      status: 'active',
      $or: [
        { contractEndsAt: { $ne: null, $lte: contractHorizon } },
        { probationEndsAt: { $ne: null, $lte: probationHorizon } }
      ]
    }).toArray();

    // Collect due items grouped by owner — one digest email per owner per run.
    const byOwner = new Map(); // ownerId → [{ employee, item }]
    for (const employee of employees) {
      for (const item of this.dueReminders(employee, now)) {
        const key = String(employee.userId);
        if (!byOwner.has(key)) byOwner.set(key, []);
        byOwner.get(key).push({ employee, item });
      }
    }

    let emailsSent = 0;
    for (const [ownerId, entries] of byOwner) {
      const sentOk = await this.sendDigestEmail(ownerId, entries, now);
      if (!sentOk) continue; // nothing recorded → retried next run
      emailsSent += 1;

      for (const { employee, item } of entries) {
        const records = item.recordTypes
          .filter((t) => !this.alreadySent(employee, t))
          .map((t) => ({ type: t, at: now, fired: t === item.type }));
        if (!records.length) continue;
        // Keep the in-memory doc in sync in case one employee has several items.
        employee.remindersSent = [...(employee.remindersSent || []), ...records];
        await this.col.updateOne(
          { _id: employee._id },
          { $push: { remindersSent: { $each: records } }, $set: { updatedAt: now } }
        );
      }
    }

    return { evaluated: employees.length, emailsSent };
  }

  async sendDigestEmail(ownerId, entries, now) {
    try {
      const { ObjectId } = require('mongodb');
      const owner = await this.db.collection('users').findOne(
        { _id: new ObjectId(String(ownerId)) },
        { projection: { email: 1, officialEmail: 1, fullName: 1, username: 1 } }
      );
      const to = owner?.email || owner?.officialEmail;
      if (!to || !this.emailService) return false;

      const t = emailTemplates.hrDeadlinesDigest({
        name: owner.fullName || owner.username || '',
        items: entries.map(({ employee, item }) => ({
          employeeId: employee._id,
          fullName: employee.fullName,
          kind: item.kind,
          targetDate: item.targetDate,
          daysLeft: item.daysLeft
        })),
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
      });

      await this.emailService.sendEmail(to, t.subject, t.html);
      return true;
    } catch (e) {
      console.error('[hrReminder] email failed:', e.message);
      return false;
    }
  }
}

module.exports = HrReminderService;
module.exports.CONTRACT_OFFSETS = CONTRACT_OFFSETS;
module.exports.PROBATION_OFFSETS = PROBATION_OFFSETS;
