/**
 * Cases service — legal matter management for Pro (lawyer) users.
 *
 * A "предмет" (case/matter) is the lawyer's workspace for one client engagement:
 * core details, a list of deadlines (рокови) that drive email reminders, and a
 * timeline (дневник) of actions. Each case carries a STABLE public token so the
 * lawyer can hand a read-only status page to their client; what the client sees
 * is strictly the curated, client-visible subset (see getPublicByToken).
 *
 * Every record is scoped to its owner (ownerId); nothing is shared across users.
 * Deadlines and timeline entries are embedded sub-documents (a solo lawyer has
 * few per case) — same shape rationale as employee.remindersSent / contracts.
 *
 * Collection: `cases`
 */

const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const COLLECTION = 'cases';

const CASE_TYPES = ['parnica', 'krivicno', 'upravna', 'dogovorno', 'nasledstvo', 'rabotni', 'izvrsuvanje', 'registracija', 'drugo'];
const STATUSES = ['open', 'in_progress', 'waiting', 'closed', 'archived'];
const PRIORITIES = ['low', 'normal', 'high'];
const DEADLINE_TYPES = ['rociste', 'zalba', 'podnesok', 'zastarenost', 'plakanje', 'drugo'];
const TIMELINE_TYPES = ['sostanok', 'podnesok', 'rociste', 'telefon', 'eposhta', 'napomena', 'drugo'];

// Statuses for which a case is "live" — reminders fire and the public link works.
const ACTIVE_STATUSES = ['open', 'in_progress', 'waiting'];

const clamp = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
const oneOf = (v, list, dflt) => (list.includes(v) ? v : dflt);
const toDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d; };

