'use strict';

const cron = require('node-cron');
const moment = require('moment-timezone');
const cfg = require('../config/trialReminderConfig');

/**
 * Fires the trial → paid reminder run hourly during MK bank working hours
 * (Mon–Fri, 08:00–13:00 Europe/Skopje), so the proforma lands while the buyer
 * can actually transfer the money. Mirrors creditScheduler's structure.
 */
class TrialReminderScheduler {
  constructor(trialReminderService) {
    this.service = trialReminderService;
    this.job = null;
  }

  /** True if `m` (a moment in TZ) is within Mon–Fri 08:00–13:59. */
  static isBankingHours(m) {
    const dow = m.isoWeekday();          // 1=Mon … 7=Sun
    const hour = m.hour();
    return dow >= 1 && dow <= 5 && hour >= cfg.BANK_OPEN_HOUR && hour < cfg.BANK_CLOSE_HOUR;
  }

  start() {
    if (!cfg.ENABLED) {
      console.log('[TrialReminderScheduler] disabled via config');
      return;
    }
    // minute 0, hours 08–13, Mon–Fri. (14:00 excluded — banks close.)
    const expr = `0 ${cfg.BANK_OPEN_HOUR}-${cfg.BANK_CLOSE_HOUR - 1} * * 1-5`;
    this.job = cron.schedule(expr, () => this.tick(), { scheduled: true, timezone: cfg.TIMEZONE });
    console.log(`[TrialReminderScheduler] ⏰ scheduled "${expr}" (${cfg.TIMEZONE})`);
  }

  async tick() {
    const now = moment().tz(cfg.TIMEZONE);
    if (!TrialReminderScheduler.isBankingHours(now)) return; // defensive
    try {
      const res = await this.service.runOnce(now.toDate());
      if (res.sent > 0 || res.failed > 0) {
        console.log(`[TrialReminderScheduler] ${now.format('YYYY-MM-DD HH:mm')} →`, res);
      }
    } catch (e) {
      console.error('[TrialReminderScheduler] tick failed:', e.message);
    }
  }

  /** Manual trigger (admin/testing) — ignores the banking-hours window but
   *  still respects per-stage idempotency. */
  async runNow() {
    return this.service.runOnce(new Date());
  }

  stop() {
    if (this.job) { this.job.stop(); this.job = null; }
  }
}

module.exports = TrialReminderScheduler;
