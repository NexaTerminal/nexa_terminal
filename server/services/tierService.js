/**
 * Tier resolution helpers for Nexa 3.0 (server-side).
 *
 * Single source of truth on the server for "which tier predicate should the
 * route gate on?" Mirrored by client/src/lib/tier.js — keep both in sync.
 *
 * Tier letters (two-tier model — Ultra merged into Pro):
 *   A = basic  (legacy: standard)                 → Nexa Basic
 *   B = pro    (legacy: admin_5, admin_10)         → Nexa Pro
 *   ADMIN = platform admin (Martin).
 */

const TIER_TRIAL_STATUSES = new Set(['trial', 'pending_approval']);

function effectiveTier(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'ADMIN';
  if (user.role === 'sub_seat') return 'A';
  const plan = user.subscription?.plan;
  if (plan === 'pro' || plan === 'admin_5' || plan === 'admin_10') return 'B';
  if (plan === 'basic' || plan === 'standard') return 'A';
  // Fallback: role=admin_user with missing/stale plan info → Pro (B).
  if (user.role === 'admin_user') return 'B';
  return 'A';
}

function isTrial(user) {
  return TIER_TRIAL_STATUSES.has(user?.subscription?.status);
}

function intendedTier(user) {
  const p = user?.intendedPlan;
  if (p === 'pro' || p === 'admin_5' || p === 'admin_10') return 'B';
  if (user?.role === 'admin_user') return 'B';
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
  if (eff === 'B')     return { allowed: true }; // Topics Q&A is now a Pro feature
  return { allowed: false, reason: 'plan' };
}

function subSeatLimit(user) {
  const eff = effectiveTier(user);
  if (eff === 'B') return 25; // Pro → client companies
  return 0;                   // Basic co-worker seats wired in the sub-user phase
}

// Virtual fair: any active paid plan (A/B/C) may post a booth; trial/preview
// browse read-only; sub-seats don't own a booth. Authoritative server gate is
// middleware/requireBoothPoster.js — this mirrors the client predicate.
function canPostBooth(user) {
  if (!user) return { allowed: false, reason: 'plan' };
  if (user.role === 'admin') return { allowed: true };
  if (user.role === 'sub_seat') return { allowed: false, reason: 'plan' };
  if (isTrial(user)) return { allowed: false, reason: 'trial' };
  return { allowed: true };
}

module.exports = {
  effectiveTier,
  isTrial,
  intendedTier,
  visibleTier,
  canSubmitBlog,
  canExpressInterest,
  canRequestQATopic,
  canPostBooth,
  subSeatLimit
};
