# Nexa Legal AI vs. Harvey AI — Gap Assessment & Backlog

> Grounded in the actual code as of Oct 2026: `server/chatbot/ChatBotService.js`
> (RAG engine), `agentProfiles.js` (AI Team personas), the retrieval/rerank/
> grounding pipeline, `LegalDataHunterService.js`, the OpenAI web-search fallback,
> the memory layers (`user_ai_memory`, `user_agent_memory`), and the corpus
> ingestion scripts. This is a working doc — not a commitment — for when we pick
> this up.

## Framing (read first)

Harvey is a **BigLaw** tool (Am Law 100, enterprise seats, firm data vaults).
Nexa is the **Macedonian SMB + solo/small-firm** equivalent. "Catching up to
Harvey" is **not** the goal on every axis:

- Some Harvey differentiators don't matter for our market (enterprise tenancy at
  BigLaw scale).
- We already beat Harvey on axes it doesn't play in: **Macedonian law corpus**,
  **ready-to-file document generation**, and **AI→human-lawyer handoff**
  (`pro_requests`) — Harvey's users *are* the lawyers, so it has no handoff.

Scores below are **for our market**, not BigLaw's.

---

## 1. Legal-specific fine-tuning & multi-model middleware — ~70%

**Harvey:** frontier models + legal-domain training, acting as middleware.

**What we have (in code):**
- Already a **middleware**, not a raw chatbot. `ChatBotService` runs on
  OpenAI/Claude via `aiModels`, with a role-specific system prompt
  (`systemPromptTemplate`), per-agent personas (ЈУРА / ВЕРА / ГАРД), a **utility
  model** for cheap sub-tasks, and a **web model** for fallback — explicit
  multi-model routing.
- **Legal specialization via RAG + prompt engineering** (not fine-tuning):
  hybrid retrieval (vector + keyword + RRF), query decomposition for complex
  questions, a dedicated **rerank pass** to surface the exact article,
  agent-scope boosting, and a structured legal output format
  (ПРАВНА ОБЛАСТ / ПРИМЕНЛИВ ЗАКОН / ПРАВНА АНАЛИЗА).

**Gap:** only true fine-tuning — and for MK law that's arguably the wrong
investment (tiny corpus, expensive, frontier models already handle MK Cyrillic
well). Prompt + RAG specialization is the right call.

**Add:**
- **Golden-set eval harness** (build on `validate-embeddings.js` + the existing
  eval workflow) run on every corpus/prompt change — the real "fine-tuning"
  substitute and our biggest quality lever.
- **Model routing by task difficulty** (cheap model for simple Q, frontier for
  multi-part risk analysis) — we have the pieces (`utilityModel`), not the router.

---

## 2. Grounded source verification & traceability — ~80% (strongest axis)

**Harvey:** answers tied to real authorities, anti-hallucination.

**What we have:**
- **Verified-article enforcement**: chunks carry a confirmed `article` from the
  ingestion pipeline; `formatContext` injects `ВЕРИФИЦИРАН ЧЛЕН: N` and the prompt
  *mandates* citing it verbatim and *forbids* inventing article numbers.
- **Citability gating**: `isCitableSource()` separates real law from
  brochures/data-dumps; non-citable sources are explicitly marked "НЕ ЦИТИРАЈ".
- **Gap-triggered escalation**: weak local match → Legal Data Hunter (MK case law
  + EU); still no strong citable law → OpenAI `web_search` fallback, returned as
  *unofficial* background with a reservation + link (never as binding law).
- **Per-source scores** surfaced as confidence.

**Add:**
- **Post-generation citation validator**: a cheap verifier pass that checks every
  "Член N" in the answer actually appears in the retrieved context, and
  strips/flags any that don't. Today grounding is enforced by prompt instruction,
  not a hard check — this closes the last hallucination gap.
- **Clickable citations**: deep-link each cited article to its Службен весник /
  source location in the UI.
- **Confidence banding in the UI** ("high / medium / unverified") driven by the
  scores we already compute.

---

## 3. Enterprise security & confidentiality (privilege) — ~30% (biggest Pro-side gap)

**Harvey:** data isolation, strict tenancy, compliance frameworks.

**What we have:** standard SaaS auth (JWT, CSRF, subscription gating, admin
isolation), a shared read-only law corpus (no client data in it), per-user memory
rows, and the anonymizer used in the inquiry / pro-request flow. But there is **no
per-tenant data-isolation model, no privilege-grade confidentiality posture, no
audit trail on AI queries, no data-retention/redaction controls** surfaced to the
user.

