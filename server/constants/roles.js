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
  TRIAL:            'trial',             // free 8-day evaluation
  PENDING_APPROVAL: 'pending_approval',  // plan selected, awaiting admin approval after payment
  ACTIVE:           'active',            // paid + approved
  SUSPENDED:        'suspended',         // endsAt passed without renewal
  CANCELLED:        'cancelled'          // user requested cancellation
});

// Plan identifiers — close enum. Plans encode their seat tier in the name.
const PLANS = Object.freeze({
  STANDARD: 'standard',
  ADMIN_5:  'admin_5',
  ADMIN_10: 'admin_10'
});

// Seat count granted per plan. 0 = no sub-seats allowed.
const PLAN_SEATS = Object.freeze({
  standard: 0,
  admin_5:  5,
  admin_10: 10
});

// Role that a plan implies. All admin tiers map to the same admin_user role —
// the seat count is the differentiator.
const PLAN_TO_ROLE = Object.freeze({
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

// EUR prices per the public pricing page, using 9-ending psychological pricing.
const PLAN_PRICES = Object.freeze({
  standard: { monthly: 39,  quarterly: 99,  annual: 359  },
  admin_5:  { monthly: 79,  quarterly: 199, annual: 719  },
  admin_10: { monthly: 149, quarterly: 379, annual: 1349 }
});
const PLAN_CURRENCY = 'EUR';

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

const isValidPlan  = (p) => Object.values(PLANS).includes(p);
const isValidCycle = (c) => ['monthly','quarterly','annual'].includes(c);
const seatsForPlan = (plan) => (PLAN_SEATS[plan] ?? 0);
const roleForPlan  = (plan) => (PLAN_TO_ROLE[plan] || ROLES.REGULAR);
const priceFor     = (plan, cycle) => PLAN_PRICES[plan]?.[cycle] ?? null;

module.exports = {
  ROLES,
  LEGACY_VERIFIED,
  SUBSCRIPTION_STATUSES,
  PLANS,
  PLAN_SEATS,
  PLAN_TO_ROLE,
  CYCLES,
  DURATION_DAYS,
  GRACE_DAYS,
  PLAN_PRICES,
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
  // Backwards-compat: callers that still want a default admin seat limit
  // (e.g. legacy admin_user docs without a plan field) — use 5.
  DEFAULT_ADMIN_SEAT_LIMIT: 5
};
