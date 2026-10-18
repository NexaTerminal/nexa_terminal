# Nexa 3.0 — Frontend Redesign Plan

Status: PLAN (ready to execute)
Owner: Nexa Terminal
Last updated: 2026-10-18
Related: `tasks/nexa-3.0.md` (the "AI team is the star" strategy this plan serves)

## 0. Principle

The AI team is the star feature (see Nexa 3.0). The frontend should make that obvious **at
the first glance after login** — without rebuilding the terminal. Two scopes, very different
weights:

- **Terminal (logged-in):** MINIMAL. One focused change — the AI Team row becomes the hero of
  the dashboard. Everything else stays as-is.
- **Public site (logged-out):** the bigger redesign, aligned to the "your business gets a
  team" narrative. Scoped here but kept separate; do the terminal change first.

---

## 1. Terminal change (the only in-terminal change) — elevate the AI Team band

### 1.1 Problem with today's layout
On login the user lands on `UpdatesFeed`. The AI characters (`AiTeamBand`) are currently
rendered **inside** `ActionGridCard`, sandwiched between "Предложено за тебе" and "Шаблони",
as small pills (34px avatar, 13px name, role hidden on mobile). The star feature reads as a
minor shortcut row. It should be the **first, biggest, warmest** thing on the page.

Current structure (`UpdatesFeed.js`):
```
feedStream
 ├─ BcTileRow (tier B only)
 ├─ ActionGridCard
 │    ├─ header "Брзи дејства"
 │    ├─ AiTeamBand        ← buried here, pill-sized
 │    ├─ SuggestedActions
 │    └─ TemplateRow
 ├─ sectionBreak "Известувања"
 └─ feed…
```

### 1.2 Target structure
Promote `AiTeamBand` **out** of the card to be the hero at the very top of `feedStream`, with
a one-line warm lead that ties to the strategy. Leave `ActionGridCard` (now just Suggested +
Templates) exactly where it is.

```
feedStream
 ├─ AiTeamBand (HERO)       ← lead line + larger character cards
 ├─ BcTileRow (tier B only)
 ├─ ActionGridCard
 │    ├─ header "Брзи дејства"
 │    ├─ SuggestedActions
 │    └─ TemplateRow
 ├─ sectionBreak "Известувања"
 └─ feed…
```

### 1.3 Exact edits

**A. `client/src/components/terminal/UpdatesFeed.js`**
1. Move `<AiTeamBand />` out of `ActionGridCard` (delete line 238) and render it as the first
   child of `.feedStream`, above `BcTileRow` (insert before line 119).
2. Give `AiTeamBand` a warm lead so it reads as "your team," not "shortcuts":
   - Replace the `.groupHead` ("AI Тим" + "Сите") with a hero header:
     - Title: **„Твојот тим е тука"**
     - Subtitle (one line): **„Прашај кого сакаш — одговара веднаш, бесплатно."**
     - Keep the „Сите → /terminal/ai-team" link, moved to the right of the title.
3. No logic changes — same `openChat(a.key)`, same `AI_CHARACTERS` map, same accent var.

**B. `client/src/styles/terminal/UpdatesFeed.module.css`** (all scoped to the AI band)
Enlarge from pill → character card:

| Token | Now | Target |
|---|---|---|
| `.aiChipPhoto` / `.aiChipEmoji` size | 34px | **48px** (desktop), 40px (≤640) |
| `.aiChipName` | 13px / 700 | **15px / 700** |
| `.aiChipRole` | 10.5px, hidden on mobile | **12px**, keep visible on mobile |
| `.aiChip` padding | `5px 13px 5px 5px` | `8px 16px 8px 8px` |
| `.aiBand` padding | `8px 0 4px` | `4px 0 12px` |
| avatar ring | `0 0 0 3.5px accent` | keep (it's the per-character color — good) |

- Add `.aiBandHero` wrapper styles: a soft full-width lead block — title (16–17px, 800) +
  muted subtitle (13px, `#64748b`) — sitting directly above `.aiChipRow`.
- `.aiChipRow`: on desktop keep `flex-wrap`; on **mobile** switch to a single horizontal scroll
  row (`overflow-x:auto; flex-wrap:nowrap; scroll-snap-type:x proximity`) so 4 larger cards
  don't stack into a tall column. Hide the scrollbar (`::-webkit-scrollbar{display:none}`).
- Optional polish (cheap, high-impact): give each `.aiChip` a 1px accent-tinted left edge or a
  faint `color-mix(in srgb, var(--accent) 6%, #fff)` background on hover so the character
  colors read as identity, not decoration.

### 1.4 What NOT to touch
- `SuggestedActions`, `TemplateRow`, `BcTileRow`, the feed, the modal — unchanged.
- No new components, no new data, no route changes. `AiTeamBand` already exists; we relocate
  and restyle it only.

### 1.5 Accessibility / correctness
- Hero title is a real heading (`<h2>`/`role`), not just styled text.
- Each character button keeps its `title` and should gain an `aria-label`
  (`Разговарај со ${name}, ${role}`) since the visual text may be truncated on mobile scroll.
- Tap targets ≥44px tall after the size bump — good for mobile.
- Horizontal scroll row must still be keyboard-reachable (native `<button>` focus order is
  preserved; just don't trap focus).

### 1.6 Verification
- Log in → the four characters are the first, largest thing on the dashboard, with the lead
  line. "Сите" still routes to `/terminal/ai-team`; tapping a face still opens the chat dock
  with the right agent.
- Mobile (≤640px): single horizontal scroll row, roles visible, no tall stack.
- "Брзи дејства" card still renders Suggested + Templates, just without the AI row.
- Diff is confined to `UpdatesFeed.js` (one move + hero header) and the `.aiBand*` CSS block.

---

## 2. Public site (logged-out) — separate, aligned to the star

Not required for the terminal change; listed so the two stay coherent. Do after §1.

- **Hero**: lead with the team, not the toolbox. Headline = „Твојот бизнис доби тим" with the
  four character faces + one-line roles; primary CTA „Запознај го тимот / Почни бесплатно".
- **"Meet the team" section**: one card per character (ЈУРА, ВЕРА, ГАРД, ПУЛС "наскоро"),
  personality in one sentence each, matching the terminal faces for continuity.
- **"When you need a human" section**: explain the handoff — the AI team brings a real
  professional. This is the trust/differentiation beat from Nexa 3.0 §2–3.
- **Reframe existing features** (documents, LHC, info system) as *"what a team member does for
  you,"* not separate product tiles.
- Reuse the same avatar assets (`/ai-team/*.png`) and accent colors as the terminal so the
  brand is one system across logged-out ↔ logged-in.

## 3. Rollout
- §1 ships on the normal build (pure UI; no flag, no data). Low risk, reversible.
- §2 is a larger pass — plan/approve separately.
- Don't commit/push until the user confirms (multi-agent push coordination).
```
