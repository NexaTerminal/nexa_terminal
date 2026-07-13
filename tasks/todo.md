# Homepage content + design pass (nexa.mk, MK-first) — 2026-07-11

## Goal
1. Explain Nexa Terminal **in full** on the homepage — today it only shows 4 bullets
   (documents, compliance, AI, contract analysis) and never mentions networking
   (Виртуелен саем, Барање за понуди, Случаи), content sharing (блог, Topics Q&A,
   билтен) or education (Курсеви).
2. Fix alignment/design inconsistencies:
   - "Дел 1" lives inside the dark CTA band directly after the hero → confusing story order.
   - "Дел 2" chapter marker is left-aligned with a border-left while "Дел 3" is centered → mixed alignment.
   - Satellite grid is 3 columns with only 5 cards → unbalanced second row.
3. Add **osiguran.nexa.mk** (free/neutral insurance-rights guide, routes disputes to lawyers)
   everywhere the network is listed.

## Todo
- [x] `Home.js`: new light "Дел 1 — Што прави Терминалот" section after hero with a
      6-card feature grid (documents / Nexa AI / compliance checks / networking &
      opportunities / marketing & content / education) using existing `.featureGrid`
      + `nx-card` + `nx-icon-wrap` primitives.
- [x] `Home.js`: dark automate band loses its "Дел 1" chapter num (becomes the CTA of
      Part 1) and its bullet list expands to mirror all 6 pillars.
- [x] `Home.js`: center the "Дел 2" chapter marker (`chapterMarkerCentered`) for
      alignment consistency with Дел 3.
- [x] `Home.js`: add osiguran.nexa.mk to SATELLITES (6 cards → balanced 3×2 grid).
- [x] `EcosystemMap.js`: add osiguran tile.
- [x] `PublicFooterV2.js`: add osiguran link.
- [x] `schemaGraph.js`: add https://osiguran.nexa.mk to NEXA_ORG.sameAs.
- [x] `mk.json` + `en.json` (website ns): rework feature2/feature4, add feature5/feature6,
      broaden heroSubtitle, add `ecosystem.osiguran`, bump ecosystemHeading 7→8;
      also fixed About-page counts (7→8 properties, 5→6 guide sites).
- [x] Verify: client production build passes (`CI=false npm run build`, +3.4 kB gzip).

## Review
- Homepage now tells the full Terminal story in six modules keyed to the actual
  sidebar (Документи / Nexa AI / Проверки / Вмрежување и можности / Маркетинг и
  содржина / Курсеви); copy sourced from real features, no invented claims.
- Alignment fixes: Дел 1 moved out of the dark band into a light centered section;
  Дел 2 marker now centered like Дел 3; satellite grid balanced at 3×2.
- osiguran.nexa.mk (verified live: neutral insurance-rights guide → routes disputes
  to lawyers) added in all 4 network listings: Home SATELLITES, EcosystemMap,
  PublicFooterV2, schemaGraph sameAs. Note: the satellite list is duplicated across
  those 4 files — future additions must touch all 4.
- Not committed — parallel agents share this repo (per memory); user pushes when ready.
- Visual check in browser not done (Chrome extension disconnected) — worth a quick
  look at / and /about after deploy.

---

# [DONE — shipped July 2026] Legal AI quality overhaul (budget-constrained)

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
