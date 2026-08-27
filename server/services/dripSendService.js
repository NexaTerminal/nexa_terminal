'use strict';

const moment = require('moment-timezone');
const dripConfig = require('../config/dripConfig');
const subscriptionEmails = require('../emails/subscriptionEmails');
const { bodyToHtml } = require('../emails/emailBody');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Daily drip sender.
 *
 * runOnce() releases up to `perDay` promo invites PER bucket (basic / pro). It
 * is idempotent and restart-safe: instead of blindly sending N, it counts how
 * many of that bucket already went out TODAY and only tops up the remainder —
 * so a container restart, redeploy, or manual "Run now" can never overshoot the
 * daily cap or double-send.
 *
 * For each contact it:
 *   1. skips anyone already in the invited-prospects ledger (global dedup);
 *   2. records the send in the ledger (for click-tracking + future dedup);
 *   3. sends the promo invite (bucket's chosen code + optional saved copy);
 *   4. flips the contact to 'sent' / 'failed'.
 *
 * Sends are paced by SEND_INTERVAL_MS to stay under Resend's rate limit.
 */
class DripSendService {
  constructor({ contactListService, dripSettingsService, invitedProspectsService,
                coldEmailTemplateService, promoCodeService, emailService }) {
    this.contacts = contactListService;
    this.settings = dripSettingsService;
    this.ledger = invitedProspectsService;
    this.templates = coldEmailTemplateService;
    this.promoCodes = promoCodeService;
    this.email = emailService;
  }

  /** Start of "today" in the configured timezone (for the daily count). */
  _startOfToday(now = new Date()) {
    return moment(now).tz(dripConfig.TIMEZONE).startOf('day').toDate();
  }

  /**
   * Run one drip pass. Returns a per-bucket summary. Honors the pause switch:
   * if settings.enabled is false, no-ops and reports paused:true.
   */
  async runOnce(now = new Date()) {
    const settings = await this.settings.get();
    if (!settings.enabled) {
      console.log('[Drip] runOnce skipped — paused (settings.enabled=false)');
      return { paused: true, basic: { sent: 0, failed: 0, skipped: 0 }, pro: { sent: 0, failed: 0, skipped: 0 } };
    }
    const since = this._startOfToday(now);
    console.log(`[Drip] runOnce start — since=${since.toISOString()}`);
    const result = { paused: false };
    for (const type of ['basic', 'pro']) {
      result[type] = await this._runBucket(type, settings[type], since);
    }
    console.log('[Drip] runOnce done →', JSON.stringify({ basic: result.basic, pro: result.pro }));
    return result;
  }

  async _runBucket(type, bucket, since) {
    const out = { sent: 0, failed: 0, skipped: 0, remaining: 0 };
    if (!bucket || !bucket.code) {                          // bucket not configured
      console.log(`[Drip:${type}] no code configured — did you click "Зачувај поставки"? (0 sent)`);
      return out;
    }
    const perDay = bucket.perDay || dripConfig.PER_TYPE_PER_DAY;

    const sentToday = await this.contacts.countSentSince(type, since, bucket.listId);
    const remaining = perDay - sentToday;
    out.remaining = Math.max(0, remaining);
    if (remaining <= 0) {                                   // quota already met today
      console.log(`[Drip:${type}] daily quota met — perDay=${perDay}, sentToday=${sentToday} (0 sent)`);
      return out;
    }

    const codeDoc = await this.promoCodes.findByCode(bucket.code);
    if (!codeDoc) {                                         // code deleted/renamed — skip safely
      console.log(`[Drip:${type}] promo code "${bucket.code}" not found — skipping (0 sent)`);
      return out;
    }

    // Grab a few extra so ledger-dedup skips don't shrink the batch below quota.
    const candidates = await this.contacts.pickPending(type, remaining + 10, bucket.listId);
    console.log(`[Drip:${type}] code=${codeDoc.code} perDay=${perDay} sentToday=${sentToday} remaining=${remaining} pending=${candidates.length}`);
    if (candidates.length === 0) {                          // list dry — stops cleanly
      console.log(`[Drip:${type}] no pending contacts left (0 sent)`);
      return out;
    }

    // Base email parts from the promo code (host/plan/CTA derived from the code),
    // optionally overridden by the bucket's saved cold-email copy.
    const baseParts = subscriptionEmails.promoInviteParts(
      { code: codeDoc.code, plan: codeDoc.plan, days: codeDoc.promoDays || 30 },
      bucket.language
    );
    if (bucket.templateId && this.templates) {
      const tpl = await this._loadTemplate(bucket.templateId);
      if (tpl) {
        if (tpl.subject) baseParts.subject = tpl.subject.trim();
        if (tpl.body) baseParts.body = bodyToHtml(tpl.body);
      }
    }

    let released = 0;
    for (const c of candidates) {
      if (released >= remaining) break;

      // Global dedup: never email someone already invited/queued elsewhere.
      const already = await this.ledger.findExisting([c.email]);
      if (already.has(String(c.email).trim().toLowerCase())) {
        await this.contacts.markContact(c._id, 'unsubscribed'); // parked, not counted
        out.skipped++;
        console.log(`[Drip:${type}] skip ${c.email} — already in invited-prospects ledger`);
        continue;
      }

      // Record intent in the ledger first, so a crash mid-send can't lose the
      // dedup and the CTA can carry a per-prospect tracking id.
      let prospectId = null;
      try {
        const doc = await this.ledger.record({
          email: c.email, code: codeDoc.code, plan: codeDoc.plan,
          language: bucket.language, subject: baseParts.subject, status: 'queued',
        });
        prospectId = doc?._id || null;
      } catch (_) { /* ledger optional */ }

      const ctaUrl = prospectId ? `${baseParts.ctaUrl}&p=${prospectId}` : baseParts.ctaUrl;
      const tpl = subscriptionEmails.wrapInvite({ ...baseParts, ctaUrl }, bucket.language);

      let ok = false;
      try {
        const r = await this.email.sendEmail(c.email, tpl.subject, tpl.html);
        ok = r?.success !== false;
      } catch (_) { ok = false; }

      console.log(`[Drip:${type}] ${ok ? 'sent ✅' : 'FAILED ❌'} ${c.email}`);
      await this.contacts.markContact(c._id, ok ? 'sent' : 'failed');
      if (prospectId) {
        try { await this.ledger.setStatus(prospectId, ok ? 'sent' : 'failed'); } catch (_) {}
      }
      if (ok) out.sent++; else out.failed++;
      released++;

      if (released < remaining && dripConfig.SEND_INTERVAL_MS > 0) {
        await sleep(dripConfig.SEND_INTERVAL_MS);
      }
    }
    return out;
  }

  async _loadTemplate(templateId) {
    try {
      const { ObjectId } = require('mongodb');
      // coldEmailTemplateService.list is per-owner; read the raw doc directly.
      return await this.templates.col.findOne({ _id: new ObjectId(templateId) });
    } catch (_) { return null; }
  }
}

module.exports = DripSendService;
