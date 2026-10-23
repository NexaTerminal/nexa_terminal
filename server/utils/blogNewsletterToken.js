const crypto = require('crypto');

// Signed per-article unlock token for newsletter links (/blog/<slug>?nl=<token>).
// Bound to the blog _id (not the slug, which changes when the title is edited).
// Format: <expiry unix seconds, base36>.<HMAC-SHA256 base64url, truncated>

const DEFAULT_DAYS = 30;

function getKey() {
  const secret = process.env.BLOG_NEWSLETTER_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('BLOG_NEWSLETTER_SECRET / JWT_SECRET not set');
  return secret;
}

function hmac(blogId, exp) {
  return crypto
    .createHmac('sha256', getKey())
    .update(`blog-nl|${blogId}|${exp}`)
    .digest('base64url')
    .slice(0, 22);
}

function sign(blogId, days = DEFAULT_DAYS) {
  const exp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
  const expStr = exp.toString(36);
  return { token: `${expStr}.${hmac(blogId, expStr)}`, expiresAt: new Date(exp * 1000) };
}

function verify(blogId, token) {
  if (!blogId || typeof token !== 'string' || token.length > 64) return false;
  const [expStr, sig] = token.split('.');
  if (!expStr || !sig) return false;
  const exp = parseInt(expStr, 36);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = Buffer.from(hmac(blogId, expStr));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

module.exports = { sign, verify, DEFAULT_DAYS };
