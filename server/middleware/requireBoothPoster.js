/**
 * requireBoothPoster — gates fair-booth WRITE routes on an *active paid* plan.
 *
 * Unlike the global `subscriptionGuard` (which lets TRIAL through), the virtual
 * fair only lets paying companies post a booth — trial/preview users browse
 * read-only. Mirrors the client `canPostBooth()` predicate in lib/tier.js.
 *
 * Rules:
 *   - platform admin → allow
 *   - sub_seat       → 403 (a booth belongs to the account owner, not a seat)
 *   - active paid (status=active, unexpired) OR active grace → allow
 *   - everything else (trial, suspended, cancelled, pending, none) → 402
 *
 * Must run AFTER authenticateJWT (req.user set). Pulls SubscriptionService
 * from req.app.locals at request time, like subscriptionGuard.
 */

const { ROLES, SUBSCRIPTION_STATUSES } = require('../constants/roles');

module.exports = async function requireBoothPoster(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 'INVALID_TOKEN' });
    }

    if (user.role === ROLES.ADMIN || user.isAdmin === true) return next();

    if (user.role === ROLES.SUB_SEAT) {
      return res.status(403).json({
        success: false,
        code: 'BOOTH_OWNER_ONLY',
        message: 'Штандот го управува сопственикот на сметката, не член на тимот.'
      });
    }

    const subscriptionService = req.app.locals.subscriptionService;
    if (!subscriptionService) {
      // Service not initialized — fail closed for a paid-only write surface.
      console.warn('[requireBoothPoster] subscriptionService unavailable; denying');
      return res.status(503).json({ success: false, message: 'Service unavailable' });
    }

    const eff = await subscriptionService.effectiveStatus(user);
    const now = new Date();
    const activePaid = eff.status === SUBSCRIPTION_STATUSES.ACTIVE && eff.endsAt && new Date(eff.endsAt) > now;
    const inGrace = eff.graceEndsAt && new Date(eff.graceEndsAt) > now;

    if (activePaid || inGrace) {
      req.subscription = eff;
      return next();
    }

    return res.status(402).json({
      success: false,
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'Само претплатници со активен план можат да постават штанд на саемот.'
    });
  } catch (err) {
    console.error('[requireBoothPoster] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
