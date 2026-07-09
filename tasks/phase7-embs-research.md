# Phase 7.1 — ЕМБС/ЕДБ autofill research spike (findings)

_Date: 2026-07 · Master-plan Phase 7.1 · Status: RESEARCHED — decision needed from Martin_

## Question
Can we autofill a new user's company data (name, address, legal form) from the
Central Register by ЕМБС/ЕДБ, to collapse onboarding friction and create the
"type your number → first document in 60s" wow moment?

## Findings

**Identifiers**
- **ЕМБС** = 7-digit unique registration number, assigned by the Central Register
  (Централен регистар, crm.com.mk). Legal identifier — the key into company data.
- **ЕДБ** = 13-digit tax number, issued by УЈП (Public Revenue Office). Different system.
- For autofill, **ЕМБС is the lookup key** into CRM's registered-subject data.

**Data availability — YES, basic data is public & free**
- CRM runs a **free public web lookup** of basic company profiles
  (crm.com.mk → „основен профил на регистриран субјект"): search by ЕМБС or partial
  name → returns ЕМБС, name, legal form, founding date, status (active/liquidation/
  bankruptcy/deleted), **address**, and activity (code + description). No login, no fee.
- Backed by an **Open Government Partnership commitment** (ovp.gov.mk) to keep this
  basic data freely and publicly accessible — so availability is politically durable.

**API availability — no OFFICIAL documented free API**
- The public service is a **web UI**, not a documented API. No public API docs, no
  „дистрибуција на податоци" self-serve endpoint on the free tier.
- BUT the portal front-end is backed by `crm.com.mk/CRMPublicPortalApi/api/...`
  (visible in indexed URLs) — i.e. there is an **unofficial JSON endpoint** the site
  itself calls, which could be used server-side. Fragile/unsupported: could change
  without notice; ToS/legality of programmatic use must be confirmed.

**Paid / robust paths (exist, cost money)**
- CRM's official **„дистрибуција на податоци"** (data-distribution service — contract/paid).
- Commercial resellers already expose MK company data via API: **VATify.eu** (JSON API),
  **Dotfile**, companywall.com.mk. Monthly cost. Overkill pre-revenue.

## Recommendation (v1)

Given no paying users yet and cost sensitivity ([[no-paying-users-yet]]), **do not buy
a paid API now.** Two viable paths — Martin to choose:

- **Option A — light best-effort autofill (recommended if ToS is comfortable):**
  server-side call to the CRM public-portal endpoint by ЕМБС on profile completion →
  prefill companyName / address / legalForm (always user-editable; degrade silently if
  the endpoint is down/changed). Needs a ~½-day spike to confirm the endpoint shape +
  a quick ToS/legality read (public transparency data → likely low risk, but confirm
  no prohibition on programmatic access).
- **Option B — safe fallback (zero external dependency):** skip autofill; shrink the
  manual company-profile form to the 4 required fields (companyName, address, taxNumber,
  manager) so onboarding is fast anyway. Revisit a paid provider once there's revenue.

**Blocked on Martin:** (1) comfort with reverse-engineering the public CRM endpoint
(Option A) vs (2) prefer the manual-form shrink now (Option B). Everything else in
Phase 7 waits on this call.
