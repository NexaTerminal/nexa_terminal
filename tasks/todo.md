# HR Interviews — „Интервјуа" (Interview scan + Exit interview)

Clone of the „Проценка на карактер" pattern, adapted for qualitative, owner-editable
interviews. One parent nav tab with two children (like Документи → Автоматизирани / Мои шаблони).

## Decisions (confirmed with user)
- **Output:** answer transcript **+ AI summary** (soft-skill signals for scan; attrition/retention themes for exit).
- **Answer format:** **mixed** — some 1–5 rating questions + free-text.
- **Templates:** owner can **save a reusable default template per type** (edit suggested questions → "Зачувај како мој стандарден образец"); future sends prefill from it.
- Tier posture: Basic + Pro via `subscriptionGuard`, no new feature flag (mirrors character).
- Resend→Gmail via `emailService.sendEmail(to, subject, html)`.

## Feature shape
- Parent nav group **„Интервјуа"** (collapsible) in the Човечки ресурси section (+ Pro Алатки for parity):
  - **Интервју скен** → `/terminal/interviews/scan` (candidates)
  - **Излезно интервју** → `/terminal/interviews/exit` (departing employees)
- One cockpit component `Interviews.js` rendered with a `type` prop at both routes.
- Flow: create (name/role/email/note) → suggested questions load → owner edits/reorders/marks rating vs text → optionally save as default → share link / email → respondent answers → owner sees transcript + AI summary; owner notified by email on completion.

## Data model — collection `hr_interviews`
```
{ token, ownerId, companyName, type:'scan'|'exit',
  subjectName, role, inviteEmail, note,
  questions:[{ id, text, kind:'text'|'rating' }],   // finalized edited list, per interview
  status:'pending'|'completed', answers:{ qid: value },   // rating→1..5, text→string
  module:'interview_v1', createdAt, invitedAt, completedAt,
  resultsEmailedTo, resultsEmailedAt,
  aiSummary:{ text, generatedAt } | null }
```
Collection `hr_interview_templates`: `{ ownerId, type, questions:[...], updatedAt }` (one per owner+type; unique index).

## Question banks — `server/data/interviewQuestions.js`
- Two banks: `SCAN` (LinkedIn behavioral soft-skills) + `EXIT` (Forbes exit-interview do's).
- Each = general behavior/character set + role/industry add-ons; some flagged `kind:'rating'`.
- `suggest({ type, industry, role })` → assembles ≤ 15 questions (general + relevant add-ons), stable ids.

## Server
- `routes/hrInterviews.js` (owner, `authenticateJWT` + `subscriptionGuard`):
  - `GET /` list · `POST /` create · `GET /:id` · `POST /:id/resend` · `DELETE /:id`
  - `GET /suggest?type=&role=` → suggested questions (prefill from saved default if any, else static, biased by `companyInfo.industry`)
  - `GET /template?type=` · `PUT /template` → saved default per type
- `routes/publicInterview.js` (no auth, mounted before CSRF):
  - `GET /:token` (meta + stored questions) · `POST /:token/submit` (validate + store + AI summary + notify owner; idempotent-guarded like character)
- `controllers/hrInterviewController.js` + `controllers/publicInterviewController.js` (or inline in route, matching character style).
- `services/interviewEmail.js`: invite email (candidate/employee) + owner results/transcript email.
- `services/interviewSummary.js`: openai call, budget-aware, per-type prompt; best-effort (never blocks submit).
- server.js: mount both; add `/hr-interviews`, `/public/interview` to CSRF-exempt list.

## Client
- `services/interviewApi.js` (thin axios wrapper, JWT Bearer).
- `pages/terminal/Interviews.js` (+ `.module.css`) — cockpit: create form, editable question list (text/rating toggle, add/remove/reorder, save-as-default), interview list, inline transcript + AI summary.
- `pages/website/InterviewForm.js` (+ `.module.css`) — public respondent page: renders stored questions (text inputs + 1–5 rating), thank-you screen; no cross-data leak.
- `config/nav.js`: add collapsible `interviews` group to Човечки ресурси (and Pro Алатки).
- `App.js`: routes `/terminal/interviews/scan`, `/terminal/interviews/exit`, public `/интервју/:token` (ascii: `/interview/:token`).

## Verification
- Owner create → edit questions → save default → reopen prefills default.
- Email invite arrives (Resend); link opens respondent page; submit stores answers.
- Owner sees transcript + AI summary; completion email to owner.
- CSRF-exempt paths work (JWT Bearer, no 403); subscriptionGuard blocks trial/suspended with 402.
- Idempotent double-submit guard; token regex validation; ratings clamped 1–5.

## Review — built (uncommitted)
Server (all `node -c` clean, modules load, `suggest()` verified):
- `data/interviewQuestions.js` — SCAN + EXIT banks, `suggest({type,industry,role})` (cap 15, role/industry addons, exit keeps `x_open` last).
- `services/interviewSummary.js` — openai (gpt-4o-mini, JSON), best-effort, null without key.
- `services/interviewEmail.js` — invite + owner-results HTML (email-safe, rating dots, AI block).
- `controllers/hrInterviewController.js` — list/create/get/resend/remove + suggest + get/put default template; stores `ownerEmail`.
- `routes/hrInterviews.js` (JWT) + `routes/publicInterview.js` (before CSRF; clean/validate answers, idempotent submit, AI summary, owner notify).
- `server.js` — public mount + owner mount (subscriptionGuard) + CSRF-exempt `/hr-interviews`, `/public/interview`.
- collections: `hr_interviews`, `hr_interview_templates`.

Client (eslint 0 errors):
- `services/interviewApi.js`; `pages/terminal/Interviews.js` (+ css) — cockpit with editable QuestionEditor (text/rating toggle, reorder, add/remove, save-as-default, reset), list, transcript + AI summary; `pages/website/InterviewForm.js` (+ css) — respondent page (text + 1–5 rating, honeypot, half-answered gate).
- `config/nav.js` — collapsible „Интервјуа" group (scan/exit) in Човечки ресурси + Pro Алатки.
- `App.js` — `/terminal/interviews/scan|exit`, public `/interview/:token`.

Decision refinements during build:
- Role no longer auto-reloads suggestions on blur (would wipe edits); the „Врати предложени" button reloads using the current role on demand.
- Owner email stored on the doc at creation (no users lookup on the public path).

Not done / follow-ups:
- No automated tests added (repo has none for this area); manual verification pending.
- Client production build not run (lint clean; imports mirror the working character feature).
- Not committed (multi-agent coordination — waiting for user go-ahead).
