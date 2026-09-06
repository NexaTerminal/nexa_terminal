# Task: Categorize leads (inquiries) + user-facing category filter

## Context
- "leads.nexa.mk/leads" = `/terminal/leads` (`Leads.js`) — user-facing Inquiry Board.
- Admin enters leads at `/terminal/admin/inquiries/new` (`AdminInquiryNew.js`) → `inquiries` collection.
- Taxonomy `INQUIRY_CATEGORIES` (server/constants/inquiryEnums.js): keep as-is per user.
- Backend `PUT /api/admin/inquiries/:id` → `inquiriesService.update` already accepts `categories`.
  No backend change needed.

## Plan
- [x] Explore leads vs cases vs inquiries; confirm scope with user (keep taxonomy; add edit + filter).
- [x] Admin edit categories on existing lead — `AdminInquiryDetail.js`: edit toggle → checkbox grid → Save via PUT.
- [x] User category filter on board — `Leads.js`: `.tabs` filter bar derived from categories present; filter `items`.
- [x] Reuse existing CSS classes (.tabs/.tab/.tabActive, .checkboxCell, .btnPrimary/.btnGhost); no new inline styles.
- [x] Verify client lint (eslint clean on both files; CSS classes confirmed present).

## Review
- No backend changes: `PUT /api/admin/inquiries/:id` → `inquiriesService.update` already
  whitelists `categories` (filtered against `INQUIRY_CATEGORIES`).
- `AdminInquiryDetail.js`: category chips now have an "Уреди категории" button → checkbox grid
  (`CATEGORY_OPTIONS`) → Зачувај (PUT) / Откажи. Guards against empty selection. Works for
  existing AND new leads.
- `Leads.js`: added `.tabs` filter bar ("Сите" + one tab per category present on the board),
  `catFilter` state, `visibleItems` derived filter, and an empty-state for a filtered-out category.
  Filter options derive from categories actually on the board so no dead tabs.
## Update 2 — replaced taxonomy with 6 categories
New taxonomy (key → MK label): labor→Работни односи, property→Сопственост и недвижности,
insurance→Осигурување, company→Фирми, citizenship→Државјанство, residence→Регулирање на престој.
- `server/constants/inquiryEnums.js` — INQUIRY_CATEGORIES replaced (drives create/update validation).
- `server/services/inquiriesService.js` — PA_TO_INQUIRY_CATEGORY remapped so member visibility still
  works with the new keys; stale comment fixed.
- Label maps updated in: Leads.js, ProHome.js, AdminInquiries.js, AdminInquiryDetail.js,
  AdminInquiryNew.js (create checkbox list). SAMPLE_CARDS keys updated (citizenship/residence).
- Test `inquiriesService.test.js` updated to new keys — passes.
- `Leads.js` funnel band label → "Прашања од посетителите на веб страните од мрежата".
- Admin edit (Update 1) works on existing AND new leads: re-tag each current case via
  "Уреди категории" on the inquiry detail page. Old category values on legacy docs render as raw
  keys until re-tagged, and are stripped server-side on the next save.
- Verified: server test green, eslint clean on all 5 client files.
