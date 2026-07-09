// Daily contract-reminder cron (tasks/cms-v1-plan.md M4) — mirrors
// creditScheduler: node-cron, Europe/Skopje, wired in server.js
// initializeServices. 08:00 daily (CMS plan decision D-3).

const cron = require('node-cron');

class ContractReminderScheduler {
  constructor(contractReminderService) {
    this.service = contractReminderService;
    this.job = null;
  }

  start() {
    this.job = cron.schedule('0 8 * * *', async () => {
      try {
        const res = await this.service.evaluateAndSend(new Date());
        console.log(`[ContractReminderScheduler] evaluated=${res.evaluated} emails=${res.emailsSent}`);
      } catch (err) {
        console.error('[ContractReminderScheduler] run failed:', err);
      }
    }, { timezone: 'Europe/Skopje' });
    console.log('[ContractReminderScheduler] scheduled daily 08:00 Europe/Skopje');
  }

  stop() {
    if (this.job) this.job.stop();
  }
}

module.exports = ContractReminderScheduler;
