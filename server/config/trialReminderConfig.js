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

  // Reminder stages, by days remaining before subscription.endsAt. The most
  // urgent unsent stage wins on each run. Keep ordered most→least days.
  STAGES: [
    { key: 'offer_d7', daysLeft: 7 }, // ~1 week left
    { key: 'offer_d2', daysLeft: 2 }  // final nudge
  ]
});
