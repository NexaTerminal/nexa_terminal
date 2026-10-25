'use strict';

/**
 * Request log → user_events (kind 'api') for the admin activity timeline.
 *
 * Records method, route (ids collapsed to :id), status and duration for every
 * API request made with a valid Bearer JWT. Never records bodies or query values.
 * Background polling (same user + method + route repeated within POLL_WINDOW_MS)
 * is recorded once, so 15–60 s refresh loops don't flood the log.
 */

const jwt = require('jsonwebtoken');
const UserEventsService = require('../services/userEventsService');

const POLL_WINDOW_MS = 60 * 1000;
const SKIP = [/^\/api\/csrf-token/, /^\/api\/health/, /^\/api\/activity\//, /^\/api\/public\//];

// Collapse ids so the same endpoint groups together: ObjectIds, UUIDs, numbers, long slugs-with-digits.
function normalizeRoute(url) {
  return url.split('?')[0]
    .replace(/\/[0-9a-f]{24}(?=\/|$)/gi, '/:id')
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:n')
    .slice(0, 200);
}

const recent = new Map(); // `${userId} ${method} ${route}` → last logged ms
function isRepeat(key, now) {
  const last = recent.get(key);
  recent.set(key, now);
  if (recent.size > 5000) { // cheap bound: drop the oldest half
    let i = 0;
    for (const k of recent.keys()) { if (i++ > 2500) break; recent.delete(k); }
  }
  return last !== undefined && now - last < POLL_WINDOW_MS;
}

function userIdFrom(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ') || !process.env.JWT_SECRET) return null;
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET)?.id || null; } catch { return null; }
}

module.exports = function requestLog(req, res, next) {
  if (!req.originalUrl.startsWith('/api/') || req.method === 'OPTIONS' || SKIP.some((r) => r.test(req.originalUrl))) {
    return next();
  }
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const db = req.app.locals.db;
    const userId = userIdFrom(req);
    if (!db || !userId) return;
    const route = normalizeRoute(req.originalUrl);
    if (req.method === 'GET' && isRepeat(`${userId} ${route}`, Date.now())) return;
    const durationMs = Math.round(Number(process.hrtime.bigint() - started) / 1e6);
    new UserEventsService(db)
      .addApiEvent(userId, { method: req.method, route, status: res.statusCode, durationMs })
      .catch((err) => console.warn('[requestLog] write failed:', err.message));
  });
  next();
};

module.exports.normalizeRoute = normalizeRoute;