**Add (ordered by leverage for the lawyer pilot):**
- **Plain-language confidentiality / data-processing statement + ToS** for Pro
  users (what's stored, where, retention). Cheap — lawyers will *ask* for this
  before typing a client fact.
- **Per-user AI query audit log** (who asked what, when) — table-stakes for a firm.
- **Conversation retention controls**: auto-expiry / "delete thread + its memory"
  that truly purges `user_ai_memory` / `user_agent_memory`.
- **PII/client-name redaction toggle** before a question leaves to the model
  (reuse the pro-request anonymizer).
- Medium-term: **tenant isolation** if we ever host a firm's own documents.

---

## 4. Tailored legal workflows & document vaults — ~65% (workflows strong, vault absent)

**Harvey:** research assistant + secure document vaults + multi-step automations.

**What we have (strong, in places *beyond* Harvey for SMBs):**
- **Document generation** — core strength: 90+ MK legal templates, incorporation
  packs, central-register changes. Harvey doesn't generate ready-to-file MK docs.
- **Legal Health Check** (compliance scoring) + **Contract analysis**
  (`/api/contract-analysis`) + **Cases module** (Предмети: deadlines, reminders) +
  **HR registry**.
- **In-context "focus" workflows**: `focusContext` lets the AI answer about *this*
  specific generated document / LHC report / case — a real multi-step bridge.
- **Human-in-the-loop** (`pro_requests`, AI→lawyer handoff) — Harvey has nothing
  like this.

**Gap — no "document vault":** `focusContext` is one ephemeral document passed
in-prompt; the RAG corpus is central MK law only. No persistent per-user/per-firm
repository the AI can retrieve across ("ask across all my matters").

**Add:**
- **Real document vault**: persist a user's generated + uploaded files, embed them
  into a **per-user private Qdrant namespace**, and let the AI retrieve across them
  ("What did my 2025 lease with X say about termination?"). Single biggest feature
  to feel "Harvey-like."
- **Multi-step workflow chaining**: LHC finding → auto-draft the fixing document →
  file in Cases. All three modules exist; they're not yet chained.

---

## 5. Firm-specific & client-context integration — ~40%

**Harvey:** encodes internal firm knowledge, client history, proprietary precedents.

**What we have:**
- **Layer-1 user memory** (`user_ai_memory`, durable cross-conversation facts) +
  **Layer-2 per-character rolling summary** (`user_agent_memory`) + per-thread
  history with summarization. Real long-term context — more than most chatbots.
- But it's **per-user preference/fact memory, not a firm knowledge base or
  precedent library.**

**Add:**
- **Precedent/clause library per user**: save "my standard termination clause,"
  retrieve it into drafting.
- **Firm-level shared memory** for Pro teams (sub-seats already exist) so a firm's
  knowledge is shared across its seats.
- **Client/matter profiles** the AI reads from — feed Cases-module facts into AI
  context automatically.

---

## Consolidated prioritized backlog (the "full list")

### Tier 1 — highest leverage, mostly cheap, do first
1. Post-generation **citation validator** (hard anti-hallucination check vs. retrieved context).
2. **Golden-set eval harness** wired into every corpus/prompt change.
3. **Confidentiality / data-processing statement + ToS** for Pro lawyers.
4. **Per-user AI query audit log** + real "delete thread & purge memory."
5. **Clickable citations** → source / Службен весник + confidence bands in UI.

### Tier 2 — the "feels like Harvey" features
6. **Per-user document vault** with a private Qdrant namespace (retrieve across your own docs).
7. **PII/client-name redaction toggle** before model calls (reuse pro-request anonymizer).
8. **Workflow chaining**: LHC finding → draft fixing doc → attach to Case.
9. **Model router** by task difficulty (cost + quality).

### Tier 3 — firm-scale, only if the lawyer pilot pulls us there
10. **Firm-level shared memory / precedent library** across sub-seats.
11. **Client/matter profiles** auto-fed into AI context from the Cases module.
12. **Tenant isolation** hardening if we host firms' private corpora.

---

## Bottom line

On **grounding/traceability (#2)** and **MK-specific workflows/document
generation (#4)** we're genuinely in Harvey's spirit and ahead for our market.
The two real gaps are **confidentiality posture (#3)** and **private document
vault + firm knowledge (#4/#5)**. Of those, **#3 is cheap and blocks lawyer
trust — highest ROI to build next.**

### Scorecard

| Axis | Harvey focus | Nexa level |
| --- | --- | --- |
| 1. Fine-tuning & multi-model middleware | Legal-trained middleware | ~70% |
| 2. Grounded source verification | Anti-hallucination, traceability | ~80% |
| 3. Enterprise security & confidentiality | Isolation, privilege, compliance | ~30% |
| 4. Tailored workflows & document vaults | Research + vaults + automation | ~65% |
| 5. Firm-specific & client context | Firm knowledge, precedents | ~40% |
