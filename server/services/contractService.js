// Contract Management System v1 — data layer (tasks/cms-v1-plan.md §3–4).
//
// Durable `contracts` collection (native driver, NO TTL). Three capture
// sources: 'generated' (promoted from shared_documents), 'uploaded', 'manual'.
// Lifecycle metadata + obligations drive the daily reminder engine
// (contractReminderService). companyId is populated from day one so the Pro
// "all clients' deadlines" rollup is a later filter, not a migration.

const { ObjectId } = require('mongodb');

const COLLECTION = 'contracts';

const STATUSES = ['draft', 'active', 'expiring', 'expired', 'terminated', 'renewed'];
// Statuses the reminder engine / auto-transitions never touch.
const TERMINAL_STATUSES = new Set(['terminated', 'renewed']);
// Days before expiresAt at which 'active' flips to 'expiring' (also the
// default reminder offsets — decision D-4 of the CMS plan).
const DEFAULT_REMIND_OFFSETS = [30, 7, 1];
const EXPIRING_WINDOW_DAYS = 30;

const toId = (v) => (v instanceof ObjectId ? v : new ObjectId(v));

class ContractService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
  }

  async ensureIndexes() {
    await this.col.createIndex({ userId: 1, status: 1 });
    await this.col.createIndex({ companyId: 1 });
    await this.col.createIndex({ 'dates.expiresAt': 1 });
    await this.col.createIndex({ 'obligations.dueAt': 1 });
    await this.col.createIndex(
      { title: 'text', 'counterparty.name': 'text' },
      { default_language: 'none' } // Macedonian — no stemming
    );
  }

  /**
   * Status auto-transition (pure): active → expiring (inside window) →
   * expired (past expiresAt). Draft/terminated/renewed are left alone.
   */
  recomputeStatus(contract, now = new Date()) {
    if (!contract) return contract;
    if (TERMINAL_STATUSES.has(contract.status) || contract.status === 'draft') return contract;

    const expiresAt = contract.dates?.expiresAt ? new Date(contract.dates.expiresAt) : null;
    if (!expiresAt || isNaN(expiresAt)) {
      contract.status = 'active';
      return contract;
    }

    const nowMs = now.getTime();
    const windowDays = Math.max(EXPIRING_WINDOW_DAYS, contract.dates?.noticePeriodDays || 0);
    const windowStart = expiresAt.getTime() - windowDays * 86400000;

    if (nowMs >= expiresAt.getTime()) contract.status = 'expired';
    else if (nowMs >= windowStart) contract.status = 'expiring';
    else contract.status = 'active';
    return contract;
  }

  normalizeObligation(raw) {
    return {
      _id: raw._id ? toId(raw._id) : new ObjectId(),
      label: String(raw.label || '').slice(0, 200),
      type: ['renewal', 'payment', 'notice', 'custom'].includes(raw.type) ? raw.type : 'custom',
      dueAt: raw.dueAt ? new Date(raw.dueAt) : null,
      amount: typeof raw.amount === 'number' ? raw.amount : null,
      remindDaysBefore: Array.isArray(raw.remindDaysBefore) && raw.remindDaysBefore.length
        ? raw.remindDaysBefore.map(Number).filter((n) => Number.isFinite(n) && n >= 0)
        : [...DEFAULT_REMIND_OFFSETS],
      status: raw.status === 'done' ? 'done' : 'pending',
      completedAt: raw.completedAt ? new Date(raw.completedAt) : null
    };
  }

  buildDoc({ userId, companyId, createdBy, source, title, documentType, category,
             counterparty, value, status, dates, obligations, file, formData, tags, notes }) {
    const now = new Date();
    const doc = {
      userId: toId(userId),
      companyId: companyId ? toId(companyId) : toId(userId), // Basic: own company == owner
      createdBy: createdBy ? toId(createdBy) : toId(userId),
      source: ['generated', 'uploaded', 'manual'].includes(source) ? source : 'manual',
      title: String(title || 'Договор').slice(0, 300),
      documentType: String(documentType || 'custom').slice(0, 100),
      category: ['contract', 'employment', 'corporate', 'other'].includes(category) ? category : 'contract',
      counterparty: {
        name: String(counterparty?.name || '').slice(0, 300),
        type: counterparty?.type === 'natural' ? 'natural' : 'legal',
        taxNumber: String(counterparty?.taxNumber || '').slice(0, 30),
        email: String(counterparty?.email || '').slice(0, 200),
        phone: String(counterparty?.phone || '').slice(0, 50)
      },
      value: value && typeof value.amount === 'number'
        ? { amount: value.amount, currency: value.currency === 'EUR' ? 'EUR' : 'MKD' }
        : null,
      status: STATUSES.includes(status) ? status : 'active',
      dates: {
        signedAt: dates?.signedAt ? new Date(dates.signedAt) : null,
        effectiveAt: dates?.effectiveAt ? new Date(dates.effectiveAt) : null,
        expiresAt: dates?.expiresAt ? new Date(dates.expiresAt) : null,
        noticePeriodDays: Number.isFinite(Number(dates?.noticePeriodDays))
          ? Number(dates.noticePeriodDays) : null
      },
      obligations: Array.isArray(obligations) ? obligations.map((o) => this.normalizeObligation(o)) : [],
      file: file?.fileId ? {
        fileId: toId(file.fileId),
        fileName: String(file.fileName || 'document.docx').slice(0, 300),
        shareToken: file.shareToken || null,
        mime: file.mime || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } : null,
      formData: formData || null,
      reminders: { lastEvaluatedAt: null, sent: [] },
      tags: Array.isArray(tags) ? tags.map((t) => String(t).slice(0, 50)).slice(0, 20) : [],
      notes: String(notes || '').slice(0, 5000),
      createdAt: now,
      updatedAt: now
    };
    return this.recomputeStatus(doc);
  }

  async create(input) {
    const doc = this.buildDoc(input);
    const { insertedId } = await this.col.insertOne(doc);
    doc._id = insertedId;
    return doc;
  }

  async get(userId, id) {
    if (!ObjectId.isValid(id)) return null;
    const doc = await this.col.findOne({ _id: toId(id), userId: toId(userId) });
    if (!doc) return null;
    // Reflect time-based transitions on read; persist if changed.
    const before = doc.status;
    this.recomputeStatus(doc);
    if (doc.status !== before) {
      await this.col.updateOne({ _id: doc._id }, { $set: { status: doc.status, updatedAt: new Date() } });
    }
    return doc;
  }

  async list(userId, { status, q, page = 1, limit = 20 } = {}) {
    const filter = { userId: toId(userId) };
    if (status && STATUSES.includes(status)) filter.status = status;
    if (q) filter.$text = { $search: String(q).slice(0, 100) };

    const skip = (Math.max(1, Number(page)) - 1) * limit;
    const [items, total] = await Promise.all([
      this.col.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
      this.col.countDocuments(filter)
    ]);
    items.forEach((c) => this.recomputeStatus(c));
    return { items, total, page: Math.max(1, Number(page)), totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  /** Editable metadata only — never touches file/reminders/source. */
  async update(userId, id, patch) {
    const existing = await this.get(userId, id);
    if (!existing) return null;

    const set = { updatedAt: new Date() };
    if (patch.title !== undefined) set.title = String(patch.title).slice(0, 300);
    if (patch.category !== undefined && ['contract', 'employment', 'corporate', 'other'].includes(patch.category)) set.category = patch.category;
    if (patch.counterparty !== undefined) {
      set.counterparty = this.buildDoc({ userId, counterparty: patch.counterparty }).counterparty;
    }
    if (patch.value !== undefined) {
      set.value = patch.value && typeof patch.value.amount === 'number'
        ? { amount: patch.value.amount, currency: patch.value.currency === 'EUR' ? 'EUR' : 'MKD' }
        : null;
    }
    if (patch.dates !== undefined) {
      set.dates = this.buildDoc({ userId, dates: patch.dates }).dates;
    }
    if (patch.status !== undefined && STATUSES.includes(patch.status)) set.status = patch.status;
    if (patch.tags !== undefined) set.tags = this.buildDoc({ userId, tags: patch.tags }).tags;
    if (patch.notes !== undefined) set.notes = String(patch.notes).slice(0, 5000);

    await this.col.updateOne({ _id: toId(id), userId: toId(userId) }, { $set: set });
    return this.get(userId, id);
  }

  async remove(userId, id) {
    if (!ObjectId.isValid(id)) return false;
    const { deletedCount } = await this.col.deleteOne({ _id: toId(id), userId: toId(userId) });
    return deletedCount === 1;
  }

  async addObligation(userId, id, raw) {
    const existing = await this.get(userId, id);
    if (!existing) return null;
    const obligation = this.normalizeObligation(raw);
    await this.col.updateOne(
      { _id: toId(id), userId: toId(userId) },
      { $push: { obligations: obligation }, $set: { updatedAt: new Date() } }
    );
    return this.get(userId, id);
  }

  async updateObligation(userId, id, obligationId, patch) {
    const existing = await this.get(userId, id);
    if (!existing || !ObjectId.isValid(obligationId)) return null;
    const idx = existing.obligations.findIndex((o) => o._id.toString() === obligationId);
    if (idx === -1) return null;

    const merged = this.normalizeObligation({ ...existing.obligations[idx], ...patch, _id: obligationId });
    if (patch.status === 'done' && !merged.completedAt) merged.completedAt = new Date();

    await this.col.updateOne(
      { _id: toId(id), userId: toId(userId) },
      { $set: { [`obligations.${idx}`]: merged, updatedAt: new Date() } }
    );
    return this.get(userId, id);
  }

  /**
   * Upcoming items for the dashboard widget: expiring/expired contracts and
   * pending obligations due within `days`.
   */
  async upcoming(userId, { days = 30 } = {}) {
    const now = new Date();
    const horizon = new Date(Date.now() + days * 86400000);
    const docs = await this.col.find({
      userId: toId(userId),
      status: { $nin: ['terminated', 'renewed', 'draft'] },
      $or: [
        { 'dates.expiresAt': { $ne: null, $lte: horizon } },
        { obligations: { $elemMatch: { status: 'pending', dueAt: { $ne: null, $lte: horizon } } } }
      ]
    }).sort({ 'dates.expiresAt': 1 }).limit(20).toArray();

    const items = [];
    docs.forEach((c) => {
      this.recomputeStatus(c, now);
      if (c.dates?.expiresAt && new Date(c.dates.expiresAt) <= horizon) {
        items.push({
          contractId: c._id, title: c.title, kind: 'expiry',
          dueAt: c.dates.expiresAt, status: c.status, label: 'Истек на договор'
        });
      }
      (c.obligations || []).forEach((o) => {
        if (o.status === 'pending' && o.dueAt && new Date(o.dueAt) <= horizon) {
          items.push({
            contractId: c._id, title: c.title, kind: o.type,
            dueAt: o.dueAt, status: c.status, label: o.label
          });
        }
      });
    });
    items.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    return items.slice(0, 12);
  }

  /**
   * Does any contract reference this GridFS file? Cleanup guard (CMS plan
   * §5.1) — shared_documents/GridFS cleanup must call this before deleting.
   */
  async isFileReferenced(fileId) {
    if (!ObjectId.isValid(fileId)) return false;
    const doc = await this.col.findOne({ 'file.fileId': toId(fileId) }, { projection: { _id: 1 } });
    return !!doc;
  }
}

module.exports = ContractService;
module.exports.DEFAULT_REMIND_OFFSETS = DEFAULT_REMIND_OFFSETS;
module.exports.COLLECTION = COLLECTION;
