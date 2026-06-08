# Nexa Terminal — Integration Description

A plain-English description of every feature in the Nexa Terminal web application, written for use as a reference when integrating this product into a larger ecosystem. Each section describes what the feature does, what data it produces or consumes, and how an external system would typically plug into it.

---

## 1. What Nexa Terminal Is

Nexa Terminal is a bilingual (English/Macedonian) business operations platform built for Macedonian companies. It combines four major capability areas into one product:

1. **Automated legal document generation** — companies generate ready-to-sign DOCX documents (employment contracts, terminations, NDAs, GDPR policies, etc.) from a guided web form.
2. **AI assistance** — a legal chatbot, a marketing chatbot, and an AI contract-analysis engine that reviews uploaded contracts for risk.
3. **Compliance health checks** — multi-step questionnaires that score a company across legal, HR, cyber, and marketing compliance domains and produce structured reports.
4. **B2B service marketplace, social, education, and admin tooling** — a directory of verified service providers, internal social posts, an investment/news feed, a courses + certificates module, and a full admin control panel.

The product is positioned as the operational "terminal" for a Macedonian SME: legal docs, AI legal help, compliance reporting, and finding outside professionals — all behind one verified-company account.

---

## 2. Technology Stack (for integration planning)

- **Frontend:** React 19, React Router, i18next (English + Macedonian), CSS Modules. Deployed on Vercel.
- **Backend:** Node.js / Express, native MongoDB driver (no Mongoose), JWT auth, Socket.io for realtime admin, Passport.js (local + Google + LinkedIn OAuth strategies). Deployed on Render/Railway.
- **AI:** OpenAI SDK, LangChain (`@langchain/openai`, `@langchain/community`), Qdrant vector store for retrieval-augmented chatbot answers over Macedonian legal sources.
- **Document generation:** `docxtemplater` + `pizzip` over `.docx` templates; `pdfkit` and `pdf-parse` for PDF flows; `mammoth` for DOCX-to-text.
- **Email:** Resend API (primary) with Nodemailer/Gmail fallback.
- **Security:** Helmet, CSRF tokens, express-rate-limit, express-validator + Joi, custom security/audit/logging middleware.
- **Scheduling:** `node-cron` (credit resets, scheduled jobs).
- **Realtime:** Socket.io channel for admin dashboard.

API base path: `/api/...`. The client expects the server at `http://localhost:5001` in dev (proxy), production URL is configured via env. Authentication is bearer-JWT in the `Authorization` header; CSRF tokens are issued via cookies for state-changing browser calls.

---

## 3. Identity, Accounts, and Verification

### 3.1 Authentication
- Email + password registration and login (`/api/auth`).
- Google OAuth and LinkedIn OAuth strategies are wired in (`server/config/passport.js`).
- JWT issued on login; stored client-side in localStorage and sent in `Authorization: Bearer <token>`.
- Password reset flow with email-delivered reset link (`passwordResetService`).
- Rate limiting is stricter on `/api/auth/*` than on the rest of the API.

### 3.2 Profile and Company Data
- Each user has an embedded `companyInfo` object: `companyName`, `address`, `taxNumber`, `role`, plus extended fields used by document templates.
- "Profile complete" is tracked as a boolean (`profileComplete`) and gates downstream features.
- Users edit their profile via `/terminal/edit-profile` and a simplified onboarding flow (`SimpleCompleteProfile`).

### 3.3 Company Verification
- A separate verification step (`/api/verification`) confirms the user controls the company's business email.
- Verified users get `isVerified: true`. Verification is required for most premium features (document generation, AI, marketplace requests).
- Verification middleware lives in `server/middleware/verification.js` and `verificationMiddleware.js`.

### 3.4 Roles
- Regular user, verified company, and admin. Admin role is checked by `isAdmin` middleware and unlocks the admin routes/UI.

**Integration note:** External systems can treat Nexa users as "Macedonian verified business accounts." If you need to federate identity, the cleanest integration points are (a) extending the OAuth strategy list, or (b) issuing your own JWT and trusting the existing `/api/auth` token format.

---

## 4. Automated Document Generation (core feature)

