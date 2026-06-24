# Contract Management System (CMS) v1 — Implementation Plan

_Date: 2026-06-24 · Owner: Martin · Status: PLAN (no code yet — verify before building)_

> Goal: turn one-shot document generation into recurring value. A user records contracts
> (generated in Nexa, uploaded, or entered manually), and Nexa tracks their lifecycle and
> fires **renewal / expiry / notice / payment reminders**. This closes the post-generation
> retention gap identified in `tasks/business-review-terminal.md` and creates a daily
> reason to log in.

---

## 1. Scope

**In (v1):**
- A `contracts` repository: list + detail + create/edit + delete.
- Three capture paths: **generate→save** (from the 45 generators), **upload** (.docx/.pdf), **manual** (metadata only, no file).
- Lifecycle metadata: counterparty, value, signed/effective/expiry dates, notice period, status.
- **Obligations** = discrete trackable items (renewal, payment, notice deadline, custom), each with a due date and reminder offsets.
- **Reminder engine**: daily cron → email (existing `emailService`) + in-app notification (existing `notifications`) → dashboard surfacing.
- Status auto-transitions: `active → expiring → expired`.
- Schema carries `companyId` from day one so the Pro "manage all clients' deadlines" view is a later filter, not a migration.

**Out (v1 — defer to Phase 2):**
- E-signature / signing workflows.
- Document versioning / amendments chains.
- Approval routing.
- OCR/auto-extraction of dates from uploaded PDFs.
- Provider cross-client rollup dashboard (schema-ready, UI later).

---

## 2. Architectural fit (verified against current code)

These are the facts the plan is built on — confirmed by reading the code:

| Concern | Existing reality | CMS reuses it |
|---|---|---|
| Storage of generated docs | `baseDocumentController.js:148-204` already stores **every** generated buffer in GridFS bucket `shared_documents` and writes a `shared_documents` metadata record with `formData`, `documentType`, `fileName`, `fileId`, `userId`. Returns `X-Share-Token` / `X-Share-URL` headers. | Promote that record into a durable `contracts` record — **no change to the 45 generators**. |
| File persistence | The `shared_documents` **metadata collection** has a 7-day TTL (`expiresAt`, `expireAfterSeconds:0`). The TTL is on the metadata docs, **not** on the GridFS `shared_documents.files` collection — so the file buffer survives. | Reference the existing `fileId`; add a cleanup guard (see §5.1). |
| DB access | Native driver, `req.app.locals.db`, services on `app.locals`, `ensureIndexes()` on boot (`server.js:292+ initializeServices`). | New `ContractService` follows the same pattern. |
| Scheduler | `node-cron@4` + `moment-timezone` present. `creditScheduler.js` runs daily jobs (`'0 9 * * *'`) and is wired in `initializeServices`. | New `ContractReminderScheduler` mirrors it; daily `'0 8 * * *'` Europe/Skopje. |
| Email | `emailService.sendEmail(to, subject, html, options)` is the primitive; many `sendX` helpers already exist. | Add `sendContractReminder(...)`. |
| In-app notifications | `routes/notifications.js` + notifications collection already exist. | Reminder engine writes a notification per due item. |
| Auth/gating | `authenticateJWT`, `requireVerifiedCompany`, `checkCredits/deductCredits` middleware. | CMS routes use `authenticateJWT` + `requireVerifiedCompany`. CMS itself is **not** credit-metered. |
| Multi-company | `baseDocumentController.js:36-50` already resolves a linked member's `companyInfo` to their admin. | `companyId` field supports the Pro provider-manages-clients model later. |
| UI precedent | `TemplateHistory.js` (188 lines) is a working list-of-generated-docs page; `DocumentGeneration.module.css` is the mandated doc styling. | Model the CMS list/detail on it. |

**Net effect: "generate→store" is ~90% done. v1 is mostly the durable `contracts` layer + reminder engine + UI.**

---

## 3. Data model

### Collection: `contracts` (native driver)

