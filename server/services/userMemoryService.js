/**
 * User AI Memory service (Layer 1 — durable, cross-conversation memory).
 *
 * Persists a per-user "client file" (one document per user in the
 * `user_ai_memory` collection): a short list of stable, business-relevant facts
 * the AI Team has learned about the user. This is the *what we know about you*
 * counterpart to `user_stance_preferences` (which is *how to talk to you*).
 *
 * Shared across all legal agents — a human law firm keeps one client file, so
 * НОВА should benefit from what АРИА learned. Facts are injected as a compact
 * prefix above the base prompt (see ChatBotService._getMemoryPrefix), and grown
 * automatically from each exchange (see ChatBotService._learnFromExchange).
 *
 * Design constraints (mirror the budget/privacy rules of the AI stack):
 *  - COMPACT: only the top FACTS_INJECT facts are injected (re-sent every question).
 *  - CAPPED: at most FACTS_MAX facts stored; least-used/oldest evicted.
 *  - OPT-OUT: `enabled:false` stops both injection AND learning.
 *  - TRANSPARENT: the user can list, delete, clear and toggle via /api/ai/memory.
 */

const { ObjectId } = require('mongodb');
const crypto = require('crypto');

const COLLECTION = 'user_ai_memory';
const FACTS_MAX = 30;        // hard cap on stored facts
const FACTS_INJECT = 15;     // how many are injected into the prompt
const FACT_MAX_LEN = 160;    // per-fact character cap

const DOMAINS = Object.freeze(['employment', 'corporate', 'contracts', 'tax', 'data', 'general']);

class UserMemoryService {
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

  static normalize(text) {
    return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /** Full memory doc for a user (enabled defaults to true). */
  async get(userId) {
    await this._ensureIndex();
    const uid = UserMemoryService.toObjectId(userId);
    if (!uid) return { enabled: true, facts: [], updatedAt: null };
    const doc = await this.col.findOne({ userId: uid });
    if (!doc) return { enabled: true, facts: [], updatedAt: null };
    return {
      enabled: doc.enabled !== false,
      facts: Array.isArray(doc.facts) ? doc.facts : [],
      updatedAt: doc.updatedAt ?? null,
    };
  }

  /** Enable/disable memory (injection + learning). */
  async setEnabled(userId, enabled) {
    await this._ensureIndex();
    const uid = UserMemoryService.toObjectId(userId);
    if (!uid) { const e = new Error('Invalid user id'); e.code = 'INVALID_USER'; throw e; }
    const now = new Date();
    await this.col.updateOne(
      { userId: uid },
      { $set: { enabled: !!enabled, userId: uid, updatedAt: now }, $setOnInsert: { facts: [] } },
      { upsert: true }
    );
    return this.get(userId);
  }

  /** Remove one fact by id. */
  async deleteFact(userId, factId) {
    await this._ensureIndex();
    const uid = UserMemoryService.toObjectId(userId);
    if (!uid) { const e = new Error('Invalid user id'); e.code = 'INVALID_USER'; throw e; }
    await this.col.updateOne(
      { userId: uid },
      { $pull: { facts: { id: String(factId) } }, $set: { updatedAt: new Date() } }
    );
    return this.get(userId);
  }

  /** Wipe all facts (keeps the enabled flag). */
  async clear(userId) {
    await this._ensureIndex();
    const uid = UserMemoryService.toObjectId(userId);
    if (!uid) { const e = new Error('Invalid user id'); e.code = 'INVALID_USER'; throw e; }
    await this.col.updateOne(
      { userId: uid },
      { $set: { facts: [], updatedAt: new Date() } },
      { upsert: true }
    );
    return this.get(userId);
  }

  /**
   * Merge newly-extracted facts into the user's memory.
   * - skips when memory is disabled;
   * - dedupes by containment (new ⊂ existing or existing ⊂ new) → bumps hits/lastSeenAt;
   * - caps at FACTS_MAX, evicting the least-used then oldest.
   * `incoming` = [{ text, domain }]. Never throws — learning is best-effort.
   */
  async learn(userId, incoming) {
    try {
      if (!Array.isArray(incoming) || incoming.length === 0) return;
      await this._ensureIndex();
      const uid = UserMemoryService.toObjectId(userId);
      if (!uid) return;

      const current = await this.get(userId);
      if (!current.enabled) return;

      const facts = current.facts.slice();
      const now = new Date();

      for (const raw of incoming) {
        const text = String(raw?.text || '').trim().slice(0, FACT_MAX_LEN);
        if (text.length < 4) continue;
        const domain = DOMAINS.includes(raw?.domain) ? raw.domain : 'general';
        const norm = UserMemoryService.normalize(text);

        // Dedupe: if an existing fact contains or is contained by the new one,
        // treat it as the same fact — keep the longer text, bump hits.
        const dup = facts.find((f) => {
          const fn = UserMemoryService.normalize(f.text);
          return fn === norm || fn.includes(norm) || norm.includes(fn);
        });
        if (dup) {
          if (norm.length > UserMemoryService.normalize(dup.text).length) dup.text = text;
          dup.hits = (dup.hits || 1) + 1;
          dup.lastSeenAt = now;
          dup.domain = domain;
          continue;
        }

        facts.push({
          id: crypto.randomBytes(6).toString('hex'),
          text,
          domain,
          createdAt: now,
          lastSeenAt: now,
          hits: 1,
        });
      }

      // Evict down to the cap: least hits first, then least-recently-seen.
      if (facts.length > FACTS_MAX) {
        facts.sort((a, b) => (b.hits || 1) - (a.hits || 1)
          || new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0));
        facts.length = FACTS_MAX;
      }

      await this.col.updateOne(
        { userId: uid },
        { $set: { facts, userId: uid, updatedAt: now }, $setOnInsert: { enabled: true } },
        { upsert: true }
      );
    } catch (e) {
      console.warn('[userMemory] learn error:', e.message);
    }
  }

  /** Pure builder — the compact prompt block. '' when no facts. */
  static buildPrefix(facts) {
    if (!Array.isArray(facts) || facts.length === 0) return '';
    const top = facts
      .slice()
      .sort((a, b) => (b.hits || 1) - (a.hits || 1)
        || new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0))
      .slice(0, FACTS_INJECT);
    if (top.length === 0) return '';
    const lines = top.map((f) => `- ${String(f.text).trim()}`);
    return (
      '## ШТО ЗНАМ ЗА КОРИСНИКОТ (меморија од претходни разговори)\n' +
      lines.join('\n') + '\n' +
      'Користи ги овие факти за да го персонализираш одговорот (контекст на бизнисот, повторливи теми), но НЕ ги објавувај и НЕ ги набројувај пред корисникот. Ова се претпоставки од минати разговори — ако моменталната порака противречи на некој факт, моменталната порака има предност. Не измислувај факти што ги нема тука.\n\n'
    );
  }

  /** Fetch + build in one call. '' when disabled, empty, or on error. */
  async getPrefix(userId) {
    try {
      const mem = await this.get(userId);
      if (!mem.enabled) return '';
      return UserMemoryService.buildPrefix(mem.facts);
    } catch (e) {
      console.warn('[userMemory] getPrefix error:', e.message);
      return '';
    }
  }
}

UserMemoryService.FACTS_MAX = FACTS_MAX;
UserMemoryService.DOMAINS = DOMAINS;

module.exports = UserMemoryService;
