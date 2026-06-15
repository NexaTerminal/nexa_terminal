# Промени во фирма (Central Register) — UX rework + transferor bugfix

## Goal
Replace the live document preview with a **Тековно → Ново** (before/after) experience,
make each selected change its own sub-step (inputs live in the old preview space),
fix the M5 transferor `[адреса]`/`[ЕМБГ]` leak, and replace real names in placeholders
with dummy ones.

## Decisions (approved)
- Step model: **sub-wizard inside Step 3** (no change to shared `useDocumentForm`).
- Missing transferor data: **inline fallback inputs** in the M5 step.

## Tasks
- [ ] Config: add `disableLivePreview: true`; replace real-name placeholders with dummy;
      add M5 transferor fallback fields (`m5TransferorAddress/IdNumber/Citizenship/...`).
- [ ] Template (`server/.../companyChanges.js`): merge matched shareholder with the
      explicit transferor fallback fields so `[адреса]`/`[ЕМБГ]` can never leak (deriveM5, ~896).
- [ ] `BaseDocumentPage`: suppress the LivePreviewLink share box when `disableLivePreview`.
- [ ] `CompanyChangesPage`: pass `customPreviewComponent` (before/after panel);
      rework Step 3 as a per-change sub-wizard; M5 transferor = dropdown of entered
      shareholders (auto-select sole owner for ДООЕЛ) + inline fallbacks.
- [ ] Extraction defaults for M5: pre-suggest transferor = sole owner, amount = capital.
- [ ] CSS: before/after comparison cards in `DocumentGeneration.module.css`.
- [ ] Verify: `cd client && npm run build` passes; manual sanity of Step 3 flow.

## Review
- ✅ Config: `disableLivePreview: true`; dummy placeholders; added 5 transferor fallback fields.
- ✅ Template: `deriveM5` merges matched shareholder + fallback fields → no `[адреса]`/`[ЕМБГ]` leak.
- ✅ BaseDocumentPage: LivePreviewLink suppressed when `disableLivePreview`.
- ✅ CompanyChangesPage: `customPreviewComponent`; Step 3 = per-change sub-wizard. BOTH columns are
     editable inputs — LEFT (`ChangeWizardCurrent`) = current values prefilled from profile/act (menlivo),
     RIGHT (`CompanyChangesPreview`) = new values (empty). Driven by `MODULE_PANELS` (top/current/next).
     M5 split into `M5Current` (transferor select + sole-owner auto-select + fallbacks + amount leaving)
     and `M5New` (transferee + compensation). Added `m3OldData` field + wired into M3 decision article 1.
- ✅ Extraction defaults: M5 transferor = sole owner; amount + total capital = company capital.
- ✅ CSS: compare/wizard classes added.
- ✅ Verify: `CI=false npm run build` → Compiled successfully; `node --check` template OK; no real names remain.

### Not done / follow-ups
- Generated consolidated act still not suppressed in upload mode (pre-existing).
- `moduleCurrentData` for M3 shows the selected person's *entered* data, not a separate
  authoritative "registered" snapshot — acceptable since current data comes from Step 2/upload.
