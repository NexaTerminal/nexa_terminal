# Nexa Terminal — Master Build Plan

_Date: 2026-07-03 · Owner: Martin · Status: PLAN — verify order before executing_

> Single source of truth for everything left to build, change, or finish.
> Derived from: `business-review-terminal.md` (June 24), the July business review
> (Desktop .docx), `cms-v1-plan.md`, `tier-merge-plan.md` (✅ done), and founder input.
>
> **Standing constraint:** NO "проверено од адвокат / checked by lawyer" claims anywhere —
> Martin is not currently licensed. The trust layer uses **factual provenance only**
> (law citations, official gazette numbers, last-updated dates, change logs). Citing the
> law requires no license. A partner law firm endorsement can be added later if one signs on.

---

## The strategic frame (why this order)

- **Zero paying users** → acquisition & conversion beat retention on priority, but retention
  (CMS) is what makes the sale worth making. Both are P0; friction fixes come first because
  they are days, not weeks.
- **Core loop to sell**: Проверка (screening finds the gap) → AI (explains it) → Документ
  (fixes it) → **CMS (tracks it — NEW)**. Everything in this plan either feeds that loop,
  proves its value, or removes friction around it.
- **Structural decision pending (D-1, §Decisions)**: self-serve funnel vs higher-priced
  concierge packages. The plan builds toward self-serve while keeping outbound working.

---

## Phase 0 — Quick fixes & honesty pass (1–2 days, do first)

Cheap, high-leverage, mostly deletions and copy. No new systems.

- [ ] **0.1 Fix the „Започнете бесплатно" dead-end.** Home + final CTA promise "free"; a
      code-less registrant lands in a locked terminal. Until Phase 1 ships a real free path,
      change CTAs to honest copy („Изберете план" / „Побарајте пристап") and make the locked
      screen sell: show what's inside (feature list + screenshots/preview), code box,
      plan chooser. One screen, no dead ends.
- [ ] **0.2 Flip the homepage narrative.** Lead with the SMB/demand story:
      „Правен оддел за вашата фирма — за €19 месечно." Documents/screenings/AI first.
      Move the satellite-sites + Topics (provider) story to a compact section lower on the
      page or a `/providers` page. Keep Pricing as is.
- [ ] **0.3 Hide empty marketplace surfaces.** Verify `showsFair`/`showsSourcing` gating;
      an SMB should not open an empty Виртуелен саем. Gate behind admin/preview until supply
      exists (opening day = marketing event later).
- [ ] **0.4 Park orphaned scope.** Investments + standalone FindLawyer: remove from any nav,
      leave routes dead or redirect. (Already decided June 24 — finish it.)
- [ ] **0.5 Verify mobile + locked-state flows** end-to-end once 0.1 lands (register →
      locked screen → redeem → terminal).

_Verify: new registrant without a code sees a selling locked screen, no "free" promise
anywhere that isn't true, no empty marketplace visible to Basic users._

---

## Phase 1 — Free public funnel: „Бесплатна проверка" (1–2 weeks) — ACQUISITION

The demo that sells itself. Reuses existing screening logic.

- [ ] **1.1 Public teaser screening** at `nexa.mk/proverka` (no login): ~10 questions from
      the employment screening → score + top-3 gaps + „Nexa го решава ова" mapping each gap
      to a generator/screening. Email capture on the results step (results emailed + shown).
- [ ] **1.2 Conversion hook**: results CTA → register → account lands in a **teaser state**
      (not fully locked): can see their saved score + the 3 gaps inside the terminal, and
      gets **one free document generation** to feel the wow. Then plan chooser / code.
- [ ] **1.3 Wire outbound to it.** Cold-invite emails + LinkedIn link to `/proverka`, not to
      the homepage. The funnel does the selling; codes become the accelerant.
- [ ] **1.4 Instrument it**: landed → completed → email → registered → generated → paid/redeemed.
      (Reuse the invited-prospects click-tracking pattern.)

