/**
 * requireSeatManager — gates sub-user (seat) management routes.
 * Runs after `authenticateJWT`.
 *
 * Both tiers manage sub-users, but of different types (enforced in
 * SubSeatService by parent role):
 *   - Basic (standard_user) → co-worker seats
 *   - Pro   (admin_user)    → client-company seats
 * Platform admins (Martin) pass through for support.
 *
 * Sub-seats, locked/regular accounts, and everyone else are rejected.
 */

const { ROLES } = require('../constants/roles');

module.exports = function requireSeatManager(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Не сте автентифицирани' });
  }
  if (req.user.role === ROLES.ADMIN || req.user.isAdmin === true) return next();
  if (req.user.role === ROLES.ADMIN_USER || req.user.role === ROLES.STANDARD_USER) return next();
  return res.status(403).json({
    success: false,
    code: 'SEAT_MANAGER_REQUIRED',
    message: 'Само сопственици на сметка можат да управуваат со под-корисници / Account owners only'
  });
};
