/**
 * Tier resolution helpers for Nexa 3.0.
 *
 * Single source of truth for "which tier surfaces should this user see?"
 * Mirrored by server/services/tierService.js — keep both in sync.
 *
 * Tier letters map to plan keys (two-tier model — Ultra merged into Pro):
 *   A = basic  (legacy: standard)             → Nexa Basic
 *   B = pro    (legacy: admin_5, admin_10)     → Nexa Pro
 *   ADMIN = platform admin (Martin) — bypass everything.
 *
 * Sub-seats always render as A for sidebar visibility (they inherit access
 * from the parent's plan for gating, but never see B-only surfaces).
 */

// Gated statuses: the user has an account but no live paid access yet. There is
// no auto-trial anymore — a fresh account is 'none' (locked) until a code or
// paid plan activates it. 'pending_approval' waits on admin payment confirmation.
const TIER_TRIAL_STATUSES = new Set(['pending_approval']);

export function effectiveTier(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'ADMIN';
  if (user.role === 'sub_seat') return 'A';
  const plan = user.subscription?.plan;
  if (plan === 'pro' || plan === 'admin_5' || plan === 'admin_10') return 'B';
  if (plan === 'basic' || plan === 'standard') return 'A';
  // Fallback: a user with role=admin_user but missing/stale subscription data
  // is at minimum tier B (admin_user implies the Pro plan). Without this,
  // a stale token or partial response collapses them to A and the
  // Blogs / Leads / Sub-users sidebar entries disappear.
  if (user.role === 'admin_user') return 'B';
  return 'A';
}

export function isTrial(user) {
  return TIER_TRIAL_STATUSES.has(user?.subscription?.status);
}

/**
 * Account-level suspension set by a platform admin (separate from billing
 * status). Mirrors the server check in middleware/subscriptionGuard.js:
 * blocked while isActive===false and the suspension window hasn't elapsed
 * (permanent suspensions carry no suspendedUntil).
 */
export function isAccountSuspended(user) {
  if (!user || user.isActive !== false) return false;
  if (!user.suspendedUntil) return true; // permanent
  return new Date(user.suspendedUntil).getTime() > Date.now();
}

/**
 * Does this user currently have ACTIVE feature access (may use document
 * generators, screenings, AI tools, courses)? Mirrors the server gate in
 * services/subscriptionService.js → hasFeatureAccess + middleware/subscriptionGuard.
 *
 * True for: platform admin, sub-seats (inherit parent), unexpired trial/active,
 * or a live grace window. False for: admin-suspended accounts, expired
 * trial/active without grace, cancelled, or no subscription.
 *
 * NOTE: distinct from previewMode() — a *valid* trial user is in preview mode
 * (B action buttons gate) yet DOES have feature access. This predicate gates
 * the feature pages themselves; previewMode only gates upsell actions.
 */
export function hasFeatureAccess(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (isAccountSuspended(user)) return false;
  if (user.role === 'sub_seat') return true; // inherits parent access
  const s = user.subscription || {};
  const now = Date.now();
  const endsAt      = s.endsAt      ? new Date(s.endsAt).getTime()      : 0;
  const graceEndsAt = s.graceEndsAt ? new Date(s.graceEndsAt).getTime() : 0;
  const inActive = s.status === 'active' && endsAt > now;
  return inActive || graceEndsAt > now;
}

export function intendedTier(user) {
  const p = user?.intendedPlan;
  if (p === 'pro' || p === 'admin_5' || p === 'admin_10') return 'B';
  // Trial user with role=admin_user (chose Pro at signup) — surface B.
  if (user?.role === 'admin_user') return 'B';
  return 'A';
}

/**
 * What the sidebar should reveal.
 * Paid B → their effective tier. Trial users → their intended tier.
 * Everyone else → A.
 */
export function visibleTier(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'ADMIN';
  if (isTrial(user)) return intendedTier(user);
  return effectiveTier(user);
}

// ─── action predicates ─────────────────────────────────────────────────────
// Each returns { allowed: boolean, reason?: 'trial' | 'plan' }.

