/**
 * SubscriptionScheduler — daily cron that:
 *   1. Sends due reminder emails.
 *   2. On trial expiry:
 *        - auto-grants the one-time 3-day grace if user already requested a plan
 *          (and grace not yet used)
 *        - otherwise suspends.
 *   3. Suspends users whose grace window has run out.
 *   4. Suspends users whose paid endsAt has passed.
 */

const cron = require('node-cron');
const { SUBSCRIPTION_STATUSES } = require('../constants/roles');
const subscriptionEmails = require('../emails/subscriptionEmails');

class SubscriptionScheduler {
  constructor(subscriptionService, emailService) {
    if (!subscriptionService) throw new Error('SubscriptionScheduler requires subscriptionService');
    if (!emailService) throw new Error('SubscriptionScheduler requires emailService');
    this.subscriptionService = subscriptionService;
    this.emailService = emailService;
    this.jobs = [];
    this.isRunning = false;
  }

  startAll() {
    if (this.isRunning) return;
    const schedule = process.env.SUBSCRIPTION_CRON || '0 2 * * *';
    const job = cron.schedule(schedule, async () => {
      try { await this.runDaily(); }
      catch (err) { console.error('[SubscriptionScheduler] daily run failed:', err.message); }
    });
    this.jobs.push(job);
    this.isRunning = true;
    console.log(`[SubscriptionScheduler] started (cron: ${schedule})`);
  }

  stopAll() {
    this.jobs.forEach(j => j.stop());
    this.jobs = [];
    this.isRunning = false;
  }

  async runDaily() {
    const startedAt = Date.now();
    let remindersSent = 0;
    let suspended = 0;
    let gracesGranted = 0;

    // 1. Reminders + trial/paid expiry transitions.
    const upcoming = await this.subscriptionService.listUpcomingExpiries({ withinDays: 30 });
    for (const user of upcoming) {
      const due = this.subscriptionService.computeDueReminder(user);
      if (!due) continue;

      const language = user.language || 'mk';
      const name = user.fullName || user.username || user.email;
      const sub = user.subscription || {};

      try {
        const tpl = this._buildTemplate(due.type, { name, sub, language });
        if (tpl) {
          await this.emailService.sendEmail(user.email, tpl.subject, tpl.html);
          await this.subscriptionService.markReminderSent(user._id, due.type);
          remindersSent++;
        }

        if (due.type === 'trial-expired') {
          // If the user has shown payment intent → auto-grant grace.
          if (sub.requestedPlan && !sub.gracePeriod?.used) {
            const granted = await this.subscriptionService.grantGracePeriod(user._id, { triggeredBy: 'auto-from-pending' });
            if (granted) {
              gracesGranted++;
              // Notify with the grace email.
              try {
                const graceTpl = subscriptionEmails.graceBegun({ name, endsAt: granted.endsAt }, language);
                await this.emailService.sendEmail(user.email, graceTpl.subject, graceTpl.html);
              } catch (e) { /* email best-effort */ }
            }
          } else {
            // No intent → suspend immediately.
            await this.subscriptionService.suspend(user._id, { reason: 'auto: trial expired without intent' });
            suspended++;
          }
        } else if (due.type === 'paid-expired') {
          await this.subscriptionService.suspend(user._id, { reason: 'auto: subscription expired' });
          suspended++;
        }
      } catch (err) {
        console.error('[SubscriptionScheduler] failed for user', String(user._id), err.message);
      }
    }

    // 2. Grace windows that have run out → suspend.
    const expiredGrace = await this.subscriptionService.listExpiredGrace();
    for (const user of expiredGrace) {
      try {
        await this.subscriptionService.suspend(user._id, { reason: 'auto: grace expired' });
        const tpl = subscriptionEmails.subscriptionSuspended({ name: user.fullName || user.username }, user.language || 'mk');
        await this.emailService.sendEmail(user.email, tpl.subject, tpl.html);
        suspended++;
      } catch (e) {
        console.error('[SubscriptionScheduler] grace-suspend failed:', e.message);
      }
    }

    console.log(`[SubscriptionScheduler] runDaily — reminders:${remindersSent} graces:${gracesGranted} suspended:${suspended} elapsed:${Date.now() - startedAt}ms`);
    return { remindersSent, gracesGranted, suspended };
  }

  _buildTemplate(type, { name, sub, language }) {
    switch (type) {
      case 'trial-2d':     return subscriptionEmails.trialEndingIn2Days({ name, endsAt: sub.endsAt }, language);
      case 'trial-expired':return subscriptionEmails.trialExpired({ name }, language);
      case 'paid-14d':     return subscriptionEmails.renewalIn14Days({ name, plan: sub.plan, cycle: sub.cycle, endsAt: sub.endsAt }, language);
      case 'paid-3d':      return subscriptionEmails.renewalIn3Days({ name, plan: sub.plan, cycle: sub.cycle, endsAt: sub.endsAt }, language);
      case 'paid-expired': return subscriptionEmails.subscriptionSuspended({ name }, language);
      default: return null;
    }
  }
}

module.exports = SubscriptionScheduler;
