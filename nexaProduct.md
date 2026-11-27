# Nexa — Product & Marketing Master Document

> One document, two parts. **Part I** is the product/engineering snapshot (business model,
> every feature with *why it exists* and *how it works*, roles, tech, where to look in code).
> **Part II** is the go-to-market brief (positioning, funnel, messaging, hard constraints).
> Where they overlap, Part I is the technical source of truth and Part II is the marketing framing.
>
> **Last updated: 2026-11-22 (rev 4).** Rev 4 replaces the Sept 2026 model (public €15/€39
> prices + 8-day trial), which is **no longer true** — see §2 and §17 for what changed.

---

# PART I — Product & Business Overview

## 1. The one-paragraph pitch

Nexa is a **business platform for small and medium firms in North Macedonia** with three lines:

1. **Nexa Terminal for businesses (Basic — nexa.mk) — free forever.** Legal documents, AI
   assistants, compliance checks, HR tools and a **business social network** in one web app.
   SMBs are the demand side: they use the tools, and when they need a human professional the
   platform brings one into the conversation.
2. **Nexa for professionals (Pro — leads.nexa.mk) — invite-only lawyers.** A small, hand-picked
   group of lawyers (cap 20) receives anonymized client cases from Nexa's satellite sites and
   from SMBs' AI conversations, plus visibility tools (Topics Q&A, blog) and case management.
3. **Consulting & project management („Услуги" — nexa.mk/uslugi) — manual, paid per project.**
   Nexa's team leads complex projects (real-estate due diligence, M&A, startups, organisational
   development, market entry) and coordinates licensed partner professionals.

**The core loop for an SMB:** *a check finds the gap → an AI character explains it → a document
fixes it → the system tracks it — and a real lawyer can join the same chat when needed.*

**Stage:** pre-PMF. The live database was reset in Oct 2026 (only the admin account remains);
there are **no paying customers and no public social proof**.

---

## 2. Business model & pricing (current — Nov 2026)

| Line | Who | Price shown publicly | How access works |
|---|---|---|---|
| **Basic / Основен** | SMBs, nexa.mk | **„Бесплатно"** (free forever) | Self-serve signup (Google or email + 6-digit code) → active immediately, never expires |
| **Pro / Про** | Lawyers, leads.nexa.mk | **„По покана"** (invite-only) | Founder invite link or promo code → instant Pro for a **180-day free pilot**; cap **20 Pros** |
| **Услуги** (consulting) | Companies with a complex project | No prices (written proposal per project) | Inquiry form on /uslugi → admin email → free first call → proposal |

**Why this model:** pre-PMF, the bottleneck is liquidity, not revenue. Free Basic maximises SMB
usage (the source of real legal needs); invite-only Pro keeps the supply side small and dense
so every lawyer actually gets cases; consulting is the near-term revenue line that doesn't depend
on platform scale.

**How it works in code:**
- **Free Basic:** `subscriptionService.initFreeBasic` (plan `basic`, status `active`, `endsAt: null`
  = perpetual) runs after email verification and after the Google callback. `hasFeatureAccess`
  (server) and `tier.js` (client) treat `endsAt: null` as never-expiring; `suspendExpired` skips it.
  No trial, no invoice, no expiry. The old 8-day trial (`TRIAL_DAYS = 8`) is dead code.
- **AI is the only metered thing:** each user gets a weekly AI question allowance
  (`ChatBotService.weeklyLimit`, default **4/week**, env `CHATBOT_MAX_PROMPTS_PER_WEEK`). At the limit
  a wall offers „Побарај професионалец" and the Bar directory (mba.org.mk). Messages to a human Pro
  are **free** (never count against the allowance).
- **Pro pilot:** `leads.nexa.mk/join?t=<secret>` (`LEADS_FOUNDER_INVITE_TOKEN`, constant-time check in
  `server/utils/founderInvite.js`) → Google → instant `admin_user` + plan `pro`, `endsAt = now + 180d`.
  Legacy `/redeem?code=` promo codes still work. `PRO_GLOBAL_CAP = 20` is enforced at redemption,
  with a per-city counter for the admin. **Day 180 = silent lock**; the operator extends or closes
  manually — no auto-charge. Internal (never public) list price: **€590/year, annual-only**
  (`roles.js PLAN_PRICES.pro.annual`).
- **Legal-only Pro:** non-legal verticals (real estate, insurance, consulting) are **paused, not
  deleted** — `ACTIVE_PRACTICE_AREAS` (env) limits matching to the 8 legal areas.
- **Billing is switched off, not removed:** `client/src/config/billing.js BILLING_UI_ENABLED = false`
  hides every subscription/expiry/billing UI; billing and reminder emails are disabled server-side
  (`trialReminderScheduler` not started, `subscriptionScheduler.emailsEnabled = false`). The whole
  subscription backend (`subscriptionGuard`, invoices, pro-forma PDFs, admin approvals) is intact
  and can be re-enabled with those switches when paid plans return.
- **Public pricing page removed:** `/pricing` now redirects to the homepage plans section
  (`/#paketi`), which shows „Бесплатно" / „По покана" — never a number.

---

## 3. Two storefronts, one product

One React build and one backend serve two domains:

