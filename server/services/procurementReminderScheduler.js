// Daily procurement renewal-reminder cron — mirrors caseReminderScheduler.
// 11:00 Europe/Skopje (free slot; 08:00 contracts, 09:00 cases, 10:00 HR).
const cron = require('node-cron');

class ProcurementReminderScheduler {
  constructor(service) {
    this.service = service;
    this.job = null;
  }

  start() {
    this.job = cron.schedule('0 11 * * *', async () => {
      try {
        const res = await this.service.evaluateAndSend(new Date());
        console.log(`[ProcurementReminderScheduler] evaluated=${res.evaluated} emails=${res.emailsSent}`);
      } catch (err) {
        console.error('[ProcurementReminderScheduler] run failed:', err);
      }
    }, { timezone: 'Europe/Skopje' });
    console.log('[ProcurementReminderScheduler] scheduled daily 11:00 Europe/Skopje');
  }

  stop() {
    if (this.job) this.job.stop();
  }
}

module.exports = ProcurementReminderScheduler;
