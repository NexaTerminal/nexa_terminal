'use strict';

/**
 * Resend inbound email webhook (public, signature-verified, mounted BEFORE
 * express.json with a RAW body parser — the signature is computed over the raw
 * bytes). Resend fires `email.received` when a satellite enquiry lands at
 * info@nexa.mk; we verify, then hand the email id to the ingest service.
 *
 * Returns 200 quickly and processes in the background so Resend doesn't retry on
 * slow AI calls. Inert (503) unless the inbound channel is configured.
 */

const express = require('express');
const cfg = require('../config/resendInboundConfig');
const emailService = require('../services/emailService');
const inquiryIngest = require('../services/inquiryIngestService');

const router = express.Router();

// Raw body: required so the Standard Webhooks / Svix signature can be verified.
router.post('/', express.raw({ type: '*/*', limit: '5mb' }), async (req, res) => {
  if (!cfg.isConfigured()) return res.status(503).json({ ok: false, error: 'inbound not configured' });

  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  const h = req.headers;
  // Resend uses the Svix header set; accept the standard-webhooks aliases too.
  const headers = {
    id: h['svix-id'] || h['webhook-id'] || '',
    timestamp: h['svix-timestamp'] || h['webhook-timestamp'] || '',
    signature: h['svix-signature'] || h['webhook-signature'] || '',
  };

  try {
    const resend = emailService.getResendClient();
    if (!resend) return res.status(503).json({ ok: false, error: 'resend not configured' });
    // Throws on an invalid signature.
    resend.webhooks.verify({ payload: raw, webhookSecret: cfg.WEBHOOK_SECRET, headers });
  } catch (e) {
    console.warn('[resendInbound] signature verification failed:', e.message);
    return res.status(401).json({ ok: false, error: 'invalid signature' });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return res.status(400).json({ ok: false, error: 'bad json' }); }

  if (event?.type !== 'email.received') {
    return res.status(200).json({ ok: true, ignored: event?.type || 'unknown' });
  }

  const emailId = event?.data?.email_id || event?.data?.id;
  if (!emailId) return res.status(200).json({ ok: true, ignored: 'no email_id' });

  // Ack immediately; do the AI extract + post in the background.
  res.status(200).json({ ok: true });
  const db = req.app.locals.db;
  Promise.resolve()
    .then(() => inquiryIngest.processReceivedEvent(emailId, db))
    .then((outcome) => console.log('[resendInbound] processed', emailId, '→', outcome))
    .catch((e) => console.error('[resendInbound] processing failed:', e.message));
});

module.exports = router;
