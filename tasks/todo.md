# Human Pro ↔ AI conversation bridge (Request Board) — BUILD

Core function: a Basic user in an AI chat requests a human Pro to check/assist →
admin approves → the request is broadcast to all ELIGIBLE Pros by category →
the first Pro to CLAIM joins the conversation. Pro's name is public; the Pro is
professionally liable for their advice (both sides informed). Extends the existing
`pro_requests` (Ask-a-Pro) instead of a new module.

**Step 1 scope: LEGAL only** — requests from legal AI agents (ЈУРА/НОВА/АРИА) →
lawyer Pros (admin_user with a legal practice area). HR/marketing/etc. later.

## New lifecycle (same `pro_requests` collection)
pending_approval → (admin approves to board) **open** → (first eligible Pro claims) active → closed.
Admin reject → rejected. Keep legacy approveAndAssign(hand-pick) intact for back-compat.

## Data model additions on the doc
- `category` ('legal') — derived from `agent` at create.
- `context.aiSummary` — short AI summary of the AI↔user conversation (generated at approve).
- status `'open'`; `openedAt`, `claimedAt`.
- `proConsent` { acceptedAt, version } — liability ack captured at claim.

## Backend
- [ ] `server/services/aiSummaryService.js` — standalone mini-model (gpt-4o-mini) summarizer:
      `summarizeConversation({subject, question, transcript, type})` → short MK summary + the ask.
      Fails safe to a truncated transcript (flow never blocks). No RAG coupling.
- [ ] `proRequestsService.js`:
      - category map (agent→category) + LEGAL_PRACTICE_AREAS; add `category` at create.
      - add `'open'` to STATUSES; `presentForBoard` (omit requester email/PII pre-claim).
      - `approveToBoard(id, aiSummary)` — pending_approval → open (+openedAt, store summary).
      - `listBoardForPro(pro)` — status 'open' AND pro eligible for category.
      - `claim(pro, id, consent)` — atomic open→active, set assignedPro + claimedAt + proConsent.
      - `eligibleProsForCategory(category)` — admin_user + active sub + legal practiceArea overlap.
- [ ] `proRequestsController.js`:
      - `approveToBoard` (admin): generate summary → approveToBoard → email ALL eligible pros
        (summary + ask + board link) + email user ("shared, a pro will join").
      - `board` (pro): list eligible open requests.
      - `claim` (pro): claim (requires liability ack) → email user ("Pro X joined").
      - liability copy in emails + create notice.
- [ ] `routes/proRequests.js`: GET /board, POST /:id/approve-to-board, POST /:id/claim.

## Frontend
- [ ] Admin inbox: „Одобри и објави на таблата" button (shows AI summary preview).
- [ ] Pro board view (`view=board`): open requests (subject, category, AI summary, time) +
      „Преземи и приклучи се" with liability-acknowledgment checkbox.
- [ ] User „Моите барања": 'open' status label „Споделено со професионалци — чека приклучување".
- [ ] Thread: liability banner (AI is informational; Pro's advice is the Pro's responsibility);
      Pro name shown.
- [ ] Nav: Pro „Отворени барања" (board) entry.

## Liability (must inform BOTH sides)
- User at create + in thread: AI answers are informational; a Pro may review but Nexa/AI are
  not liable; the Pro is responsible for their professional advice.
- Pro at claim: explicit acknowledgment that by advising they take professional liability.

## Verify
- [ ] Atomic claim (two pros → exactly one wins).
- [ ] Only eligible (legal) pros see/receive legal requests.
- [ ] Summary generated; emails fire best-effort; flow never blocks.
- [ ] Syntax/parse clean.

## Review — DONE (Step 1 legal, uncommitted)
Backend:
- `aiSummaryService.js` — standalone mini-model summarizer, lazy OpenAI, fails safe to trimmed text.
- `proRequestsService.js` — `category` (agent→category map) at create; status `'open'`; `presentForBoard`
  (hides requester PII pre-claim); `approveToBoard`, `listBoardForPro`, atomic `claim`,
  `eligibleProsForCategory`, `proEligibleForCategory`; index {status,category,createdAt}.
- `proRequestsController.js` — `approveToBoard` (summarize → open → broadcast email to eligible pros
  + notify user), `board`, `claim` (requires acceptLiability); LIABILITY_NOTE in emails.
- `routes/proRequests.js` — GET /board, POST /:id/approve-to-board, POST /:id/claim.
Frontend:
- `proRequestsApi.js` — board(), approveToBoard(), claim().
- `RequestsPage.js` (+css) — board view (summary + claim + liability checkbox), admin „Одобри и објави
  на таблата" (keeps direct hand-pick as secondary), 'open' status, liability banner/note.
- `nav.js` — „Отворени барања" (/terminal/pro/board) + „Преземени барања"; `App.js` board route.
- `featureTerms.js` — proRequest copy: AI informational + Pro owns liability + board flow.
Tests: mock-integration verified — category derivation, approve→open, eligibility (lawyer yes /
real-estate no / no-areas yes), board filtering + PII hidden, ATOMIC claim (2nd pro rejected).
All server `node --check` + client babel parse clean.

Flow end-to-end: AIChat „Прашај професионалец" (existing) → pending_approval → admin approves to
board → eligible lawyer Pros emailed w/ AI summary → first Pro claims (liability ack) → joins thread.

Next verticals: add marketing/hr categories (extend AGENT_TO_CATEGORY + CATEGORY_TO_PRACTICE_AREAS).
