'use strict';

/**
 * Trial → paid conversion reminders.
 *
 * Promo-trial users (subscription.paidVia === 'promo', status 'active', a live
 * 30-day window) get a "subscription offer" pro-invoice emailed to them so they
 * can pay by bank transfer. Because most MK businesses pay against a proforma
 * during bank working hours, the scheduler ONLY sends inside the banking window
 * (Mon–Fri, 08:00–14:00 Europe/Skopje) so the buyer can act immediately.
 *
 * Idempotency: each stage is recorded in subscription.remindersSent[] and never
 * resent. Set TRIAL_REMINDERS_ENABLED='false' to turn the whole thing off.
 */
module.exports = Object.freeze({
  ENABLED: process.env.TRIAL_REMINDERS_ENABLED !== 'false', // default ON
  TIMEZONE: process.env.TZ_MK || 'Europe/Skopje',

  // MK bank working window. Sends happen only Mon–Fri within [OPEN, CLOSE).
  // Banks close at 14:00, so the cron fires hourly 08:00–13:00 — the last send
  // still leaves the buyer ~an hour to transfer.
  BANK_OPEN_HOUR: 8,
  BANK_CLOSE_HOUR: 14,

  // Payment "offer" stages, by days remaining before subscription.endsAt. The
  // most urgent unsent stage wins on each run. Keep ordered most→least days.
  // `audience` scopes who receives each proforma:
  //   'promo' → 30-day code-redeemed users only
  //   'trial' → 8-day self-serve trial users only
  //   'all'   → both
  // offer_d7 fires ~day 1 of an 8-day window (too early, and it collides with the
  // education drip), so it is scoped to promo codes; the 8-day trial's single
  // payment nudge is offer_d2 near the end.
  STAGES: [
    { key: 'offer_d7', daysLeft: 7, audience: 'promo' },
    { key: 'offer_d2', daysLeft: 2, audience: 'all' }
  ],

  // Feature-education emails for self-serve trial users (subscription.trial),
  // keyed by ELAPSED days since subscription.startedAt (not days remaining).
  // Forward-only: on each run the earliest unsent stage whose `sendOnDay` has
  // arrived is sent, so a stage is never skipped even if the bank-hours cron
  // misses a day (weekend). No proforma is attached — these are informational.
  EDUCATION_STAGES: [
    { key: 'edu_documents', sendOnDay: 2 }, // automated documents + AI contract check
    { key: 'edu_lhc', sendOnDay: 3 }        // Legal Health Check / compliance
  ]
});
