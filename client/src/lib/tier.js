/**
 * Tier resolution helpers for Nexa 3.0.
 *
 * Single source of truth for "which tier surfaces should this user see?"
 * Mirrored by server/services/tierService.js — keep both in sync.
 *
 * Tier letters map to plan keys:
 *   A = standard       → Nexa Платформа
 *   B = admin_5        → Nexa Мрежа · Кантора
 *   C = admin_10       → Nexa Мрежа · Студио
 *   ADMIN = platform admin (Martin) — bypass everything.
 *
 * Sub-seats always render as A for sidebar visibility (they inherit access
 * from the parent's plan for gating, but never see B/C-only surfaces).
 */

const TIER_TRIAL_STATUSES = new Set(['trial', 'pending_approval']);

export function effectiveTier(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'ADMIN';
  if (user.role === 'sub_seat') return 'A';
  if (user.subscription?.plan === 'admin_10') return 'C';
  if (user.subscription?.plan === 'admin_5')  return 'B';
  // Fallback: a user with role=admin_user but missing/stale subscription data
  // is at minimum tier B (admin_user implies an admin plan). Without this,
  // a stale token or partial response collapses them to A and the
  // Blogs / Leads / Sub-users sidebar entries disappear.
  if (user.role === 'admin_user') return 'B';
  return 'A';
}

export function isTrial(user) {
  return TIER_TRIAL_STATUSES.has(user?.subscription?.status);
}

export function intendedTier(user) {
  if (user?.intendedPlan === 'admin_10') return 'C';
  if (user?.intendedPlan === 'admin_5')  return 'B';
  // Trial user with role=admin_user (chose an admin tier at signup) — surface B.
  if (user?.role === 'admin_user') return 'B';
  return 'A';
}

/**
 * What the sidebar should reveal.
 * Paid B/C → their effective tier. Trial users → their intended tier.
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
  if (eff === 'B' || eff === 'C') return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

export function canExpressInterest(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (isTrial(user))   return { allowed: false, reason: 'trial' };
  if (eff === 'B' || eff === 'C') return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

export function canRequestQATopic(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (isTrial(user))   return { allowed: false, reason: 'trial' };
  if (eff === 'C')     return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

// Virtual fair: any active paid plan (A/B/C) may post a booth; trial/preview
// users browse read-only; sub-seats don't own a booth. Server gate is
// middleware/requireBoothPoster.js.
export function canPostBooth(user) {
  const eff = effectiveTier(user);
  if (eff === 'ADMIN') return { allowed: true };
  if (user?.role === 'sub_seat') return { allowed: false, reason: 'plan' };
  if (isTrial(user)) return { allowed: false, reason: 'trial' };
  if (previewMode(user)) return { allowed: false, reason: 'trial' };
  if (eff === 'A' || eff === 'B' || eff === 'C') return { allowed: true };
  return { allowed: false, reason: 'plan' };
}

export function subSeatLimit(user) {
  const eff = effectiveTier(user);
  if (eff === 'C') return 10;
  if (eff === 'B') return 5;
  return 0;
}

/**
 * Preview mode: a non-admin user without active feature access.
 * Covers TRIAL (still evaluating) and SUSPENDED/CANCELLED/PENDING-no-grace
 * (trial+grace exhausted, no payment yet). Active paid users + sub-seats
 * (inherited access) + active grace are full-access and never in preview.
 *
 * UX: preview users SEE the B/C surfaces (Blogs/Leads/Topics) and the
 * core feature pages, but action buttons + cards open the SubscriptionGate
 * via the can* predicates or the server's 402 → axios interceptor path.
 */
export function previewMode(user) {
  if (!user) return false;
  if (user.role === 'admin') return false;
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

// Sidebar visibility helpers — convenience wrappers around visibleTier().
// previewMode (trial / suspended / no-access) keeps the B/C surfaces visible
// so the user can re-engage; actions still gate behind the order modal.
export function showsBlogs(user)    { const v = visibleTier(user); return v === 'B' || v === 'C' || v === 'ADMIN' || previewMode(user); }
export function showsLeads(user)    { const v = visibleTier(user); return v === 'B' || v === 'C' || v === 'ADMIN' || previewMode(user); }
export function showsTopicsQA(user) { const v = visibleTier(user); return v === 'C' || v === 'ADMIN'              || previewMode(user); }
export function showsSubUsers(user) { const v = visibleTier(user); return v === 'B' || v === 'C' || v === 'ADMIN'; }
// Virtual fair is a browse-for-everyone surface — visible to any logged-in user.
export function showsFair(user)     { return !!user; }
