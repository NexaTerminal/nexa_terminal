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

    // Manual admin suspension — an account-level block independent of billing
    // state. Set by adminController.suspendUser (isActive:false + optional
    // suspendedUntil). A permanent suspension has suspendedUntil=null; a
    // temporary one auto-expires once suspendedUntil passes. Enforced here so a
    // suspended user truly loses access to every feature surface.
    const nowMs = Date.now();
    const manuallySuspended =
      user.isActive === false &&
      (!user.suspendedUntil || new Date(user.suspendedUntil).getTime() > nowMs);
    if (manuallySuspended) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: user.suspensionReason
          ? `Вашата сметка е привремено суспендирана: ${user.suspensionReason}`
          : 'Вашата сметка е привремено суспендирана. Контактирајте нè за повеќе информации.',
        suspendedUntil: user.suspendedUntil || null
      });
    }

    if (!subscriptionService) {
      // Service not yet initialized — fail open to avoid global outage.
      console.warn('[subscriptionGuard] subscriptionService not available; passing through');
      return next();
    }

    // Backfill: if this is an own-account user without a subscription record yet
    // (predates the subscription system or signup didn't initialize), initialize
    // it LOCKED — no auto-trial. Access begins only via a redeem code or a paid
    // plan. initLocked is idempotent.
    let effUser = user;
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUB_SEAT && !user.subscription?.status) {
      try {
        effUser = await subscriptionService.initLocked(user._id);
      } catch (e) {
        console.warn('[subscriptionGuard] backfill initLocked failed:', e.message);
      }
    }

    const eff = await subscriptionService.effectiveStatus(effUser);

    // Access is granted only while an ACTIVE subscription is UNEXPIRED, or grace
    // is live. Checking endsAt at request time (rather than trusting the stored
    // status) means an expired subscription loses access immediately — we never
    // depend on the nightly cron having run to flip status → suspended.
    const endsAtMs = eff.endsAt      ? new Date(eff.endsAt).getTime()      : 0;
    const graceMs  = eff.graceEndsAt ? new Date(eff.graceEndsAt).getTime() : 0;
    const isActive = eff.status === SUBSCRIPTION_STATUSES.ACTIVE;

    if ((isActive && endsAtMs > nowMs) || graceMs > nowMs) {
      req.subscription = eff;
      return next();
    }

    // Lapsed active with no live grace → self-heal the stored status to
    // 'suspended' so the admin dashboard reflects reality without waiting for
    // the cron. Only for the user's own subscription (sub-seats inherit the
    // parent's state; the parent's own request / cron handles that side).
    if (isActive && endsAtMs <= nowMs && eff.source === 'self') {
      try {
        await subscriptionService.suspend(effUser._id || effUser.id, { reason: 'auto: expired (request-time)' });
        eff.status = SUBSCRIPTION_STATUSES.SUSPENDED;
      } catch (e) {
        console.warn('[subscriptionGuard] request-time suspend failed:', e.message);
      }
    }

    // ── One free document (master-plan Phase 1.2 / decision D-2) ─────────
    // A never-activated account (status 'none' — fresh funnel registrant) may
    // generate exactly ONE document. The pass applies only to the document
    // generators; creditMiddleware honors req.freeDocPass (skips the balance
    // check) and marks users.freeDocUsed=true on the first successful
    // generation. Suspended/cancelled ex-subscribers do NOT qualify.
    if (
      req.method === 'POST' &&
      req.baseUrl === '/api/auto-documents' &&
      eff.status === SUBSCRIPTION_STATUSES.NONE &&
      user.role !== ROLES.SUB_SEAT &&
      user.freeDocUsed !== true
    ) {
      req.freeDocPass = true;
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
      message = 'Потребна е активна претплата. Внесете код или изберете план за да продолжите.';
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
