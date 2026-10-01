# Nexa — Product & Marketing Master Document

> This single document merges the two former briefs — the **Product & Business Overview**
> (architecture, features, pricing, roles, tech) and the **Marketing Concept Brief** (positioning,
> funnel, messaging, campaign constraints). Nothing was dropped in the merge; both are preserved in
> full below. Part I is the engineering/product snapshot; Part II is the go-to-market/marketing brief.
> Where the two overlap (e.g. pricing, feature lists), Part I is the technical source of truth and
> Part II is the marketing framing.
>
> Last merged: 2026-09-30.

---

# PART I — Product & Business Overview

# Nexa — Product & Business Overview

> A complete snapshot of the Nexa ecosystem as it stands today: business model, product surface, technical architecture, pricing, user roles, marketing channels, and the satellite-site network. Intended as a context briefing for AI tools, advisors, and stakeholders.

---

## 1. The one-paragraph pitch

Nexa is a **two-sided business operations ecosystem for small and medium firms in North Macedonia**. The core product is **Nexa Terminal** — a SaaS platform that automates legal documents, runs a broad suite of compliance health checks, provides AI legal/marketing assistance, analyzes contracts, and manages HR and contract registries. Around the Terminal, Nexa operates a network of **SEO + GEO optimized satellite sites** that attract real prospects in specific legal and business niches, then route those inbound leads to **Pro** subscribers (service providers). A public compliance teaser — **/proverka** — pulls cold prospects into the funnel, and an expert Q&A surface — **Topics** — lets Pro members publish authority-building content that Google and AI assistants surface back to potential clients.

The two-sided model:
- **Basic** = the *demand* side — SMBs using the Terminal's tools to run their own operations.
- **Pro** = the *supply* side — lawyers, accountants, and consultants who get client leads, a network presence, and the ability to manage their own clients as sub-accounts.

The homepage tells this as a 3-act story:
1. **Part 1 — We bring clients to you** (satellite sites + lead routing)
2. **Part 2 — We make you visible as an expert** (Topics + newsletter + blog)
3. **Part 3 — Automate your operations** (the Terminal)

---

## 2. Pricing model

All prices in **EUR** (Nexa 3.1). Each tier is sold on **two cycles — monthly + annual** (annual ≈ 2 months free), and **prices are now shown publicly** on `/pricing` as well as in the terminal buy flow (the SubscriptionGate). Quarterly is retained in code for back-compat only. The issuer is not VAT-liable, so the shown price is final; payment is by manual bank transfer against a pro-forma invoice. MKD is shown for reference at ~61.5.

| Plan | Monthly | Annual (≈2 mo free) | Audience |
|---|---:|---:|---|
| **Основен** (Basic) | **€15 / mo** | **€149 / year** | SMBs (demand side) |
| **Про** (Pro) | **€39 / mo** | **€390 / year** | Service providers (supply side) |

Public pages now show the price and drive to signup; the same numbers surface in-app at checkout.

### What each plan includes

**Основен / Basic** — all Terminal tools for one company:
- Automated document templates (employment, contracts, health & safety, personal data, accounting, central register, and more)
- **My Templates** — upload your own `.docx`, mark placeholders, and automate it
- Legal AI assistant · Marketing AI assistant · Contract analysis
- Personal AI preferences (tone & style / "stance")
- Legal, marketing, HR, and cybersecurity compliance checks
- **Request for offers** — source quotes from providers (Sourcing)
- 1 blog post / month on the Nexa blog, published under the user's name
- Newsletter banner reaching 1000+ subscribers — once per quarter
- Virtual Fair · Courses & learning resources
- Up to **3 co-worker seats** in the company

**Про / Pro** — everything in Basic, plus:
- Up to **25 client sub-accounts** — manage clients under one subscription
- **Cases (leads)** sourced via the satellite sites
- Virtual Fair booth with the provider's products/services
- 2 blog posts per month (instead of 1)
- **Topics Q&A** — expert answers to public questions
- **Request for offers (tender side)** — respond to client requests
- Editorial spot in the monthly newsletter for accepted blog posts

### Onboarding & subscription lifecycle (8-day free window + code-first)

A brand-new signup is granted an **8-day free full-access window** (`initTrial`, `TRIAL_DAYS = 8`) to the product for its storefront's plan. When the window lapses the account **auto-suspends** (data preserved) and returns to a preview/locked state until the user subscribes or redeems a code. Outbound promo codes still run in parallel.

```
register ──► 8-day free window (active, paidVia:'promo', trial:true)
   │                     │
   │                     └─(8 days lapse)─► suspended/locked (preview) ──┐
   │                                                                      │
   ├──► redeem promo code (/redeem) ─────────► active (€0, time-boxed) ───┤
   └──► pick a plan → pro-forma invoice → bank transfer → active (paid) ──┘
```

- **Free window**: `initTrial` fires after Google signup and after email verification, activating the plan at €0 with `paidVia:'promo'` + `subscription.trial:true`, `endsAt ≈ now + 8d`. One per email.
- **Code-first acquisition**: outbound sales issue per-prospect **promo codes** (typically a time-boxed Pro grant). A prospect redeems at `/redeem?code=…`, which activates the plan at €0 with `paidVia: 'promo'`. Google OAuth sign-in is wired (`/auth/callback`, `/auth/success`).
- **Paid path**: the user picks a plan; the Terminal issues a **pro-forma invoice** by email; payment is by **manual bank transfer** (no card processing). On confirmed payment the platform admin approves and the account goes active.
- **One-time 3-day grace**: the first time a locked/expired user shows intent (requests an invoice) without having paid, a race-safe 3-day grace window is auto-granted so access isn't interrupted while payment is in transit.
- **Expiration → suspended**: when `endsAt` passes, the account is suspended. The user can still navigate the Terminal (data preserved) but feature endpoints return **HTTP 402**, which the React client catches to open the in-Terminal **SubscriptionGate** modal.
- A daily cron sends bilingual MK/EN reminder emails (paid renewal at −14d / −3d / on expiry; promo expiry at −3d / on expiry).

### Server-side pricing source of truth

Defined in `server/constants/roles.js`. Canonical two-tier model with legacy keys retained for back-compat:

```js
const PLANS  = { BASIC: 'basic', PRO: 'pro' };
const PLAN_PRICES = {
  basic: { monthly: 15, quarterly: 40,  annual: 149 },  // €15/mo · €149/yr (marketed)
  pro:   { monthly: 39, quarterly: 105, annual: 390 }   // €39/mo · €390/yr (marketed)
};
const PLAN_SEATS = { basic: 3, pro: 25 };
const PLAN_TO_ROLE = { basic: 'standard_user', pro: 'admin_user' };
const PLAN_CURRENCY = 'EUR';
const TRIAL_DAYS = 8;  // 8-day free window granted at signup
```

`canonicalPlan()` normalizes legacy keys (`standard`→`basic`; `admin_5`/`admin_10`→`pro`). Prices are the source of truth here and flow to the pro-forma-invoice + offer PDFs (EUR + MKD) automatically; **hand-synced duplicates** live in `client/src/components/terminal/SubscriptionGate.js`, `client/src/pages/website/Pricing.js`, and `server/emails/subscriptionEmails.js` (keep all three in sync on any change).

---

## 3. User roles

| Role | Description | How they get it |
|---|---|---|
| `regular` | Registered, locked, no plan yet (edge/legacy). | Self-registration, pre-activation. |
| `standard_user` | **Basic** subscriber. One company, up to 3 co-worker seats. | Registration + Basic activation (code or paid). |
| `admin_user` | **Pro** subscriber. Service provider; up to 25 client sub-accounts. | Registration with `intendedPlan: 'pro'` + activation. |
| `sub_seat` | Created by a Basic co-worker slot or a Pro client account. Uses the Terminal under the parent's subscription pool. | Invited via the parent's Team page. |
| `admin` | Platform operator (Martin). Bypasses all gating. | Set manually in DB. |

