/**
 * Clients service — saved client company profiles for Pro (lawyer) users.
 *
 * A lawyer saves their clients' company details once and reuses them across
 * document generation (the company party on a document becomes the CLIENT's
 * company, not the lawyer's own). Every record is scoped to its owner; nothing
 * is ever shared across users.
 *
 * Collection: `clients`
 *   { _id, ownerId, companyName, companyAddress, companyTaxNumber,
 *     companyManager, role, note, createdAt, updatedAt }
 */

const { ObjectId } = require('mongodb');

const COLLECTION = 'clients';
const clamp = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

class ClientsService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this._indexed = false;
  }

  async _ensureIndexes() {
    if (this._indexed) return;
    await this.col.createIndex({ ownerId: 1, companyName: 1 });
    this._indexed = true;
  }

  static toObjectId(id) {
    try { return new ObjectId(String(id)); } catch { return null; }
  }

  // Normalize + validate a client payload. Only companyName is required.
  static _clean(input) {
    const companyName = clamp(input?.companyName, 240);
    if (!companyName) { const e = new Error('Името на клиентот е задолжително.'); e.code = 'INVALID_INPUT'; e.fields = ['companyName']; throw e; }
    return {
      companyName,
      companyAddress:   clamp(input?.companyAddress, 300),
      companyTaxNumber: clamp(input?.companyTaxNumber, 40),
      companyManager:   clamp(input?.companyManager, 160),
      role:             clamp(input?.role, 120),
      note:             clamp(input?.note, 800)
    };
  }

  async list(ownerId, { search } = {}) {
    await this._ensureIndexes();
    const oid = ClientsService.toObjectId(ownerId);
    if (!oid) return [];
    const filter = { ownerId: oid };
    const q = clamp(search, 120);
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ companyName: rx }, { companyTaxNumber: rx }];
    }
    return this.col.find(filter).sort({ companyName: 1 }).toArray();
  }

  async getOwned(ownerId, id) {
    await this._ensureIndexes();
    const oid = ClientsService.toObjectId(id);
    const owner = ClientsService.toObjectId(ownerId);
    if (!oid || !owner) return null;
    return this.col.findOne({ _id: oid, ownerId: owner });
  }

  async create(ownerId, input) {
    await this._ensureIndexes();
    const owner = ClientsService.toObjectId(ownerId);
    if (!owner) { const e = new Error('Invalid owner'); e.code = 'INVALID_ID'; throw e; }
    const clean = ClientsService._clean(input);
    const now = new Date();
    const doc = { _id: new ObjectId(), ownerId: owner, ...clean, createdAt: now, updatedAt: now };
    await this.col.insertOne(doc);
    return doc;
  }

  async update(ownerId, id, input) {
    await this._ensureIndexes();
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    const clean = ClientsService._clean(input);
    await this.col.updateOne({ _id: existing._id }, { $set: { ...clean, updatedAt: new Date() } });
    return this.col.findOne({ _id: existing._id });
  }

  async remove(ownerId, id) {
    await this._ensureIndexes();
    const existing = await this.getOwned(ownerId, id);
    if (!existing) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
    await this.col.deleteOne({ _id: existing._id });
    return { deleted: true };
  }
}

module.exports = ClientsService;