### 4.1 How it works
A user picks a document type from a category, fills in a guided React form, and the server merges the form data + the user's `companyInfo` into a `.docx` template using `docxtemplater`. The generated file is streamed back as a download (and optionally stored / shared).

Routes: `/api/auto-documents`, `/api/documents`, `/api/document-preview`, `/api/shared-documents`.

### 4.2 Document Catalog

**Employment (21 templates)** — `server/document_templates/employment/`:
- Employment Agreement, Employment Annex, Confirmation of Employment
- Annual Leave Decision, Annual Leave Bonus Decision, Unpaid Leave Decision
- Bonus Decision, Bonus Payment, Mandatory Bonus, Death Compensation Decision
- Disciplinary Action, Warning Letter, Termination Warning
- Termination Agreement, Termination by Employee Request, Termination Decision Due to Duration, Termination Due to Age Limit, Termination Due to Fault, Termination — Personal Reasons
- Employee Damages Statement, Organization Act

**Contracts** — `server/document_templates/contracts/`:
- NDA, Services Contract, Master Services Agreement (also in /other), SaaS Agreement, Rent Agreement, Loan Agreement, Debt Assumption Agreement, Mediation Agreement

**Personal Data Protection (GDPR)** — `server/document_templates/personalDataProtection/`:
- Consent for Personal Data Processing, GDPR Company Politics, Politics for Data Protection, Procedure for Estimation (DPIA)

**Rulebooks** — Personal Data Rulebook.

**Accounting** — Annual Accounts Adoption, Cash Register Maximum Decision, Dividend Payment Decision, Invoice Signing Authorization, Write-Off Decision.

**Obligations** — Vehicle Sale & Purchase Agreement.

**Other** — Employee Stock Purchase Plan, Master Services Agreement, Warning Before Lawsuit.

### 4.3 Custom Templates and Bulk Generation
- Users can upload their own DOCX templates with `{{placeholders}}` and build a form for them: `/api/custom-templates`, UI under `MyTemplates`, `MyTemplateBuilder`, `TemplateEdit`, `TemplateFormFill`.
- A "Template Marketplace" page lets users browse community/shared templates.
- Bulk generation: feed a CSV/XLSX (via `xlsx` / `csv-parse`) to produce many documents from one template at once (`TemplateBulkGenerate`).
- Generation history is recorded per user (`generationHistoryService`, `TemplateHistory` page).

### 4.4 Shared Documents and Previews
- Documents can be shared with another user with controlled permissions (`/api/shared-documents`).
- Document preview endpoint renders a non-final preview before generating the final DOCX (`/api/document-preview`).

### 4.5 Marketing Documents
- A parallel pipeline for marketing-oriented documents (e.g. performance reports): `/api/marketing-documents`, templates in `server/marketing_templates/`.

**Integration note:** The doc engine is the most reusable asset. To call it from outside, hit `/api/auto-documents/:type` with a JWT and a JSON payload containing the form fields; the server merges with the authenticated user's `companyInfo` and returns the DOCX. To embed externally generated data, write it into the user's `companyInfo` or pass it in the form payload.

---

## 5. AI Features

### 5.1 Legal Chatbot — `/api/chatbot`
- Backed by OpenAI + a Qdrant vector store of Macedonian legal sources (PDFs in `server/legal sources/` — tax, labor, GDPR, commercial law, public revenue office brochures, etc.).
- Conversations are persisted (`ConversationService`) so chats can be resumed.
- Defaults to Macedonian law; only switches to an EU view when foreign law actually applies — not just because a party is foreign.
- An admin-side controller (`adminChatbotController`) lets administrators inspect/manage conversations and tune behavior (`ManageChatbot` admin page).
- A `LegalDataHunterService` exists to extend the underlying legal knowledge base.

### 5.2 Marketing Chatbot — `/api/marketing-bot`
- Separate bot specialized for marketing strategy/content questions (`MarketingBotService`). UI at `MarketingAIChat.jsx`.

### 5.3 Contract Analysis — `/api/contract-analysis`
- User uploads a contract (PDF/DOCX). `ContractTextExtractor` extracts the text; `ContractAnalysisService` runs an LLM analysis using prompts in `server/contractAnalysis/prompts/`.
- Output focuses on legal **and** commercial risks: termination clauses, penalties, license terms, liability/indemnity.
- UI: `client/src/pages/terminal/ContractAnalysis.js`.

