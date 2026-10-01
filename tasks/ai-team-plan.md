# AI Team + Ask-a-Pro — Implementation Plan

Status: APPROVED (concept) — ready to execute
Owner: Nexa Terminal
Last updated: 2026-10-01

## 1. Goal

Rebrand the single legal AI chat into a roster of **4 named AI agents** ("AI Team"),
one of which (the corporate agent) also runs the drag-and-drop contract review. Then
add a **human handoff**: from any AI chat the user can „Прашај професионалец", and from
any generated agreement „Побарај преглед од професионалец". Each request is emailed to
admin, hand-approved + assigned to a hand-picked Pro, and lives as an in-platform thread
in a new **Queries (Барања)** surface under Случаи. The Pro can propose a price at any
point in the thread.

This is the bridge in the two-sided model: AI usage (Basic/demand) → qualified lead for a
Pro (supply). See `memory/business-model-two-sided.md`.

## 2. Non-negotiables / principles

- **One chat engine, not four.** Add an `agent` param to the existing `ChatBotService`
  pipeline (sits alongside the existing per-user `stancePrefix`). Do NOT fork the RAG.
- **Contract review stays one service.** The corporate agent and the standalone
  `ContractAnalysis.js` page BOTH call the existing `ContractAnalysisService` — no second codepath.
- **Persona stays as tone.** The roster is *who* (agent); the persona picker
  (Практичен/Заштитник/Директен/Ментор) remains *how* (tone) INSIDE each agent.
- **Keep the standalone contract-review page** in addition to its home inside the corporate agent.
- **v1 quote = structured message only.** No payment rail in Nexa; payment happens offline
  between user and Pro (same as current engagements).
- Mirror the `cases` module patterns (owner-scoping, embedded sub-docs, public token, service+controller+route).
- Reuse `useTermsGate` / `FeatureTermsModal` for the data-sharing consent at handoff.

## 3. The AI Team roster

| Key | Name · Role | Engine | Tools | Bio (shown under avatar) |
|---|---|---|---|---|
| `legal` | **Марко** — Правен советник | ChatBotService (legal RAG) | — | „Марко дава брзи и јасни одговори на секојдневните правни прашања и оди право на суштината, без непотребни правни фрази." |
| `corporate` | **Елена** — Корпоративен адвокат | ChatBotService (legal RAG, corporate scope) | **Contract review** | „Елена се грижи за друштва, договори и регистрација во Централен регистар; прикачи ѝ договор и таа ќе ти го прегледа и ќе ти ги посочи ризиците." |
| `hr` | **Дејан** — Советник за работни односи | ChatBotService (legal RAG, employment scope) | — | „Дејан те води низ вработување, отказ, одмори и работни акти, за да ја спроведеш постапката без грешки и без ризик од спорови." |
| `marketing` | **Ива** — Маркетинг стратег | Marketing AI | — | „Ива предлага идеи за содржина, кампањи и настап на пазарот што носат резултат и го издвојуваат твојот бизнис." |

Notes:
- `legal`, `corporate`, `hr` share the legal RAG engine; they differ by (a) a short
  agent-flavor paragraph prepended to the system prompt, and (b) an optional retrieval
  category filter/boost (corporate → company/contracts; hr → employment). Start with
  flavor-only if retrieval filtering is risky; add scoping as a second pass.
- `marketing` routes to the existing marketing AI backend.
- Avatars/icons: reuse the emoji/icon pattern already in `PersonaControl.jsx`.

---

## PHASE 1 — AI Team rebrand + roster (ships independently)

Goal: user picks an agent, chats, and (for Елена) can drag-drop a contract — all on one engine.

### 1.1 Backend — agent profiles
- [ ] New `server/chatbot/agentProfiles.js`: a frozen catalog keyed by `legal|corporate|hr|marketing`
      with `{ name, role, bio, systemFlavor, retrievalScope|null, tools:[] }`. Single source of truth
      for both API and client (served via endpoint; client never hardcodes bios).
- [ ] `ChatBotService.askQuestion` / `askQuestionStream`: accept an `agent` arg; prepend
      `agentProfiles[agent].systemFlavor` to the prompt (compose with existing `stancePrefix`).
      Default `agent='legal'` when absent (back-compat for current callers).
- [ ] (Optional, 2nd pass) apply `retrievalScope` as a category filter/boost in `retrieveRelevantDocuments`.
- [ ] `server/routes/chatbot.js`: read `agent` from body on `/ask`, `/conversations/:id/ask`,
      `/conversations/:id/ask-stream`; validate against the catalog; store `agent` on the conversation
      doc so a conversation remembers which agent it belongs to.
- [ ] New `GET /api/ai/agents` (or extend `/api/ai/stance` response) returning the roster
      catalog (name, role, bio, key, hasContractReview) for the client.

### 1.2 Frontend — roster UI
- [ ] `client/src/components/chatbot/AgentRoster.jsx` (+ `.module.css`): 4 cards (icon, name, role, bio).
      Selecting an agent sets the active agent for the chat. Entry point into AIChat.
- [ ] `AIChat.jsx`: add `agent` to state; show the active agent (name + mini-bio) in the header;
      pass `agent` on every ask/stream call; keep `PersonaControl` chip (tone) alongside.
- [ ] Marketing: either route `marketing` selection to existing `MarketingAIChat.jsx`, or unify under
      AIChat with `agent='marketing'` hitting the marketing backend. (Decide at build; prefer unify if cheap.)
