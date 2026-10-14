# Ask-a-Pro → "join the conversation" redesign

Reframe the pro_requests flow from a bureaucratic "барање/одобрување/преземи" into
"invite a professional into a conversation" (like adding a friend to a group chat).
Backend model already = broadcast → first-come atomic claim → locked. This is a
UI/UX + copy reframe + in-app notifications.

## Decisions
- Full redesign (user inbox + waiting state + pro join card + copy + broken-card fix + bell).
- In-app bell notifications ON, keep the existing emails.

## Build
### Backend (proRequestsController.js)
- Wire `userNotificationService.notify` (bell, best-effort, with io if present):
  - new request → each eligible Pro ("Ново барање · {subject}" → /terminal/pro/board)
  - Pro joins → requester ("{Pro} се приклучи…" → /terminal/requests)
  - new message → counterpart (→ their requests view)
- Keep all existing emails.

### Frontend
- RequestsPage.js: group-chat copy; user view → conversation inbox (icon + subject +
  plain status line + time); calm waiting state for `open`; board → single clear
  "Приклучи се во разговорот" join card with inline consent.
- RequestsPage.module.css: fix the broken list card; inbox + waiting + join styles.
- ProRequestThread.jsx: "{Pro} се приклучи во разговорот" system line; lighter copy.
- AIChat.jsx: success-notice copy → group-chat framing.

## Status
Done (full redesign + bell notifications). Verified: all touched client files parse,
controller loads. Not yet run in the live app.

Files: proRequestsController.js (in-app notify on open/join/message, kept emails),
RequestsPage.js + .module.css (chat-inbox rows, waiting state, join copy, fixed card),
ProRequestThread.jsx + .module.css ("X се приклучи" system line, softened copy),
AIChat.jsx (invite framing), nav.js (label → „Разговори").
