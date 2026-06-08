# Nexa — Product & Business Overview

> A complete snapshot of the Nexa ecosystem as it stands today: business model, product surface, technical architecture, pricing, user roles, marketing channels, and the satellite-site network. Intended as a context briefing for AI tools, advisors, and stakeholders.

---

## 1. The one-paragraph pitch

Nexa is a **business operations ecosystem for small and medium firms in North Macedonia**. The core product is **Nexa Terminal** — a SaaS platform that automates legal documents, runs compliance health checks, provides AI legal/marketing assistance, and analyzes contracts. Around the Terminal, Nexa operates a network of **SEO + GEO optimized satellite sites** that attract real prospects in specific legal and business niches, then route those inbound leads to the firm's paying Admin users. A separate property — **Topics.nexa** — lets those Admin users publish expert Q&A content, building authority that the satellite sites and Google + AI assistants surface back to potential clients.

The pitch on the homepage tells this as a 3-act story:
1. **Part 1 — We bring clients to you** (satellite sites + lead routing)
2. **Part 2 — We make you visible as an expert** (Topics.nexa)
3. **Part 3 — Automate your operations** (Terminal trial)

---

## 2. Pricing model

All prices in **EUR**, using **9-ending psychological pricing**. Three plans × three billing cycles. Each card on the public pricing page is a single clickable Link → `/login`; the green trial banner at the bottom reads **"Пробајте бесплатен период, без обврска"** (Try the free period, no commitment).

| Plan | Monthly | Quarterly | Yearly | Save (Q / Y) |
|---|---:|---:|---:|---|
| **Стандарден** (Standard, 1 user) | €39 | €99 | €359 | 15% / 23% |
| **Admin · 5** (team of 5) | €79 | €199 | €719 | 16% / 24% |
| **Admin · 10** (team of 10) | €149 | €379 | €1.349 | 15% / 25% |

The cycle toggle on the pricing page shows approximate discount chips: **−15%** quarterly, **−24%** annual.

### What each plan includes

**Стандарден** — Terminal-only, individual user:
- Automated documents (up to 3 templates)
- Business news feed
- Legal compliance health check
- HR / operational health check
- Marketing health check
- Contract analysis (legal + commercial risk)
- AI legal assistant

**Admin · 5** — everything in Standard, plus:
- Team of up to 5 sub-seat users
- Unlimited access to all document templates
- Monthly appearance in the Nexa newsletter
- Presence on Nexa satellite sites
- Expert answers on Nexa Topics
- Priority support

**Admin · 10** — everything in Admin · 5, plus:
- Team of up to 10 sub-seat users
- Larger AI / document credit pool

### Subscription lifecycle

```
register ──► trial (8 days, no card) ──► pick a plan
                                          │
                                          ▼
                                   pro-forma invoice
                                   sent by email
                                          │
                          ┌───────────────┴───────────────┐
                          ▼                               ▼
                3-day grace period               payment received
              (auto-granted, one-time             via bank transfer
               while payment processes)                  │
                          │                              ▼
                          └────────────────────► account active
```

Key rules:
- **No credit-card processing**. Payment is by manual bank transfer. The Terminal issues a pro-forma invoice on plan selection.
- The **3-day grace period is granted automatically** the first time a user submits a plan request after the trial, so they don't lose access while their payment is in transit. It's a one-time grant — after it's used, the user has to wait for actual payment to unlock again.
- **Trial expiration → suspended** state. The user can still navigate the Terminal freely (data is preserved) but feature endpoints return HTTP 402, which the React client catches and opens the in-Terminal **SubscriptionGate** modal.
- A daily cron job sends reminder emails (2 days before trial end, on expiration, 14 days before renewal, 3 days before, on renewal day) using a bilingual MK/EN email template set.
- Standard users cannot subscribe to Admin plans and vice versa — the SubscriptionGate enforces this with a clear "Available only at registration" message.

### Server-side pricing source of truth

Defined in `server/constants/roles.js`:

