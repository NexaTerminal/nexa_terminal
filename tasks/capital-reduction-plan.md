# Намалување на основна главнина — implementation plan

New Централен регистар document package: **capital reduction** (чл. 261–263 ЗТД),
a **two-phase, two-date** multipack. One `.docx` holds BOTH phases.

## Legal procedure (from the 298-SNH Invest templates)

Capital reduction is a statutory two-step process with a creditor-protection window:

- **Phase I — Намера (intent)**: company declares intent to reduce capital; the
  decision is published in Службен весник; creditors get a protection window.
  Dated **today** (phase1Date).
- **Phase II — Спроведување (execution)**: after the window, the reduction is
  registered, the Act is amended, new пречистен текст signed.
  Dated **today + 91 days** (phase2Date, auto-computed, editable).

### Phase I documents (dated phase1Date)
1. **Одлука за намера за намалување на основна главнина** (чл. 261/262/263) — signed by содружници.
2. (optional) **Одлука за промена на лични податоци** — companion personal-data change.
3. **Изјава за потписи (чл. 7)** — one per signatory (each содружник + управителот).
4. **Полномошно** — one per signatory (содружници + управителот). The управителот's POA
   also references the personal-data change when enabled.

### Phase II documents (dated phase2Date)
1. **Одлука за намалување на основната главнина** (чл. 261 ст.1; also an act-amendment per 252/253).
2. (optional) **Одлука за промена на лични податоци**.
3. **Изјава (Управител) по чл. 263 ст.3** — creditor statement. TWO variants:
   - `settled`: no claims registered / all settled (file "2.")
   - `none`: company has no known creditors at all (file "2.1")
4. **Изјава по член 32** — manager action-list statement.
5. **Договор за основање (ДОО)** / **Изјава за основање (ДООЕЛ)** — пречистен текст, new capital.
6. **Одлука за измена на Актот за основање** (чл. 252/253) — amends член 2 (лични податоци) & член 7 (главнина).
7. **Книга на удели** — new capital structure (MKD amounts + % + votes).
8. **Полномошно** (управителот) — Phase II agent POA.

## Key facts / design decisions

- **Currency is MKD (денари)**, not EUR — these templates use денари throughout.
  (Existing changes/incorporation modules use EUR; this one stays MKD.)
- **DOOEL vs DOO branching** (user-emphasized):
  - 1 founder → ДООЕЛ → *Изјава за основање*, single signatory, "единствениот содружник – основач" preamble.
  - 2+ founders → ДОО → *Договор за основање*, per-shareholder влог amounts + содружничка структура.
- **Per-shareholder влог model**: each shareholder carries `currentContributionMKD`
  and `newContributionMKD`. Reduction amount = Σ(current) − Σ(new); total-before =
  Σ(current); total-after = Σ(new). Generalises to reducing one OR several owners.
- **Share % for Книга на удели**: computed from newContributionMKD / newTotal (editable).
- **91 days**: phase2Date = moment(phase1Date).add(91,'days'); editable.
- **Phase separator pages**: a bold title page before each phase block
  ("ФАЗА I … (дд.мм.гггг)" / "ФАЗА II … (дд.мм.гггг)").

## Architecture: standalone document type (recommended)

Mirror `companyIncorporation` (self-contained), NOT a module inside companyChanges —
because of the two-phase/two-date model and MKD currency, folding it into the
single-date companyChanges assembly would be messy and risk the working package.
Low-level paragraph helpers (p/title/article/signature/pPerson/fmtDate/joinAnd) are
copied locally (~100 lines) to keep it isolated. (Optional later refactor: extract a
shared `_shared.js`; deferred to avoid touching the working companyChanges.js.)