**Integration note:** All three AI features are JWT-gated and credit-metered. Calls cost credits (see §8). Plan an ecosystem-level budget if you intend to drive heavy AI traffic from outside services.

---

## 6. Compliance Health Checks

Four parallel questionnaire-and-report modules. Each one asks a structured series of yes/no/contextual questions, scores the answers, and renders a written compliance report the user can read on screen and export.

### 6.1 LHC — Legal Health Check (`/api/lhc`)
Sub-modules, each with its own controller and questionnaire/report pair:
- **Employment** (split into 4 parts + a combined overview)
- **GDPR / data protection**
- **Health & Safety**
- **General legal compliance**

Pages: `client/src/pages/terminal/lhc/*Questionnaire.js` + `*Report.js`.

### 6.2 MHC — Marketing Health Check (`/api/mhc`)
Marketing compliance and best-practice checks.

### 6.3 CHC — Cyber Health Check (`/api/chc`)
Cyber-security posture questionnaire (`cyberController.js`).

### 6.4 HHC — HR Health Check (`/api/hhc`)
HR practice questionnaire (`hrController.js`).

Each module returns:
- A risk-prioritized list of findings (high/medium/low).
- Recommended remedial actions (which often map directly to documents in §4 — e.g. "no GDPR policy detected → generate GDPR Company Politics").

**Integration note:** Reports are structured JSON server-side before being rendered. They are a natural feed into an external compliance dashboard or CRM.

---

## 7. B2B Marketplace and Service Requests

### 7.1 Service Provider Directory — `/api/marketplace`
- Predefined service categories (legal, accounting, marketing, IT, etc.).
- Service providers are managed by admins (admin creates/updates/deletes providers).
- The directory exposes only categories that have at least one active provider (`/categories/active`).
- Performance metrics are tracked per provider.

### 7.2 Offer Requests — `/api/offer-requests`
- A user submits a request for an offer in a specific category (e.g. "I need an HR lawyer").
- Admin reviews and forwards to one or more matching providers (email workflow).
- Providers respond via `/api/provider-response`.
- Provider expressions of interest are tracked via `/api/provider-interest`.

### 7.3 Find a Lawyer
- A dedicated page (`FindLawyer.js`) on top of the marketplace, focused on legal providers.

**Integration note:** The marketplace is essentially a curated B2B lead-routing system. Hooking a CRM into `/api/offer-requests` (inbound) and the admin email approval step (outbound) is the natural integration.

---

## 8. Credits, Billing, and Referrals

### 8.1 Credits — `/api/credits`
- Every metered action (AI chat message, document generation, contract analysis, health check) costs credits.
- `CreditService` handles balance reads, deductions, refunds, and weekly resets.
- `CreditScheduler` (node-cron) performs scheduled top-ups/resets.
- Credit middleware (`creditMiddleware.js`) gates routes that cost credits.
- Diagnostics endpoint exists at `/credits/_diagnostics` to probe the credit + chatbot module health.
- UI: `client/src/pages/terminal/Credits.js`.

### 8.2 Referrals — `/api/referrals`
- Users invite other businesses (`Invite.js`); successful referrals are tracked by `ReferralService`, typically rewarded with credits.

**Integration note:** Credits are the single internal economy. If you integrate a different billing system (Stripe, a partner platform), the cleanest path is to keep credits as the runtime currency and feed credit grants from your billing webhooks.

---

## 9. Social, Investments, Blog, and Education

### 9.1 Social Posts — `/api/social`
- Internal business social feed: users post updates visible to other companies on the platform (`socialPostService`, `socialController`).

### 9.2 Investments / Opportunities — `/api/investments`
- A curated feed of investment opportunities / business news (`InvestmentService`). Admin-managed; users browse and view detail pages.

### 9.3 Blog — `/api/blog` and `/api/blogs`
- Public marketing blog plus an internal blog system. Admin pages exist to add/edit/manage blog posts (`AddBlog`, `EditBlog`, `ManageBlogs`).
- Public blog pages live under `client/src/pages/website/` (`Blog.js`, `BlogPost.js`).

