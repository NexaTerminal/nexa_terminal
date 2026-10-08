/**
 * Agent Memory service (Layer 2 — per-character relationship memory).
 *
 * Where UserMemoryService keeps ONE shared client file per user (the "what we know
 * about you", shared by all legal agents), this keeps a short relationship note per
 * (user, character): what THIS character has been helping the user with. It gives
 * each AI Team member continuity across conversations and powers a warm, referential
 * greeting when the user opens a fresh thread with them.
 *
 * Collection: `user_agent_memory`, one document per (userId, agent).
 *
 * Privacy: gated by the SAME enable flag as UserMemoryService — if the user turned
 * memory off, we neither grow nor inject this. Grown for free by piggy-backing on
 * the per-exchange learn call (see ChatBotService._learnFromExchange); never throws.
 */

const { ObjectId } = require('mongodb');

const COLLECTION = 'user_agent_memory';
const NOTE_MAX_LEN = 600;

class AgentMemoryService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this._indexed = false;
  }

  async _ensureIndex() {
    if (this._indexed) return;
    await this.col.createIndex({ userId: 1, agent: 1 }, { unique: true });
    this._indexed = true;
  }

  static toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  /** The relationship note for a (user, character). '' when none. */
  async get(userId, agent) {
    try {
      await this._ensureIndex();
      const uid = AgentMemoryService.toObjectId(userId);
      if (!uid || !agent) return { note: '', updatedAt: null };
      const doc = await this.col.findOne({ userId: uid, agent });
      return { note: doc?.note || '', updatedAt: doc?.updatedAt ?? null };
    } catch (e) {
      console.warn('[agentMemory] get error:', e.message);
      return { note: '', updatedAt: null };
    }
  }

  /** Upsert the relationship note. Best-effort — never throws. */
  async setNote(userId, agent, note) {
    try {
      await this._ensureIndex();
      const uid = AgentMemoryService.toObjectId(userId);
      const text = String(note || '').trim().slice(0, NOTE_MAX_LEN);
      if (!uid || !agent || !text) return;
      await this.col.updateOne(
        { userId: uid, agent },
        { $set: { note: text, userId: uid, agent, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (e) {
      console.warn('[agentMemory] setNote error:', e.message);
    }
  }

  /** Remove the note for a (user, character). */
  async clear(userId, agent) {
    try {
      await this._ensureIndex();
      const uid = AgentMemoryService.toObjectId(userId);
      if (!uid || !agent) return;
      await this.col.deleteOne({ userId: uid, agent });
    } catch (e) {
      console.warn('[agentMemory] clear error:', e.message);
    }
  }

  /** Pure builder — the compact prompt block. '' when no note. */
  static buildPrefix(note, agentName) {
    const text = String(note || '').trim();
    if (!text) return '';
    const who = agentName ? ` со ${agentName}` : '';
    return (
      `## КОНТИНУИТЕТ ОД ПРЕТХОДНИ РАЗГОВОРИ${who}\n` +
      text + '\n' +
      'Ова е краток потсетник што претходно сте работеле заедно. Користи го за континуитет (не почнувај од нула ако темата се надоврзува), но НЕ го набројувај пред корисникот и не претпоставувај ако моменталната порака воведува нова тема.\n\n'
    );
  }

  /** Fetch + build in one call. '' when empty/disabled/error. */
  async getPrefix(userId, agent, agentName) {
    try {
      const { note } = await this.get(userId, agent);
      return AgentMemoryService.buildPrefix(note, agentName);
    } catch (e) {
      console.warn('[agentMemory] getPrefix error:', e.message);
      return '';
    }
  }
}

AgentMemoryService.NOTE_MAX_LEN = NOTE_MAX_LEN;

module.exports = AgentMemoryService;