| | **nexa.mk** (Product A) | **leads.nexa.mk** (Product B) |
|---|---|---|
| Audience | SMB owners, HR, office managers | Lawyers |
| Public home | `Home.js` — Terminal features + plans + services | `LeadsHome.js` — "clients are already searching" |
| Signup | Open, free (`OPEN_REGISTRATION = true`) | Invite only („Побарај пристап" panel otherwise) |
| Terminal layout | Task-based SMB sidebar | Client-acquisition sidebar + „Case Desk" dashboard |

**How:** `client/src/lib/storefront.js getStorefront()` picks the storefront from the host (or
`?storefront=` on localhost). The **interior** layout follows the user's *entitlement*
(`interiorProduct(user)` in `nav.js`), so a Pro who logs in on nexa.mk still sees the lawyer
layout. `SEOHelmet` canonicalises to the active storefront so the two sites don't compete in search.

---

## 4. User roles

| Role | Description | How they get it |
|---|---|---|
| `standard_user` | **Basic** — one company, up to 3 co-worker seats | Free self-signup on nexa.mk |
| `admin_user` | **Pro** — lawyer; up to 25 client accounts | Invite link / promo code on leads.nexa.mk |
| `sub_seat` | Co-worker (Basic) or client account (Pro), runs under the parent's subscription | Invited from `/terminal/team` |
| `regular` | Legacy/locked, no plan | Edge cases only |
| `admin` | Platform operator | Set manually in DB |

**Sub-seat flow:** the parent creates a seat (email + name + **company mode**: *Shared* uses the
parent's company data — the Basic co-worker case; *Independent* fills its own company data — the
Pro client case). `subSeatService.invite` creates the user with a memorable temporary password shown
once, `mustChangePassword: true`; first login forces a password change. Access and AI credits flow
transitively from the parent.

---

## 5. The Terminal — feature inventory (what it is · why · how)

`/terminal/*` — Macedonian only (the public site is bilingual).

### 5.1 Navigation (as built, `client/src/config/nav.js`)

**SMB (Basic) sidebar:**
- **Контролна табла**
- **Администрација** — Документи (Автоматизирани документи · Мои шаблони) · Договори (Мои договори ·
  Анализа на договор) · Проверки (Правна · HR и Оперативна · Сајбер безбедност)
- **Човечки ресурси** — Вработени · Проценка на карактер · Интервјуа (Интервју скен · Излезно интервју) · Работни односи
- **Набавки** — Барање за понуди · Регистар на набавки
- **Маркетинг и раст** — Маркетинг проверка · Банер во билтенот (Клиенти and Виртуелен саем: admin only)
- **Едукација** — Курсеви
- **AI Тим**

**Pro (lawyer) sidebar:** Разговори · Случаи · Теми · Блог · Потенцијални клиенти, then **Алатки**
(Документи incl. Клиентски профили · Анализа на договор · Предмети · Правна проверка · Проценка на
карактер · Интервјуа), Едукација, AI Тим. The Pro dashboard is the **Case Desk** (`ProHome.js`).

**Header (everyone):** Мој профил · Податоци за фирма · Мои податоци · Сметка, plus the notification
bell. **Corner messaging bar** (bottom-right, all terminal pages): AI characters and Pro conversations
as docked chat windows.

### 5.2 Dashboard & social feed

- **What:** the home screen — quick actions, a personalised AI-team greeting, and a **feed** that mixes
  Nexa announcements and blog articles by date, with reactions and comments.
- **Why:** turns the Terminal from a toolbox you open once a month into a place with something new
  every visit — the start of the "social network for small businesses" positioning.
- **How:** `updates` collection + blog posts merged by date. **AI characters author feed posts:** the
  admin pastes a source (a law change, news), `POST /api/updates/admin/draft` drafts it in a
  character's voice (`agentPostService.js`), the admin edits and publishes or schedules it (scheduled
  = future `publishedAt`; members only see `publishedAt <= now`). **Comments on a character's post get
  an AI reply in that character's voice** (cap 10 replies/user/day; kill switch `UPDATES_AI_REPLIES=off`).
  Zero like/comment counts are hidden so an empty network doesn't look empty.

### 5.3 Company profile → one-page website („Мој профил", `nexa.mk/f/:slug`)

- **What:** an optional, free one-page website for the company: full-width **cover photo** and **logo**,
  name, headline, city, earned badges, „За нас", „Што нудиме" cards, „Бараме" (partners/suppliers),
  contact details (email, optional phone, website, social links) and a **contact form**, plus share
  buttons. Owners get a **„Сподели" panel** (copy link, LinkedIn, WhatsApp, Viber, e-mail, native share,
  downloadable **QR code** for business cards) and **results** (views and messages this month, total
  views, the latest messages). No Facebook share button by product decision.
