# Mobile audit — Nexa terminal

Severity: **P0** = navigation/blocking · **P1** = unusable on mobile · **P2** = ugly but functional · **P3** = polish

---

## P0 — Navigation broken on tablet/mobile

- [ ] **Tablet dead zone (769–1024px): no nav at all.** Sidebar hides at ≤1024, hamburger only appears at ≤768. Result: from 769–1024px the user sees *no* sidebar, *no* hamburger, and `dashboard-main` keeps `margin-left: 256px` (empty gap on the left).
  - Fix in `Sidebar.module.css`: reset `dashboard-main { margin-left: 0; width: 100% }` at ≤1024 (move the rule from the 768 block up to 1024).
  - Fix in `Header.module.css`: show `.mobile-menu-button` and hide `.desktop-right` at ≤1024 (raise the breakpoint from 768 to 1024).

- [ ] **Mobile drawer is stale.** `Header.js` `regularMenuItems` / `screeningSubItems` / `aiSubItems` still reference: "Скрининг", "Обуки", "Најди адвокат", disabled "Вмрежување", missing: Случаи, Објави блог, Topics Q&A, Контролна табла link is dashboard-only, Курсеви, Корисници link, Stance Preferences, Contract Analysis, Документи sub-items, Под-сметки renamed. Rebuild mobile drawer to mirror the new sidebar (Работа / Вмрежување и можности / Ресурси).

## P1 — Unusable on phone

- [ ] **Invoice editor `.editorRow`** (`UserAccount.module.css`) uses `grid-template-columns: 1fr 1fr 1.2fr` — 3 cramped columns on phone. Stack to 1 column ≤640px.
- [ ] **Invoice table** on small screens — 4 columns with action buttons. Either wrap in `.tableScroll { overflow-x: auto }` or convert to card-list at ≤640px.
- [ ] **SubmitBlog page** — `.grid 1.5fr / 1fr` collapses at 980px (already), but ReactQuill toolbar still wider than viewport on phones. Add `.editor :global(.ql-toolbar) { flex-wrap: wrap }`.
- [ ] **AllUsers admin table** (`min-width: 800px+` enforced) — fine for desktop, but admin user (Martin) probably uses laptop. Leave as desktop-only or add `overflow-x: auto` wrapper. *(Low priority — admin)*

## P1 — Page padding

- [ ] Many pages use `padding: 28-32px` on edges. On 375px-wide phones that's 56-64px of horizontal padding for ~310px of content. Add `@media (max-width: 640px)` rule per page or to global util. Files using this pattern: `BlogSubmissions`, `UserAccount`, `Inquiries`, `Topics`, `StancePreferences`.

## P1 — Modals missing viewport rules

- [ ] `CompanyInfoPrompt.module.css` — no `@media`. Check it caps to viewport.
- [ ] `ExpressInterestModal.module.css` — no `@media`. Same check.
- [ ] `TrialDisabledNotice.module.css` — no `@media`. Inline modal.
- [ ] `SuccessModal` in `BlogSubmissions.module.css` — uses `max-width: 480px` ✓, but verify on 320px (iPhone SE). Likely fine due to `padding: 24px` on backdrop.

## P2 — Components without responsive rules (review only)

- [ ] `StubPage.module.css` — placeholder; low priority
- [ ] `StancePreferences.module.css` — verify form fields on phone
- [ ] `Team.module.css` (admin-user dashboard) — verify sub-seat list
- [ ] `ChangePassword.module.css` — unused now (merged), can delete
- [ ] `NexaAI.module.css` — verify chat layout
- [ ] `ManageSubscriptions.module.css` / `ManageLeads.module.css` — admin-only, low priority

## P2 — Touch target / typography sweep

- [ ] Sidebar items currently 36-40px height. On mobile drawer make sure they're ≥44px.
- [ ] Buttons in dropdowns (`.iconBtn` in invoice table) are small (4×8px padding, 12px font) — tap-too-tiny. Bump to `8×14`/`13px` on phone.

