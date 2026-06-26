'use strict';

const { PLAN_PRICES, PLAN_LABELS } = require('../constants/roles');
const ProInvoicesService = require('./proInvoicesService');
const { renderSubscriptionOfferPdf } = require('./subscriptionOfferPdf');
const { trialReminderEmail } = require('../emails/trialReminderEmail');
const trialReminderConfig = require('../config/trialReminderConfig');

const EUR_TO_MKD = Number(process.env.INVOICE_EUR_TO_MKD || 61.5);
const CYCLE_LABEL = { monthly: 'Месечно', quarterly: 'Квартално', annual: 'Годишно' };
const DAY = 86400000;

/**
 * Finds promo-trial users approaching the end of their 30-day window and emails
 * them a "subscription offer" pro-invoice (tier as signed up, all three cycles)
 * so they can pay by bank transfer. Idempotent per stage via
 * subscription.remindersSent[].
 *
 * Targeting: a code-redeemed user is { status:'active', paidVia:'promo' } with a
 * future endsAt. Once they request an invoice they move to 'pending_approval',
 * and a real payment flips paidVia away from 'promo' — both drop out of scope.
 */
class TrialReminderService {
  constructor(db, emailService) {
    this.users = db.collection('users');
    this.emailService = emailService;
    this.frontendUrl = process.env.FRONTEND_URL || 'https://nexa.mk';
  }

  /** Whole days from now until `endsAt` (rounded up; ≥0 while in window). */
  static daysLeft(endsAt, now = new Date()) {
    return Math.ceil((new Date(endsAt).getTime() - now.getTime()) / DAY);
  }

  /**
   * The single stage that is currently due, or null. We pick the most-urgent
   * applicable stage (smallest days-threshold that is still ≥ daysLeft) and send
   * it only if unsent. Picking the *current* stage (rather than any unsent one)
   * prevents downgrading — e.g. never fire the 7-day email after the 2-day one.
   */
  static dueStage(sub, now = new Date()) {
    if (!sub?.endsAt) return null;
    const dl = TrialReminderService.daysLeft(sub.endsAt, now);
    if (dl < 0) return null;
    const sentKeys = new Set((sub.remindersSent || []).map(r => r.stage));
    const applicable = trialReminderConfig.STAGES
      .filter(s => s.daysLeft >= dl)
      .sort((a, b) => a.daysLeft - b.daysLeft); // smallest threshold = most urgent
    const current = applicable[0];
    if (!current || sentKeys.has(current.key)) return null;
    return current;
  }

  /** Find candidate users whose promo window is inside the widest stage. */
  async _findCandidates(now) {
    const maxDays = Math.max(...trialReminderConfig.STAGES.map(s => s.daysLeft));
    const horizon = new Date(now.getTime() + (maxDays + 1) * DAY);
    return this.users.find({
      role: { $ne: 'admin' },
      email: { $exists: true, $nin: [null, ''] },
      'subscription.status': 'active',
      'subscription.paidVia': 'promo',
      'subscription.endsAt': { $gt: now, $lte: horizon }
    }).toArray();
  }

  /** Build the 3-cycle option list for the user's plan. */
  static _options(planKey) {
    const prices = PLAN_PRICES[planKey] || PLAN_PRICES.pro;
    return ['monthly', 'quarterly', 'annual'].map(cycle => ({
      cycle,
      label: CYCLE_LABEL[cycle],
      eur: prices[cycle],
      mkd: Math.round((prices[cycle] || 0) * EUR_TO_MKD)
    }));
  }

  async sendOffer(user, stage) {
    const sub = user.subscription || {};
    const planKey = sub.plan || user.intendedPlan || 'pro';
    const planLabel = PLAN_LABELS[planKey]?.mk || 'Про';
    const options = TrialReminderService._options(planKey);
    const ci = user.companyInfo || {};
    const buyerName = ci.companyName || user.fullName || user.username || '—';

    const offer = {
      buyer: {
        companyName: buyerName,
        address: ci.companyAddress || '—',
        taxNumber: ci.companyTaxNumber || '—',
        email: user.email || '—',
        manager: ci.companyManager || ''
      },
      issuer: { ...ProInvoicesService.ISSUER },
      planLabel,
      options,
      reference: `Nexa претплата — ${buyerName}`,
      trialEndsAt: sub.endsAt
    };

    const pdfBuffer = await renderSubscriptionOfferPdf(offer);
    const daysLeft = Math.max(0, TrialReminderService.daysLeft(sub.endsAt));
    const { subject, html } = trialReminderEmail({
      name: user.fullName || user.username || '',
      planLabel,
      daysLeft,
      trialEndsAt: sub.endsAt,
      options,
      appUrl: `${this.frontendUrl}/terminal/subscription`,
      final: stage.key === 'offer_d2'
    });

    const result = await this.emailService.sendEmail(user.email, subject, html, {
      attachments: [{ filename: 'ponuda-nexa-pretplata.pdf', content: pdfBuffer }]
    });

    if (result && result.success === false) {
      throw new Error(result.error || 'Email send failed');
    }

    // Record so we never resend this stage.
    await this.users.updateOne(
      { _id: user._id },
      {
        $push: { 'subscription.remindersSent': { stage: stage.key, sentAt: new Date(), channel: 'email' } },
        $set: { updatedAt: new Date() }
      }
    );
    return true;
  }

  /** Evaluate all candidates and send any due stage. Returns a summary. */
  async runOnce(now = new Date()) {
    const candidates = await this._findCandidates(now);
    let sent = 0, skipped = 0, failed = 0;

    for (const user of candidates) {
      const stage = TrialReminderService.dueStage(user.subscription, now);
      if (!stage) { skipped++; continue; }
      try {
        await this.sendOffer(user, stage);
        sent++;
        console.log(`[TrialReminder] sent ${stage.key} → ${user.email}`);
      } catch (e) {
        failed++;
        console.error(`[TrialReminder] failed for ${user.email}:`, e.message);
      }
    }

    return { candidates: candidates.length, sent, skipped, failed };
  }
}

module.exports = TrialReminderService;
