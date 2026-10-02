# Layer 1 — Durable user memory for the AI Team

Goal: agents "remember" the user across conversations. A per-user "client file"
(shared by all legal agents) that is (a) injected into every answer and (b)
grown automatically from each exchange. Mirrors `stancePreferencesService`.

## Principles
- Reuse the stance-prefix mechanism exactly (compose above the base prompt).
- Extraction is CHEAP (utilityModel/mini) and ASYNC (never blocks the answer).
- Injected memory stays COMPACT (bounded facts, each short) — it's re-sent per question.
- Opt-out-able: `enabled` flag; user can view / delete / clear / toggle.
- Legal agents only (ЈУРА/НОВА/АРИА). Marketing is a follow-up.

## Backend
- [ ] `server/services/userMemoryService.js` — collection `user_ai_memory`
      `{ userId, enabled, facts:[{id,text,domain,createdAt,lastSeenAt,hits}], updatedAt }`.
      Methods: `get`, `getPrefix`, `learn(facts[])` (dedupe/merge/cap 30, evict LRU),
      `deleteFact`, `clear`, `setEnabled`. `buildPrefix` = compact „ШТО ЗНАМ ЗА КОРИСНИКОТ"
      block (inject top ~15 by hits/recency); never announce; current message wins over stale fact.
- [ ] `ChatBotService._getMemoryPrefix(userId)` + compose into BOTH ask paths:
      `agentFlavor + handoffNote + memoryPrefix + stancePrefix`.
- [ ] `ChatBotService._learnFromExchange(userId, question, answer)` — fire-and-forget after
      the AI message is saved (both paths); mini-model extracts 0–3 durable user facts → `learn()`.
      Skips when `enabled === false`.
- [ ] `server/controllers/userMemoryController.js` + `server/routes/aiMemory.js`
      (GET /, PUT /enabled, DELETE /:factId, DELETE /) — mirror stance controller/route.
- [ ] `server/server.js` — add `/ai/memory` to CSRF-exempt list + mount under subscriptionGuard.

## Frontend
- [ ] `client/src/components/chatbot/MemoryControl.jsx` (+ `.module.css`) — 🧠 chip next to
      PersonaControl; modal lists facts (delete each), master on/off toggle, „Исчисти сè".
- [ ] `AIChat.jsx` — render `<MemoryControl />` in the header actions.

## Verify
- [ ] Services load (syntax), client parses.
- [ ] Prefix composes in correct order; empty when no memory / disabled.
- [ ] Extraction is non-blocking and tolerant of non-JSON model output.

## Review — DONE (uncommitted)
Backend:
- `services/userMemoryService.js` — `user_ai_memory` collection; learn (dedupe by
  containment, bump hits, cap 30 evict LRU), getPrefix (inject top 15), enabled/delete/clear.
- `ChatBotService`: `_getMemoryPrefix`, `_buildPrefix` (agentFlavor·handoff·memory·stance,
  memory+stance fetched in parallel), `_learnFromExchange` (fire-and-forget, utilityModel,
  JSON-tolerant, skips when disabled) called after save in BOTH ask paths.
- `controllers/userMemoryController.js` + `routes/aiMemory.js` (GET /, PUT /enabled,
  DELETE /:factId, DELETE /); mounted `/api/ai/memory` under subscriptionGuard + CSRF-exempt list.
Frontend:
- `components/chatbot/MemoryControl.jsx` (+ css) — 🧠 chip w/ count, panel (facts+domain
  badges, per-fact delete, master toggle, Исчисти сè); added next to `<PersonaControl/>` in AIChat.
Verified: all files syntax/parse OK; service unit + mock-integration tests pass
(dedupe→2, hits bumped, disable blocks inject+learn, delete, clear).

Follow-ups (not built): apply memory to MarketingBotService (ПУЛС); Layer 2 episodic
recall; Layer 3 feedback/corpus learning. Default enabled=ON (pre-revenue, opt-out via toggle).
