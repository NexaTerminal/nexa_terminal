# Hybrid AI + Human-Pro Matching System — "Your Team"

Status: PLAN (not built). Owner: Nexa. Date: 2026-10-02.

## Vision
Every user has ONE continuous advisory "team": AI characters (instant, always-on,
informational) + matched/retained human Pros (deep, licensed, paid). The AI is both
the **continuity layer** and the **matchmaker** — it already knows the user's domain,
memory, conversation, generated docs and LHC results, so it can produce the warmest,
most pre-qualified hand-off on the market. Pros receive contextualized, pre-qualified
leads distributed FAIRLY → more clients. Two-sided flywheel (see
memory/business-model-two-sided): AI usage (demand) → qualified lead for a Pro (supply).

## What already exists (REUSE — do not rebuild)
- **AI layer:** AI Team agents (ЈУРА/НОВА/АРИА/ПУЛС + ВЕРА/ГАРД coming), AI→AI cross-
  referral hand-off chips, durable user memory (user_ai_memory), Ask-a-Pro (`pro_requests`,
  admin approves + hand-picks a Pro, in-platform thread, structured quote).
- **Supply/routing layer:** `leadRoutingService.pickAssignee(lead, candidates)` — pure,
  filters role=admin_user + active sub + `superUser.practiceAreas` overlap + `superUser.cities`
  overlap, then round-robin on `lastAssignedAt`, deterministic tie-break. Plus
  `providerCapService`, `providerInterestService`, `offerRequestService`, `marketplaceService`,
  `inquiriesService`, Leads inbox, Topics worklist.

## The gaps (what this system closes)
1. AI→Pro hand-off is MANUAL and BLIND (admin hand-picks; no use of AI context).
2. **Taxonomy fragmentation**: AI agent domains vs `PRACTICE_AREAS` (roles.js) vs
   `INQUIRY_CATEGORIES` vs `PROFESSIONS` vs `TOPIC_CATEGORIES` — four+ overlapping lists.
3. No **context carry** — the Pro starts cold; the user repeats everything.
4. No unified **"team" roster** (AI + human in one place); no retained-Pro relationship.
5. Fairness/cold-start for NEW Pros not tuned for growth; no reputation flywheel.

## Design principles
- AI = informational & always-on (free-ish, limited). Pro = licensed advice (paid; rail is
  OFFLINE for now — see memory/no-paying-users-yet). The clean UPL separation is a feature.
- Human-in-the-loop FIRST (admin oversight), auto-route SECOND (once supply density allows).
- The moat = **context-rich, warm, pre-qualified** leads + AI continuity between sessions.
- Fair distribution = supply retention. Pros must feel ROI or they churn.

## Phase 0 — Unified taxonomy spine (PREREQUISITE, small)
One `server/constants/domainMap.js`: AI agent ↔ practiceArea(s) ↔ profession ↔ inquiry
category ↔ topic category. Single source of truth so a hand-off routes coherently.
e.g. `АРИА(hr) → employment_law → {lawyer,hr_consultant} → labor → "Работни односи"`.
Everything below keys off this.

## Phase 1 — Rich Pro profiles (supply data)
Extend `superUser` profile beyond practiceAreas/cities: subspecialties (free tags),
languages, price band, capacity (max active clients), responsiveness-SLA opt-in, intro
blurb, credentials/verification level, and `accepts: {consult, doc_review, retainer}`.
This is the data the matcher + the AI hand-off cards read. Pro-facing edit UI + a
read model the AI can reference.

## Phase 2 — The Matcher (scored, context-aware)
`matchingService.rankPros(request)` — build ON `pickAssignee`:
- **Hard filters:** domain/practiceArea (via domainMap), jurisdiction/city, active+verified,
  capacity not full, `accepts[request.type]`, language.
- **Soft score:** topic similarity (embed the AI question/summary vs Pro subspecialty / past-
  topic text), geo proximity, rating, responsiveness, price fit, and a **fairness/exploration
  boost** so new/under-utilized Pros get a real shot (multi-armed-bandit style).
- Returns ranked top-N **with reasons** ("labour-law, Skopje, 4.8★, replies <2h").
- Powers BOTH admin suggestions (phase-in) and later auto-route.

## Phase 3 — Warm AI→Pro hand-off + context packet
- In-chat: the active AI agent offers „Да те поврзам со проверен [specialist]?" — mirrors
  the AI→AI `[[HANDOFF]]` chip we shipped, but AI→human.
- Show top 1–3 matched Pro cards (name, specialty, city, rating, price band, response time) →
  user picks, or one-tap "best match".
- **Context packet** auto-attached to the `pro_request`: AI conversation summary + relevant
  user-memory facts + generated docs / LHC findings — Pro opens WARM. (Consent via existing
  `useTermsGate` `proRequest`.)
- **Productized variant:** every AI output (doc/contract/LHC) gets a one-tap
  „Преглед од специјалист", matched to the right Pro → small, concrete, quick paid tasks =
  the lowest-friction client-acquisition channel for Pros.

## Phase 4 — "Your Team" unified roster + retained Pro
- Evolve `AITeamHome`: each AI character can surface its **human counterpart** once matched.
  One roster = AI (instant) + your human Pro(s) (deep).
- "Retain"/"keep" a Pro → persistent go-to relationship (recurring clients for the Pro;
  an always-at-disposal human for the user).
- The **Case (Предмети)** becomes the shared workspace among user + AI + Pro.

## Phase 5 — Pro growth engine (the "more clients" part)
- Pro **lead dashboard**: matched leads w/ context; accept/decline within SLA; decline or
  timeout → auto re-route to next match (user never stuck, "always at disposal").
- **Reputation flywheel**: post-resolution review → feeds the match score.
- **Fair distribution**: round-robin + exploration; monitor utilization fairness (Gini).
- **Pro controls**: subscribe to the domains/geos/request-types they want; set capacity.
- Later (payment rail): lead credits / featured placement / success fees.

## Phase 6 — Proactive matching
Detect need from signals (LHC critical gap, repeated hard AI questions on one topic, high-
stakes doc) → AI proactively suggests a Pro: „Забележав дека се справуваш со X — сакаш специјалист?"

## The real moat — AI ↔ Pro co-pilot
The Pro can leave **notes/guardrails that become that client's AI memory** ("за овој клиент
секогаш нагласи X"). Between paid sessions the AI keeps the client warm WITH the Pro's
guidance baked in. The AI is leverage for the Pro (handles routine, escalates the meaty),
not a competitor — a genuine human+AI advisory team per client. Nobody else pairs a
remembering AI with a human specialist this tightly.

## Metrics
match-acceptance rate · time-to-first-Pro-response · resolution rate · user CSAT ·
Pro-utilization fairness (Gini) · repeat/retainer rate.

## Risks
UPL boundary (keep AI informational, Pro licensed) · supply cold-start (need density per
domain/city before auto-route → start admin-assisted) · lead spam (AI pre-qualification +
cap concurrent routes) · taxonomy drift (Phase 0) · no payment rail yet (don't over-build
monetization).

## Recommended first slice
**Phase 0 + Phase 2 + minimal Phase 3**: upgrade the existing Ask-a-Pro from "admin hand-
picks blind" to "context-matched top-3 with a warm packet," admin still in the loop. Low
risk, immediate value to both sides, reuses `pickAssignee` + `pro_requests`.
```
