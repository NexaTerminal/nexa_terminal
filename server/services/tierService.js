/**
 * Tier resolution helpers for Nexa 3.0 (server-side).
 *
 * Single source of truth on the server for "which tier predicate should the
 * route gate on?" Mirrored by client/src/lib/tier.js — keep both in sync.
 *
 * Tier letters:
 *   A = standard       → Nexa Платформа
 *   B = admin_5        → Nexa Мрежа · Кантора
 *   C = admin_10       → Nexa Мрежа · Студио
 *   ADMIN = platform admin (Martin).
 */

const TIER_TRIAL_STATUSES = new Set(['trial', 'pending_approval']);

function effectiveTier(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'ADMIN';
  if (user.role === 'sub_seat') return 'A';
  const plan = user.subscription?.plan;
  if (plan === 'admin_10') return 'C';
  if (plan === 'admin_5')  return 'B';
  return 'A';
}

function isTrial(user) {
  return TIER_TRIAL_STATUSES.has(user?.subscription?.status);
}

function intendedTier(user) {
  if (user?.intendedPlan === 'admin_10') return 'C';
  if (user?.intendedPlan === 'admin_5')  return 'B';
  return 'A';
}

function visibleTier(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'ADMIN';
  if (isTrial(user)) return intendedTier(user);
  return effectiveTier(user);
}

function canSubmitBlog(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (isTrial(user))   return { allowed: false, reason: 'trial' };
  if (eff === 'B' || eff === 'C') return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

function canExpressInterest(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (isTrial(user))   return { allowed: false, reason: 'trial' };
  if (eff === 'B' || eff === 'C') return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

function canRequestQATopic(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (isTrial(user))   return { allowed: false, reason: 'trial' };
  if (eff === 'C')     return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

function subSeatLimit(user) {
  const eff = effectiveTier(user);
  if (eff === 'C') return 10;
  if (eff === 'B') return 5;
  return 0;
}

module.exports = {
  effectiveTier,
  isTrial,
  intendedTier,
  visibleTier,
  canSubmitBlog,
  canExpressInterest,
  canRequestQATopic,
  subSeatLimit
};
