/**
 * subSeatGuard — blocks sub-seat users from routes they are not allowed to use.
 *
 * Designed to be mounted at the app.use() level BEFORE the route module's own
 * authenticateJWT. Therefore it is "soft": it only blocks when req.user is
 * already populated (e.g. by earlier global JWT middleware) AND is a sub_seat.
 * Otherwise it passes through, letting the route module run its own auth.
 *
 * The downstream `authenticateJWT` in each route file is still responsible
 * for rejecting unauthenticated requests with 401. This middleware is the
 * additional gate that hides whole feature surfaces from team members.
 *
 * Mount sites (server.js):
 *   /api/marketplace, /api/social, /api/offer-requests
 */

const { ROLES } = require('../constants/roles');
const passport = require('passport');

function softJwtPeek(req) {
  // If req.user is already attached (some upstream auth ran), use it as-is.
  // Otherwise try to passport-peek the JWT without committing the request.
  return new Promise((resolve) => {
    if (req.user) return resolve(req.user);
    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (err || !user) return resolve(null);
      resolve(user);
    })(req, {}, () => resolve(null));
  });
}

module.exports = async function subSeatGuard(req, res, next) {
  try {
    const user = await softJwtPeek(req);
    if (user && user.role === ROLES.SUB_SEAT) {
      return res.status(403).json({
        success: false,
        code: 'SUB_SEAT_FORBIDDEN',
        message: 'Оваа функција не е достапна за тимски сметки / This feature is not available for team accounts'
      });
    }
    return next();
  } catch (err) {
    // On any error in the peek, defer to the route's own auth instead of blocking.
    return next();
  }
};
