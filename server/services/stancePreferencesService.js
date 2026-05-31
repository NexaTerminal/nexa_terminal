/**
 * Stance Preferences service.
 *
 * Persists the user's NexaAI stance preferences (one document per user in the
 * `user_stance_preferences` collection) and builds the structured system-prompt
 * prefix that the NexaAI services inject above their base prompts.
 *
 * Available to all tiers including trial — this is a core AI tool, not a
 * Network-tier benefit.
 */

const { ObjectId } = require('mongodb');

const COLLECTION = 'user_stance_preferences';
const FREE_NOTE_MAX = 300;

const ENUMS = Object.freeze({
  riskPosture:        ['conservative', 'balanced', 'opportunistic'],
  contractRelation:   ['long_term',    'balanced', 'easy_exit'],
  detailLevel:        ['detailed',     'balanced', 'general'],
  commercialPriority: ['commercial',   'balanced', 'relationship'],
  reviewTone:         ['cautious',     'pragmatic']
});

const EMPTY = Object.freeze({
  riskPosture:        null,
  contractRelation:   null,
  detailLevel:        null,
  commercialPriority: null,
  reviewTone:         null,
  freeNote:           '',
  updatedAt:          null
});

class StancePreferencesService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this._indexed = false;
  }

  async _ensureIndex() {
    if (this._indexed) return;
    await this.col.createIndex({ userId: 1 }, { unique: true });
    this._indexed = true;
  }

  static toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  /** Fetch the user's preferences or a fully-null skeleton. */
  async get(userId) {
    await this._ensureIndex();
    const uid = StancePreferencesService.toObjectId(userId);
    if (!uid) return { ...EMPTY };
    const doc = await this.col.findOne({ userId: uid });
    if (!doc) return { ...EMPTY };
    return {
      riskPosture:        doc.riskPosture        ?? null,
      contractRelation:   doc.contractRelation   ?? null,
      detailLevel:        doc.detailLevel        ?? null,
      commercialPriority: doc.commercialPriority ?? null,
      reviewTone:         doc.reviewTone         ?? null,
      freeNote:           doc.freeNote           ?? '',
      updatedAt:          doc.updatedAt          ?? null
    };
  }

  /** Validate + upsert. Throws { code, message } on validation failure. */
  async upsert(userId, input) {
    await this._ensureIndex();
    const uid = StancePreferencesService.toObjectId(userId);
    if (!uid) {
      const err = new Error('Invalid user id');
      err.code = 'INVALID_USER';
      throw err;
    }
    const clean = StancePreferencesService.validate(input);
    const now = new Date();
    await this.col.updateOne(
      { userId: uid },
      { $set: { ...clean, userId: uid, updatedAt: now } },
      { upsert: true }
    );
    return { ...clean, updatedAt: now };
  }

  /** Throws on invalid input; returns the normalized payload otherwise. */
  static validate(input) {
    const out = {
      riskPosture:        null,
      contractRelation:   null,
      detailLevel:        null,
      commercialPriority: null,
      reviewTone:         null,
      freeNote:           ''
    };
    const checkEnum = (key, val) => {
      if (val === null || val === undefined || val === '') return null;
      if (!ENUMS[key].includes(val)) {
        const err = new Error(`Invalid value for ${key}: ${val}`);
        err.code = 'INVALID_ENUM';
        throw err;
      }
      return val;
    };
    out.riskPosture        = checkEnum('riskPosture',        input?.riskPosture);
    out.contractRelation   = checkEnum('contractRelation',   input?.contractRelation);
    out.detailLevel        = checkEnum('detailLevel',        input?.detailLevel);
    out.commercialPriority = checkEnum('commercialPriority', input?.commercialPriority);
    out.reviewTone         = checkEnum('reviewTone',         input?.reviewTone);
    const note = typeof input?.freeNote === 'string' ? input.freeNote.trim() : '';
    if (note.length > FREE_NOTE_MAX) {
      const err = new Error(`freeNote exceeds ${FREE_NOTE_MAX} characters`);
      err.code = 'FREENOTE_TOO_LONG';
      throw err;
    }
    out.freeNote = note;
    return out;
  }

  /** Pure builder. Returns '' when no preference is set. */
  static buildPrefix(prefs) {
    if (!prefs) return '';
    const lines = [];
    const map = {
      riskPosture:        'Risk posture',
      contractRelation:   'Contract relationship preference',
      detailLevel:        'Preferred level of detail',
      commercialPriority: 'When tradeoffs arise',
      reviewTone:         'Review tone'
    };
    const valueHints = {
      contractRelation:   { long_term: 'long-term', balanced: 'balanced', easy_exit: 'easy exit' },
      commercialPriority: { commercial: 'prioritize commercial protection',
                            balanced:   'balance commercial and relational concerns',
                            relationship: 'prioritize relationship preservation' }
    };
    for (const key of Object.keys(map)) {
      const raw = prefs[key];
      if (!raw) continue;
      const pretty = (valueHints[key] && valueHints[key][raw]) || raw.replace(/_/g, ' ');
      lines.push(`- ${map[key]}: ${pretty}`);
    }
    if (prefs.freeNote && prefs.freeNote.trim().length > 0) {
      lines.push(`- Additional note: "${prefs.freeNote.trim().replace(/"/g, '\\"')}"`);
    }
    if (lines.length === 0) return '';
    return [
      '[User stance preferences]',
      ...lines,
      '',
      'Apply these preferences to your response style, level of detail, and the way you frame tradeoffs. Do not mention these preferences explicitly to the user.',
      '[End user stance preferences]',
      ''
    ].join('\n');
  }

  /** Fetch + build in one call. Returns '' for users with no preferences. */
  async getPrefix(userId) {
    try {
      const prefs = await this.get(userId);
      return StancePreferencesService.buildPrefix(prefs);
    } catch (e) {
      // Defensive: stance prefix is optional, never block an AI call on a DB hiccup.
      console.warn('[stancePreferences] getPrefix error:', e.message);
      return '';
    }
  }

  /** Wrap a base prompt string. */
  async withStancePrefix(userId, basePrompt) {
    const prefix = await this.getPrefix(userId);
    if (!prefix) return basePrompt;
    return prefix + basePrompt;
  }
}

StancePreferencesService.COLLECTION = COLLECTION;
StancePreferencesService.FREE_NOTE_MAX = FREE_NOTE_MAX;
StancePreferencesService.ENUMS = ENUMS;
StancePreferencesService.EMPTY = EMPTY;

module.exports = StancePreferencesService;
