# AI Characters Tuning Loop

Status: ACTIVE
Owner: Nexa Terminal
Started: 2026-10-19

## What this is

A repeating, interactive tuning loop to improve the Nexa AI characters. Each
**round**: Claude presents **20 multiple-choice questions (a/b/c)** → the user
answers in one line (e.g. `1a 2c 3b ...`) → Claude edits the code to match →
Claude logs the changes here → next round. The user just sits, reads questions,
answers, and watches the code update.

## The characters (and where each lives)

| Char | Key | Role | Tuning surface |
|---|---|---|---|
| **ЈУРА** | `legal` | Business lawyer (risk + procedure) | `server/chatbot/agentProfiles.js` → `AGENT_PROFILES.legal.systemFlavor` |
| **ВЕРА** | `hr` | HR advisor (diplomatic, people-first) | `agentProfiles.js` → `AGENT_PROFILES.hr.systemFlavor` |
| **ГАРД** | `insurance` | Insurance & risk expert (verbatim quoting) | `agentProfiles.js` → `AGENT_PROFILES.insurance.systemFlavor` |
| **ПУЛС** | `marketing` | Marketing strategist | `server/chatbot/MarketingBotService.js` |
| **(shared)** | — | Format / length / SUGGESTIONS / pro-handoff / disclaimer | `server/chatbot/ChatBotService.js` systemPromptTemplate |
| **(routing)** | — | Cross-character handoff | `agentProfiles.js` → `TEAM_DIRECTORY` |

Display copy (names/bios/icons) is client-side in `client/src/config/aiAgents.js`.

## Rules of the loop

- **Batch size: 5 questions at a time** (changed from 20 after Round 1, per user 2026-10-19). A "round" is a theme; it's delivered in 5-question batches.
- Each batch has options **a / b / c** (sometimes a 4th). User
  may answer "keep" / "skip" / add free-text nuance for any item.
- Claude makes the **minimal edit** per answer; no edit when the answer = current
  behavior.
- After editing, Claude appends a **Round changelog** below (what changed, which
  file/line) so we never lose the thread across context resets.
- Each round has a **theme** so questions stay coherent.
- Do NOT commit/push (see `memory/multi-agent-push-coordination.md`) until the
  user says so.

## Round plan (themes — adjustable)

1. **Foundations** — team-wide tone, length, warmth, pro-handoff aggressiveness, citation/disclaimer, plus core identity of each character.
2. **ЈУРА deep-dive** — risk framing, procedure/deadline emphasis, when to ask clarifying Qs, example-from-practice behavior.
3. **ВЕРА deep-dive** — dialogue style, soft-path vs legal escalation, employee-rights balance.
4. **ГАРД deep-dive** — which-insurer gate, verbatim quoting strictness, exclusions/traps emphasis.
5. **ПУЛС deep-dive** — idea style, MK-market specificity, format.
6. **Routing & handoff** — when characters refer to each other, pro-in-the-loop.
7+. Re-tune based on real chat transcripts.

(Rounds can repeat/re-order; the loop continues as long as the user wants.)

---

## Decisions & changelog

### Round 1 — Foundations (answered 2026-10-19)
Answers: 1b 2b 3a 4b 5b 6a 7a 8a 9b 10c(~2/5) 11b 12b 13a 14b 15a 16c 17c 18c 19a 20a

Kept (no change): 1,2,6,7,8,13,15,19,20.

Changes applied:
- **Q3 no emoji (team-wide):** ChatBotService ФОРМАТ + MarketingBotService ФОРМАТ → "БЕЗ емоџи и иконки — само текст"; removed ПУЛС's emoji permission.
- **Q4 offer pro-handoff more often:** ChatBotService ПОНУДА ЗА ЧОВЕК-ПРОФЕСИОНАЛЕЦ — widened trigger ("ПОЧЕСТО, не само крајни случаи"; added значаен износ / одлука со последици).
- **Q5 subtle disclaimer:** ChatBotService DISCLAIMER → one subtle line always ("Напомена: ова е информативен одговор, не правен совет."), lawyer-link only on first answer; updated both in-prompt examples to match.
- **Q9 cite specific articles more:** ЈУРА systemFlavor — added **Цитирај конкретно** bullet (name „Член N" explicitly, never invent).
- **Q10 analogies ~2/5:** ChatBotService instinct #1 made SELECTIVE ("не во секој одговор, ~1 во 2-3"); simple-flow format + checklist softened to "по потреба".
- **Q11 ВЕРА follow-up only when needed:** removed mandatory "заврши СЕКОЈ одговор со прашање".
- **Q12 ВЕРА lean to employer goal:** rewrote opening — user is the employer; solve their practical goal while respecting employee rights as the soft-path guardrail.
- **Q14 ВЕРА light structure:** allow short bullets/numbered steps (no heavy section headings).
- **Q16 ГАРД paraphrase + quote:** citation rule now paraphrase-for-clarity THEN short verbatim quote of key clause.
- **Q17 ГАРД lead with exclusions:** Призма reordered to start with exclusions/limits/franchise/underinsurance, then coverage; surface traps proactively.
- **Q18 ПУЛС bolder:** added instinct #6 — always offer ≥1 bold/stand-out creative idea (still small-budget feasible).

Files touched: server/chatbot/ChatBotService.js, server/chatbot/agentProfiles.js, server/chatbot/MarketingBotService.js. Syntax-checked OK. Not committed.

### Round 2 — ЈУРА deep-dive (5-question batches)
**Batch 1** (2026-10-19): 1a 2b 3b 4b 5b+note. Kept: 1.
- Q2 risk warnings more liberal: instinct #4 → allow 2–3 „Внимавајте" when warranted.
- Q3 legal reasoning used regularly: instinct #2 reframed to "користете РЕДОВНО / активно научи го корисникот да расудува".
- Q4 tighter length: concrete-case 500-1000 → **300-600 words**, "збиено, без полнење".
- Q5 action plan for procedural only + always a next step: ПРАКТИЧЕН АКЦИСКИ ПЛАН now full plan for procedural Qs, else always end with ≥1 concrete practical step.
All in ChatBotService.js. Syntax OK. Not committed.

**Batch 2** (2026-10-20): 6a 7a 8b 9a 10c. Kept: 6,7,9.
- Q8 LHC proactive: legal-screening feature note → "Понудете го ПРОАКТИВНО кога темата допира усогласеност/ризик", don't wait for explicit "дали сме усогласени".
- Q10 stronger advocacy: ГЛАС И ТОН "На страната на корисникот" → explicit ЗАСТАПНИК (not neutral arbiter), take a stance in user's favour where law allows.
All in ChatBotService.js. Syntax OK. Not committed.
