'use strict';

/**
 * Pro-invoice (профактура) service.
 *
 * Sequence is atomic per-year via a counters doc:
 *   { _id: 'proInvoice:2026', seq: N }
 *
 * Number format: `<seq>/<planCode>/<year>` — e.g. "1/standard/2026".
 *
 * Issuer details snapshot at issue time so historical invoices remain
 * stable even if env vars change.
 */

const { ObjectId } = require('mongodb');

const { PLAN_LABELS, PLAN_PRICES } = require('../constants/roles');

const EUR_TO_MKD = Number(process.env.INVOICE_EUR_TO_MKD || 61.5);
const DUE_DAYS = 3; // pro-forma is valid for 3 days
const ISSUER = {
  name:        process.env.INVOICE_ISSUER_NAME        || 'Друштво за услуги НЕКСА АМД ДООЕЛ Скопје',
  address:     process.env.INVOICE_ISSUER_ADDRESS     || 'Бул. Партизански одред бр. 102/2-14, Скопје',
  taxNumber:   process.env.INVOICE_ISSUER_TAX         || '4057026580265',
  bankAccount: process.env.INVOICE_ISSUER_BANK_ACCOUNT|| '380179034000187',
  bankName:    process.env.INVOICE_ISSUER_BANK_NAME   || 'ПроКредит Банка АД Скопје',
  vatNote:     'Издавачот не е обврзник на ДДВ согласно Законот за ДДВ.'
};

const toObjectId = (v) => {
  if (v instanceof ObjectId) return v;
  if (typeof v === 'string' && ObjectId.isValid(v)) return new ObjectId(v);
  return null;
};

class ProInvoicesService {
  constructor(db) {
    this.col       = db.collection('proInvoices');
    this.counters  = db.collection('counters');
  }

  async ensureIndexes() {
    await this.col.createIndex({ number: 1 }, { unique: true });
    await this.col.createIndex({ userId: 1, issuedAt: -1 });
    await this.col.createIndex({ year: 1, sequence: -1 });
  }

  /** Atomic per-year sequence allocator. */
  async _nextSequence(year) {
    const id = `proInvoice:${year}`;
    const r = await this.counters.findOneAndUpdate(
      { _id: id },
      { $inc: { seq: 1 }, $setOnInsert: { _id: id } },
      { upsert: true, returnDocument: 'after' }
    );
    // Driver compat: some return { value }, some return doc directly.
    const doc = r?.value || r;
    return doc.seq;
  }

  static get ISSUER() { return ISSUER; }
  static get EUR_TO_MKD() { return EUR_TO_MKD; }

  /**
   * Create a pro-invoice row for a subscribe / invoice-request action.
   *
   * @param {object} user      — full user doc (must contain companyInfo)
   * @param {string} planCode  — 'standard' | 'admin_5' | 'admin_10'
   * @param {string} cycle     — 'monthly' | 'quarterly' | 'annual'
   * @param {string} billingEmail (optional)
   */
  async createForUser(user, planCode, cycle, billingEmail) {
    if (!user || !user._id) throw new Error('User is required.');
    if (!PLAN_PRICES[planCode]) throw new Error(`Unknown plan: ${planCode}`);
    if (!PLAN_PRICES[planCode][cycle]) throw new Error(`Unknown cycle: ${cycle}`);

    const now = new Date();
    const year = now.getUTCFullYear();
    const seq = await this._nextSequence(year);
    const number = `${seq}/${planCode}/${year}`;

    const eurAmount = PLAN_PRICES[planCode][cycle];
    const mkdAmount = Math.round(eurAmount * EUR_TO_MKD);

    const ci = user.companyInfo || {};
    const buyer = {
      companyName: ci.companyName || user.fullName || user.username || '—',
      address:     ci.companyAddress || '—',
      taxNumber:   ci.companyTaxNumber || '—',
      email:       billingEmail || user.email || '—',
      manager:     ci.companyManager || ''
    };

    const dueAt = new Date(now.getTime() + DUE_DAYS * 86400000);

    const doc = {
      number,
      sequence: seq,
      year,
      planCode,
      planLabel: PLAN_LABELS[planCode]?.mk || planCode,
      cycle,
      userId: toObjectId(user._id),
      buyer,
      issuer: { ...ISSUER },
      amounts: {
        eur: eurAmount,
        mkd: mkdAmount,
        exchangeRate: EUR_TO_MKD,
        currency: 'EUR'
      },
      issuedAt: now,
      dueAt,
      status: 'issued',
      emailedAt: null,
      emailMessageId: null,
      createdAt: now,
      updatedAt: now
    };

    const r = await this.col.insertOne(doc);
    return { ...doc, _id: r.insertedId };
  }

  async markEmailed(id, messageId) {
    const oid = toObjectId(id);
    if (!oid) return null;
    await this.col.updateOne(
      { _id: oid },
      { $set: { emailedAt: new Date(), emailMessageId: messageId || null, updatedAt: new Date() } }
    );
    return this.col.findOne({ _id: oid });
  }

  async findById(id) {
    const oid = toObjectId(id);
    if (!oid) return null;
    return this.col.findOne({ _id: oid });
  }

  async listAll({ year, status, limit = 100, skip = 0 } = {}) {
    const q = {};
    if (year)   q.year = Number(year);
    if (status) q.status = status;
    const total = await this.col.countDocuments(q);
    const items = await this.col.find(q).sort({ year: -1, sequence: -1 }).skip(skip).limit(limit).toArray();
    return { items, total };
  }

  async listForUser(userId) {
    const uid = toObjectId(userId);
    if (!uid) return [];
    return this.col.find({ userId: uid }).sort({ issuedAt: -1 }).toArray();
  }

  async remove(id) {
    const oid = toObjectId(id);
    if (!oid) return false;
    const r = await this.col.deleteOne({ _id: oid });
    return r.deletedCount > 0;
  }

  async updateStatus(id, status) {
    if (!['issued', 'paid', 'cancelled'].includes(status)) {
      throw new Error('Invalid status.');
    }
    const oid = toObjectId(id);
    if (!oid) return null;
    await this.col.updateOne(
      { _id: oid },
      { $set: { status, updatedAt: new Date() } }
    );
    return this.col.findOne({ _id: oid });
  }
}

module.exports = ProInvoicesService;
