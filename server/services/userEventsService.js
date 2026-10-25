'use strict';

/**
 * user_events — fine-grained per-user activity for the admin timeline
 * („Активност (хронолошки)"): page views (+ active time, scroll depth), clicks,
 * API requests and session starts. Bodies / form values are never stored.
 *
 * Retention: TTL index removes events after RETENTION_DAYS.
 */

const { ObjectId } = require('mongodb');

const COLLECTION = 'user_events';
const RETENTION_DAYS = 90;
const KINDS = ['session_start', 'page_view', 'click', 'api'];

let indexesReady = null;
function ensureIndexes(db) {
  if (!indexesReady) {
    const col = db.collection(COLLECTION);
    indexesReady = Promise.all([
      col.createIndex({ userId: 1, at: -1 }),
      col.createIndex({ at: 1 }, { expireAfterSeconds: RETENTION_DAYS * 86400 }),
    ]).catch((err) => { indexesReady = null; console.warn('[user_events] index error:', err.message); });
  }
  return indexesReady;
}

const toObjectId = (v) => (v instanceof ObjectId ? v : (ObjectId.isValid(String(v)) ? new ObjectId(String(v)) : null));
const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : undefined);
const num = (v, max) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(Number(v), max)) : undefined);

// Whitelist + clamp one client-sent event (never trust the browser's shape).
function sanitizeClientEvent(e, userId, now) {
  if (!e || !KINDS.includes(e.kind) || e.kind === 'api') return null;
  const at = new Date(e.at);
  const atOk = !Number.isNaN(at.getTime()) && at <= now && now - at < 24 * 3600 * 1000;
  return {
    userId,
    kind: e.kind,
    at: atOk ? at : now,
    sessionId: clip(e.sessionId, 40),
    path: clip(e.path, 300),
    title: clip(e.title, 120),
    label: clip(e.label, 80),
    target: clip(e.target, 300),
    activeMs: num(e.activeMs, 6 * 3600 * 1000),
    scrollPct: num(e.scrollPct, 100),
  };
}

const prune = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

class UserEventsService {
  constructor(db) {
    this.db = db;
    this.col = db.collection(COLLECTION);
    ensureIndexes(db);
  }

  async addClientEvents(userId, events) {
    const uid = toObjectId(userId);
    if (!uid || !Array.isArray(events)) return 0;
    const now = new Date();
    const docs = events.slice(0, 50).map((e) => sanitizeClientEvent(e, uid, now)).filter(Boolean).map(prune);
    if (docs.length) await this.col.insertMany(docs, { ordered: false });
    return docs.length;
  }

  addApiEvent(userId, { method, route, status, durationMs }) {
    const uid = toObjectId(userId);
    if (!uid) return Promise.resolve();
    return this.col.insertOne({ userId: uid, kind: 'api', at: new Date(), method, route, status, durationMs });
  }

  // Newest-first page of events before `before`.
  async page(userId, { before, kinds, limit = 150 } = {}) {
    const uid = toObjectId(userId);
    if (!uid) return [];
    const q = { userId: uid };
    if (before) q.at = { $lt: new Date(before) };
    if (kinds && kinds.length) q.kind = { $in: kinds.filter((k) => KINDS.includes(k)) };
    return this.col.find(q, { projection: { userId: 0 } }).sort({ at: -1 }).limit(Math.min(limit, 500)).toArray();
  }

  // Time spent + sessions + top pages (from page_view.activeMs).
  async summary(userId) {
    const uid = toObjectId(userId);
    if (!uid) return null;
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 86400 * 1000);
    const [totals] = await this.col.aggregate([
      { $match: { userId: uid } },
      { $group: {
        _id: null,
        totalMs: { $sum: { $ifNull: ['$activeMs', 0] } },
        todayMs: { $sum: { $cond: [{ $gte: ['$at', startOfDay] }, { $ifNull: ['$activeMs', 0] }, 0] } },
        weekMs: { $sum: { $cond: [{ $gte: ['$at', weekAgo] }, { $ifNull: ['$activeMs', 0] }, 0] } },
        sessions: { $sum: { $cond: [{ $eq: ['$kind', 'session_start'] }, 1, 0] } },
        pageViews: { $sum: { $cond: [{ $eq: ['$kind', 'page_view'] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ['$kind', 'click'] }, 1, 0] } },
        requests: { $sum: { $cond: [{ $eq: ['$kind', 'api'] }, 1, 0] } },
        firstAt: { $min: '$at' },
        lastAt: { $max: '$at' },
      } },
    ]).toArray();
    const topPages = await this.col.aggregate([
      { $match: { userId: uid, kind: 'page_view' } },
      { $group: { _id: '$path', ms: { $sum: { $ifNull: ['$activeMs', 0] } }, views: { $sum: 1 }, title: { $last: '$title' } } },
      { $sort: { ms: -1 } },
      { $limit: 5 },
    ]).toArray();
    const t = totals || {};
    return {
      totalMs: t.totalMs || 0, todayMs: t.todayMs || 0, weekMs: t.weekMs || 0,
      sessions: t.sessions || 0, pageViews: t.pageViews || 0, clicks: t.clicks || 0, requests: t.requests || 0,
      firstAt: t.firstAt || null, lastAt: t.lastAt || null,
      topPages: topPages.map((p) => ({ path: p._id, title: p.title || null, ms: p.ms, views: p.views })),
      retentionDays: RETENTION_DAYS,
    };
  }
}

module.exports = UserEventsService;
module.exports.RETENTION_DAYS = RETENTION_DAYS;
module.exports.KINDS = KINDS;
