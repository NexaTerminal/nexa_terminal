/**
 * Document share tokens — stateless, HMAC-signed, short-lived links that let a Pro
 * user share a specific automated document for a stranger to fill in and generate.
 *
 * The link IS the data: nothing is persisted server-side. A token carries who owns
 * it (to charge their credits), which document it produces, and an optional client
 * company party + prefill. Validity is a short TTL (there is no durable catalog and
 * nothing to revoke — matching the "ephemeral link" requirement).
 *
 * Format:  base64url(payloadJSON) + "." + base64url(HMAC_SHA256(payloadB64, secret))
 */

const crypto = require('crypto');

const SECRET = () => process.env.DOC_SHARE_SECRET || process.env.JWT_SECRET || 'dev-doc-share-secret';
const TTL_MIN = () => parseInt(process.env.DOC_SHARE_TTL_MIN || '240', 10) || 240; // default 4h

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlJson = (obj) => b64url(JSON.stringify(obj));
const fromB64url = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function hmac(payloadB64) {
  return b64url(crypto.createHmac('sha256', SECRET()).update(payloadB64).digest());
}

/**
 * Sign a share payload. Adds iat/exp. `payload` should contain at least
 * { ownerId, apiEndpoint, documentType } and optionally { clientId, prefill }.
 */
function sign(payload) {
  const now = Math.floor(Date.now() / 1000);
  const full = { v: 1, iat: now, exp: now + TTL_MIN() * 60, ...payload };
  const payloadB64 = b64urlJson(full);
  return `${payloadB64}.${hmac(payloadB64)}`;
}

/**
 * Verify a token. Returns the payload, or throws an Error with a friendly message.
 */
function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Невалиден линк.');
  }
  const [payloadB64, sig] = token.split('.');
  const expected = hmac(payloadB64);
  // constant-time compare
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Линкот е неважечки или изменет.');
  }
  let payload;
  try {
    payload = JSON.parse(fromB64url(payloadB64).toString('utf8'));
  } catch (_) {
    throw new Error('Невалиден линк.');
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    throw new Error('Линкот е истечен. Побарајте нов линк.');
  }
  return payload;
}

function ttlMinutes() { return TTL_MIN(); }

module.exports = { sign, verify, ttlMinutes };
