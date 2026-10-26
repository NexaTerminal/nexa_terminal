# „Мои податоци" + confidentiality (Harvey Tier 1 #3 + #4)

Goal: answer "where does my (client's) data go?" before inviting lawyers — in the product, not by email.

## Built (2026-10-27, uncommitted)
- [x] `server/routes/myData.js` mounted at `/api/my-data` (JWT-Bearer, before CSRF; skipped in requestLog):
  - GET summary (counts), GET export [UI panel for both HIDDEN 2026-10-27 per user; endpoints live] (one JSON file; password/reset/company codes omitted),
  - DELETE ai?confirm=1 (chatbot_conversations incl. Корпа, user_ai_memory, user_agent_memory, ai_citation_checks),
  - DELETE activity?confirm=1 (user_events). Pro conversations exported, NOT erased (shared with the pro).
- [x] `client/src/pages/terminal/MyData.js` at `/terminal/my-data` — plain-language statement (storage, OpenAI API
  no-training, no selling, pro anonymity until the user reveals, AI memory, activity log 90 d), counts, export,
  two-step in-page erase (no browser dialogs). Linked in Header profile dropdown + mobile menu („Мои податоци").
- [x] Public privacy policy (mk + en): s2/s3/s5/s6/s7/s9 now cover AI conversations, OpenAI, activity log,
  retention (Корпа 30 d, activity 90 d) and the self-service page. Date 26 Oct 2026.
- [x] Pro confidentiality: new `proJoin` terms (professional secrecy, use only for the request, no external AI
  tools, no de-anonymising) shown once before a pro's first join in RequestsPage (was implied consent).
- [x] `proRequest` user terms: removed the stale "approved by an admin first" bullet, added the anonymity bullet; v1→v2.

## Verification
- my-data endpoints against an in-memory fake DB: counts, export (no password), 400 without confirm, erase removes
  only this user's rows, pro_requests kept.
- Lint clean on changed files (pre-existing warnings only); client build compiles.
- NOT done: visual check at 390px + desktop (browser extension not connected) — user to open /terminal/my-data.

## Needs the user's approval before push
- All legal wording (privacy policy, MyData statement, proJoin terms). The OpenAI claim relies on OpenAI's API terms.
- The older in-terminal `/terminal/privacy-policy` page (Dec 2025) was NOT updated; MyData links to the public one.