### 9.4 Courses and Certificates — `/api/courses`, `/api/certificates`
- E-learning module: users browse courses, take lessons (`CourseLesson.js`), and earn certificates on completion.
- Certificate issuance has its own controller and route group.

### 9.5 SEO — `/api/seo`
- Serverside SEO helpers (sitemap, structured data) for the public site, plus a `socialPreviewMiddleware` that serves OG/Twitter previews for shared links.

---

## 10. Notifications, Contact, and Email

- **Notifications** — `/api/notifications`: in-app notifications (offer requests received, admin actions, etc.).
- **Contact** — `/api/contact`: public contact form on the marketing site.
- **Email** — `emailService.js`: Resend API primary, Gmail/Nodemailer fallback. Used for verification, password reset, marketplace approval, referral confirmations, admin alerts.
- **Admin notifications** — `adminNotificationService`: routes important events to admins.

---

## 11. Admin and Realtime Monitoring

### 11.1 Admin API — `/api/admin`
- Manage users (`ManageUsers`, `EnhancedManageUsers`) — search, edit, suspend, set roles.
- Manage service providers (`ManageServiceProviders`).
- Manage offer requests (`ManageOfferRequests`) — approve/forward to providers.
- Manage chatbot conversations (`ManageChatbot`).
- Manage blogs (`ManageBlogs`).

### 11.2 Realtime Admin — `/api/realtime-admin` + Socket.io
- Live monitoring of active users, recent activity, and security events (`realtimeAdminController`, `realtimeMonitoringService`).
- Server emits over Socket.io; admin UI subscribes.

### 11.3 Analytics — `/api/analytics`
- `userAnalyticsService` tracks user activity (logins, doc generations, AI calls). Feeds the admin dashboards.

### 11.4 Audit and Security Logging
- `auditLoggingService` for compliance-grade audit trails.
- `securityMonitoringService` for suspicious activity detection.
- Request-level activity logging via `middleware/activityLogger.js`.

**Integration note:** The realtime + analytics layers are the cleanest source of "what's happening in Nexa right now" for an ecosystem-level operations dashboard.

---

## 12. Security Posture

- Helmet for HTTP security headers.
- CSRF tokens on state-changing routes (cookie-based), with explicit exemptions for JWT-API endpoints that don't need CSRF.
- CORS configured per environment.
- Rate limiting (general + stricter on auth).
- Input sanitization (`middleware/validation.js`) and schema validation via Joi / express-validator.
- Account security middleware (lockouts, suspicious-login detection).
- Request size limit: 10 MB.
- All secrets via env vars: `MONGODB_URI`, `JWT_SECRET`, `CSRF_SECRET`, `RESEND_API_KEY`, `GMAIL_USER`, `GMAIL_PASS`, OpenAI key, Qdrant config, OAuth client IDs/secrets.

---

## 13. Feature Toggle System

- Backend feature flags managed by `server/config/settingsManager.js`.
- In development, flags read from `.vscode/settings.json` under `"nexa.features"`.
- In production (`NODE_ENV=production`), all features are forced on.
- CLI: `npm run features` in `server/` to inspect and toggle (`authentication`, `documentAutomation`, `socialPosts`, `blog`, etc.).

**Integration note:** If you integrate selectively, you can ship Nexa with only the modules you need enabled by setting the corresponding flags off — server routes gated by flags simply won't mount.

---

## 14. Deployment Footprint

- **Frontend:** Vercel. Build: `npm run build` from root (runs client build).
- **Backend:** Render or Railway. Start: `npm start` in `server/`. `railway.json` and `render.yaml` are checked in.
- **Database:** MongoDB (Atlas-compatible). Collections include `users`, `credit_transactions`, social posts, investments, blogs, marketplace providers, offer requests, conversations, generation history, audit logs, certificates, courses.
- **Vector store:** Qdrant (separate service) for the legal chatbot retrieval index.
- **Storage:** Uploaded files served from `server/public/uploads/`. For multi-instance deploys, swap this for object storage (S3 / equivalent).

---

## 15. API Surface — Quick Reference

All endpoints are mounted under `/api` unless noted.

