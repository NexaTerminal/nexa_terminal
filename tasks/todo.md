# Promo codes + redeem deep link + CTA email

Grant **Full Pro (admin_5) for 30 days at €0** via redeemable sales codes.
Multi-use with a redemption cap + expiry; one redemption per user.
Hard-coded reusable deep link `/redeem?code=CODE` sent via email CTA.

## Backend
- [x] `_activate()` extracted from `approve()` in subscriptionService (shared activation)
- [x] `paidVia` stored on `user.subscription` (enables promo-aware reminder suppression)
- [x] `redeemPromo()` on subscriptionService (blocks double-dip on active paid plan)
- [x] `promoCodeService.js` — promo_codes collection: create / list / deactivate / atomic claim
- [x] Reminder suppression for `paidVia === 'promo'` in computeDueReminder
- [x] Controller: `redeemCode` (user) + admin `listCodes / createCode / deactivateCode / sendInvite`
- [x] Routes: user `POST /redeem-code`; admin `/codes` GET/POST, `/codes/:code/deactivate`, `/codes/send-invite`
- [x] Wire PromoCodeService in server.js
- [x] Email templates: `promoInvite` (CTA) + `promoActivated` (confirmation)

## Frontend
- [x] Redeem field on UserSubscription.js (+ post-redeem flash)
- [x] Promo Codes admin panel in ManageSubscriptions.js (mint, list, copy link, send invite)
- [x] Public `/redeem?code=` route + PromoRedeemWatcher (auto-apply post-auth)

## Follow-up (round 2)
- [x] Promo conversion reminders: `promo-3d` + `promo-expired` in computeDueReminder
      (replaces blanket suppression); scheduler suspends on promo-expired
- [x] Email templates `promoEndingIn3Days` + `promoEnded` (CTA → /pricing)
- [x] "Promo" badge in admin Active tab (reads sub.paidVia==='promo')

## Follow-up (round 3 — link-only)
- [x] Removed manual code field from UserSubscription (kept auto-redeem result banner)
- [x] Added one-click "Продолжи со Google" button on /redeem (lowest-friction path)
- [x] End-to-end test (throwaway local DB): 25/25 checks pass — redeem, single-use,
      cap, expiry, deactivation, day-27 nudge, day-30 suspend, no-stacking, paid-unaffected

## Verify
- [x] Backend: `node --check` all files pass; modules load; templates render correct hard-coded link
- [x] Frontend: babel parse-check passes for all changed/new files
- [x] E2E lifecycle proven against real Mongo (local test DB, dropped after)
- [ ] Optional: live browser click-through (needs dev server — not run to avoid disrupting sessions)

## Review
- Promo = "approve without payment, user-triggered". `approve()` and `redeemPromo()`
  share one `_activate()` so they can't drift; promo passes `amountEur:0`,
  `paidVia:'promo'`, history note `promo:<CODE>`.
- Abuse controls all in `promoCodeService.claim()`: single-use/user, global cap,
  expiry, active flag — cap+single-use enforced atomically (race-safe last slot).
  `redeemPromo` additionally blocks stacking onto a live *paid* plan.
- One hard-coded reusable link type: `${PORTAL_URL}/redeem?code=CODE`. Admin panel
  shows it to copy AND can app-send the `promoInvite` CTA email. Deep link
  auto-applies post-auth via `PromoRedeemWatcher` (works for every auth path).
- Promo periods expire at day 30 via the existing request-time guard; promo-aware
  reminder suppression avoids the wrong "renew your subscription" emails.
- NOT committed (parallel agents share this repo — awaiting all-clear).
</content>

---

# Mobile optimization — public website

Goal: make the public website (`.nexa-public` scope) look better and feel more
optimized on phones, without touching the authenticated terminal app. Minimal,
token-driven changes that build on the existing `brand.css` design system.

## Scope (files)
- `client/src/styles/website/brand.css` — global mobile refinements
- `client/src/components/website/PublicNavbarV2.{js,module.css}` — mobile menu polish
- `client/src/pages/website/Home.module.css` — hero/CTA stacking, decorative stacks
- `client/src/pages/website/Pricing.module.css` — toggle/card spacing on small screens

## Tasks

### 1. Global (brand.css)
- [ ] `overflow-x: clip` guard on `.nexa-public` (decorative orbs / mock-card
      stacks can never cause horizontal scroll).
- [ ] Tighten container gutters on small phones: `.nexa-container` / `-narrow`
      padding → 16px at `max-width: 480px`.
- [ ] Bump form control font-size to 16px at `max-width: 768px` to stop iOS
      auto-zoom on focus (currently 15px).
- [ ] Add `.nexa-btn-block` helper (full-width button) for mobile CTA rows.

### 2. Navbar mobile menu
- [ ] Animate open/close (max-height + opacity) instead of hard show/hide.
- [ ] Animate hamburger lines into an "X" when open.
- [ ] Larger tap targets (rows ≥44px), divider before login button.
- [ ] Surface MK/EN language switch inside the open mobile menu.

