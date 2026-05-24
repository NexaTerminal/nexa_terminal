/**
 * HMAC verification for the inbound lead webhook.
 *
 * Each satellite site has its own shared secret in env:
 *   LEAD_WEBHOOK_SECRET_SAMODAPRASHAM
 *   LEAD_WEBHOOK_SECRET_IMMIGRATION
 *   LEAD_WEBHOOK_SECRET_MACEDONIANCITIZENSHIP
 *   LEAD_WEBHOOK_SECRET_COMPANY
 *   LEAD_WEBHOOK_SECRET_IPLAW
 *   LEAD_WEBHOOK_SECRET_TOPICS
 *   LEAD_WEBHOOK_SECRET_NEXA          (for /pricing application form posts)
 *
 * Optional bypass for local development: LEAD_WEBHOOK_BYPASS_HMAC=true.
 *
 * Signature: HMAC-SHA256 of the raw JSON body, hex-encoded, in `X-Nexa-Signature`.
 * Timestamp drift protection: optional `X-Nexa-Timestamp` (UNIX seconds);
 * if present, must be within ±5 minutes of server clock.
 *
 * Requires `express.raw({type:'application/json'})` upstream to access req.rawBody.
 * For simplicity we re-stringify req.body deterministically when raw body is missing.
 */

const crypto = require('crypto');

const SITE_SECRETS = {
  samodaprasham:        process.env.LEAD_WEBHOOK_SECRET_SAMODAPRASHAM,
  immigration:          process.env.LEAD_WEBHOOK_SECRET_IMMIGRATION,
  macedoniancitizenship:process.env.LEAD_WEBHOOK_SECRET_MACEDONIANCITIZENSHIP,
  company:              process.env.LEAD_WEBHOOK_SECRET_COMPANY,
  iplaw:                process.env.LEAD_WEBHOOK_SECRET_IPLAW,
  topics:               process.env.LEAD_WEBHOOK_SECRET_TOPICS,
  nexa:                 process.env.LEAD_WEBHOOK_SECRET_NEXA
};

const timingSafeEqualHex = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch { return false; }
};

const computeSignature = (secret, payloadString) =>
  crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

module.exports = function leadWebhookHmac(req, res, next) {
  // Allow public POSTs from the Pricing page (logged-in user already auth'd
  // before this middleware was added) — those will set sourceSite='nexa' and
  // we still verify if a secret is configured. If no secret is configured,
  // we accept the request as a soft-launch fallback ONLY in development.
  if (process.env.LEAD_WEBHOOK_BYPASS_HMAC === 'true') return next();

  const body = req.body || {};
  const sourceSite = String(body.sourceSite || '').toLowerCase();
  const secret = SITE_SECRETS[sourceSite];

  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev fallback: allow but warn.
      console.warn(`[leadWebhookHmac] No secret configured for "${sourceSite}" — accepting in dev.`);
      return next();
    }
    return res.status(400).json({ success: false, code: 'UNKNOWN_SOURCE', message: 'Unknown source site' });
  }

  const provided = req.get('X-Nexa-Signature');
  if (!provided) {
    return res.status(400).json({ success: false, code: 'SIGNATURE_MISSING', message: 'Missing X-Nexa-Signature' });
  }

  // Reconstruct the canonical signed payload. Prefer raw body if captured; else stringify.
  const payloadString = req.rawBody && req.rawBody.length
    ? req.rawBody.toString('utf8')
    : JSON.stringify(body);

  const expected = computeSignature(secret, payloadString);
  if (!timingSafeEqualHex(provided.trim().toLowerCase(), expected)) {
    return res.status(400).json({ success: false, code: 'SIGNATURE_INVALID', message: 'Invalid signature' });
  }

  // Optional timestamp drift check
  const tsHeader = req.get('X-Nexa-Timestamp');
  if (tsHeader) {
    const ts = parseInt(tsHeader, 10);
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      return res.status(400).json({ success: false, code: 'TIMESTAMP_INVALID', message: 'Timestamp out of window' });
    }
  }

  next();
};

module.exports.computeSignature = computeSignature;
module.exports.SITE_SECRETS = SITE_SECRETS;
