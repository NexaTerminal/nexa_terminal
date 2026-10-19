// Weekly lead-digest cron — every Monday 09:00 Europe/Skopje. Mirrors
// hrReminderScheduler. Wired in server.js initializeServices.

const cron = require('node-cron');

class LeadDigestScheduler {
  constructor(leadDigestService) {
    this.service = leadDigestService;
    this.job = null;
  }

  start() {
    this.job = cron.schedule('0 9 * * 1', async () => {
      try {
        const res = await this.service.sendWeeklyDigest(new Date());
        console.log(`[LeadDigestScheduler] ${JSON.stringify(res)}`);
      } catch (err) {
        console.error('[LeadDigestScheduler] run failed:', err);
      }
    }, { timezone: 'Europe/Skopje' });
    console.log('[LeadDigestScheduler] scheduled Mondays 09:00 Europe/Skopje');
  }

  stop() {
    if (this.job) this.job.stop();
  }
}

module.exports = LeadDigestScheduler;
