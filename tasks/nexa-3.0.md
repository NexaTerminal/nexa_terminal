# Nexa 3.0 — The AI Team for Macedonian Small Business

Status: STRATEGY / PITCH (concept locked, ready to sequence)
Owner: Nexa Terminal
Last updated: 2026-10-18

> One line: **Every small business in Macedonia gets a team of expert advisors — an AI
> colleague for each field, and a real professional behind them the moment it matters.**

---

## 1. The problem we solve

A Macedonian small-business owner — a café with 6 staff, a 2-person agency, a small trade
firm — lives with a low, constant anxiety:

- *"Am I doing this right?"* — the отказ, the договор, the inspection, the GDPR notice, the
  insurance claim. One mistake bites months later and costs real money.
- **There is no one to ask.** A lawyer costs 100€ and makes them feel stupid for a "small"
  question, so they don't ask — they guess, or they ignore it.
- Existing tools are **toolboxes**: forms, templates, portals. The owner doesn't want a
  toolbox. They want **someone on their side.**

Nexa turns that anxiety into a relationship. Not "a document platform" — **a team of
advisors that knows your business and has your back.**

## 2. What Nexa is (the star feature)

Nexa is a **team of named AI consultants**, each an expert in one field, each with a fixed
personality and a clear lane. They know your company (shared memory), they pull each other
in when a question crosses lanes (handoffs), and **when the stakes are real, they bring in a
human professional** who stakes their name on the answer.

Launch roster (all grounded in real Macedonian sources):

| Character | Field | Grounded in | Human behind it |
|---|---|---|---|
| **ЈУРА** | Business lawyer — risk + procedure (companies, contracts, GDPR, tax, labour) | Legal RAG corpus | ✅ Lawyer(s) |
| **ВЕРА** | HR — the human side of employment (отказ, retention, mediation, PIP) | Same labour corpus, people-first lens | ✅ (via ЈУРА/lawyer) |
| **ГАРД** | Insurance & risk — coverage, exclusions, limits, claims | 4 insurers' actual policy conditions (Qdrant) | ✅ Insurance agent |
| **ПУЛС** | Marketing & content | Marketing AI | 🔜 "Coming soon" until a human joins |

Growth characters (added only when grounded **and** staffed): **accountant**,
**real-estate advisor**, **business consultant**. The team *growing over time* is itself a
retention story — but we never add a character faster than we can (a) ground it in real
sources and (b) put a real professional behind its handoff.

**Iron rules of the star feature:**
1. **Personality is tone, never substance.** A character's warmth/directness shapes *how* it
   speaks; grounding and risk-honesty are identical across all four. The costume never
   softens the risk.
2. **No hollow handoffs.** A character may chat (AI-only) long before it can hand off, but it
   never offers "ask a professional" unless that click resolves to a named, notified human.
3. **The handoff is the AI doing its job well**, not failing — ЈУРА flagging real exposure is
   the honest, natural escalation moment.

## 3. How it works — the loop

```
  Business owner (free)                 Nexa AI Team                  Pro provider (paid later)
  ─────────────────────                 ─────────────                 ─────────────────────────
  Joins free, asks a question  ──►  AI colleague answers (grounded)
                                        │
                                    easy stuff → solved free, owner delighted
                                        │
                                    high-stakes / risky moment
                                        │
                                   "want a human on this?"  ──►  pro_requests board
                                                                     │
                                                      satellite-site leads feed the SAME board
                                                                     │
                                            notified Pro(s) — first to respond wins (FOMO)
                                                                     │
                                            in-platform thread + price offer → client won
```

Two lead sources stack into **one pipeline (`pro_requests`)**:
- **Satellite leads** — already flowing today from the network sites. Keep Pros busy from
  **day one**, before the AI funnel is warm. This is what kills the "idle Pro" death-valley.
- **AI-escalation leads** — the scalable flow we're building. Pure upside on top.

## 4. The two-sided model

- **Demand side = Basic users (SMBs).** Always free. The acquisition engine.
- **Supply side = Pro providers (lawyers, insurance agents, …).** The revenue engine — they
  pay a subscription **after** we've proven we send them business.

Rule we learned the hard way: **demand is manufactured, supply is summoned against it.** We
never warm up idle Pros and then go hunt demand — the supply spoils while it waits. Satellite
leads + AI escalation give us demand to summon Pros against from the start.

## 5. Monetization

**Basic (SMB): 100% free. No noise features as a priority.** Free AI chat, LHC compliance
check, automated documents, info system. The product's job here is *volume and goodwill*,
not revenue. (Optional, later, pick **one** incidental stream — the Good-Employer badge,
because it doubles as a viral acquisition loop. Courses/newsletter banners are deferred; they
are pennies and a distraction from the real business.)

**Pro (providers): the actual business.** 6 months free, then a subscription (~€39/mo) — sold
not as "software" but as **"here is the business we already sent you; pay to keep the tap
on."** One won client pays for a year of subscription, so willingness-to-pay is rational and
high *if* leads are real.

> The business is the Pro subscription, sold on a lead we already delivered. Everything on the
> free side is plumbing to feed it.

