/**
 * Centralized constants for roles, subscription statuses, plans, and durations.
 *
 * Two separate systems compose to determine what a user can do:
 *   - ROLE: what features they're authorized for
 *   - SUBSCRIPTION STATUS: whether their role is currently active
 *
 * A sub-seat's effective status is the parent admin_user's status.
 */

const ROLES = Object.freeze({
  REGULAR:        'regular',        // registered, no intended plan (legacy / edge case)
  STANDARD_USER:  'standard_user',  // Standard plan — individual companies
  ADMIN_USER:     'admin_user',     // Admin plan (any tier) — B2B service providers
  SUB_SEAT:       'sub_seat',       // created and owned by an admin_user, restricted scope
  ADMIN:          'admin'           // Nexa platform owner (Martin)
});

// Legacy role 'verified' is migrated to 'standard_user'.
const LEGACY_VERIFIED = 'verified';

const SUBSCRIPTION_STATUSES = Object.freeze({
  NONE:             'none',              // registered, never activated (no auto-trial)
  TRIAL:            'trial',             // legacy free evaluation (no longer auto-granted)
  PENDING_APPROVAL: 'pending_approval',  // plan selected, awaiting admin approval after payment
  ACTIVE:           'active',            // paid + approved (or code-activated)
  SUSPENDED:        'suspended',         // endsAt passed without renewal
  CANCELLED:        'cancelled'          // user requested cancellation
});

// Plan identifiers — canonical two-tier model (Basic + Pro).
// Legacy keys (standard / admin_5 / admin_10) are retained for back-compat
// during migration; resolve any plan to canonical with canonicalPlan().
const PLANS = Object.freeze({
  BASIC: 'basic',
  PRO:   'pro'
});

const LEGACY_PLANS = Object.freeze({
  STANDARD: 'standard',  // → basic
  ADMIN_5:  'admin_5',   // → pro
  ADMIN_10: 'admin_10'   // → pro (Ultra merged into Pro)
});

// Every plan key accepted anywhere (canonical + legacy).
const ALL_PLANS = Object.freeze([...Object.values(PLANS), ...Object.values(LEGACY_PLANS)]);

// Normalize a legacy-or-canonical plan key to the canonical two-tier value.
const canonicalPlan = (p) => {
  switch (p) {
    case 'basic': case 'standard':                 return PLANS.BASIC;
    case 'pro':   case 'admin_5': case 'admin_10':  return PLANS.PRO;
    default: return null;
  }
};

// Seat count granted per plan. 0 = no sub-seats allowed.
// Basic → 3 co-worker seats; Pro → 25 client-company seats.
const PLAN_SEATS = Object.freeze({
  basic: 3,
  pro:   25,
  // legacy (pre-migration docs)
  standard: 0,
  admin_5:  5,
  admin_10: 10
});

// Role that a plan implies. Basic → standard_user, Pro → admin_user.
const PLAN_TO_ROLE = Object.freeze({
  basic: ROLES.STANDARD_USER,
  pro:   ROLES.ADMIN_USER,
  // legacy
  standard: ROLES.STANDARD_USER,
  admin_5:  ROLES.ADMIN_USER,
  admin_10: ROLES.ADMIN_USER
});

const CYCLES = Object.freeze({
  TRIAL:     'trial',
  MONTHLY:   'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL:    'annual'
});

const DURATION_DAYS = Object.freeze({
  trial:     8,
  monthly:   30,
  quarterly: 90,
  annual:    365
});

// One-time grace window (days) granted after trial expiry if the user has
// shown intent (clicked Subscribe / Email-Invoice) but hasn't paid yet.
const GRACE_DAYS = 3;

