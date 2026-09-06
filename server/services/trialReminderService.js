'use strict';

const { PLAN_PRICES, PLAN_LABELS } = require('../constants/roles');
const ProInvoicesService = require('./proInvoicesService');
const { renderSubscriptionOfferPdf } = require('./subscriptionOfferPdf');
const { trialReminderEmail } = require('../emails/trialReminderEmail');
const { trialEducationEmail } = require('../emails/trialEducationEmail');
const trialReminderConfig = require('../config/trialReminderConfig');
const tierService = require('./tierService');

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

  /** Whole days elapsed since `startedAt` (rounded down; 0 on the first day). */
  static elapsedDays(startedAt, now = new Date()) {
    if (!startedAt) return 0;
    return Math.floor((now.getTime() - new Date(startedAt).getTime()) / DAY);
  }

  /** True if `stage.audience` targets this subscription (trial vs promo code). */
  static stageMatchesAudience(stage, sub) {
    const a = stage.audience || 'all';
    if (a === 'all') return true;
    return sub?.trial ? a === 'trial' : a === 'promo';
  }

  /**
   * The single payment "offer" stage that is currently due, or null. We pick the
   * most-urgent applicable stage (smallest days-threshold still ≥ daysLeft) and
   * send it only if unsent. Picking the *current* stage (rather than any unsent
   * one) prevents downgrading — e.g. never fire the 7-day email after the 2-day
   * one. Stages whose audience doesn't match the subscription are skipped, so an
   * 8-day trial only ever gets offer_d2, not the too-early offer_d7.
   */
  static dueStage(sub, now = new Date()) {
    if (!sub?.endsAt) return null;
    const dl = TrialReminderService.daysLeft(sub.endsAt, now);
    if (dl < 0) return null;
    const sentKeys = new Set((sub.remindersSent || []).map(r => r.stage));
    const applicable = trialReminderConfig.STAGES
      .filter(s => TrialReminderService.stageMatchesAudience(s, sub))
      .filter(s => s.daysLeft >= dl)
      .sort((a, b) => a.daysLeft - b.daysLeft); // smallest threshold = most urgent
    const current = applicable[0];
    if (!current || sentKeys.has(current.key)) return null;
    return current;
  }

  /**
   * The next feature-education stage due for a self-serve trial user, or null.
   * Only trial subscriptions qualify. Forward-only: return the EARLIEST unsent
   * stage whose `sendOnDay` has arrived (by elapsed days), so the day-2 email
   * always precedes the day-3 one and neither is skipped if a run is missed.
   */
  static dueEducationStage(sub, now = new Date()) {
    if (!sub?.trial || !sub.startedAt) return null;
    const elapsed = TrialReminderService.elapsedDays(sub.startedAt, now);
    const sentKeys = new Set((sub.remindersSent || []).map(r => r.stage));
    const due = (trialReminderConfig.EDUCATION_STAGES || [])
      .filter(s => s.sendOnDay <= elapsed && !sentKeys.has(s.key))
      .sort((a, b) => a.sendOnDay - b.sendOnDay);
    return due[0] || null;
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

  /** Build the option list for the user's plan. Each tier is now sold as a
   * single ANNUAL offer (Basic €90/yr, Pro €190/yr), so we present only that —
   * monthly/quarterly are no longer purchasable at checkout. */
  static _options(planKey) {
    const prices = PLAN_PRICES[planKey] || PLAN_PRICES.pro;
    return ['annual'].map(cycle => ({
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
    // Product-aware branding: Pro (B) members get the lawyer brand + leads host.
    const product = tierService.planProduct(user);
    const appBase = product === 'B' ? 'https://leads.nexa.mk' : this.frontendUrl;
    const { subject, html } = trialReminderEmail({
      name: user.fullName || user.username || '',
      planLabel,
      daysLeft,
      trialEndsAt: sub.endsAt,
      options,
      appUrl: `${appBase}/terminal/subscription`,
      final: stage.key === 'offer_d2',
      product
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

  /**
   * Send a feature-education email (no proforma) for a self-serve trial user and
   * record the stage so it never resends.
   */
  async sendEducation(user, stage) {
    const sub = user.subscription || {};
    const daysLeft = Math.max(0, TrialReminderService.daysLeft(sub.endsAt));
    const product = tierService.planProduct(user);
    const appBase = product === 'B' ? 'https://leads.nexa.mk' : this.frontendUrl;
    const { subject, html } = trialEducationEmail({
      stageKey: stage.key,
      name: user.fullName || user.username || '',
      daysLeft,
      appBase,
      product
    });

    const result = await this.emailService.sendEmail(user.email, subject, html);
    if (result && result.success === false) {
      throw new Error(result.error || 'Email send failed');
    }

    await this.users.updateOne(
      { _id: user._id },
      {
        $push: { 'subscription.remindersSent': { stage: stage.key, sentAt: new Date(), channel: 'email' } },
        $set: { updatedAt: new Date() }
      }
    );
    return true;
  }

  /**
   * Evaluate all candidates and send at most one due email each. Education
   * stages (trial-only feature tours, days 2–3) take priority over the payment
   * proforma so a trial user learns the product before being asked to pay.
   * Returns a summary.
   */
  async runOnce(now = new Date()) {
    const candidates = await this._findCandidates(now);
    let sent = 0, skipped = 0, failed = 0;

    for (const user of candidates) {
      const eduStage = TrialReminderService.dueEducationStage(user.subscription, now);
      const offerStage = eduStage ? null : TrialReminderService.dueStage(user.subscription, now);
      const stage = eduStage || offerStage;
      if (!stage) { skipped++; continue; }
      try {
        if (eduStage) await this.sendEducation(user, eduStage);
        else await this.sendOffer(user, offerStage);
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
