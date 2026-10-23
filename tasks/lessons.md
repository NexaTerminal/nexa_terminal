# Lessons

Patterns to prevent repeated mistakes. Review at session start.

## Git: stage explicitly, never `git add -A`

**Mistake (2026-08-20):** Committing my pricing/modal work, I ran `git add -A`,
which swept three unrelated already-modified files (`config/nav.js`,
`ClientSelector.module.css`, `LegalScreening.module.css`) into my commit and
pushed them to production `main`. This repo is worked by parallel agents / the
user — sweeping the whole working tree can push work I didn't author and isn't
mine to ship (see memory `multi-agent-push-coordination`).

**Rule:** Stage only the files I actually changed, by path:
`git add <path1> <path2> ...`. Before any commit, run `git status --short` and
confirm every staged path is one I edited this task. Never `git add -A` / `git
add .` in a shared repo.

## 2026-10-23 — Mobile UI shipped without looking at it at phone width
- **Mistake:** built the messaging bar/full-screen chat for phones from CSS reasoning only; on a real phone it was clipped and the page showed through.
- **Root causes found only by measuring at 390px:** (1) `backdrop-filter` on `.header` made it the containing block of the fixed mobile drawer → closed drawer widened every page (scrollWidth 2× viewport) → "full-screen" layers wider than the screen; (2) global `button {}` (radius 1rem, shadow, bold, centred, scale-on-hover) leaks into every component button; (3) the pinned GlobalDisclaimerBar covered composers and modal buttons.
- **Rule:** any mobile/UI change → verify at 390px before saying done. Chrome window can't go below ~840px: load the page in a 390px same-origin `<iframe>` and measure (`scrollWidth`, element rects) + screenshot. Never put `backdrop-filter`/`transform`/`filter` on an element that contains `position: fixed` children. New components: reset the global button look explicitly.