### Sub-seat / client-account invitation flow

The parent user goes to `/terminal/team` and creates a seat. The form requires an email (becomes the lowercased username), optional name, and a **company mode** (must be explicitly chosen):
- **Shared** — the sub-seat uses the parent's `companyInfo`; profile updates propagate automatically. For a single company adding internal co-workers (the Basic pattern).
- **Independent** — the sub-seat fills in their own company info via the CompanyInfoPrompt modal on first visit. For the Pro pattern where one provider provisions standalone tenants for different end clients.

The backend (`subSeatService.invite`):
- Generates a memorable temp password, hashes with bcrypt, creates the user with `mustChangePassword: true`, `role: 'sub_seat'`, `parentSuperUserId: parent._id`
- Returns the **plaintext temp password** once (shown on a credentials card with copy buttons)

Sub-seats: case-insensitive username lookup; forced password change on first login (`PrivateRoute` → `/terminal/change-password`); credits debited from the **parent's** pool (`resolveCreditBearerId`); access gated transitively through the parent's effective subscription status.

---

## 4. The Terminal — feature inventory

`https://nexa.mk/terminal/*` — Macedonian-only interior (the public site is bilingual MK/EN).

### Dashboard (`/terminal`, `/terminal/dashboard`)

Sidebar + main content. Quick-action launcher (Templates · Checks · AI tools), a category filter bar, and a blog/news feed with reactions.

### Document automation

- **45+ DOCX templates** across categories: **employment** (contracts, annexes, terminations of many kinds, bonuses, disciplinary actions, leave decisions, organization act…), **contracts** (NDA, loan, rent, SaaS, services, mediation, debt assumption…), **obligations** (vehicle sale-purchase…), **personal data protection** (consent, GDPR company politics, data-protection policy, estimation procedure, rulebook, privacy policy), **accounting** (annual accounts adoption, dividend payment, cash-register maximum, invoice-signing authorization, write-off), **central register** (company **formation**/incorporation packs and **company changes** — multi-document `.docx` bundles), **health & safety**, and **other** (master services agreement, employee stock purchase plan, warning before lawsuit).
- Each template = a React form + a `docxtemplater` template + a controller in `server/controllers/autoDocuments/`.
- All documents pull company data from `user.companyInfo` (or the parent's for shared sub-seats). 13-digit EMBG/PIN validation per Macedonian standard.
- **My Templates** (`/terminal/my-templates`) — upload a `.docx`, mark placeholder fields, then fill / bulk-generate / edit / view history from your own forms. A **Template Marketplace** (`/terminal/template-marketplace`) surfaces shareable templates.

### AI assistants

- **Правен AI** (`/terminal/ai-chat`) — legal Q&A over a Macedonian legal corpus (RAG). Renders Markdown; adaptive structured legal format.
- **Маркетинг AI** (`/terminal/marketing-ai`) — marketing strategy and content.
- **Анализа на договор** (`/terminal/contract-analysis`) — uploads a `.docx` contract, extracts legal + commercial risks, termination clauses, penalties, licenses, and liability (commercial rating badge).
- **AI Stance / preferences** (`/terminal/ai/stance`) — personal tone & style preferences applied to AI output.

### Compliance health checks — the LHC platform (`/terminal/legal-screening/*` + others)

A large, structured questionnaire-and-report platform built on a **shared scoring engine** (`server/controllers/lhc/lhcScoring.js` + `lhcShared.js`) using a fraction model, four maturity bands, and critical gates. Modules:

**Legal (LHC) — `/terminal/legal-screening/*`:**
- **Employment** — full check plus 4 sub-modules (**Part 1–4**, the "Employment-Parts" pattern)
- **GDPR / data protection** — rebuilt to a/b/c/d maturity with profiling + critical gates
- **General** — cross-topic pool that consumes the module results
- **Health & Safety**
- **Archives** (archiving obligations)
- **Protection & Rescue**
- **Waste Management**
- **Tax compliance** — 4 sub-modules: **General**, **Payroll**, **Profit**, **VAT**

**Other checks (own routes):**
- **HR & operational** — `/terminal/hr-screening` (module `hhc`)
- **Marketing** — `/terminal/marketing-screening` (module `mhc`)
- **Cybersecurity** — `/terminal/cyber-screening` (module `chc`)

Each check produces a prioritized, banded compliance report at `.../report/:id`.

### Човечки ресурси — HR section

A dedicated sidebar section grouping three people-tools:

- **Вработени** (`/terminal/employees`) — an employee registry (clones the contracts pattern): list, create, detail, and edit employees. Provides **computed leave balances** and a daily **reminder cron** (e.g. contract/leave events). Employee data can prefill document generation.
- **Проценка на карактер** (`/terminal/karakter`, public `/karakter/:token`) — a **Big Five (OCEAN) personality assessment** an SMB sends to a candidate/employee. The owner creates a named assessment and shares a link (or emails it); the respondent answers **33 bipolar, one-trait-per-item questions** (with reverse-keyed items to cancel acquiescence bias); scoring is strictly server-side (`server/data/characterAssessmentQuestions.js`). The owner sees a **visual report** (SVG radar pentagon + trait bars + a ranked, second-person "how it shows up" narrative), and the **employee is emailed their own results** (auto to the invited address + an opt-in on the thank-you screen). The respondent only ever sees a thank-you on screen.
- **Интервјуа** (`/terminal/interviews/scan`, `/terminal/interviews/exit`) — a two-child nav group for **qualitative** interviews (distinct from the scored character assessment): **Интервју скен** (candidate soft-skill screen) and **Излезно интервју** (departing-employee exit interview). The owner gets **editable suggested questions** (behavioral/character bank biased by `companyInfo.industry` + role, capped 10–15; each question toggles **text** or **1–5 rating**; add/remove/reorder), can **save a reusable default template per type** (`hr_interview_templates`), then shares a link or emails it. The respondent answers on a public page (`/interview/:token`, mixed free-text + ratings, honeypot + idempotent submit); on completion the owner sees a **transcript + best-effort AI summary** (soft-skill signals for scan, retention themes for exit) and is emailed the results. Server-side scoring/summary only; `hr_interviews` collection, `module: 'interview_v1'`. Basic + Pro via `subscriptionGuard`.
- **Работни односи** — a deep-link shortcut into the labour-law document category (`/terminal/documents?cat=labourLaw`).

### Contracts registry (`/terminal/contracts`)

A registry of the company's contracts (list / new / detail / edit) with a **contract-reminder scheduler** for renewal/expiry dates.

### Marketing

- **Marketing** (`/terminal/marketing`) and **Marketing Hub** (`/terminal/marketing-hub`) — marketing tooling and content surface
- **Marketing performance report** (`/terminal/marketing/performance-report`)

### Ecosystem / two-sided features

- **Sourcing — Request for offers** (`/terminal/sourcing`) — SMBs request quotes; providers respond (offer-requests).
- **Регистар на набавки — Procurement Register** (`/terminal/nabavki`) — a demand-side companion to Sourcing, organized by **type of purchase** (insurance, hosting, accounting…). The SMB logs the offers it receives per need (supplier · price · terms · valid-until), the cheapest is auto-flagged, one is marked chosen, and a **renewal date** triggers a daily re-quote reminder email (`procurementReminderScheduler`, 11:00 Europe/Skopje) that links back to Sourcing. Backed by `procurementRegisterController` + `procurement_register` collection.
- **„Проверен работодавач" — Verified-Employer badge** — a public employer maturity check at `/proverka-rabotodavac` → **A / A+ / A++** rating → sign up to claim a shareable **circular seal** (dynamic SVG) at `/badge/:token`; members re-open/re-share it from **„Мојата значка"** (`/terminal/moja-znachka`), with a micro-seal on the header profile button. A jobseeker-facing badge that doubles as a non-user acquisition funnel (`publicEmployerBadge.js` + `badgeService.js`).
- **Find a lawyer** (`/terminal/find-lawyer`) — directory into the provider network.
- **Virtual Fair** (`/terminal/fair`, `/terminal/fair/:id`) — booths with provider products/services; admin moderation.
- **Investments** (`/terminal/investments`) — investment listings/detail.
- **Sales funnel** (`/terminal/sales`) — provider sales pipeline.
- **Blog publishing** — submit (`/terminal/blogs/submit`), my submissions, published, with admin moderation of pending submissions.
- **Topics Q&A** (`/terminal/topics-qa`) — Pro members answer public questions; admin worklist assigns/curates.
- **Newsletter ad booking** (`NewsletterAdBooking`) — banner slots in the Nexa newsletter (3 slots/month, 1 booking/quarter, image upload + optional link). Surfaced to **Basic** via a dedicated **„Банер во билтенот"** nav item in Маркетинг и раст (`/terminal/marketing-hub?tab=banner`); `MarketingHub` hides the Блог tab for tier A so Basic gets banner-only, while Pro reaches the same hub through „Блог". Backend is tier-agnostic (any active subscriber) behind `subscriptionGuard`; gated by the `newsletterAds` feature flag.
- **Credits / Billing / Subscription** (`/terminal/credits`, `/terminal/billing`, `/terminal/subscription`).

### Pro-user features (`/terminal/admin-user/*`)

Visible to `role: 'admin_user'` (Pro):
- **Dashboard** — seat usage, recent leads, subscription state
- **Leads inbox / Inquiry Board** (`/terminal/admin-user/leads`, `ProHome.js`) — the canonical **tag-and-express-interest** board. Multi-vertical: shows inquiries matching the provider's practice area(s) + city, with a per-member **procedure hint** (only the viewer's matched categories from procedure templates — immigration / company_formation / property_purchase). Providers express interest via `ExpressInterestModal` (with a profession picker, no longer lawyer-hardcoded). Legacy first-to-claim lead routing (`unclaimed → offered → claimed | dismissed`) still underpins satellite-site leads.
- **Team** (`/terminal/team`) — sub-seat / client-account management