### 3. Home
- [ ] Stack hero CTAs full-width on ≤480px (`.heroCtas`, `.ctaButtons`).
- [ ] Constrain decorative mock stacks (`finalVisual`, `topicsCardStack`) so
      rotated cards stay inside the viewport; reduce reserved height on phones.

### 4. Pricing
- [ ] Ensure billing/currency toggles wrap cleanly and stay tappable on narrow
      screens.

## Verification
- [x] `cd client && CI=false react-scripts build` — compiles clean (CSS +268 B,
      JS +59 B), no new errors.
- [x] Reasoning pass at 360 / 390 / 768px: `overflow-x: clip` removes horizontal
      scroll risk; CTAs/menu rows ≥44–48px; 16px inputs stop iOS zoom.

## Review
- All changes scoped to `.nexa-public` / website CSS modules — terminal app untouched.
- brand.css: overflow-x guard, 16px gutters @≤480px, 16px inputs @≤768px,
  `.nexa-btn-block` helper.
- Navbar: animated dropdown panel (opacity/transform), hamburger→X, ≥48px rows,
  language switch + full-width login moved into the mobile menu; cramped top-bar
  lang switch hidden <960px.
- Home: hero + final CTAs stack full-width @≤480px.
- Pricing: already responsive (toggles wrap, cards stack @720px) — no change.
- NOT committed (parallel agents share this repo — awaiting all-clear).

---

# Mobile optimization — phase 2 (remaining public pages)

## Findings
- Blog / BlogPost / Login already have thorough responsive CSS (480/768/1024
  breakpoints, grids → 1fr, 16px inputs, 44px targets, layout reorder). No change.
- Real weak spot: the 5 SEO "legal landing" pages (/corporate, /employment,
  /residence, /trademark, /topics) were built with pure inline styles (no media
  queries possible), dated SimpleNavbar — fixed 40–48px headings + 8rem/2rem
  padding on phones, and a `minmax(300px)` grid that overflows <320px.

## Done
- [x] New shared `client/src/styles/website/LegalLandingPage.module.css` —
      responsive container/typography/cards/FAQ/CTA + Topics grid; mobile
      breakpoints @768/@480; `minmax(min(100%,300px),1fr)` overflow fix.
- [x] Refactored all 5 pages off inline styles onto the module (also removes the
      bulk of their inline styles per CLAUDE.md).
- [x] `react-scripts build` compiles clean; verified new rules present in the
      built CSS bundle.

## Not done (out of scope unless asked)
- Full inline-style purge across all website pages (Home still uses a few
  intentional dynamic inline styles, e.g. reveal transition-delay, progress width).

---

# Login / Signup redesign — minimal single card (mobile-first)

User picked: one centered card on a subtle aurora gradient, same on mobile &
desktop (no side panel). Keep all existing auth logic.

## Constraints
- `Login.module.css` is SHARED by ForgotPassword.js + ResetPassword.js → do NOT
  rewrite it. New Login gets its own `Auth.module.css`; Login.js stops importing
  the old module. Forgot/Reset untouched.

## Tasks
- [ ] New `client/src/styles/website/Auth.module.css` — brand `--nx-*` tokens,
      centered card, aurora bg, segmented Login/Signup toggle, Google-first,
      48px inputs/16px font, show/hide password, slim footer, verification step.
- [ ] Rewrite `Login.js` JSX to the single-card layout; keep handlers (login,
      registerSimple, verifyEmailCode, resend, Google OAuth, trial, strength).
- [ ] Google OAuth above the form; segmented toggle replaces bottom text switch.
- [ ] Add show/hide password toggle.
- [ ] Remove dead code: SimpleNavbar, unused Header/Footer imports, i18n import,
      TypewriterFeatures, commented blocks, empty `t('')` heading.
- [x] VerificationForm → module classes (no inline styles).
- [x] `react-scripts build` — Compiled successfully, no warnings.

## Review
- New `Auth.module.css` (single centered card on aurora bg, --nx tokens with
  fallbacks). `Login.js` rewritten: logo + title + segmented Login/Signup toggle
  + trial pill (signup) + Google-first + divider + form with show/hide password
  + slim legal footer. Verification step restyled (no inline styles).
- All auth logic preserved: loginWithUsername, registerSimple, verifyEmailCode,
  resendVerificationCode, Google OAuth (+redirect state), password strength,
  forgot-password link, redirect-if-logged-in.
- Removed: SimpleNavbar, unused Header/Footer imports, i18n import,
  TypewriterFeatures, all commented dead blocks, the empty `t('')` heading.
- `Login.module.css` left untouched → ForgotPassword/ResetPassword unchanged
  (still compile; same split layout as before).
- Same layout mobile + desktop (max-width 440px card, centered).
- NOT committed (parallel agents share this repo — awaiting all-clear).

## Possible follow-up
- Modernize ForgotPassword + ResetPassword to match (they can adopt Auth.module.css).

