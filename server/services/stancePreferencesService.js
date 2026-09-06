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

/**
 * Personas = one-click presets the user picks in the AI chat. Each carries:
 *  - label:     MK display name (shown on the chat chip)
 *  - blurb:     one-line description (shown in the picker)
 *  - preset:    stance-dimension values applied on selection (so the existing
 *               buildPrefix bullets stay coherent with the chosen voice)
 *  - character: the VOICE instruction injected into the prompt — this is what
 *               gives each persona its distinct tone and answer intro.
 * The base "practical protective lawyer" behavior lives in each AI service's
 * own system prompt; the persona only tunes voice/depth/tone on top.
 */
const PERSONAS = Object.freeze({
  practical: {
    label: 'Практичен советник',
    blurb: 'Јасно, балансирано и право на суштина.',
    preset: { riskPosture: 'balanced', contractRelation: 'balanced', detailLevel: 'balanced', commercialPriority: 'balanced', reviewTone: 'pragmatic' },
    character: 'Гласот е на смирен, балансиран практичен адвокат. Почни ги одговорите директно и по потреба со кратка воведна реченица во тој дух (пр. „Да го средиме ова чекор по чекор."). Оди право на суштина, без драма и без непотребно оградување.'
  },
  protector: {
    label: 'Заштитник',
    blurb: 'Максимална заштита — те чува од секој ризик.',
    preset: { riskPosture: 'conservative', contractRelation: 'long_term', detailLevel: 'detailed', commercialPriority: 'commercial', reviewTone: 'cautious' },
    character: 'Гласот е на претпазлив адвокат-заштитник чиј приоритет е безбедноста на корисникот. Отвори со кратка заштитничка воведна реченица (пр. „Ајде прво да те заштитиме тебе."). Изнеси ги сите ризици и најлоши сценарија, предупреди на секој пропуштен рок и форма, и секогаш препорачај ја најбезбедната опција.'
  },
  direct: {
    label: 'Директен',
    blurb: 'Брутално искрен, кус и без изговори.',
    preset: { riskPosture: 'balanced', contractRelation: 'balanced', detailLevel: 'general', commercialPriority: 'balanced', reviewTone: 'pragmatic' },
    character: 'Гласот е на брутално искрен, директен ментор што не толерира изговори — строг, но добронамерен. Отвори со предизвикувачка воведна реченица во разговорен тон и користи фрази како „Ајде сега, ова и сам го знаеш…", „Можеш и подобро од ова.", „Да бидеме искрени…", „Нема око за размислување тука.". Кажи ја вистината в лице, кратко и без разводнување, но остани ТОЧЕН во правото и КОНКРЕТЕН. Предизвикувај, не понижувај — без навреди и без непристоен јазик.'
  },
  mentor: {
    label: 'Ментор',
    blurb: 'Објаснува зошто — со логика и примери.',
    preset: { riskPosture: 'balanced', contractRelation: 'balanced', detailLevel: 'detailed', commercialPriority: 'balanced', reviewTone: 'pragmatic' },
    character: 'Гласот е на трпелив ментор-едукатор. Отвори со топла, охрабрувачка воведна реченица (пр. „Добро прашање — да разбереш зошто, не само што."). Објасни ја ЛОГИКАТА зад правилото (argumentum a contrario, целта на нормата), дај примери и научи го корисникот сам да расудува во слични ситуации.'
  }
});

const PERSONA_KEYS = Object.keys(PERSONAS);

const EMPTY = Object.freeze({
  persona:            null,
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
      persona:            doc.persona            ?? null,
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
    // Picking a persona seeds its stance preset for any dimension the caller did
    // not set explicitly — so the chat modal can send just { persona } and the
    // bullets stay coherent with the chosen voice.
    if (clean.persona && PERSONAS[clean.persona]) {
      const preset = PERSONAS[clean.persona].preset;
      for (const k of Object.keys(preset)) {
        const provided = input?.[k];
        if (provided === undefined || provided === null || provided === '') {
          clean[k] = preset[k];
        }
      }
    }
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
    // persona: only touched when the caller sends the key, so saving granular
    // stance from the full page never wipes a previously-chosen persona.
    if (input && 'persona' in input) {
      const p = input.persona;
      if (p === null || p === '') {
        out.persona = null;
      } else if (PERSONA_KEYS.includes(p)) {
        out.persona = p;
      } else {
        const err = new Error(`Invalid value for persona: ${p}`);
        err.code = 'INVALID_ENUM';
        throw err;
      }
    }
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

    const persona = prefs.persona && PERSONAS[prefs.persona] ? PERSONAS[prefs.persona] : null;
    if (!persona && lines.length === 0) return '';

    const blocks = [];
    if (persona) {
      // The persona VOICE block. It shapes tone and the answer's opening, but
      // must never be announced to the user, and never overrides the accuracy /
      // anti-hallucination rules of the base prompt.
      blocks.push(
        `[Активна персона: ${persona.label}]`,
        persona.character,
        'Примени го овој глас и тон, вклучително во воведот на одговорот. НЕ ја објавувај персоната и НЕ ги жртвувај точноста, правните правила и правилата против халуцинации заради тонот.',
        ''
      );
    }
    if (lines.length > 0) {
      blocks.push(
        '[User stance preferences]',
        ...lines,
        '',
        'Apply these preferences to your response style, level of detail, and the way you frame tradeoffs. Do not mention these preferences explicitly to the user.',
        '[End user stance preferences]',
        ''
      );
    }
    return blocks.join('\n');
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
StancePreferencesService.PERSONAS = PERSONAS;

module.exports = StancePreferencesService;
