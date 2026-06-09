# Виртуелен саем (Virtual Fair) — Implementation Plan

> Status: PLAN — awaiting approval before implementation.
> Decisions locked: **standalone feature** (own collection); **posting = any active paid plan**, trial = read-only preview, browsing = all logged-in users.

## Goal
A standalone "virtual fair" under `Вмрежување и можности` where each paid company gets ONE booth
presenting up to **3 offers** (product OR service). Everyone browses; only active paid plans post.
Inquiry-only (no cart/checkout). Light admin moderation.

## Reuse (avoid reinventing)
- Categories: reuse `PREDEFINED_SERVICE_CATEGORIES` from `server/config/marketplaceSchemas.js` (7 cats).
- Inquiry CTA: reuse `server/services/offerRequestService.js` email flow (no new inquiry pipeline).
- Gating: reuse `server/middleware/subscriptionGuard.js` (write routes) + `subSeatGuard` mount pattern.
- Image upload: reuse the multer pattern from `server/routes/blogs.js`.
- Company data: denormalize name/city/logo from `user.companyInfo` on save.

## Data model — new collection `fairBooths`
One doc per user (unique index on `userId`):
```
{
  _id, userId,                       // unique
  companyName, city, logoUrl,        // denormalized from companyInfo at save time
  category,                          // one of the 7 existing category keys
  tagline,                           // 1-line, max ~120 chars
  offers: [                          // max 3
    { type: 'product'|'service', title, description, whyUs,
      moq, unit, priceNote, imageUrl }
  ],
  status: 'published'|'hidden',      // auto-publish for paid; admin can hide
  createdAt, updatedAt, publishedAt
}
```
Decision baked in: **auto-publish** on save for paid users (reduces friction + cold-start),
with **post-hoc admin moderation** (admin can hide/flag). Avoids a blocking approval queue.

## Server tasks
- [ ] `server/config/fairSchemas.js` — schema doc + validation constants (limits, enums).
- [ ] `server/config/fairIndexes.js` — unique `userId`; index `{status, category}`; text index on title/tagline.
- [ ] `server/services/fairService.js` — upsertMyBooth, getMyBooth, listPublished(filter/paginate), getById, adminHide/adminUnhide.
- [ ] `server/controllers/fairController.js` — thin controllers over the service; validation via express-validator.
- [ ] `server/routes/fair.js`:
  - `GET  /api/fair`            list published (cat/search/paginate) — any logged-in
  - `GET  /api/fair/me`         my booth — owner
  - `PUT  /api/fair/me`         upsert my booth — **subscriptionGuard (paid only)**
  - `POST /api/fair/me/image`   booth/offer image upload (multer) — paid only
  - `GET  /api/fair/:id`        booth detail — any logged-in
  - `POST /api/fair/:id/inquiry` send inquiry — reuse offerRequestService
- [ ] Mount in `server/server.js` near the marketplace mount (~line 739), behind authenticateJWT + subSeatGuard.
- [ ] Admin: extend admin controller/routes — `GET /api/admin/fair`, `POST /api/admin/fair/:id/hide|unhide`.

## Client tasks
- [ ] `client/src/pages/terminal/Fair.js` + `Fair.module.css` — booth grid (logo, company, city, category chip, tagline), category filter + search.
- [ ] `client/src/pages/terminal/FairBoothDetail.js` — 3 offer cards (type badge, description, "Зошто ние", MOQ/price note) + "Испрати барање" button → inquiry.
- [ ] `client/src/pages/terminal/MyFairBooth.js` — self-edit form, max 3 offers, image upload, live preview. Trial → read-only preview + upsell banner (match existing trial-preview UX).
- [ ] `client/src/pages/terminal/admin/FairModeration.js` — list booths, hide/unhide.
- [ ] Sidebar: add to `network` section in `client/src/components/terminal/Sidebar.js`:
      `{ key:'fair', icon:'store', label:'Виртуелен саем', path:'/terminal/fair' }`.