### Platform admin features (`/terminal/admin/*`)

Visible to `role: 'admin'` (Martin). Grouped in the sidebar:
- **Blogs** — manage, add, edit, pending submissions
- **Users** — all users, subscriptions, **Pro invoices**, **invited prospects**
- **Marketplace** — leads, service providers, offer requests, inquiries
- **Topics** — submissions + worklist curation
- **Content ops** — updates, newsletter ad bookings, Fair moderation, **Proverka funnel** (share-link builder + per-source analytics)
- **Chatbot management**

### Education

`/terminal/education` — course library with category filter and lesson pages (`/course/:id/lesson/:id`).

---

## 5. The satellite sites & public funnel (Nexa ecosystem)

SEO + GEO optimized properties that (a) provide independent value to searchers and (b) generate leads routed to Pro members. Public-facing landing/entry routes on the main site include `/ecosystem`, `/corporate`, `/employment`, `/residence`, `/trademark`, `/smetkovoditeli` (accountants), `/topics`, and the compliance funnel `/proverka`.

### Practice-area routing enum

`PRACTICE_AREAS` in `roles.js`: `consumer-legal`, `immigration`, `citizenship`, `company-registration`, `ip-law`, `tax-accounting`, `labor-law`, `general-legal`, plus **non-legal provider verticals** `real-estate`, `insurance`, `consulting` — so Pro is no longer lawyers-only. New Pro signups pick a provider type in onboarding, which maps to a practice area and seeds `superUser.practiceAreas` for immediate board matching.

### The satellite properties

- **`samodaprasham.mk`** — citizen legal questions (inheritance, divorce, criminal defense, property, employment). Long-tail Google intent; routes to the matching practice area.
- **`immigration.mk`** — residence permits for foreigners. High commercial intent, often urgent.
- **`macedoniancitizenship.mk`** — diaspora & descendants seeking citizenship. Long-cycle, high-ticket case work.
- **`company.nexa.mk`** — company registration (ДОО/ДООЕЛ/АД, Central Registry, ownership changes, branches). Pairs the lead with a lawyer + accountant.
- **`tax.nexa.mk`** — accounting / tax niche; routes to `tax-accounting` providers.
- **`iplaw.nexa.mk`** — intellectual property (trademarks, patents, copyright, licensing). Lower volume, high value.
- **`osiguran.nexa.mk`** — insurance niche (added mid-2026); routes to `insurance` providers.
- **`properties.nexa.mk`** — real-estate / недвижности niche (added Sept 2026); routes to `real-estate` providers.
- **`topics.nexa.mk`** — the public Topics Q&A property (expert answers, SEO/GEO surface).

> Satellite sites are hardcoded across several files and copy strings (`EcosystemMap.js`, `PublicFooterV2.js`, `schemaGraph.js` sameAs, `LeadsHome.js` case sources, `Leads.js` `CASE_SOURCES`, website `mk/en` locales); grep `iplaw` / satellite domains to find every reference before adding a new one.

### /proverka — public compliance teaser

A public, Google-first funnel: 15 shuffled cross-topic compliance questions give a prospect a teaser of their compliance posture, optionally capturing an email, then pulling them toward registration. Admins build per-source share links and track a per-source funnel.

### Why this works (SEO + GEO)

- Optimized for classic Google search (clean URLs, structured data, fast pages, expert-authored content) **and** for AI assistants (GEO): FAQ schema, `llms.txt`, direct factual answers.
- Content is written or reviewed by licensed professionals — a positioning + compliance choice. Nexa makes **no "checked by a lawyer" guarantees** in product copy.

---

## 6. Topics — expert Q&A

Topics is the "make providers visible as experts" surface. Pro members answer public questions **inside the Terminal** (`/terminal/topics-qa`, `/terminal/topics-qa/answer/:id`); an admin **worklist** (`/terminal/admin/topics/worklist`) and **submissions** review (`/terminal/admin/topics/submissions`) curate and publish. Public Topics content (`/topics`) is SEO + GEO optimized so Google and AI assistants surface and cite the answers, driving direct outreach to the answering provider.

---

## 7. Marketing channels for Pro members

Pro buys distribution, not just seats:
1. **Lead routing** — inbound satellite-site contact forms route by practice + city; first Pro to claim wins.
2. **Topics Q&A publishing** — expert answers, SEO + AI-assistant indexing.
3. **Monthly newsletter** — editorial spot for accepted blog posts + bookable banner slots (1000+ subscribers).
4. **Blog** — up to 2 posts/month under the provider's name (Basic gets 1).
5. **Virtual Fair booth** — products/services showcase.
6. **Satellite/directory presence** — surfaced in matching practice areas + cities.

---

## 8. Public website structure

`https://nexa.mk/*` — bilingual MK/EN, formal address (Вие / Вашиот / Ве) across all MK copy.

### Information architecture