// EUR prices per the public pricing page (Nexa 3.0).
// Quarterly ≈ 14–16% off three months of monthly.
// Annual    ≈ 22–24% off twelve months of monthly.
const PLAN_PRICES = Object.freeze({
  basic: { monthly: 19, quarterly: 49,  annual: 179 },
  pro:   { monthly: 39, quarterly: 99,  annual: 359 },
  // legacy
  standard: { monthly: 19, quarterly: 49,  annual: 179 },
  admin_5:  { monthly: 39, quarterly: 99,  annual: 359 },
  admin_10: { monthly: 59, quarterly: 149, annual: 549 }
});
const PLAN_CURRENCY = 'EUR';

// Public-facing tier labels (Nexa 3.0). Server-side keys above remain stable;
// only these labels are user-visible.
const PLAN_LABELS = Object.freeze({
  basic: { mk: 'Основен', en: 'Basic' },
  pro:   { mk: 'Про',     en: 'Pro'   },
  // legacy
  standard: { mk: 'Основен', en: 'Basic' },
  admin_5:  { mk: 'Про',     en: 'Pro'   },
  admin_10: { mk: 'Ултра',   en: 'Ultra' }
});
const labelForPlan = (plan, lang = 'mk') => {
  const l = PLAN_LABELS[plan];
  if (!l) return plan;
  return (lang === 'en' ? l.en : l.mk) || l.mk;
};

// Reminder cadence (days before endsAt, negative number = days remaining).
const REMINDER_SCHEDULE = Object.freeze({
  TRIAL_2D:       { type: 'trial-2d',       daysBefore: 2  },
  TRIAL_EXPIRED:  { type: 'trial-expired',  daysBefore: 0  },
  PAID_14D:       { type: 'paid-14d',       daysBefore: 14 },
  PAID_3D:        { type: 'paid-3d',        daysBefore: 3  },
  PAID_EXPIRED:   { type: 'paid-expired',   daysBefore: 0  },
  GRACE_EXPIRED:  { type: 'grace-expired',  daysBefore: 0  }
});

// Practice areas enum — must match satellite-site contract (NEXA_2.0_CONTEXT.md §11).
const PRACTICE_AREAS = Object.freeze([
  'consumer-legal',
  'immigration',
  'citizenship',
  'company-registration',
  'ip-law',
  'tax-accounting',
  'labor-law',
  'general-legal'
]);

// ---- Helpers ----
const isPlatformAdmin = (user) => !!user && (user.role === ROLES.ADMIN || user.isAdmin === true);
const isAdminUser     = (user) => !!user && user.role === ROLES.ADMIN_USER;
const isStandardUser  = (user) => !!user && (user.role === ROLES.STANDARD_USER || user.role === LEGACY_VERIFIED);
const isSubSeat       = (user) => !!user && user.role === ROLES.SUB_SEAT;

const isValidPlan  = (p) => ALL_PLANS.includes(p);
const isValidCycle = (c) => ['monthly','quarterly','annual'].includes(c);
const seatsForPlan = (plan) => (PLAN_SEATS[plan] ?? 0);
const roleForPlan  = (plan) => (PLAN_TO_ROLE[plan] || ROLES.REGULAR);
const priceFor     = (plan, cycle) => PLAN_PRICES[plan]?.[cycle] ?? null;

module.exports = {
  ROLES,
  LEGACY_VERIFIED,
  SUBSCRIPTION_STATUSES,
  PLANS,
  LEGACY_PLANS,
  ALL_PLANS,
  canonicalPlan,
  PLAN_SEATS,
  PLAN_TO_ROLE,
  CYCLES,
  DURATION_DAYS,
  GRACE_DAYS,
  PLAN_PRICES,
  PLAN_CURRENCY,
  PLAN_LABELS,
  labelForPlan,
  REMINDER_SCHEDULE,
  PRACTICE_AREAS,
  isPlatformAdmin,
  isAdminUser,
  isStandardUser,
  isSubSeat,
  isValidPlan,
  isValidCycle,
  seatsForPlan,
  roleForPlan,
  priceFor,
  // Backwards-compat: default seat limit for an admin_user (Pro) doc that has
  // no explicit plan field. Pro = 25 client-company seats.
  DEFAULT_ADMIN_SEAT_LIMIT: 25
};
