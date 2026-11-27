// „Понуда" — quotes that sell (tasks/sales-networking-pivot-plan.md, Phase 1).
//
// Durable `sales_quotes` collection (native driver). A quote belongs to one
// user, optionally to one deal of the Продажна инка. The client opens it on a
// public link (nexa.mk/ponuda/:token) and accepts / declines / asks a question;
// every step is recorded in `events` and moves the linked deal.
//
// Private data never leaves the owner API: per-item `cost` (margin) and the
// owner ids are stripped by toPublic().

const crypto = require('crypto');
const { ObjectId } = require('mongodb');

const COLLECTION = 'sales_quotes';
const COUNTERS = 'sales_quote_counters';

const STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'declined'];
const CURRENCIES = ['MKD', 'EUR'];
const VAT_RATES = [18, 10, 5, 0];
const MAX_ITEMS = 40;
// Deal values in the funnel are in €; MKD quotes are converted at the
// (practically fixed) denar peg when they move a deal.
const MKD_PER_EUR = 61.5;

const toId = (v) => (v instanceof ObjectId ? v : new ObjectId(v));
const str = (v, max) => (v === undefined || v === null ? '' : String(v).trim().slice(0, max));
const num = (v, { min = 0, max = 1e12 } = {}) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
};
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

function cleanItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_ITEMS).map((it) => {
    const vat = Number(it?.vat);
    const cost = it?.cost === '' || it?.cost === null || it?.cost === undefined ? null : num(it.cost);
    return {
      name: str(it?.name, 200),
      description: str(it?.description, 400),
      qty: num(it?.qty, { min: 0, max: 1e7 }) ?? 1,
      unit: str(it?.unit, 20) || 'ком.',
      price: num(it?.price) ?? 0,
      vat: VAT_RATES.includes(vat) ? vat : 18,
      cost,
    };
  }).filter((it) => it.name);
}

/** Totals, VAT breakdown and (owner-only) margin from the items. */
function computeTotals(items, discountPct = 0) {
  const d = Math.min(100, Math.max(0, Number(discountPct) || 0)) / 100;
  let subtotal = 0;
  let net = 0;
  const vatBy = {};
  let costKnownNet = 0;
  let costKnown = 0;
  let costLines = 0;
  for (const it of items) {
    const line = it.qty * it.price;
    const lineNet = line * (1 - d);
    subtotal += line;
    net += lineNet;
    vatBy[it.vat] = (vatBy[it.vat] || 0) + lineNet * (it.vat / 100);
    if (it.cost !== null && it.cost !== undefined) {
      costKnownNet += lineNet;
      costKnown += it.qty * it.cost;
      costLines += 1;
    }
  }
  const vat = Object.values(vatBy).reduce((a, b) => a + b, 0);
  const margin = costLines && costKnownNet > 0
    ? {
        lines: costLines,
        allLines: costLines === items.length,
        cost: round2(costKnown),
        profit: round2(costKnownNet - costKnown),
        pct: round2(((costKnownNet - costKnown) / costKnownNet) * 100),
      }
    : null;
  return {
    subtotal: round2(subtotal),
    discount: round2(subtotal - net),
    net: round2(net),
    vatBreakdown: Object.keys(vatBy).map(Number).sort((a, b) => b - a)
      .map((rate) => ({ rate, amount: round2(vatBy[rate]) })),
    vat: round2(vat),
    total: round2(net + vat),
    margin,
  };
}

/** Derived status: a sent/viewed quote past its validity date is "expired". */
function effectiveStatus(q, now = new Date()) {
  if ((q.status === 'sent' || q.status === 'viewed') && q.validUntil && startOfDay(q.validUntil) < startOfDay(now)) {
    return 'expired';
  }
  return q.status;
}

function toEur(amount, currency) {
  return currency === 'EUR' ? round2(amount) : round2(amount / MKD_PER_EUR);
}

