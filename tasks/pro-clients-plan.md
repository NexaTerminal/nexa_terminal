# Plan — Pro "Clients" for document generation (leads.nexa.mk)

Approved scope: lawyers save client company profiles and generate documents on
behalf of a selected client. Basic (tier A) behaviour is UNCHANGED.

## Design
Single server choke point: `server/utils/baseDocumentController.js` builds the
`company` party from `req.user.companyInfo`. We add an optional client override
there, so all ~60 document controllers gain the feature with no per-controller
edits.

## Server
1. `services/clientsService.js` — CRUD over a new `clients` collection, scoped to
   `ownerId`; fields: companyName, companyAddress, companyTaxNumber,
   companyManager (+ optional role/note). Search by name/tax number.
2. `routes/clients.js` — `authenticateJWT` + Pro gate (tier B or ADMIN). REST:
   GET (list/search), POST, GET/:id, PUT/:id, DELETE/:id. Mount `/api/clients`.
3. `utils/baseDocumentController.js` — if `formData.clientId` present AND user is
   Pro/ADMIN AND owns that client → build `company` from the client record
   (instead of user.companyInfo). Otherwise unchanged. Strip `clientId` before
   it reaches the template preprocess.

## Client
4. `pages/terminal/Clients.js` (+ CSS) — workspace: list + search + create/edit/
   delete client profiles.
5. Route `/terminal/clients` in App.js; nav item "Клиентски профили" (Pro only,
   distinct from the existing sales-funnel "Клиенти") in config/nav.js.
6. `components/documents/ClientSelector.js` — shown at the top of document pages
   for Pro users only: "Мојата фирма" | saved clients | + нов клиент. Selecting a
   client sets `formData.clientId` and prefills the company party for the live
   preview (still editable per-document; saved record untouched).
7. Wire the selector into `components/documents/BaseDocumentPage.js`. Because the
   generate request posts `{ formData }`, putting `clientId` in formData flows to
   the server with zero changes to documentService or individual pages.

## Guardrails (kept)
- Ownership: server only honours a `clientId` the requesting user owns.
- Basic untouched: selector renders only for tier B/ADMIN; no clientId → old path.

## Out of scope (later)
- Mini-CRM contacts/notes, per-client document history.
