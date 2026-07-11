/**
 * Newsletter ad-slot bookings.
 *
 * Each monthly Nexa newsletter (composed and sent externally via Mailjet —
 * there is no newsletter backend in this app) carries 3 banner slots. Any
 * active subscriber (Basic or Pro) may hold 1 active booking per quarter.
 * Booking is first-come-first-served; admin can cancel a booking, which
 * frees the slot and restores the user's quarterly quota.
 *
 * Both invariants are enforced atomically by partial unique indexes that
 * match only status:'active' documents (no counter docs, no transactions):
 *   month_slot_active    { monthKey, slotNumber }  → max 3 slots per month
 *   user_quarter_active  { userId, quarterKey }    → 1 booking per user/quarter
 * Cancelling flips status to 'cancelled', which drops the doc out of both
 * partial indexes — slot and quota free themselves.
 */

const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const COLLECTION = 'newsletter_ad_bookings';
const TIMEZONE = 'Europe/Skopje';
const SLOTS_PER_MONTH = 3;
const QUOTA_PER_QUARTER = 1;
// Bookable window: the current newsletter month plus the next 3.
const WINDOW_MONTHS = 4;

const STATUS = Object.freeze({
  ACTIVE:    'active',
  CANCELLED: 'cancelled'
});

class NewsletterAdsService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this._indexed = false;
  }

  async _ensureIndexes() {
    if (this._indexed) return;
    await this.col.createIndex(
      { monthKey: 1, slotNumber: 1 },
      { unique: true, name: 'month_slot_active', partialFilterExpression: { status: STATUS.ACTIVE } }
    );
    await this.col.createIndex(
      { userId: 1, quarterKey: 1 },
      { unique: true, name: 'user_quarter_active', partialFilterExpression: { status: STATUS.ACTIVE } }
    );
    await this.col.createIndex({ monthKey: 1, status: 1 }, { name: 'month_status' });
    this._indexed = true;
  }

  static toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  // ── month / quarter helpers (Europe/Skopje) ───────────────────────────────

  static nowMonthKey() {
    return moment.tz(TIMEZONE).format('YYYY-MM');
  }

  static allowedMonths() {
    const base = moment.tz(TIMEZONE).startOf('month');
    return Array.from({ length: WINDOW_MONTHS }, (_, i) => base.clone().add(i, 'months').format('YYYY-MM'));
  }

  /** 'YYYY-MM' → 'YYYY-Qn'. Quota is charged to the quarter of the BOOKED month. */
  static quarterKeyOf(monthKey) {
    const [y, m] = String(monthKey).split('-').map(Number);
    return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  }

  static isValidMonthKey(monthKey) {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(monthKey || ''));
  }

  // ── queries ───────────────────────────────────────────────────────────────

  /** Slot availability for the bookable window. */
  async listAvailability() {
    await this._ensureIndexes();
    const months = NewsletterAdsService.allowedMonths();
    const rows = await this.col.aggregate([
      { $match: { monthKey: { $in: months }, status: STATUS.ACTIVE } },
      { $group: { _id: '$monthKey', slotsUsed: { $sum: 1 } } }
    ]).toArray();
    const usedByMonth = Object.fromEntries(rows.map(r => [r._id, r.slotsUsed]));
    return months.map(monthKey => {
      const slotsUsed = usedByMonth[monthKey] || 0;
      return { monthKey, slotsUsed, slotsFree: Math.max(0, SLOTS_PER_MONTH - slotsUsed) };
    });
  }

  /** The member's bookings plus quota status per quarter covered by the window. */
  async listMine(user) {
    await this._ensureIndexes();
    const uid = NewsletterAdsService.toObjectId(user._id);
    if (!uid) return { bookings: [], quota: [] };
    const bookings = await this.col.find({ userId: uid }).sort({ createdAt: -1 }).limit(24).toArray();
    const quarters = [...new Set(NewsletterAdsService.allowedMonths().map(NewsletterAdsService.quarterKeyOf))];
    const quota = quarters.map(quarterKey => ({
      quarterKey,
      used: bookings.filter(b => b.quarterKey === quarterKey && b.status === STATUS.ACTIVE).length,
      max: QUOTA_PER_QUARTER
    }));
    return { bookings, quota };
  }

  // ── booking ───────────────────────────────────────────────────────────────

  /**
   * Book a slot in `monthKey` for `user`. Returns the created booking.
   * Throws: INVALID_MONTH (400), QUOTA_EXCEEDED (409), MONTH_FULL (409).
   * On a non-retryable failure the uploaded image is best-effort unlinked so
   * failed attempts don't leave orphans on disk.
   */
  async book(user, { monthKey, imageUrl, imageFilename, targetUrl, note }) {
    await this._ensureIndexes();
    const uid = NewsletterAdsService.toObjectId(user._id);
    if (!uid) { const e = new Error('Invalid user id'); e.code = 'INVALID_USER'; throw e; }

    const cleanup = () => {
      if (!imageFilename) return;
      fs.unlink(path.join('public/uploads/newsletter-ads', imageFilename), () => {});
    };

    if (!NewsletterAdsService.isValidMonthKey(monthKey) ||
        !NewsletterAdsService.allowedMonths().includes(monthKey)) {
      cleanup();
      const e = new Error('Изберете месец од достапниот период за резервација.');
      e.code = 'INVALID_MONTH';
      throw e;
    }

    const quarterKey = NewsletterAdsService.quarterKeyOf(monthKey);

    // Friendly fast-path; the user_quarter_active index is the real guarantee.
    const usedInQuarter = await this.col.countDocuments({ userId: uid, quarterKey, status: STATUS.ACTIVE });
    if (usedInQuarter >= QUOTA_PER_QUARTER) {
      cleanup();
      const e = new Error(`Веќе имате резервиран банер за овој квартал (${quarterKey}). Дозволен е 1 банер квартално.`);
      e.code = 'QUOTA_EXCEEDED';
      throw e;
    }

    const now = new Date();
    const base = {
      userId: uid,
      companyName: String(user.companyInfo?.companyName || user.fullName || user.username || '').slice(0, 200),
      userEmail: String(user.email || '').slice(0, 240),
      monthKey,
      quarterKey,
      imageUrl,
      imageFilename,
      targetUrl: targetUrl || null,
      note: String(note || '').slice(0, 300),
      status: STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
      cancelledBy: null
    };

    // Try free slots in order; unique-index collisions retry the next slot.
    for (let attempt = 0; attempt < SLOTS_PER_MONTH; attempt++) {
      const taken = await this.col
        .find({ monthKey, status: STATUS.ACTIVE }, { projection: { slotNumber: 1 } })
        .toArray();
      const takenSet = new Set(taken.map(t => t.slotNumber));
      const free = [1, 2, 3].filter(n => !takenSet.has(n));
      if (free.length === 0) {
        cleanup();
        const e = new Error('Сите 3 слотови за овој месец се пополнети. Изберете друг месец.');
        e.code = 'MONTH_FULL';
        throw e;
      }
      const doc = { ...base, _id: new ObjectId(), slotNumber: free[0] };
      try {
        await this.col.insertOne(doc);
        return doc;
      } catch (err) {
        if (err?.code !== 11000) { cleanup(); throw err; }
        if (String(err.message).includes('user_quarter_active')) {
          cleanup();
          const e = new Error(`Веќе имате резервиран банер за овој квартал (${quarterKey}). Дозволен е 1 банер квартално.`);
          e.code = 'QUOTA_EXCEEDED';
          throw e;
        }
        // month_slot_active collision — someone grabbed the slot; loop retries.
      }
    }
    cleanup();
    const e = new Error('Сите 3 слотови за овој месец се пополнети. Изберете друг месец.');
    e.code = 'MONTH_FULL';
    throw e;
  }

  // ── admin ─────────────────────────────────────────────────────────────────

  async adminListByMonth(monthKey) {
    await this._ensureIndexes();
    const filter = NewsletterAdsService.isValidMonthKey(monthKey) ? { monthKey } : {};
    return this.col.find(filter).sort({ status: 1, slotNumber: 1, createdAt: -1 }).limit(200).toArray();
  }

  /** Cancel an active booking. Slot + quota free automatically (partial indexes). */
  async adminCancel(id) {
    await this._ensureIndexes();
    const oid = NewsletterAdsService.toObjectId(id);
    if (!oid) { const e = new Error('Invalid id'); e.code = 'INVALID_ID'; throw e; }
    const doc = await this.col.findOne({ _id: oid });
    if (!doc) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    if (doc.status !== STATUS.ACTIVE) {
      const e = new Error('Booking is not active'); e.code = 'INVALID_TRANSITION'; throw e;
    }
    const now = new Date();
    await this.col.updateOne({ _id: oid }, {
      $set: { status: STATUS.CANCELLED, cancelledAt: now, cancelledBy: 'admin', updatedAt: now }
    });
    return this.col.findOne({ _id: oid });
  }
}

NewsletterAdsService.STATUS = STATUS;
NewsletterAdsService.COLLECTION = COLLECTION;
NewsletterAdsService.SLOTS_PER_MONTH = SLOTS_PER_MONTH;
NewsletterAdsService.QUOTA_PER_QUARTER = QUOTA_PER_QUARTER;

module.exports = NewsletterAdsService;