## 6. The sequence (do things that don't scale first)

1. **Launch legal + HR + insurance** (all grounded). AI chat free for everyone. Handoff live
   only where a human exists; ПУЛС = "coming soon."
2. **Wire satellite leads into `pro_requests`** so Pros are never idle. Same board as AI leads.
3. **One Pro per lane now = manual/concierge matching.** This is fine — it's the un-scaled
   phase. The FOMO "you + 4 others, first wins" engine only switches on at **3–4 Pros per
   lane**, so that's the real supply goal.
4. **Keep Basic ruthlessly free and simple.**
5. **Instrument closed-won per Pro from day one** (see §8).
6. **Prove the loop in one city / one–two verticals** before spending a denar on marketing.
7. Only then: pour marketing on the free side to scale demand → more leads → convert Pros to
   paid → add the next grounded+staffed character.

## 7. Sales pitches (per audience)

### To the Basic user (SMB owner) — free
> **„Не си сам во водењето на бизнисот."**
> Nexa ти дава тим советници — правник, HR, осигурување — што ти одговараат веднаш, бесплатно,
> на јазик што го разбираш. Прашај што сакаш, направи ги документите, провери дали си во ред
> со закон. А кога прашањето е сериозно, твојот тим ти носи вистински професионалец што ќе
> застане со своето име зад одговорот.
>
> *You're not alone in running your business. Nexa gives you a team of advisors — a lawyer, HR,
> insurance — that answer you instantly, free, in plain language. Ask anything, generate your
> documents, check you're compliant. And when it's serious, your team brings in a real
> professional who stands behind the answer.*
>
> **Why free?** Because when you need a human, we connect you to one — and the professionals
> pay us, not you.

### To the lawyer (Pro)
> **„Нови клиенти ти доаѓаат — ти не трчаш по нив."**
> Мали фирми секој ден прашуваат правни прашања на Nexa. Кога прашањето бара адвокат, ние ти го
> праќаме — заедно со контекстот, веќе загреан. Првите 6 месеци бесплатно. Ако носи бизнис —
> а веќе има и лидови од нашите сателитски сајтови — тогаш го задржуваш приливот за ~€39/месец.
> Еден добиен клиент ти ја плаќа цела година.
>
> *Clients come to you — you don't chase them. Small firms ask legal questions on Nexa every
> day; when one needs a lawyer, we send it to you with context, pre-warmed. First 6 months
> free. We already have leads flowing from our satellite sites. If it brings business, you keep
> the tap on for ~€39/mo. One won client pays for the whole year.*

### To the insurance agent (Pro)
> **ГАРД одговара на основните прашања за покриеност од општите услови — но кога клиентот треба
> полиса, пријава на штета или совет на мера, ти си тој што го добива контактот. Загреан лид,
> без реклама, без трошок во пробниот период.**

### To the "coming soon" professional (marketer, accountant, …)
> **„Те гледам дека нудиш маркетинг услуги. Nexa гради мрежа каде нашиот AI им препорачува на
> бизнисите токму ваков профил. Те додавам бесплатно — кога бизнис побара маркетер, ти го
> добиваш лидот прв."** (Activated only once the human exists **and** there's demand in the
> lane — never a hollow promise.)

## 8. The one metric that decides everything

Everything hinges on a single measurable fact, tracked per Pro from day one on the
`pro_requests` thread:

> **Did this Pro close real business from a Nexa lead (satellite OR AI)?** (yes / value)

- Secondary: **free→lead conversion rate** — of active Basic users, how many send a
  human-worthy query per month. 2% = thin; 8% = a business. Design the AI to escalate at the
  high-stakes moment to push this up.
- If a tiny cell (≈50 Basic users + a handful of Pros, one city) produces leads a lawyer will
  pay for, **then** scale with marketing. If it doesn't, more free users won't fix it.

## 9. Risks & how they're handled

| Risk | Mitigation |
|---|---|
| Idle Pros churn during the no-revenue valley | Satellite leads feed them from day one; same board as AI leads |
| Great free AI → nobody escalates → no leads | AI designed to hand off at the risky/high-stakes moment; escalation = success, not failure |
| One Pro per lane = single point of failure, no FOMO | Accept as concierge phase; race to 3–4 per lane to switch on the competitive engine |
| Adding characters faster than we can ground/staff them | Only launch a character that's grounded in real sources AND has a human behind its handoff |
| Charm outruns correctness in a legal product | Personality = tone only; grounding/risk-honesty identical across all characters |
| Month-7 Pro conversion is a guess | Track closed-won per Pro from month 1 — that number is the sales pitch |
| Scope creep vs. legal-first focus | Legal + HR + insurance launch; non-grounded verticals stay "coming soon" |

## 10. What Nexa becomes

Not a document platform with an AI bolted on. **A company staffed by an AI expert team, with
real professionals behind them** — where the small-business owner finally has someone on their
side, the professional finally gets clients without chasing, and Nexa earns by making that
introduction. The AI team is the star; every other feature (documents, LHC, info system) is
*what a team member does for you*, not a separate tool.
