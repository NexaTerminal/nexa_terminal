'use strict';

/**
 * Drip settings — a single editable document controlling the daily sender.
 *
 * Collection `outreach_drip_settings` holds ONE doc (key:'singleton'):
 *   {
 *     enabled: false,          // master pause/resume — checked every run
 *     basic: { code, templateId, language, perDay },
 *     pro:   { code, templateId, language, perDay },
 *     updatedAt, updatedBy
 *   }
 *
 * `enabled` is the day-to-day pause switch: flip it off and the next (and every)
 * drip run no-ops immediately; flip it on and sending resumes at the next tick.
 * Each bucket names the promo code to send and, optionally, a saved cold-email
 * copy variant (coldEmailTemplateService) to override the default body/subject.
 */

const { ObjectId } = require('mongodb');
const dripConfig = require('../config/dripConfig');

const KEY = 'singleton';
const toIdOrNull = (v) => { try { return v ? new ObjectId(v) : null; } catch { return null; } };
const cleanBucket = (raw) => {
  const b = raw || {}; // default params don't cover null — guard explicitly
  return {
  code: (b.code ? String(b.code).trim().toUpperCase() : '') || null,
  // null/'' = send from ALL lists of this type; else a specific list _id.
  listId: b.listId ? String(b.listId) : null,
  templateId: b.templateId ? String(b.templateId) : null,
  language: b.language === 'en' ? 'en' : 'mk',
  perDay: (() => {
    const n = parseInt(b.perDay, 10);
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 100) : dripConfig.PER_TYPE_PER_DAY;
  })(),
  };
};

class DripSettingsService {
  constructor(database) {
    if (!database) throw new Error('DripSettingsService requires a database');
    this.col = database.collection('outreach_drip_settings');
  }

  async ensureIndexes() {
    await this.col.createIndex({ key: 1 }, { unique: true });
  }

  /** Always returns a well-formed settings object (defaults if never saved). */
  async get() {
    const doc = await this.col.findOne({ key: KEY });
    return {
      enabled: !!(doc && doc.enabled),
      basic: cleanBucket(doc && doc.basic),
      pro: cleanBucket(doc && doc.pro),
      updatedAt: doc?.updatedAt || null,
    };
  }

  /** Merge-update the buckets and/or the enabled flag. */
  async update({ enabled, basic, pro, updatedBy }) {
    const $set = { key: KEY, updatedAt: new Date() };
    if (enabled !== undefined) $set.enabled = !!enabled;
    if (basic !== undefined) $set.basic = cleanBucket(basic);
    if (pro !== undefined) $set.pro = cleanBucket(pro);
    if (updatedBy) $set.updatedBy = toIdOrNull(updatedBy);
    await this.col.updateOne({ key: KEY }, { $set }, { upsert: true });
    return this.get();
  }

  /** Convenience pause/resume used by the admin toggle. */
  async setEnabled(enabled, updatedBy) {
    return this.update({ enabled: !!enabled, updatedBy });
  }
}

module.exports = DripSettingsService;