```js
const PLAN_PRICES = {
  standard: { monthly: 39,  quarterly: 99,  annual: 359  },
  admin_5:  { monthly: 79,  quarterly: 199, annual: 719  },
  admin_10: { monthly: 149, quarterly: 379, annual: 1349 }
};
const PLAN_CURRENCY = 'EUR';
```

Same prices echo across: `Pricing.js`, `SubscriptionGate.js`, `schemaGraph.js` (JSON-LD), payment-instruction emails, and all i18n descriptors.

---

## 3. User roles

| Role | Description | How they get it |
|---|---|---|
| `standard_user` | One-seat user. Owns their own Terminal account. | Self-registration at `/login`. |
| `admin_user` | Owns an Admin · 5 or · 10 plan; can invite sub-seats. | Self-registration with `intendedPlan: 'admin_5'` or `'admin_10'`. |
| `sub_seat` | Created by an Admin user. Uses Terminal under the admin's subscription pool. | Invited via the Admin user's Team page. |
| `admin` | Platform operator (Martin). Bypasses all gating. | Set manually in DB. |

### Sub-seat invitation flow

The Admin user goes to `/terminal/team` and creates a seat. The form requires:
- Email address (becomes the username, lowercased on store)
- Full name (optional)
- **Company mode** (no default — must be explicitly chosen):
  - **Shared** — the sub-seat uses the parent's `companyInfo`. Updates to the parent's profile propagate automatically (via `updateMany` in `userController.updateProfile`). Designed for one company adding internal users.
  - **Independent** — the sub-seat fills in their own company info via the CompanyInfoPrompt modal that appears on first visit to `/terminal/documents`. Designed for B2B service-provider scenarios where one Admin reseller provisions standalone tenants for different end customers.

The backend (`subSeatService.invite`):
- Generates a memorable 4-word + 4-digit temp password
- Hashes it with bcrypt (10 rounds)
- Creates the user with `mustChangePassword: true`, `role: 'sub_seat'`, `parentSuperUserId: parent._id`
- Returns the **plaintext temp password** in the response (shown once)

The frontend Team page renders a **credentials card** with copy buttons for username + temp password. The Admin can also reset a seat's password later, revoke a seat, or reactivate a revoked seat (all atomic operations).

### Sub-seat login + first-login behavior

- Lookup is **case-insensitive** on username (stored lowercase at write; lookup lowercases input — fixed in commit `5d0e737`)
- On first login, the JWT response includes `mustChangePassword: true`
- `PrivateRoute` reads this and redirects to `/terminal/change-password` until cleared
- Credits used by a sub-seat are debited from the **parent admin's credit pool** (via `resolveCreditBearerId` in `creditMiddleware.js`)
- Sub-seats don't carry a subscription record of their own; their access is gated transitively through the parent admin's effective status

---

## 4. The Terminal — feature inventory

`https://nexa.mk/terminal/*` — Macedonian-only (the public site is bilingual; the Terminal is locked to MK).

### Dashboard (`/terminal`)

Two-column layout (sidebar + main content area). Main column shows:
- **Брзи дејства** (Quick actions) card with three text-only shortcut columns:
  - **Шаблони** (Templates): Договор за вработување · Спогодба за престанок · Одлука за годишен одмор · Сите →
  - **Проверки** (Checks): Правна проверка · HR и оперативна · Маркетинг проверка · Сите →
  - **AI алатки**: Правен AI помошник · Анализа на договор · Маркетинг AI · Сите →
- A minimal text filter bar above the feed for blog categories (Сите · Претприемништво · Правни · Инвестиции · Маркетинг · …)
- Blog post cards (image + title + 2-line excerpt + tags + like/dislike reactions)

### Document automation

