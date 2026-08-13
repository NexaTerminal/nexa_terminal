# Two-Product De-merge — Full Adoption Plan

**Goal:** nexa.mk and leads.nexa.mk behave as two distinct products end to end —
different public content, different terminal shell, different onboarding, pricing,
branding, and emails. Product A = SMB (Basic). Product B = Lawyers/Providers (Pro).

**Decisions (locked):**
- Which terminal a user sees is driven by the **login DOMAIN** (leads.* → Pro shell,
  nexa.mk → Basic shell).
- Scope this pass: **Phase A + B + C** (everything).
- Active Pro users land on a **dedicated Pro overview dashboard** (not a bare redirect).

---

## Foundational — reconciling "domain decides" with one shared account (do FIRST)

The domain drives the **shell** (nav, dashboard home, branding). The account plan still
drives **entitlement** (which gated features/actions actually work — enforced server-side).
To keep these from contradicting each other for real users, we redirect users to their
plan's canonical domain at login, so domain == plan thereafter.

- [ ] **F1** `lib/storefront.js`: add `activeProduct()` → `'A' | 'B'` (leads → B, main → A).
- [ ] **F2** `lib/tier.js`: add `planProduct(user)` (→ 'A'|'B'|'ADMIN', wraps visibleTier)
      and `canonicalHost(product)` (A → nexa.mk, B → leads.nexa.mk).
- [ ] **F3** Login-time **canonical redirect**: after auth, if `hostProduct !== planProduct`
      and not admin, redirect to the canonical host preserving the deep-link path.
      Dev-safe: skip when there is no `leads.` subdomain (localhost) — fall back to the
      existing `?storefront=` override so both shells stay testable locally.
- [ ] **F4** Switch the **shell driver** from tier to domain:
      - `config/nav.js buildSidebarSections()` → key off `activeProduct()`.
      - `Dashboard.js` "isPro" → `activeProduct() === 'B'`.
      Entitlement predicates (`can*`, `shows*`) stay tier-based. Admin isn't redirected,
      so admin previews whichever product the current domain shows (useful).

## Phase A — Stop the two products bleeding into each other

- [ ] **A1** `components/terminal/LockedWelcome.js` — make product-aware.
      Pro variant: pillars = cases from the satellite network · 3 seats/area ·
      expert visibility (Topics/blog/newsletter) · no-commitment invoice. Suppress the
      SMB free-doc / free-check hooks for Pro. Basic keeps today's panel. New CSS as needed.
- [ ] **A2** `components/seo/SEOHelmet.js` — default title/description/OG image branch on
      `getStorefront()` (leads → "Nexa за правници…" + leads OG/URL). Explicit props still win.
- [ ] **A3** Product-tag inquiries/contact. Client sends `storefront` on submit; server
      stores it on the inquiry/lead doc so admin + routing can see the origin product.
      Files: contact/inquiry page + inquiry controller/model.

## Phase B — A real Pro home (cockpit, not a bounce)

- [ ] **B1** New `pages/terminal/ProHome.js` (+ `.module.css`): claimable-leads count,
      open Topics to answer, marketing/blog status, quick actions. Reuse existing
      endpoints (leads inbox, topics, marketing-hub) — no new backend if avoidable.
- [ ] **B2** `Dashboard.js`: product B + active + not-locked → render `<ProHome/>`
      (replace the `<Navigate to="/terminal/admin-user/leads">`). Basic → current home.
      Locked → per-product `LockedWelcome` (from A1).

## Phase C — Product-level branding polish

- [ ] **C1** `components/common/Header.js` — wordmark + accent per product
      ("Nexa" vs "Nexa за правници"), keyed off `activeProduct()`.
- [ ] **C2** Branded transactional emails per product (welcome, trial/subscription
      reminders) keyed off the user's plan. Files: `services/emailService.js` + templates
      + the trial-reminder service. A lawyer never receives SMB copy and vice versa.
- [ ] **C3** (Optional) Footer / blog audience framing per storefront.

## Verification

- [ ] `cd client && npm run build` clean.
- [ ] Manual matrix: Basic@nexa.mk, Pro@leads.mk, mismatch → redirect, admin on both
      domains, locked account on both funnels.
- [ ] Server leadRouting tests still 12/12.
- [ ] Nothing committed until the whole set is verified (per multi-agent push rule).

## Review — implemented (uncommitted)

**Foundational**
- `lib/storefront.js`: `activeProduct()`, `CANONICAL_HOSTS`, `canonicalHost()`,
  `canonicalRedirectTarget()` (prod-host only; no-ops on localhost/preview).
- `lib/tier.js` + `server/services/tierService.js`: `planProduct(user)` (A|B|ADMIN).
- `components/common/PrivateRoute.js`: login-time canonical redirect for non-admins
  whose plan ≠ current domain (full-page, prod only).
- `config/nav.js`: `buildSidebarSections()` now keyed off `activeProduct()` (domain),
  not tier. Entitlement predicates unchanged.

**Phase A**
- `components/terminal/LockedWelcome.js`: PILLARS_A/PILLARS_B, Pro header copy,
  SMB free-doc/free-check hooks suppressed for Pro.
- `components/seo/SEOHelmet.js`: per-storefront default title / og:site_name.
- `pages/website/Contact.js`: stamps `storefront` on inbound payload.

**Phase B**
- `pages/terminal/ProHome.js` + `.module.css`: Pro cockpit (available leads /
  active cases / open topics counts + quick actions).
- `pages/terminal/Dashboard.js`: domain B + active → `<ProHome/>`; removed the
  bare redirect; locked → per-product LockedWelcome.

**Phase C**
- `components/common/Header.js` + `.module.css`: "за правници" brand badge on B.
- `emails/trialReminderEmail.js` + `services/trialReminderService.js`: product-aware
  brand name + leads host in the conversion reminder.

**Verification**
- `client` production build: Compiled successfully (+2.2 kB main).
- Changed server files pass `node --check`; leadRouting suite 12/12.
- NOT committed (multi-agent push rule).

**Follow-ups / notes**
- Verification & credit lifecycle emails left product-neutral (they gate on company
  verification, not plan) — intentional, low value to brand.
- Manual matrix still to run on real hosts once deployed (localhost uses
  `?storefront=leads` to preview the B shell; the canonical redirect is inert there).
</content>
</invoke>
