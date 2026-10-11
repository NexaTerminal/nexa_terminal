'use strict';

/**
 * Resend inbound email — the ONLY intake/notify channel for satellite enquiries.
 *
 * info@nexa.mk is routed to Resend (MX/receiving). When a satellite site emails an
 * enquiry, Resend fires an `email.received` webhook → POST /api/public/inquiry/inbound
 * → we fetch the full body via the Resend Receiving API, anonymize it, auto-post it to
 * the inquiry board, and email the visitor an opt-out link. All outbound mail for this
 * feature (visitor opt-out + admin notices) is sent FROM info@nexa.mk via Resend.
 *
 * Push-based — no polling, nothing to miss. A manual „pull recent" backstop
 * (emails.receiving.list) covers the rare case of a dropped webhook.
 *
 * OFF unless RESEND_INBOUND_ENABLED=true. Signature verification requires
 * RESEND_INBOUND_WEBHOOK_SECRET (the whsec_… from the Resend webhook settings).
 */

const DEFAULT_SENDERS = [
  'samodaprasham.mk',
  'immigration.mk',
  'macedoniancitizenship.mk',
  'company.nexa.mk',
  'iplaw.nexa.mk',
  'tax.nexa.mk',
];

const SENDER_TO_SOURCE = Object.freeze({
  'samodaprasham.mk': 'samodaprasham.mk',
  'immigration.mk': 'immigration.mk',
  'macedoniancitizenship.mk': 'macedoniancitizenship.mk',
  'company.nexa.mk': 'company.nexa.mk',
  'iplaw.nexa.mk': 'iplaw.nexa.mk',
  'tax.nexa.mk': 'tax.nexa.mk',
});

module.exports = Object.freeze({
  ENABLED: process.env.RESEND_INBOUND_ENABLED === 'true',

  // Secret from the Resend dashboard webhook (Standard Webhooks / Svix, whsec_…).
  WEBHOOK_SECRET: process.env.RESEND_INBOUND_WEBHOOK_SECRET || '',

  // The single channel address. All feature email is sent FROM here.
  FROM: process.env.INQUIRY_FROM_EMAIL || 'info@nexa.mk',

  // Only process mail from these satellite sender domains.
  SENDERS: (process.env.RESEND_INBOUND_SENDERS
    ? process.env.RESEND_INBOUND_SENDERS.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SENDERS),

  // Backstop „pull recent" cap.
  MAX_RECENT: parseInt(process.env.RESEND_INBOUND_MAX_RECENT || '25', 10),

  // Where to warn when an email can't be auto-posted (no parseable visitor email).
  NOTIFY_EMAIL: process.env.ADMIN_EMAIL || 'terminalnexa@gmail.com',

  SENDER_TO_SOURCE,

  /** Whether the inbound channel is usable (enabled + secret present). */
  isConfigured() { return this.ENABLED && !!this.WEBHOOK_SECRET; },

  /** Map a satellite sender address/domain to an inquiry source, or null. */
  sourceForSender(fromAddress) {
    const addr = String(fromAddress || '').toLowerCase();
    for (const domain of Object.keys(SENDER_TO_SOURCE)) {
      if (addr.includes(domain)) return SENDER_TO_SOURCE[domain];
    }
    return null;
  },

  /** True if the sender is an allowed satellite domain. */
  isAllowedSender(fromAddress) {
    const addr = String(fromAddress || '').toLowerCase();
    return this.SENDERS.some((d) => addr.includes(d.toLowerCase()));
  },
});
