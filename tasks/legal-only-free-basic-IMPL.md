# Implementation Plan — Legal-only + Free Basic + Founding-20 pilot (STEP BY STEP)

Status: READY TO BUILD (not started). Date: 2026-10-09.
Strategy/decisions: see `legal-only-free-basic-plan.md` (Part 1 + Part 2). This file is the
ordered build checklist. Each step is independently verifiable; do them in order.

## Hard constraint (user, 2026-10-09)
**The PUBLIC site shows NO price and no price-like details** (no €590 / €39 / discounts / "per
month"). Pricing lives ONLY internally (server constants + admin + billing logic). Public Pro =
**invite-only** ("по покана"); public Basic = **free** positioning only (word "бесплатно",
no number). Also SCRUB existing public price mentions (Step 9).

Legend: **[INT]** internal/backend/admin · **[PUB]** public website · each step ends with ✔verify.

## BUILD STATUS (2026-10-09)
- ✅ **Milestone 1 (Steps 1–3) — DONE & verified.** Provider signup gated to lawyers
  (`PRO_PROVIDER_TYPES` env, default lawyer) in authController + TierOnboardingModal; practice-area
  editor offers legal-only via new `ACTIVE_PRACTICE_AREAS` (roles.js) consumed by adminUserController;
  AGENT_TO_CATEGORY left as-is (non-legal dormant — no mis-route). node -c clean; active areas = 8 legal.
- ✅ **Milestone 2 (Steps 4–6) — DONE & verified.** `initFreeBasic` (perpetual, endsAt=null) +
  access rule treats null endsAt as never-expiring (server `hasFeatureAccess` + client `tier.js`);
  suspendExpired already skips null endsAt; verifyEmail + getMine route Basic→free, Pro→locked
  (invite-only). AI cap already existed (`weeklyLimit`); limit wall now offers „поврзи со адвокат"
  + Bar directory (mba.org.mk). Logic test + `npm run build` pass.
- ✅ **Milestone 3 (Steps 7–8) — DONE & verified.** Pro price €590 annual-only INTERNAL
  (roles.js PLAN_PRICES, not public); `PRO_GLOBAL_CAP=20` (env) + `countActivePros`/
  `isGlobalCapReached`/`globalCapStatus` (per-city) in providerCapService; cap enforced in
  `redeemPromo` (21st Pro blocked, PRO_CAP_REACHED); admin `GET /api/admin/pro-cap-status`.
  Pilot = existing 180-day promo codes → `offer_d7`/`offer_d2` proformas (promo audience) →
  `suspendExpired` locks at day-180 (no scheduler change needed; earlier month-5 nudge deferred).
  Logic test: cap 19→false, 20/21→true, price=590.
- ✅ **Milestone 4 — DONE & build-verified.**
  - Step 9 scrub: ZERO public price numbers (grep clean); Login.js trial narrative →
    free-for-business / invite-only; FAQ `cost` + orphaned `pricing*` keys (mk+en) de-priced.
  - Step 10: `Pricing.js` rewritten — no prices, no cycle toggle, no price JSON-LD; Basic
    „Бесплатно"→/login, Pro „По покана"→/contact.
  - Step 11: Home.js hero reframed to FREE + „поврзи со адвокат"; secondary CTA → Start free
    (/login); heroSubtitle (mk+en) updated.
  - Step 12: LeadsHome.js reframed to lawyers / founding cohort / invite-only (SEO, pill, brand,
    first feature); dropped non-legal lead sources (osiguran=insurance, properties=real estate)
    from the network marquee.
  - Step 13: public „професионалци/providers" → „адвокати/lawyers" on the public storefronts;
    Pricing Pro tagline already lawyer-worded. JSON valid; `npm run build` compiled successfully.

## ✅ ALL MILESTONES COMPLETE (unit/build-verified; not committed; needs live end-to-end pass)

Note: real MK Bar directory is **mba.org.mk** (already in the AI prompt), used instead of "mbg.org".
NOT committed (multi-agent coordination). Verify end-to-end against a running stack before ship.

---

## Step 0 — Recon & confirm unknowns (no code) **[INT]**
- [ ] Locate the **legal AI chat controller/service** (the request path that calls the RAG/LLM)
      — confirm where to increment + enforce a per-user cap. (Start: `server/chatbot/`,
      `agentProfiles.js`, routes `/api/ai/*`.)
- [ ] Confirm whether a **per-user AI quota** already exists (memory notes a "4/week" budget rule
      — determine if global or per-user). Decides if Step 5 is net-new or an extension.
- [ ] Locate the **promo reminder scheduler** (`trial-conversion-reminders`) to clone for the
      180-day schedule (Step 8).
- [ ] `grep` the **public** client for price mentions to scrub later:
      `grep -rn "590\|390\|39\b\|149\|€\|EUR\|месечно\|годишно" client/src/pages/website client/src/locales` (note hits for Step 9).
- ✔verify: a short notes block listing exact file:line for each above.

---

## MILESTONE 1 — Pause non-legal verticals (lowest risk, reversible, config-only)

## Step 1 — Restrict provider signup to lawyers **[INT]**
- [ ] `server/controllers/authController.js` `chooseAccountType` (~l.396): offer only `lawyer`
      as provider type; map → `general-legal` (leave the other `PROVIDER_TYPE_TO_AREA` entries in
      code, just don't expose them).
- [ ] Client account-type picker (find the provider-type UI): show only "Адвокат".
- ✔verify: a new provider account can only become a lawyer; other types unreachable in UI + API.

## Step 2 — Legal-only practice areas & routing **[INT]**
- [ ] `server/constants/roles.js` `PRACTICE_AREAS` (l.159): expose only the 8 legal areas in the
      signup/profile picker; keep `real-estate`/`insurance`/`consulting` constants (don't delete).
- [ ] `server/services/proRequestsService.js` `AGENT_TO_CATEGORY` (l.34): route only `legal`
      (insurance/marketing/hr branches go dormant — leave code).
- ✔verify: board + Ask-a-Pro route only legal; non-legal categories never notify anyone;
      constants intact (un-pause = re-expose).

## Step 3 — Hide non-legal UI surfaces **[PUB]+[INT]**
- [ ] Any client pickers/filters listing non-legal categories (marketplace categories, inquiry
      professions) → show legal only. Data layer untouched.
- ✔verify: no path in the UI to select a non-legal vertical.

---

## MILESTONE 2 — Free Basic (the real behavioral change)

## Step 4 — Flip new signups from LOCKED → active free Basic **[INT]**
- [ ] `server/services/subscriptionService.js`: add `initFreeBasic(userId)` → role
      `standard_user`, plan `basic`, status `active`, `endsAt: null` (idempotent). Model it on
      `initLocked`/`initTrial`.
- [ ] `server/controllers/authController.js` `verifyEmail` + `subscriptionController.getMine`:
      call `initFreeBasic` instead of `initLocked` for SMB signups. Keep `initLocked` ONLY for
      accounts that explicitly chose Pro and aren't seeded yet.
- [ ] Confirm `subscriptionGuard` / `hasFeatureAccess`: free-basic active passes Basic gates;
      Pro-only routes still 402.
- [ ] Remove the SMB "enter a code to unlock" default path; purge Basic trial narrative.
- ✔verify (DB): brand-new verified user → active/basic, full Basic tools, Pro routes 402.

## Step 5 — Per-user AI cap + soft wall **[INT]**
- [ ] If none exists (Step 0): add `user.aiUsage.{month, legalChatCount}`; increment in the legal
      AI chat controller; enforce a cap from a config constant (env-overridable; number TBD, NOT
      shown publicly).
- [ ] On cap-hit: return a soft wall payload (not an error) → message + the two lawyer CTAs
      (Step 6). Reset monthly.
- ✔verify: simulate N+1 messages → wall returns with CTAs; counter resets next month.

## Step 6 — AI → lawyer handoff + mbg.org fallback **[INT]**
- [ ] On substantive legal issues AND at the cap wall, AI response surfaces two CTAs:
      (1) „Поврзи ме со адвокат" → creates a `legal` `pro_request` (reuse existing flow);
      (2) „Најди адвокат на mbg.org" → external link (always shown; primary during cold-start).
- [ ] Wire CTAs into: legal AI chat output, the cap wall, and the existing LHC/doc "ask a pro"
      handoff points.
- ✔verify: a legal question shows both CTAs; (1) creates a pending pro_request; (2) links out.

---

## MILESTONE 3 — Pro internals (price lives here, never public)

## Step 7 — Pro pricing + cadence (INTERNAL ONLY) **[INT]**
- [ ] `server/constants/roles.js` `PLAN_PRICES.pro` → annual value (the real number), annual-only;
      remove/ignore monthly Pro in billing logic. Basic stays €0.
- [ ] Ensure the number is used ONLY server-side (billing, admin, invoices) — never sent to a
      public page. Admin UI may show it; public must not.
- ✔verify: billing/admin reflect the annual Pro price; `grep` confirms no public file imports it.

## Step 8 — Global 20-seat cap + pilot codes **[INT]** (ONLY net-new logic)
- [ ] `server/services/providerCapService.js`: add `countActivePros()` (role admin_user +
      active/pilot sub) and `isGlobalCapReached()` (default 20, env `PRO_GLOBAL_CAP`).
- [ ] Enforce the global cap at provider promo-redeem/activation (block the 21st).
- [ ] Extend `areaCapStatus` → also return **per-city** counts (group by `superUser.cities`) +
      `N/20` total, for admin.
- [ ] Admin: mint `promoDays:180` Pro codes per prospect (already supported) — confirm the mint
      form allows 180 and the plan=pro. No waitlist, no public form.
- [ ] 180-day conversion reminders: clone the `trial-conversion-reminders` scheduler → month-5 +
      final nudges, MK bank hours, idempotent stage keys. Day-180 = **lock** (no auto-charge).
- ✔verify: 21st activation blocked; admin sees N/20 + per-city; a 180-day code → active 180d →
      locks at expiry; Skopje SMB request routes to a Skopje pilot lawyer (`pickAssignee` cities).

---

## MILESTONE 4 — Public website (NO prices)

## Step 9 — Scrub public price mentions **[PUB]**
- [ ] Using Step 0 grep hits: remove/replace every price number in public pages + public i18n
      (`client/src/pages/website/*`, website locales). Replace with invite-only / free wording.
- ✔verify: `grep` for the price numbers returns ZERO hits in public client code/i18n.

## Step 10 — Pricing page → invite-only, no numbers **[PUB]**
- [ ] `client/src/pages/website/Pricing.js`: delete the `PRICES` constant usage; Basic card =
      „Бесплатно" + free-signup CTA (no number); Pro card = „По покана" + contact CTA (no number,
      no checkout). Keep feature bullets.
- ✔verify: page renders two cards with zero monetary figures; Pro has no self-serve checkout.

## Step 11 — nexa.mk (SMB) acquisition copy **[PUB]**
- [ ] Hero: free compliance tools + AI + „поврзи се со адвокат". Primary CTA = free signup
      (no card, no code). Surface /proverka teaser, free screenings/LHC, one free doc,
      verified-employer badge as lead magnets. Make the AI→lawyer/mbg.org handoff a visible value.
- ✔verify: landing leads to a no-code free signup; lead magnets linked.

## Step 12 — leads.nexa.mk (lawyers) invite-only copy **[PUB]**
- [ ] `LeadsHome.js`: „Основачки 20" hero — qualified geo-dense legal clients, free pilot (no
      numbers), then invite-only. CTA = „По покана — контактирајте нè" (contact link). NO form,
      NO seat counter public, NO price. Value blocks: exclusive/geo leads, warm AI hand-offs,
      marketing reach, client seats.
- ✔verify: page is invite-only, no price, no public form/counter.

## Step 13 — Content/i18n reframe **[PUB]**
- [ ] Rename Pro-side copy from generic „провајдери/service providers" → „адвокати/lawyers"
      (mk/en). Honesty pass: AI informational, no "lawyer-checked" claims. Pilot transparency
      line on leads.nexa.mk.
- ✔verify: no generic-provider or non-legal-vertical wording remains on public Pro surfaces.

---

## Final verification (end-to-end)
- [ ] SMB: verify → active free Basic → use tools + AI → hit cap → wall with lawyer + mbg.org
      CTAs → „поврзи со адвокат" creates a legal pro_request.
- [ ] Lawyer: redeem 180-day Pro code → active 180d → gets the legal board; 21st is blocked.
- [ ] Routing: Skopje SMB request → Skopje pilot lawyer.
- [ ] Public: no price anywhere; Basic = free CTA; Pro = invite-only contact.
- [ ] Non-legal verticals unreachable in UI but constants/data intact (reversible).
- [ ] `cd client && npm run build` succeeds; server files `node -c` clean.

## Suggested build order
M1 (Steps 1–3) → M2 (4–6) → M3 (7–8) → M4 (9–13). M1 is safest; ship/verify before M2.

## Not committed / coordination
Per `multi-agent-push-coordination` + `no-paying-users-yet`: don't commit/push until user says
all parallel agents are done; no back-compat heroics (all users are demo/dummy).

## Decisions still open (don't block the build; fill in as data arrives)
- Exact AI cap number (Step 5) — internal config, business decision.
- Real annual Pro price value (Step 7) — internal only.
- Per-city Stage-1→2 recruitment threshold (marketing, not code).
</content>