- **Why:** many small businesses have no website. A page they are proud to share brings them clients,
  gives Nexa a reason for them to come back (messages, stats) and every shared page advertises Nexa
  („Страница направена со Nexa · Креирајте бесплатна страница").
- **How:**
  - Fields in `users.publicProfile` (separate from `companyInfo`); `about` (600 chars) and `phone` are
    optional. Profiles stay **optional by rule** and always public; first save goes through feature terms.
  - **Images are uploaded** (resized in the browser — logo 512px, cover 1600px) and stored in MongoDB
    `profile_images` (not on the server disk, which Railway wipes on deploy), served by
    `/api/public/profile/img/:userId/:kind?v=` with long caching. Pasting an image link still works.
  - **Contact form** → `POST /api/public/profile/:slug/contact` (rate limit, honeypot, consent) →
    emailed to the company's contact email with Reply-To = visitor, stored in `profile_messages`.
    The company's email does not have to be shown publicly.
  - **Stats:** one view per browser session → `profile_stats` (monthly); `GET /api/profile/me/insights`.
  - **Search & sharing:** per-profile title, description, cover as share image, JSON-LD
    (ProfilePage → Organization with logo, address, offers, sameAs). Only reasonably complete profiles
    are indexed (`isIndexable`: name + headline + about or offers) and listed in the dynamic sitemap
    (`/api/seo/sitemap.xml`); thin ones are noindex. A Vercel function (`client/api/profile-preview.js`,
    rewrite `/f/:slug`) serves LinkedIn/WhatsApp/Viber previews and AI crawlers real HTML.
  - Earned badges (verified, Pro, „Проверен работодавач", „Основачки член #N" for the first 100) are
    computed, never self-declared. A company directory and follow are not built until there are
    ~20–30 real profiles.
  - Code: `services/profileService.js`, `services/profileSiteService.js`, `routes/profile.js`,
    `routes/publicProfile.js`, `components/profile/ProfileSite.js` + `ShareLinks.js` + `SharePanel.js` +
    `ImageUpload.js` + `ProfileInsights.js`, `pages/website/PublicProfile.js`, `pages/terminal/MyProfile.js`.

### 5.4 Document automation

- **What:** **45+ Word templates** across employment, contracts/obligations, personal data (GDPR),
  accounting decisions, health & safety, **Central Register** packs (company formation ДОО/ДООЕЛ;
  company changes; **capital reduction**, generated phase by phase) and more. The user fills a short
  form and downloads a finished `.docx` with the company's data already filled in.
- **Why:** routine paperwork is the most frequent legal need of an SMB and the easiest win.
- **How:** each template = React form + `docxtemplater` template + controller in
  `server/controllers/autoDocuments/`. Company data always comes from `req.user.companyInfo` (or the
  parent's for shared seats); employee records can prefill employment documents; 13-digit ЕМБГ
  validation. **Share links:** a generated document can be shared via a public link
  (`/dokument/:token`, `/shared/:shareToken`). After generating, the success bar offers
  **„Побарај преглед"** — send the document to a human Pro (see §5.7).
- **Мои шаблони (My Templates):** upload your own `.docx`, mark placeholders, then fill or
  bulk-generate from it (template builder, history, template marketplace).
- **Клиентски профили (Pro):** a lawyer keeps company profiles for clients and generates documents
  for them without switching accounts.

### 5.5 Compliance checks (Проверки — the LHC platform)

- **What:** guided questionnaires that score a company by area and produce a prioritised report.
  Legal: **employment** (full + Parts 1–4), **GDPR** (a/b/c/d maturity), **General**, health & safety,
  archives, protection & rescue, waste management, **tax** (general, payroll, profit, VAT). Plus
  **HR & operational**, **marketing** and **cybersecurity** checks.
- **Why:** SMBs don't know what they're missing; a score with concrete gaps creates urgency and leads
  straight into the fix.
- **How:** one shared scoring engine (`server/controllers/lhc/lhcScoring.js` — fraction model, four
  bands, critical gates). Reports now include: an **AI advisory narrative** („Каде стоите / Што прво да
  средите / Добро е што", grounded only in the findings, cached on the assessment —
  `lhcNarrativeController.js`); **„📄 Подготви"** chips on each gap linking to the document that fixes
  it (a fixed keyword→document map, `lhcDocumentMap.js`, so links can't break); and per-finding
  **„ask the AI"** handoff into the AI Team chat, with the option to bring in a human Pro.

### 5.6 AI Тим — six AI characters

- **What:** six named advisers, each with a fixed personality, specialty and photo:

| Character | Area | Personality | Knowledge source |
|---|---|---|---|
| **Лекс** | Business law | Direct "risk hunter" — straight to the point, always names the risk | Macedonian legal corpus (RAG) |
| **Вера** | HR / employment | Diplomatic, weighs the employee's rights too; refers formal legal risk to Лекс, tax to Дина | Legal corpus, connected to the HR tools |
| **Миа** | Marketing | Fun and energetic, but always concrete steps and numbers | Marketing corpus (separate service) |
| **Стојан** | Insurance | Precise; asks which insurer and policy first, quotes the policy terms word for word | General terms of 7 MK insurers + ASO regulator links |
| **Дина** | Accounting / tax | Calm, "number + deadline" | 13 official accounting/tax documents + live NBRM exchange rates |
| **Борис** | Business consulting | Direct but constructive; numbers first, ends idea reviews with „Што би го убило ова?" + the cheapest test | No corpus yet (business data planned) — sourced web search on official MK sources + live NBRM rates; arithmetic auto-checked |

- **Why:** a named team feels like an advisory office rather than a chatbot, keeps answers in lane,
  and creates natural hand-offs ("this is a question for Дина").
- **How it works:**
  - **One RAG engine** (`server/chatbot/ChatBotService.js`) with per-character profiles
    (`agentProfiles.js`): personality, retrieval scope and its own vector collection (Qdrant:
    legal, insurance, marketing, accounting). Миа runs on `MarketingBotService`.
  - **Hand-offs:** a character can end with a „Префрли се на <име> →" chip that opens the colleague
    with context ("Лекс ме испрати…").
  - **Memory:** per-character threads that resume where you left off; a rolling summary of long
    chats; **🧠 user memory** (up to 30 durable facts about the user/company, shared by the legal
    characters; the user can view, delete or switch it off); a per-character relationship note
    powering "👋 Добредојдовте назад".
  - **Citation check:** every „Член N" the AI cites is verified against the retrieved law text —
    verified citations show as chips with a confidence band; unverified ones get a ⚠ footnote
    (`citationValidator.js`, log `ai_citation_checks`).
  - **Корпа (trash):** deleted chats stay restorable for 30 days, then auto-purge.
  - **Chat anywhere:** full page (`/terminal/ai-chat?agent=`) or a docked chat window that persists
    across pages. Answers render as structured Markdown.
  - Server AI runs on `gpt-5-mini` (utility tasks on a mini model; LHC narrative on a larger model).
  - The old "persona/stance" picker no longer changes answers — the character *is* the personality.
  - **Борис (business consultant, Nov 2026):** own method prompt (`server/chatbot/businessPrompt.js`):
    question types (quick maths → short answer; new idea → 8-area „Скршете ја идејата" stress test;
    pricing/discount/hiring → numbers + decision rule), exact formulas (margin vs markup, price from
    margin, VAT, break-even, discount/price-rise volume, payback, working capital, LTV/CAC), labelled
    numbers (data / assumption / estimate), benchmark ranges labelled as international practice, and a
    "forgotten costs" checklist. Macedonian facts only from sources: business web search
    (stat.gov.mk, nbrm.mk, crm.com.mk, fitr.mk…) runs only when a question needs current facts.
    Every written equation is recomputed and wrong results are corrected (`chatbot/mathCheck.js`).
    Mentions „Услуги" once for big projects (company sale/purchase, market entry). No "invite a
    professional" button (no consultant vertical). A business corpus switches on with
    `QDRANT_BUSINESS_COLLECTION_NAME` — data plan in `tasks/business-consultant-agent-plan.md`.

### 5.7 A real lawyer in the same chat (Pro-in-the-loop)

- **What:** from any AI conversation the user can invite a human professional. The first available
  Pro accepts, joins **the same chat**, and from then on it is a group conversation: user + AI
  character + lawyer.
- **Why:** this is the bridge between the free SMB tools and the paid professional market — the AI
  handles the routine, a human handles the real case, and every such invite is a qualified lead for
  a Pro. It is also Nexa's core differentiator vs. a plain chatbot.
- **How it works:**
  1. **Trigger:** the user clicks „Покани професионалец" (one click, dock or full page), or the AI itself
     suggests it on a concrete personal situation (`[[ASK_PRO]]` marker → inline card „Да, провери /
     Не, продолжи"). Documents can be sent via „Побарај преглед". Copy never promises a Pro will answer.
  2. **Anonymised brief:** only the *current session* (messages with no gap > 1 h, max 16) is summarised
     by AI; names, firms, addresses, emails, phones and ID numbers are stripped (LLM + regex,
     `aiSummaryService.js`, `redactPii.js`). The user stays anonymous to the Pro; the Pro is visible to
     the user.
  3. **Board:** the request is published immediately to all eligible Pros („Отворени барања"). The first
     Pro to claim wins (atomic), after accepting professional-liability terms (`proJoin`).
  4. **Group chat:** once a Pro is invited the **AI goes silent**; it answers only when the user writes
     `@ai` / the character's name or clicks the one-reply invite link. Talking to the Pro is free.
  5. **Controls:** one live invite per conversation, „Откажи покана", „Нов разговор"; pro replies
     appear in the chat and in the corner messaging bar with unread badges.
  6. **No invite emails:** Pros find new invites at login (bell + badge). The admin can remove a
     request from the board („Сите барања").
- Code: `pro_requests` collection, `proRequestsService.js` / `proRequestsController.js`,
  `client/src/lib/proChat.js`, `AIChat.jsx`, `AgentChatDock.jsx`, `MessagingBar.jsx`, `RequestsPage.js`.

### 5.8 Contracts (Договори)

- **Мои договори** — a register of the company's contracts with renewal/expiry reminders (08:00 daily).
- **Анализа на договор** — upload a `.docx` contract; get a structured report of legal and commercial
  risks (termination, penalties, liability, licences) with a commercial rating badge.

### 5.9 Human resources (Човечки ресурси)

- **Вработени** — employee register with **computed leave balances**, reminders (10:00 daily) and
  prefill into employment documents.
- **Проценка на карактер** — a Big Five (OCEAN) personality assessment sent by link to a candidate or
  employee: 33 bipolar questions with reverse-keyed items, server-side scoring, a visual report for the
  owner (radar + ranked narrative), and the respondent receives their own results by email.
- **Интервјуа** — qualitative interviews: **Интервју скен** (candidate soft-skill screen) and **Излезно
  интервју** (exit interview). Suggested questions tuned to industry and role (editable, text or 1–5
  rating, saveable default template), public answer page, then a transcript + AI summary emailed to
  the owner.
- **Работни односи** — shortcut to the employment documents.
- Why: HR is where SMBs most often break the law and lose people; these tools are sticky and rare in
  this segment. Вера (AI) is connected to them.

### 5.10 Procurement (Набавки)

- **Барање за понуди** — request quotes from providers (marketplace; liquidity still thin).
- **Регистар на набавки** — the SMB logs offers per type of purchase (insurance, hosting, accounting…):
  supplier, price, terms, valid-until; cheapest auto-flagged, one marked chosen, and a **renewal date
  triggers a "time to re-quote" email** (11:00 daily). Useful even with no marketplace.

### 5.11 Growth & visibility

- **Клиенти (Продажна инка)** — a simple sales pipeline for every company (Nov 2026: opened to Basic):
  Потенцијални → Контактирани → Испратена понуда → Преговори → Добиени / Изгубени, value in €, next
  step date, won-this-month. `/terminal/sales`, `sales_deals`.
- **Продажба (sidebar, first group, Nov 2026)** — Моја страница · Објави · Клиенти · Понуди. The dashboard opens
  with **„Продажба овој месец"** (accepted quotes, awaiting answer, pipeline, page views, nudges for new
  page messages and overdue steps; an empty account sees three first steps). „Барање за понуди" is
  hidden from the menu until there is supply (admin only).
- **One-pager → client:** „Побарајте понуда" on a service card sends the chosen service with the
  message; in Моја страница each message has **+ Додај во Клиенти** (potential deal, next step
  „Испрати понуда за X").
- **Објави (structured company posts)** — `/terminal/objavi`. Three types only — Понуда / акција
  (discount 5–90 %, free delivery, bundle, trial; audience; valid ≤ 60 days), Бараме (category from a
  fixed list, what, quantity, city; ≤ 30 days), Ново кај нас (kind + 200 chars; 30 days). Fixed forms,
  generated card design, no links/e-mails/phones in text, 1 active per type, 2 a week, page + logo +
  terms required, 3 reports hide a post. Shown in the dashboard feed and on the company one-pager
  („Актуелно"). Actions: „Заинтересирани сме" (message + e-mail to the company), on „Бараме"
  **„Испратете понуда"** (deal + quote for the responder; the poster is notified with the quote link).
  Code: `services/companyPostsService.js`, `routes/companyPosts.js`, `components/posts/*`,
  `pages/terminal/posts/Posts.js`.
- **Понуди (quotes that sell)** — `/terminal/ponudi`. Why: a quote the client accepts with one click
  brings money directly, and it works with the company's own clients outside Nexa (no network needed);
  every quote link also advertises Nexa („Понуда направена со Nexa"). How:
  - Builder: client (prefilled from a deal), items (qty, unit ком./ч./мес.…, price, ДДВ 18/10/5/0),
    discount, ден/€, valid-until, payment/delivery terms, intro. Number ПОН-YYYY-NNN per company.
  - **Private cost per item** → margin shown only to the owner. **Борис** button opens his chat with the
    quote pre-filled (margin, discount cost); **Миа** writes the intro and a follow-up message
    (utility model, 30/day cap, formal capitals enforced in code).
  - Share as a link `nexa.mk/ponuda/:token` (copy, WhatsApp, Viber, e-mail). Public page: branded
    document, print → PDF, buttons **Прифаќам / Имам прашање / Одбивам** (name recorded, not an
    e-signature). noindex. Owner preview (`?preview=1`) doesn't count opens.
  - Tracking: opened (count, last), accepted / declined / question → bell for every event, e-mail to
    the owner for answers. Sending moves the deal to „Испратена понуда" (fills an empty value);
    accepting moves it to „Добиени" with the quote value (MKD converted at 61,5), declining to
    „Изгубени" with the reason. Answered quotes are read-only („Копирај како нова"); expired quotes
    can't be accepted.
  - Code: `services/salesQuotesService.js`, `controllers/salesQuotesController.js`, `routes/sales.js`
    (`/api/sales/quotes`), `routes/publicQuote.js` (`/api/public/quote`), `pages/terminal/sales/Quotes.js`
    + `QuoteEditor.js`, `pages/public/PublicQuote.js`, `lib/quotes.js`.
- **Маркетинг проверка** — marketing health check.
- **Банер во билтенот** — book a banner in the monthly Nexa newsletter (3 slots/month, 1 booking per
  quarter, image + link). Available to Basic; flag `newsletterAds`.
- **„Проверен работодавач"** — public employer check (`/proverka-rabotodavac`) → A / A+ / A++ → a
  shareable circular seal (`/badge/:token`, dynamic SVG), re-shared from „Мојата значка"; also shown
  on the company profile. Framed as self-assessed maturity, never "certified".
- **Blog** — members-only: full posts are a benefit of having a free account; visitors see a teaser,
  and newsletter readers get a signed link that unlocks one post for 30 days. Pros publish under
  their name (Блог).

### 5.12 Pro (lawyer) tools — leads.nexa.mk

- **Случаи (Inquiry Board)** — anonymised client enquiries from the satellite sites. The page opens
  with an animated funnel (sources → envelopes → case base) and shows cases 5 per row with an area
  filter. Pros express interest per case; procedure hints suggest the typical next steps per area.
  Intake: satellite enquiries arrive at info@nexa.mk → the admin pastes the email → **AI drafts an
  anonymised case** for review (`inquiryEmailExtractor.js`); an automatic Resend inbound ingest is
  built but switched off.
- **Разговори / Отворени барања** — invites from SMB AI chats (§5.7).
- **Теми** — answer public questions as an expert (admin worklist curates); SEO + AI-assistant visibility.
- **Блог** and **Потенцијални клиенти** (a light CRM).
- **Предмети (case management)** — cases with deadlines and a timeline, reminders at 7/3/1 days
  (09:00 daily), an AI case brief, and a **public redacted status link for the client**
  (`/predmet/:token` — shows only client-visible items).
- **Клиентски профили** — up to 25 client companies under one account.
- **Weekly lead digest** — every **Monday 09:00** each active Pro gets one email with the newest (≤5)
  open cases as anonymised teasers; skipped if fewer than 2. **This is the only automatic email a
  Pro receives** (`leadDigestService.js`; all other Pro event emails are gated off in
  `utils/proEmailPolicy.js`).

### 5.13 Privacy, trust & account

- **Мои податоци** (`/terminal/my-data`) — see a summary, **export** your data, **erase** AI chats or
  activity history.
- **Feature terms** — consent modals before posting, inviting a Pro (`proRequest`), joining as a Pro
  (`proJoin`), publishing a profile; acceptances are audited.
- **Activity log** (admin) — page views with active time, clicks and write actions per user
  (`user_events`, 90-day retention; GET requests are not logged).
- Privacy policy covers OpenAI processing, the 90-day activity log and the 30-day Корпа.

### 5.14 Education

`/terminal/education` — course library with lessons.

### 5.15 Platform admin (`role: admin`)

Users and subscriptions, Pro cap per city, promo codes, blogs (incl. newsletter unlock links),
feed posts drafted in a character's voice, inquiries (paste-assist), all Pro requests, Topics
worklist, newsletter banners, Proverka funnel analytics, chatbot management, per-user activity log.

---

## 6. Consulting & project management — „Услуги" (nexa.mk/uslugi)

- **What:** five manual services, each with its own bilingual page (1,500+ words: why it matters, a
  typical situation, when you need it, a phase-by-phase roadmap with durations and outputs,
  Macedonia-specific notes, most common mistakes, deliverables, what we need from you, who does what,
  FAQ, inquiry form):
  1. **Due diligence на недвижности** — `/uslugi/due-diligence-nedviznosti`
  2. **M&A — водење проекти и советување** — `/uslugi/m-and-a`
  3. **Советување за стартапи** — `/uslugi/startap-sovetuvanje`
  4. **Организациски развој** — `/uslugi/organizaciski-razvoj`
  5. **Влез на македонскиот пазар** — `/uslugi/vlez-na-pazar`
- **Why:** revenue that doesn't wait for platform scale, built on the team's real experience (10+
  years corporate law, operations leadership in a manufacturing company, M&A and investment deals,
  MK + EN). Pages are written as "we do…" and never present an individual.
- **How it works:** Nexa **leads and coordinates**; legal opinions, notarial acts, tax advice and
  valuations come from **licensed partner professionals** engaged per project. Process: free first
  call → written proposal (scope, phases, timeline, fee) → project management → hand-over. No prices
  on the site. The inquiry form posts to `/api/public/services/inquiry` (rate-limited, honeypot,
  consent required) → stored in `service_inquiries` → emailed to the admin.
- Content lives in `client/src/data/services/*.js` (MK + EN per service); pages `Services.js`,
  `ServicePage.js`; illustrations `ServiceIllustration.js`; photos `public/images/services/`.
- The homepage plans section states clearly that consulting is **not** part of the Terminal plans.

---

## 7. Public website (nexa.mk)

Bilingual MK/EN (formal Вие), language via `?lang=en` or the MK/EN switch.

| URL | Purpose |
|---|---|
| `/` | Home: hero, what the Terminal does, **Пакети** (`#paketi`: Basic „Бесплатно" / Pro „По покана" + "services are separate" note) |
| `/uslugi`, `/uslugi/:slug` | Consulting services (§6) |
| `/login` | Sign-up/login; on nexa.mk a two-column page explaining the Terminal: free forever, 5 key features incl. the business social network. `?mode=register` opens sign-up |
| `/proverka` | Free 15-question compliance check (Google-first, optional email, per-source admin links) |
| `/proverka-rabotodavac`, `/badge/:token` | Verified-employer funnel and public seal |
| `/f/:slug` | Public company profile |
| `/blog`, `/blog/:id` | Blog (members-only full text) |
| `/contact`, `/smetkovoditeli`, `/topics`, `/employment`, `/corporate`, `/trademark`, `/residence` | Contact and topic pages |
| `/privacy-policy`, `/terms-conditions`, `/general-conditions` | Legal |
| `/pricing` | Redirects to `/#paketi` |
| anything unknown | 404 page (noindex) |

**Navbar:** Услуги · Блог · Контакт · MK/EN · Најава во Терминал. **Footer:** Услуги, Пакети, legal
links, ecosystem sites, company details.

### SEO & GEO (search engines and AI assistants)

- **Why:** the site is a React app; without help, crawlers that don't run JavaScript (ChatGPT,
  Claude, Perplexity) saw an empty page, and Google saw a homepage canonical on every URL.
- **How:** after every build, `client/scripts/seo-prerender.mjs` (plain Node, no headless browser)
  writes a real HTML file for each of ~20 public pages with its own title, description, canonical,
  Open Graph image, hreflang (bilingual pages only) and JSON-LD (Organization, WebPage,
  BreadcrumbList, Service, FAQPage, SoftwareApplication), plus the page's full text for crawlers.
  It also generates `sitemap.xml` (with English alternates and images) and **`llms-full.txt`** (full
  text of the key pages for AI assistants). Static tags carry `data-rh` so react-helmet-async
  replaces them in the browser — one canonical per page. `robots.txt` welcomes AI crawlers and blocks
  private links; `llms.txt` is the AI-facing site map.
- When a public page's title or description changes, update both its `<SEOHelmet>` and the
  generator's page table.

---

## 8. Satellite sites & lead sources

Topic sites that answer real questions and send enquiries to info@nexa.mk, which become cases on
the Pro board (§5.12):

- `samodaprasham.mk` — citizens' legal questions · `immigration.mk` — residence permits ·
  `macedoniancitizenship.mk` — citizenship · `company.nexa.mk` — company registration ·
  `iplaw.nexa.mk` — IP · `topics.nexa.mk` — expert Q&A.
- Non-legal sites (`osiguran.nexa.mk` insurance, `properties.nexa.mk` real estate, `tax.nexa.mk`
  accounting) exist but their supply side is **paused** with the legal-only Pro model.
- Second lead source: **SMB AI conversations** (§5.7).
- Satellite domains are hard-coded in several files (`EcosystemMap.js`, `PublicFooterV2.js`,
  `schemaGraph.js`, `LeadsHome.js`, `Leads.js`, locales) — grep `iplaw` before adding one.

---

## 9. Email policy

Resend (primary) → Gmail fallback, `server/services/emailService.js`.
- **SMB users:** verification code, password reset, HR results (character/interview), reminders they
  set up (contracts, procurement, HR), notifications on their own Pro conversations.
- **Pros:** **only** the Monday lead digest.
- **Admin:** service inquiries, operational heads-ups.
- **Off:** all billing, trial, renewal and expiry emails (switchable back on).

---

## 10. Schedulers (node-cron, Europe/Skopje)

`contractReminderScheduler` 08:00 · `caseReminderScheduler` 09:00 · `leadDigestScheduler` Mon 09:00
(idempotent per ISO week) · `hrReminderScheduler` 10:00 · `procurementReminderScheduler` 11:00 ·
`subscriptionScheduler` (suspends expired Pro pilots; emails off) · `backupScheduler` (weekly DB
backup → Google Drive) · `creditScheduler` · `fairScheduleService`. `trialReminderScheduler` is
disabled.

---

## 11. Access enforcement (kept for when billing returns)

`subscriptionGuard.js` protects feature routes (documents, checks, AI, HR, contracts, cases, Pro
routes); platform admin bypasses; anything inactive → HTTP 402 → the client opens `SubscriptionGate`.
With free perpetual Basic and pilot Pros, the guard mostly matters for expired pilots and legacy
accounts. State machine and invoice flow are in `subscriptionService.js` (unchanged, dormant).

---

## 12. Technical stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express, MongoDB native driver (no Mongoose) |
| Frontend | React 19, React Router, i18next, CSS Modules + `--nx-*` tokens |
| Auth | JWT + Google OAuth (Passport); email 6-digit verification |
| Documents | docxtemplater |
| AI | OpenAI (`gpt-5-mini` default; mini model for utility tasks), RAG over **Qdrant** collections (legal, insurance, marketing, accounting), citation validator |
| Email | Resend + Nodemailer fallback |
| Realtime / jobs | Socket.io, node-cron |
| Hosting | Vercel (client, `main` = production), Railway (server) |
| SEO | react-helmet-async + `schemaGraph.js` + post-build prerender |

Security: CSRF double-submit (public routes mounted before it), rate limiting, HMAC lead webhook,
bcrypt, Helmet, Joi validation, PII redaction for anything shown to Pros.

---

## 13. Legal entity & content compliance

- **НЕКСА АМД ДООЕЛ Скопје** (Company for Services NEKSA AMD DOOEL Skopje), Бул. Партизански Одреди
  102/2-14, Скопје – Карпош · +389 78 534 258 · info@nexa.mk.
- Nexa is **not a law firm** and gives no individual legal advice. Trust comes from cited law and
  update dates; **never** "checked by a lawyer". AI answers are informational; a Pro who joins a
  conversation is professionally responsible for their own advice (stated to both sides).
- Consulting: Nexa leads projects; legal opinions come from licensed partner lawyers.

---

## 14. Known gaps (be honest about these)

- **No users yet** — the feed, board and marketplaces are empty rooms; don't market them as busy.
- Marketplace surfaces (Барање за понуди, Виртуелен саем, Find-a-lawyer, Investments) lack liquidity;
  Fair is admin-only.
- The public `/contact` form posts to the HMAC-protected lead webhook and likely fails in production
  (the services form uses its own working endpoint).
- leads.nexa.mk shares the build: crawlers without JavaScript see the nexa.mk homepage text there.
- Many public pages outside the homepage, services and legal pages are Macedonian-only.

---

## 15. Where to look (for AI tooling)

| Topic | File |
|---|---|
| Plans, prices (internal), caps, practice areas | `server/constants/roles.js` |
| Free Basic / Pro pilot / subscription | `server/services/subscriptionService.js`, `server/utils/founderInvite.js`, `client/src/config/billing.js` |
| Storefronts & navigation | `client/src/lib/storefront.js`, `client/src/config/nav.js`, `client/src/lib/tier.js` |
| AI characters | `server/chatbot/agentProfiles.js`, `ChatBotService.js`, `MarketingBotService.js`, `client/src/config/aiAgents.js` |
| AI memory / citations / trash | `server/services/userMemoryService.js`, `server/chatbot/services/agentMemoryService.js`, `server/chatbot/citationValidator.js`, `server/chatbot/services/ConversationService.js` |
| Pro in the chat | `server/services/proRequestsService.js`, `controllers/proRequestsController.js`, `services/aiSummaryService.js`, `client/src/lib/proChat.js`, `components/chatbot/AgentChatDock.jsx`, `MessagingBar.jsx`, `pages/terminal/proRequests/RequestsPage.js` |
| Inquiry board & intake | `server/services/inquiriesService.js`, `inquiryEmailExtractor.js`, `client/src/pages/terminal/Leads.js`, `components/terminal/CaseFunnel.js` |
| Lead digest / Pro email policy | `server/services/leadDigestService.js`, `server/utils/proEmailPolicy.js` |
| Cases (Предмети) | `server/services/casesService.js`, `routes/cases.js`, `routes/publicCases.js` |
| Feed & character posts | `server/services/agentPostService.js`, updates routes |
| Company one-pager | `server/services/profileService.js`, `profileSiteService.js`, `routes/profile.js`, `routes/publicProfile.js`, `client/api/profile-preview.js`, `client/src/components/profile/*`, `pages/website/PublicProfile.js` |
| LHC engine & report | `server/controllers/lhc/lhcScoring.js`, `lhcNarrativeController.js`, `client/src/config/lhcDocumentMap.js` |
| Documents | `server/controllers/autoDocuments/*`, `server/document_templates/` |
| HR | `employeeController.js`, `characterAssessmentController.js`, `hrInterviewController.js` |
| Procurement | `procurementRegisterController.js`, `procurementReminderService.js` |
| Employer badge | `server/routes/publicEmployerBadge.js`, `server/services/badgeService.js` |
| Blog gate | `server/routes/blog.js`, `server/utils/blogNewsletterToken.js` |
| My data / activity | `server/routes/myData.js`, `middleware/requestLog.js`, `routes/activity.js` |
| Services (Услуги) | `client/src/data/services/*`, `pages/website/Services.js`, `ServicePage.js`, `server/routes/publicServices.js` |
| Home plans / signup | `client/src/components/website/PlansSection.js`, `pages/website/Home.js`, `pages/website/Login.js` |
| SEO / GEO | `client/scripts/seo-prerender.mjs`, `components/seo/SEOHelmet.js`, `schemaGraph.js`, `public/robots.txt`, `public/llms.txt` |
| Schedulers | `server/services/*Scheduler.js` |
| Routes table | `client/src/App.js`, `server/server.js` |

---

## 16. Macedonian-language rule

Formal address everywhere public (Вие / Вашиот / Ве; Започнете, Изберете, Контактирајте). Native
business Macedonian, not translation; the Terminal interior is Macedonian-only.

---

## 17. Change log since rev 3 (Sept 30 → Nov 22, 2026)

1. **Model pivot** — Basic free forever (self-serve, perpetual); Pro invite-only lawyers, 180-day free
   pilot, cap 20, non-legal verticals paused; tier onboarding modal removed; billing UI and billing
   emails switched off; public prices removed. *(Replaces €15/€39 public pricing and the 8-day trial.)*
2. **Founder invite link** for leads.nexa.mk (`/join?t=`), no self-serve Pro.
3. **AI Team** — five named characters (Лекс, Вера, Миа, Стојан, Дина) with fixed personalities,
   own corpora (insurance: 7 insurers; accounting: official docs + NBRM rates), hand-offs, per-character
   threads, rolling summaries, two memory layers, citation validator, Корпа, docked chat.
4. **Pro-in-the-loop** — invite a lawyer into the AI chat; anonymised session brief; first-to-claim board;
   group chat with silent AI (`@ai`); free pro messages; one invite per conversation; cancel invite.
5. **Corner messaging bar** for AI and Pro conversations; Pro sidebar „Разговори".
6. **Pro email policy** — only the Monday lead digest; invites email nobody.
7. **Inquiry intake automation** — AI-anonymised paste-assist (auto-ingest built, off).
8. **Cases board refresh** — animated sources → case-base funnel, 5 per row, merged „Друго" filter.
9. **Social layer** — feed with AI-character posts and AI replies to comments; optional public
   company profiles with earned badges and founding-member numbers.
10. **Blog members gate** with signed newsletter unlock links.
11. **LHC report** — AI narrative, document fix chips, AI/human review per finding.
12. **Central Register** — capital-reduction pack, law guides, public document share links.
13. **Privacy** — Мои податоци (export/erase), updated privacy policy, Pro confidentiality terms,
    deep activity log (90 days).
14. **„Услуги"** — five bilingual consulting pages with roadmap, mistakes, FAQ, photos and an inquiry
    form + backend.
15. **Public site** — professional Macedonian copy rewrite; plans moved to the homepage (`/pricing`
    redirects); signup page redesigned around "free forever" and the business social network; navbar
    simplified; language switch and anchor-link bugs fixed.
16. **SEO/GEO** — post-build prerender of public pages, generated sitemap and `llms-full.txt`, fixed
    duplicate canonicals, hreflang only for bilingual pages, robots.txt for AI crawlers, noindex 404.
17. **Fresh start** — production DB reset to the admin account only (Oct 2026); backup/restore scripts.
18. **Company one-page website** — the profile became a shareable mini-site (`/f/:slug`): uploaded cover +
    logo, about, offers, contact form to the company's inbox, share panel with QR code, views/messages
    stats, per-profile SEO and link previews.

*End of Part I.*

---

# PART II — Marketing Concept Brief

_Last updated: 2026-11-22 (rev 4) · Market: North Macedonia · Languages: Macedonian (primary) + English_

> Self-contained brief for a marketer or marketing AI. Section 9 lists the hard constraints — read
> them before writing any copy.

## 1. One-paragraph summary

**Nexa Terminal is a free legal, HR and compliance office plus a business social network for
Macedonian small and medium companies.** A company signs up in a minute, generates professional
documents with its own data, checks what it is missing, asks five AI advisers (law, HR, marketing,
insurance, accounting) and — when a question becomes a real case — invites a lawyer into the same
conversation. On the other side, a small invite-only group of lawyers gets those anonymised cases.
Separately, Nexa's team runs consulting and project management for complex deals.

**Core loop to sell:** `Проверка → AI советник → Документ → Следење`, with *„лице од професијата во
истиот разговор"* as the safety net.

## 2. The problem

SMBs face dense, changing rules (labour law, GDPR, tax, Central Register). Their options: pay a lawyer
per routine task, copy outdated internet templates, or ignore it until an inspection or dispute. They
don't know what they're missing, can't fix it themselves, and have no system to keep it current.

## 3. Three audiences, three messages — never blend them

| | **SMB (nexa.mk)** | **Lawyers (leads.nexa.mk)** | **Companies with a big project (/uslugi)** |
|---|---|---|---|
| Promise | "Бесплатно засекогаш: документи, AI-советници, проверки и деловна мрежа" | "Клиентите бараат тука. Бидете видливи кога бараат." | "Сложени проекти, водени од почеток до крај" |
| Lead with | Free + the loop + a real lawyer when needed | Real anonymised cases, visibility, ethics-safe (client asks first) | Experience, roadmap, one point of accountability |
| Never lead with | Leads, Topics, Pro | Documents/AI (bonus only) | The software |
| Channel | SEO, /proverka, social posts, partners | Personal outreach, LinkedIn DMs, invite link | Referrals, LinkedIn, SEO on service pages |

## 4. What the SMB actually gets (free)

- 45+ automated documents (employment, GDPR, contracts, company formation/changes, accounting decisions)
  + upload-your-own templates.
- Compliance checks with an AI-written report and one-click document fixes.
- **AI Тим** — Лекс, Вера, Миа, Стојан, Дина and Борис (business consultant: idea stress tests, pricing, margins, break-even) — with memory, verified law citations, checked arithmetic and hand-offs.
- **Invite a lawyer into the chat** (availability not guaranteed — say so).
- HR: employee register with leave balances, Big Five assessment, interview scan, exit interview.
- Contracts register with reminders, contract analysis, procurement register with re-quote reminders.
- **Business social network:** feed, and a **free one-page website** for the company (`nexa.mk/f/...`) —
  cover photo, logo, services, contact form straight to their inbox, share buttons and a QR code for
  business cards, visitor stats, earned badges, founding-member numbers for the first 100 profiles.
- „Проверен работодавач" badge, newsletter banner, courses, members-only blog.

## 5. What the lawyer gets (invite-only, free 6-month pilot)

Anonymised cases from the satellite sites, invites from SMB AI chats (first to accept joins), a Monday
digest email, Topics and blog visibility, a case-management workspace with a client status link,
client profiles for up to 25 companies, and all the SMB tools. Group capped at 20, recruited by city.

## 6. Funnel

1. **Acquisition:** `/proverka` free check, topic pages and services pages (now fully readable by Google
   and AI assistants), satellite sites, social posts (real cases, contract-analysis demos), the employer
   badge on job ads (backlinks).
2. **Activation:** free signup → first document / first check / first AI question / profile.
3. **Retention:** reminders (contracts, HR, procurement), the feed, AI memory, the badge, a lawyer one
   click away.
4. **Monetisation (now):** consulting projects (/uslugi). **Later:** Pro subscriptions after the pilot;
   possibly paid tiers when billing returns.

## 7. Positioning & moat

1. Built for Macedonian law and practice (documents, checks, corpora, insurers, NBRM) — not a translation.
2. The integrated loop **plus** a human lawyer in the same thread.
3. AI that remembers and verifies its citations.
4. Free for SMBs — no competitor can undercut "free forever" with this depth.
5. Factual provenance (law, dates), never borrowed authority.

## 8. Messaging raw material

**SMB:** „Бесплатно засекогаш за фирми — без картичка." · „Договор, отказ, правилник за лични податоци —
готови за минути." · „Дознајте што Ви недостасува — за 3 минути." · „Пет AI-советници. И адвокат кога
навистина Ви треба." · „Деловна мрежа за мали и средни фирми."
**Lawyers:** „Клиентот сам поставува прашање — Вие го преземате. Не е реклама." · „Анонимни предмети од
Вашата област и град, секој понеделник."
**Services:** „Една точка на одговорност за целата трансакција." · „Знајте што купувате — пред да потпишете."

## 9. Hard constraints for any campaign

1. **Never** claim "checked/reviewed by a lawyer" or imply Nexa gives legal advice or representation.
2. **No prices on public pages.** Basic = „Бесплатно", Pro = „По покана", services = proposal per project.
   (The €590 Pro list price is internal.)
3. **"Free forever" is true for Basic only.** Pro is a free pilot, not free forever. AI questions have a
   weekly allowance — don't say "unlimited AI".
4. Never promise a Pro will answer or a number of cases; say "проверуваме дали има достапен професионалец".
5. Three audiences, three messages — never upsell an SMB into Pro.
6. **No invented social proof** — no user counts, testimonials or "trusted by".
7. Don't market empty marketplace surfaces (Барање за понуди, Саем) or a "busy" network.
8. Services copy is "we do…", never about one person; legal opinions come from licensed partners.
9. Formal Вие in all Macedonian copy.

## 10. Quick-reference fact sheet

- **Product:** free Terminal for SMBs (documents, checks, 5 AI advisers, HR, contracts, procurement,
  business social network) + invite-only lawyer network + consulting services.
- **Plans:** Basic free forever (nexa.mk) · Pro invite-only, 180-day free pilot, cap 20 (leads.nexa.mk).
- **Revenue now:** consulting („Услуги"). Pro charging after the pilot.
- **Differentiator:** a real lawyer can join the AI conversation; AI with memory + verified citations.
- **Stage:** pre-PMF, no users after the Oct 2026 reset; priority = SMB acquisition and first consulting projects.
- **Trust rule:** cite the law; never claim lawyer review.
