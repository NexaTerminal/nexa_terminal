// Daily case-reminder cron — mirrors hrReminderScheduler: node-cron,
// Europe/Skopje, wired in server.js initializeServices. 09:00 daily (free slot;
// 08:00 = contract reminders, 10:00 = HR reminders).

const cron = require('node-cron');

class CaseReminderScheduler {
  constructor(caseReminderService) {
    this.service = caseReminderService;
    this.job = null;
  }

  start() {
    this.job = cron.schedule('0 9 * * *', async () => {
      try {
        const res = await this.service.evaluateAndSend(new Date());
        console.log(`[CaseReminderScheduler] evaluated=${res.evaluated} emails=${res.emailsSent}`);
      } catch (err) {
        console.error('[CaseReminderScheduler] run failed:', err);
      }
    }, { timezone: 'Europe/Skopje' });
    console.log('[CaseReminderScheduler] scheduled daily 09:00 Europe/Skopje');
  }

  stop() {
    if (this.job) this.job.stop();
  }
}

module.exports = CaseReminderScheduler;
