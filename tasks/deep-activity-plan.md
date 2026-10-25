# Deep user activity — „Активност (хронолошки)"

Goal: admin sees, per user, a complete chronological log: every page opened (with time
actually spent + how far they scrolled), every click on a link/button, every API request
(method, route, status, duration), grouped into sessions with totals.

## What exists (reviewed 2026-10-25)
- `services/userActivityService.js` builds the timeline from scattered collections
  (user doc, credit_transactions, template_generations, *Assessments, audit_logs, activity_logs).
- `activity_logs` gets only a few actions (login, ai_query, feature_opened…).
- No page views, clicks, time spent, or request log.
- BUG: reads `blogSubmissions`, `inquirySignals`, `topicSubmissions` — real names are
  `blog_submissions`, `inquiry_interest_signals`, `qa_submissions` → those events never appear.

## Design
### Storage — new `user_events` collection
`{ userId, sessionId, kind, at, path, label?, activeMs?, scrollPct?, method?, route?, status?, durationMs? }`
- kinds: `session_start`, `page_view` (with activeMs + scrollPct on leave), `click`, `api`.
- Indexes: `{userId, at:-1}`; TTL on `at` = 90 days (user decision) — Atlas storage stays bounded.
- **Never stored**: request/response bodies, form field values, passwords, document text. Click label = visible button/link text (≤80 chars) or aria-label/href only.

### Server
- `middleware/requestLog.js` (global, after body parsing): on `res.finish`, if a valid
  Bearer JWT → insert `api` event (method, route with ids → `:id`, status, durationMs).
  Skips: health, csrf-token, the logging endpoint itself, background polls (badge counts,
  thread refresh) — configurable list.
- `POST /api/activity/events` (JWT, CSRF-exempt like /notifications): batch insert of client
  events (max 50/batch, validated kinds/lengths, server sets userId + `at` clamp).
- `GET /api/admin/all-users/:id/activity?before=&kinds=` → paginated, plus summary
  (time spent today / 7 days / total, sessions, top pages by time).
- Fix the 3 wrong collection names in userActivityService; merge `user_events` into the timeline.

### Client — `lib/activityTracker.js` (mounted once in App for logged-in users)
- Page view on every route change; active time counted only while the tab is visible
  and focused (idle > 60 s without input stops the clock).
- Scroll depth (max %) per page.
- Delegated click listener: `a`, `button`, `[role=button]` → label + path.
- Batched; flushed every 10 s, on route change and on `pagehide` (fetch keepalive).
- sessionId per tab (sessionStorage); new session after 30 min idle.

### Admin UI (AllUsers → user detail)
- Summary strip: time today / 7 days / total · sessions · top 5 pages by time.
- Timeline grouped by session („Сесија 25.10 09:12 · 14 мин"), each step with time:
  „📄 Отвори: Договор за вработување · 2м 13с · 80% прочитано", „🖱 Клик: Генерирај документ".
- Filters: Сè / Страници / Кликови / Барања (API) / Настани; „Вчитај постари" pagination.

### Privacy
- Disclose usage analytics in the privacy policy (text change proposed, user approves wording).

## Steps
- [x] Server: user_events + indexes/TTL, requestLog middleware, POST /activity/events, admin endpoint
- [x] Fix userActivityService collection names; merge user_events
- [x] Client tracker + mount
- [x] Admin timeline UI (summary, sessions, filters, pagination)
- [~] Verify (admin UI not seen in browser — not logged in there): browse as a user → events appear with correct times; no bodies stored; build OK

## Review
Built 2026-10-25, uncommitted. Decisions: 90-day retention; background polls skipped (same user+GET route within 60 s logged once).
- requestLog tested with fake DB + throwaway secret: poll ×3 → 1 row, ids → :id, query dropped, csrf + anonymous skipped.
- userEventsService tested on live DB with admin id (test rows removed): kind 'api' from client rejected, unknown fields dropped, label clamped 80, TTL 7776000 s + {userId,at} index created, summary/top pages correct.
- Live local traffic already logged (admin's own browser). Client build compiles.
- Also: conversations (pro_requests) + AI conversations added as milestones; 3 wrong collection names fixed.
- Not done: browser check of the admin panel; privacy-policy wording.
