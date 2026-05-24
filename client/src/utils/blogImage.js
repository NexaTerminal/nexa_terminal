/**
 * Normalize a blog image src.
 * - Already-absolute URLs (http://, https://, data:) → returned unchanged
 * - Paths starting with "/" → returned unchanged (e.g. "/images/blog/foo.jpg")
 * - Anything else (bare filename like "business, marketing, managment3.jpg")
 *   → assumed to live under /images/blog/, prepended accordingly
 *
 * URI-encodes the final result so spaces/commas don't break the request.
 *
 * Defensive: some legacy posts in the DB stored just the filename without
 * the path prefix, which would 404 because the browser resolved it relative
 * to the current page URL.
 */
export function resolveBlogImage(src) {
  if (!src) return '';
  if (/^(https?:|data:)/i.test(src)) return src;
  const path = src.startsWith('/') ? src : `/images/blog/${src}`;
  return encodeURI(path);
}
