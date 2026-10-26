# Citation validator + verified-citation chips (Harvey Tier 1 #1 + #5)

Goal: no AI answer ever shows an article number we can't back up with the law text we retrieved.

## Design
- `server/chatbot/citationValidator.js` — after the answer is generated, find every „Член N" / „чл. N" /
  „членови N, M и K" and check it against `metadata.article` of the retrieved CITABLE chunks.
  - If the citation names a law right after it („од Законот за работните односи", „од ЗРО"), the article
    must come from THAT law; a fully named law we never retrieved ⇒ unverified. Unknown acronym ⇒ number-only.
  - Unverified ⇒ inline „ ⚠" after the number + one footnote (check in Службен весник / with a lawyer).
  - Verified ⇒ `citations[]` { article, law, documentName, score, confidence high/medium/low }.
- `ChatBotService._checkCitations` — used by askQuestion + askQuestionStream; logs to `ai_citation_checks`
  (90-day TTL) when an answer cites anything. Never throws.
- Stream: new SSE event `citations` { content, citations, unverified } after `suggestions`; client swaps in
  the checked text. Saved message carries `citations` + `unverifiedCitations`.
- Client: `components/chatbot/CitationChips.jsx` under each AI answer in AIChat (✓ Член N · law · band;
  one ⚠ chip listing unverified).

## Steps
- [x] Validator module + 13 offline cases (`node server/scripts/eval-citations.js`)
- [x] Hook into both answer paths + persistence + log collection
- [x] Client event + chips + history reload
- [ ] Live check in the browser with a real answer
- [ ] Watch `ai_citation_checks` for a week: false-⚠ rate and which character invents articles

## Review (2026-10-26)
- Offline tests 13/13; service hook tested with a fake DB (marked text, chip data, one log row, TTL index once).
- Client build compiles; lint clean (one pre-existing warning).
- NOT done: live end-to-end with a real AI answer in the browser (needs login + spends an OpenAI call).
- Known limits: follow-ups that re-cite an article retrieved in an EARLIER turn get ⚠ (honest but noisy);
  articles cited from LDH case-law text (e.g. ЕКЧП член 8) get ⚠ — no article metadata there.
