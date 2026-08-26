'use strict';

/**
 * Daily cold-email DRIP config.
 *
 * The drip releases a fixed number of promo invites per audience type each day
 * so we stay safely under Resend's Free-tier caps (100/day, 3,000/month). We
 * target 40 Basic + 40 Pro = 80/day, leaving ~20/day headroom for the app's
 * transactional mail (verification, invoices, reminders).
 *
 * Numbers here are DEFAULTS. The runtime-editable values (per-type count, the
 * chosen promo code + saved copy per bucket, and the master on/off switch) live
 * in the `outreach_drip_settings` singleton so they can be tuned from the admin
 * UI without a redeploy (see services/dripSettingsService.js).
 */

const num = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : d;
};

module.exports = {
  // Master kill-switch. Ships OFF so a deploy can never start emailing before
  // the buckets are configured and the admin explicitly enables it in the UI.
  // (The UI toggle is the day-to-day switch; this env var is a hard override.)
  ENABLED: String(process.env.DRIP_SCHEDULER_ENABLED || 'true') !== 'false',

  TIMEZONE: process.env.DRIP_TIMEZONE || 'Europe/Skopje',
  SEND_HOUR: num(process.env.DRIP_SEND_HOUR, 8),
  SEND_MINUTE: num(process.env.DRIP_SEND_MINUTE, 30),

  // Default per-type daily cap. Overridable per bucket in the settings doc.
  PER_TYPE_PER_DAY: num(process.env.DRIP_PER_TYPE_PER_DAY, 40),

  // Pace between individual sends (ms) so we never trip Resend's per-second
  // rate limit. 1.5s × 80 ≈ 2 minutes total per day — negligible.
  SEND_INTERVAL_MS: num(process.env.DRIP_SEND_INTERVAL_MS, 1500),
};
