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

const { ROLES, capForArea } = require('../constants/roles');

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

module.exports = {
  countActiveProvidersInArea,
  isAreaAtCap,
  fullAreas,
  areaCapStatus
};
