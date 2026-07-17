# Cold-email saved templates + live preview (admin) — 2026-07-17

## Goal
In the admin Send-invite modal, let Martin: (1) write the body in NORMAL TEXT
(not raw HTML), (2) SAVE named text variants and load them back, (3) SEE A
PREVIEW of the final wrapped email before sending. Multiple A/B copy options,
each saved and reusable.

## Design decisions
- Body accepts plain text; server converts to HTML (blank line → paragraph,
  single newline → <br>, bare URLs auto-linked). If body already contains block
  HTML (existing rich default), pass through untouched → back-compatible.
- Preview is SERVER-RENDERED (POST /invite-preview → exact wrapInvite HTML),
  shown in an <iframe srcDoc> so email CSS can't leak into the admin app. One
  source of truth = preview always matches what's actually sent.
- Saved templates in new `cold_email_templates` collection, scoped to admin
  userId. {name, subject, body, language}. Not per-code — reusable across codes.

## Todo
- [x] server/emails/emailBody.js — bodyToHtml(text): blank-line→<p>, newline→<br>,
      URL auto-link, HTML-escape; rich HTML passes through. Verified 5 cases.
- [x] wire bodyToHtml into sendInvite send path + preview.
- [x] server/services/coldEmailTemplateService.js — CRUD scoped by createdBy;
      ensureIndexes. DB smoke test green (create/list/update/ownership/delete).
- [x] subscriptionController: previewInvite, listTemplates, saveTemplate,
      updateTemplate, deleteTemplate; service injected via constructor.
- [x] routes: POST /codes/:code/invite-preview, GET/POST/PUT/DELETE /invite-templates.
- [x] server.js: construct coldEmailTemplateService, pass into controller.
- [x] SendInviteModal: saved-text dropdown (load/save-as-new/update/delete),
      body → normal text, Edit/Preview tabs with debounced server-rendered iframe.
- [x] Verify: node --check all server files; both service smoke tests; clean build.

## Review
- Preview is server-rendered via a real wrapInvite call → the iframe shows the
  EXACT email that sends (same header/footer/CTA), never drifts from reality.
- Plain-text authoring is back-compatible: the built-in rich default (perk list,
  links) is detected as HTML and passes through untouched; only admin-typed
  plain text gets auto-formatted. XSS-escaped before linkify.
- Templates are admin-owned (createdBy), reusable across every promo code.
- NOTE: Railway auto-deploy is unreliable — must trigger a deploy + verify
  /api/admin/subscriptions/invite-templates flips 404→401 after push.

---

# Продажна инка (Sales Funnel) — 2026-07-14

## Goal
User-facing sales pipeline for every Terminal company: a visual funnel
(Потенцијални → Контактирани → Испратена понуда → Преговори → Добиени/Изгубени)
with per-stage counts + € value, conversion rates between layers, next-action
follow-up dates, and quick stage moves. Business-first: the funnel IS the
navigation — click a layer to work the deals inside it.

## Design decisions
- Collection `sales_deals`, scoped by userId (same ownership model as contracts).
- Stages fixed (no custom stages in v1) — simplicity beats configurability for SMBs.
- `wonAt` stamped on the won transition → "Добиени овој месец" KPI without
  digging through stageHistory.
- Mounted at /api/sales behind subscriptionGuard, same as /api/contracts.
- No credits metering — Basic-tier tool like CMS.
- Funnel drawn with pure CSS clip-path trapezoids; no chart library.

## Todo
- [x] server/services/salesDealsService.js — CRUD + setStage(history, wonAt,
      lostReason) + summary aggregation (per-stage count/value, overdue
      next-actions, won-this-month). Indexes {userId,stage,updatedAt} and
      {userId,nextActionAt}.
- [x] server/controllers/salesDealsController.js — thin handlers, MK errors.
- [x] server/routes/sales.js — authenticateJWT; GET /summary, GET /, POST /,
      PATCH /:id/stage, PATCH /:id, DELETE /:id.
