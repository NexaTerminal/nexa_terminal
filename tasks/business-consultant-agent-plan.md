# 6th AI character — business management consultant (plan, 2026-11-26)

Status: v1 BUILT (2026-11-26) — Борис, web search on, „Услуги" mention on, tone direct-but-constructive. Photo: client/public/ai-team/boris.png (was the unused aria.png). Eval in progress.

## 1. The character

| | |
|---|---|
| Key | `business` |
| Name (proposal) | **Борис** (m) — alternatives: Марко (m), Елена (f). Needs a photo like the others (`client/public/ai-team/`). |
| Role | „Деловен консултант" |
| Lens | "Does this make money, and what would kill it?" |
| Personality | Direct, numbers-first, constructive sceptic. Breaks the idea respectfully, then always shows how to fix it. Never cheerleads, never insults. Signature move: ends every analysis with **„Што би го убило ова?"** + the cheapest test for this week. |

**In lane:** business model, pricing, margins and markups, unit economics, break-even, cash flow, market sizing in MK, competition and positioning, go-to-market logic, scenarios (best/base/worst), business-plan and pitch review, "should I…" decisions (hire, second location, export, raise prices).

**Hand-offs (existing `[[HANDOFF:…]]` mechanism):** legal form/contracts/disputes → Лекс · bookkeeping, tax filing, payroll calculation → Дина · hiring/firing/people → Вера · promotion/content/campaigns → Миа · insurance → Стојан. Others send to Борис for "is this profitable / how should I price / is the idea viable".
Line vs Миа: Миа = *how to sell it*; Борис = *whether and at what price*. Line vs Дина: Дина = *how to book and tax it*; Борис = *does it pay off*.

## 2. Logic first (v1 — no corpus)

The character runs on the same engine (`ChatBotService` + `agentProfiles.js`) with its **own base prompt** (like Стојан/Дина), and **no retrieval** until a business collection exists (legal corpus and LDH case-law supplements are irrelevant here and would pollute answers).

### Modes the prompt handles (auto-detected from the question)
1. **„Скршете ја идејата" (stress test / pre-mortem)** — customer & problem, willingness to pay, competition, unit economics, channel, MK regulatory friction, execution/team, cash need. Each scored 🟢/🟡/🔴, plus **kill criteria** and the **cheapest validation test**.
2. **Pricing** — cost-plus vs value-based vs competitor-based; price ladders; discount math ("a 10% discount at 30% margin needs +50% volume"); always states whether prices include ДДВ.
3. **Margins & break-even** — contribution margin, fixed costs, break-even volume, payback, working capital. Explicitly fixes the common **margin vs markup** error.
4. **Market sizing for MK** — bottom-up first (customers × frequency × price); top-down only with a stated source. Small-market reality (1.8 M people, ~4 regions that matter, diaspora, export to the region/EU).
5. **Scenarios & decisions** — best/base/worst table, what has to be true for each, decision rule.
6. **Plan / pitch review** — what an investor or bank will ask, missing numbers, red flags.

### Answer format (consistent, scannable)
`## Брз заклучок` (one-line verdict 🟢/🟡/🔴) → `## Што не држи` (top 3 risks) → `## Бројките` (table with formulas shown) → `## Што да проверите оваа недела` (≤3 cheap tests) → `## Прашања за Вас` (the missing inputs). Existing `[SUGGESTIONS]` chips stay.