- **50+ DOCX templates** organized by category (employment, contracts, obligations, personal data protection, other)
- Each template = a React form + a `docxtemplater` template + a controller in `server/controllers/autoDocuments/`
- All documents pull company data from `user.companyInfo` (or parent's, for shared sub-seats)
- 13-digit EMBG/PIN validation per Macedonian standard
- **Custom templates**: users upload a .docx, mark placeholder fields, and generate new documents from their own forms (My Templates page)

### AI assistants

- **Правен AI** (`/terminal/ai-chat`) — legal Q&A
- **Маркетинг AI** (`/terminal/marketing-ai`) — marketing strategy and content
- **Анализа на договор** (`/terminal/contract-analysis`) — uploads a .docx contract, extracts legal + commercial risks, termination clauses, penalties, licenses, liability

### Compliance health checks (`/terminal/*-screening`)

Structured questionnaires that produce a prioritized risk report:
- **Правен** (legal) — labor law, contracts, company structure compliance
- **HR и оперативен** — workplace regulations, safety training, employee documentation
- **Маркетинг** — content compliance, lead-gen ethics, advertising rules
- **Сајбер безбедност** — security posture, data protection, GDPR-like requirements

### Admin user features (`/terminal/admin-user/*`)

Visible only to `role: 'admin_user'`:
- **Преглед** — dashboard with seat usage, recent leads, subscription state
- **Клиенти** (Leads inbox) — leads that match the admin's practice area + city, with **first-to-claim** semantics (atomic `findOneAndUpdate` in `leadsService.claim`). Status enum: `unclaimed → offered → claimed | dismissed`.
- **Тим** (Team) — sub-seat management: invite, reset password, revoke, reactivate; each card shows seat usage status and the credentials card during onboarding

### Platform admin features (`/terminal/admin/*`)

Visible only to `role: 'admin'` (Martin). Sidebar groups them into collapsible dropdowns:
- **Блогови** → Управувај блогови · Додади блог
- **Корисници** → Сите корисници · Претплати
- **Маркетплејс** → Клиенти · Провајдери на услуги · Барања за понуди
- **Управување со Chatbot**

User detail modal on the "Сите корисници" page supports: copy-credentials, password reset (sends an email), role change with guardrails, and (planned) usage statistics from the `user_analytics` and `activity_logs` collections.

### Education

`/terminal/education` — course library with category filter (Сите · Правни · Маркетинг · Менаџмент). Currently four real courses:
- Работни односи
- Удел во трговско друштво
- Извршување врз недвижности
- Локално SEO

(Coming-soon placeholders were removed for a cleaner first impression.)

---

## 5. The satellite sites (Nexa ecosystem)

Five SEO + GEO optimized properties, each owning a specific topic in Macedonian legal/business space. They serve two purposes:
1. **Independent value** for visitors searching that specific topic
2. **Lead generation** — visitors who fill a contact form become leads routed to Admin users

### `samodaprasham.mk` — citizen legal questions

Target audience: **individuals** with legal questions in Macedonian — inheritance, divorce, criminal defense, property disputes, employment.

Pitch on the Nexa homepage: *"Citizens have legal questions. Some are serious cases. Many need real representation — not just information."*

Visitors typically arrive via long-tail Google queries like *"кој наследува без тестамент во Македонија"*. The contact form on the question page routes the matter to a lawyer in the matching practice area.

### `immigration.mk` — residence permits for foreigners

Target audience: **foreign citizens, investors, and workers** in or moving to North Macedonia who need residence permits — issuance, renewal, change of purpose.

Pitch: *"Foreigners need expert help with residence permits. These visitors come with clear intent to pay — often for an urgent case."*

High commercial intent: someone who searches *"residence permit Macedonia"* in English is generally ready to pay a local advisor.

### `macedoniancitizenship.mk` — diaspora & descendants

Target audience: **people of Macedonian origin** living abroad (Australia, US, Canada, Europe) applying for citizenship through origin, marriage, or investment routes.

Pitch: *"The diaspora seeks to reclaim citizenship. These cases need legal guidance and document preparation over months, not weeks. That is specialist work."*

Long-cycle, high-ticket case work. The visitor is usually willing to engage a Macedonian lawyer over months.

### `company.nexa.mk` — company registration

Target audience: **founders and new entrepreneurs** setting up a ДОО / ДООЕЛ / АД, registering with the Central Registry, changing owners, opening branches.

Pitch: *"Entrepreneurs are looking to register a company. They need an accountant and a lawyer from day one."*

Pairs the lead with both a legal advisor and a bookkeeping partner.

### `iplaw.nexa.mk` — intellectual property

Target audience: **growing companies and innovators** dealing with trademarks, patents, copyrights, licensing.

Pitch: *"Brands and innovators need protection. These clients are already successful — they can afford professional services and pay for quality."*

Lower volume than `samodaprasham.mk`, but each lead is high-value.

### Why this works (SEO + GEO)

- Each site is optimized **for classic Google search**: clean URLs, structured data, fast pages, expert-authored content
- Each site is also optimized **for AI assistants (GEO)**: clear factual content, FAQ schema, llms.txt, direct answers in the text. When someone asks ChatGPT *"how do I register a DOO in Skopje"*, the AI surfaces our pages
- Content is **written or reviewed by licensed professionals** (no plagiarism, no auto-generated content) — this is a positioning + compliance choice
- The number of satellite sites is **not exposed** on the homepage copy (the previous "5 satellite sites" was changed to "network of specialized sites") so the count can grow without forcing copy updates

---

## 6. Topics.nexa — expert Q&A platform

A separate property: `topics.nexa.mk`. Different role from the satellite sites:
- Satellites = bring leads in
- **Topics = make Admin users visible as experts**

Admin users (paying Admin · 5 / · 10) publish expert answers on Topics. Those answers:
- Become public, SEO + GEO optimized content owned by the Admin user's profile
- Get surfaced by Google when users search the question topic
- Get cited by AI assistants when they answer related queries
- Build authority that drives direct outreach to that Admin user

On the homepage, this is presented as a hero card with three mock Q&A cards (Како се пресметува отпремнина? · ДДВ за SaaS услуги од странство? · Регистрација на заштитен знак — чекори?) — a visual hint of what the platform contains.

The benefit framing: *"Direct promotion through expertise, not ads. Content targets what people already search for. AI assistants cite your answers in responses."*

---

## 7. Marketing channels for Admin users

Admin plans (· 5 and · 10) buy more than seat capacity. They buy distribution. Four promotional channels:

1. **Monthly Nexa newsletter feature** — once per month, the Admin user gets a monthly article appearance to the newsletter list. SEO compounds because the newsletter pages are public.
2. **Presence on satellite sites** — Admin users in matching practice areas + cities are surfaced in directory-style components on the relevant satellite (`samodaprasham.mk` for general legal, `immigration.mk` for immigration cases, etc.)
3. **Topics.nexa publishing** — expert Q&A platform, SEO + AI assistant indexing
4. **Lead routing** — inbound contact forms on satellite sites route to Admin users by practice + city. First Admin to claim wins.

The pitch line on the public site (Part 1 of the story): *"We run a network of specialized sites. Each covers a specific need, each targets visitors with clear intent to pay. Those visitors — your clients."*

---

## 8. Public website structure

`https://nexa.mk/*` — bilingual MK/EN. Formal address (Вие / Вашиот / Ве) across all MK copy.

### Information architecture

| URL | Purpose |
|---|---|
| `/` | Home — 3-act story (Part 1 satellites · Part 2 Topics · Part 3 Terminal final CTA) |
| `/about` | Full ecosystem explanation, sidebar TOC, FAQ, contact, legal entity disclosure |
| `/pricing` | Minimal intro + 3 cards + pro-forma invoice flow explainer |
| `/contact` | Email + company info + JSON-LD Contact schema |
| `/blog` and `/blog/:slug` | Marketing content, indexed by category |
| `/terms-conditions` | Legal — Macedonian commercial terms |
| `/privacy-policy` | GDPR-equivalent privacy policy, NEKSA AMD as controller |

The navbar holds four items (Екосистем · Цени · Блог · Контакт) — **right-aligned**, with the logo on the left and Login + language switcher at the far right.

### Home story flow

1. **Hero** — pill *"Деловен екосистем за мали и средни фирми во Македонија"*, gradient H1 *"Целиот ваш бизнис, во еден екосистем."*, two CTAs (Try the Terminal + See plans), tertiary link to About
2. **Ecosystem intro** — *"Nexa е целосен екосистем кој го надградува Вашиот бизнис. Не е само алатка. Прво Ви ги автоматизира внатрешните процеси... Потоа Ви носи нови клиенти преку мрежа од специјализирани сајтови. И на крај, Ве прави видлив како експерт во Вашата област."*
3. **ДЕЛ 1 · Носиме клиенти кај Вас** — compact 3-col grid of satellite cards (image + tag + title + body + audience + Посети link)
4. **ДЕЛ 2 · Ве правиме видливи како експерт** — Topics.nexa hero card (text + bullets + 3 mock Q&A cards stacked at angles)
5. **ДЕЛ 3 · Автоматизирајте го Вашето работење** — dark ink section, 2-col hero with gradient-fill title, 4 feature bullets, glassmorphism Terminal mock cards (Документ генериран · Скрининг во тек · AI одговор)

### Visual language

- **Aurora gradient hero backgrounds** with floating colored orbs (only on selected hero sections)
- **Brand palette**: 50→900 slate-blue (`--nx-primary-*`), teal accent (`--nx-teal`), Inter typeface, custom `--nx-*` CSS variables
- **Cards**: white with 1px slate border, soft 1-2px shadow, hover lifts 3px + tints border blue
- **Glass effects**: `backdrop-filter: blur()` for the final-CTA mock cards on dark
- **Animations**: fade-in-up entrance + IntersectionObserver scroll-reveal hook
- **Chapter markers**: short primary-blue underline accent + uppercase eyebrow + 26-40px title

### Pricing page structure

- Minimal centered intro (eyebrow ЦЕНИ + headline + 1-line lead)
- Cycle toggle (Месечно / Квартално / Годишно)
- Three plan cards — each is a single `<Link>` to `/login`; bottom of each card is a **bright green trial banner** (no button look) reading *"Пробајте бесплатен период, без обврска →"*
- Footnote: *"Сите цени се без ДДВ."*
- Payment-flow explainer below: 4-step horizontal flow connected by a gradient hairline (Пробен период → Изберете план → Прими профактура → Уплати и користи)

### SEO

Per-page via `SEOHelmet`:
- Canonical URL
- Open Graph (title, description, url, image 1200×630, locale, site_name)
- Twitter Card (summary_large_image)
- hreflang triplet (mk / en / x-default)

Per-page via `schemaGraph.js`:
- `NEXA_ORG` (Organization, with legal entity NEKSA AMD DOOEL Skopje)
- `NEXA_WEBSITE`
- `webPage()`, `breadcrumb()`, `faqPage()`
- `superUserService()` (Service offer with 3 EUR Offer entries)
- `terminalProduct()` (Product offer)
- `personMartin` (for author attribution on legal pages)
- `contactPage()` for /contact

### GEO

- `llms.txt` at the site root — concise structured TL;DR + sections (what we are · ecosystem properties · operator · citation guidance) — the GEO-standard format that AI assistants check first
- Mobile-friendly: viewport meta WITHOUT `maximum-scale=1` (pinch-zoom works, no a11y / SEO penalty)
- `robots` meta with `max-image-preview:large` and `max-snippet:-1` so AI assistants and rich snippets can preview the full page

### Bilingual handling

- Default language = MK
- Language stored in `localStorage` and toggled via `?lang=` query param or the navbar switcher
- Terminal forces MK regardless of browser/locale (the Terminal is MK-only by design — keeps document generation deterministic)
- Public pages dual-render via `useTranslation('website')` against `mk.json` and `en.json` namespaces

---

## 9. Lead routing system

The leadgen flow is the differentiating feature that distinguishes Nexa from a plain SaaS.

### Inbound webhook

External lead source (a satellite-site contact form) POSTs to:
```
POST /api/leads/inbound
```
with body:
```json
{
  "site": "immigration.mk",
  "practiceArea": "immigration",
  "city": "Skopje",
  "name": "...", "email": "...", "phone": "...",
  "question": "Free-text..."
}
```

Authenticated by an **HMAC-SHA256 signature** in the `X-Nexa-Signature` header (computed over the raw body + a shared secret). `leadWebhookHmac.js` middleware verifies before the controller runs.

### Routing logic

`leadRoutingService.pickAssignee(lead, candidates)` — a pure function with 12 inline unit tests — selects a single Admin user from candidates whose `superUser.practiceAreas` and `superUser.city` match the lead. Tiebreakers: roundRobin by last claim timestamp, fairness across recent volume.

### Status enum

```
unclaimed → offered → claimed   (success path)
                   ↘ dismissed   (admin user declined)
```

`leadsService.claim(leadId, userId)` is a single **atomic `findOneAndUpdate`** with the filter `{ status: 'offered', offeredTo: userId }`. First Admin to call it wins; the rest receive 409 Conflict. No auctions, no overlapping ownership.

### Notification surface

Three places an Admin sees a new lead:
1. **In-app dashboard tile** on `/terminal/admin-user`
2. **Email** sent via Resend (with Gmail/Nodemailer fallback)
3. **Live Socket.io event** for users currently in the Terminal

### Stale-lead reaper

A daily cron job (`leadRoutingService.tryAutoAssign`) reassigns leads that have been `offered` to a specific Admin for more than N hours without claim, falling back to the next candidate in the routing pool.

---

## 10. Subscription & access enforcement

### State machine

```
trial ──► pending_approval ──► active ──► renewal cycles
   │              │                │
   │              └─► (admin reject) ──► suspended
   │                                          │
   └─► (trial expires) ─► suspended ◄─────────┘
                              │
                              ▼
                          cancelled (one-click reactivate possible)
```

Implemented in `server/services/subscriptionService.js`:
- `startTrial(userId)` — idempotent. Sets `subscription.status: 'trial'`, `endsAt = now + 8 days`. Auto-called at registration; also backfilled by the `/me` controller and by the `subscriptionGuard` middleware so any user without a subscription record gets a fresh trial on first hit (prevents the "Сметката е суспендирана" bug on first-time users).
- `requestApproval(userId, { plan, cycle })` — moves to `pending_approval`. If user is post-trial AND grace not yet used, atomically grants the 3-day grace via `findOneAndUpdate` with `gracePeriod.used: false` filter (race-safe — concurrent requests can't double-grant).
- `approve(userId, { plan, cycle, invoiceNumber })` — moves to `active`, sets `endsAt` based on cycle (30/90/365 days).
- `reject`, `suspend`, `extend`, `cancel` — admin operations.
- `effectiveStatus(user)` — resolves status, handling the sub-seat → parent transitive case.
- `hasFeatureAccess(user)` — single rule: access iff trial/active unexpired OR grace active.
- `grantGracePeriod(userId)` — standalone, atomic, race-safe.
- `computeDueReminder(user)` — daily cron uses this to decide which (if any) email to send.

### Daily cron

`subscriptionScheduler.js` runs once per day:
- Sends reminder emails per `REMINDER_SCHEDULE` (trial-2d, trial-expired, renewal-14d, renewal-3d, suspended)
- Auto-grants the 3-day grace to users who have a `requestedPlan` but no active subscription yet
- Transitions trials with no payment intent to `suspended`

### Gate (middleware)

`subscriptionGuard.js` is applied to feature routes: `/api/auto-documents`, `/api/custom-templates`, `/api/marketing-documents`, all health-check routes, chatbot, marketing-bot, contract-analysis.

Behavior:
- Platform admin bypass
- Trial / active / active-grace → pass through
- Anything else → HTTP 402 with `code: SUBSCRIPTION_*` and the subscription state in the response body

### Gate (frontend)

A global axios interceptor catches 402 responses and dispatches a custom `subscription:blocked` window event. `SubscriptionGate.js` is mounted globally inside `PrivateRoute` and listens for that event. When fired, it opens a single-screen modal:
- 3 plan tiles (Standard · Admin · 5 · Admin · 10) — vertical card layout, name + short tag + current-cycle price, soft hover lift
- Active plan's description in a slate-tinted panel below the tile grid
- Cycle toggle (Месечно · Квартално · Годишно), flex-column buttons with separate label + price lines
- Email field (only if user has no email; otherwise shows the email it'll be sent to)
- Single primary button: **Нарачај** (Order) — issues a `/api/subscription/request-invoice` POST that auto-grants grace if eligible
- Fineprint: *"По нарачката добивате 3 дена дополнителен пристап..."*

### SubscriptionStatusBanner

Slim strip at the top of every Terminal page. Variants:
- **Trial** — *"Пробен период — остануваат N денови. Изберете план за да го задржите пристапот."*
- **Grace** — *"Грејс период — останува N денови. Извршете уплата..."*
- **Renewal coming up (≤14d)** — *"Претплатата истекува за N денови..."*
- **Pending approval** — informational, no CTA
- **Suspended** — *"Сметката е суспендирана..."*
- **Cancelled** — *"Претплатата е откажана..."*

Clicking the CTA dispatches the same `subscription:blocked` event so the user stays inside the Terminal — never bounced back to the public `/pricing` page.

---

## 11. Email system

Provider stack: **Resend (primary) → Gmail/Nodemailer (fallback)**, configured in `server/services/emailService.js`. Templates live in `server/emails/subscriptionEmails.js` and elsewhere.

Subscription-related templates (bilingual MK/EN):
- `trialEndingIn2Days`
- `trialExpired`
- `subscriptionPending`
- `subscriptionApproved`
- `subscriptionRejected`
- `renewalIn14Days`
- `renewalIn3Days`
- `subscriptionSuspended`
- `adminApprovalNeeded` (to Martin when a user submits a plan request)
- `subSeatInvite` (with credentials)
- `paymentInstructions` (pro-forma invoice with bank details from env vars)
- `graceBegun`

Bank details for the pro-forma invoice are pulled from environment variables, not hardcoded.

---

## 12. Macedonian-language rule

Across the **public website**, the formal address is used:
- **Вие** (you) instead of *ти*
- **Вашиот / Вашата / Вашите** instead of *твојот / твоjата / твоите*
- **Ве / Ви** instead of *те / ти*
- Imperative verbs in formal plural: **Започнете / Изберете / Контактирајте / Пробајте** instead of *Започни / Избери / Контактирај / Пробај*

This is consistent across all public copy (Home story flow, Pricing, About, Contact, FAQ, satellite-card descriptions, CTAs, navbar labels, footer).

The Terminal interior (Macedonian-only) uses a mix appropriate to in-product context.

---

## 13. Technical stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express |
| Database | MongoDB native driver (no Mongoose) |
| Auth | Passport JWT |
| Frontend | React 19 + React Router 6 + i18next |
| Styling | CSS Modules + custom `--nx-*` design tokens, no Tailwind / no UI library |
| Document generation | docxtemplater |
| Email | Resend + Nodemailer (Gmail fallback) |
| Realtime | Socket.io |
| Scheduling | node-cron |
| Hosting | Railway (server), Vercel (client) |
| Schema | Inline JSON-LD via `schemaGraph.js` + react-helmet-async |

Security choices:
- **CSRF**: double-submit-cookie pattern in `middleware/csrf.js`, with an `exemptCSRF` allowlist for non-state-changing or programmatic endpoints (lead webhook, subscription requests, etc.)
- **Rate limiting**: per-route IP-based rate limiters on `/api/auth/*`, `/api/credits/*`, etc.
- **HMAC-SHA256** signing on the inbound lead webhook
- **bcryptjs** for password hashing (10 rounds)
- **Helmet** for security headers
- **Joi** for input validation

---

## 14. Legal entity & content compliance

- Operating entity: **Друштво за услуги НЕКСА АМД ДООЕЛ Скопје**
- Address: Бул. Партизански Одреди 102/2-14, Скопје – Карпош
- Contact: +389 78 534 258 · info@nexa.mk
- All public content is written or reviewed by licensed professionals
- Nexa explicitly **disclaims** being a law firm and does not provide individual legal advice — visitors are referred to the Macedonian Bar Association directory
- DPO (Data Protection Officer) duties: contact `info@nexa.mk`
- Cookie + privacy policy disclosed on `/privacy-policy`
- Terms on `/terms-conditions`

---

## 15. Summary of recent product changes (this development cycle)

A compressed list of what shipped, in roughly the order it was built:

1. **Nexa 2.0 public site rebuild** — modernized hero, aurora gradients, glass card system, scroll-reveal, inline SVG icon library; removed fake stats/testimonials per instruction
2. **Three-plan pricing** rebuilt as Standard / Admin · 5 / Admin · 10 (replaced previous Type A/B labels)
3. **Admin user / sub-seat / lead system** — full 7-slice implementation: admin-user model, sub-seat invitation with company-mode picker, lead webhook with HMAC, atomic claim, in-app + email + Socket.io notifications, daily stale-lead reaper
4. **Subscription state machine** — trial → pending → active → renewals; one-time 3-day grace; daily reminders; 8-day free trial without card
5. **Free signup** — username + password only at `/login`; trial auto-started; in-Terminal modal handles plan selection later
6. **Per-invite company-mode picker** — Shared (synced) vs Independent (standalone) — no default, must choose
7. **Public site simplification** — dropped `/for-professionals`, removed "five sites" hardcoding, removed Martin attribution line, removed B2B/lawyer framing on the public copy
8. **Pricing page redesign** — minimal centered intro replaces aurora hero, cards fully clickable as Links, prominent green trial banner replaces buttons, pro-forma invoice 4-step flow explainer added under the footnote
9. **9-ending EUR pricing** — 39 / 79 / 149 base, quarterly ~15% off, annual ~25% off
10. **3-act story flow** on the Home page with Дел 1 / Дел 2 / Дел 3 chapter markers
11. **Compact satellite grid** with themed Unsplash photos (Lady Justice / passport / passport+map / founders / IP sketches) — replaces alternating row-by-row showcase
12. **Topics.nexa hero card** with mock Q&A stack
13. **Final-CTA dark hero** with gradient title, feature bullets, glassmorphism mock Terminal cards (document generated · screening progress · AI answer)
14. **Right-aligned navbar** menu items with logo staying left
15. **Formal MK address** rule applied across all public copy
16. **SEO / mobile hardening** — viewport fix (removed `maximum-scale=1`), canonical + hreflang in `index.html`, robots/format-detection meta, updated default title + description to MK ecosystem framing
17. **Terminal UX polish** — sidebar admin groups (Blogs / Users / Marketplace dropdowns), 3-column shortcut launcher on Dashboard replacing blog-only feed, blog category filter bar with MK display labels (Претприемништво / Инвестиции), education category filter, my-templates icon-button fix
18. **Bug fixes** — trial backfill on `/me` and in subscription guard (prevents "suspended" banner on first-time users); case-insensitive username lookup at login (sub-seats typing email in mixed case no longer get 401)

---

## 16. Where to look (for AI tooling)

If an AI advisor needs source-of-truth files to dig into specific topics, here are the canonical locations:

| Topic | File |
|---|---|
| Pricing constants | `server/constants/roles.js` (`PLAN_PRICES`) |
| Subscription state machine | `server/services/subscriptionService.js` |
| Sub-seat lifecycle | `server/services/subSeatService.js` |
| Lead routing logic | `server/services/leadRoutingService.js` (+ tests) |
| Email templates | `server/emails/subscriptionEmails.js` |
| Public homepage copy | `client/src/pages/website/Home.js` |
| Pricing page | `client/src/pages/website/Pricing.js` |
| Satellite list | `client/src/pages/website/Home.js` (SATELLITES const) + `client/src/components/website/EcosystemMap.js` |
| Subscription modal | `client/src/components/terminal/SubscriptionGate.js` |
| Subscription strip | `client/src/components/terminal/SubscriptionStatusBanner.js` |
| Sidebar groups | `client/src/components/terminal/Sidebar.js` |
| Dashboard feed | `client/src/components/terminal/SocialFeed.js` |
| Schema.org / JSON-LD | `client/src/components/seo/schemaGraph.js` |
| MK translation strings | `client/src/i18n/locales/website/mk.json` |
| Routes table | `client/src/App.js` |

---

*End of overview. Last updated: 2026-05-26.*
