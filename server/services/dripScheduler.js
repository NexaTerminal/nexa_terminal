'use strict';

const cron = require('node-cron');
const dripConfig = require('../config/dripConfig');

/**
 * Fires the daily drip once per day at SEND_HOUR:SEND_MINUTE (Europe/Skopje).
 * The actual pause/resume decision lives in the settings doc and is re-checked
 * inside dripSendService.runOnce(), so the cron always fires but no-ops while
 * paused. Mirrors trialReminderScheduler's structure.
 */
class DripScheduler {
  constructor(dripSendService) {
    this.service = dripSendService;
    this.job = null;
  }

  start() {
    if (!dripConfig.ENABLED) {
      console.log('[DripScheduler] disabled via env (DRIP_SCHEDULER_ENABLED=false)');
      return;
    }
    const expr = `${dripConfig.SEND_MINUTE} ${dripConfig.SEND_HOUR} * * *`;
    this.job = cron.schedule(expr, () => this.tick(), { scheduled: true, timezone: dripConfig.TIMEZONE });
    console.log(`[DripScheduler] ⏰ scheduled "${expr}" (${dripConfig.TIMEZONE})`);
  }

  async tick() {
    try {
      const res = await this.service.runOnce(new Date());
      if (res.paused) {
        console.log('[DripScheduler] tick skipped — paused');
      } else {
        console.log('[DripScheduler] tick →', JSON.stringify({ basic: res.basic, pro: res.pro }));
      }
    } catch (e) {
      console.error('[DripScheduler] tick failed:', e.message);
    }
  }

  /**
   * Manual trigger (admin "Run now"). Still respects pause + daily top-up.
   * `onlyType` ('basic' | 'pro') restricts the pass to one bucket.
   */
  async runNow(onlyType = null) {
    return this.service.runOnce(new Date(), onlyType);
  }

  stop() {
    if (this.job) { this.job.stop(); this.job = null; }
  }
}

module.exports = DripScheduler;
