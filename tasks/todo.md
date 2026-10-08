# Plan — AI characters: per-character conversations (A) + continue where you left off (B)

Goal: each AI Team character (ЈУРА / НОВА / АРИА) gets its OWN thread list, and
re-opening a character resumes their last conversation instead of a blank slate.

Memory (Layer 1 user facts), persona/stance, and multi-turn history already exist.
This only scopes conversations by `agent` and auto-resumes.

No migration: existing conversations have no `agent` → simply won't show in the new
per-character lists (acceptable — all data is demo per `no-paying-users-yet`).

## A — Scope conversations per character

- [ ] `ConversationService.createConversation`: accept `options.agent`; store `agent`
      on the doc; scope the "deactivate other active" updateMany by `{userId, agent}`
      (so switching characters doesn't deactivate another character's thread).
- [ ] `ConversationService.saveMessage`: stamp `agent` on AI messages (future-proof;
      conversation.agent stays authoritative for display).
- [ ] `ConversationService.getUserConversations`: honor `options.agent` filter.
- [ ] `ConversationService.getLatestForAgent(userId, agent)`: return most-recent
      conversation (full, with messages) for that character, or null.  [serves B]
- [ ] `ChatBotService` askQuestion + askQuestionStream: pass `agent` into the AI
      `saveMessage` calls.
- [ ] `routes/chatbot.js`: `/conversations/new` reads `agent` from body → options;
      `/conversations` reads `?agent=` → filter; add `GET /conversations/latest?agent=`.
- [ ] `services/chatbotApi.js`: `createConversation(firstQuestion, agent)`;
      `getConversations(limit, offset, agent)`; add `getLatestConversation(agent)`.
- [ ] `ConversationSidebar.jsx`: take `agent` prop → pass to getConversations;
      refetch when `agent` changes (each character shows only its own threads).
- [ ] `AIChat.jsx`: pass `agent` to createConversation + sidebar; when loading a
      conversation, set the active agent from `conversation.agent`.

## B — Continue where you left off

- [ ] `AIChat.jsx`: on mount (after resolving ?agent=), bootstrap the character by
      loading `getLatestConversation(agent)` → hydrate messages + currentConversationId;
      if none, fresh slate. SKIP when `?q=` prefill (user came to ask something new)
      and on in-page hand-off (handoff intentionally starts a fresh thread).

## Verify
- [ ] Server modules load; ConversationService unit-exercise with mock db
      (create w/ agent → list filtered by agent → latest returns it).
- [ ] ESLint clean on changed client files.

## Review — DONE

All A + B items implemented and verified.

Changed files:
- server/chatbot/services/ConversationService.js — store `agent` on conversation,
  per-character "deactivate active" scope, agent filter in list, `agent` stamp on
  AI messages, new `getLatestForAgent`.
- server/chatbot/ChatBotService.js — pass `agent` into both AI saveMessage calls.
- server/routes/chatbot.js — `agent` on /new, `?agent=` filter on list, new
  GET /conversations/latest?agent= (placed before /:id).
- client/src/services/chatbotApi.js — createConversation(q, agent),
  getConversations(…, agent), new getLatestConversation(agent).
- client/src/components/chatbot/ConversationSidebar.jsx — `agent` prop → filter +
  refetch on character change.
- client/src/pages/terminal/AIChat.jsx — tag new conversations with agent; adopt a
  loaded conversation's agent; (B) bootstrap effect resumes the character's latest
  thread on mount (skipped when ?q= prefill / handoff keeps fresh thread).

Verified:
- ConversationService mock-db run: agent stored, no cross-character deactivation,
  agent-filtered list, AI-message agent stamp (user msg unstamped), getLatestForAgent
  returns latest / null. ✅
- Server modules parse + load (dummy OPENAI key). ✅
- ESLint clean on all 3 changed client files. ✅

Notes:
- No migration: legacy conversations (no `agent`) won't appear in per-character
  lists — acceptable (demo data). They remain in the DB.
- Not yet done (future): per-character memory (C).

---

# Plan — D: rolling conversation summary (+ history-load bug fix)

## Bug found (foundational)
ChatBotService.askQuestion/askQuestionStream call `getConversation(conversationId)`
with NO userId → service does `userId.toString()` → throws → caught → history = ''.
=> The AI never actually receives prior turns on follow-ups. Fix this first.

- [ ] ConversationService.getConversation: make `userId` optional (only filter when
      provided) so the internal load can't crash; still pass userId from routes.
- [ ] ChatBotService: pass `userId` at both getConversation call sites.

## D — rolling summary
Keep the last WINDOW(6) raw messages (as today) AND a cumulative `summary` of the
older turns, so a long chat stays coherent without resending the whole transcript.

- [ ] ConversationService: `updateSummary(conversationId, summary, summarizedCount)`;
      summary/summarizedCount default to ''/0 when absent.
- [ ] ChatBotService:
      - `_formatHistoryWithSummary(conversation)` → stored summary prefix + last-6
        formatted block; use it at both load sites (replace formatConversationHistory).
      - after saving the exchange (both paths), fire-and-forget
        `_maybeRollUpSummary(conversationId, allMessages, priorSummary, summarizedCount)`
        — folds newly-aged-out messages into the summary via utilityModel (gpt-4o-mini).
      - `_rollUpSummary(prior, agedMessages)` cumulative summarizer (fail-safe → prior).

## Verify — DONE
- [x] Mock-db: updateSummary persists; getConversation works with/without userId.
- [x] Rollup math: summarizedCount advances to total-WINDOW; no-op at/under WINDOW
      and when already summarized. History block = summary + recent window.
- [x] Modules load (dummy OPENAI key).

