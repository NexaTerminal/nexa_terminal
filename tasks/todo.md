# Legal AI quality overhaul (budget-constrained)

Constraint: token budget is tight. 4 questions/week limit STAYS. Auxiliary LLM
calls on gpt-4o-mini; embeddings stay -small; eval is retrieval-only by default.

## ChatBotService.js
- [ ] Utility model (gpt-4o-mini, temp 0) for condensation + decomposition
- [ ] Query condensation: history + follow-up → standalone MK search query; use for RETRIEVAL in both askQuestion and askQuestionStream
- [ ] Fix keywordSearch: MK stopword-stripped keywords + Qdrant min_should filter (fallback to must), instead of whole-question match
- [ ] maxTokens 2048 → 4096 (cap only; short answers unaffected)
- [ ] Prompt rebalance (~35% shorter):
  - hard rule: always answer in Macedonian (Cyrillic)
  - graduated certainty: categorical where law is explicit; hedge only for interpretation/fact-dependent points
  - labeled general-knowledge fallback when context is silent (no refusal wall; never invent article numbers)
  - cut marketing plugs; condense conversation-continuity + checklist sections

## process-documents.js
- [ ] Full rebuild every run (fixes latent bug: incremental run deleted the whole collection but re-uploaded only changed docs)
- [ ] Prefix each chunk's embedded text with law/doc name (+ year for brochures)
- [ ] Parse year from filename → metadata docYear/isBrochure; skip brochures older than BROCHURE_YEAR_CUTOFF (default 2020)
- [ ] Create Qdrant full-text payload index on pageContent (keyword search needs it)

## Eval harness
- [ ] scripts/eval-rag.js + golden set (~20 MK legal questions → expected doc/article), retrieval-only (hit@k), ~free to run

## Corpus (user action)
- [ ] tasks/legal-corpus-missing.md — list of missing laws to collect

## Review

All code items done and verified (node --check on all files; template renders
with exactly stancePrefix/context/question; keyword extraction tested on real
MK questions; filename year/brochure detection tested against real corpus names).

- ChatBotService: utilityModel (gpt-4o-mini) for condensation+decomposition;
  condenseSearchQuery wired into askQuestion AND askQuestionStream; keywordSearch
  rewritten (stopword-stripped keywords, min_should≥2, must-fallback);
  maxTokens→4096; prompt rewritten — ~50% smaller, always-MK hard rule,
  decisive-where-law-is-clear, labeled general-knowledge fallback instead of
  refusal wall, marketing cut, verified-article rule kept.
- process-documents.js: full rebuild each run (fixes destructive incremental
  bug), chunk text prefixed with law/doc title (+year for brochures), stale
  brochures (<2020) excluded, full-text payload index created (keyword search
  precondition).
- scripts/eval-rag.js + eval/golden-questions.json: 22 MK golden questions,
  retrieval-only hit@k scoring via the real retrieval path (~free to run).
- tasks/legal-corpus-missing.md: prioritized law list for the user to collect.

Deploy note: service changes are safe against the EXISTING Qdrant collection
(keyword search fails soft exactly as before until reprocess adds the index).
Full effect requires: node scripts/process-documents.js (rebuild, ~$0.10) and
then node scripts/eval-rag.js for the baseline.

Budget: aux calls on mini (~$0.0002/q), prompt halved (saves input on every
question), maxTokens is a cap not a spend, embeddings stay -small, eval is
retrieval-only, 4/week limit untouched.
