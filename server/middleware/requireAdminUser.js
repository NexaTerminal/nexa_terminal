/**
 * requireAdminUser — gates routes that only paying Admin-plan accounts can use.
 * Runs after `authenticateJWT`.
 *
 * Platform admins (Martin) ARE allowed through, so they can act on behalf
 * of any admin_user during support.
 */

const { ROLES } = require('../constants/roles');

module.exports = function requireAdminUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Не сте автентифицирани' });
  }
  if (req.user.role === ROLES.ADMIN || req.user.isAdmin === true) return next();
  if (req.user.role === ROLES.ADMIN_USER) return next();
  return res.status(403).json({
    success: false,
    code: 'ADMIN_USER_REQUIRED',
    message: 'Само корисници со Admin план можат да пристапат тука / Admin plan required'
  });
};