| URL | Purpose |
|---|---|
| `/` | Home — 3-act story |
| `/about` | Full ecosystem explanation, FAQ, contact, legal entity |
| `/pricing` | Public two-tier pricing page (Basic + Pro, monthly/annual toggle, prices shown) → signup |
| `/proverka` | Public compliance teaser funnel |
| `/ecosystem`, `/corporate`, `/employment`, `/residence`, `/trademark`, `/smetkovoditeli`, `/topics` | Niche landing / funnel entry pages |
| `/redeem` | Promo-code redemption (Google OAuth wired) |
| `/contact` | Email + company info + JSON-LD Contact schema |
| `/blog`, `/blog/:id` | Marketing content by category |
| `/terms-conditions`, `/general-conditions`, `/privacy-policy` | Legal |
| `/login`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/success` | Auth |
| `/shared/:shareToken`, `/preview/:documentType`, `/provider-response/:token` | Shared docs, document preview, provider lead response |

### Visual language

Aurora gradient hero backgrounds; slate-blue brand palette (`--nx-primary-*`) + teal accent; Inter typeface; CSS-Modules cards (white, 1px border, soft shadow, 3px hover lift); glassmorphism on dark; fade-in-up + IntersectionObserver scroll-reveal.

### SEO / GEO

Per-page `SEOHelmet` (canonical, Open Graph, Twitter Card, hreflang mk/en/x-default) and `schemaGraph.js` JSON-LD (`NEXA_ORG`, `NEXA_WEBSITE`, `webPage`, `breadcrumb`, `faqPage`, service/product offers, `personMartin`, `contactPage`). Site-root `llms.txt`; mobile viewport without `maximum-scale=1`; permissive `robots` meta for rich snippets and AI previews.

---

## 9. Lead routing system

The leadgen flow is the differentiating feature.

### Inbound webhook

```
POST /api/leads/inbound
```
Body carries `site`, `practiceArea`, `city`, contact fields, and free-text `question`. Authenticated by **HMAC-SHA256** in `X-Nexa-Signature` (verified by `leadWebhookHmac.js` before the controller runs).

### Routing & claim

`leadRoutingService.pickAssignee(lead, candidates)` selects a single Pro user by matching `practiceAreas` + `city`, with round-robin / fairness tiebreakers. `leadsService.claim` is a single **atomic `findOneAndUpdate`** (`status: 'offered', offeredTo: userId`) — first to claim wins, others get 409. A daily reaper reassigns stale `offered` leads.

Status enum: `unclaimed → offered → claimed | dismissed`.

### Notification surface

In-app dashboard tile, email (Resend → Gmail fallback), and live Socket.io event.

---

## 10. Subscription & access enforcement

### State machine (8-day free window)

```
register ─► 8-day free window (active, trial) ─► (lapse) ─► suspended
     │              │                                            ▲
     │              └─► pending_approval ─► active ─► renewal ───┤
     │                        └─► (reject) ─► suspended          │
     └─► redeem promo ─► active (€0) ──────────────────────────► ┘ (on expiry) → cancelled
