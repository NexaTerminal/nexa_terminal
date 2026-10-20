const crypto = require('crypto');

/**
 * Founder invite — the single reusable secret that authorizes INSTANT Pro
 * signup on leads.nexa.mk. Lives in env (LEADS_FOUNDER_INVITE_TOKEN):
 *   - rotate the link   → change the var
 *   - freeze new Pros   → unset the var (then isValidFounderInvite always false)
 *
 * The recipient never sees or types it — it rides in the /join link and the
 * Google OAuth `state`, and is verified here server-side (constant-time compare).
 */
function isValidFounderInvite(token) {
  const secret = process.env.LEADS_FOUNDER_INVITE_TOKEN || '';
  if (!secret) return false;
  const a = Buffer.from(String(token || ''));
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch (_) {
    return false;
  }
}

module.exports = { isValidFounderInvite };
