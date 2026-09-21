/**
 * „Регистар на набавки" — owner-side procurement register.
 *
 * The central entity is a NEED, keyed by its type of product/service (category),
 * e.g. „Осигурување на возен парк". Under each need the SMB logs the OFFERS it
 * received (supplier · price · terms · valid-until), marks the chosen one, and
 * sets a renewal date so we can remind them to re-quote before it lapses.
 *
 * All ops scoped to req.user._id. Feature access enforced by route subscriptionGuard.
 */
const { ObjectId } = require('mongodb');

const COLLECTION = 'procurement_register';
const col = (req) => req.app.locals.db.collection(COLLECTION);
const uid = (req) => String(req.user._id || req.user.id);

const TYPES = new Set(['product', 'service']);
const clip = (s, n) => (s == null ? '' : String(s).trim().slice(0, n));
const toDate = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d; };

function presentOffer(o) {
  return {
    id: o._id.toString(),
    supplier: o.supplier || '',
    amount: o.amount || '',
    terms: o.terms || '',
    validUntil: o.validUntil || null,
    contact: o.contact || '',
    note: o.note || '',
    chosen: !!o.chosen,
    createdAt: o.createdAt,
  };
}

function present(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    category: doc.category || '',
    type: doc.type,
    note: doc.note || '',
    renewalDate: doc.renewalDate || null,
    reminderDaysBefore: doc.reminderDaysBefore ?? 30,
    remindedAt: doc.remindedAt || null,
    status: doc.status || 'active',
    offers: (doc.offers || []).map(presentOffer),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt || null,
  };
}

async function ensureIndexes(db) {
  const c = db.collection(COLLECTION);
  await c.createIndex({ userId: 1, createdAt: -1 });
  await c.createIndex({ status: 1, renewalDate: 1 });
}

// ── item CRUD ───────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const items = await col(req).find({ ownerId: uid(req) }).sort({ createdAt: -1 }).toArray();
    return res.json({ success: true, items: items.map(present) });
  } catch (err) {
    console.error('[procurement] list error:', err);
    return res.status(500).json({ success: false });
  }
};

exports.create = async (req, res) => {
  try {
    const title = clip(req.body?.title, 140);
    const category = clip(req.body?.category, 80);
    const type = TYPES.has(req.body?.type) ? req.body.type : 'service';
    if (!title) return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Внесете назив на набавката.' });
    if (!category) return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Изберете тип (категорија).' });
    const now = new Date();
    const doc = {
      ownerId: uid(req),
      title, category, type,
      note: clip(req.body?.note, 500),
      renewalDate: toDate(req.body?.renewalDate),
      reminderDaysBefore: Math.min(180, Math.max(1, parseInt(req.body?.reminderDaysBefore, 10) || 30)),
      remindedAt: null,
      status: 'active',
      offers: [],
      createdAt: now,
      updatedAt: now,
    };
    const r = await col(req).insertOne(doc);
    doc._id = r.insertedId;
    return res.status(201).json({ success: true, item: present(doc) });
  } catch (err) {
    console.error('[procurement] create error:', err);
    return res.status(500).json({ success: false });
  }
};

exports.update = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const _id = new ObjectId(req.params.id);
    const existing = await col(req).findOne({ _id, ownerId: uid(req) });
    if (!existing) return res.status(404).json({ success: false, code: 'NOT_FOUND' });

    const set = { updatedAt: new Date() };
    if (req.body?.title != null) { const t = clip(req.body.title, 140); if (!t) return res.status(400).json({ success: false, message: 'Внесете назив.' }); set.title = t; }
    if (req.body?.category != null) set.category = clip(req.body.category, 80);
    if (req.body?.type != null && TYPES.has(req.body.type)) set.type = req.body.type;
    if (req.body?.note != null) set.note = clip(req.body.note, 500);
    if (req.body?.reminderDaysBefore != null) set.reminderDaysBefore = Math.min(180, Math.max(1, parseInt(req.body.reminderDaysBefore, 10) || 30));
    if (req.body?.status != null && ['active', 'archived'].includes(req.body.status)) set.status = req.body.status;
    if ('renewalDate' in (req.body || {})) {
      const nd = toDate(req.body.renewalDate);
      set.renewalDate = nd;
      // A new renewal date opens a fresh reminder cycle.
      if (String(nd) !== String(existing.renewalDate)) set.remindedAt = null;
    }
    await col(req).updateOne({ _id }, { $set: set });
    const doc = await col(req).findOne({ _id });
    return res.json({ success: true, item: present(doc) });
  } catch (err) {
    console.error('[procurement] update error:', err);
    return res.status(500).json({ success: false });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const r = await col(req).deleteOne({ _id: new ObjectId(req.params.id), ownerId: uid(req) });
    if (!r.deletedCount) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true });
  } catch (err) {
    console.error('[procurement] remove error:', err);
    return res.status(500).json({ success: false });
  }
};

