# Plan — Document UI/UX polish (all users: admin, basic, pro)

Approved ideas: 1, 2, 5, 6, 7, 8, 9. Skipped: 3 (single-scroll), 4 (hero preview).
All changes live in the shared document surfaces, so they apply to every user
type. Client pill (6) is inherently Pro-only (basic/admin see no client selector).

## Changes

### 1+2+8 — Quiet success state (replaces the removed popup) · all users
- `BaseDocumentPage.js`: remove the `DocumentSuccessModal` import + render (it was
  already never triggered). Redesign the inline `ShareableLinkSection` into a slim
  one-line success bar:
  ✓ „Генериран" + filename · [Копирај линк] · [Преземи повторно] · muted „Важи до {date}".
  No 🔗/⏰ emojis, no heading, no paragraph, no emoji capability list.
- Pass `fileName` + `expiresAt` into the section (currently only `shareUrl`).

### 5 — Sticky action bar · all users
- `DocumentGeneration.module.css`: make `.form-actions` a slim sticky footer
  (`position: sticky; bottom: 0`) with a subtle top border + backdrop, so
  Генерирај/Назад/Следно are always reachable. Terms field stays above.

### 6 — Client selector as a header pill · pro only
- `BaseDocumentPage.js`: move the `<ClientSelector>` out of the form body into a
  slim right-aligned header row above the split layout.
- `ClientSelector.js/.module.css`: restyle from a boxy block into a compact pill
  (label + dropdown), aligned to terminal tokens.

### 7 — One design language · surfaces touched
- New/edited styles use the terminal token set (`--color-*`, `--text-*`,
  `--spacing-*`, `--shadow-*`, `--border-radius-*`) instead of ad-hoc hex / the
  public `--nx-*` set, so document chrome reads as one piece.

### 9 — Loading/empty polish · all users where lists load async
- `Clients.js/.module.css`: replace „Се вчитува…" with skeleton rows.
  (Document catalog loads categories synchronously — no visible spinner there — so
  it's out of scope for skeletons.)

## Files
- client/src/components/documents/BaseDocumentPage.js
- client/src/styles/terminal/documents/DocumentGeneration.module.css
- client/src/components/documents/ClientSelector.js (+ .module.css)
- client/src/pages/terminal/Clients.js (+ .module.css)

## Out of scope (declined)
- 3 single-scroll form, 4 hero A4 preview.
