// Contract reminder engine (tasks/cms-v1-plan.md §4 / M4).
//
// evaluateAndSend(now):
//   1. Find live contracts whose expiry or a pending obligation falls inside
//      the largest reminder offset.
//   2. For each due offset not yet in reminders.sent → email the owner.
//   3. recomputeStatus → persist active→expiring→expired transitions.
//
// Idempotency: reminders.sent[] records {kind, obligationId, offsetDays};
// an offset fires at most once per item, so re-runs/restarts are safe.
// Channel: email only — the in-app notifications route is an in-memory Map
// (not durable), so the dashboard widget queries contracts directly instead.

const { DEFAULT_REMIND_OFFSETS, COLLECTION } = require('./contractService');

const DAY_MS = 86400000;

class ContractReminderService {
  constructor(db, contractService, emailService) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this.contractService = contractService;
    this.emailService = emailService;
  }

  /**
   * The reminder that should fire NOW for a target date, if any.
   * When a date sits inside several offset windows (5 days out is inside both
   * the 30- and the 7-day window), only the TIGHTEST applicable offset fires,
   * and all wider ones are recorded as satisfied — so a contract created late
   * gets one reminder, not a backlog, and re-runs stay idempotent.
   * Returns { fire, record } or null.
   */
  dueOffsets(targetDate, offsets, now) {
    if (!targetDate) return null;
    const daysLeft = Math.ceil((new Date(targetDate).getTime() - now.getTime()) / DAY_MS);
    if (daysLeft < 0) return null; // past due — status transition handles it
    const applicable = offsets.filter((o) => daysLeft <= o);
    if (!applicable.length) return null;
    return { fire: Math.min(...applicable), record: applicable };
  }

  alreadySent(contract, kind, obligationId, offsetDays) {
    return (contract.reminders?.sent || []).some((s) =>
      s.kind === kind &&
      String(s.obligationId || '') === String(obligationId || '') &&
      s.offsetDays === offsetDays
    );
  }

  async evaluateAndSend(now = new Date()) {
    const horizon = new Date(now.getTime() + Math.max(...DEFAULT_REMIND_OFFSETS) * DAY_MS);
    const contracts = await this.col.find({
      status: { $nin: ['terminated', 'renewed', 'draft'] },
      $or: [
        { 'dates.expiresAt': { $ne: null, $lte: horizon } },
        { obligations: { $elemMatch: { status: 'pending', dueAt: { $ne: null, $lte: horizon } } } }
      ]
    }).toArray();

    let emailsSent = 0;
    for (const contract of contracts) {
      const dueItems = [];

      // Contract expiry (+ notice deadline folded into the expiry email).
      if (contract.dates?.expiresAt) {
        const due = this.dueOffsets(contract.dates.expiresAt, DEFAULT_REMIND_OFFSETS, now);
        if (due && !this.alreadySent(contract, 'expiry', null, due.fire)) {
          dueItems.push({ kind: 'expiry', obligationId: null,
            offsetDays: due.fire, recordOffsets: due.record,
            label: 'Истек на договорот', dueAt: contract.dates.expiresAt });
        }
      }

      // Pending obligations.
      for (const o of contract.obligations || []) {
        if (o.status !== 'pending' || !o.dueAt) continue;
        const offsets = o.remindDaysBefore?.length ? o.remindDaysBefore : DEFAULT_REMIND_OFFSETS;
        const due = this.dueOffsets(o.dueAt, offsets, now);
        if (due && !this.alreadySent(contract, 'obligation', o._id, due.fire)) {
          dueItems.push({ kind: 'obligation', obligationId: o._id,
            offsetDays: due.fire, recordOffsets: due.record,
            label: o.label, dueAt: o.dueAt });
        }
      }

      // Status transition (active → expiring → expired).
      const before = contract.status;
      this.contractService.recomputeStatus(contract, now);
      const statusChanged = contract.status !== before;

      if (!dueItems.length && !statusChanged) continue;

      if (dueItems.length) {
        const sentOk = await this.sendReminderEmail(contract, dueItems, now);
        if (sentOk) {
          emailsSent += 1;
          dueItems.forEach((d) => {
            contract.reminders = contract.reminders || { sent: [] };
            contract.reminders.sent = contract.reminders.sent || [];
            // Record the fired offset AND every wider window it covers.
            (d.recordOffsets || [d.offsetDays]).forEach((off) => {
              if (!this.alreadySent(contract, d.kind, d.obligationId, off)) {
                contract.reminders.sent.push({
                  kind: d.kind, obligationId: d.obligationId, offsetDays: off,
                  sentAt: now, channels: ['email'],
                  fired: off === d.offsetDays // wider windows are marked satisfied, not sent
                });
              }
            });
          });
        }
      }

      await this.col.updateOne({ _id: contract._id }, {
        $set: {
          status: contract.status,
          'reminders.sent': contract.reminders?.sent || [],
          'reminders.lastEvaluatedAt': now,
          updatedAt: now
        }
      });
    }

    return { evaluated: contracts.length, emailsSent };
  }

  async sendReminderEmail(contract, dueItems, now) {
    try {
      const user = await this.db.collection('users').findOne(
        { _id: contract.userId },
        { projection: { email: 1, officialEmail: 1 } }
      );
      const to = user?.email || user?.officialEmail;
      if (!to || !this.emailService) return false;

      const fmt = (d) => new Date(d).toLocaleDateString('mk-MK', { year: 'numeric', month: 'long', day: 'numeric' });
      const rows = dueItems.map((d) => {
        const days = Math.max(0, Math.ceil((new Date(d.dueAt) - now) / DAY_MS));
        return `<li style="margin:0 0 8px;"><strong>${d.label}</strong> — ${fmt(d.dueAt)}
          (${days === 0 ? 'денес' : days === 1 ? 'утре' : `за ${days} дена`})</li>`;
      }).join('');

      const url = `${process.env.CLIENT_URL || 'http://localhost:3000'}/terminal/contracts/${contract._id}`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
          <h2 style="color:#1e4db7;">Потсетник: ${contract.title}</h2>
          ${contract.counterparty?.name ? `<p style="color:#6b7280;margin:0 0 14px;">Другa страна: ${contract.counterparty.name}</p>` : ''}
          <ul style="padding-left:18px;">${rows}</ul>
          <p><a href="${url}" style="display:inline-block;background:#1e4db7;color:#fff;padding:10px 22px;
             border-radius:8px;text-decoration:none;font-weight:600;">Отвори го договорот</a></p>
          <p style="font-size:12px;color:#9ca3af;">Nexa Терминал · Договори — автоматски потсетник.</p>
        </div>`;

      await this.emailService.sendEmail(to, `Потсетник: ${contract.title} — рок наближува`, html);
      return true;
    } catch (err) {
      console.error('[contractReminder] email failed:', err.message);
      return false; // don't record sent — retried next run
    }
  }
}

module.exports = ContractReminderService;
