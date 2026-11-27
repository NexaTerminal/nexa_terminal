// „Објави" — structured company posts (tasks/sales-networking-pivot-plan.md, Phase 3).
//
// Deliberately limited: three types, fixed fields (mostly selects), no free
// links or contacts in the text, 1 active post per type, 2 new posts a week,
// every post expires. Posts appear in the Terminal feed and on the company's
// one-pager („Актуелно"). Collection: `company_posts` (native driver).

const { ObjectId } = require('mongodb');

const COLLECTION = 'company_posts';
const DAY = 86400000;

const TYPES = ['offer', 'seeking', 'news'];
const BENEFITS = { discount: 'Попуст', free_delivery: 'Бесплатна испорака', bundle: 'Пакет', trial: 'Пробен период' };
const AUDIENCES = { all: 'За сите', business: 'За фирми', consumers: 'За граѓани' };
const NEWS_KINDS = { product: 'Нов производ / услуга', location: 'Нова локација', partnership: 'Нова соработка', hiring: 'Вработуваме' };
const SEEK_CATEGORIES = [
  'Сметководство', 'Правни услуги', 'Превоз и логистика', 'Печатење и пакување', 'ИТ и веб',
  'Маркетинг и дизајн', 'Суровини и материјали', 'Опрема и машини', 'Деловен простор',
  'Чистење и одржување', 'Градежни работи', 'Храна и пијалоци', 'Осигурување', 'Друго',
];
const LIMITS = { activePerType: 1, perWeek: 2, offerDays: 60, seekingDays: 30, newsDays: 30, reportsToHide: 3 };

// No links, e-mails or phone numbers in post text — contact goes through the
// company page / Nexa, which keeps the network clean and the posts structured.
const CONTACT_RE = /(https?:\/\/|www\.|\b[\w-]+\.(mk|com|net|org|eu|io)\b|@|(\+?\d[\d\s\-/().]{6,}\d))/i;

const oid = (v) => (v instanceof ObjectId ? v : new ObjectId(String(v)));
const str = (v, max) => (v === undefined || v === null ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, max));
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

/** Validate + normalise the fixed fields of one type. → { fields, title, expiresAt } | { error } */
function buildPost(type, input = {}, now = new Date()) {
  if (!TYPES.includes(type)) return { error: 'Изберете тип на објава.' };
  const f = {};
  let title = '';
  let maxDays;
  const textFields = [];

  if (type === 'offer') {
    f.item = str(input.item, 60);
    f.benefit = BENEFITS[input.benefit] ? input.benefit : null;
    f.audience = AUDIENCES[input.audience] ? input.audience : 'all';
    f.city = str(input.city, 40);
    if (!f.item) return { error: 'Внесете за кој производ или услуга е понудата.' };
    if (!f.benefit) return { error: 'Изберете каква е понудата.' };
    if (f.benefit === 'discount') {
      const pct = Math.round(Number(input.value));
      if (!(pct >= 5 && pct <= 90)) return { error: 'Попустот треба да е меѓу 5% и 90%.' };
      f.value = String(pct);
      title = `−${pct}% на ${f.item}`;
    } else if (f.benefit === 'free_delivery') {
      f.value = '';
      title = `Бесплатна испорака: ${f.item}`;
    } else {
      f.value = str(input.value, 60);
      if (!f.value) return { error: f.benefit === 'bundle' ? 'Опишете го пакетот (пр. „3 + 1 гратис").' : 'Внесете колку трае пробниот период.' };
      title = `${BENEFITS[f.benefit]}: ${f.item} — ${f.value}`;
    }
    textFields.push(f.item, f.value, f.city);
    maxDays = LIMITS.offerDays;
  }

  if (type === 'seeking') {
    f.category = SEEK_CATEGORIES.includes(input.category) ? input.category : null;
    f.what = str(input.what, 80);
    f.quantity = str(input.quantity, 60);
    f.city = str(input.city, 40);
    if (!f.category) return { error: 'Изберете категорија.' };
    if (!f.what || f.what.length < 5) return { error: 'Опишете што барате (најмалку 5 знаци).' };
    title = f.what;
    textFields.push(f.what, f.quantity, f.city);
    maxDays = LIMITS.seekingDays;
  }

  if (type === 'news') {
    f.kind = NEWS_KINDS[input.kind] ? input.kind : null;
    f.text = str(input.text, 200);
    if (!f.kind) return { error: 'Изберете каква е новоста.' };
    if (!f.text || f.text.length < 10) return { error: 'Напишете ја новоста (најмалку 10 знаци).' };
    title = NEWS_KINDS[f.kind];
    textFields.push(f.text);
    maxDays = LIMITS.newsDays;
  }

  if (textFields.some((t) => t && CONTACT_RE.test(t))) {
    return { error: 'Без линкови, е-пошта или телефон во текстот — контактот оди преку Вашата страница.' };
  }

  // Expiry: the chosen date (offer: valid until, seeking: deadline), capped.
  const cap = endOfDay(new Date(now.getTime() + maxDays * DAY));
  let expiresAt = cap;
  if (type !== 'news' && input.until) {
    const d = new Date(input.until);
    if (isNaN(d) || startOfDay(d) < startOfDay(now)) return { error: 'Датумот мора да е денес или подоцна.' };
    expiresAt = endOfDay(d) > cap ? cap : endOfDay(d);
  }
  return { fields: f, title: title.slice(0, 140), expiresAt };
}

