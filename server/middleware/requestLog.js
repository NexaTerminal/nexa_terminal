'use strict';

/**
 * Request log → user_events (kind 'api') for the admin activity timeline.
 *
 * Records method, route (ids collapsed to :id), status and duration for every
 * state-changing API request (POST/PUT/PATCH/DELETE) made with a valid Bearer
 * JWT — the user's actions. Reads (GET) aren't logged: what the user looked at
 * is already captured client-side as page views with active time. Never
 * records bodies or query values.
 */

const jwt = require('jsonwebtoken');
const UserEventsService = require('../services/userEventsService');

const SKIP = [/^\/api\/csrf-token/, /^\/api\/health/, /^\/api\/activity\//, /^\/api\/public\//, /^\/api\/my-data\//];

// Collapse ids so the same endpoint groups together: ObjectIds, UUIDs, numbers, long slugs-with-digits.
function normalizeRoute(url) {
  return url.split('?')[0]
    .replace(/\/[0-9a-f]{24}(?=\/|$)/gi, '/:id')
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:n')
    .slice(0, 200);
}

function userIdFrom(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ') || !process.env.JWT_SECRET) return null;
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET)?.id || null; } catch { return null; }
}

module.exports = function requestLog(req, res, next) {
  if (!req.originalUrl.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    || SKIP.some((r) => r.test(req.originalUrl))) {
    return next();
  }
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const db = req.app.locals.db;
    const userId = userIdFrom(req);
    if (!db || !userId) return;
    const route = normalizeRoute(req.originalUrl);
    const durationMs = Math.round(Number(process.hrtime.bigint() - started) / 1e6);
    new UserEventsService(db)
      .addApiEvent(userId, { method: req.method, route, status: res.statusCode, durationMs })
      .catch((err) => console.warn('[requestLog] write failed:', err.message));
  });
  next();
};

module.exports.normalizeRoute = normalizeRoute;