- [ ] Admin sidebar: add under `marketplace-admin` → `{ path:'/terminal/admin/fair', label:'Виртуелен саем' }`.
- [ ] Routes registration (App router) for the 3 user pages + 1 admin page.
- [ ] `client/src/services/api.js` — fair API functions.
- [ ] i18n strings (en + mk) for all labels/copy.

## Cold-start / optional
- [ ] Seed script: generate skeleton (hidden) booths from existing `serviceProviders` so the fair isn't empty.

## Validation / limits (enforced server + client)
- Max 3 offers/booth; one booth/user; tagline ≤120; title ≤80; description ≤800; whyUs ≤400.
- MOQ/unit/priceNote optional, free-text (no payment logic).
- Image: type + size limits matching blog upload.

## Verification before done
- [ ] Paid user can create/edit/auto-publish a booth; trial user gets read-only preview + upsell.
- [ ] Basic/all logged-in users can browse + open detail + send inquiry; inquiry email arrives via offerRequestService.
- [ ] Non-paid PUT /api/fair/me returns 402 (subscriptionGuard).
- [ ] Admin can hide a booth; hidden booths drop from public list.
- [ ] No inline styles; CSS modules only; bilingual strings present.

## Open questions (confirm before/while building)
1. Auto-publish vs approval queue — plan assumes **auto-publish + post-hoc hide**. OK?
2. Inquiry recipient — booth owner's company email, with the inquirer's company as sender context. Confirm.
3. Booth category — single category per booth (reusing the 7). OK, or allow multi?

## Review

### Implemented (2026-06-08)
**Server**
- `config/fairSchemas.js` — `fair_booths` schema, limits, validation (reuses marketplace 7 categories).
- `config/fairIndexes.js` — unique userId, status+category, status+publishedAt, text index. Wired into server.js init (always-on, not gated by marketplace flag).
- `middleware/requireBoothPoster.js` — write-gate: active paid OR grace only (blocks trial); sub_seat→403; admin bypass.
- `controllers/fairController.js` — list/detail/me/upsert/image-upload/inquiry + admin list/setStatus. Denormalizes company name/city/logo from `companyInfo`; auto-publish; preserves admin-`hidden` on re-save.
- `routes/fair.js` — mounted at `/api/fair` (specific paths before `/:id`).
- `services/emailService.js` — `sendFairInquiry()` (HTML-escaped, replyTo sender).
- `services/tierService.js` — `canPostBooth()`.

**Client**
- `lib/tier.js` — `canPostBooth()` + `showsFair()`.
- `pages/terminal/Fair.js` (browse grid + category/search), `FairBoothDetail.js` (offers + inquiry modal), `MyFairBooth.js` (self-edit, ≤3 offers, image upload, trial→read-only+upsell), `admin/FairModeration.js` (hide/unhide), `Fair.module.css`.
- `Sidebar.js` — `Виртуелен саем` under Вмрежување и можности + admin Маркетплејс group; added `store` icon.
- `App.js` — 4 routes (my-booth/admin before `/:id`).

### Verified
- ✅ Client production build compiles (`CI=false npm run build`).
- ✅ All server modules require-load without error.
- ✅ `canPostBooth` / `validateBooth` logic unit-checked (active→allow, trial→block, sub_seat→block; bad payload→errors).

### UI simplification (round 2)
- Removed `category` + `tagline` from the data model entirely. Each offer is now just `{ type, text }`.
- "Мој штанд" opens `BoothFormModal` (no separate page): type toggle (Услуга/Производ) + one
  general text box; Додади / Уреди / Избриши manage up to 3; commit on Зачувај и објави.
- Browse toolbar filter switched from category → type (Сите / Услуги / Производи); search now
  matches companyName + offer text. Cards show first offer snippet (no category chip/tagline).
- Detail page renders type badge + text per offer (dropped title/whyUs/MOQ/price/image).
- Server: `fairSchemas.validateBooth` now only validates offers `{type,text}`; controller filters by
  `offers.type`, searches `offers.text`; removed `/meta/categories` route + getCategories.
