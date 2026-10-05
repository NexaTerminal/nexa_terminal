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
- Not yet done (future): per-character memory (C) + rolling summary (D) from the
  earlier discussion.
