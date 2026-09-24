# Multi-Vertical Marketplace — Procedures & Provider Suggestions

> ⚠️ COURSE CORRECTION (see bottom): the feature was first built on `offer_requests`,
> then discovered the **Inquiry Board** (`inquiries` + `inquiry_interest_signals`) already
> implements the exact "operator tags a satellite-email inquiry with multiple categories →
> Pro members browse a board → express interest" workflow. Per user decision, the
> offer_requests work was reverted and the two NEW ideas (procedure templates + suggestion
> hints) were ported onto the Inquiry Board. procedureTemplates.js was kept & rewritten.
> The section below documents the original (reverted) offer_requests plan for history.

---


## Goal
Expand Pro from "lawyers only" to multiple verticals (legal, real estate, accounting,
consulting, insurance; marketing later). One inbound request = a **procedure** that fans
out to several provider categories. Admin reads the email, tags the relevant categories
(pre-filled from a procedure template), and each tagged category's providers get the
chance to **express interest**. Providers also see a category-specific **suggestion hint**
in the terminal reminding them a live procedure may need their service.

## Existing architecture (reuse, don't rebuild)
- `offer_requests` collection: client request (`requestCategory`, single `serviceType`).
- `service_providers` collection: single `serviceCategory` per provider.
- `offerRequestService.sendToProviders()` matches ONE category → tokens → emails.
- `providerInterestService`: token-based "express interest" → client notified.
- Admin: `ManageOfferRequests.js` → verify → auto-send.
- Provider response today = public token link only (`ProviderResponse.js`). No in-terminal browse.

## Design decisions
- **Provider stays single-category** (matches current schema). Multi-category deferred.
- **Multiple providers compete** per category via existing show-interest flow.
- **Attach categories are opt-in**: primary category fans out on verify; attach categories
  only fan out after they are tagged by admin (admin tagging IS the opt-in gate for MVP).
- Keep the legacy `leads` (auto-assign single lawyer) system untouched.

## Taxonomy changes
- Add `consulting` to `PREDEFINED_SERVICE_CATEGORIES` (marketplaceSchemas + offerRequestSchemas).
- Confirm active set: legal, realestate, accounting, consulting, insurance (+ marketing later).

## Procedure templates (new config)
`server/config/procedureTemplates.js` — map procedure → primary + attach categories:
```
immigration:       { primary: 'legal',       attach: ['insurance','realestate'] }
company_formation: { primary: 'legal',       attach: ['accounting','realestate'] }
property_purchase: { primary: 'realestate',  attach: ['legal','insurance'] }
...
```
Each has bilingual label + a per-category suggestion line (the hint text shown to providers).