- [ ] Nav/branding: rename the chat entry point to „AI Тим"; roster is the landing view.

### 1.3 Contract review inside Елена
- [ ] Mount the existing `ContractDropzone` + analysis flow inside the corporate agent's chat
      (feature-gated to `agent==='corporate'`), calling the SAME `contractAnalysisApi` (`/upload`, `/analyze`).
- [ ] Keep `ContractAnalysis.js` standalone page working unchanged.

### 1.4 Phase 1 verification
- [ ] Each agent answers with its flavor; persona tone still applies on top.
- [ ] Елена's drag-drop produces the same analysis output as the standalone page (diff the response).
- [ ] Existing conversations without an `agent` field still load and default to `legal`.
- [ ] Credits/limits still deduct correctly (no regression in `/ask` flow).

---

## PHASE 2 — Ask-a-Pro + Queries (Барања)

Goal: close the loop from AI → admin approval → assigned Pro → in-platform thread + price offer.

### 2.1 Data model — `proRequests` collection
Mirror `casesService.js` conventions. One doc per request:
```
{
  _id,
  type: 'consult' | 'contract_review',
  userId,                 // requester (Basic)
  agent,                  // which AI agent it came from (null for doc-review)
  subject,                // short title
  context: {              // snapshot captured at request time
    question?,            // the user's question / ask
    conversationId?,      // link back to the AI thread (consult)
    transcriptExcerpt?,   // last N messages (consult)
    documentRef?,         // generated-agreement ref (contract_review)
    attachmentRef?,       // uploaded contract file ref (contract_review)
  },
  consent: { acceptedAt, version },   // data-sharing consent captured at click
  status: 'pending_approval' | 'approved' | 'active' | 'closed' | 'rejected',
  assignedProId: null,    // set by admin at approval (hand-pick)
  messages: [             // the shared thread
    { _id, authorId, authorRole:'user'|'pro'|'admin', body, kind:'message'|'quote', amount?, createdAt }
  ],
  createdAt, updatedAt, closedAt?
}
```
Indexes: `{ userId, updatedAt }`, `{ assignedProId, updatedAt }`, `{ status, createdAt }`.

### 2.2 Backend
- [ ] `server/services/proRequestsService.js` — CRUD + `addMessage`, `addQuote`, `assign`, `approve`,
      `reject`, `close`; owner/role scoping (user sees own; pro sees assigned; admin sees all).
- [ ] `server/controllers/proRequestsController.js` + `server/routes/proRequests.js`
      (`authenticateJWT`; role checks per view). Register route in `server.js`.
- [ ] **Triggers** (create a request):
  - [ ] From AI chat: `POST /api/pro-requests` type `consult` — captures question + conversationId + excerpt.
  - [ ] From generated agreement: type `contract_review` — captures documentRef (+ attachmentRef if uploaded).
- [ ] **Gating:** Ask-a-Pro is FREE to the Basic user (lead for Pro). No subscription charge.
      Pro-side read/respond routes behind `subscriptionGuard` (see `memory/subscription-guard-pro-routes.md`).
- [ ] **Email (Resend):** on new request → notify admin (approve link). On approve+assign →
      notify assigned Pro + notify user it's active. On new thread message → notify the other party.
      Reuse `emailService` patterns.
- [ ] **Consent audit:** record acceptance (reuse `termsAcceptances` pattern / `useTermsGate`).

### 2.3 Frontend — three views over one object
- [ ] **User view** — „Моите барања" in Basic terminal: list (status badges) + thread view.
- [ ] **Admin view** — inbox of `pending_approval`: read context, approve + hand-pick Pro (assign),
      or reject. (Admin-user area, near `LeadsInbox`.)
- [ ] **Pro view** — „Барања" under Случаи (Pro side): list of assigned requests + thread; „Понуди цена" action.
- [ ] **Shared** `ProRequestThread` component: message list + composer; Pro-only „Понуди цена" posts a
      `kind:'quote'` message (amount + scope); user sees it inline (accept/decline is just a reply in v1).
- [ ] **Trigger buttons:**
  - [ ] „Прашај професионалец" in AIChat (opens consent modal → creates `consult`).
  - [ ] „Побарај преглед од професионалец" on generated-agreement success screen (creates `contract_review`).

### 2.4 Phase 2 verification
- [ ] Full loop: user asks → admin email → approve+assign → Pro sees it → thread both ways → Pro sends quote.
- [ ] Access control: user cannot see others' requests; Pro only sees assigned; admin sees all.
- [ ] Consent recorded before any data leaves to a Pro.
- [ ] Emails fire at each transition (new / assigned / new message).
- [ ] No Pro route reachable without active subscription.

---

## 4. Open items to decide during build
- Marketing: unify into AIChat vs keep separate page (prefer unify if low-cost).
- Retrieval scoping for corporate/hr: flavor-only v1, add category filter as pass 2.
- Attachment storage for contract_review (reuse contract-analysis upload storage).

## 5. Out of scope (future)
- In-platform payments / escrow for Pro quotes.
- Auto-routing to Pros by category (v1 is hand-pick at approval).
- Pro-side analytics on lead conversion.

## 6. Rollout
- Phase 1 behind the normal build; Phase 2 behind a feature flag (`aiTeamProRequests`) OFF in prod
  until the admin approval flow is tested. Pre-revenue, so no migration caution needed
  (see `memory/no-paying-users-yet.md`). Do not commit/push until user confirms (see
  `memory/multi-agent-push-coordination.md`).
