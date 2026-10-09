# Plan — Legal-only supply + Free Basic (model simplification)

Status: PLAN (not built). Date: 2026-10-09. Owner: Nexa.
Supersedes the multi-vertical direction in `multi-vertical-marketplace-plan.md` (that work is
data-preserving config — we PAUSE it, we don't delete it).

## Thesis
Collapse to a one-sided-supply, two-audience model:
- **Basic = FREE** for SMBs — the demand side / lead source. Many free users = inventory.
- **Pro = lawyers only, capped at 20 seats, €590/yr** — scarce, premium supply.
- The product is the lead pipe: free SMB usage (esp. AI) → qualified legal lead → lawyer.
- **Pilot first:** the founding 20 lawyers get a **free 6-month pilot**, then convert to €590/yr.
  Open the pilot only AFTER the free SMB base produces real request volume (stagger supply to
  demand). The pilot proves ONE metric: qualified leads delivered per lawyer per month.

> The 20×€590 (~€11.8k/yr) is a **validation pilot, not the business**. Success = proven
> lead-flow + a free SMB base big enough to later raise the cap, raise price, and sell directly.

The lead flywheel (Ask-a-Pro board + AI→human handoff + provider caps) ALREADY EXISTS and is
legal-first by design. This plan is mostly **subtraction + one real change (free Basic)**, all
reversible.

## Decisions locked (user, 2026-10-09)
1. **Free Basic = free but AI-limited.** Full Basic tools free; Legal AI free up to a per-user
   monthly cap. On substantive legal issues the AI must **recommend bringing in a lawyer** —
   either (a) connect a Pro into the conversation (internal lead), or (b) point the user to
   **mbg.org** (Bar directory) as the external fallback. (b) also covers cold-start when no Pro
   has claimed.
2. **Lawyers: seed free, charge later.** Onboard first lawyers free to prove lead flow; flip on
   €39/mo once the pipe delivers volume. (Matches `no-paying-users-yet`.)
3. **Scope now: plan only.** No code yet.
4. Non-legal verticals (real estate, insurance, accounting, consulting, marketing) are **PAUSED**,
   not removed — constants/data stay; only supply-side EXPOSURE is hidden. Un-pause = re-expose.

## Target model
- **Basic** — role `standard_user`, plan `basic`, status `active` on signup (NOT locked).
  Free. Features: documents, screenings/LHC, Nexa AI (capped), education, dashboard, cases.
  Co-workers ≤3 unchanged.
- **Pro** — role `admin_user`, plan `pro`. Lawyers only. Provider type at signup = `lawyer`
  only; practice areas limited to the 8 legal areas. €39/mo (seeded free initially).
  Gets: the leads board, Ask-a-Pro claims, blog/Topics marketing surfaces, 25 client seats.

---

## Change 1 — Free Basic (the only real behavioral change)
Today new accounts are LOCKED (`subscription.status = 'none'`, zero access) until code/pay —
see shipped `tier-merge-plan.md`. Flip Basic to free-on-signup.

- `server/controllers/authController.js` (`verifyEmail`) + `subscriptionController.getMine`:
  replace `initLocked()` with an **init-free-basic** path → `role standard_user`, `plan basic`,
  `status active`, NO `endsAt`. (Keep `initLocked` only for users who explicitly chose Pro and
  haven't been seeded/paid.)
- `subscriptionGuard` / `hasFeatureAccess`: a free-basic active user passes Basic feature gates;
  Pro-only routes still 402 (unchanged — already behind the Pro gate).
- Keep the self-subscribe (pay) and promo-code paths intact for Pro.

### AI usage cap (the one net-new mechanism — VERIFY FIRST)
- **Verify** whether a per-user AI quota already exists (`legal-ai-rag-overhaul` mentions a
  "4/week" budget rule — confirm if that's global or per-user). If none per-user:
  - Add a per-user monthly counter (e.g. `user.aiUsage.{month, legalChatCount}`), increment in
    the legal AI chat controller, enforce a cap (config constant, env-overridable).
  - On cap-hit: return a soft wall — "месечниот лимит е достигнат" + the two lawyer CTAs below.
- Decide the cap number later (business, not technical) — placeholder e.g. 20 legal-AI msgs/mo.

## Change 2 — AI → lawyer handoff + mbg.org fallback
Reuse the existing AI→human handoff (`pro_requests`, AI chip, `AITeamHome`). Two CTAs on
substantive legal issues (and at the AI cap wall):
1. **Internal (lead):** „Поврзи ме со адвокат" → creates a `pro_request` (legal), admin approves
   → `approveToBoard()` → `eligibleProsForCategory('legal')` → first-to-claim. This IS the lead.
2. **External fallback:** „Најди адвокат на mbg.org" → link to the Bar directory. Shown always,
   and is the primary CTA during cold-start (no claiming Pro yet) so the user is never stuck.
- Keep AI strictly informational; the lawyer is the licensed-advice boundary (UPL).
- Wire the mbg.org CTA into: legal AI chat responses (prompt/structured), the cap wall, and the
  LHC/doc "ask a pro" handoff points that already exist.

## Change 3 — Pause non-legal verticals (config, reversible, data-preserving)
| File | Pause change |
|---|---|
| `authController.chooseAccountType` → `PROVIDER_TYPE_TO_AREA` (authController.js:396) | Offer only `lawyer` as provider type at signup |
| `PRACTICE_AREAS` (roles.js:159) | Expose only the 8 legal areas in the signup/profile picker; keep `real-estate`/`insurance`/`consulting` constants (don't break data) |
| `proRequestsService` `AGENT_TO_CATEGORY` (l.34) | Route only `legal`; insurance/marketing/hr branches go dormant |
| Satellite sites (properties.nexa.mk, osiguran.nexa.mk) | PAUSE marketing — stop driving supply signups (not a code change) |
| marketplace categories / inquiry professions / procedure templates | Leave in data; harmless with nothing routing to them |

No migration. Un-pause later = re-expose picker options.

## Change 4 — Pricing / funnel copy
- `client/src/pages/website/Pricing.js` + `server/constants/roles.js PLAN_PRICES`: present Basic
  as **€0 / free** (or drop the Basic card and frame it as "free account"); keep Pro €39/mo.
- Onboarding/locked-state copy: remove "enter a code to unlock" as the default SMB path — SMBs
  just get in free. Code/pay flow remains for Pro.
- Purge any remaining trial narrative for Basic.

## Change 5 — Seed lawyers free, charge later
- Keep Pro promo-code mechanism (`PRO30-…`) to onboard the founding lawyer cohort free.
- `providerCapService` / `PROVIDER_AREA_CAP_DEFAULT (3)` stays ON to keep legal leads dense while
  the cohort is small — important when few lawyers must feel ROI.
- No payment enforcement on seeded Pros yet; flip `subscriptionGuard` to require active paid Pro
  only once lead volume justifies it (a later toggle, not now).

---

## What already exists (REUSE — do not rebuild)
- Two-tier constants/roles/migration (`tier-merge-plan.md` — shipped): basic/pro, standard_user/
  admin_user, products A/B, storefront de-merge (nexa.mk / leads.nexa.mk).
- Ask-a-Pro board end-to-end: `pro_requests`, `approveToBoard()`, `eligibleProsForCategory`,
  atomic `claim()` (`proRequestsService.js`).
- AI→human handoff chip + context packet + `AITeamHome`.
- Provider caps (`providerCapService.js`, `roles.js:139`).

## What NOT to touch
- The vertical constants/data (pause by hiding exposure only).
- Pro client-seats model, document generation, LHC scoring.
- Storefront/product-A/B split (already supports Basic-SMB vs Pro-lawyer).

## Phasing (each verifiable before next)
1. **Pause verticals** (Change 3) — lowest risk, config only, reversible. Ship first.
2. **Free Basic** (Change 1, minus AI cap) — the model flip; verify new signup = active free Basic.
3. **AI cap + lawyer/mbg.org CTAs** (Change 1 cap + Change 2) — verify cap enforcement + both CTAs.
4. **Pricing/copy** (Change 4).
5. **Seed-lawyer toggle** (Change 5) — leave paid-enforcement OFF for now.

## Open questions (business, decide before/within build)
- Exact free AI cap number (msgs/month).
- Does a per-user AI quota already exist, or is it net-new? (verify in legal-ai chat controller).
- When (what lead volume) flips Pro from free-seed to paid enforcement.
- Basic shown as €0 card vs. "free, no card at all" on /pricing.

## Verification
- New SMB signup → active free Basic, full Basic tools, AI works up to cap, cap wall shows both
  lawyer CTAs.
- Provider signup offers only `lawyer`; a seeded lawyer (promo) gets the leads board.
- Ask-a-Pro: free user → request → admin approve → legal Pros notified → first claim wins.
- Non-legal: no way to sign up as insurance/real-estate provider; board routes legal only;
  constants intact (un-pause still possible).

====================================================================================
# PART 2 — Founding-20 pilot, pricing, waitlist, website, marketing, content
Date added: 2026-10-09. Decisions locked (user): 20-lawyer cap, €590/yr, 6-month free pilot,
demand (free Basic) FIRST then supply, direct selling deferred until the free base exists.

## A. Pricing change (Pro €590/yr, Basic €0)
- `server/constants/roles.js PLAN_PRICES.pro` → annual **590** (was 390). Keep/choose cadence
  (see Open Decision O1). Basic stays €0 (free, per Part 1).
- `client/src/pages/website/Pricing.js PRICES` → mirror (sync note already in file).
- Pro card becomes **invite-only** during pilot: no self-serve checkout, no public waitlist form.
  CTA = „По покана / Контакт" → contact link. Price shown as „€590/год. по пилот-периодот".
- Cadence: **annual-only €590** (O1 resolved) — no monthly Pro option.
- Promo reminder/email copy tier+price aware (reuse `subscriptionEmails`, already plan-aware).

## B. The 20-seat global cap (net-new — today caps are PER-AREA 3)
- Add a **global** active-Pro cap, default 20 (env `PRO_GLOBAL_CAP`), alongside the existing
  per-area caps (`roles.js:139`, `providerCapService.js`).
  - `providerCapService.countActivePros()` (role admin_user + active/pilot sub) and
    `isGlobalCapReached()`.
  - Enforce at: provider promo redeem / activation, and the waitlist→invite admin action.
- **Density is GEOGRAPHIC, not per-area (O2 resolved).** The 20 stays a single global cap in code;
  distribution is a **recruitment** decision by city (e.g. Skopje 5, Bitola–Prilep 4, Štip 3, …).
  No per-city code cap needed now — it's who you invite.
- Routing already supports this: `leadRoutingService.pickAssignee` filters on `superUser.cities`
  overlap, so a Skopje SMB's request routes to Skopje lawyers. Ensure lawyers set their city at
  onboarding (it already exists on `superUser.cities`).
- Admin view: show `countActivePros / 20` + a **per-city** breakdown (extend `areaCapStatus` to
  group by city) so you can see where you still have room.

## C. 6-month pilot mechanics (REUSE promo infra — minimal new work)
- A pilot lawyer = Pro promo code with **`promoDays: 180`** (already supported:
  `promoCodeService.create` + `subscriptionController` Joi `max(365)`). Status `active` for 180d.
- **Clock start = redemption/first activation** (existing `redeemPromo` sets endsAt = now+180).
- **End-state at day 180:** convert to €590/yr paid or lock (reuse locked state from Part 1).
  Decide auto-convert vs manual (Open Decision O3).
- **Conversion reminders:** current `trial-conversion-reminders` is tuned to 30-day cycles
  (d7/d2). Add a **180-day-aware schedule** (e.g. month-5 heads-up + 2-week + final), MK bank
  hours, idempotent stages — clone the existing scheduler, new stage keys.

## D. Recruitment — manual outbound, NO waitlist feature (O5 resolved)
User recruits each lawyer personally, so we build **zero waitlist code**. The flow is entirely
existing infra:
- Admin mints a `promoDays:180` Pro code per prospect (`promoCodeService.create`, already there)
  and sends it via the existing `promoInvite` email / deep-link `/redeem?code=…`.
- The **global 20-cap (Section B)** is the only guard: it blocks the 21st activation and powers
  the admin `N/20` + per-city counter so you know where you still have room.
- No public form, no `pro_waitlist` collection, no self-serve lawyer signup. (If overflow demand
  appears later, revisit — not now.)

## E. Website adjustments (two storefronts already exist — use them)
Storefront split is live: `nexa.mk` (product A / SMB) vs `leads.nexa.mk` (product B / lawyers)
via `lib/storefront.js` + `config/nav.js`. Re-skin copy, don't re-architect.

**nexa.mk (demand / free Basic) — acquisition-first:**
- Hero = „Бесплатни алатки за усогласеност + AI. Поврзи се со адвокат кога ти треба."
- Primary CTA = free signup (no card, no code). Kill trial/locked narrative for SMBs.
- Lead magnets front-and-center: **/proverka** compliance teaser (already built), free
  screenings/LHC, one free document, verified-employer badge funnel.
- Make the AI→lawyer handoff + mbg.org fallback visible as a value prop ("не си сам").

**leads.nexa.mk (supply / founding 20) — scarcity + premium, INVITE-ONLY:**
- Hero = „Основачки 20: квалификувани правни клиенти од македонски бизниси. Бесплатен
  6-месечен пилот, потоа €590/год."
- NO public form. CTA = „По покана — контактирајте нè" (contact link/email). Value prop blocks:
  exclusive/geo-dense leads, AI-pre-qualified warm hand-offs, marketing reach to the SMB base
  (blog/Topics/newsletter), 25 client seats.
- Honesty: pilot framing, no "checked by a lawyer" claims about the AI (master-plan honesty pass).

**Pricing page:** Basic €0 „Бесплатно"; Pro €590/год „по пилот — само по покана".

## F. Marketing actions (sequenced: demand BEFORE supply)
**Stage 1 — build the free SMB base (weeks 0–8, do this first), GEO-TARGETED:**
- Concentrate SMB acquisition in the **cities where you intend to recruit lawyers** (Skopje,
  Bitola–Prilep, Štip, …) so demand and supply co-locate for routing.
- Push /proverka teaser as the top-of-funnel hook (per-source share links already exist — use a
  per-city source tag).
- SEO/content on high-volume legal topics (labor, company formation, contracts/GDPR) that map to
  doc generators + screenings → each piece ends in a free-signup CTA.
- Satellite network sites drive traffic (grep `iplaw` for all placements).
- Verified-employer badge funnel as a second SMB magnet.
- Gate: a threshold of active free users + baseline request volume **per target city** BEFORE
  inviting lawyers there (define the number — Open Decision O4).

**Stage 2 — open the Founding 20 (after Stage 1 threshold), city by city:**
- Direct personal outbound to lawyers per city — per-prospect `promoDays:180` codes
  (`onboarding-code-first`). No public form.
- "Founding 20" exclusivity narrative on leads.nexa.mk (invite-only).
- **Recruit matched to demand per city** (Skopje 5 / Bitola–Prilep 4 / Štip 3 …) — don't invite a
  city's lawyers until that city's SMB requests are appearing, so no one lands in an empty pipe.

## G. Content changes
- Reframe all Pro-side copy from generic „провајдери/service providers" → **„адвокати/lawyers"**
  (i18n mk/en); the non-legal vertical copy is already paused (Part 1 Change 3).
- Honesty pass holds: AI is informational; lawyer = licensed advice; no "lawyer-checked" claims.
- Pilot transparency on leads.nexa.mk: "пилот-период, градиме побарувачка" during Stage 1→2.
- SMB content concentrates on the chosen 2–3 legal areas (density > breadth).

## H. Phasing (Part 2, on top of Part 1 phases 1–5)
6. Pricing: Pro annual-only €590 + Pro card → invite-only (no checkout, no form) (Section A).
7. Global 20-cap + admin `N/20` + per-city counter (Section B). **Only net-new code in Part 2.**
8. Pilot = `promoDays:180` codes (exists) + 180-day-aware reminder schedule month-5/-6 (Section C).
9. Website copy re-skin both storefronts + pricing page (Section E, G).
10. Marketing execution — Stage 1 demand (geo-targeted), then Stage 2 supply city-by-city
    (Section F). Not a code task.
(No waitlist phase — recruitment is manual, Section D.)

## Open decisions (Part 2)
- **O1 — Pro cadence:** ✅ RESOLVED — annual-only €590 (no monthly).
- **O2 — Density:** ✅ RESOLVED — 20 GLOBAL cap in code; density steered by **geographic
  recruitment** (Skopje 5 / Bitola–Prilep 4 / Štip 3 …), leveraging existing `cities` routing.
- **O3 — Day-180 end-state:** ✅ RESOLVED — lock + manual close (no auto-charge during pilot).
- **O4 — Stage-1→2 gate:** OPEN — the per-city free-user / request-volume threshold that
  triggers inviting that city's lawyers. (Decide the number when Stage 1 data exists.)
- **O5 — Waitlist:** ✅ RESOLVED — no waitlist; manual per-prospect outbound only.

## Verification (Part 2)
- Pricing shows Basic €0 + Pro €590/yr annual-only, invite-only; no Pro self-serve checkout.
- 21st active lawyer is blocked (global cap); admin sees `N/20` + per-city counts.
- Redeeming a `promoDays:180` code → Pro active for 180 days; reminders fire month-5/-6; day-180
  locks (no auto-charge).
- A Skopje SMB request routes to a Skopje pilot lawyer (cities overlap in `pickAssignee`).
- Both storefronts show the new copy; SMB signup is free/no-code; leads.nexa.mk is invite-only.
</content>
</invoke>
