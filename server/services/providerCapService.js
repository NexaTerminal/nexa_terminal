/**
 * Provider cap service — de-merge Phase 4.
 *
 * Enforces the founding-cohort limit on how many ACTIVE Pro (admin_user)
 * providers may hold a given practice area, so routed leads are not diluted
 * across too many lawyers. Config lives in server/constants/roles.js
 * (PRACTICE_AREA_CAPS / capForArea).
 *
 * These helpers are DB-bound but side-effect free — call them at the point a
 * provider ADDS a practice area (self-serve editor or admin provisioning) to
 * decide allow / waitlist. Routing itself already picks a single assignee.
 */

const { ROLES, capForArea, PRO_GLOBAL_CAP } = require('../constants/roles');

/** Count active Pro providers that currently hold `area`. */
async function countActiveProvidersInArea(usersCol, area, { excludeUserId = null } = {}) {
  if (!usersCol || !area) return 0;
  const query = {
    role: ROLES.ADMIN_USER,
    'subscription.status': 'active',
    'superUser.practiceAreas': area
  };
  if (excludeUserId) query._id = { $ne: excludeUserId };
  return usersCol.countDocuments(query);
}

/**
 * Is `area` at (or over) its cap? A cap <= 0 means "no cap".
 * `excludeUserId` lets an existing holder re-save without counting itself.
 */
async function isAreaAtCap(usersCol, area, opts = {}) {
  const cap = capForArea(area);
  if (!Number.isFinite(cap) || cap <= 0) return false;
  const count = await countActiveProvidersInArea(usersCol, area, opts);
  return count >= cap;
}

/**
 * Given a desired set of areas, return which ones are full (would exceed cap).
 * Returns [] when all requested areas have room. Use to block/waitlist.
 */
async function fullAreas(usersCol, areas = [], opts = {}) {
  const out = [];
  for (const area of areas) {
    // eslint-disable-next-line no-await-in-loop
    if (await isAreaAtCap(usersCol, area, opts)) out.push(area);
  }
  return out;
}

/** Admin overview: [{ area, count, cap, full }] for the given areas. */
async function areaCapStatus(usersCol, areas = []) {
  const rows = [];
  for (const area of areas) {
    // eslint-disable-next-line no-await-in-loop
    const count = await countActiveProvidersInArea(usersCol, area);
    const cap = capForArea(area);
    rows.push({ area, count, cap, full: cap > 0 && count >= cap });
  }
  return rows;
}

/** Count ALL active Pro (admin_user) lawyers, across every area (founding-20). */
async function countActivePros(usersCol, { excludeUserId = null } = {}) {
  if (!usersCol) return 0;
  const query = { role: ROLES.ADMIN_USER, 'subscription.status': 'active' };
  if (excludeUserId) query._id = { $ne: excludeUserId };
  return usersCol.countDocuments(query);
}

/**
 * Has the GLOBAL founding-cohort cap been reached? A cap <= 0 means "no cap".
 * `excludeUserId` lets an already-active provider re-activate without self-count.
 */
async function isGlobalCapReached(usersCol, { excludeUserId = null } = {}) {
  if (!Number.isFinite(PRO_GLOBAL_CAP) || PRO_GLOBAL_CAP <= 0) return false;
  const count = await countActivePros(usersCol, { excludeUserId });
  return count >= PRO_GLOBAL_CAP;
}

/**
 * Admin overview of the founding-20: { total, cap, full, byCity: [{ city, count }] }.
 * Density is managed by city, so the breakdown groups active Pros by their
 * declared `superUser.cities` (a Pro may appear in several cities).
 */
async function globalCapStatus(usersCol) {
  if (!usersCol) return { total: 0, cap: PRO_GLOBAL_CAP, full: false, byCity: [] };
  const total = await countActivePros(usersCol);
  const agg = await usersCol.aggregate([
    { $match: { role: ROLES.ADMIN_USER, 'subscription.status': 'active' } },
    { $unwind: { path: '$superUser.cities', preserveNullAndEmptyArrays: true } },
    { $group: { _id: { $ifNull: ['$superUser.cities', '—'] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  const byCity = agg.map((r) => ({ city: r._id, count: r.count }));
  return {
    total,
    cap: PRO_GLOBAL_CAP,
    full: PRO_GLOBAL_CAP > 0 && total >= PRO_GLOBAL_CAP,
    byCity
  };
}

module.exports = {
  countActiveProvidersInArea,
  isAreaAtCap,
  fullAreas,
  areaCapStatus,
  countActivePros,
  isGlobalCapReached,
  globalCapStatus
};