- Image-upload endpoint kept server-side for future use (not surfaced in current UI).

### Timed-event schedule (round 3) — fair opens only its open window
- `services/fairScheduleService.js` — `getFairStatus(settings, now)`: default = last 7 days of each
  quarter (Mar/Jun/Sep/Dec); admin modes `auto` | `open` | `closed`; optional one-off
  `customOpensAt`/`customClosesAt` window. Returns `{ open, opensAt, closesAt, mode }`.
- Settings persisted in `fair_settings` (single doc `_id:'fair'`, lazy-created).
- Controller gating: `GET /api/fair` returns `{open:false, opensAt, items:[]}` when closed
  (admins still see booths to preview); `GET /:id` and `POST /:id/inquiry` → 403 `FAIR_CLOSED`
  when closed (owner/admin exempt). `PUT /me` (prepare booth) always works.
- Admin endpoints `GET/POST /api/fair/admin/settings` (mode, windowDays 1–90, custom dates).
- Client: Fair.js shows a closed panel (countdown to opensAt + "Подгответе го вашиот штанд" →
  modal) when `open:false`, and an "отворено до DATE" banner when open. FairModeration.js gained
  a schedule panel (status, mode toggle, window-days, optional special-edition dates).
- NOTE: today (2026-06-08) is outside the Q2 window, so auto mode = CLOSED → localhost shows the
  countdown (next opening 24–30 Jun 2026). Force open via admin → Режим → Отворено to demo.

### Booth decoration (round 4) — website, contact email, cover image
- Schema: booth-level `website` (auto-prefixes https://), `contactEmail` (email-validated), `imageUrl`
  (must be /uploads/ or http). All optional.
- Controller: persisted + in PUBLIC_FIELDS; inquiries now route to `booth.contactEmail` first
  (then companyInfo.email, then account email). Reuses existing `POST /api/fair/me/image` upload.
- Modal: "Информации за штандот" section — cover image upload + thumbnail, website, contact email.
- Detail page: cover banner + website link + mailto. Cards show cover image when present.

### Decoupled from email + admin approval (round 5)
- Removed the platform-mediated inquiry flow entirely: no `POST /:id/inquiry`, no
  `sendInquiry` controller, no `emailService.sendFairInquiry`. Buyers now contact companies
  DIRECTLY via the booth's website / contact email (shown as buttons on the detail page).
- Removed admin moderation/approval: no `adminList`/`adminSetStatus`, no hide/unhide, no booth
  `hidden` status. Booths post freely and stay published. Admin page now = schedule only.
- Kept: paid-only posting, the quarterly schedule + admin schedule controls.
- Detail page: "Посети веб-страница" + mailto buttons instead of an inquiry modal.

### Live E2E — PASSED (24/24) against running server :5002
Script: `server/scripts/fair_e2e_test.js` (seeds throwaway users, hits every endpoint, self-cleans).
Covered: auth 401; categories; trial PUT→402; invalid payload→400; owner create→published +
denormalized name/city; offer cap; GET /me; buyer browse + category filter in/out; detail;
inquiry short→400 / valid→200 (email to owner inbox); admin/all (admin 200, non-admin 403);
hide→drops from public list + detail 404 for others, owner still sees; owner re-save preserves
admin-hidden. Re-run anytime: `cd server && node scripts/fair_e2e_test.js`.

### ✅ Fixed: `isAdmin` debug bypass (server/middleware/auth.js)
Removed `true // TEMPORARY: Allow all users for debugging` plus the `username==='sohocoffee'`
and `email.includes('test')` test hatches. `isAdmin` now = `role==='admin' || isAdmin===true`.
Verified real admin `martin` retains access (role:'admin' + isAdmin:true). This had left the
ENTIRE /terminal/admin API open platform-wide; the E2E non-admin→403 case now passes.

### Optional / deferred
- Cold-start seed script from `service_providers` (not required for launch).
- `server/scripts/fair_e2e_test.js` is a dev tool that talks to the configured DB — safe to keep
  (self-cleans, TAG-namespaced) or delete.