```

Implemented in `server/services/subscriptionService.js`:
- **8-day free window** — `initTrial(userId, { plan, days: TRIAL_DAYS })` (`TRIAL_DAYS = 8`) fires at signup (Google + email-verify), activating the plan at €0 with `subscription.trial: true`, `endsAt ≈ now + 8d`. One per email. On lapse the daily cron suspends the account (data preserved) → preview/locked until the user subscribes or redeems a code. `initLocked` remains for edge/back-compat paths. Trial-conversion reminders fit the 8-day window: `offer_d7` (promo only), `offer_d4` (trial), `offer_d2` (all), with education emails on days 2–3.
- `requestApproval(userId, { plan, cycle })` — moves to `pending_approval`; if the user is post-activation and grace is unused, atomically grants the one-time 3-day grace (race-safe).
- `redeemPromo(userId, { plan, cycle, code })` — free €0 activation with `paidVia: 'promo'`, time-boxed.
- `activate` (shared by admin-approve and promo-redeem) — sets `active`, `endsAt` by cycle (30/90/365), preserves the platform admin, records `paidVia`.
- `reject`, `suspend`, `extend`, `cancel` — admin ops. `effectiveStatus(user)` resolves the sub-seat→parent transitive case. `hasFeatureAccess(user)` = active-unexpired OR grace-active. `computeDueReminder(user)` drives the daily cron.

### Enforcement

- **Gate (middleware)** — `subscriptionGuard.js` on feature routes (auto-documents, custom templates, marketing docs, all health checks, chatbot, marketing-bot, contract analysis, HR/contracts, etc.). Platform-admin bypass; active/grace pass; anything else → **HTTP 402** with a `SUBSCRIPTION_*` code.
- **Gate (frontend)** — a global axios interceptor catches 402 and dispatches a `subscription:blocked` window event; `SubscriptionGate.js` (mounted in `PrivateRoute`) opens a two-tier order modal (Basic / Pro, cycle toggle, **Нарачај** → `/api/subscription/request-invoice`, auto-granting grace if eligible). Locked, never-activated accounts see a **LockedWelcome** onboarding panel.
- **SubscriptionStatusBanner** — slim per-page strip with variants for grace / renewal-coming / pending / suspended / cancelled; its CTA re-dispatches `subscription:blocked` so the user stays inside the Terminal.

### Schedulers (node-cron)

`subscriptionScheduler.js` (reminders + grace auto-grant + suspend transitions), `trialReminderScheduler.js` (promo/subscription-offer проформа nudges during MK bank hours), `contractReminderScheduler.js` (08:00), `caseReminderScheduler.js` (09:00), `hrReminderScheduler.js` (10:00), **`procurementReminderScheduler.js`** (11:00 — набавки renewal reminders), `creditScheduler.js`, `backupScheduler.js` (weekly DB backup → Google Drive), `fairScheduleService.js`.

---

## 11. Email system

Provider stack: **Resend (primary) → Gmail/Nodemailer (fallback)** in `server/services/emailService.js`. Subscription templates (bilingual MK/EN) in `server/emails/subscriptionEmails.js`: renewal −14d / −3d / expired, promo −3d / expired, `subscriptionPending`, `subscriptionApproved`, `subscriptionRejected`, `subscriptionSuspended`, `adminApprovalNeeded`, `subSeatInvite` (credentials), `paymentInstructions` (pro-forma invoice with bank details from env), `graceBegun`. Bank details come from environment variables, not hardcoded.

---

## 12. Macedonian-language rule

Public website uses formal address: **Вие / Вашиот / Ве**, imperatives in formal plural (Започнете / Изберете / Контактирајте). Consistent across Home, Pricing, About, Contact, FAQ, satellite copy, CTAs, navbar, footer. The Terminal interior (MK-only) uses in-product-appropriate phrasing.

---

## 13. Technical stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB native driver (no Mongoose) |
| Auth | Passport JWT + Google OAuth |
| Frontend | React 19 + React Router 6 + i18next |
| Styling | CSS Modules + `--nx-*` design tokens (no Tailwind / no UI library) |
| Document generation | docxtemplater |
| AI / RAG | Legal corpus retrieval for the legal AI (budget-aware model routing) |
| Email | Resend + Nodemailer (Gmail fallback) |
| Realtime | Socket.io |
| Scheduling | node-cron |
| Backups | weekly cron → Google Drive (OAuth2) |
| Hosting | Railway (server), Vercel (client) |
| Schema | Inline JSON-LD via `schemaGraph.js` + react-helmet-async |

Security: double-submit-cookie **CSRF** (`middleware/csrf.js`) with an `exemptCSRF` allowlist; per-route IP **rate limiting**; **HMAC-SHA256** lead webhook; **bcryptjs** hashing; **Helmet**; **Joi** validation.

---

## 14. Legal entity & content compliance

- Operating entity: **Друштво за услуги НЕКСА АМД ДООЕЛ Скопје**
- Address: Бул. Партизански Одреди 102/2-14, Скопје – Карпош
- Contact: +389 78 534 258 · info@nexa.mk
- All public content is written or reviewed by licensed professionals; Nexa makes **no "checked by a lawyer" guarantees** in the product.
- Nexa explicitly **disclaims** being a law firm and does not provide individual legal advice — visitors are referred to the Macedonian Bar Association directory.
- DPO duties: `info@nexa.mk`. Cookie + privacy policy on `/privacy-policy`; terms on `/terms-conditions` and `/general-conditions`.

---

## 15. Summary of recent product changes (since the last overview)

Roughly in the order shipped:

1. **Two-tier merge** — Standard / Admin·5 / Admin·10 collapsed to **Basic + Pro**; roles `basic→standard_user`, `pro→admin_user`; seats 3 / 25; EUR pricing was a single annual offer (€90 Basic / €190 Pro); legacy keys kept for back-compat via `canonicalPlan()`. _(Pricing later revised — see #22.)_
2. **Onboarding: free window** — new signups get a **free full-access window** (`initTrial`) at Google/email-verify; on lapse the account suspends (data preserved) → subscribe or **redeem a promo code** (`/redeem`); code-first outbound sales run in parallel; Google OAuth sign-in. _(Window was 60 days here; now 8 — see #22.)_
3. **LHC platform overhaul** — unified `lhcScoring.js` engine (fraction model, 4 bands, critical gates); Employment split into full + Parts 1–4; **Tax module** (General / Payroll / Profit / VAT); Archives, Protection & Rescue, Waste Management, Health & Safety, GDPR (a/b/c/d maturity), and a General cross-topic pool.
4. **HR module** — `/terminal/employees` registry with computed leave balances + reminder cron; document prefill.
5. **Contracts registry** — `/terminal/contracts` with renewal/expiry reminders.
6. **Marketing Hub** — `/terminal/marketing-hub` + performance report; blog opened to Basic (1/mo).
7. **Topics Q&A** moved in-Terminal with an admin worklist + submissions review.
8. **Proverka funnel** — public 15-question compliance teaser, Google-first, per-source admin share links & analytics.
9. **Two-sided ecosystem surfaces** — Sourcing (request for offers / tender), Find-a-lawyer, Virtual Fair (+ moderation), Investments, Sales funnel, Newsletter ad booking (limited slots).
10. **Central Register document packs** — company **formation/incorporation** and **company changes** multi-document `.docx` bundles.
11. **Contract analysis** enrichment — commercial rating badge, structured JSON fields.
12. **DB backup system** — `npm run backup` + admin endpoint + weekly cron → Google Drive.
13. **CSRF fix** for blog edit/delete; case-insensitive sub-seat login; trial-backfill removal (locked model).
14. **„Проверен работодавач" employer-badge funnel** — public employer check (`/proverka-rabotodavac`) → A/A+/A++ rating → shareable dynamic-SVG seal (`/badge/:token`); member re-share via „Мојата значка" + header micro-seal.
15. **Проценка на карактер** — Big Five (OCEAN) HR assessment; owner creates + shares/emails a link, respondent answers 33 bipolar (reverse-keyed) questions, owner gets a visual radar + ranked second-person report, and the **employee is emailed their results**. `characterAssessmentController` / `publicCharacterAssessment` / `characterEmail.js`.
16. **Регистар на набавки** — procurement register organized by type of purchase; log offers (supplier/price/terms/valid-until), flag cheapest, mark chosen, set a renewal date → **renewal-reminder cron** (11:00) that links back to Sourcing. `procurementRegisterController` + `procurementReminderService/Scheduler`.
17. **Човечки ресурси** HR nav section (Вработени + Проценка на карактер + Работни односи shortcut); **Мојата значка** moved to a standalone sidebar item.
18. **Real-estate + accounting satellite sites** — `properties.nexa.mk` (недвижности) and `tax.nexa.mk` (accounting) added to `EcosystemMap`, footer network, `schemaGraph` sameAs, website mk/en locales, and the terminal case-source lists.
19. **Multi-vertical Inquiry Board** — Pro expanded beyond lawyers to a multi-vertical provider network on the tag-and-express-interest board. `PRACTICE_AREAS` gained `real-estate`, `insurance`, `consulting`; **procedure templates** (`server/config/procedureTemplates.js`: immigration / company_formation / property_purchase) pre-fill inquiry categories + per-category MK/EN suggestion lines; `inquiriesService.listBoardFor` attaches a per-member procedure hint; `ExpressInterestModal` got a profession picker; the `TierOnboardingModal` Pro option is now **„Давател на услуги"** with a provider-type picker that seeds `practiceAreas`; admin `AdminInquiryNew` has a procedure dropdown that pre-fills category chips.
20. **Newsletter banner for Basic** — the newsletter ad-slot booking (already tier-agnostic on the backend) is now discoverable for Basic via a dedicated **„Банер во билтенот"** item in Маркетинг и раст; `MarketingHub` shows the Блог tab only for Pro/admin, so Basic gets banner-only.
21. **HR Interviews („Интервјуа")** — a new qualitative HR tool cloning the character-assessment pattern: **Интервју скен** + **Излезно интервју** under one nav group, owner-editable question templates (text/1–5 rating, suggested by business type + role, saveable default per type), public respondent funnel, best-effort **AI summary** (openai) + owner results email on completion. `hr_interviews` + `hr_interview_templates` collections; Basic + Pro via `subscriptionGuard`.
22. **Pricing 3.1 + 8-day trial** — reset pricing higher and reintroduced two cycles: **Basic €15/mo · €149/yr**, **Pro €39/mo · €390/yr** (annual ≈ 2 months free; quarterly retired from the offer). Prices are now **shown publicly** on a new `/pricing` page (bilingual, monthly/annual toggle, MKD note, Offer JSON-LD) + navbar/footer links, and echoed in `SubscriptionGate` (monthly/annual toggle) + the pro-forma/offer PDFs + emails. Free window shortened **60 → 8 days** (`TRIAL_DAYS = 8`) with reminders reworked (`offer_d7`/`offer_d4`/`offer_d2`). _(Supersedes the €90/€190 annual-only-hidden model in items 1–2.)_

---

## 16. Where to look (for AI tooling)

| Topic | File |
|---|---|
| Roles / plans / prices | `server/constants/roles.js` |
| Subscription state machine | `server/services/subscriptionService.js` |
| Promo codes / referrals | `server/services/promoCodeService.js`, `referralService.js` |
| Sub-seat lifecycle | `server/services/subSeatService.js` |
| Lead routing | `server/services/leadRoutingService.js` (+ tests) |
| Inquiry Board / procedures | `server/services/inquiriesService.js`, `server/config/procedureTemplates.js`, `client/src/pages/terminal/Leads.js` + `ProHome.js`, `ExpressInterestModal.js`, `TierOnboardingModal.js` |
| Satellite sites / ecosystem | `client/src/components/website/EcosystemMap.js`, `PublicFooterV2.js`, `schemaGraph.js` (sameAs), `client/src/pages/website/LeadsHome.js` |
| LHC scoring engine | `server/controllers/lhc/lhcScoring.js`, `lhcShared.js` |
| LHC modules | `server/controllers/lhc/*Controller.js` (employment, tax, gdpr, etc.) |
| HR / employees | `server/controllers/employeeController.js`, `server/routes/employees.js` |
| Character assessment | `server/data/characterAssessmentQuestions.js`, `characterAssessmentController.js`, `routes/publicCharacterAssessment.js`, `services/characterEmail.js` |
| HR Interviews | `server/data/interviewQuestions.js`, `controllers/hrInterviewController.js`, `routes/hrInterviews.js` + `routes/publicInterview.js`, `services/interviewEmail.js` + `interviewSummary.js`, `client/src/pages/terminal/Interviews.js`, `client/src/pages/website/InterviewForm.js` |
| Newsletter banner | `client/src/pages/terminal/NewsletterAdBooking.js` + `MarketingHub.js`, `server/services/newsletterAdsService.js`, `server/routes/newsletterAds.js` |
| Procurement register | `server/controllers/procurementRegisterController.js`, `routes/procurementRegister.js`, `services/procurementReminderService.js` |
| Verified-employer badge | `server/routes/publicEmployerBadge.js`, `server/services/badgeService.js` |
| Contracts registry | `server/controllers/contractController.js`, `server/routes/contracts.js` |
| Auto-documents | `server/controllers/autoDocuments/*` (45 controllers) |
| Schedulers | `server/services/*Scheduler.js` |
| Email templates | `server/emails/subscriptionEmails.js` |
| Public pricing | `client/src/pages/website/Pricing.js` |
| Public home | `client/src/pages/website/Home.js` |
| Proverka funnel | `client/src/pages/website/*` + `server/routes/publicScreening.js` |
| Subscription gate / banner | `client/src/components/terminal/SubscriptionGate.js`, `SubscriptionStatusBanner.js` |
| Terminal routes table | `client/src/App.js` |
| Schema.org / JSON-LD | `client/src/components/seo/schemaGraph.js` |
| MK translations | `client/src/i18n/locales/website/mk.json` |

---

*End of overview. Last updated: 2026-09-30 (rev 3).*


---

# PART II — Marketing Concept Brief

# Nexa Terminal — Full Concept Brief (for Marketing)

_Last updated: 2026-09-30 (rev 3) · Prepared for: marketing/AI strategy work · Market: North Macedonia · Languages: Macedonian (primary) + English_

> **How to use this document.** This is a complete, self-contained description of the Nexa
> business, product, features, packaging, and go-to-market so an AI (or a marketer) can design
> the best strategy without needing anything else. It is written to be dropped straight into a
> marketing tool. Section 12 lists the hard constraints you must respect in any campaign.

---

## 1. One-paragraph summary

**Nexa Terminal is the legal & compliance department that Macedonian small and medium businesses
cannot afford to hire.** It is a bilingual (Macedonian/English) SaaS platform that lets a company
run compliance self-checks, get plain-language legal answers from an AI trained on Macedonian law,
and generate ready-to-use professional legal documents (employment contracts, terminations, GDPR
rulebooks, company-registration packs, commercial agreements, and more) — all through a web
terminal, without a lawyer for the routine work. A second, provider-facing side of the platform
turns verified service providers (lawyers, accountants, agencies) into a lead-generation and
client-management network.

**The core value story in one line:** _A screening finds the compliance gap → the AI explains it →
a document fixes it → the system tracks it._ That loop is the product; everything else supports it.

---

## 2. The problem we solve

North Macedonian SMBs operate in a dense, frequently-changing legal environment (labor law, GDPR,
tax, company registration, obligations/contract law). Their realistic options today are:

- **Hire a lawyer per task** — expensive, slow, overkill for routine paperwork.
- **Copy a random template from the internet** — outdated, wrong jurisdiction, legally risky.
- **Ignore it and hope** — the default, until an inspection, a lawsuit, or a fine.

They don't know **what they're missing**, they can't easily **fix it themselves**, and once fixed
they have **no system to keep it current** when the law changes or documents expire.

Nexa collapses "what am I missing → how do I fix it → give me the document → remind me when it
changes" into one affordable subscription.

---

## 3. Target customers

Nexa is a **two-sided platform** with two distinct products and audiences:

### Product A — Basic (the demand side) → **nexa.mk**
The **SMB / business that consumes legal services**: owners, HR, office managers, founders of
micro and small companies (ДОО/ДООЕЛ), startups, shops, agencies. They want to *do* their own
compliance and paperwork cheaply and correctly. This is the mass market and the acquisition engine.

### Product B — Pro (the supply side) → **leads.nexa.mk**
The **service providers** — now a **multi-vertical provider network, no longer lawyers-only**:
lawyers, accountants, bookkeeping firms, consultants, agencies, plus non-legal verticals like
**real-estate agents, insurance brokers, and business consultants** (practice areas `real-estate`,
`insurance`, `consulting`). They want **inbound leads/inquiries**, a professional presence, expert
positioning, and a way to **manage their own book of client companies** from one account. Pro is the
higher-value tier and the B2B2B growth wedge (an accountant reselling Nexa compliance to all their
clients). New Pro signups pick a **provider type** in onboarding („Давател на услуги"), which maps to
a practice area so they match relevant inquiries immediately.

> Strategic note: the same codebase powers both, split by storefront + navigation + a provider cap.
> Marketing should treat them as **two campaigns with two promises**, not one blended message.

---

## 4. The product surface — what a user actually sees

Conceptually the terminal has three areas — **the tools (Work)**, **the network (two-sided
features)**, and **resources** — used below to structure this brief. The live SMB sidebar is a
product-aware, task-based layout with sections **Администрација · Човечки ресурси · Набавки ·
Маркетинг и раст · Едукација** (plus a standalone „Мојата значка"); the Pro sidebar foregrounds the
client-acquisition surfaces. The conceptual grouping and the literal nav don't map 1:1.

### 4.1 РАБОТА — the tools (this is the daily-use core)

**a) Dashboard / Контролна табла** — the command center: compliance score, what's missing,
upcoming obligations (expiring contracts, due decisions), a "next best action" card, and recent
documents. (Being rebuilt from a plain feed into this cockpit.)

**b) Documents — ~45+ automated generators across 8 categories.** The user fills a smart form and
gets a finished, formatted `.docx`. All documents auto-pull the company's own data. Categories:
- **Employment** — employment agreements, annexes, terminations (by fault, personal reasons, age
  limit, duration, employee request), disciplinary actions, warnings, warning-before-lawsuit,
  confirmations of employment, bonus & leave decisions, damages statements, stock-purchase plans.
- **Personal Data / GDPR** — consent forms, data-processing policies, personal-data rulebooks,
  company GDPR politics.
- **Contracts / Obligations** — NDA, services contracts, master services agreements, SaaS
  agreements, rent agreements, loan agreements, debt assumption, mediation, vehicle sale-purchase,
  vehicle/rent, mandatory & discretionary bonuses.
- **Central Register** — **company incorporation packs** („Основање на фирма", ДОО/ДООЕЛ:
  constitutive act + statements + POAs assembled into one file) and **company-change packs**
  („Промени во фирма" — a dynamic package that assembles decisions + act + statements).
- **Accounting / Corporate decisions** — annual accounts adoption, dividend/decision payments,
  cash-register maximum, write-off decisions, invoice-signing authorization.
- **Rulebooks & internal acts** — organization act, estimation procedures, workplace rulebooks.
- **Other** — misc corporate & commercial instruments.

**c) My Templates (Bring-Your-Own-Document automation).** A user uploads their **own** `.docx`,
Nexa turns it into an automated, fillable template, and they can bulk-generate from it. This
removes the ceiling of "we only have 45 templates" and is one of the most scalable, under-marketed
differentiators. Includes a template marketplace, template builder, form-fill, bulk generate, and
history.

**d) Проверки / Compliance Screenings (Legal Health Checks).** Interactive questionnaires that
score a company's compliance by domain, flag the gaps, rank them by risk, and route each gap to the
document or AI answer that fixes it. Domains:
- **Legal Health Check (LHC):** Employment (multi-part), **GDPR** (a/b/c/d maturity model with
  critical gates and bands), Archives, Health & Safety, and a **General** cross-domain pool.
- **Tax compliance (Даночна усогласеност):** modular — profit tax built, more coming.
- **Marketing, HR/Operational, Cyber** health checks.
- All screenings run on a **shared unified scoring engine** (fraction model, four maturity bands,
  critical gates) so results are consistent and comparable.

**e) Nexa AI.** Multiple AI modes:
- **Legal AI chat** — RAG (retrieval-augmented) assistant grounded in **Macedonian law**; answers
  cite the law and render structured, readable legal responses (Markdown). This is the hardest-to-
  replicate, highest-utility feature.
- **Marketing AI chat** — marketing/copy assistant.
- **Contract Analysis** — upload a contract, get a structured risk report with ratings.
- **Stance / personal AI preferences** — the user tunes the AI's default posture.

### 4.2 МРЕЖА — the network (the two-sided / Pro features)

- **Virtual Fair (Виртуелен саем)** — a booth marketplace where providers present themselves.
- **Sourcing / RFQ (Барање за понуди)** — a business requests quotes; routed to providers. Its
  companion **Регистар на набавки (Procurement Register)** is a demand-side retention tool: the SMB
  keeps a register organized by *type of purchase* (insurance, hosting, accounting…), logs the
  offers it receives per need (supplier · price · terms · valid-until), flags the cheapest, marks
  the chosen one, and sets a **renewal date that fires a "time to re-quote" email reminder** — closing
  the loop request → offers → compare → pick → remind → re-quote.
- **Inquiry Board / Leads / Предмети (case management)** — the canonical **tag-and-express-interest
  board** where inbound inquiries from Nexa's satellite sites surface to matching providers. Now
  **multi-vertical** (lawyers, accountants, real-estate, insurance, consultants): providers see
  inquiries matched to their practice area(s) + city and **express interest** (with a profession
  picker). **Procedure templates** (immigration / company-formation / property-purchase) pre-fill
  inquiry categories and give each viewer a per-category suggestion hint. Plus a Pro
  case-management module (cases + deadlines + timeline, 09:00 reminders, AI case brief, and a public
  redacted client-status link).
- **Topics Q&A** — providers answer public legal questions → expert positioning + SEO.
- **Blog publishing** — providers (and Basic, limited) publish articles → content/SEO placement.
- **Newsletter banner (Банер во билтенот)** — book a banner slot in the monthly Nexa newsletter
  (upload an image + optional link; 3 slots/month, 1/quarter). Available to **Basic too** — surfaced
  in Маркетинг и раст as its own entry (banner-only; the Блог tab stays a Pro surface). A cheap,
  self-serve promotion channel for SMBs, not just providers.
- **„Проверен работодавач" badge (Verified-Employer funnel)** — a public, shareable **maturity
  badge** aimed at jobseekers that doubles as a **non-user acquisition funnel**. A company runs a
  ~20-question employer check at `/proverka-rabotodavac`, gets an **A / A+ / A++** rating, and signs
  up to claim a shareable **circular seal** (dynamic server-generated SVG) hosted at `/badge/:token`.
  Every seal placed on a job ad or website is a backlink + referral loop back to Nexa. Members
  re-open/re-share it anytime from **„Мојата значка"** in the terminal (with a micro-seal on the
  profile button). Framing is defensible **self-assessment / maturity level**, never "certified
  compliant" (see §12).

### 4.3 РЕСУРСИ — resources

- **Education / Courses** — substantial course library (lessons, details) used as retention glue,
  trust-builder, and lead magnet.

### 4.4 Client / account management

- **Team / Clients (sub-accounts).** Basic → up to **3 co-workers** (shared company). Pro → up to
  **25 client companies** (each its own company, vouched by the Pro — this is the accountant/agency
  reseller engine).
- **Човечки ресурси (HR section).** A dedicated sidebar section grouping the people tools:
  - **Вработени** — an employee registry with computed leave balances and reminders, and document
    pre-fill from employee records.
  - **Проценка на карактер (Character Assessment).** A **Big Five (OCEAN) personality assessment**
    an SMB sends to a **candidate or employee** to "know who they're hiring/working with." The owner
    creates a named assessment, shares a link or emails it; the respondent answers **33 bipolar
    questions** (reverse-keyed for validity); the owner gets a **visual profile report** (radar +
    a ranked, second-person "how it shows up" narrative), and the **employee is emailed their own
    results**. A rare, sticky HR feature for the SMB segment.
  - **Интервјуа (Interviews).** A qualitative counterpart to the character test — one
    nav group with two flows: **Интервју скен** (a behavioral/soft-skill screen you
    send a **candidate** before hiring) and **Излезно интервју** (a structured **exit
    interview** for a departing employee). The employer gets **AI-suggested questions**
    tuned to the business type + role (behavior/character focused, 10–15 max), can
    **edit them freely** and **save a reusable default template**, then shares a link or
    emails it. The respondent answers with free-text + 1–5 ratings; the owner gets the
    transcript plus a short **AI summary** (soft-skill signals for a candidate; the "why
    they're leaving" + retention themes for exits). A sticky, high-value HR feature; exit
    interviews especially double as a **retention insight** engine.
  - **Работни односи** — a shortcut into the labour-law document category.
- Billing, subscription, credits, invite/referrals, and company verification screens.

---

## 5. The trust layer (critical for messaging)

Nexa's credibility is built on **factual provenance only**, never on lawyer endorsement:
- Law citations, official gazette numbers, "last updated" dates, and change logs.
- **Do NOT claim "checked by a lawyer / проверено од адвокат"** anywhere (see §12). Citing the law
  requires no license; claiming legal review currently does not apply and would be false.
- A partner law-firm endorsement can be added **later** if one signs on.

The satellite/network sites — topic-specific micro-sites like `samodaprasham.mk`, `immigration.mk`,
`macedoniancitizenship.mk`, `company.nexa.mk`, `tax.nexa.mk` (accounting), `iplaw.nexa.mk`,
`osiguran.nexa.mk` (insurance), `properties.nexa.mk` (real estate, added Sept 2026), and
`topics.nexa.mk` — feed leads and SEO and reinforce authority through published, sourced content.
The satellite roster now spans legal *and* non-legal verticals, matching the multi-vertical Pro
provider network.

---

## 6. Packaging: Basic vs Pro

Two tiers only. **Basic = the tools (demand side). Pro = everything in Basic + the network/provider
side (supply side).**

| | **Basic** (nexa.mk) | **Pro** (leads.nexa.mk) |
|---|---|---|
| **Who** | SMBs that *consume* legal services | Multi-vertical providers who *sell* services — lawyers, accountants, real-estate agents, insurance brokers, consultants |
| **Core tools** | All ~45 document generators, My Templates, all compliance screenings, Nexa AI (Legal/Marketing/Contract Analysis), courses, dashboard | Everything in Basic |
| **Network** | Request-an-offer (demand side), virtual fair (view) | + Provider booth, Leads/case routing, Topics Q&A, blog authoring, RFQ bidding, B2B network |
| **Sub-accounts** | Up to **3 co-workers** (shared company) | Up to **25 client companies** (each own company, vouched) |
| **Positioning** | "Your company's legal department for a fixed fee" | "Inbound leads + manage your whole client book in one place" |

> Known packaging tension (for honest strategy): Basic already bundles nearly all the genuinely
> valuable *tools*. Pro's extra value is the **two-sided network + 25-client management**, which is
> only compelling to providers/agencies. Marketing to a pure SMB should sell **Basic**; do not try
> to upsell an SMB into Pro. Pro is a separate audience (leads.nexa.mk), not an SMB upgrade.

---

## 7. Pricing & payment model

- **Sold on two cycles per tier — monthly + annual** (Nexa 3.1 model; annual ≈ 2 months free):
  - **Basic — €15 / month · €149 / year**
  - **Pro — €39 / month · €390 / year**
- **Prices ARE now shown publicly** on a `/pricing` page (bilingual, monthly/annual toggle, MKD for
  reference) and in the terminal buy flow. Marketing can lead with transparent pricing; still pair
  the number with the value/outcome story (one avoided lawyer visit ≈ the subscription).
- Currency: **EUR**; issuer is not VAT-liable, so the shown price is final. Payment is by manual
  bank transfer against a pro-forma invoice. (Quarterly exists in code for back-compat only.)
- **Onboarding includes an 8-day free window.** A brand-new signup (Google or email-verify) is
  granted an **8-day free full-access window** to the product for its storefront's plan. When the
  8 days lapse the account **auto-suspends to a preview/locked state — data is preserved** — and
  the user must **subscribe or redeem a promo code** to regain feature access. Marketing may say
  **"8 дена бесплатно"** (8 days free), honestly. _(Shortened from the earlier 60-day window.)_
- **Code-first sales still run in parallel.** Outbound sales issues **per-prospect promo codes**
  (typically a time-boxed Pro grant); redemption at `/redeem?code=…` + Google OAuth already works.
  Redeemed-code access is full paid access for its window.
- **Planned free public funnel** („Бесплатна проверка" at nexa.mk/proverka): a public,
  no-login compliance teaser (~10–15 questions) → score + top gaps → email capture → register →
  a teaser state with **one free document generation** to feel the value, then plan chooser / code.
  This is the intended top-of-funnel acquisition engine — marketing should build around it.

---

## 8. The strategic funnel (how a stranger becomes a customer)

**Acquisition → Activation → Conversion → Retention**, mapped to real features:

1. **Acquisition (top of funnel):**
   - Free public compliance teaser (`/proverka`) — fear + urgency from a low compliance score.
   - Satellite legal micro-sites + published Topics/Blog content — SEO + authority.
   - Outbound (cold email + LinkedIn) linking **to the teaser funnel**, not the homepage, with
     per-prospect promo codes as the accelerant.
2. **Activation:** register → **8-day free window** (full access) → the "wow" is real usage
   (generate a document, run a screening, send a character assessment, claim a „Проверен
   работодавач" badge).
3. **Conversion:** during/at the end of the free window, the value has landed (gaps found, documents
   generated, renewals tracked) → the plan chooser / code appears; on lapse the terminal locks to a
   preview state until they subscribe. Prices are public (on `/pricing`) and in the buy flow.
4. **Retention (why they keep paying):** the **Contract/Compliance Management System** — saved
   documents, expiry/renewal reminders (08:00 Europe/Skopje), recurring re-screening ("re-run your
   GDPR check quarterly"), a Macedonian **compliance calendar** of legal deadlines, and a
   **savings meter** showing money/time saved vs. hiring a lawyer.

**The one core loop to sell in every campaign:**
`Проверка (screening) → Nexa AI (explanation) → Документ (fix) → CMS (tracking)`.

---

## 9. Positioning & differentiation (the moat)

1. **Macedonian legal localization.** Documents, screenings, and the AI are built for MK law
   specifically — not a translated generic tool. This is the defensible moat.
2. **The integrated loop.** Competitors offer *either* templates *or* a chatbot *or* a checklist.
   Nexa connects find-gap → explain → fix → track in one place.
3. **Bring-Your-Own-Template automation.** Turns any company's existing paperwork into an
   automated generator — no competitor ceiling.
4. **Two-sided network + reseller model.** The 25-client Pro account is a genuine B2B2B wedge
   (agencies/accountants managing client compliance at scale).
5. **Factual, sourced trust layer** (law citations, gazette numbers, change logs) vs. anonymous
   internet templates.

---

## 10. Suggested messaging angles (raw material for the marketing AI)

**For Basic / SMB (nexa.mk):**
- "Правен оддел за вашата фирма — од €15 месечно." (A legal department for your company, from €15/mo.)
- "Дознајте што ви недостасува за 5 минути." (Find out what you're missing in 5 minutes.) → teaser.
- "Договор, отказ, ГДПР правилник — готови за минути, без адвокат за рутината."
- ROI angle: one avoided lawyer visit (€30–100) ≈ months of Basic. Make the savings visible.
- Fear/urgency angle (compliance screening): inspections, fines, labor disputes, GDPR.

**For Pro / providers (leads.nexa.mk):**
- "Добивајте клиенти. Управувајте со целата ваша книга клиенти од едно место."
- "Inbound leads од Nexa мрежата + presence + експертско позиционирање (Topics, блог, booth)."
- Reseller angle for accountants/agencies: run all your clients' compliance from one dashboard.

**Content/SEO engine:** Topics Q&A + Blog + satellite sites answer real Macedonian legal questions
→ rank → funnel to the free teaser. This is the compounding acquisition channel.

---

## 11. Product maturity & roadmap context

- **Live/built:** all the tools in §4 (documents, screenings, AI, templates, network features,
  sub-accounts, HR module, case management, DB backup system, subscription enforcement). Recently
  shipped: **„Проверен работодавач" employer-badge funnel**, **Проценка на карактер** (Big Five HR
  assessment + employee results email), **Регистар на набавки** (procurement offer register +
  renewal-reminder cron), the **Човечки ресурси** HR nav grouping, the **8-day free window**, the
  **multi-vertical Inquiry Board** (Pro opened beyond lawyers to real-estate/insurance/consulting,
  with procedure templates + provider-type onboarding), two new satellite sites —
  **`properties.nexa.mk`** (real estate) and **`tax.nexa.mk`** (accounting) — the **newsletter
  banner opened to Basic**, and **HR Interviews** („Интервју скен" + „Излезно интервју": editable
  AI-suggested questions, mixed free-text/ratings, AI summary + owner results email).
- **Status of the market:** **zero paying users yet (pre-PMF)** — every account today is demo/dummy.
  So marketing's job is **acquisition + conversion proof**, not scaling retention. Don't assume an
  existing customer base in testimonials/social proof (there aren't real paying references yet).
- **In progress / planned (roadmap SSOT is `tasks/master-plan.md`):** honesty pass on all "free"
  copy, the public `/proverka` funnel, dashboard command-center rebuild, CMS v1 (contract tracking
  + reminders), Macedonian compliance calendar, savings meter, and a CMS/content system.
- **Known focus fixes (be aware, don't over-promise):** several two-sided surfaces (Fair, Sourcing,
  Find-Lawyer, Investments) need marketplace liquidity that doesn't exist yet — some are being
  merged/hidden until supply exists. Don't market an empty marketplace to SMBs.

---

## 12. Hard constraints for any campaign (read before writing copy)

1. **NEVER claim "checked by a lawyer / проверено од адвокат"** or imply legal representation/advice.
   Nexa provides tools and sourced information, not legal counsel. Trust = law citations + gazette
   numbers + update dates only. (Founder is not currently a licensed attorney.)
2. **Prices are public now** (Nexa 3.1): Basic €15/mo·€149/yr, Pro €39/mo·€390/yr, on `/pricing` and
   in the buy flow. Still pair the number with the value/outcome story — don't lead with price alone.
   Keep every surface in sync with `server/constants/roles.js` (source of truth).
3. **Be honest about "free."** There is a genuine **8-day free window** (say "8 дена бесплатно")
   plus the public teaser — but **no "free forever"** and no implying the paid tools stay free after
   8 days. Honesty pass is a standing rule.
4. **Two audiences, two storefronts, two promises** — nexa.mk (SMB/Basic) vs leads.nexa.mk
   (providers/Pro). Don't blend them or upsell SMBs into Pro.
5. **Don't market empty marketplace surfaces** to demand-side users until supply exists.
6. **No fabricated social proof** — there are no real paying customers yet.
7. **Bilingual, Macedonian-first.** Primary market and language is North Macedonia / Macedonian;
   English is secondary.

---

## 13. Quick-reference fact sheet

- **Product:** Bilingual (MK/EN) legal & compliance SaaS for Macedonian SMBs + a provider network.
- **Core loop:** Screening → AI → Document → Tracking.
- **Tiers:** Basic €15/mo·€149/yr (SMB, nexa.mk) · Pro €39/mo·€390/yr (providers, leads.nexa.mk).
  Monthly + annual; prices public on `/pricing` and in-app.
- **Onboarding:** **8-day free window** at signup → then subscribe or redeem a promo code (data
  preserved); code-first outbound sales run in parallel; Google OAuth login.
- **Headline features:** ~45+ document generators, BYO-template automation, multi-domain compliance
  screenings, Macedonian-law RAG AI + contract analysis, provider network (booth/leads/Topics/blog),
  **„Проверен работодавач" employer badge**, **Проценка на карактер** (Big Five HR assessment),
  **Интервјуа** (interview scan + exit interview with editable AI-suggested questions + AI summary),
  **Регистар на набавки** (procurement register + renewal reminders), newsletter banner (now Basic too),
  3 co-workers (Basic) / 25 client companies (Pro), courses.
- **Moat:** MK legal localization + integrated loop + factual provenance + reseller model.
- **Stage:** Pre-PMF, zero paying users; priority = acquisition + conversion via the free teaser funnel.
- **Trust rule:** Cite the law; never claim lawyer review.
