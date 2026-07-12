// Daily HR-reminder cron — mirrors contractReminderScheduler: node-cron,
// Europe/Skopje, wired in server.js initializeServices. 10:00 daily (free
// slot; 08:00 is taken by contract reminders).

const cron = require('node-cron');

class HrReminderScheduler {
  constructor(hrReminderService) {
    this.service = hrReminderService;
    this.job = null;
  }

  start() {
    this.job = cron.schedule('0 10 * * *', async () => {
      try {
        const res = await this.service.evaluateAndSend(new Date());
        console.log(`[HrReminderScheduler] evaluated=${res.evaluated} emails=${res.emailsSent}`);
      } catch (err) {
        console.error('[HrReminderScheduler] run failed:', err);
      }
    }, { timezone: 'Europe/Skopje' });
    console.log('[HrReminderScheduler] scheduled daily 10:00 Europe/Skopje');
  }

  stop() {
    if (this.job) this.job.stop();
  }
}

module.exports = HrReminderScheduler;