## Review — DONE
Bug fix (foundational): the AI now actually receives prior turns. Before, the RAG
path called getConversation without userId → crashed → history silently dropped, so
follow-ups had no memory. Fixed by passing userId + making userId optional.

D: conversations now carry a cumulative `summary` (+ `summarizedCount`). The LLM
history = rolling summary of older turns + last 6 raw messages. Summary extends
incrementally on the cheap utility model (gpt-4o-mini), async/best-effort.

Changed: server/chatbot/services/ConversationService.js (getConversation userId
optional, updateSummary), server/chatbot/ChatBotService.js (pass userId, hoist
conversation, _formatHistoryWithSummary at both load sites, _maybeRollUpSummary +
_rollUpSummary, HISTORY_WINDOW).

Integration-tested in-process (10-turn chat through real services, LLM stubbed):
history loads, summary rolls up incrementally (summarizedCount 0→14, 7 rollups),
summary injected on later turns. LLM quality + live SSE need deployed backend.

---

# Plan — C: per-character relationship memory + referential greeting

Each AI Team character remembers what it has worked on with the user across
conversations, and greets referentially on a fresh thread ("Добредојде назад —
последен пат работевме на …"). Layers ON TOP of the shared Layer-1 client file.

Growth is FREE: piggyback on the existing per-exchange `_learnFromExchange` LLM
call (extend it to also emit a 1-sentence relationship note) — no new LLM calls.
Gated by the existing memory enable flag (privacy opt-out covers it).

- [ ] `server/chatbot/services/agentMemoryService.js` — collection
      `user_agent_memory`, unique {userId, agent}. get / setNote / getPrefix.
- [ ] ChatBotService:
      - pass `agent` into `_learnFromExchange`; extend its single utility-model
        call to return { facts:[...], note:"…" }; store facts (unchanged) + upsert
        the per-character note. Fail-safe: bad parse → behave exactly as today.
      - `_buildPrefix`: inject agent-memory block below shared memory
        (order: flavor · hand-off · shared memory · AGENT memory · stance).
- [ ] route `GET /api/chatbot/agent-memory?agent=` → { note, hasMemory }.
- [ ] client/chatbotApi: `getAgentMemory(agent)`.
- [ ] AIChat: on a FRESH thread (messages empty, not resumed/hand-off), fetch the
      note and show a warm referential greeting line in the welcome panel.

Limitation (v1): note reflects the latest substantive exchanges with the character
(cumulative via the extended learn call); not a full cross-thread merge.

## Verify — DONE
- [x] agentMemoryService mock-db: empty→'', setNote upsert, per-character isolation,
      getPrefix block (header+name+note), empty→'' prefix, clear.
- [x] _learnFromExchange real-path parse (RunnableLambda-stubbed LLM): object
      {facts,note} → learns + sets note; legacy bare array → learns, no note;
      garbage → no-op; empty note → learns only. Fact-learning preserved.
- [x] modules load; ESLint clean (AIChat, chatbotApi).

## Review — DONE
C shipped. New Layer-2 per-character memory:
- server/chatbot/services/agentMemoryService.js — user_agent_memory {userId,agent}.
- ChatBotService — _getAgentMemoryPrefix + injected in _buildPrefix (below shared
  memory); _learnFromExchange now takes `agent`, emits {facts,note} from its single
  existing utility-model call (no new LLM cost), upserts the note. Gated by the
  shared memory enable flag.
- routes/chatbot.js — GET /agent-memory?agent= (honors opt-out).
- client chatbotApi.getAgentMemory; AIChat fetches on character switch and shows a
  "👋 Добредојде назад! Последен пат работевме на: …" line in the welcome panel on a
  fresh thread (not during hand-off).

Caveat: note quality + live path need the deployed backend (OpenAI). Logic/parse/
persistence verified in-process.

---

# E — chat-feel polish — DONE
- Typing indicator: three bouncing dots in the AI bubble while the reply is pending
  (before the first streamed token); cursor still shows once tokens arrive.
  (AIChat.jsx bubble + AIChat.module.css .typingDots/@keyframes typingBounce)
- Date-grouped sidebar: conversations bucketed Денес / Вчера / Последниве 7 дена /
  Постари with headers. (ConversationSidebar.jsx groupByDate + .dateGroupHeader CSS)
- (Per-bubble avatars + relative timestamps already existed.)
Verified: ESLint clean; date-bucketing boundaries unit-checked. UI-only, no server.

---

# Integration #1 — real artifact context into the dock — DONE

Goal: when a character is opened from a document (and later LHC/cases), it answers
about THAT artifact, not generically. Mechanism: persist a `focusContext` on the
conversation; inject it into every prompt (clean transcript — not a visible msg).

- ConversationService: `normalizeFocusContext` ({kind,label,data}→{kind,label,text},
  scalars only, capped 3000) + store `focusContext` on createConversation.
- ChatBotService: `_formatFocusContext` + prepend it in `_formatHistoryWithSummary`
  (so both /ask and /ask-stream inject it on every turn in the thread).
- routes/chatbot.js: `/conversations/new` accepts `focusContext`.
- client: chatbotApi.createConversation(q, agent, focusContext); ChatDockContext
  openChat carries `context`; AgentChatDock passes it at creation and starts a fresh
  thread on each new seed (convId via ref, no stale closure); BaseDocumentPage passes
  doc context on both „Провери со …" (pre-gen, full formData) and „Прегледај со …"
  (post-gen, category).

Verified in-process: normalize (scalars kept, empties/nested dropped, string cap,
empty→null), injection into history block, no-focus path unchanged; ESLint clean.
Live LLM behavior needs deployed backend.

Future adopters of the same mechanism: LHC report, Предмети (cases), HR employee.
