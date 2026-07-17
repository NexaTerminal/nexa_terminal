// Plain-text → email-HTML converter for admin-authored cold-email bodies.
//
// The Send-invite modal lets the admin write in normal text. This turns that
// text into the paragraph HTML that wrap()/wrapInvite() expect, while leaving
// existing rich HTML bodies (the built-in default template) untouched so the
// change is fully backward-compatible.

// Block-level tags whose presence means "this is already HTML, don't touch it".
const HTML_BLOCK_RE = /<(p|ul|ol|li|div|h[1-6]|table|br|blockquote|img|a)\b/i;

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Turn bare URLs into links AFTER escaping (so we control the markup).
const URL_RE = /(https?:\/\/[^\s<]+)/g;
const linkify = (escaped) =>
  escaped.replace(URL_RE, (url) => {
    // Don't swallow trailing sentence punctuation into the href.
    const trailing = /[.,;:!?)]+$/.exec(url);
    let href = url;
    let tail = '';
    if (trailing) { href = url.slice(0, -trailing[0].length); tail = trailing[0]; }
    return `<a href="${href}" target="_blank" style="color:#1E4DB7;">${href}</a>${tail}`;
  });

/**
 * Convert an admin-authored body to email HTML.
 * - If it already contains block HTML, return it unchanged (back-compat).
 * - Otherwise: split on blank lines into <p> paragraphs, convert single
 *   newlines to <br/>, escape HTML, and auto-link bare URLs.
 * Empty / whitespace-only input returns ''.
 */
function bodyToHtml(body) {
  const text = (body == null ? '' : String(body)).trim();
  if (!text) return '';
  if (HTML_BLOCK_RE.test(text)) return text; // already HTML — leave as-is

  return text
    .split(/\n\s*\n/)                       // blank line separates paragraphs
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const html = linkify(escapeHtml(para)).replace(/\n/g, '<br/>');
      return `<p>${html}</p>`;
    })
    .join('\n');
}

/** True when the body is plain text (would be transformed by bodyToHtml). */
function isPlainText(body) {
  const text = (body == null ? '' : String(body)).trim();
  return text !== '' && !HTML_BLOCK_RE.test(text);
}

module.exports = { bodyToHtml, isPlainText };