class SalesQuotesService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    this.counters = db.collection(COUNTERS);
    this.deals = db.collection('sales_deals');
  }

  async ensureIndexes() {
    await this.col.createIndex({ token: 1 }, { unique: true });
    await this.col.createIndex({ userId: 1, updatedAt: -1 });
    await this.col.createIndex({ userId: 1, dealId: 1 });
  }

  /** ПОН-2026-001 — per company, per year. */
  async nextNumber(userId) {
    const year = new Date().getFullYear();
    const r = await this.counters.findOneAndUpdate(
      { _id: `${String(userId)}:${year}` },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const seq = r.value?.seq || 1;
    return `ПОН-${year}-${String(seq).padStart(3, '0')}`;
  }

  /** The issuing company as the client will see it (snapshotted on send). */
  async issuerFor(userId) {
    const u = await this.db.collection('users').findOne(
      { _id: toId(userId) },
      { projection: { email: 1, companyInfo: 1, publicProfile: 1 } }
    );
    const ci = u?.companyInfo || {};
    const p = u?.publicProfile || {};
    return {
      name: str(ci.companyName || p.displayName, 200),
      address: str(ci.address || ci.companyAddress, 300),
      city: str(ci.city || p.city, 80),
      taxNumber: str(ci.companyTaxNumber || ci.taxNumber, 40),
      email: str(p.contactEmail || ci.email || u?.email, 150),
      phone: str(p.phone || ci.phone, 40),
      website: str(p.website || ci.website, 200),
      logoUrl: str(p.avatarUrl, 600),
      slug: str(p.slug, 120),
      offers: Array.isArray(p.offers) ? p.offers.slice(0, 20) : [],
    };
  }

  /** Editable fields only. */
  sanitize(input = {}) {
    const out = {};
    if (input.client !== undefined) {
      const c = input.client || {};
      const email = str(c.email, 150);
      out.client = {
        name: str(c.name, 200),
        person: str(c.person, 120),
        email: email && isEmail(email) ? email : '',
        phone: str(c.phone, 40),
        address: str(c.address, 300),
        taxNumber: str(c.taxNumber, 40),
      };
    }
    if (input.title !== undefined) out.title = str(input.title, 160);
    if (input.intro !== undefined) out.intro = str(input.intro, 1500);
    if (input.items !== undefined) out.items = cleanItems(input.items);
    if (input.discountPct !== undefined) out.discountPct = num(input.discountPct, { min: 0, max: 100 }) ?? 0;
    if (input.currency !== undefined) out.currency = CURRENCIES.includes(input.currency) ? input.currency : 'MKD';
    if (input.validUntil !== undefined) {
      const d = input.validUntil ? new Date(input.validUntil) : null;
      out.validUntil = d && !isNaN(d) ? d : null;
    }
    if (input.paymentTerms !== undefined) out.paymentTerms = str(input.paymentTerms, 300);
    if (input.deliveryTerms !== undefined) out.deliveryTerms = str(input.deliveryTerms, 300);
    if (input.note !== undefined) out.note = str(input.note, 1500);
    return out;
  }

  withTotals(q) {
    if (!q) return q;
    return { ...q, totals: computeTotals(q.items || [], q.discountPct), statusNow: effectiveStatus(q) };
  }

  async create(userId, input = {}) {
    const now = new Date();
    let client = { name: '', person: '', email: '', phone: '', address: '', taxNumber: '' };
    let dealId = null;
    if (input.dealId && ObjectId.isValid(input.dealId)) {
      const deal = await this.deals.findOne({ _id: toId(input.dealId), userId: toId(userId) });
      if (deal) {
        dealId = deal._id;
        client = { ...client, name: deal.name || '', person: deal.contact?.person || '',
          email: deal.contact?.email || '', phone: deal.contact?.phone || '' };
      }
    }
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 15);
    const doc = {
      title: '',
      intro: '',
      items: [],
      discountPct: 0,
      currency: 'MKD',
      validUntil,
      paymentTerms: 'Авансно, во рок од 7 дена од прифаќање',
      deliveryTerms: '',
      note: '',
      ...this.sanitize(input),
      client,
      ...(input.client ? { client: this.sanitize({ client: input.client }).client } : {}),
      userId: toId(userId),
      dealId,
      number: await this.nextNumber(userId),
      token: crypto.randomBytes(18).toString('base64url'),
      status: 'draft',
      issuer: null,
      events: [{ type: 'created', at: now }],
      viewCount: 0,
      firstViewedAt: null,
      lastViewedAt: null,
      sentAt: null,
      response: null,
      createdAt: now,
      updatedAt: now,
    };
    const { insertedId } = await this.col.insertOne(doc);
    return this.withTotals({ ...doc, _id: insertedId });
  }

  async get(userId, id) {
    const q = await this.col.findOne({ _id: toId(id), userId: toId(userId) });
    return this.withTotals(q);
  }

  /** Compact list (no items) for the quotes page and the funnel badges. */
  async list(userId, { dealId } = {}) {
    const filter = { userId: toId(userId) };
    if (dealId && ObjectId.isValid(dealId)) filter.dealId = toId(dealId);
    const rows = await this.col.find(filter).sort({ updatedAt: -1 }).limit(300).toArray();
    return rows.map((q) => {
      const t = computeTotals(q.items || [], q.discountPct);
      return {
        _id: q._id, number: q.number, title: q.title, client: { name: q.client?.name || '' },
        dealId: q.dealId, status: q.status, statusNow: effectiveStatus(q), currency: q.currency,
        total: t.total, net: t.net, validUntil: q.validUntil, sentAt: q.sentAt,
        viewCount: q.viewCount || 0, firstViewedAt: q.firstViewedAt, lastViewedAt: q.lastViewedAt,
        response: q.response, token: q.status === 'draft' ? null : q.token,
        createdAt: q.createdAt, updatedAt: q.updatedAt,
      };
    });
  }

  /** Editing is allowed until the client has answered (accepted / declined). */
  async update(userId, id, input) {
    const $set = this.sanitize(input);
    $set.updatedAt = new Date();
    const r = await this.col.findOneAndUpdate(
      { _id: toId(id), userId: toId(userId), status: { $nin: ['accepted', 'declined'] } },
      { $set },
      { returnDocument: 'after' }
    );
    return this.withTotals(r.value || null);
  }

  /**
   * Mark as sent (the owner shares the link). Snapshots the issuer so later
   * profile edits don't change a quote the client already has. Moves a linked
   * deal that is still before „Испратена понуда" to that stage.
   */
  async send(userId, id) {
    const q = await this.col.findOne({ _id: toId(id), userId: toId(userId) });
    if (!q) return { error: 'not_found' };
    if (!q.items?.length) return { error: 'no_items' };
    if (!q.client?.name) return { error: 'no_client' };
    const now = new Date();
    const issuer = await this.issuerFor(userId);
    const $set = { issuer, updatedAt: now };
    const update = { $set };
    if (q.status === 'draft') {
      $set.status = 'sent';
      $set.sentAt = now;
      update.$push = { events: { type: 'sent', at: now } };
    }
    await this.col.updateOne({ _id: q._id }, update);
    if (q.dealId && q.status === 'draft') {
      const t = computeTotals(q.items, q.discountPct);
      await this.deals.updateOne(
        { _id: q.dealId, userId: toId(userId), stage: { $in: ['potential', 'contacted'] } },
        { $set: { stage: 'offer', updatedAt: now }, $push: { stageHistory: { stage: 'offer', at: now } } }
      );
      // Fill an empty deal value from the quote (net, in €).
      await this.deals.updateOne(
        { _id: q.dealId, userId: toId(userId), $or: [{ value: null }, { value: 0 }, { value: { $exists: false } }] },
        { $set: { value: toEur(t.net, q.currency) } }
      );
    }
    return { quote: await this.get(userId, id) };
  }

  /** A new draft copied from an existing quote (after an answer, or a variant). */
  async duplicate(userId, id) {
    const q = await this.col.findOne({ _id: toId(id), userId: toId(userId) });
    if (!q) return null;
    return this.create(userId, {
      dealId: q.dealId ? String(q.dealId) : undefined,
      client: q.client, title: q.title, intro: q.intro, items: q.items,
      discountPct: q.discountPct, currency: q.currency, paymentTerms: q.paymentTerms,
      deliveryTerms: q.deliveryTerms, note: q.note,
    });
  }

  async remove(userId, id) {
    const { deletedCount } = await this.col.deleteOne({ _id: toId(id), userId: toId(userId) });
    return deletedCount === 1;
  }

  // ── Public (client-facing) ────────────────────────────────────────────────

  async findByToken(token) {
    if (!token || typeof token !== 'string' || token.length > 64) return null;
    const q = await this.col.findOne({ token, status: { $ne: 'draft' } });
    return q || null;
  }

  /** What the client sees: no costs, no margin, no owner ids, no history. */
  toPublic(q) {
    const items = (q.items || []).map(({ cost, ...rest }) => rest);
    const { margin, ...totals } = computeTotals(q.items || [], q.discountPct);
    return {
      number: q.number, title: q.title, intro: q.intro, items, discountPct: q.discountPct,
      currency: q.currency, validUntil: q.validUntil, paymentTerms: q.paymentTerms,
      deliveryTerms: q.deliveryTerms, note: q.note, client: q.client, issuer: q.issuer,
      sentAt: q.sentAt, status: effectiveStatus(q), response: q.response
        ? { type: q.response.type, name: q.response.name, at: q.response.at } : null,
      totals,
    };
  }

  async recordView(q) {
    const now = new Date();
    const $set = { lastViewedAt: now };
    if (!q.firstViewedAt) $set.firstViewedAt = now;
    if (q.status === 'sent') $set.status = 'viewed';
    const update = { $set, $inc: { viewCount: 1 } };
    if (!q.firstViewedAt) update.$push = { events: { type: 'viewed', at: now } };
    await this.col.updateOne({ _id: q._id }, update);
    return !q.firstViewedAt; // true on the first open
  }

  /**
   * The client's answer. accept / decline: once, only while the quote is open
   * and valid. question: any time, capped so the link can't be used for spam.
   */
  async respond(q, { type, name, email, note }) {
    const now = new Date();
    const status = effectiveStatus(q);
    const event = { type, at: now, name: str(name, 100), email: str(email, 150), note: str(note, 1500) };
    if (type === 'question') {
      const asked = (q.events || []).filter((e) => e.type === 'question').length;
      if (asked >= 10) return { error: 'too_many' };
      await this.col.updateOne({ _id: q._id }, { $push: { events: event }, $set: { updatedAt: now } });
      return { ok: true };
    }
    if (status === 'expired') return { error: 'expired' };
    if (status === 'accepted' || status === 'declined') return { error: 'answered' };
    const newStatus = type === 'accept' ? 'accepted' : 'declined';
    const r = await this.col.updateOne(
      { _id: q._id, status: { $in: ['sent', 'viewed'] } },
      { $set: { status: newStatus, response: event, updatedAt: now }, $push: { events: event } }
    );
    if (!r.modifiedCount) return { error: 'answered' };

    if (q.dealId) {
      const t = computeTotals(q.items || [], q.discountPct);
      const $set = { updatedAt: now };
      if (type === 'accept') {
        Object.assign($set, { stage: 'won', wonAt: now, value: toEur(t.net, q.currency), lostReason: null });
      } else {
        Object.assign($set, { stage: 'lost', lostReason: event.note ? `Понуда ${q.number}: ${event.note}`.slice(0, 300) : `Понуда ${q.number} одбиена` });
      }
      await this.deals.updateOne(
        { _id: q.dealId, userId: q.userId, stage: { $nin: ['won', 'lost'] } },
        { $set, $push: { stageHistory: { stage: $set.stage, at: now } } }
      );
    }
    return { ok: true, status: newStatus };
  }
}

module.exports = SalesQuotesService;
module.exports.computeTotals = computeTotals;
module.exports.effectiveStatus = effectiveStatus;
module.exports.VAT_RATES = VAT_RATES;
module.exports.MKD_PER_EUR = MKD_PER_EUR;
