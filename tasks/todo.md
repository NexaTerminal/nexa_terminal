# Admin user stats & actions — Phase 1 + 2

Goal: richer per-user admin view (credits, login/logout history, feature usage) so
we can understand behaviour early. Server-side tracking only (reliable, no client noise).

## Context (what already exists)
- Drawer timeline source: `server/services/userActivityService.js` — pure-read aggregator
  already pulling: account created/emailVerified/lastLogin, subscription lifecycle,
  invoices, **documents** (`template_generations`), **compliance** (lhc/mhc/chc/hhc),
  blog submissions, inquiry signals, topics, admin `audit_logs`.
- Credits: `creditService.getUserCredits()` + `credit_transactions` collection. Not surfaced.
- `activity_logs` + `user_analytics` via `userAnalyticsService.trackActivity` — only wired
  for admin actions today.
- `user.lastLogin` set on **username** login only; not on passport/local or Google.

## Phase 1 — Surface existing data (no new tracking)
- [ ] `userActivityService`: also read `credit_transactions` (spend / weekly reset / initial)
      → timeline events (`credit.spent`, `credit.reset`, `credit.granted`).
- [ ] `userActivityService`: also read `activity_logs` (login/logout/feature) → timeline.
- [ ] `adminUsersController.getOne`: attach `credits` (balance, weeklyAllocation, nextReset,
      lifetimeSpent) + `stats` (docs count, compliance count, lastActive, loginCount).
- [ ] `AllUsers.js` drawer: add **Credits** block + **stats strip**; add icons/labels for the
      new timeline event types in `ActivityTimeline`.

## Phase 2 — Capture missing signals (server-side)
- [ ] `authController`: add `recordAuthEvent(req, userId, kind, meta)` → writes `login`/`logout`
      to `activity_logs` (ip + userAgent + method).
- [ ] Call it in: `loginUsername`, `/login` (passport local, auth.js), Google callback, `logout`.
- [ ] Also call `userService.updateLastLogin` in passport-local + Google (currently username-only).
- [ ] Wire `activityLogger` feature tracking to key endpoints NOT already captured by an output
      collection — primarily **AI/chatbot query**. (Docs/compliance/blog/topics already captured.)

## Verify
- [ ] Login (username + Google) writes a `login` row; logout writes `logout`.
- [ ] Drawer shows Credits block + stats strip + credit/login events in timeline.
- [ ] No double-counting of docs/compliance (still single events).

## Review — DONE (Phase 1 + 2)
Backend:
- `userActivityService.js`: timeline now also reads `credit_transactions`
  (spent/reset/granted) and `activity_logs` (login/logout/ai_query/feature).
  Admin-side actions filtered out here to avoid dup with `audit_logs`.
- `adminUsersController.getOne`: attaches `credits` (balance/quota/lifetimeSpent/nextReset)
  and `stats` (documents, compliance, aiQueries, logins, lastLogin, memberSince). Both best-effort.
- `authController.recordAuthEvent()` helper → writes login/logout to `activity_logs`
  (ip + userAgent + method). Wired: `loginUsername`, passport `/login` (auth.js),
  Google callback (+ updateLastLogin there), `logout`.
- `chatbot.js`: `ai_query` feature event on /ask, /conversations/:id/ask, and ask-stream.

Frontend (`AllUsers.js` + module.css):
- Drawer: stat strip (5 boxes) + Кредити block; timeline badges for `credit` + `event`.

Notes / follow-ups:
- Login history is forward-looking: existing users show logins only after next sign-in.
  (lastLogin timestamp already existed; count starts now.)
- Documents/compliance/blog/topics are NOT double-tracked (still from output collections).
- Phase 3 (platform DAU/WAU + feature leaderboard dashboard) deferred.

Verify: all changed files pass `node --check` / babel parse. Live smoke test after deploy:
log in → drawer shows a `Најава` event + login count increments.