```js
{
  _id,
  userId:    ObjectId,   // account that owns/manages this contract
  companyId: ObjectId,   // company this contract belongs to.
                         //   Basic: == owner's own company.
                         //   Pro:   a client/sub-seat company (future rollup view).
  createdBy: ObjectId,   // who entered it (== userId for self-serve)

  source: 'generated' | 'uploaded' | 'manual',
  title:  String,                       // e.g. "NDA — Acme DOO"
  documentType: String,                 // generator documentName (e.g. 'nda') or 'custom'
  category: 'contract' | 'employment' | 'corporate' | 'other',

  counterparty: {
    name:  String,
    type:  'natural' | 'legal',
    taxNumber: String,                  // optional
    email: String,                      // used for future share/sign; optional
    phone: String
  },

  value: { amount: Number, currency: 'MKD' | 'EUR' },   // optional

  status: 'draft' | 'active' | 'expiring' | 'expired' | 'terminated' | 'renewed',

  dates: {
    signedAt:        Date,    // optional
    effectiveAt:     Date,    // optional
    expiresAt:       Date,    // drives expiry reminders + status
    noticePeriodDays: Number  // notice deadline = expiresAt - noticePeriodDays
  },

  obligations: [{
    _id:   ObjectId,
    label: String,                                   // "Renewal", "Q3 payment"
    type:  'renewal' | 'payment' | 'notice' | 'custom',
    dueAt: Date,
    amount: Number,                                  // optional (payment)
    remindDaysBefore: [Number],                      // e.g. [30, 7, 1]
    status: 'pending' | 'done',
    completedAt: Date
  }],

  file: {                                            // null for 'manual'
    fileId:     ObjectId,                            // GridFS, bucket 'shared_documents'
    fileName:   String,
    shareToken: String,                              // optional back-ref
    mime:       String
  },

  formData: Object,        // captured from generation (regen/audit); null otherwise

  reminders: {
    lastEvaluatedAt: Date,
    sent: [{ obligationId: ObjectId|null, kind: 'expiry'|'notice'|'obligation',
             offsetDays: Number, sentAt: Date, channels: ['email','inapp'] }]
  },

  tags:  [String],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes (`ContractService.ensureIndexes()`)
- `{ userId: 1, status: 1 }` — list/filter.
- `{ companyId: 1 }` — Pro rollup (future).
- `{ 'dates.expiresAt': 1 }` — expiry sweep.
- `{ 'obligations.dueAt': 1 }` — obligation sweep.
- text index on `title`, `counterparty.name` — search.
- **No TTL** — contracts are durable.

### Reminder idempotency
`reminders.sent[]` records `{kind, offsetDays, obligationId}` already fired. The engine only sends an offset that isn't present → safe against duplicate sends on re-runs / restarts.

---

## 4. Backend tasks

- [ ] **`server/services/contractService.js`** — CRUD + queries (`create`, `update`, `get`, `list({userId, status, companyId, page})`, `delete`, `addObligation`, `completeObligation`, `markRenewed`), `ensureIndexes()`, status-transition helper `recomputeStatus(contract)`.
- [ ] **`server/controllers/contractController.js`** — thin handlers, reads `req.app.locals.db`, ownership checks on `userId` (mirror `generationHistoryController` style).
- [ ] **`server/routes/contracts.js`** — mounted at `/api/contracts`, all behind `authenticateJWT` + `requireVerifiedCompany`:
  - `GET    /contracts` — list (filters: status, q, companyId).
  - `POST   /contracts` — manual create.
  - `GET    /contracts/:id` — detail.
  - `PATCH  /contracts/:id` — edit metadata/dates/status.
  - `DELETE /contracts/:id`.
  - `POST   /contracts/:id/obligations` / `PATCH /contracts/:id/obligations/:oid` — manage obligations.
  - `POST   /contracts/from-share/:shareToken` — **generate→save** (see §5).
  - `POST   /contracts/upload` — multipart upload (.docx/.pdf) → GridFS → record.
  - `GET    /contracts/:id/download` — stream file from GridFS.
- [ ] **Register route + service** in `server.js`: `app.use('/api/contracts', require('./routes/contracts'))`; in `initializeServices` build `ContractService`, `await ensureIndexes()`, put on `app.locals.contractService`.
- [ ] **`server/services/contractReminderService.js`** — `evaluateAndSend(now)`:
  1. Query contracts where any `obligations.dueAt` or `dates.expiresAt` falls within `max(remindDaysBefore)` (default offsets `[30,7,1]`) of `now` and not `expired`/`terminated`.
  2. For each due offset not in `reminders.sent`: send email + write notification; append to `reminders.sent`.
  3. `recomputeStatus` → flip `active→expiring` (inside window) / `→expired` (past `expiresAt`); persist `lastEvaluatedAt`.
- [ ] **`server/services/contractReminderScheduler.js`** — mirror `creditScheduler`: `cron.schedule('0 8 * * *', ...)` Europe/Skopje, calls `evaluateAndSend`. Wire in `initializeServices`. Add a manual `POST /api/contracts/_run-reminders` (admin-only) for testing.
- [ ] **`emailService.sendContractReminder(user, contract, dueItems)`** — bilingual (MK default) template; deep-link to `/terminal/contracts/:id`.
- [ ] **Notification write** — reuse the notifications collection/service so the dashboard bell shows reminders.

---

## 5. generate → store → track wiring

### 5.1 Recommended: explicit "Save to Contract Manager" (non-invasive)
- The generation response already returns `X-Share-Token`. After a successful generate, the doc page shows **"Зачувај во Договори"**.
- Click → `POST /api/contracts/from-share/:shareToken`. Server reads the existing `shared_documents` record (`formData`, `fileId`, `fileName`, `documentType`) and creates a `contracts` record referencing the **same GridFS `fileId`** (`source:'generated'`, `status:'draft'`, prefill `counterparty`/`dates` from `formData` where present).
- **Why explicit, not auto:** many of the 45 outputs are *decisions/rulebooks*, not contracts — auto-capturing all of them clutters the repository. Explicit save keeps the list meaningful and touches **zero** generator code.
- **File-persistence guard:** the GridFS file survives the `shared_documents` 7-day metadata TTL (TTL is on metadata, not `*.files`). Add a guard so any future `shared_documents`/GridFS cleanup checks for a referencing `contracts` record before `bucket.delete(fileId)`. _Decision flag: alternatively copy the buffer into a dedicated `contract_documents` bucket on save (mirrors `generationHistoryService`'s separate-bucket pattern) for full isolation — safer, slightly more storage. Recommend reference-with-guard for v1._

### 5.2 Optional later: contract-type auto-suggest
- Maintain a whitelist of contract `documentName`s (`nda`, `rent-agreement`, `loan-agreement`, `services-contract`, `saas-agreement`, `master-services-agreement`, `mediation-agreement`, `debt-assumption-agreement`, `vehicle-sale-purchase-agreement`, `employment-agreement`, `employment-annex`). For these, surface a one-click toast "Track this contract?" after generation. Still explicit, just smarter. No hot-path change.

---

## 6. Frontend tasks

- [ ] **Sidebar**: add `Договори` (CMS) under **РАБОТА** (`Sidebar.js`, new leaf `path:'/terminal/contracts'`, reuse an existing icon e.g. `doc`/`inbox`).
- [ ] **List page** `client/src/pages/terminal/contracts/Contracts.js` — table modeled on `TemplateHistory.js`: title, counterparty, expiry, status badge, next due. Filters (status, search) + "New contract" + status color chips. Uses `DocumentGeneration.module.css` / a co-located `.module.css`.
- [ ] **Detail page** `ContractDetail.js` — metadata, dates, obligations list (add/complete), file download, notes, status control, "Renew" action.
- [ ] **Create/Edit form** `ContractForm.js` — manual create + upload; obligation editor with `remindDaysBefore` presets.
- [ ] **Generation hook** — add "Зачувај во Договори" affordance on doc-generation success (read existing `X-Share-Token`).
- [ ] **Dashboard widget** — "Претстојни обврски" (upcoming obligations / expiring contracts), fits the in-progress compliance-dashboard rebuild. Pulls `GET /api/contracts?status=expiring` + nearest obligations.
- [ ] **`services/api.js`** — add contracts endpoints; reuse CSRF pattern already used by other POSTs.

---

## 7. Placement decision (Basic vs Pro)

Ship v1 as a **Basic tool** (user tracks their own contracts) — fastest path to the retention win, broadest audience. The schema's `companyId` is populated from day one, so the **Pro multiplier** ("accountant/agency tracks every client's contract deadlines from one dashboard") becomes a later *filter + rollup view*, not a data migration. Revisit gating once the Pro member model lands (see `[[business-model-two-sided]]`, `tasks/tier-merge-plan.md`).

---

## 8. Verification plan (prove it works — per CLAUDE.md)

- [ ] Generate an NDA → "Save to Contract Manager" → record appears with prefilled counterparty/file; download streams the same .docx.
- [ ] Manual create with `expiresAt = today+7`, `remindDaysBefore:[7]` → run `POST /_run-reminders` → exactly one email + one notification; second run sends **nothing** (idempotency).
- [ ] Contract past `expiresAt` → status auto-flips to `expired`; inside window → `expiring`.
- [ ] Upload a .pdf → stored in GridFS, downloadable.
- [ ] Ownership: user B cannot GET/PATCH user A's contract (403/404).
- [ ] Confirm the GridFS file referenced by a contract still downloads after simulating `shared_documents` metadata expiry (guard works).

---

## 9. Open decisions (need Martin's call before/early in build)

1. **File persistence**: reference existing `shared_documents` GridFS fileId **+ cleanup guard** (recommended) vs copy into dedicated `contract_documents` bucket (more isolation).
2. **Default reminder offsets**: proposed `[30, 7, 1]` days — confirm.
3. **Reminder hour/timezone**: proposed daily `08:00 Europe/Skopje`.
4. **Capture UX**: explicit "Save to Contracts" (recommended) vs auto-capture for whitelisted contract types.
5. **Manual-only contracts (no file)** allowed in v1? (recommended yes — many real contracts predate Nexa.)

---

## 10. Sequenced milestones

- [ ] **M1 — Data + API**: `contractService` (+indexes), `contractController`, `routes/contracts.js`, server wiring. CRUD working via API.
- [ ] **M2 — Capture**: `from-share` promotion + upload + manual create; file download.
- [ ] **M3 — UI**: sidebar entry, list, detail, create/edit form, generation "Save" affordance.
- [ ] **M4 — Reminder engine**: reminder service + scheduler + email template + notifications + status transitions + idempotency.
- [ ] **M5 — Dashboard widget + verification pass** (§8).

_Estimated surface: ~3 new backend files + 1 route + server wiring; ~4 new frontend files + sidebar/api edits. No changes to the 45 generators._