class CasesService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this._indexed = false;
  }

  async _ensureIndexes() {
    if (this._indexed) return;
    await this.col.createIndex({ ownerId: 1, updatedAt: -1 });
    await this.col.createIndex({ publicToken: 1 }, { unique: true });
    await this.col.createIndex({ status: 1, 'deadlines.dueAt': 1 });
    this._indexed = true;
  }

  static toObjectId(id) {
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  static get ACTIVE_STATUSES() { return ACTIVE_STATUSES; }

  // Normalize + validate the core case payload. Only title is required.
  static _cleanCore(input) {
    const title = clamp(input?.title, 240);
    if (!title) { const e = new Error('Насловот на предметот е задолжителен.'); e.code = 'INVALID_INPUT'; e.fields = ['title']; throw e; }
    const core = {
      title,
      caseType:      oneOf(input?.caseType, CASE_TYPES, 'drugo'),
      status:        oneOf(input?.status, STATUSES, 'open'),
      clientName:    clamp(input?.clientName, 240),
      clientEmail:   clamp(input?.clientEmail, 200),
      courtName:     clamp(input?.courtName, 240),
      internalNumber: clamp(input?.internalNumber, 120), // lawyer's own file/деловоден number
      caseNumber:    clamp(input?.caseNumber, 120),      // official court/registry number
      opposingParty: clamp(input?.opposingParty, 240),
      description:   clamp(input?.description, 4000),
      internalNotes: clamp(input?.internalNotes, 6000),
      priority:      oneOf(input?.priority, PRIORITIES, 'normal'),
      value:         clamp(input?.value, 120)
    };
    // Optional link to a saved client profile.
    const clientId = CasesService.toObjectId(input?.clientId);
    core.clientId = input?.clientId ? clientId : null;
    return core;
  }

  async list(ownerId, { search, status } = {}) {
    await this._ensureIndexes();
    const oid = CasesService.toObjectId(ownerId);
    if (!oid) return [];
    const filter = { ownerId: oid };
    if (STATUSES.includes(status)) filter.status = status;
    const q = clamp(search, 120);
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { clientName: rx }, { caseNumber: rx }, { internalNumber: rx }, { opposingParty: rx }];
    }
    const items = await this.col.find(filter).sort({ updatedAt: -1 }).toArray();
    // Attach the next open deadline for the list view (cheap, computed here).
    return items.map((c) => ({ ...c, nextDeadline: CasesService._nextOpenDeadline(c) }));
  }

  static _nextOpenDeadline(c) {
    const open = (c.deadlines || []).filter((d) => !d.done && d.dueAt);
    if (!open.length) return null;
    open.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    const d = open[0];
    return { title: d.title, type: d.type, dueAt: d.dueAt };
  }

  async getOwned(ownerId, id) {
    await this._ensureIndexes();
    const oid = CasesService.toObjectId(id);
    const owner = CasesService.toObjectId(ownerId);
    if (!oid || !owner) return null;
    return this.col.findOne({ _id: oid, ownerId: owner });
  }

  async create(ownerId, input) {
    await this._ensureIndexes();
    const owner = CasesService.toObjectId(ownerId);
    if (!owner) { const e = new Error('Invalid owner'); e.code = 'INVALID_ID'; throw e; }
    const core = CasesService._cleanCore(input);
    const now = new Date();
    const doc = {
      _id: new ObjectId(), ownerId: owner, ...core,
      openedAt: now, closedAt: null,
      publicToken: uuidv4(), publicEnabled: true,
      deadlines: [], timeline: [],
      createdAt: now, updatedAt: now
    };
    await this.col.insertOne(doc);
    return doc;
  }

  async update(ownerId, id, input) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const core = CasesService._cleanCore(input);
    const set = { ...core, updatedAt: new Date() };
    // Track close time; archiving/closing hides the public page (handled at read).
    if (core.status !== existing.status) {
      if (core.status === 'closed' || core.status === 'archived') set.closedAt = existing.closedAt || new Date();
      if (ACTIVE_STATUSES.includes(core.status)) set.closedAt = null;
    }
    await this.col.updateOne({ _id: existing._id }, { $set: set });
    return this.col.findOne({ _id: existing._id });
  }

  async remove(ownerId, id) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    await this.col.deleteOne({ _id: existing._id });
    return { deleted: true };
  }

  async setPublicEnabled(ownerId, id, enabled) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    await this.col.updateOne({ _id: existing._id }, { $set: { publicEnabled: !!enabled, updatedAt: new Date() } });
    return this.col.findOne({ _id: existing._id });
  }

  // ── Deadlines (рокови) ────────────────────────────────────────────────────
  static _cleanDeadline(input) {
    const title = clamp(input?.title, 240);
    const dueAt = toDate(input?.dueAt);
    if (!title) { const e = new Error('Насловот на рокот е задолжителен.'); e.code = 'INVALID_INPUT'; e.fields = ['title']; throw e; }
    if (!dueAt) { const e = new Error('Датумот на рокот е задолжителен.'); e.code = 'INVALID_INPUT'; e.fields = ['dueAt']; throw e; }
    return {
      title, dueAt,
      type: oneOf(input?.type, DEADLINE_TYPES, 'drugo'),
      done: !!input?.done,
      clientVisible: !!input?.clientVisible,
      remind: input?.remind === undefined ? true : !!input.remind
    };
  }

  async addDeadline(ownerId, id, input) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const clean = CasesService._cleanDeadline(input);
    const item = { _id: new ObjectId(), ...clean, remindersSent: [], createdAt: new Date() };
    await this.col.updateOne({ _id: existing._id }, { $push: { deadlines: item }, $set: { updatedAt: new Date() } });
    return this.col.findOne({ _id: existing._id });
  }

  async updateDeadline(ownerId, id, deadlineId, input) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const did = CasesService.toObjectId(deadlineId);
    const clean = CasesService._cleanDeadline(input);
    const res = await this.col.updateOne(
      { _id: existing._id, 'deadlines._id': did },
      { $set: {
        'deadlines.$.title': clean.title, 'deadlines.$.dueAt': clean.dueAt,
        'deadlines.$.type': clean.type, 'deadlines.$.done': clean.done,
        'deadlines.$.clientVisible': clean.clientVisible, 'deadlines.$.remind': clean.remind,
        updatedAt: new Date()
      } }
    );
    if (!res.matchedCount) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    return this.col.findOne({ _id: existing._id });
  }

  async removeDeadline(ownerId, id, deadlineId) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const did = CasesService.toObjectId(deadlineId);
    await this.col.updateOne({ _id: existing._id }, { $pull: { deadlines: { _id: did } }, $set: { updatedAt: new Date() } });
    return this.col.findOne({ _id: existing._id });
  }

  // ── Timeline (дневник) ─────────────────────────────────────────────────────
  static _cleanEntry(input) {
    const title = clamp(input?.title, 240);
    const body = clamp(input?.body, 6000);
    if (!title && !body) { const e = new Error('Внесете опис на активноста.'); e.code = 'INVALID_INPUT'; e.fields = ['body']; throw e; }
    return {
      title, body,
      type: oneOf(input?.type, TIMELINE_TYPES, 'napomena'),
      at: toDate(input?.at) || new Date(),
      clientVisible: !!input?.clientVisible
    };
  }

  async addEntry(ownerId, id, input) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const clean = CasesService._cleanEntry(input);
    const item = { _id: new ObjectId(), ...clean, createdAt: new Date() };
    await this.col.updateOne({ _id: existing._id }, { $push: { timeline: item }, $set: { updatedAt: new Date() } });
    return this.col.findOne({ _id: existing._id });
  }

  async updateEntry(ownerId, id, entryId, input) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const eid = CasesService.toObjectId(entryId);
    const clean = CasesService._cleanEntry(input);
    const res = await this.col.updateOne(
      { _id: existing._id, 'timeline._id': eid },
      { $set: {
        'timeline.$.title': clean.title, 'timeline.$.body': clean.body,
        'timeline.$.type': clean.type, 'timeline.$.at': clean.at,
        'timeline.$.clientVisible': clean.clientVisible, updatedAt: new Date()
      } }
    );
    if (!res.matchedCount) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    return this.col.findOne({ _id: existing._id });
  }

  async removeEntry(ownerId, id, entryId) {
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const eid = CasesService.toObjectId(entryId);
    await this.col.updateOne({ _id: existing._id }, { $pull: { timeline: { _id: eid } }, $set: { updatedAt: new Date() } });
    return this.col.findOne({ _id: existing._id });
  }

  // ── Public, redacted read (no auth) ────────────────────────────────────────
  // Returns ONLY what the client may see. `state` distinguishes an inactive link
  // (disabled/archived) from a normal or closed case so the page can explain it.
  async getPublicByToken(token) {
    await this._ensureIndexes();
    const t = clamp(token, 80);
    if (!t) return null;
    const c = await this.col.findOne({ publicToken: t });
    if (!c) return null;

    if (!c.publicEnabled || c.status === 'archived') {
      return { state: 'inactive' };
    }

    const visibleDeadlines = (c.deadlines || [])
      .filter((d) => d.clientVisible && !d.done && d.dueAt)
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
      .map((d) => ({ title: d.title, type: d.type, dueAt: d.dueAt }));

    const visibleTimeline = (c.timeline || [])
      .filter((e) => e.clientVisible)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .map((e) => ({ title: e.title, body: e.body, type: e.type, at: e.at }));

    // Lawyer contact for the client to reach out — public-safe fields only.
    let lawyer = null;
    try {
      const owner = await this.db.collection('users').findOne(
        { _id: c.ownerId },
        { projection: { officialEmail: 1, email: 1, 'companyInfo.companyName': 1, 'companyInfo.phone': 1, 'companyInfo.website': 1 } }
      );
      if (owner) {
        lawyer = {
          companyName: owner.companyInfo?.companyName || '',
          email: owner.officialEmail || owner.email || '',
          phone: owner.companyInfo?.phone || '',
          website: owner.companyInfo?.website || ''
        };
      }
    } catch { /* contact is optional — the status page still renders without it */ }

    return {
      state: c.status === 'closed' ? 'closed' : 'active',
      title: c.title,
      caseType: c.caseType,
      status: c.status,
      courtName: c.courtName,
      internalNumber: c.internalNumber,
      caseNumber: c.caseNumber,
      nextDeadline: visibleDeadlines[0] || null,
      deadlines: visibleDeadlines,
      timeline: visibleTimeline,
      updatedAt: c.updatedAt,
      lawyer
    };
  }
}

module.exports = CasesService;
module.exports.CASE_TYPES = CASE_TYPES;
module.exports.STATUSES = STATUSES;
module.exports.ACTIVE_STATUSES = ACTIVE_STATUSES;
module.exports.DEADLINE_TYPES = DEADLINE_TYPES;
module.exports.TIMELINE_TYPES = TIMELINE_TYPES;
module.exports.COLLECTION = COLLECTION;
