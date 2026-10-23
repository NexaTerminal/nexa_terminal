# „Разговори" → LinkedIn-style corner messaging bar (Phase 1 + 2)

Approved 2026-10-23.

## Server
- [x] `proRequestsService`: `seenAt.user` set when owner opens (getForActor) or writes (addMessage);
      `unreadForUser(doc)` = pro/admin messages after `seenAt.user`; `present()` adds `unreadForUser` for the owner view;
      `listForUser` passes viewerRole 'user' (was map index); `unreadSummaryForUser(userId)`.
- [x] `GET /api/pro-requests/unread` → `{ count }` (conversations with unread pro replies).

## Client
- [x] `lib/inbox.js` — `INBOX_REFRESH_EVENT` + `useInboxCount(user)` (user unread + pro awaiting), 60s poll + focus + event.
- [x] `components/chatbot/MessagingBar.jsx` — rightmost item of the dock bar (`/terminal*` only, logged in):
      collapsed bar (avatar, „Разговори", badge) → panel with tabs „Професионалци" / „AI тим", „Види ги сите →".
      Mobile: round bubble + full-screen sheet. Body gets bottom padding while visible.
- [x] `ChatDockContext` windows keyed `pro:<id>` → `ProChatWindow` (Phase 2) in AgentChatDock.
- [x] `ProRequestThread` `compact` prop (no transcript, short disclaimer, no email/close toolbar, auto-scroll).
- [x] `RequestsPage` honours `?id=` (open that conversation) — target of the window's „full page" button.
- [x] Remove „Разговори" from sidebar nav (+ Sidebar badge hook); keep `PRO_UNANSWERED_EVENT` export.

## Verify
- [x] Server: unread counting logic unit-checked; route file loads. (End-to-end against DB not run.)
- [x] Lint changed files + full production build OK.
- [ ] Browser check of bar/panel/window (manual — test browser was not logged in).

## Review
Built 2026-10-23, uncommitted.
- unreadForUser unit-checked (never seen → 2, seen 10m ago → 1, seen now → 0; pro view → 0). Routes load.
- Client: eslint clean (no errors), production build compiles.
- NOT checked in a browser (login needed). Unread is per conversation for the requester; the Pro side keeps "awaiting your reply".

## Group chat (added 2026-10-23)
User decision: with a pro in, AI answers only when the **user** writes `@ai` (or @аи / @<character>); pro can't call AI. Educate users with a tip + @ai chip + placeholder.
- [x] Server: `groupMention` flag gate on /ask + /ask-stream; AI answer mirrored to pro thread as `authorRole:'ai'` (anonymized for Pro); directive reworded for group context; `ai` ignored by awaitingPro/unread.
- [x] Client: `mentionsAi` + tip in lib/proChat; dock ChatWindow (group header with stacked pro avatar), AIChat page, ProRequestThread (AI bubbles, @ai from the pro window, AI history shown in compact too).
- [x] Verified: server syntax + unit checks (pro sees anonymized AI copy; unread/awaiting ignore ai); mention regex cases; client production build compiles.
- [ ] Not run: live end-to-end with a real pro conversation + OpenAI (browser not logged in).
