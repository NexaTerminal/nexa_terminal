'use strict';

/**
 * Invoices service — manual, admin-curated invoice records per user.
 *
 * Each row captures three editable fields (paymentDate, amount, invoiceNumber)
 * plus an optional note and currency. The user reads their own rows; admin
 * (Martin) is the only role that can create/update/delete.
 */

const { ObjectId } = require('mongodb');

const toObjectId = (v) => {
  if (v instanceof ObjectId) return v;
  if (typeof v === 'string' && ObjectId.isValid(v)) return new ObjectId(v);
  return null;
};

const normAmount = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error('Amount must be a finite number.');
  if (n < 0) throw new Error('Amount must be non-negative.');
  return Math.round(n * 100) / 100;
};

const normDate = (raw) => {
  if (!raw) throw new Error('Payment date is required.');
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid payment date.');
  return d;
};

const normInvoiceNumber = (raw) => {
  const s = String(raw || '').trim();
  if (!s) throw new Error('Invoice number is required.');
  if (s.length > 64) throw new Error('Invoice number too long (max 64 chars).');
  return s;
};

class InvoicesService {
  constructor(db) {
    this.col = db.collection('invoices');
  }

  async ensureIndexes() {
    await this.col.createIndex({ userId: 1, paymentDate: -1 });
    await this.col.createIndex({ invoiceNumber: 1 });
  }

  _shape(input) {
    return {
      paymentDate:   normDate(input.paymentDate),
      amount:        normAmount(input.amount),
      currency:      String(input.currency || 'EUR').trim().slice(0, 6).toUpperCase(),
      invoiceNumber: normInvoiceNumber(input.invoiceNumber),
      note:          String(input.note || '').trim().slice(0, 500) || ''
    };
  }

  async listForUser(userId) {
    const uid = toObjectId(userId);
    if (!uid) return [];
    return this.col.find({ userId: uid }).sort({ paymentDate: -1, _id: -1 }).toArray();
  }

  async create(userId, input) {
    const uid = toObjectId(userId);
    if (!uid) throw new Error('Invalid user id.');
    const doc = {
      userId: uid,
      ...this._shape(input),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const r = await this.col.insertOne(doc);
    return { ...doc, _id: r.insertedId };
  }

  async update(invoiceId, input) {
    const oid = toObjectId(invoiceId);
    if (!oid) throw new Error('Invalid invoice id.');
    const patch = { ...this._shape(input), updatedAt: new Date() };
    await this.col.updateOne({ _id: oid }, { $set: patch });
    return this.col.findOne({ _id: oid });
  }

  async remove(invoiceId) {
    const oid = toObjectId(invoiceId);
    if (!oid) throw new Error('Invalid invoice id.');
    const r = await this.col.deleteOne({ _id: oid });
    return r.deletedCount > 0;
  }

  async findById(invoiceId) {
    const oid = toObjectId(invoiceId);
    if (!oid) return null;
    return this.col.findOne({ _id: oid });
  }
}

module.exports = InvoicesService;
