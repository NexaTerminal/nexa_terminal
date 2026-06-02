'use strict';

/**
 * Email normalization for global uniqueness across accounts.
 *
 * Rules:
 *   - lowercase the whole address
 *   - strip the `+...` suffix in the local part (a+x@b.com → a@b.com)
 *   - treat `@googlemail.com` as `@gmail.com`
 *   - for Gmail (and Googlemail) also strip dots in the local part
 *     (a.b@gmail.com → ab@gmail.com)
 *
 * Returns null when the input is missing or doesn't contain "@".
 */
function normalizeEmail(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed.includes('@')) return null;

  const atIdx = trimmed.lastIndexOf('@');
  let local  = trimmed.slice(0, atIdx);
  let domain = trimmed.slice(atIdx + 1);

  // Strip plus-aliasing across all providers.
  const plusIdx = local.indexOf('+');
  if (plusIdx > 0) local = local.slice(0, plusIdx);

  // Gmail / Googlemail: dots in local part are ignored; alias domains collapse.
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') {
    local = local.replace(/\./g, '');
  }

  if (!local) return null;
  return `${local}@${domain}`;
}

/**
 * Loose validator — good enough for signup forms. Real validation
 * happens by sending the verification code to the address.
 */
function isValidEmail(s) {
  if (!s || typeof s !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

module.exports = { normalizeEmail, isValidEmail };
