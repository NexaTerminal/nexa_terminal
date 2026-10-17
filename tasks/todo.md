# Switch all Nexa server AI to gpt-5-mini

## Context / de-risking (DONE — verified live)
- `gpt-5-mini` is reachable on the current OPENAI_API_KEY.
- It is a reasoning model: `temperature` → HTTP 400; must use `max_completion_tokens` (not `max_tokens`); reasoning tokens count against the cap (128 reasoning tokens seen on a trivial reply → small caps starve output).
- LangChain `@langchain/openai@1.4.7` accepts `maxCompletionTokens` + `reasoningEffort`; raw `openai@6.41.0` accepts `max_completion_tokens` + `reasoning_effort`.
- `web_search` (Responses API) forbids `minimal` effort → use `low` there.

## Plan
- [ ] Step 1: create `server/config/aiModels.js` — single source of model roles + `isReasoningModel` + `langchainOptions()` + `completionParams()` + effort/floor logic. Default model everywhere = `gpt-5-mini`.
- [ ] Step 2: replace every call site to use the helpers (change only model/params, nothing else):
  - [ ] chatbot/ChatBotService.js: chatModel (main/low), utilityModel (utility/minimal), webSearchFallback (Responses API, effort low), getHealthStatus (report real model/effort, no temperature)
  - [ ] chatbot/MarketingBotService.js: chatModel (marketing/low), utilityModel (utility/minimal), raw completion ~L494
  - [ ] contractAnalysis/ContractAnalysisService.js: pre-scan (utility/minimal), analysis (main/low) via completionParams
  - [ ] controllers/casesController.js (utility/minimal)
  - [ ] services/blogGuidelineCheckService.js (utility/minimal)
  - [ ] services/inquiryEmailExtractor.js (utility/minimal)
  - [ ] services/interviewSummary.js (utility/minimal)
  - [ ] services/aiSummaryService.js (utility/minimal)
  - [ ] controllers/autoDocuments/companyActExtractionController.js (utility — move off OPENAI_MODEL)
  - [ ] controllers/customTemplateController.js (utility — move off OPENAI_MODEL)
  - [ ] controllers/lhc/lhcNarrativeController.js (main/low)
  - [ ] scripts/eval-answers.js (answer model from config; judge stays configurable)
  - [ ] Do NOT touch embeddings (text-embedding-3-small stays).
- [ ] Step 3: env — server/.env, server/.env.development, .env.example + list prod vars.
- [ ] Step 4: verify — single query, eval (gpt-4o vs gpt-5-mini), per-feature smoke tests, cost/latency, rollback to gpt-4o.

## Review

### Done
- `config/aiModels.js` created — single source of model roles + effort + floors + `isReasoningModel` + `langchainOptions()` + `completionParams()`. All roles default to `gpt-5-mini`; feature models default to their role.
- All 13 call sites rewired through the helpers (ChatBotService ×4, MarketingBotService ×3, ContractAnalysisService ×2, lhcNarrative, casesController, blogGuideline, inquiryEmailExtractor, interviewSummary, aiSummaryService, companyActExtraction, customTemplate, eval-answers). companyAct + customTemplate moved OFF OPENAI_MODEL onto the utility role.
- webSearchFallback: effort `low` (web_search forbids `minimal`); health endpoints report model+effort (no temperature).
- Embeddings untouched (text-embedding-3-small).
- Env updated: `.env`, `.env.development` → gpt-5-mini + effort + CHATBOT_MAX_TOKENS=8000, CHATBOT_TEMPERATURE removed. `.env.example` created.

### Verified
- gpt-5-mini reachable; `temperature` → 400; `max_completion_tokens`+`reasoning_effort` work (raw SDK + LangChain). Live probe + full single-query ЈУРА answer (non-empty, Macedonian, sources).
- Config param-shaping unit-tested offline (reasoning → drop temp, floor tokens, set effort; gpt-4o → keep temp/max_tokens). All role defaults resolve to gpt-5-mini.
- Rollback path exercised live: the gpt-4o baseline eval generated 9 real answers through `langchainOptions(model='gpt-4o')` → temperature kept, calls succeeded.
- All AI singletons load/construct cleanly on the new config.
- Cleanliness grep: no raw temperature/max_tokens/gpt-4o defaults left outside the wrappers.

### Full verification — COMPLETE (credits added, all re-run)

**Eval — 12 golden questions, judge gpt-4o (per-criterion avg /2.0, overall, pass rate):**
| criterion | gpt-4o | gpt-5-mini |
|---|---|---|
| faithfulness | 1.58 | **1.75** |
| citation_discipline | 1.58 | 1.58 |
| article_accuracy | 1.33 | **1.83** |
| decisiveness | 1.92 | 1.92 |
| practicality | 1.92 | **2.00** |
| language_mk | 2.00 | 2.00 |
| **OVERALL** | **86%** | **92%** |
| **PASS RATE** | **8/12 (67%)** | **11/12 (92%)** |
gpt-5-mini is **better or equal on every criterion** — NO regression. Biggest gain: article_accuracy (1.33→1.83). Only 1 failure (Q3 notice-period) — a SHARED corpus/retrieval gap (gpt-4o also fails it), not model-caused.

**Cost/latency (5 ЈУРА answers, $0.25/1M in, $2/1M out):** avg **$0.00517/answer**; input ~8–11k tok (legal context), output ~1–2k, reasoning only 64–384 tok (low effort is efficient). Pure LLM latency ~15s; full pipeline ~46s (dominated by retrieval/LDH/rerank, not the model).

**Per-feature smoke — 11/11 PASS** (non-empty; valid JSON where expected): ВЕРА, ГАРД (insurer named), ПУЛС, contract-analysis (JSON 6.6s ✓ well under 80s timeout — no timeout issue), case-brief (JSON), inquiry-extractor (JSON), AI-summary, interview-summary (JSON), LHC-narrative, company-act (JSON), custom-template (JSON).

**Rollback:** verified live — gpt-4o baseline generated 12 real answers through `langchainOptions(model='gpt-4o')` (temperature kept). Env-only rollback works.
