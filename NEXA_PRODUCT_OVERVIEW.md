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

All prices in **EUR** (with an EUR/MKD toggle on the public page), using **9-ending psychological pricing**. **Two tiers** × three billing cycles. The public `/pricing` page is a two-tier chooser (Basic + Pro).

| Plan | Monthly | Quarterly | Yearly | Audience |
|---|---:|---:|---:|---|
| **Основен** (Basic) | €19 | €49 | €179 | SMBs (demand side) |
| **Про** (Pro) | €39 | €99 | €359 | Service providers (supply side) |

Quarterly ≈ 14–16% off three months; annual ≈ 22–24% off twelve months.

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

### Onboarding & subscription lifecycle (code-first, no trial)

There is **no free trial**. A brand-new account starts **LOCKED** (`subscription.status: 'none'`) and has no feature access until it is unlocked one of two ways:

```
register (locked) ──► redeem promo code (/redeem)  ──► active (€0, promo, time-boxed)
                 └──► pick a plan → pro-forma invoice → bank transfer → active (paid)
```

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
  basic: { monthly: 19, quarterly: 49, annual: 179 },
  pro:   { monthly: 39, quarterly: 99, annual: 359 }
};
const PLAN_SEATS = { basic: 3, pro: 25 };
const PLAN_TO_ROLE = { basic: 'standard_user', pro: 'admin_user' };
const PLAN_CURRENCY = 'EUR';
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

### HR module — Вработени (`/terminal/employees`)

An employee registry (clones the contracts pattern): list, create, detail, and edit employees. Provides **computed leave balances** and a daily **reminder cron** (e.g. contract/leave events). Employee data can prefill document generation.

### Contracts registry (`/terminal/contracts`)

A registry of the company's contracts (list / new / detail / edit) with a **contract-reminder scheduler** for renewal/expiry dates.

### Marketing

- **Marketing** (`/terminal/marketing`) and **Marketing Hub** (`/terminal/marketing-hub`) — marketing tooling and content surface
- **Marketing performance report** (`/terminal/marketing/performance-report`)

### Ecosystem / two-sided features

- **Sourcing — Request for offers** (`/terminal/sourcing`) — SMBs request quotes; providers respond (offer-requests).
- **Find a lawyer** (`/terminal/find-lawyer`) — directory into the provider network.
- **Virtual Fair** (`/terminal/fair`, `/terminal/fair/:id`) — booths with provider products/services; admin moderation.
- **Investments** (`/terminal/investments`) — investment listings/detail.
- **Sales funnel** (`/terminal/sales`) — provider sales pipeline.
- **Blog publishing** — submit (`/terminal/blogs/submit`), my submissions, published, with admin moderation of pending submissions.
- **Topics Q&A** (`/terminal/topics-qa`) — Pro members answer public questions; admin worklist assigns/curates.
- **Newsletter ad booking** (`NewsletterAdBooking`) — banner slots in the Nexa newsletter (bookable, limited slots).
- **Credits / Billing / Subscription** (`/terminal/credits`, `/terminal/billing`, `/terminal/subscription`).

### Pro-user features (`/terminal/admin-user/*`)

Visible to `role: 'admin_user'` (Pro):
- **Dashboard** — seat usage, recent leads, subscription state
- **Leads inbox** (`/terminal/admin-user/leads`) — leads matching the provider's practice area + city, **first-to-claim** atomic semantics (`unclaimed → offered → claimed | dismissed`)
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

`PRACTICE_AREAS` in `roles.js`: `consumer-legal`, `immigration`, `citizenship`, `company-registration`, `ip-law`, `tax-accounting`, `labor-law`, `general-legal`.

### The satellite properties

- **`samodaprasham.mk`** — citizen legal questions (inheritance, divorce, criminal defense, property, employment). Long-tail Google intent; routes to the matching practice area.
- **`immigration.mk`** — residence permits for foreigners. High commercial intent, often urgent.
- **`macedoniancitizenship.mk`** — diaspora & descendants seeking citizenship. Long-cycle, high-ticket case work.
- **`company.nexa.mk`** — company registration (ДОО/ДООЕЛ/АД, Central Registry, ownership changes, branches). Pairs the lead with a lawyer + accountant.
- **`iplaw.nexa.mk`** — intellectual property (trademarks, patents, copyright, licensing). Lower volume, high value.
- **`osiguran.nexa.mk`** — insurance niche (added mid-2026).