| Group | Path | Purpose |
|---|---|---|
| Auth | `/auth` | Register, login, OAuth, password reset |
| Users | `/users` | Profile CRUD |
| Verification | `/verification` | Company email verification |
| Documents (legacy) | `/documents` | Generic document endpoints |
| Auto Documents | `/auto-documents` | Generate templated DOCX |
| Custom Templates | `/custom-templates` | User-defined templates |
| Marketing Documents | `/marketing-documents` | Marketing-oriented documents |
| Document Preview | `/document-preview` | Previews before final generate |
| Shared Documents | `/shared-documents` | Share generated docs with other users |
| Chatbot | `/chatbot` | Legal AI chat |
| Marketing Bot | `/marketing-bot` | Marketing AI chat |
| Contract Analysis | `/contract-analysis` | Upload + analyze contracts |
| LHC / MHC / CHC / HHC | `/lhc` `/mhc` `/chc` `/hhc` | Compliance health checks |
| Marketplace | `/marketplace` | Service provider directory |
| Offer Requests | `/offer-requests` | User → admin → provider routing |
| Provider Interest | `/provider-interest` | Provider expressions of interest |
| Provider Response | `/provider-response` | Provider replies |
| Credits | `/credits` | Balance, transactions, diagnostics |
| Referrals | `/referrals` | Invite + reward |
| Social | `/social` | Internal social posts |
| Investments | `/investments` | Investment feed |
| Blog / Blogs | `/blog` `/blogs` | Marketing + internal blog |
| Courses | `/courses` | E-learning |
| Certificates | `/certificates` | Course completion certs |
| Notifications | `/notifications` | In-app notifications |
| Contact | `/contact` | Public contact form |
| SEO | `/seo` | Sitemap / structured data |
| Analytics | `/analytics` | Usage analytics |
| Admin | `/admin` | All admin operations |
| Realtime Admin | `/realtime-admin` | Live monitoring (+ Socket.io) |

---

## 16. Suggested Integration Patterns

When dropping Nexa into a wider ecosystem, the cleanest integration seams are:

1. **Identity bridge** — Either federate via OAuth (extend `passport.js`) or trust Nexa JWTs in your other services. The user object is the natural shared entity.
2. **Document service** — Expose Nexa's `/api/auto-documents` and `/api/custom-templates` as a generic "Macedonian document factory" microservice. Other ecosystem apps post a payload + JWT and get a DOCX back.
3. **AI capability** — `/api/chatbot` (legal Q&A) and `/api/contract-analysis` (risk review) can both be reused as embedded AI capabilities from a parent UI. Treat the credit balance as the rate-limit primitive.
4. **Compliance feed** — Read each health-check module's report JSON into an external compliance / risk dashboard. The reports are deterministic enough to diff over time and trend.
5. **Marketplace as lead source** — Subscribe to offer-request events (via Socket.io or by polling the admin endpoints) to push qualified B2B leads into a CRM.
6. **Billing bridge** — Replace or augment the internal credit grant logic with calls from an external billing system. The credit service is the single chokepoint.
7. **Audit + analytics export** — Forward audit log entries and analytics events to a central SIEM / data warehouse for ecosystem-wide observability.

---

## 17. Caveats and Things to Know Before Integrating

- **Macedonia-specific.** Document templates, validation rules (13-digit EMBG/PIN), tax forms, and the legal knowledge base in the chatbot are all keyed to Macedonian law. Reusing in another jurisdiction requires swapping templates and re-indexing the vector store.
- **Bilingual only.** UI is English + Macedonian via i18next. Adding languages requires translation files plus reviewing templates for language-specific text.
- **Native MongoDB driver, not Mongoose.** Schema is enforced in code, not in a model layer — be careful when sharing models across services.
- **CSRF + JWT split.** Browser flows use CSRF cookies; pure API flows from another server should hit JWT endpoints that are CSRF-exempt. Plan accordingly.
- **Credits gate the AI features.** A "free" external caller will exhaust user credit balances quickly — wire credit grants into your integration before turning on high-volume AI usage.
- **Verification gates premium features.** External users coming in via federated identity still need a verified company record before they can generate documents or use AI heavily.
- **Single-instance file storage today.** Multi-region or HA deploys should move uploads to object storage.
