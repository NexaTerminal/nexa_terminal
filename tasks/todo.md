# Предмети (Case Management) — leads.nexa Pro

A case-management workspace for solo Macedonian lawyers, added as the **last item
in the "Алатки" drawer**. Pro (tier B) / ADMIN only, behind subscriptionGuard.

## Data model — `cases` collection (embedded sub-arrays, native driver)
```
{
  _id, ownerId,
  title, caseType,            // caseType ∈ parnica|krivicno|upravna|dogovorno|
                              //   nasledstvo|rabotni|izvrsuvanje|registracija|drugo
  status,                     // open|in_progress|waiting|closed|archived
  clientId?, clientName, clientEmail,   // link to `clients` or free text; email for public-link handoff
  courtName, caseNumber, opposingParty,
  description, internalNotes, priority(low|normal|high), value,
  openedAt, closedAt,
  publicToken (uuid, stable), publicEnabled (bool),
  deadlines: [ { _id, title, type, dueAt, done, clientVisible, remind, remindersSent:[{type,at}] } ],
  timeline:  [ { _id, at, type, title, body, clientVisible, createdAt } ],
  createdAt, updatedAt
}
```
Rationale: like `employee.remindersSent` / `contract`, sub-docs are embedded — a
solo lawyer has few deadlines/entries per case; avoids extra collections/joins.

## Server
- [ ] `services/casesService.js` — CRUD scoped to ownerId (mirror clientsService);
      deadline add/update/complete/remove; timeline add/update/remove; `getPublicByToken`
      returning a **redacted** view (no internalNotes, no fees, no non-visible entries).
- [ ] `controllers/casesController.js` — `requireProOrAdmin` (tierService.visibleTier),
      CRUD + sub-resource handlers + `aiBrief` + public `getPublic`.
- [ ] `routes/cases.js` — JWT + requireProOrAdmin, all case ops.
- [ ] `routes/publicCases.js` — no-auth GET `/:token`.
- [ ] Mount in server.js: `/api/cases` (subscriptionGuard) + `/api/public/cases`;
      add `/public/cases/*` to csrfExemptRoutes.
- [ ] `services/caseReminderService.js` + `caseReminderScheduler.js` — daily **09:00**
      Europe/Skopje (08:00 contracts, 10:00 HR already taken). Offsets [7,3,1] days
      before `dueAt`; only cases with status ∈ {open,in_progress,waiting}; per-deadline
      `remind` toggle; idempotent `remindersSent`; ONE digest email per owner. Wire in
      initializeServices + expose service on app.locals for an admin run-now later.
- [ ] `emails/caseReminderEmails.js` — MK digest template (deadlines grouped, days-left).
- [ ] AI brief: `POST /api/cases/:id/ai-brief` {notes} → {summary, clientSummary} using
      OpenAI `gpt-4o-mini` (same SDK/pattern as blogGuidelineCheckService), MK prompt,
      short + cheap. Fail-soft.

## Client
- [ ] `pages/terminal/cases/Cases.js` — list (mirror Employees.js): status filter chips,
      search, **next-deadline** column, upcoming-deadlines summary strip, "+ Нов предмет".
- [ ] `pages/terminal/cases/CaseForm.js` — create/edit core fields (+ client picker reusing
      `/api/clients`, or free-text client name/email).
- [ ] `pages/terminal/cases/CaseDetail.js` — workspace:
      header (status control, client, court/number) · Рокови (add/edit/done, remind + client-visible
      toggles) · Дневник (add entry, **AI brief helper**, client-visible toggle) · Јавен линк
      (copy, enable/disable, shows client URL) · Internal notes.
- [ ] `pages/public/CaseStatus.js` — public client status page (no auth, MK): title, status badge,
      court/number, next client-visible date, curated client-visible timeline, last-updated, lawyer
      contact. Inactive/closed states handled gracefully.
- [ ] CSS: reuse `Contracts.module.css` vocabulary for the list; new `CaseDetail.module.css`,
      `public/CaseStatus.module.css`.
- [ ] Routes in App.js: `/terminal/cases`, `/cases/new`, `/cases/:id`, `/cases/:id/edit`
      (PrivateRoute + VerificationRequired), public `/predmet/:token`.

## Nav
- [ ] `config/nav.js`: add `Предмети` as the LAST item of the `pro-tools` (Алатки) section.

## Public-page privacy rules (hard)
Returned publicly ONLY: title, caseType label, status label, courtName, caseNumber,
timeline entries with `clientVisible:true`, next deadline with `clientVisible:true`,
updatedAt. NEVER: internalNotes, fees/value, opposingParty strategy, non-visible entries.
Accessible while `publicEnabled && status !== archived`; `closed` shows a final "завршен"
state; disabled/archived shows an inactive notice. Token is stable for the case's life.

## Review — IMPLEMENTED ✅ (2026-08-20, uncommitted)
Server: `casesService` (CRUD + embedded deadlines/timeline + redacted `getPublicByToken`
with lawyer contact), `casesController` (Pro/ADMIN gate + AI brief via gpt-4o-mini,
fail-soft), `routes/cases.js` + `routes/publicCases.js`, mounted in server.js
(`/api/cases` behind subscriptionGuard, `/api/public/cases` open; both CSRF-exempt).
`caseReminderService` + `caseReminderScheduler` (daily 09:00 Europe/Skopje, offsets
[7,3,1], idempotent, one digest per owner) wired in initializeServices; MK email in
`emails/caseReminderEmails.js`.
Client: `config/cases.js` (labels/helpers), `services/casesApi.js`, `pages/terminal/cases/`
(Cases list, CaseForm, CaseDetail workspace with public-link box + AI helper + client-visible
toggles), `pages/public/CaseStatus.js` (redacted client page at `/predmet/:token`).
Nav: `Предмети` added as LAST item in the `pro-tools` (Алатки) section + `folder` icon.

Verified: `react-scripts build` compiles; eslint clean on all new files; reminder pure-logic
unit test passes (tightest fires / wider recorded / done+no-remind+already-sent+closed skipped);
routes + all controller handlers require cleanly. Dev servers NOT started (user may have active
sessions — per CLAUDE.md). AI brief needs `OPENAI_API_KEY` (degrades to raw notes without it);
reminder emails need `RESEND_API_KEY` (dev-logs otherwise).

Not done / possible follow-ups: admin "run reminders now" endpoint; full inline edit of a
deadline/entry (currently toggle+delete+re-add); pagination on the case list; a dashboard widget.