### Grounding rules (the most important part)
- **Ask first, but never stall:** if price/cost/volume/customer are missing, give a quick take with stated assumptions, then ask the 3–5 numbers that change the answer.
- **General business logic is allowed** (frameworks, formulas, typical ranges *labelled as typical*).
- **Macedonian facts only when verified:** numbers, rates, statistics, company facts come either from retrieved documents (later), a small verified basics block (ДДВ 18/10/5 and the registration threshold, данок на добивка 10%, ПДД 10%, employer cost model — shared with Дина's verified block), or web search with sources (if enabled). Otherwise: „немам верифициран податок за ова — проверете на [stat.gov.mk / crm.com.mk / nbrm.mk]".
- **Every number is labelled** „податок (извор)" vs „претпоставка" vs „проценка".
- **Show the math:** formula → inputs → result, so the user can check it (LLMs slip on arithmetic; v2 adds a deterministic calculator).
- **No claims about specific Macedonian companies** without a source.
- Not investment or financial advice; the decision is the user's (one line, not a wall of disclaimers).
- Formal Вие; no hype words; respects the "no invented social proof" brand rule.

### Optional v1 add-ons (decide)
- **Web search for current facts / companies**, reusing `webSearchFallback` with business sources (stat.gov.mk, nbrm.mk, crm.com.mk, finance.gov.mk) and URL citations. Adds cost per question and some latency; answers are only as good as the sources found.
- **Soft link to „Услуги"** when the project is big (M&A, market entry, reorganisation): one sentence, never salesy. A natural funnel into paid consulting.

## 3. Data roadmap (what I would need, in order)

| Phase | Data | Source | Notes |
|---|---|---|---|
| A1 | Business entities by sector/size/region; births/deaths of companies | ДЗС / MakStat (stat.gov.mk) | Public, free; tables → text chunks with year |
| A1 | Structural business statistics (turnover, value added, employees per sector) | ДЗС | Lets Борис say "average café in MK…" with a source |
| A1 | Average net/gross wages by sector and region | ДЗС | Cost models, hiring decisions |
| A1 | Prices (CPI), household spending (Анкета за потрошувачка) | ДЗС | Willingness to pay, market sizing |
| A2 | Loan interest rates, credit conditions, exchange rates (live already) | НБРМ (nbrm.mk) | Financing scenarios |
| A2 | Company register aggregates (new/closed companies, legal forms) | Централен регистар (crm.com.mk) | Aggregates are public; **company-level financials are paid** |
| A3 | Inspections: counts, most common violations, fines | ДИТ (труд), ДПИ (пазарен), УЈП, Санитарен инспекторат — annual reports | "Risk of inspection" in idea reviews; overlaps with our LHC checks |
| A3 | Support programmes and grants | ФИТР (Фонд за иновации), АППРМ, Министерство за економија, EU/IPA calls | "Who could co-finance this" |
| B | Sector reports | Стопанска комора, EBRD/World Bank/EU Commission country reports | Mostly English — fine for retrieval |
| C | Company-level data ("knows Macedonian companies") | Licensed data (Централен регистар paid service or a data partner) | Needs a licence/permission — **no scraping** of protected data |
| D | Nexa's own anonymised aggregates (enquiry topics, LHC results) | Our DB | Later, privacy review first |

Format when we ingest: PDFs/XLS → `node scripts/process-documents.js --dir "business sources" --collection nexa_business_docs`, env `QDRANT_BUSINESS_COLLECTION_NAME`. Each document keeps **source + year** in metadata so answers can cite „ДЗС, 2024".

## 4. Build checklist (v1)

Server
- [x] `agentProfiles.js`: `business` profile (systemFlavor, lane, `collection: env || null`, `retrievalScope`), `TEAM_DIRECTORY` entry, handoff marker list + referral rules updated for all characters
- [x] `ChatBotService`: `businessSystemPromptTemplate` + `_promptTemplateFor`; skip retrieval when no collection; skip LDH legal supplements; (opt.) web search with business sources
- [ ] Verified basics block shared with Дина (one source of truth, no duplicated numbers)
- [x] Memory layers on (company facts like industry/size are exactly what Борис needs)
- [x] `agentPostService`: feed-post voice for Борис
- [x] Pro invite: hidden for Борис in v1 (the Pro board is legal-only)

Client
- [x] `aiAgents.js` entry (name, role, accent colour, photo, greeting, starter chips: „Скршете ми ја идејата", „Колкава маржа ми треба?", „Како да ја формирам цената?", „Кога ќе ја вратам инвестицијата?")
- [x] `HANDOFF_RE` in AIChat + dock; AI Team page card; dashboard AI chips (5 → 6); messaging bar AI tab
- [x] Photo in `client/public/ai-team/`

Quality
- [ ] 15-question eval set (bakery margin, Skopje café break-even, SaaS pricing, gym in Bitola, export to Serbia, price increase, second location, hiring first employee, discount campaign, investor pitch…) with a rubric: asks the right numbers · correct math · no invented MK statistics or company facts · kill criteria + cheap test · correct hand-offs
- [ ] Two tuning rounds through the existing characters tuning loop
- [ ] `nexaProduct.md` update

v2 (after v1 feels right): business corpus (phase A), deterministic calculator card in chat (margin/break-even/discount), "Stress-test" saved report the user can revisit.

## Tuning log

**Round 1 (15 live questions, gpt-5-mini):** all arithmetic correct, hand-offs correct, honest about missing MK data. Problems: 600–820-word idea reviews, literal „Потпис" section and sign-off, 8-area test used for a discount, double ratings, label clutter, offered impossible actions („ќе преземам"), no „Услуги" on a company sale, Latin/Russian slips, verdicts not flagging their key assumption, web search on irrelevant questions, utm links.

**Fixes:** mode B only for new ideas; compact stress-test table; one rating; labels only in the table; "this hinges on assumption X"; no promised actions; purity + vocabulary rules; fixed section order per type; trigger regex tightened; utm stripped.

**Engineering added:**
- `chatbot/mathCheck.js` — recomputes every written equation ("a ÷ b = c", chains, %, €), corrects wrong results; 46 unit tests + 0 false corrections over 50 real equations (ranges skipped).
- Benchmark ranges (labelled international practice) + "forgotten costs" checklist in the prompt.
- „Услуги" sentence appended by code for company sale/purchase/valuation, market entry, reorganisation, investors — once per conversation.
- Suggestions parser tolerates a missing `[/SUGGESTIONS]` (protects all characters).
- Optional own model for Борис: `OPENAI_BUSINESS_MODEL`, `AI_EFFORT_BUSINESS` (default = main model).

**Round 2:** wage question now answered with figure + source; single ratings; cleaner. Still: duplicated risks, length, missed „Услуги" (now enforced in code), language slips (model-level).

**Rounds 3–5 (model comparison):** same prompt + production post-processing on gpt-5-mini vs gpt-5.1.
- gpt-5.1: native-sounding Macedonian (no Serbian/Russian/Latin slips), sharper insight (sensitivity 400 vs 700 pieces/day, selective discounts, MK market-size limit for SaaS), 3–5 s for quick questions / 8–15 s for analyses (vs 17–67 s on mini), ratings always present, math checker made 0 corrections.
- After brevity rules: quick answers 110–140 words, decisions 200–400, idea reviews ~700 (two tables), hand-offs 135–160.
- Recommendation: run Борис on gpt-5.1 via `OPENAI_BUSINESS_MODEL=gpt-5.1` (≈5× mini per answer; bounded by the 4-questions/week cap). Default left unchanged pending the owner's decision.