## P3 — Polish

- [ ] Sidebar flyout (`.submenu-flyout`) won't fire on touch — it's hover-only. In the mobile drawer the inline expansion path is used, which is correct.
- [ ] Right sidebar hides at ≤1200px ✓ (already handled).

---

## Status — completed sweeps

### ✅ Sweep A — Navigation
- `Sidebar.module.css`: merged the two breakpoints, reset `dashboard-main` margins at ≤1024px (was ≤768px) — kills the tablet "empty gap" bug.
- `Header.module.css`: hamburger now appears at ≤1024px (was ≤768px) — tablet has working nav.
- `Header.js`: rebuilt the mobile drawer from scratch using a declarative `mobileSections` array that mirrors the desktop sidebar (Работа / Вмрежување и можности / Ресурси). Reuses `showsBlogs`, `showsLeads`, `showsTopicsQA`, `showsSubUsers` predicates so visibility matches. Stale references removed: `regularMenuItems`, `screeningSubItems`, `aiSubItems`, "Скрининг", "Обуки", "Најди адвокат", disabled "Вмрежување". Replaced `/terminal/user` link with `/terminal/subscription`. User-section labels updated to current wording.

### ✅ Sweep B — Сметка/Сметководство mobile
- `UserAccount.module.css`: new `@media (max-width: 640px)` block stacks the 3-col `.editorRow` grid, shrinks invoice table padding, stacks the `.kv` key/value grid, bumps form input font to 16px to suppress iOS zoom.
- `UserBilling.js`: invoice table wrapped in `overflow-x: auto` div for narrow viewports.

### ✅ Sweep C — Modal viewport hardening
- `CompanyInfoPrompt.module.css`, `ExpressInterestModal.module.css`, `TrialDisabledNotice.module.css`: added mobile rules — reduced padding, top-aligned for keyboard space, 16px input font size, max-height bounded.

### ✅ Sweep D — Page gutter + Quill editor
- `BlogSubmissions.module.css`, `Inquiries.module.css`, `StancePreferences.module.css`, `Topics.module.css`: appended `@media (max-width: 640px)` blocks reducing edge padding 28→14px, title 26→22px, stacking action-row buttons full-width, bumping input font to 16px.
- `BlogSubmissions.module.css`: ReactQuill toolbar now wraps via `:global(.ql-toolbar) { flex-wrap: wrap }`.

---

## Deferred / out of scope

- **Admin tables** (`AllUsers`, `ManageSubscriptions`, `ManageLeads`, etc.) — they already enforce `min-width: 800px+` for the table. Admin (Martin) uses laptop, leaving as-is.
- **Document generation forms** — `DocumentGeneration.module.css` already has multiple `@media` rules; quick visual sweep didn't flag any obvious P1 issue. Worth a manual pass on a phone but not blocked.
- **Find lawyer / Investment detail / Contact pages** — older surfaces, mostly unused. Skip unless something breaks.
- **Real device testing** — needs your eyeballs on iOS Safari and Android Chrome. The CSS I added uses standard rules and the `font-size: 16px` on inputs is the iOS-zoom-prevention idiom.

## Execution plan

1. **Sweep A — global nav fix**: tablet dead zone + mobile drawer rebuild. *Two files*: `Header.js`, `Header.module.css`, `Sidebar.module.css`.
2. **Sweep B — Сметка/Сметководство mobile**: invoice editor stack, invoice table scroll wrapper, page padding.
3. **Sweep C — Modal viewport hardening**: add `max-width: calc(100vw - 24px); max-height: calc(100vh - 32px); overflow-y: auto` to the 4 modal modules above.
4. **Sweep D — Page gutter**: small media block at the top of `BlogSubmissions`, `Inquiries`, `Topics`, `UserAccount`, `StancePreferences` lowering edge padding to 16px ≤640px.
5. **Sweep E — Form/editor polish**: SubmitBlog Quill toolbar wrap, button tap targets, label sizes.

I'll skip admin-only screens unless something is clearly broken.