_Decision D-2 (below): one free doc vs small free tier (e.g. 3 docs/мес)._
_Verify: a stranger can go from a LinkedIn link to a generated .docx without Martin touching anything._

---

## Phase 2 — Contract Management System v1 (2–3 weeks) — RETENTION

Full plan already exists and is verified against the code: **`tasks/cms-v1-plan.md`** —
execute M1→M5 as written (contracts collection, generate→save/upload/manual capture,
list/detail UI, reminder engine 08:00 Europe/Skopje, dashboard widget).

- [ ] M1 Data + API (`contractService`, controller, routes, wiring)
- [ ] M2 Capture (from-share promotion, upload, manual; download)
- [ ] M3 UI (sidebar „Договори", list, detail, form, save-affordance on generation)
- [ ] M4 Reminder engine (email + in-app, idempotent, status auto-transitions)
- [ ] M5 Dashboard widget + verification pass (§8 of the CMS plan)

Open CMS decisions to confirm at M1 kickoff: file persistence (reference+guard — recommended),
offsets `[30,7,1]`, explicit save (recommended), manual-only contracts allowed (yes).

---

## Phase 3 — Dashboard command center (1 week, after CMS M4)

Replace the updates-feed dashboard (currently a 97-line shell) with the compliance cockpit:

- [ ] **3.1 Compliance score** — last screening results per domain + „продолжи каде што застана".
- [ ] **3.2 Претстојни обврски** — CMS widget (expiring contracts, due obligations).
- [ ] **3.3 Next best action** — one rule-driven card (no screening yet → run one; gap found →
      generate the fixing doc; contract expiring → open it).
- [ ] **3.4 Recent documents** + quick re-generate.
- [ ] **3.5 Savings meter** (see Phase 5) once the price map exists.
- [ ] Keep the admin updates feed as a slim right-rail item, not the main stage.

---

## Phase 4 — Macedonian compliance calendar (3–5 days)

Recurring reason to open Nexa between events. Mostly static data + existing schedulers.

- [ ] **4.1 Deadline dataset** (static JSON, Martin-curated): annual accounts, tax dates,
      mandatory annual decisions (годишен одмор decision, etc.), per-company-type where relevant.
- [ ] **4.2 Calendar page** in РАБОТА + dashboard strip („Следен рок: … за N дена").
- [ ] **4.3 Email reminders** via existing cron/email infra, each deep-linking to the
      generator or screening that solves the deadline.

---

## Phase 5 — Savings meter (2–3 days)

- [ ] **5.1 Price map**: market lawyer price per documentType (Martin supplies numbers; stored
      in one constants file).
- [ ] **5.2 Counter**: sum over user's generation history → dashboard card
      („Заштедивте ~€1.240") + line in renewal/reminder emails + on generation success toast
      („Овој документ кај адвокат: ~€80").
      _Framing: „просечна пазарна цена", never a legal-advice claim._

---

## Phase 6 — Trust layer, no-credential version (1 week, content-heavy)

No lawyer endorsement — provenance instead:

- [ ] **6.1 Per-template legal basis**: each generator page + generated .docx footer shows
      „Според [закон], чл. X · Сл. весник бр. Y/год. · Ажурирано [датум]". Stored as metadata
      per template (one constants map; rendered in UI + docx).
- [ ] **6.2 Public change log** `nexa.mk/zakoni`: „Што се смени во прописите" — dated entries;
      when a law changes, affected templates get a „Ажурирано" badge. (Manual curation.)
- [ ] **6.3 About/story page**: the real founder story (built by a former practicing lawyer —
      biographical fact, allowed) + how templates are maintained. Human face, no credential claims.
- [ ] **6.4 Later hook**: partner law firm „преглед на шаблоните" — parked until a firm signs.

---

## Phase 7 — Onboarding friction: ЕМБС/ЕДБ autofill (research first, then ~1 week)

- [ ] **7.1 Research spike (½ day)**: is Central Register company data reachable
      (open-data portal, CRM API, or scrape)? Cost/legality/stability.
- [ ] **7.2 If viable**: on profile completion, type ЕДБ/ЕМБС → autofill companyName/address →
      confirm → first document in <60s. If not viable: shrink the manual form to the 4 required
      fields and defer everything else.

---

## Phase 8 — Accountant partner program (distribution; product part is small)

- [ ] **8.1 Landing page** `/smetkovoditeli`: „Понудете им Nexa на вашите клиенти" — Pro's 25
      client seats framed as the offering; simple economics (margin or free Pro at N clients).
- [ ] **8.2 Partner mechanics**: per-partner promo/referral code (infra exists) + attribution
      in invited-prospects; manual payout tracking is fine at this stage.
- [ ] **8.3 Outbound switch**: aim cold outreach at accounting firms, not individual SMBs —
      10 accountants × 30 clients beats 1000 cold emails.

---

## Phase 9 — AI surface consolidation (nice-to-have, after P0–P5)

- [ ] One „Nexa AI" entry with mode tabs (Правен / Маркетинг / Анализа на договор / Преференци)
      instead of four sidebar children. Pure UX consolidation; backend unchanged.

---

## Decisions needed from Martin (blockers marked ⛔)

| # | Decision | Options | Blocks |
|---|----------|---------|--------|
| D-1 | **Funnel vs price** — self-serve motion (free funnel + later card payments) or higher-priced concierge packages (€790–1.500/год) | build funnel / raise price / both | strategy only, plan assumes funnel |
| D-2 ✅ | Free experience shape — **DECIDED 2026-07: one free document** after teaser screening + registration | — | Phase 1.2 |
| D-3 | Card payments (CPAY/local PSP) vs proforma-only for self-serve upgrades | investigate PSP / stay proforma | none yet (Phase 1 works with proforma) |
| D-4 | CMS open items (§9 of cms-v1-plan) | recommendations already in plan | Phase 2 M1 |
| D-5 | Savings price map numbers | Martin reviews DRAFT prices in `constants/documentPrices.js` | Phase 5 (built w/ drafts) |
| D-6 | ЕМБС autofill approach | A: best-effort CRM public endpoint (ToS check) / B: shrink manual form now | Phase 7.2 |

---

## Execution order (recommended)

1. **Phase 0** (days) — honesty pass, immediately.
2. **Phase 1** (funnel) — highest leverage; needs D-2.
3. **Phase 2** (CMS) — start as soon as Phase 1 is in verification; plan is ready.
4. **Phase 3 → 4 → 5** — dashboard, calendar, savings (each small, each compounds the demo).
5. **Phase 6 → 7 → 8** — trust, autofill, accountants.
6. Phase 9 whenever convenient.

**Not building** (explicitly parked): new document types, new marketplace surfaces,
Virtual Fair work, Investments, more admin/outbound tooling, e-signature (CMS Phase 2 item).

## Progress log

- [x] Phase 0 — **0.1–0.4 done 2026-07** (0.5 live verification pending):
  - 0.1 LockedWelcome panel on Dashboard for `status==='none'` (sells the 4 pillars,
    code redeem + "Изберете план" → SubscriptionGate); BlogPost modal "целосно бесплатно"
    → honest copy; Home "Започнете бесплатно" removed.
  - 0.2 Home.js flipped: hero „Вашиот правен оддел — за €19 месечно" + subtitle;
    Дел 1 = automate (tools, moved up); satellites + Topics demoted to „За провајдери"
    Дел 2/3; closing CTA → /pricing. mk+en translations updated.
  - 0.3 `showsFair` → admin-only (Fair hidden until supply); new `showsSourcing` keeps
    Барање за понуди visible to all.
  - 0.4 Investments + FindLawyer routes → redirects (/terminal, /terminal/sourcing);
    imports removed.
  - Verified: eslint 0 errors, production build passes. NOT committed (multi-agent rule).
- [ ] Phase 0.5 — live flow check (register → locked panel → redeem → terminal) once dev servers run.
- [x] Phase 1 — **1.1 + LockedWelcome pickup done 2026-07** (verified):
  - Server: `data/publicTeaserQuestions.js` (10 curated MK-law questions with gap/risk/fix),
    `routes/publicScreening.js` mounted pre-CSRF at `/api/public/screening`
    (questions / submit / result/:id/email / result/:id). Evaluation server-side only;
    honeypot; min-5-answers; report email via emailService; lead stored in
    `teaser_screenings` (answers, result, email, source, registeredUserId).
  - Client: `/proverka` public page (intro → 10-question quiz → score ring + top-3 gap
    cards + „Отворете сметка" CTA + email-report capture); result id kept in
    localStorage (`nexa_proverka_result_id`); LockedWelcome shows the score+gaps to the
    locked registrant (funnel continuity). Home hero secondary CTA → /proverka
    („Бесплатна проверка на усогласеност" — the honest replacement for "Start free").
  - Verified: 14/14 functional API tests (stubbed db) — scoring math, severity ordering,
    NA handling, honeypot, email capture, no answer/email leakage; client builds clean.
  - **1.2 one-free-document — DONE 2026-07:** subscriptionGuard grants `req.freeDocPass`
    for POST /api/auto-documents when status==='none' && !freeDocUsed (owners only);
    creditMiddleware skips the balance check on the pass and sets
    `users.freeDocUsed/freeDocUsedAt` only on a SUCCESSFUL generation; auth payload +
    tier.js `hasFreeDocPass()`; VerificationRequired opens /terminal/documents/* for
    pass holders; LockedWelcome advertises the free doc („Подарок · 1 бесплатен
    документ"). Verified 7/7 (fail≠burn, success marks, 2nd attempt 402, suspended
    excluded).
  - **1.3 DONE:** cold-invite emails (mk+en) now carry a secondary /proverka link.
  - All email CTAs env-driven (`CLIENT_URL`/`PORTAL_URL`, localhost fallback) — nothing
    hardcoded to production; nothing committed/deployed.
  - **Remaining in Phase 1:** 1.4 funnel stats admin view (data already collected in
    `teaser_screenings`); optional: stamp `registeredUserId` on the teaser record.
- [x] Phase 2 (CMS) — **M1–M5 built 2026-07** (live click-through pending):
  - Backend: `services/contractService.js` (durable `contracts` collection, indexes,
    status auto-transitions active→expiring→expired, obligations, upcoming feed,
    `isFileReferenced` cleanup guard), `controllers/contractController.js`,
    `routes/contracts.js` (@ /api/contracts behind subscriptionGuard; multer upload
    .docx/.pdf 15MB; admin `POST /_run-reminders`), wired in server.js initializeServices.
  - Capture: manual create, upload→GridFS(shared_documents bucket), and
    **from-share/:shareToken** — promotes the existing shared_documents record
    (same GridFS fileId, idempotent) with best-effort prefill from formData.
  - Reminders: `contractReminderService` (offsets [30,7,1]; tightest-offset-fires,
    wider windows marked satisfied; idempotent via reminders.sent[]; email via
    emailService with CLIENT_URL deep link; failed send retried next run) +
    `contractReminderScheduler` daily 08:00 Europe/Skopje.
  - UI: sidebar „Договори" (РАБОТА); list (filters/search/status chips), detail
    (metadata, obligations add/complete, download, renew/terminate/delete), form
    (create/edit + upload); DocumentSuccessModal „Зачувај во Договори" button;
    Dashboard „Претстојни обврски" widget (30d, urgency colors).
  - Verified: 26/26 backend tests on throwaway local Mongo (CRUD, ownership 403-style
    isolation, text search, status transitions, upcoming feed, file guard, reminder
    idempotency incl. the multi-window offset bug found & fixed); client builds clean.
  - Note (deviation from plan §4): in-app notifications skipped — routes/notifications.js
    is an in-memory Map, not durable; email + dashboard widget are the channels.
- [x] Phase 3 — **Command center built 2026-07** (savings meter deferred to Phase 5/D-5):
  - Server: `routes/dashboard.js` → GET /api/dashboard/summary (behind subscriptionGuard):
    latest screening per domain (lhc incl. distinct areasDone + latest violations count,
    mhc/hhc/chc), 5 recent shared_documents, CMS upcomingCount. 8/8 functional tests
    (throwaway Mongo) incl. cross-user isolation.
  - Client: `CommandCenter.js` on Dashboard — next-best-action banner (rules: no legal
    screening → run it; violations → generate fixing docs; missing domain → screen it;
    else maintain), 4 domain score cards (color-coded %, „Направи проверка" empty state),
    recent-documents card. Renders above UpcomingObligations; UpdatesFeed demoted below.
  - Dashboard main stage is now the compliance cockpit, not the feed.
- [ ] Phase 4 —
- [x] Phase 5 — **Savings meter built 2026-07** (prices are DRAFT — D-5 pending Martin review):
  - `constants/documentPrices.js` — per-slug market-price map (EUR) + `priceFor()` +
    `slugFromTransaction()` (derives slug from credit-tx endpoint when no documentType);
    default €50 for unlisted/custom. **Martin: adjust numbers only — nothing else changes.**
  - Dashboard summary now returns `savings {totalEur, docsCount}` — sums durable
    `credit_transactions` (type DOCUMENT_GENERATION) + `template_generations` (custom) ×
    price map. CommandCenter shows a green „~€X заштедени" card (docsCount>0).
  - Per-generation: baseDocumentController sets `X-Market-Price` header (CORS
    exposedHeaders updated) → documentService → DocumentSuccessModal shows
    „Ваков документ во адвокатска канцеларија чини ~€X". Framing = „просечна пазарна цена".
  - Verified: dashboard test now 10/10 incl. savings math (60+80+50 default +50 custom=240,
    AI_QUESTION + foreign-user tx excluded); client builds clean.
- [ ] Phase 6 —
- [~] Phase 7 — **7.1 research spike DONE 2026-07** (findings: `tasks/phase7-embs-research.md`):
  ЕМБС (7-digit, CRM) is the key; basic company data (name/address/legal form/status) is
  FREE & public via crm.com.mk (OGP-backed), but no official free API — only an unofficial
  `CRMPublicPortalApi` endpoint or paid providers (VATify/Dotfile/CRM distribution).
  **Blocked on Martin (D-6):** Option A (best-effort call to public CRM endpoint, needs
  ToS comfort + ½-day endpoint spike) vs Option B (skip autofill, shrink manual form to
  4 fields now, revisit paid API post-revenue). 7.2 implementation waits on this.
- [x] Phase 8 — **Accountant landing page built 2026-07** (8.1 done; 8.2 = existing infra; 8.3 = ops):
  - `/smetkovoditeli` (`pages/website/Accountants.js` + module) — markets the EXISTING Pro
    25-client-seat capability to accounting firms (no invented economics): hero, 6 benefit
    cards, 3-step how-it-works, closing CTA. CTAs → `/login?intent=pro` (self-serve) + `/contact`.
  - Discoverable: CTA button in Home „За провајдери" section + footer link „За сметководители"
    (mk/en). Route added in App.js.
  - 8.2 partner mechanics: **already satisfied by existing infra** — per-prospect Pro promo
    codes + click attribution (invited_prospects) from the cold-invite work ARE the partner
    code mechanic; no new code needed. Exact incentive economics (margin / free-Pro-at-N)
    intentionally NOT put on the public page — that's Martin's commercial call, CTA is contact.
  - 8.3 outbound switch (aim cold outreach at accounting firms) = operational, not code.
  - Verified: client builds clean; JSON valid.
- [ ] Phase 9 —