### Files to create / edit
1. CREATE `server/document_templates/centralRegister/capitalReduction.js` — builder → `{ doc }`.
2. CREATE `server/controllers/autoDocuments/capitalReductionController.js` — thin, warning-based validate.
3. EDIT  `server/routes/autoDocuments.js` — `POST /company-capital-reduction`.
4. EDIT  `server/constants/documentPrices.js` — add `'company-capital-reduction'`.
5. CREATE `client/src/config/documents/capitalReduction.js` — field config + steps.
6. CREATE `client/src/pages/terminal/documents/centralRegister/CapitalReductionPage.js` — page.
7. EDIT  `client/src/App.js` — import + route `/terminal/documents/central-register/capital-reduction`.
8. EDIT  `client/src/data/documentCategories.json` — catalog card under centralRegister.

### Form steps (client)
- Step 1 — company identity (prefilled from profile; form doo/dooel; activity).
- Step 2 — shareholders (name/id/address + currentContributionMKD + newContributionMKD) + управител.
- Step 3 — reduction params (reason; which-owner auto-derived from before/after; gazette №/date; creditor variant) + optional personal-data change toggle & new addresses.
- Step 4 — registration agent + dates (phase1Date, phase2Date auto = +91).
- Step 5 — review (lists all Phase I + Phase II docs that will be generated).

## Decisions (confirmed)
- A. **Include** the personal-data change companion in v1.
- B. **Price = 300** (`company-capital-reduction`).
- C. **Standalone** document type (confirmed).

## Amounts
MKD entered as plain integer digits per shareholder (currentContributionMKD /
newContributionMKD). Totals derived: totalCurrent=Σcurrent, totalNew=Σnew,
reduction=totalCurrent−totalNew. Rendered as `13.500.000,00 денари (тринаесет
милиони и петстотини илјади денари)` via a local MK number-to-words
(feminine илјади / masculine милиони·денари). Share % for Книга derived newContribution/totalNew.

## Review (done)

Built all 8 files (standalone, isolated from companyChanges):
1. `server/document_templates/centralRegister/capitalReduction.js` — builder (two phases, MK number-to-words, ДОО/ДООЕЛ branches, personal-data companion).
2. `server/controllers/autoDocuments/capitalReductionController.js` — warning-based validate.
3. `server/routes/autoDocuments.js` — `POST /company-capital-reduction`.
4. `server/constants/documentPrices.js` — `company-capital-reduction: 300`.
5. `client/src/config/documents/capitalReduction.js`.
6. `client/src/pages/terminal/documents/centralRegister/CapitalReductionPage.js`.
7. `client/src/App.js` — route `/terminal/documents/central-register/capital-reduction`.
8. `client/src/data/documentCategories.json` — catalog card.

Verified: MK number-to-words matches all 6 template amounts; DOO & DOOEL generate valid
.docx; Phase II date = Phase I + 91 (auto when left blank); dotted amounts parse; mixed
single-owner reduction; legal-entity shareholder; both creditor variants; share % in
Книга. Client config + page parse as JSX; route/controller/prices load; JSON valid.
NOT committed (multi-agent coordination).

Possible follow-ups: multiple управители; extract shared helpers into `_shared.js`.

## Added (round 2): act upload + Pro client drafting

- **Drag-and-drop act upload** on Step 1 (`ActUpload`): „Прикачи постоен акт" /
  „Стандарден образец"; drop or click a .docx → reuses the existing
  `extractAct` service (`/company-changes/extract-act`) → prefills companyForm,
  company identity, shareholders (влогови left blank), and manager[0]. Uses the
  shared `.drop-zone`/`.active` CSS. No new endpoint.
- **Pro „draft for a client"**: the client selector is already rendered by
  `BaseDocumentPage` for Pro; `CompanyAndManager` now reacts to `formData.clientId`
  and maps the client's generic fields (companyName/Address/TaxNumber/Manager) into
  our specific fields (companyFullName/ShortName/EDB/managerName; EMBS cleared,
  companyAddress is shared). Server already resolves clientId → company party via
  `resolveCompanyForDocument`, and formData now agrees. Switching back to „Мојата
  фирма" re-seeds the own company.