// ── offers ──────────────────────────────────────────────────────────────────
function offerFromBody(b) {
  return {
    _id: new ObjectId(),
    supplier: clip(b?.supplier, 140),
    amount: clip(b?.amount, 60),
    terms: clip(b?.terms, 300),
    validUntil: toDate(b?.validUntil),
    contact: clip(b?.contact, 160),
    note: clip(b?.note, 400),
    chosen: false,
    createdAt: new Date(),
  };
}

exports.addOffer = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const _id = new ObjectId(req.params.id);
    const existing = await col(req).findOne({ _id, ownerId: uid(req) });
    if (!existing) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    const offer = offerFromBody(req.body || {});
    if (!offer.supplier) return res.status(400).json({ success: false, message: 'Внесете назив на добавувачот.' });
    await col(req).updateOne({ _id }, { $push: { offers: offer }, $set: { updatedAt: new Date() } });
    const doc = await col(req).findOne({ _id });
    return res.status(201).json({ success: true, item: present(doc) });
  } catch (err) {
    console.error('[procurement] addOffer error:', err);
    return res.status(500).json({ success: false });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.params.offerId)) return res.status(404).json({ success: false });
    const _id = new ObjectId(req.params.id);
    const offerId = new ObjectId(req.params.offerId);
    const existing = await col(req).findOne({ _id, ownerId: uid(req) });
    if (!existing) return res.status(404).json({ success: false, code: 'NOT_FOUND' });

    // "chosen" is exclusive — choosing one clears the others.
    if (req.body?.chosen === true) {
      const offers = (existing.offers || []).map((o) => ({ ...o, chosen: String(o._id) === String(offerId) }));
      await col(req).updateOne({ _id }, { $set: { offers, updatedAt: new Date() } });
    } else {
      const fields = {};
      ['supplier', 'amount', 'terms', 'contact', 'note'].forEach((k) => { if (req.body?.[k] != null) fields[`offers.$.${k}`] = clip(req.body[k], k === 'terms' ? 300 : k === 'note' ? 400 : 160); });
      if ('validUntil' in (req.body || {})) fields['offers.$.validUntil'] = toDate(req.body.validUntil);
      if (req.body?.chosen === false) fields['offers.$.chosen'] = false;
      fields.updatedAt = new Date();
      await col(req).updateOne({ _id, 'offers._id': offerId }, { $set: fields });
    }
    const doc = await col(req).findOne({ _id });
    return res.json({ success: true, item: present(doc) });
  } catch (err) {
    console.error('[procurement] updateOffer error:', err);
    return res.status(500).json({ success: false });
  }
};

exports.removeOffer = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(req.params.offerId)) return res.status(404).json({ success: false });
    const _id = new ObjectId(req.params.id);
    const r = await col(req).updateOne(
      { _id, ownerId: uid(req) },
      { $pull: { offers: { _id: new ObjectId(req.params.offerId) } }, $set: { updatedAt: new Date() } }
    );
    if (!r.matchedCount) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    const doc = await col(req).findOne({ _id });
    return res.json({ success: true, item: present(doc) });
  } catch (err) {
    console.error('[procurement] removeOffer error:', err);
    return res.status(500).json({ success: false });
  }
};

exports.ensureIndexes = ensureIndexes;
