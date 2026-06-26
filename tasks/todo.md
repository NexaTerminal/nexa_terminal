# Cold-invite upgrade: editable draft + invited-prospects ledger

## Goal
Upgrade the "Send invite" flow (admin → Промо кодови) so the admin can:
1. Preview & edit the draft email (subject + body) before sending.
2. Persist every invited "potential user" in one DB collection (email, date, code, plan, etc.).
3. Auto-skip emails that were already invited (no double-invites).
4. View the ledger on a new admin-only page.

## Backend

- [ ] **New service** `server/services/invitedProspectsService.js`, collection `invited_prospects`
  - doc: `{ email (lowercased, unique), code, plan, language, subject, invitedBy, invitedAt, status }`
  - `ensureIndexes()` → unique index on `email`
  - `hasInvited(email)` / `findExisting(emails[])` → dedup lookup
  - `record({ email, code, plan, language, subject, invitedBy, status })`
  - `list()` → newest first
- [ ] Wire it in `server/server.js` (mirror promoCodeService: construct, ensureIndexes, app.locals, pass into SubscriptionController constructor).
- [ ] **Email module** `server/emails/subscriptionEmails.js`
  - Refactor `promoInvite` into `promoInviteParts({code, plan, days, language})` → `{ subject, body, ctaUrl, ctaLabel }` and `wrapInvite(parts, language)` → full html. Keep `promoInvite` working (compose the two).
  - Export both so the controller can build a default draft and re-wrap an edited one.
- [ ] **Controller** `server/controllers/subscriptionController.js`
  - `GET /codes/:code/invite-draft?language=` → returns default `{ subject, body }` to prefill the modal.
  - Extend `sendInviteSchema` with optional `subject` / `body`.
  - `sendInvite`: split recipients into already-invited (skip) vs new; render html via `wrapInvite` using the (edited) subject/body + the code's deep link; send; record each in `invited_prospects`. Return `{ sent, failed, skipped: [emails] }`.
  - `GET /prospects` → list for the new admin page.
- [ ] **Routes** `server/routes/subscriptions.js`: add `GET /codes/:code/invite-draft`, `GET /prospects` (both admin-gated, after static `/codes/send-invite`).

## Frontend

- [ ] Upgrade `SendInviteModal` in `client/src/pages/terminal/admin/ManageSubscriptions.js`
  - On open / language change: fetch default draft, prefill editable **Subject** input + **Body (HTML)** textarea.
  - Keep recipients + language fields; submit `{ code, recipients, language, subject, body }`.
  - Show result incl. skipped (already-invited) emails.
- [ ] **New admin page** `client/src/pages/terminal/admin/InvitedProspects.js` (reuse `ManageSubscriptions.module.css`)
  - Table: email · invited date · code · plan · language · status.
- [ ] Route in `client/src/App.js`: `/terminal/admin/invited-prospects`.
- [ ] Sidebar entry under `users-admin` (+ Header.js): "Поканети потенцијални корисници".

## Verification
- [ ] Send invite to a fresh email → row appears in ledger; re-sending same email is skipped.
- [ ] Edited subject/body is what actually gets emailed (re-wrapped, CTA link intact).
- [ ] New page lists prospects; admin-only.

## Review

Implemented all items.

**Backend**
- `server/services/invitedProspectsService.js` — new `invited_prospects` collection (unique `email`), `findExisting`/`record`(upsert)/`list`.
- `server/server.js` — constructs the service, ensures indexes, injects into `SubscriptionController`.
- `server/emails/subscriptionEmails.js` — `promoInvite` split into `promoInviteParts` + `wrapInvite`; verified the recomposed output is byte-identical to the old `promoInvite` and the CTA deep link is preserved.
- `server/controllers/subscriptionController.js` — `getInviteDraft`, dedup + per-recipient ledger recording in `sendInvite` (returns `{sent,failed,skipped[]}`), `listProspects`.
- `server/routes/subscriptions.js` — `GET /codes/:code/invite-draft`, `GET /prospects` (admin-gated).

**Frontend**
- `SendInviteModal` now loads the draft and exposes editable Subject + Body (HTML); reports skipped already-invited addresses.
- `InvitedProspects.js` new admin page (table + search), routed at `/terminal/admin/invited-prospects`, linked from the Sidebar under Корисници.

**Verification done**
- Backend modules parse; email parts round-trip identical; client files lint clean (eslint exit 0).

**Not yet done**
- Live end-to-end test (send a real invite → row appears → re-send skipped) requires running the app/DB. Not committed/pushed (per multi-agent push coordination).

## Follow-up: delete + click-funnel stats

- `invitedProspectsService.js` — schema now tracks `invitedCount`, `firstInvitedAt`/`lastInvitedAt`, `clicks`/`firstClickedAt`/`lastClickedAt`, soft-delete `deleted`. New methods: `recordClick`, `setStatus`, `softDelete`, `stats` (funnel aggregate). `findExisting` ignores archived rows so deleted emails are re-invitable. `record` upserts (returns doc) + un-archives + increments count.
- `subscriptionController.js` — `sendInvite` now records per-recipient first (gets prospect `_id`), appends `&p=<id>` to the CTA for click attribution, then sends + sets status. `listProspects` returns `{items, stats}`. New `deleteProspect` (soft delete).
- `routes/subscriptions.js` — `DELETE /prospects/:id`.
- `server.js` — public `GET /api/invite/click?p=<id>` (before CSRF, no auth) → `recordClick`.
- `client/.../Redeem.js` — on mount, pings `/api/invite/click?p=` when the deep link carries `p` (best-effort).
- `client/.../InvitedProspects.js` — summary cards (Invited / Clicked / Click rate / Archived), Clicks + Sends columns, per-row Delete, "Show archived" toggle.

Verified: backend parses, server.js `--check` ok, tracking link composes correctly (`/redeem?code=…&p=<id>`), client lints clean.
