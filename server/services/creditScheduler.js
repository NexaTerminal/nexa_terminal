// server/services/creditScheduler.js

const cron = require('node-cron');
const moment = require('moment-timezone');
const creditConfig = require('../config/creditConfig');

/**
 * CreditScheduler
 *
 * Manages scheduled tasks for the credit system:
 * - Weekly credit reset (every Monday at 7:00 AM)
 * - Weekly referral bonus processing
 * - Daily low credit alerts
 */
class CreditScheduler {
  constructor(creditService, referralService, emailService) {
    this.creditService = creditService;
    this.referralService = referralService;
    this.emailService = emailService;
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Start all scheduled jobs
   */
  startAll() {
    if (!creditConfig.ENABLE_SCHEDULER) {
      console.log('[CreditScheduler] Scheduler disabled in configuration');
      return;
    }

    console.log('[CreditScheduler] Starting credit system scheduler...');

    this.startWeeklyReset();
    this.startReferralBonusCheck();
    this.startLowCreditAlerts();

    this.isRunning = true;
    console.log('[CreditScheduler] All jobs started successfully');
  }

  /**
   * Weekly credit reset - Every Monday at 7:00 AM (Macedonia time)
   */
  startWeeklyReset() {
    // Cron format: minute hour day-of-month month day-of-week
    // 0 7 * * 1 = Every Monday at 7:00 AM
    const schedule = `${creditConfig.RESET_MINUTE} ${creditConfig.RESET_HOUR} * * ${creditConfig.RESET_DAY}`;

    const job = cron.schedule(schedule, async () => {
      const now = moment().tz(creditConfig.TIMEZONE);
      console.log(`[CreditScheduler] Starting weekly credit reset at ${now.format('YYYY-MM-DD HH:mm:ss')}`);

      try {
        const result = await this.creditService.resetAllUserCredits();

        console.log('[CreditScheduler] ✅ Weekly reset complete:', {
          usersReset: result.usersReset,
          failures: result.failures,
          timestamp: now.format()
        });

        // Send summary email to admin
        if (this.emailService && this.emailService.sendAdminSummary) {
          await this.emailService.sendAdminSummary(
            'Weekly Credit Reset Complete',
            result
          ).catch(err => console.error('Failed to send admin summary:', err));
        }

      } catch (error) {
        console.error('[CreditScheduler] ❌ Weekly reset failed:', error);

        // Send alert to admin
        if (this.emailService && this.emailService.sendAdminAlert) {
          await this.emailService.sendAdminAlert(
            'Credit Reset Failed',
            error
          ).catch(err => console.error('Failed to send admin alert:', err));
        }
      }
    }, {
      scheduled: true,
      timezone: creditConfig.TIMEZONE
    });

    this.jobs.push({ name: 'weeklyReset', job });

    const nextRun = moment().tz(creditConfig.TIMEZONE)
      .isoWeekday(creditConfig.RESET_DAY)
      .hour(creditConfig.RESET_HOUR)
      .minute(creditConfig.RESET_MINUTE);

    if (nextRun.isBefore(moment())) {
      nextRun.add(1, 'week');
    }

    console.log(`[CreditScheduler] ⏰ Weekly reset scheduled for: ${nextRun.format('dddd, MMMM Do YYYY, h:mm:ss A')}`);
  }

  /**
   * Weekly referral bonus processing - Every Monday at 7:05 AM
   * (5 minutes after credit reset to ensure credits are available)
   */
  startReferralBonusCheck() {
    const schedule = `${creditConfig.RESET_MINUTE + 5} ${creditConfig.RESET_HOUR} * * ${creditConfig.RESET_DAY}`;

    const job = cron.schedule(schedule, async () => {
      const now = moment().tz(creditConfig.TIMEZONE);
      console.log(`[CreditScheduler] Starting weekly referral bonus processing at ${now.format('YYYY-MM-DD HH:mm:ss')}`);

      try {
        const result = await this.referralService.processAllReferralBonuses();

        console.log('[CreditScheduler] ✅ Referral bonus processing complete:', {
          bonusesAwarded: result.bonusesAwarded,
          errors: result.errors?.length || 0,
          timestamp: now.format()
        });

      } catch (error) {
        console.error('[CreditScheduler] ❌ Referral bonus processing failed:', error);
      }
    }, {
      scheduled: true,
      timezone: creditConfig.TIMEZONE
    });

    this.jobs.push({ name: 'referralBonus', job });
    console.log('[CreditScheduler] ⏰ Referral bonus check scheduled');
  }

  /**
   * Daily low credit alerts - Every day at 9:00 AM
   */
  startLowCreditAlerts() {
    // Every day at 9:00 AM
    const schedule = '0 9 * * *';

    const job = cron.schedule(schedule, async () => {
      const now = moment().tz(creditConfig.TIMEZONE);
      console.log(`[CreditScheduler] Checking for low credit users at ${now.format('YYYY-MM-DD HH:mm:ss')}`);

      try {
        const threshold = creditConfig.LOW_CREDIT_THRESHOLD;
        const lowCreditUsers = await this.creditService.userService.getUsersWithLowCredits(threshold);

        let emailsSent = 0;
        let emailsFailed = 0;

        for (const user of lowCreditUsers) {
          try {
            if (this.emailService && this.emailService.sendLowCreditAlert) {
              await this.emailService.sendLowCreditAlert(user);
              emailsSent++;
            }
          } catch (error) {
            emailsFailed++;
            console.error(`Failed to send low credit alert to ${user.email}:`, error.message);
          }
        }

        console.log('[CreditScheduler] ✅ Low credit alerts complete:', {
          usersFound: lowCreditUsers.length,
          emailsSent,
          emailsFailed,
          timestamp: now.format()
        });

      } catch (error) {
        console.error('[CreditScheduler] ❌ Low credit alerts failed:', error);
      }
    }, {
      scheduled: true,
      timezone: creditConfig.TIMEZONE
    });

    this.jobs.push({ name: 'lowCreditAlerts', job });
    console.log('[CreditScheduler] ⏰ Daily low credit alerts scheduled for 9:00 AM');
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    console.log('[CreditScheduler] Stopping all scheduled jobs...');

    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`[CreditScheduler] Stopped job: ${name}`);
    });

    this.jobs = [];
    this.isRunning = false;

    console.log('[CreditScheduler] All jobs stopped');
  }

  /**
   * Get status of all scheduled jobs
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedulerEnabled: creditConfig.ENABLE_SCHEDULER,
      timezone: creditConfig.TIMEZONE,
      jobs: this.jobs.map(({ name }) => name),
      nextReset: creditConfig.getNextResetDate(),
      config: {
        weeklyAllocation: creditConfig.WEEKLY_ALLOCATION,
        resetDay: creditConfig.RESET_DAY,
        resetHour: creditConfig.RESET_HOUR,
        resetMinute: creditConfig.RESET_MINUTE
      }
    };
  }

  /**
   * Manually trigger weekly reset (for testing/emergency)
   * @returns {Promise<Object>} Reset result
   */
  async manualReset() {
    console.log('[CreditScheduler] Manual reset triggered');
    return await this.creditService.resetAllUserCredits();
  }

  /**
   * Check and perform any missed resets on startup
   * @returns {Promise<number>} Number of users reset
   */
  async checkMissedResets() {
    console.log('[CreditScheduler] Checking for missed resets on startup...');

    try {
      const resetCount = await this.creditService.checkAndPerformMissedResets();

      if (resetCount > 0) {
        console.log(`[CreditScheduler] ✅ Performed ${resetCount} missed resets`);
      } else {
        console.log('[CreditScheduler] No missed resets found');
      }

      return resetCount;

    } catch (error) {
      console.error('[CreditScheduler] ❌ Error checking missed resets:', error);
      return 0;
    }
  }
}

module.exports = CreditScheduler;
