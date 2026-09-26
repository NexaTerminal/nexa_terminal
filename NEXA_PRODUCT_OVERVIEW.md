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

All prices in **EUR**. The go-to-market offer is a **single annual price per tier**, and **prices are not shown on the public website** — they surface only inside the terminal buy flow (the SubscriptionGate). Legacy monthly/quarterly numbers remain in code for back-compat but are not the marketed offer.

| Plan | Annual (GTM offer) | (legacy monthly / quarterly) | Audience |
|---|---:|---:|---|
| **Основен** (Basic) | **€90 / year** | €19 / €49 | SMBs (demand side) |
| **Про** (Pro) | **€190 / year** | €39 / €99 | Service providers (supply side) |

Public pages sell value and drive to signup; the price is revealed in-app.

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

### Onboarding & subscription lifecycle (60-day free window + code-first)

A brand-new signup is granted a **60-day free full-access window** (`initTrial`, `TRIAL_DAYS = 60`) to the product for its storefront's plan. When the window lapses the account **auto-suspends** (data preserved) and returns to a preview/locked state until the user subscribes or redeems a code. Outbound promo codes still run in parallel.

```
register ──► 60-day free window (active, paidVia:'promo', trial:true)
   │                     │
   │                     └─(60 days lapse)─► suspended/locked (preview) ──┐
   │                                                                      │
   ├──► redeem promo code (/redeem) ─────────► active (€0, time-boxed) ───┤
   └──► pick a plan → pro-forma invoice → bank transfer → active (paid) ──┘
```

- **Free window**: `initTrial` fires after Google signup and after email verification, activating the plan at €0 with `paidVia:'promo'` + `subscription.trial:true`, `endsAt ≈ now + 60d`. One per email.
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
  basic: { monthly: 19, quarterly: 49, annual: 90 },   // €90/yr is the GTM offer
  pro:   { monthly: 39, quarterly: 99, annual: 190 }    // €190/yr is the GTM offer
};
const PLAN_SEATS = { basic: 3, pro: 25 };
const PLAN_TO_ROLE = { basic: 'standard_user', pro: 'admin_user' };
const PLAN_CURRENCY = 'EUR';
const TRIAL_DAYS = 60;  // 60-day free window granted at signup
```

`canonicalPlan()` normalizes legacy keys (`standard`→`basic`; `admin_5`/`admin_10`→`pro`). Same prices echo across `Pricing.js`, `SubscriptionGate.js`, `schemaGraph.js` (JSON-LD), payment-instruction emails, and i18n descriptors.

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
| `/pricing` | Two-tier chooser (Basic + Pro) + pro-forma invoice flow |
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

### State machine (60-day free window)

```
register ─► 60-day free window (active, trial) ─► (lapse) ─► suspended
     │              │                                            ▲
     │              └─► pending_approval ─► active ─► renewal ───┤
     │                        └─► (reject) ─► suspended          │
     └─► redeem promo ─► active (€0) ──────────────────────────► ┘ (on expiry) → cancelled
```

Implemented in `server/services/subscriptionService.js`:
- **60-day free window** — `initTrial(userId, { plan, days: TRIAL_DAYS })` (`TRIAL_DAYS = 60`) fires at signup (Google + email-verify), activating the plan at €0 with `subscription.trial: true`, `endsAt ≈ now + 60d`. One per email. On lapse the daily cron suspends the account (data preserved) → preview/locked until the user subscribes or redeems a code. `initLocked` remains for edge/back-compat paths.
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

1. **Two-tier merge** — Standard / Admin·5 / Admin·10 collapsed to **Basic + Pro**; roles `basic→standard_user`, `pro→admin_user`; seats 3 / 25; EUR pricing now a single annual offer (**€90 Basic / €190 Pro**); legacy keys kept for back-compat via `canonicalPlan()`.
2. **Onboarding: 60-day free window** — new signups get a **60-day free full-access window** (`initTrial`, `TRIAL_DAYS = 60`) at Google/email-verify; on lapse the account suspends (data preserved) → subscribe or **redeem a promo code** (`/redeem`); code-first outbound sales run in parallel; Google OAuth sign-in. _(Supersedes the earlier "no trial, locked-on-signup" model.)_
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

*End of overview. Last updated: 2026-09-26 (rev 2).*
