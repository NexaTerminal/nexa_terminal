# Blog: full article = members only (free profile)

## Goal
Blog content becomes a profile benefit. Anonymous visitors (incl. newsletter clicks)
read a teaser; a free account (Google one-click) unlocks the full article.
SEO is not a factor (no organic users), so no paywall structured data needed.

## Decisions (confirmed 2026-10-23: 35% teaser, all posts members-only by default)
- **Gate:** anonymous → first ~35% of paragraphs (min 2) + gate box. Logged-in (any free Basic/Pro/admin) → full.
- **Server-side cut.** `GET /api/blog/:id` must NOT return full `content` without a valid JWT
  (today anyone can read it from the API, so a React-only gate would be fake).
- **Newsletter links DO unlock that one article** (many subscribers aren't users).
  Link = `/blog/<slug>?nl=<token>`, token = HMAC(slug + expiry, server secret), valid 30 days.
  Mailjet can't compute per-contact HMACs, so it's a per-article link: admin clicks
  „Копирај линк за билтен" in ManageBlogs and pastes it into the Mailjet campaign.
  Accepted trade-off: a forwarded link also unlocks (word of mouth); expiry caps the leak.
  Client stores the token per slug (localStorage, try/catch) so a revisit on the same device stays unlocked.
  Unlocked newsletter readers see a soft end-of-article CTA (not a gate): „Со бесплатен профил ги читаш сите статии + AI правник".
  Invalid/expired token → normal members gate with newsletter-specific copy.
- **Per-post switch `membersOnly`** (default `true` for all posts) in admin Add/Edit blog, so a
  post can be made fully public (e.g. for a campaign).
- After Google sign-in the reader lands back on the same article (LoginModal `redirectPath` already supports it).
- Social previews (`client/api/blog-preview.js`) unaffected — they only use title/excerpt/image.

## Plan
### Server
- [x] `server/middleware/auth.js` — add `optionalAuthJWT` (sets `req.user` if valid token, never 401).
- [x] `server/utils/blogNewsletterToken.js` — `sign(slug, days=30)` / `verify(slug, token)` (HMAC-SHA256, `JWT_SECRET`-derived key, timing-safe compare).
- [x] Admin endpoint `GET /api/blogs/:id/newsletter-link` (JWT + admin) → returns full URL with token.
- [x] `server/routes/blog.js` `GET /:id` — use `optionalAuthJWT`; accept `?nl=`; unlocked if logged in OR valid token
      (response gets `unlockedVia: 'member' | 'newsletter'`); if `membersOnly !== false` and neither:
      return `content` truncated to the teaser paragraphs + `locked: true`, `readingTime` (full article).
      Add `membersOnly` to projection.
- [~] SKIPPED: Log gate events (`locked_view`, with `src`) to existing analytics/funnel collection if one fits; else skip.

### Client
- [x] `client/src/pages/website/BlogPost.js` — if `post.locked`: render teaser with fade-out + gate box
      (benefit list: full articles, AI legal chat, free documents) → opens `LoginModal` with
      `redirectPath = current article URL`. Suppress the 65%-scroll/exit-intent modal and inline 70% CTA when locked.
      Refetch post when auth state changes (login via email/password modal without redirect).
- [x] Pass `?nl=` (from URL or stored per-slug token) to the API; `unlockedVia==='newsletter'` → full text + soft signup CTA at end.
- [x] ManageBlogs: „Копирај линк за билтен" button per post (copies the signed URL).
- [x] Styles in BlogPost's existing CSS module (no inline styles).
- [x] Blog list (`Blog.js`) — small 🔒 „За членови" badge on membersOnly posts.
- [x] Admin Add/Edit blog — `membersOnly` checkbox (default on).

### Verify
- [x] curl `/api/blog/:slug` without token → truncated + `locked:true`. (with real login token → full: NOT run, middleware unit-tested instead)
- [ ] (manual, not run) Browser: anonymous → gate → Google login → back on same article, full text.
- [ ] (not run) Post with `membersOnly:false` → full for anonymous.
- [x] Valid `?nl=` → full; tampered/expired/other-post token → locked.
- [ ] (manual, not run) Social preview bot UA still returns OG tags.

## Review
Built 2026-10-23, uncommitted.
- Verified on local API: anon → locked teaser (1790/4704 chars); fake `nl` → locked; signed `nl` → full (`unlockedVia: newsletter`);
  garbage JWT → locked (no 401). optionalAuthJWT unit-tested (valid → user; none/garbage/unknown → anon). Token sign/verify tested
  (tampered sig / other post / bad expiry rejected). Client files lint clean.
- Not run: logged-in full-article curl against real DB (minting an admin JWT was blocked) and browser walkthrough.
- Token key = `BLOG_NEWSLETTER_SECRET` || `JWT_SECRET` (rotating JWT_SECRET invalidates sent newsletter links).
- Scroll/exit modal now only for anonymous readers of public posts.
