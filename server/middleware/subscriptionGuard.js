/**
 * subscriptionGuard — gates feature-bearing routes on subscription status.
 *
 * Runs AFTER authentication is established somewhere upstream (each route
 * module's own authenticateJWT, or a global JWT mount).
 *
 * Two flavors:
 *
 *   const guard = require('./middleware/subscriptionGuard');
 *   // (a) Late-bound (recommended): pulls SubscriptionService from
 *   //     req.app.locals at request time. Mountable BEFORE the service exists.
 *   app.use('/api/auto-documents', guard, require('./routes/autoDocuments'));
 *
 *   // (b) Explicit binding (legacy):
 *   const buildGuard = require('./middleware/subscriptionGuard').build;
 *   app.use('/api/foo', buildGuard(subscriptionService), require('./routes/foo'));
 *
 * Behavior:
 *   - If req.user is not set (no JWT yet), pass through. Downstream auth still
 *     runs. Soft on purpose — the guard isn't an auth gate.
 *   - Platform admin (Martin) bypasses.
 *   - On suspended / pending / cancelled (no grace): returns 402 with
 *     code SUBSCRIPTION_* so the React client can show the gate modal.
 */

const { SUBSCRIPTION_STATUSES, ROLES } = require('../constants/roles');
const passport = require('passport');

function resolveUser(req) {
  // If req.user is already attached, use it. Otherwise try to peek the JWT
  // softly — passport-authenticate with a no-op next so we don't commit.
  return new Promise((resolve) => {
    if (req.user) return resolve(req.user);
    try {
      passport.authenticate('jwt', { session: false }, (err, user) => {
        if (err || !user) return resolve(null);
        resolve(user);
      })(req, {}, () => resolve(null));
    } catch { resolve(null); }
  });
}

async function check(req, res, next, subscriptionService) {
  try {
    const user = req.user || await resolveUser(req);
    if (!user) return next();  // soft — let route's own auth respond

    if (user.role === ROLES.ADMIN || user.isAdmin === true) return next();

    if (!subscriptionService) {
      // Service not yet initialized — fail open to avoid global outage.
      console.warn('[subscriptionGuard] subscriptionService not available; passing through');
      return next();
    }

    const eff = await subscriptionService.effectiveStatus(user);

    if (eff.status === SUBSCRIPTION_STATUSES.TRIAL || eff.status === SUBSCRIPTION_STATUSES.ACTIVE) {
      req.subscription = eff;
      return next();
    }
    if (eff.graceEndsAt && new Date(eff.graceEndsAt) > new Date()) {
      // grace active — feature access allowed
      req.subscription = eff;
      return next();
    }

    let code = 'SUBSCRIPTION_REQUIRED';
    let message = 'Потребна е активна претплата за оваа функција.';
    if (eff.status === SUBSCRIPTION_STATUSES.PENDING_APPROVAL) {
      code = 'SUBSCRIPTION_PENDING';
      message = 'Вашето барање чека одобрување. Откако ќе пристигне уплатата, пристапот се активира.';
    } else if (eff.status === SUBSCRIPTION_STATUSES.SUSPENDED) {
      code = 'SUBSCRIPTION_SUSPENDED';
      message = 'Пробниот период истече. Изберете план за да продолжите.';
    } else if (eff.status === SUBSCRIPTION_STATUSES.CANCELLED) {
      code = 'SUBSCRIPTION_CANCELLED';
      message = 'Претплатата е откажана. Реактивирајте за да продолжите.';
    }

    return res.status(402).json({
      success: false,
      code,
      message,
      subscription: {
        status: eff.status,
        source: eff.source,
        endsAt: eff.endsAt,
        plan: eff.plan,
        cycle: eff.cycle,
        graceUsed: eff.graceUsed,
        graceEndsAt: eff.graceEndsAt
      }
    });
  } catch (err) {
    console.error('subscriptionGuard error:', err);
    return res.status(500).json({ success: false, code: 'GUARD_ERROR', message: 'Грешка при проверка на претплата' });
  }
}

// Default export: late-bound middleware — pulls subscriptionService from req.app.locals.
function lateGuard(req, res, next) {
  return check(req, res, next, req.app.locals.subscriptionService);
}

// Builder: pre-bind a specific service instance.
function buildSubscriptionGuard(subscriptionService) {
  if (!subscriptionService) throw new Error('subscriptionGuard requires subscriptionService');
  return (req, res, next) => check(req, res, next, subscriptionService);
}

module.exports = lateGuard;
module.exports.build = buildSubscriptionGuard;