## Backend changes
1. **offer_requests schema**: add
   - `procedureType` (string, nullable)
   - `primaryCategory` (string)
   - `taggedCategories` ([string], admin-editable; superset incl. primary)
   - per-category dispatch tracked via existing `sentTo` + `provider_interests` (interest
     records already carry `providerId`; provider's `serviceCategory` gives the category).
   Backfill: existing rows → `primaryCategory = serviceType`, `taggedCategories = [serviceType]`.
2. **`sendToProviders()`**: loop over `taggedCategories` instead of single category; run the
   existing match+select(≤10)+token logic per category; email invitations per category.
3. **Admin tag endpoint**: `PUT /api/offer-requests/admin/:id/tags`
   `{ procedureType, primaryCategory, taggedCategories }` → persists tags (no send).
   Verify then fans out to all tagged categories.
4. **Provider opportunities endpoint**: `GET /api/offer-requests/opportunities`
   (Pro provider, auth) → returns verified/open requests whose `taggedCategories` include
   the caller's `serviceCategory`, with the procedure's suggestion line for that category,
   and whether the provider already has an interest token/response. Anonymous request data only.
5. **Express-interest-from-terminal**: allow a logged-in provider to express interest from
   the opportunities view (reuse providerInterestService; mint/lookup their token server-side).

## Frontend changes
- **Admin `ManageOfferRequests.js`**: add a "Procedure & tags" panel — pick procedure
  (pre-fills primary+attach), edit category chips, then Verify & Send fans out to all.
- **New terminal page `Opportunities.js`** (Pro providers): lists opportunities for the
  provider's own category with the suggestion hint ("Оваа постапка може да бара
  сметководител — изразете интерес") and an "Изрази интерес" button. Only their category
  is ever shown.
- Add sidebar link (Pro only) + i18n strings (mk/en).

## Satellite sites (wording/style/CTA) — separate follow-up
- Per-vertical hero + dual CTA (demand: "Побарај понуда"; supply: "Стани провајдер").
- Reuse verified-badge funnel for supply-side signup → Pro with that category.
- Shared design tokens, per-vertical accent color/imagery.

## Decisions (locked)
- Extra vertical: **consulting** only (marketing/IT stay hidden for now).
- Provider = **single category** (serviceCategory unchanged).
- Opportunities view = **anonymized details + hint**.

## Phasing
- **Phase 1 (backend foundation): DONE**
  - `consulting` added to marketplaceSchemas + offerRequestSchemas.
  - `server/config/procedureTemplates.js` (immigration, company_formation, property_purchase).
  - offer_requests now written with `procedureType`, `primaryCategory`, `taggedCategories`.
  - `offerRequestService.resolveTargetCategories()` + `selectProvidersForCategory()` +
    rewritten `sendToProviders()` fans out per tagged category (dedupe, ≤10/category).
  - `updateProcedureTags()` service + controller + `PUT /admin/:id/tags`.
  - `GET /admin/procedures` (template list for tagging UI).
  - Verified via standalone node test.
- **Phase 3 backend (provider suggestions read): DONE**
  - `getOpportunitiesForProvider()` + controller + `GET /opportunities` (anonymized +
    per-category suggestion hint + alreadyExpressed flag).
- **Phase 2 (admin UI): DONE** — "Постапка и категории" panel in ManageOfferRequests.js
  (procedure dropdown pre-fills primary+attach; category chips + ☆ primary star; Save →
  `PUT /admin/offer-requests/:id/tags`). Admin endpoints added to routes/admin.js
  (`GET /offer-requests/procedures` before `:id`, `PUT /offer-requests/:id/tags`).
- **Phase 3 frontend (provider view): DONE**
  - `client/src/pages/terminal/Opportunities.js` + `styles/terminal/Opportunities.module.css`
    — card feed with suggestion hint, primary/attach badge, details, "Изрази интерес".
  - Route `/terminal/opportunities` (App.js, VerificationRequired).
  - Sidebar: `opportunities` leaf added to Pro layout (config/nav.js, clients-growth group).
  - Express-interest: `POST /offer-requests/opportunities/:id/interest` +
    `expressInterestFromTerminal()` service (idempotent, best-effort client email).
  - i18n: page chrome kept MK (consistent with sibling admin/terminal pages); the dynamic
    suggestion line is localized server-side via req.user.language. Full mk/en keys = follow-up.
- **Phase 4 (satellites): TODO** — copy/CTA per vertical (separate task).

## Verified
- Fan-out unit test: taggedCategories [legal,insurance,realestate] → invites those 3,
  excludes accountant, status→испратено. Procedure templates + suggestion lookup pass.
- ESLint clean (only pre-existing exhaustive-deps warnings). All backend files node -c OK.

## Backfill note
Existing offer_requests lack the new fields; `resolveTargetCategories()` falls back to
legacy `requestCategory`/`serviceType`, so old rows still route correctly. A one-off
backfill script (set primaryCategory + taggedCategories) is optional, not required.

## Verification
- Unit: `sendToProviders` fans out to N categories (mock serviceProviders).
- Manual: create request → admin tags immigration → legal+insurance+realestate providers
  each get invitation; accountant does NOT; accountant sees no hint; provider sees hint for
  their category in Opportunities and can express interest.
</content>

---

# FINAL — Ported to the Inquiry Board (implemented & tested)

The Inquiry Board is the canonical Nexa 3.0 system for the described workflow:
admin creates an inquiry from a satellite-ecosystem email, tags it with multiple
`INQUIRY_CATEGORIES`, Pro members browse a board (Случаи → `/terminal/leads` `Leads.js`,
and `ProHome`) filtered to their mapped categories, express interest, admin approves.

## What was added (the two genuinely-new ideas)
1. **Procedure templates** (`server/config/procedureTemplates.js`, rewritten to INQUIRY_CATEGORIES):
   immigration → residence+property+insurance; company_formation → company+tax+property;
   property_purchase → property+other_legal+insurance. Each carries per-category mk/en
   suggestion lines + a `primary`.
2. **Suggestion hints** shown to the relevant member on the board.

## Backend
- `inquiriesService.validateInquiryInput`: accepts `procedureType`; if set with no
  categories, derives them from the template. `update()` allows editing `procedureType`.
- `inquiriesService.listBoardFor`: attaches `procedure = { type, label, suggestions:[{category,
  isPrimary, text}] }` per inquiry, tailored to the member's mapped categories (empty = whole
  board → all procedure categories). New helper `_procedureHintFor`.
- Controller `adminCreate` already forwards `req.body`, so `procedureType` flows through.

## Frontend
- `config/procedures.js` — client mirror (value/label/primary/categories) for the admin picker.
- `AdminInquiryNew.js` — procedure dropdown pre-fills the category chips (still editable).
- `Leads.js` — card shows a compact procedure hint; detail modal shows the full list
  (primary line emphasized). Styles appended to `Inquiries.module.css`.
- `ProHome.js` — case modal shows the procedure hint. Styles appended to `ProHome.module.css`.

## Tests (all pass)
- Server: node -c clean; functional test — immigration derives [residence,property,insurance];
  invalid procedure nulled; accountant (tax-accounting) on company_formation sees company(primary)+tax
  nudge (the user's headline example); no-category member sees all; non-procedure → null.
- Client: ESLint clean; `npm run build` succeeds.

## Kept but reverted-around
- `offer_requests` fan-out / Opportunities page / admin tagging panel: REVERTED (git checkout).
- `procedureTemplates.js`: KEPT (rewritten for the Inquiry Board).

## Remaining (not done)
- Non-lawyer profession targeting: PRACTICE_AREAS is legal-only, so real-estate/insurance
  providers currently either see the whole board (no practiceAreas) or need a mapped area to
  get precise suggestions. Adding real-estate/insurance/consulting to PRACTICE_AREAS +
  PA_TO_INQUIRY_CATEGORY + profile form is the follow-up to make targeting exact.
- Phase 4 satellite-site copy/CTA per vertical (properties.nexa.mk / osiguran.mk are external
  sites; leads.nexa.mk `LeadsHome.js` copy is subjective — left for user review).
- Not committed/pushed (multi-agent coordination).