> Satellite sites are hardcoded across several files and copy strings; grep `iplaw` / satellite domains to find every reference before adding a new one.

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

### State machine (no trial)

```
none (locked) ──► pending_approval ──► active ──► renewal cycles
     │                   │                 │
     │                   └─► (reject) ──► suspended
     │                                        ▲
     └─► redeem promo ─► active (€0) ─────────┘  (on expiry)
                                              │
                                          cancelled
```

Implemented in `server/services/subscriptionService.js`:
- **No auto-trial** — new accounts initialize LOCKED (`status: 'none'`); no feature access until a code is redeemed or a plan is paid.
- `requestApproval(userId, { plan, cycle })` — moves to `pending_approval`; if the user is post-activation and grace is unused, atomically grants the one-time 3-day grace (race-safe).
- `redeemPromo(userId, { plan, cycle, code })` — free €0 activation with `paidVia: 'promo'`, time-boxed.
- `activate` (shared by admin-approve and promo-redeem) — sets `active`, `endsAt` by cycle (30/90/365), preserves the platform admin, records `paidVia`.
- `reject`, `suspend`, `extend`, `cancel` — admin ops. `effectiveStatus(user)` resolves the sub-seat→parent transitive case. `hasFeatureAccess(user)` = active-unexpired OR grace-active. `computeDueReminder(user)` drives the daily cron.

### Enforcement

- **Gate (middleware)** — `subscriptionGuard.js` on feature routes (auto-documents, custom templates, marketing docs, all health checks, chatbot, marketing-bot, contract analysis, HR/contracts, etc.). Platform-admin bypass; active/grace pass; anything else → **HTTP 402** with a `SUBSCRIPTION_*` code.
- **Gate (frontend)** — a global axios interceptor catches 402 and dispatches a `subscription:blocked` window event; `SubscriptionGate.js` (mounted in `PrivateRoute`) opens a two-tier order modal (Basic / Pro, cycle toggle, **Нарачај** → `/api/subscription/request-invoice`, auto-granting grace if eligible). Locked, never-activated accounts see a **LockedWelcome** onboarding panel.
- **SubscriptionStatusBanner** — slim per-page strip with variants for grace / renewal-coming / pending / suspended / cancelled; its CTA re-dispatches `subscription:blocked` so the user stays inside the Terminal.

### Schedulers (node-cron)

`subscriptionScheduler.js` (reminders + grace auto-grant + suspend transitions), `trialReminderScheduler.js` (promo/subscription-offer проформа nudges during MK bank hours), `contractReminderScheduler.js`, `hrReminderScheduler.js`, `creditScheduler.js`, `backupScheduler.js` (weekly DB backup → Google Drive), `fairScheduleService.js`.

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

1. **Two-tier merge** — Standard / Admin·5 / Admin·10 collapsed to **Basic + Pro**; roles `basic→standard_user`, `pro→admin_user`; seats 3 / 25; new EUR pricing (19/49/179 · 39/99/359); legacy keys kept for back-compat via `canonicalPlan()`.
2. **Code-first onboarding (trial removed)** — accounts start LOCKED; unlock via **promo code** (`/redeem`) or paid plan; **LockedWelcome** panel for never-activated users; Google OAuth sign-in; promo-expiry reminder cadence.
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

---

## 16. Where to look (for AI tooling)

| Topic | File |
|---|---|
| Roles / plans / prices | `server/constants/roles.js` |
| Subscription state machine | `server/services/subscriptionService.js` |
| Promo codes / referrals | `server/services/promoCodeService.js`, `referralService.js` |
| Sub-seat lifecycle | `server/services/subSeatService.js` |
| Lead routing | `server/services/leadRoutingService.js` (+ tests) |
| LHC scoring engine | `server/controllers/lhc/lhcScoring.js`, `lhcShared.js` |
| LHC modules | `server/controllers/lhc/*Controller.js` (employment, tax, gdpr, etc.) |
| HR / employees | `server/controllers/employeeController.js`, `server/routes/employees.js` |
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

*End of overview. Last updated: 2026-08-10.*
