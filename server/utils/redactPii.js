/**
 * redactPii — deterministic safety net that scrubs identity-revealing data from
 * text that is about to be shown to a third party (a Pro on the request board,
 * or a member on the inquiry board).
 *
 * Pattern-based: it catches contact details and long numeric identifiers
 * (emails, URLs, phone numbers, EMBG/tax/registry numbers), NOT personal names —
 * names rely on the LLM anonymizing, or on the text being a short non-identifying
 * teaser. Used as a belt over LLM output and over no-LLM fallbacks (which may
 * echo raw user text).
 */

const REDACTED = '[отстрането]';

function redactPii(text) {
  return String(text == null ? '' : text)
    // Emails
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, REDACTED)
    // URLs / web addresses
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, REDACTED)
    // Phone numbers (+389…, 07x…, grouped digits) — 8+ digits allowing separators
    .replace(/(?:\+?\d[\d\s()./-]{7,}\d)/g, (m) => (m.replace(/\D/g, '').length >= 8 ? REDACTED : m))
    // Long bare identifiers (EMBG 13, tax/registry numbers) — 7+ consecutive digits
    .replace(/\b\d{7,}\b/g, REDACTED)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Same, line by line — keeps the paragraph structure of multi-line text
// (transcripts, chat messages) instead of collapsing it into one line.
function redactPiiKeepLines(text) {
  return String(text == null ? '' : text).split('\n').map(redactPii).join('\n').trim();
}

module.exports = { redactPii, redactPiiKeepLines, REDACTED };
