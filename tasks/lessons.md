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
