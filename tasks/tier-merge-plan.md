# Plan — Two-tier model (Basic + Pro), exclusive sub-users, no auto-trial

## Decisions locked (user)
1. Sub-users **exclusive**: Basic → co-workers only (shared company); Pro → client companies only (each own company + verification). Neither tier does both.
2. No-code signup → **locked until code or payment** (account exists, zero feature access; can self-subscribe by paying or redeem a code).
3. Seat limits: **Basic 3 co-workers / Pro 25 client companies**.
4. Scope now: **tier model + code links only** — do NOT touch public Pricing page / prices / checkout.

## Target model
- **Basic** = role `standard_user`, plan `basic`. Features: documents, compliance checks (screenings), Nexa AI, request-an-offer (sourcing — demand side), education, virtual fair, dashboard. Sub-users: co-workers ≤3 (shared companyInfo, like today's sub_seat).
- **Pro** = role `admin_user`, plan `pro` (merges admin_5 + admin_10). Features: all of Basic + the rest — marketplace provider side, leads/lead-routing, blogs authoring, Topics Q&A, booth posting, B2B network. Sub-users: client companies ≤25 (each own companyInfo + verification).
- Tier letters collapse: **A=basic, B=pro**; C is removed (admin_10 → B).

## Decisions resolved (round 2)
- **D1 — Clients log in themselves.** Each client company is a real login account (reuse sub_seat infra) with its OWN companyInfo. Pro manages them; clients can also sign in.
- **D2 — Pro vouches; NO per-client verification.** Client companies inherit trust from the Pro — skip the business-email verification step for client seats.
- **D3 — Existing 8-day trials ride to expiry**, then lock. Stop issuing NEW trials only.
- **D4 — Clients ride under the Pro's single subscription** (no own billing).

## STATUS
- ✅ **Phase 0 (constants + tier collapse) — DONE & verified.**
  - roles.js: canonical `basic`/`pro`, legacy keys retained + `canonicalPlan()`, seats 3/25, role map, labels, prices, `isValidPlan` widened, `DEFAULT_ADMIN_SEAT_LIMIT`→25.
  - tierService.js + tier.js: C→B collapse; Topics Q&A + booth + 25 seats now Pro; parity test 10/10.
  - subscriptionController: plan validation accepts canonical+legacy; new codes default `pro`.
- ✅ **Migration — APPLIED** to `nexa` (`migrations/2026-06-tier-merge.js`).
  - Result: 1 standard→basic, 2 admin_5/10→pro (25 seats), 1 sub_seat→coworker. Idempotent re-run = 0. Distribution now: 33 null, 2 pro, 1 basic.
- ✅ **Phase 1 (kill 8-day trial + locked state) — DONE & verified.**
  - New `SUBSCRIPTION_STATUSES.NONE = 'none'`; `subscriptionService.initLocked()` (idempotent).
  - `authController.verifyEmail` + `subscriptionController.getMine` now call `initLocked` instead of `startTrial` — no auto-trial.
  - FE: `SubscriptionStatusBanner` shows a `none` (locked) strip; `UserSubscription` shows a locked onboarding block (code box + "Изберете план") for none/suspended/cancelled.
  - **Code-period access = full paid access** (already by design): `redeemPromo` sets status `active` (not `trial`), so `isTrial`=false and no trial gating applies. Verified: Pro code-user gets blog/interest/Topics/booth/25 seats; Basic code-user gets full Basic (fair) but not Pro-only features.
- ✅ **Phase 2 (two-tier codes) — DONE & verified.**
  - Admin mint form: **Tier selector (Pro / Basic)**; dynamic description + placeholder; "Tier" column in the codes table.
  - All promo emails tier-aware (`planLabel`/`tierWord`): `promoInvite`, `promoActivated`, `promoEndingIn3Days`, `promoEnded` say Основен/Про per code's plan; scheduler + sendInvite pass the plan through.
  - Deep-link success toast reads the redeemed plan and says the right tier.
  - DB test (throwaway): Basic code → standard_user/basic/active/30d/no admin seats; Pro code → admin_user/pro/25 seats/active; new user → locked (none, no access). 12/12.
- ✅ **Phase 3 (sub-user model — backend) — DONE & verified.**
  - `subSeatService.invite` now DERIVES seat type from the parent's role (no caller choice → exclusivity): Basic→`coworker` (shared company, max 3), Pro→`client` (own company, max 25). `seatType` stored on the doc.
  - Clients log in (role sub_seat) but are **vouched** — `isVerified: true`, no per-client verification. Co-workers inherit the parent's verified company.
  - Seat limits role-aware via `seatLimitFor` (3 / 25); `reactivate`, `listSeats`, `getSummary` updated.
  - New `requireSeatManager` middleware; `/api/admin-user/seats/*` now open to Basic + Pro (was Pro-only); `/me` stays Pro-only.
  - `inviteSchema.companyMode` now optional/ignored (back-compat). DB test 13/13: type derivation, 3/25 limits, vouched clients, exclusivity (regular rejected).
- ✅ **Phase 4 (FE Team two-mode UI) — DONE & verified.**
  - `tier.js showsSubUsers`: now true for active Basic + Pro owners (not sub-seats, not locked). Verified: active Basic/Pro→true, locked Basic→false, sub_seat→false. Surfaces the Team entry (Header already keys off `showsSubUsers`).
  - `Team.js` reads `seatType` from the API and swaps all copy: Тим/Соработник (Basic) vs Клиенти/Клиент (Pro) — header, badge noun, invite button, empty state, table column, row tag.
  - InviteModal: **dropped the companyMode shared/independent toggle** (type is derived server-side); copy adapts to client vs co-worker.
  - Backend hardening: `inviteSeat` now 402s if the owner lacks active access (locked owners can't provision seats).
  - Tier parity test still 10/10; all client files parse.

## ✅ ALL PHASES COMPLETE
Basic+Pro two-tier merge shipped end-to-end (constants, migration applied, no-trial+locked, two-tier codes, sub-user model, Team UI). Not committed — parallel agents share the repo.

---

## BACKEND

### Phase 0 — constants & tier collapse
- `server/constants/roles.js`: `PLANS = { BASIC:'basic', PRO:'pro' }` (+legacy alias map standard→basic, admin_5/admin_10→pro). `PLAN_SEATS = { basic:3, pro:25 }`. `PLAN_TO_ROLE = { basic:standard_user, pro:admin_user }`. `PLAN_LABELS` Основен/Про. Keep `isValidPlan` accepting legacy keys during migration.
- `server/services/tierService.js`: mirror `tier.js` collapse (A=basic, B=pro; C→B; C-only predicates → B). subSeatLimit basic→3, pro→25.

### Phase 1 — kill the auto-trial
- Remove `startTrial` call in `authController.js:~384` (post-verify) and the backfill in `subscriptionController.getMine`.
- New registrant: role `standard_user`, `subscription.status = 'none'` (no endsAt) → `hasFeatureAccess` false → locked. `subscriptionGuard` already 402s; ensure the "none" status routes to the locked screen (not an error).
- Keep self-subscribe (pay) path intact.

### Phase 2 — codes: two tiers
- `createCode` validation: `plan ∈ {basic, pro}` (was admin_5 only). Mint form sends the tier.
- `redeemPromo`: activate role/seats from the code's plan (basic→standard_user/3, pro→admin_user/25). Already plan-driven; just widen the enum.
- Promo reminder copy: tier-aware ("free Basic" vs "free Pro" ending). Small template param.
- Two campaign links, same mechanism: `/redeem?code=BASIC30-…` and `/redeem?code=PRO30-…`.

### Phase 3 — sub-users: co-worker vs client (the heavy part)
- Add `seatType: 'coworker' | 'client'` discriminator on sub-seat user docs.
- `subSeatService.invite`: Basic parent → `coworker` (shares parent companyInfo, ≤3, blocked from marketplace/social as today). Pro parent → `client` (own companyInfo fields required, own verification, ≤25).
- Enforce **exclusivity**: standard_user may only create coworker; admin_user may only create client. Reject cross-type.
- `requireAdminUser` → conceptually `requirePro` (unchanged behavior; admin_user = Pro).
- Seat-limit check reads new `PLAN_SEATS`.

### Phase 4 — migration script (`server/migrations/`)
- `standard` → `basic`; `admin_5`/`admin_10` → `pro` (role admin_user, superUser.seatLimit 25).
- Existing `sub_seat` docs → set `seatType:'coworker'` (today they are co-workers).
- Active trials: leave endsAt as-is (ride out); do not create new ones.
- Idempotent; dry-run flag.

---

## FRONTEND

### Tier + sidebar
- `client/src/lib/tier.js`: A=basic, B=pro; delete C branch; `subSeatLimit` 3/25; `showsTopicsQA` → B/ADMIN/preview; all `=== 'C'` checks → `'B'`.
- `Sidebar.js`: already visibility-driven — Basic shows Работа + Ресурси + fair + sourcing; Pro adds blogs/leads/topics automatically once admin_5≡pro→B.

### Sub-users (Team) page — two modes
- Basic mode: invite co-worker (email → temp password), list ≤3. (Reuses current Team UI.)
- Pro mode: create **client company** — form with company name/EDB/address + triggers client verification; list ≤25; per-client status. New UI, biggest FE piece. (Hinges on D1/D2.)

### Locked onboarding (no-code, no-pay users)
- New gate/screen on `/terminal`: "Внесете код или изберете план" with two CTAs (redeem field is gone per link-only, but a code box reappears here for the *locked* state as a fallback) → or "Избери план" (pay).
- Reuse `SubscriptionGate` modal + a dashboard empty-state.

### Codes admin
- `ManageSubscriptions` mint form: add **tier selector (Basic / Pro)**; table shows tier per code; copy-link + send-invite per tier.

### Not touched (per Q4)
- Public `/pricing`, prices, paid checkout, pro-invoices.

---

## Suggested build order (each verifiable before next)
1. Phase 0 constants + tier.js/tierService collapse (+ unit checks).
2. Phase 4 migration (run against local copy; verify role/seat/seatType mapping).
3. Phase 1 trial removal + locked state.
4. Phase 2 two-tier codes (mint selector + redeem + reminders).
5. Phase 3 sub-user seatType + exclusivity guards.
6. Phase 4 FE Team two-mode UI + locked onboarding.

## Risk notes
- Sub-seat `effectiveStatus` (parent inheritance) must keep working for BOTH seatTypes — clients inherit Pro's active/suspended state.
- `previewMode` keeps B/C surfaces visible for re-engagement; with locked-no-trial users, confirm they see the onboarding gate, not a broken empty terminal.
- Anything hard-coded to `admin_10`/C (e.g. Topics Q&A request) must move to Pro, not vanish.
</content>
