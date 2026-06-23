/**
 * Promo / sales codes — a code is "approve without payment, triggered by the
 * user instead of the admin". Each code activates a fixed plan/cycle at €0.
 *
 * Collection `promo_codes`:
 *   { code (UPPERCASE, unique), plan, cycle, maxRedemptions,
 *     redeemedBy: [ObjectId], expiresAt, active, createdBy, createdAt }
 *
 * Abuse controls (all enforced in `claim`):
 *   - single use per user      (redeemedBy contains userId → reject)
 *   - global cap               (redeemedBy.length >= maxRedemptions → reject)
 *   - expiry                   (now > expiresAt → reject)
 *   - active flag              (deactivated codes → reject)
 * The cap + single-use checks run inside one atomic findOneAndUpdate so two
 * concurrent redemptions can never both win the last slot.
 */

const { ObjectId } = require('mongodb');

const toObjectId = (id) => (id instanceof ObjectId ? id : new ObjectId(id));
const normalize  = (code) => String(code || '').trim().toUpperCase();

const claimError = (code, message) => {
  const e = new Error(message);
  e.code = code;
  e.isPromoError = true;
  return e;
};

class PromoCodeService {
  constructor(database) {
    if (!database) throw new Error('PromoCodeService requires a database');
    this.db = database;
    this.col = database.collection('promo_codes');
  }

  async ensureIndexes() {
    await this.col.createIndex({ code: 1 }, { unique: true });
  }

  /** Mint a new code. Defaults to Full Pro (admin_5) monthly = 30 days. */
  async create({ code, plan = 'admin_5', cycle = 'monthly', maxRedemptions, expiresAt, createdBy }) {
    const normalized = normalize(code);
    if (!normalized) throw claimError('INVALID', 'Кодот е задолжителен.');
    if (!/^[A-Z0-9_-]{3,40}$/.test(normalized)) {
      throw claimError('INVALID', 'Кодот смее да содржи само букви, бројки, - и _ (3–40 знаци).');
    }
    const cap = parseInt(maxRedemptions, 10);
    if (!Number.isInteger(cap) || cap < 1) throw claimError('INVALID', 'Границата на искористувања мора да биде ≥ 1.');
    const exp = expiresAt ? new Date(expiresAt) : null;
    if (exp && (isNaN(exp.getTime()) || exp <= new Date())) {
      throw claimError('INVALID', 'Датумот на истекување мора да биде во иднина.');
    }

    const doc = {
      code: normalized,
      plan, cycle,
      maxRedemptions: cap,
      redeemedBy: [],
      expiresAt: exp,
      active: true,
      createdBy: createdBy ? toObjectId(createdBy) : null,
      createdAt: new Date()
    };
    try {
      await this.col.insertOne(doc);
    } catch (e) {
      if (e.code === 11000) throw claimError('DUPLICATE', 'Кодот веќе постои.');
      throw e;
    }
    return doc;
  }

  async list() {
    return this.col.find({}).sort({ createdAt: -1 }).toArray();
  }

  async findByCode(code) {
    return this.col.findOne({ code: normalize(code) });
  }

  async deactivate(code) {
    const r = await this.col.findOneAndUpdate(
      { code: normalize(code) },
      { $set: { active: false } },
      { returnDocument: 'after', includeResultMetadata: true }
    );
    if (!r.value) throw claimError('INVALID', 'Кодот не постои.');
    return r.value;
  }

  /**
   * Atomically claim one slot of `code` for `userId`. Returns the (post-claim)
   * code doc on success; throws a tagged error (`e.isPromoError`) otherwise.
   * The activation itself is done by the caller via SubscriptionService.
   */
  async claim(codeStr, userId) {
    const code = normalize(codeStr);
    const uid = toObjectId(userId);
    const now = new Date();

    // Read first so we can return precise, user-friendly reasons.
    const doc = await this.col.findOne({ code });
    if (!doc) throw claimError('INVALID', 'Кодот не е валиден.');
    if (!doc.active) throw claimError('INACTIVE', 'Кодот е деактивиран.');
    if (doc.expiresAt && new Date(doc.expiresAt) <= now) throw claimError('EXPIRED', 'Кодот е истечен.');
    if ((doc.redeemedBy || []).some((id) => String(id) === String(uid))) {
      throw claimError('ALREADY_USED', 'Веќе сте го искористиле овој код.');
    }
    if ((doc.redeemedBy || []).length >= doc.maxRedemptions) {
      throw claimError('CAP_REACHED', 'Кодот ја достигна границата на искористувања.');
    }

    // Atomic claim: only succeeds if still active, unexpired, user absent, and
    // under cap. Guards against the race on the final slot.
    const r = await this.col.findOneAndUpdate(
      {
        code,
        active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        redeemedBy: { $ne: uid },
        $expr: { $lt: [{ $size: { $ifNull: ['$redeemedBy', []] } }, '$maxRedemptions'] }
      },
      { $push: { redeemedBy: uid } },
      { returnDocument: 'after', includeResultMetadata: true }
    );
    if (!r.value) throw claimError('CAP_REACHED', 'Кодот ја достигна границата на искористувања.');
    return r.value;
  }

  /** Best-effort rollback of a claim (used if activation fails post-claim). */
  async releaseClaim(codeStr, userId) {
    try {
      await this.col.updateOne(
        { code: normalize(codeStr) },
        { $pull: { redeemedBy: toObjectId(userId) } }
      );
    } catch (_) { /* best-effort */ }
  }
}

module.exports = PromoCodeService;