export function canSubmitBlog(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (isTrial(user))   return { allowed: false, reason: 'trial' };
  if (eff === 'B') return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

export function canExpressInterest(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (isTrial(user))   return { allowed: false, reason: 'trial' };
  if (eff === 'B') return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

export function canRequestQATopic(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (isTrial(user))   return { allowed: false, reason: 'trial' };
  if (eff === 'B')     return { allowed: true }; // Topics Q&A is now a Pro feature
  return { allowed: false, reason: 'plan' };
}

// Virtual fair: any active paid plan (A/B) may post a booth; trial/preview
// users browse read-only; sub-seats don't own a booth. Server gate is
// middleware/requireBoothPoster.js.
export function canPostBooth(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (user?.role === 'sub_seat') return { allowed: false, reason: 'plan' };
  if (isTrial(user)) return { allowed: false, reason: 'trial' };
  if (previewMode(user)) return { allowed: false, reason: 'trial' };
  if (eff === 'A' || eff === 'B') return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

export function subSeatLimit(user) {
  const eff = effectiveTier(user);
  if (eff === 'B') return 25; // Pro → client companies
  return 0;                   // Basic co-worker seats wired in the sub-user phase
}

/**
 * Preview mode: a non-admin user without active feature access.
 * Covers TRIAL (still evaluating) and SUSPENDED/CANCELLED/PENDING-no-grace
 * (trial+grace exhausted, no payment yet). Active paid users + sub-seats
 * (inherited access) + active grace are full-access and never in preview.
 *
 * UX: preview users SEE the B surfaces (Blogs/Leads/Topics) and the
 * core feature pages, but action buttons + cards open the SubscriptionGate
 * via the can* predicates or the server's 402 → axios interceptor path.
 */
export function previewMode(user) {
  if (!user) return false;
  if (user.role === 'admin') return false;
  // Account-level suspension (admin-set) → no access, regardless of billing.
  if (isAccountSuspended(user)) return true;
  if (user.role === 'sub_seat') return false; // inherited access
  const s = user.subscription || {};
  const now = Date.now();
  const endsAt      = s.endsAt      ? new Date(s.endsAt).getTime()      : 0;
  const graceEndsAt = s.graceEndsAt ? new Date(s.graceEndsAt).getTime() : 0;
  // Active paid subscription with future endsAt → full access.
  if (s.status === 'active' && endsAt > now) return false;
  // Active grace (after ordering, before payment confirmed) → full access.
  if (graceEndsAt > now) return false;
  // Everything else (trial fresh, trial expired, pending without grace,
  // suspended, cancelled, or no subscription doc at all) → preview.
  return true;
}

// Back-compat alias — pre-existing call sites keep working.
export const trialPreview = previewMode;

/**
 * Dispatch the global "open SubscriptionGate" event. Used by trial-only
 * click handlers to surface the order modal instead of taking the action.
 */
export function openSubscriptionGate(detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent('subscription:blocked', {
      detail: { code: 'TRIAL_PREVIEW', ...detail }
    }));
  } catch (_) { /* SSR / no window */ }
}

/**
 * One-free-document pass (master-plan Phase 1.2, decision D-2): a LOCKED
 * owner account (status 'none' — fresh funnel registrant, never activated)
 * that hasn't used its single free generation. Mirrors the server pass in
 * middleware/subscriptionGuard.js — the client uses it to open the document
 * pages; the server still enforces the single use.
 */
export function hasFreeDocPass(user) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'sub_seat') return false;
  if (user.freeDocUsed === true) return false;
  const status = user.subscription?.status;
  return !status || status === 'none';
}

// Sidebar visibility helpers — convenience wrappers around visibleTier().
// previewMode (trial / suspended / no-access) keeps the B surfaces visible
// so the user can re-engage; actions still gate behind the order modal.
export function showsBlogs(user)    { const v = visibleTier(user); return v === 'B' || v === 'ADMIN' || previewMode(user); }
export function showsLeads(user)    { const v = visibleTier(user); return v === 'B' || v === 'ADMIN' || previewMode(user); }
export function showsTopicsQA(user) { const v = visibleTier(user); return v === 'B' || v === 'ADMIN'              || previewMode(user); }
// Sub-users: both tiers manage them (Basic → co-workers, Pro → clients), but
// only account OWNERS with active access — not sub-seats, not locked accounts.
export function showsSubUsers(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'sub_seat') return false;
  return (user.role === 'standard_user' || user.role === 'admin_user') && hasFeatureAccess(user);
}
// Virtual fair is HIDDEN until there is real supply (master-plan Phase 0.3):
// an SMB opening an empty marketplace reads it as a dead product. Admin keeps
// access to seed booths; reopening is a marketable event later.
export function showsFair(user)     { return user?.role === 'admin'; }
// Sourcing (Барање за понуди) stays visible to everyone — it is the demand-side
// "get offers" surface and works concierge-style regardless of visible supply.
export function showsSourcing(user) { return !!user; }
