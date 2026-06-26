/**
 * Invited prospects — the ledger of "cold contact" recipients we have emailed a
 * promo invite to. One row per email, so we never invite the same address twice
 * (unless it has been archived/deleted, which frees it for a fresh invite while
 * keeping its historical stats).
 *
 * Collection `invited_prospects`:
 *   { email (lowercased, unique), code, plan, language, subject,
 *     status ('sent' | 'failed'),
 *     invitedCount, firstInvitedAt, lastInvitedAt,
 *     clicks, firstClickedAt, lastClickedAt,
 *     deleted (bool — archived; excluded from dedup + active list, stats kept),
 *     invitedBy (ObjectId|null) }
 */

const { ObjectId } = require('mongodb');

const toObjectId = (id) => {
  if (!id) return null;
  return id instanceof ObjectId ? id : new ObjectId(id);
};
const isValidId = (id) => {
  try { toObjectId(id); return true; } catch { return false; }
};
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

class InvitedProspectsService {
  constructor(database) {
    if (!database) throw new Error('InvitedProspectsService requires a database');
    this.db = database;
    this.col = database.collection('invited_prospects');
  }

  async ensureIndexes() {
    await this.col.createIndex({ email: 1 }, { unique: true });
    await this.col.createIndex({ lastInvitedAt: -1 });
  }

  /**
   * Of the given emails, return the set (lowercased) that still actively blocks
   * a re-invite. Archived (deleted) rows do NOT block — they can be invited again.
   */
  async findExisting(emails) {
    const normalized = (emails || []).map(normalizeEmail).filter(Boolean);
    if (normalized.length === 0) return new Set();
    const rows = await this.col
      .find({ email: { $in: normalized }, deleted: { $ne: true } }, { projection: { email: 1 } })
      .toArray();
    return new Set(rows.map((r) => r.email));
  }

  /**
   * Record an invite (upsert keyed on email). Increments the invite counter,
   * un-archives the row, and refreshes the "last invite" metadata. Returns the
   * post-write document (so the caller can build a per-prospect tracking link).
   */
  async record({ email, code, plan, language, subject, status = 'sent', invitedBy }) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    const now = new Date();
    const r = await this.col.findOneAndUpdate(
      { email: normalized },
      {
        $set: {
          code, plan, language, subject, status,
          invitedBy: toObjectId(invitedBy),
          lastInvitedAt: now,
          deleted: false
        },
        $inc: { invitedCount: 1 },
        $setOnInsert: { email: normalized, firstInvitedAt: now, clicks: 0 }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return r.value || (await this.col.findOne({ email: normalized }));
  }

  /** Update just the send status of an already-recorded prospect. */
  async setStatus(id, status) {
    if (!isValidId(id)) return;
    await this.col.updateOne({ _id: toObjectId(id) }, { $set: { status } });
  }

  /** Record a click on the invite link (prospect opened the redeem page). */
  async recordClick(id) {
    if (!isValidId(id)) return null;
    const now = new Date();
    const r = await this.col.findOneAndUpdate(
      { _id: toObjectId(id) },
      { $inc: { clicks: 1 }, $set: { lastClickedAt: now }, $min: { firstClickedAt: now } },
      { returnDocument: 'after' }
    );
    return r.value || null;
  }

  /** Archive a prospect: keeps its stats but frees the email for a new invite. */
  async softDelete(id) {
    if (!isValidId(id)) return null;
    const r = await this.col.findOneAndUpdate(
      { _id: toObjectId(id) },
      { $set: { deleted: true, deletedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return r.value || null;
  }

  /** All rows (active + archived), newest invite first. */
  async list() {
    return this.col.find({}).sort({ lastInvitedAt: -1 }).toArray();
  }

  /** Funnel summary across every prospect ever invited. */
  async stats() {
    const [agg] = await this.col.aggregate([
      {
        $group: {
          _id: null,
          invited: { $sum: 1 },
          clicked: { $sum: { $cond: [{ $gt: ['$clicks', 0] }, 1, 0] } },
          active: { $sum: { $cond: [{ $ne: ['$deleted', true] }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ['$deleted', true] }, 1, 0] } }
        }
      }
    ]).toArray();
    return agg || { invited: 0, clicked: 0, active: 0, archived: 0 };
  }
}

module.exports = InvitedProspectsService;