class CompanyPostsService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
  }

  async ensureIndexes() {
    await this.col.createIndex({ status: 1, expiresAt: -1, createdAt: -1 });
    await this.col.createIndex({ userId: 1, createdAt: -1 });
  }

  liveFilter(now = new Date()) {
    return { status: 'active', expiresAt: { $gt: now } };
  }

  /** Can this user post at all? → null | error message */
  async eligibility(userId) {
    const u = await this.db.collection('users').findOne(
      { _id: oid(userId) },
      { projection: { publicProfile: 1, termsAcceptances: 1 } }
    );
    const p = u?.publicProfile || {};
    if (!p.slug || !p.displayName || !p.headline || !p.avatarUrl) {
      return 'За да објавувате, пополнете ја „Моја страница": име, кратко што работите и лого.';
    }
    if (!(u.termsAcceptances || []).some((t) => t.feature === 'companyPost')) {
      return 'Прифатете ги условите за објави.';
    }
    return null;
  }

  async quota(userId, now = new Date()) {
    const uid = oid(userId);
    const [active, week] = await Promise.all([
      this.col.find({ userId: uid, ...this.liveFilter(now) }).project({ type: 1 }).toArray(),
      this.col.countDocuments({ userId: uid, createdAt: { $gte: new Date(now.getTime() - 7 * DAY) } }),
    ]);
    return {
      activeTypes: active.map((a) => a.type),
      weekUsed: week,
      weekLimit: LIMITS.perWeek,
    };
  }

  async create(userId, type, input) {
    const err = await this.eligibility(userId);
    if (err) return { error: err, code: 'eligibility' };
    const built = buildPost(type, input);
    if (built.error) return { error: built.error };
    const q = await this.quota(userId);
    if (q.activeTypes.includes(type)) return { error: 'Веќе имате активна објава од овој тип. Завршете ја или избришете ја пред нова.' };
    if (q.weekUsed >= LIMITS.perWeek) return { error: `Најмногу ${LIMITS.perWeek} нови објави неделно. Обидете се повторно за неколку дена.` };
    const now = new Date();
    const doc = {
      userId: oid(userId), type, fields: built.fields, title: built.title,
      status: 'active', expiresAt: built.expiresAt, createdAt: now, updatedAt: now,
      reports: [], interested: [],
    };
    const { insertedId } = await this.col.insertOne(doc);
    return { post: { ...doc, _id: insertedId } };
  }

  /** Owner ends a post early (kept for the weekly count, never shown again). */
  async end(userId, id) {
    const r = await this.col.updateOne(
      { _id: oid(id), userId: oid(userId), status: 'active' },
      { $set: { status: 'ended', updatedAt: new Date() } }
    );
    return r.modifiedCount === 1;
  }

  async mine(userId) {
    const now = new Date();
    const rows = await this.col.find({ userId: oid(userId), status: { $in: ['active', 'ended', 'hidden', 'removed'] } })
      .sort({ createdAt: -1 }).limit(50).toArray();
    return rows.map((p) => ({
      _id: p._id, type: p.type, fields: p.fields, title: p.title, createdAt: p.createdAt, expiresAt: p.expiresAt,
      state: p.status === 'active' ? (p.expiresAt > now ? 'active' : 'expired') : p.status,
      interestedCount: (p.interested || []).length,
    }));
  }

  /** Authors for a set of posts: page name, slug, logo, city. */
  async authors(posts) {
    const ids = [...new Set(posts.map((p) => String(p.userId)))].map(oid);
    if (!ids.length) return new Map();
    const users = await this.db.collection('users').find(
      { _id: { $in: ids } },
      { projection: { 'publicProfile.slug': 1, 'publicProfile.displayName': 1, 'publicProfile.avatarUrl': 1, 'publicProfile.city': 1, 'publicProfile.headline': 1 } }
    ).toArray();
    return new Map(users.map((u) => [String(u._id), {
      slug: u.publicProfile?.slug || '', name: u.publicProfile?.displayName || '', logo: u.publicProfile?.avatarUrl || '',
      city: u.publicProfile?.city || '', headline: u.publicProfile?.headline || '',
    }]));
  }

  toCard(p, author, viewerId) {
    const v = viewerId ? String(viewerId) : null;
    return {
      _id: p._id, type: p.type, fields: p.fields, title: p.title, createdAt: p.createdAt, expiresAt: p.expiresAt,
      author: author || null,
      mine: v ? String(p.userId) === v : false,
      interested: v ? (p.interested || []).some((x) => String(x.userId) === v) : false,
      reported: v ? (p.reports || []).some((x) => String(x.userId) === v) : false,
    };
  }

  async feed(viewerId, { limit = 20 } = {}) {
    const rows = await this.col.find(this.liveFilter()).sort({ createdAt: -1 }).limit(Math.min(limit, 50)).toArray();
    const authors = await this.authors(rows);
    return rows.filter((p) => authors.get(String(p.userId))?.slug).map((p) => this.toCard(p, authors.get(String(p.userId)), viewerId));
  }

  /** Live posts of one company (one-pager „Актуелно"). */
  async forUser(userId) {
    const rows = await this.col.find({ userId: oid(userId), ...this.liveFilter() }).sort({ createdAt: -1 }).limit(6).toArray();
    return rows.map((p) => this.toCard(p, null, null));
  }

  async findLive(id) {
    if (!ObjectId.isValid(id)) return null;
    return this.col.findOne({ _id: oid(id), ...this.liveFilter() });
  }

  async report(viewerId, id, reason) {
    const p = await this.findLive(id);
    if (!p) return { error: 'not_found' };
    if (String(p.userId) === String(viewerId)) return { error: 'own' };
    if ((p.reports || []).some((r) => String(r.userId) === String(viewerId))) return { ok: true, already: true };
    const reports = [...(p.reports || []), { userId: oid(viewerId), reason: str(reason, 200), at: new Date() }];
    const $set = { reports, updatedAt: new Date() };
    if (reports.length >= LIMITS.reportsToHide) $set.status = 'hidden';
    await this.col.updateOne({ _id: p._id }, { $set });
    return { ok: true, hidden: $set.status === 'hidden', post: p };
  }

  async markInterested(viewerId, post) {
    if ((post.interested || []).some((x) => String(x.userId) === String(viewerId))) return false;
    await this.col.updateOne({ _id: post._id }, { $push: { interested: { userId: oid(viewerId), at: new Date() } } });
    return true;
  }

  async adminRemove(id) {
    if (!ObjectId.isValid(id)) return false;
    const r = await this.col.updateOne({ _id: oid(id) }, { $set: { status: 'removed', updatedAt: new Date() } });
    return r.modifiedCount === 1;
  }

  async adminList() {
    const rows = await this.col.find({}).sort({ createdAt: -1 }).limit(200).toArray();
    const authors = await this.authors(rows);
    return rows.map((p) => ({ ...this.toCard(p, authors.get(String(p.userId)), null), status: p.status, reportCount: (p.reports || []).length }));
  }
}

module.exports = CompanyPostsService;
module.exports.buildPost = buildPost;
module.exports.TYPES = TYPES;
module.exports.BENEFITS = BENEFITS;
module.exports.AUDIENCES = AUDIENCES;
module.exports.NEWS_KINDS = NEWS_KINDS;
module.exports.SEEK_CATEGORIES = SEEK_CATEGORIES;
module.exports.LIMITS = LIMITS;
