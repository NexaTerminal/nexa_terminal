// Продажна инка (Sales Funnel) — data layer (tasks/todo.md 2026-07-14).
//
// Durable `sales_deals` collection (native driver). Every deal belongs to one
// user (same ownership model as contracts). Stage moves append to
// stageHistory so later versions can compute conversion velocity; `wonAt` is
// stamped on the won transition so "won this month" is a plain filter.

const { ObjectId } = require('mongodb');

const COLLECTION = 'sales_deals';

// Funnel order matters — the UI renders these top-to-bottom, widest first.
const OPEN_STAGES = ['potential', 'contacted', 'offer', 'negotiation'];
const OUTCOME_STAGES = ['won', 'lost'];
const STAGES = [...OPEN_STAGES, ...OUTCOME_STAGES];

const MAX_NOTE = 2000;
const MAX_NAME = 200;
// Far-future sentinel so deals without a follow-up date sort last, not first
// (Mongo sorts null/missing before dates on ascending sort).
const NO_ACTION_SENTINEL = new Date('9999-01-01');

const toId = (v) => (v instanceof ObjectId ? v : new ObjectId(v));
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cleanStr = (v, max) => {
  if (v === undefined || v === null) return undefined;
  return String(v).trim().slice(0, max);
};

const cleanDate = (v) => {
  if (v === undefined) return undefined; // field absent — leave untouched
  if (v === null || v === '') return null; // explicit clear
  const d = new Date(v);
  return isNaN(d) ? null : d;
};

const cleanValue = (v) => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

class SalesDealsService {
  constructor(db) {
    this.col = db.collection(COLLECTION);
  }

  async ensureIndexes() {
    await this.col.createIndex({ userId: 1, stage: 1, updatedAt: -1 });
    await this.col.createIndex({ userId: 1, nextActionAt: 1 });
  }

  /** Pick and sanitize only the editable fields present on `input`. */
  sanitize(input = {}) {
    const out = {};
    const name = cleanStr(input.name, MAX_NAME);
    if (name !== undefined) out.name = name;

    if (input.contact !== undefined) {
      const c = input.contact || {};
      out.contact = {
        person: cleanStr(c.person, 120) || '',
        email: cleanStr(c.email, 200) || '',
        phone: cleanStr(c.phone, 60) || ''
      };
    }
    const value = cleanValue(input.value);
    if (value !== undefined) out.value = value;

    const note = cleanStr(input.note, MAX_NOTE);
    if (note !== undefined) out.note = note;

    const nextActionAt = cleanDate(input.nextActionAt);
    if (nextActionAt !== undefined) out.nextActionAt = nextActionAt;

    const nextActionNote = cleanStr(input.nextActionNote, 300);
    if (nextActionNote !== undefined) out.nextActionNote = nextActionNote;

    return out;
  }

  async create(userId, input) {
    const now = new Date();
    const stage = STAGES.includes(input.stage) ? input.stage : 'potential';
    const doc = {
      contact: { person: '', email: '', phone: '' },
      value: null,
      note: '',
      nextActionAt: null,
      nextActionNote: '',
      ...this.sanitize(input),
      userId: toId(userId),
      stage,
      stageHistory: [{ stage, at: now }],
      wonAt: stage === 'won' ? now : null,
      lostReason: null,
      createdAt: now,
      updatedAt: now
    };
    const { insertedId } = await this.col.insertOne(doc);
    return { ...doc, _id: insertedId };
  }

  /** Deals for one stage (or all), follow-ups due first, no-date last. */
  async list(userId, { stage, q } = {}) {
    const filter = { userId: toId(userId) };
    if (stage && STAGES.includes(stage)) filter.stage = stage;
    if (q && String(q).trim()) filter.name = { $regex: escapeRegex(String(q).trim()), $options: 'i' };

    return this.col.aggregate([
      { $match: filter },
      { $addFields: { _sortAction: { $ifNull: ['$nextActionAt', NO_ACTION_SENTINEL] } } },
      { $sort: { _sortAction: 1, updatedAt: -1 } },
      { $project: { _sortAction: 0 } },
      { $limit: 500 }
    ]).toArray();
  }

  async update(userId, id, input) {
    const $set = this.sanitize(input);
    if ($set.name === '') delete $set.name; // never blank out the name
    $set.updatedAt = new Date();
    const r = await this.col.findOneAndUpdate(
      { _id: toId(id), userId: toId(userId) },
      { $set },
      { returnDocument: 'after' }
    );
    return r.value || null;
  }

  /** Move a deal through the funnel; won stamps wonAt, lost keeps a reason. */
  async setStage(userId, id, stage, lostReason) {
    if (!STAGES.includes(stage)) return null;
    const now = new Date();
    const $set = {
      stage,
      updatedAt: now,
      lostReason: stage === 'lost' ? (cleanStr(lostReason, 300) || '') : null
    };
    if (stage === 'won') $set.wonAt = now;
    const r = await this.col.findOneAndUpdate(
      { _id: toId(id), userId: toId(userId) },
      { $set, $push: { stageHistory: { stage, at: now } } },
      { returnDocument: 'after' }
    );
    return r.value || null;
  }

  async remove(userId, id) {
    const { deletedCount } = await this.col.deleteOne({ _id: toId(id), userId: toId(userId) });
    return deletedCount === 1;
  }

  /** Everything the funnel header needs in one call. */
  async summary(userId) {
    const uid = toId(userId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [byStage, overdue, wonMonth] = await Promise.all([
      this.col.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: { $ifNull: ['$value', 0] } } } }
      ]).toArray(),
      this.col.countDocuments({ userId: uid, stage: { $in: OPEN_STAGES }, nextActionAt: { $ne: null, $lt: now } }),
      this.col.aggregate([
        { $match: { userId: uid, stage: 'won', wonAt: { $gte: monthStart } } },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: { $ifNull: ['$value', 0] } } } }
      ]).toArray()
    ]);

    const stages = {};
    for (const s of STAGES) stages[s] = { count: 0, value: 0 };
    for (const row of byStage) {
      if (stages[row._id]) stages[row._id] = { count: row.count, value: row.value };
    }
    return {
      stages,
      overdue,
      wonThisMonth: wonMonth[0] ? { count: wonMonth[0].count, value: wonMonth[0].value } : { count: 0, value: 0 }
    };
  }
}

module.exports = SalesDealsService;
module.exports.STAGES = STAGES;
module.exports.OPEN_STAGES = OPEN_STAGES;