- [x] server.js — mount /api/sales + init service in DB block; settingsManager
      gets `salesPipeline: true` (prod + defaults).
- [x] client/src/pages/terminal/sales/SalesFunnel.js + SalesFunnel.module.css —
      KPI row, funnel visual (clickable layers + conversion %), outcome tiles,
      stage deal list with next-action badges and one-click stage moves,
      create/edit modal, empty state.
- [x] App.js route /terminal/sales; Sidebar item „Продажна инка" placed in the
      „Маркетинг и раст" section (sidebar was restructured meanwhile) with a
      funnel icon.
- [x] Verify: node --check on all server files; DB smoke test of the service
      (create/setStage/summary/ownership/list — all green, scratch collection
      dropped); clean client production build.

## Review
- Funnel is pure CSS (clip-path trapezoids + relative-volume bar), no chart lib.
- Conversion chips approximate stage-to-stage flow from current counts
  (reached(i+1)/reached(i)); stageHistory is recorded from day one so a real
  velocity metric can replace it later without migration.
- Lost deals keep lostReason and can be returned to the funnel („Врати во инка").
- Won transition stamps wonAt → "Добиени овој месец" KPI.
- Deliberately not built in v1: custom stages, kanban drag-drop, multi-user
  assignment, reminders by email (nextActionAt is UI-only for now — natural
  follow-up: feed it into the existing reminder engine like contracts do).

---

# Homepage content + design pass (nexa.mk, MK-first) — 2026-07-11

## Goal
1. Explain Nexa Terminal **in full** on the homepage — today it only shows 4 bullets
   (documents, compliance, AI, contract analysis) and never mentions networking
   (Виртуелен саем, Барање за понуди, Случаи), content sharing (блог, Topics Q&A,
   билтен) or education (Курсеви).
2. Fix alignment/design inconsistencies:
   - "Дел 1" lives inside the dark CTA band directly after the hero → confusing story order.
   - "Дел 2" chapter marker is left-aligned with a border-left while "Дел 3" is centered → mixed alignment.
   - Satellite grid is 3 columns with only 5 cards → unbalanced second row.
3. Add **osiguran.nexa.mk** (free/neutral insurance-rights guide, routes disputes to lawyers)
   everywhere the network is listed.

## Todo
- [x] `Home.js`: new light "Дел 1 — Што прави Терминалот" section after hero with a
      6-card feature grid (documents / Nexa AI / compliance checks / networking &
      opportunities / marketing & content / education) using existing `.featureGrid`
      + `nx-card` + `nx-icon-wrap` primitives.
- [x] `Home.js`: dark automate band loses its "Дел 1" chapter num (becomes the CTA of
      Part 1) and its bullet list expands to mirror all 6 pillars.
- [x] `Home.js`: center the "Дел 2" chapter marker (`chapterMarkerCentered`) for
      alignment consistency with Дел 3.
- [x] `Home.js`: add osiguran.nexa.mk to SATELLITES (6 cards → balanced 3×2 grid).
- [x] `EcosystemMap.js`: add osiguran tile.
- [x] `PublicFooterV2.js`: add osiguran link.
- [x] `schemaGraph.js`: add https://osiguran.nexa.mk to NEXA_ORG.sameAs.
- [x] `mk.json` + `en.json` (website ns): rework feature2/feature4, add feature5/feature6,
      broaden heroSubtitle, add `ecosystem.osiguran`, bump ecosystemHeading 7→8;
      also fixed About-page counts (7→8 properties, 5→6 guide sites).
- [x] Verify: client production build passes (`CI=false npm run build`, +3.4 kB gzip).

## Review
- Homepage now tells the full Terminal story in six modules keyed to the actual
  sidebar (Документи / Nexa AI / Проверки / Вмрежување и можности / Маркетинг и
  содржина / Курсеви); copy sourced from real features, no invented claims.
- Alignment fixes: Дел 1 moved out of the dark band into a light centered section;
  Дел 2 marker now centered like Дел 3; satellite grid balanced at 3×2.
- osiguran.nexa.mk (verified live: neutral insurance-rights guide → routes disputes
  to lawyers) added in all 4 network listings: Home SATELLITES, EcosystemMap,
  PublicFooterV2, schemaGraph sameAs. Note: the satellite list is duplicated across
  those 4 files — future additions must touch all 4.
- Not committed — parallel agents share this repo (per memory); user pushes when ready.
- Visual check in browser not done (Chrome extension disconnected) — worth a quick
  look at / and /about after deploy.

---

# [DONE — shipped July 2026] Legal AI quality overhaul (budget-constrained)

Constraint: token budget is tight. 4 questions/week limit STAYS. Auxiliary LLM
calls on gpt-4o-mini; embeddings stay -small; eval is retrieval-only by default.

## ChatBotService.js
- [ ] Utility model (gpt-4o-mini, temp 0) for condensation + decomposition
- [ ] Query condensation: history + follow-up → standalone MK search query; use for RETRIEVAL in both askQuestion and askQuestionStream
- [ ] Fix keywordSearch: MK stopword-stripped keywords + Qdrant min_should filter (fallback to must), instead of whole-question match
- [ ] maxTokens 2048 → 4096 (cap only; short answers unaffected)
- [ ] Prompt rebalance (~35% shorter):
  - hard rule: always answer in Macedonian (Cyrillic)
  - graduated certainty: categorical where law is explicit; hedge only for interpretation/fact-dependent points
  - labeled general-knowledge fallback when context is silent (no refusal wall; never invent article numbers)
  - cut marketing plugs; condense conversation-continuity + checklist sections

## process-documents.js
- [ ] Full rebuild every run (fixes latent bug: incremental run deleted the whole collection but re-uploaded only changed docs)
- [ ] Prefix each chunk's embedded text with law/doc name (+ year for brochures)
- [ ] Parse year from filename → metadata docYear/isBrochure; skip brochures older than BROCHURE_YEAR_CUTOFF (default 2020)
- [ ] Create Qdrant full-text payload index on pageContent (keyword search needs it)

## Eval harness
- [ ] scripts/eval-rag.js + golden set (~20 MK legal questions → expected doc/article), retrieval-only (hit@k), ~free to run

## Corpus (user action)
- [ ] tasks/legal-corpus-missing.md — list of missing laws to collect

## Review

All code items done and verified (node --check on all files; template renders
with exactly stancePrefix/context/question; keyword extraction tested on real
MK questions; filename year/brochure detection tested against real corpus names).

- ChatBotService: utilityModel (gpt-4o-mini) for condensation+decomposition;
  condenseSearchQuery wired into askQuestion AND askQuestionStream; keywordSearch
  rewritten (stopword-stripped keywords, min_should≥2, must-fallback);
  maxTokens→4096; prompt rewritten — ~50% smaller, always-MK hard rule,
  decisive-where-law-is-clear, labeled general-knowledge fallback instead of
  refusal wall, marketing cut, verified-article rule kept.
- process-documents.js: full rebuild each run (fixes destructive incremental
  bug), chunk text prefixed with law/doc title (+year for brochures), stale
  brochures (<2020) excluded, full-text payload index created (keyword search
  precondition).
- scripts/eval-rag.js + eval/golden-questions.json: 22 MK golden questions,
  retrieval-only hit@k scoring via the real retrieval path (~free to run).
- tasks/legal-corpus-missing.md: prioritized law list for the user to collect.

Deploy note: service changes are safe against the EXISTING Qdrant collection
(keyword search fails soft exactly as before until reprocess adds the index).
Full effect requires: node scripts/process-documents.js (rebuild, ~$0.10) and
then node scripts/eval-rag.js for the baseline.

Budget: aux calls on mini (~$0.0002/q), prompt halved (saves input on every
question), maxTokens is a cap not a spend, embeddings stay -small, eval is
retrieval-only, 4/week limit untouched.
