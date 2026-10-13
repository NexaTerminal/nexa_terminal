# Shareable public document-intake links (Pro only)

A Pro user shares a public link for a specific automated document. Anyone with the
link fills the form and generates the .docx — no login. The visitor sees the
website navbar + a signup CTA. Primarily a hook to let a stranger self-generate.

## Decisions (from the user)
- **Link lifetime:** "session-only / lost on window close, no server persistence."
  → Reconciled as a **stateless, HMAC-signed, short-TTL token** (the link *is* the
  data; nothing stored). A third-party-held URL can't die on the Pro's tab-close, so
  a short expiry (default ~4h, configurable) is the honest equivalent. No catalog, no
  revoke UI, no cleanup.
- **Who pays:** the **sponsoring Pro's credits** — read `ownerId` from the signed
  token at generation, check + deduct that user's credits.
- **Output:** **visitor-only** — visitor downloads the .docx; owner receives nothing
  (no email, no storage → minimal PII, simplest).
- **Scope:** **all documents incl. central-register packs** → needs a generalizable
  "public mode" for the document flow.

## Token (stateless, signed — no DB)
`token = base64url(payloadJSON) + "." + base64url(HMAC_SHA256(payload, SECRET))`
payload = `{ v:1, ownerId, documentType, apiEndpoint, clientId?, prefill?{}, locked?[], exp }`
- Signed with a dedicated `DOC_SHARE_SECRET` (fallback to JWT_SECRET).
- `exp` short (env `DOC_SHARE_TTL_MIN`, default 240). Verify signature + exp on every use.
- Keep payload compact; `prefill`/`locked` optional (Phase 3).

## Backend
1. `services/documentShareService.js` — `sign(payload)` / `verify(token)` helpers.
2. `utils/documentGenerators.js` — **generator registry**: documentType →
   `{ templateFunction, documentName, validateFunction, price }`. Built by requiring
   the existing `document_templates/*` + per-type validate. (Optionally refactor
   `autoDocuments.js`/controllers to consume it later; not required for v1.)
3. Authed, **Pro-gated** route `routes/documentShareLinks.js`:
   - `POST /api/document-links` → verify caller is Pro (tier) + has credits; build +
     sign token from `{documentType, clientId?, prefill?, locked?}`; return `{ url }`.
4. **Public** routes `routes/publicDocuments.js` (mounted BEFORE CSRF, like
   publicEmployerBadge/publicCases):
   - `GET /api/public/documents/:token` → verify; return render metadata
     `{ documentType, apiEndpoint, prefill, locked, ownerDisplayName }` (no PII).
   - `POST /api/public/documents/:token/generate` → verify; load owner; resolve
     company party (owner's own or baked `clientId`) via the shared resolver; merge
     visitor formData (force `locked` from `prefill`); run the registry generator;
     **charge the owner's credits**; stream the .docx. **Rate-limited** (per IP +
     per token). `requireVerifiedCompany` is satisfied by the owner (token authorizes).
5. Credit charge for the owner: factor a `chargeGeneration(ownerId, documentType)`
   (the current middleware keys off `req.user`; reuse the underlying credits service).

## Frontend
6. Pro **"Сподели линк"** action in `BaseDocumentPage` (Pro-only, next to Генерирај):
   modal → expiry, "prefill from current form" toggle, lock-fields (Phase 3) →
   `POST /api/document-links` → copyable URL.
7. **Public mode** for the whole document flow:
   - Thread a `publicMode`/`shareToken` context into `BaseDocumentPage`. When set:
     no AuthContext gating, hide credits/terms/client-selector/AI-pro actions; apply
     token `prefill` + lock; submit → public generate endpoint; show website navbar +
     "Направи сметка" signup CTA + owner branding ("Подготвено преку Nexa").
   - `PublicDocumentPage` at `/dokument/:token` (website layout): fetch metadata,
     map `documentType` → the existing page component (client registry — the same
     components `App.js` already imports), render in public mode.
   - Client registry documentType → page component (central-register packs included).
8. `FormField`: support locked/prefilled (disabled + value from token) — Phase 3.

## Phasing
- **Phase 1** — end-to-end on **config-driven documents** (render via BaseDocumentPage's
  generic field config): token sign/verify, public GET + generate, owner credit charge,
  rate limiting, public page + navbar + signup CTA + owner branding, Pro "Сподели" button.
- **Phase 2** — **central-register packs**: thread public mode through the bespoke
  multi-step pages via the component registry.
- **Phase 3** — prefill + lock-fields UI; signup attribution (source = link).

## Risks / notes
- **Owner-credit abuse:** a stateless token can be replayed within its TTL (each
  charge hits the owner). Mitigate with short TTL + rate limiting; add an optional
  per-token counter later if abuse appears (would reintroduce a tiny store).
- **PII in transit:** visitor enters ЕМБГ etc. → HTTPS only; nothing persisted.
- **Verification bypass is intentional:** the owner's verified status authorizes; the
  public endpoint can ONLY produce the token's single documentType + company party.
- **"Dies on tab close"** is not strictly enforceable for a third-party URL → short TTL.

## Review — Phase 1 DONE

Built + verified end-to-end (stubbed Mongo): token → owner load → company resolve →
template → valid .docx (visitor input + owner company both present) → owner charged 1 credit.

Backend:
- `services/documentShareService.js` — stateless HMAC-signed short-TTL token (sign/verify, tamper-caught, exp).
- `utils/documentGenerators.js` — shareable allowlist + reuse of each controller's `.generatorConfig` (attached in `createDocumentController`). Seed: confirmation-of-employment, consent-for-personal-data-processing, termination-agreement.
- `controllers/documentShareLinksController.js` + `routes/documentShareLinks.js` — Pro-gated `GET /shareable`, `POST /api/document-links`.
- `controllers/publicDocumentsController.js` + `routes/publicDocuments.js` — public `GET /:token`, `POST /:token/generate` (IP rate-limited); charges owner credits; streams .docx.
- `server.js` — mounted `/api/public/documents` (before CSRF) + `/api/document-links` (authed).
- `utils/baseDocumentController.js` — `createDocumentController` now attaches `.generatorConfig`.

Frontend:
- `config/documents/shareableDocuments.js` — client allowlist + `fieldsForStep` (handles both config shapes).
- `services/publicDocumentApi.js` — getMeta + generate/download.
- `pages/public/PublicDocumentPage.js` — `/dokument/:token`, PublicLayout (navbar) + owner branding + signup CTA + generic multi-step form.
- `components/documents/ShareLinkButton.js` — Pro-only "Сподели линк" on BaseDocumentPage (only for shareable docs).
- `App.js` — route `/dokument/:token`.

Not yet done: NOT run in the live app (needs `npm start` + a Pro account + Mongo); not committed.

## Review — Phase 2 DONE (central-register packs in public mode)

Approach: reuse each pack page's OWN step UI publicly, without touching BaseDocumentPage.
The pack step components only use `useAuth` (not credit/chatdock/terms), so the public
page wraps the form in a stub `AuthContext.Provider` + `PublicModeContext=true`; the
auth-only act-uploader self-hides in public mode. No change to the authed flow.

- Server: added `company-capital-reduction`, `company-changes`, `company-incorporation`
  to the shareable allowlist. Verified: capital-reduction pack generates via the public
  endpoint (19 KB .docx, owner charged 1 credit, warnings surfaced).
- `contexts/PublicModeContext.js` (new) + `AuthContext` now exported for the stub provider.
- Pack pages export `renderStepContent` / `renderPreview` / `config` (lifted to module
  scope; authed behavior unchanged). `ActUpload` self-hides when `usePublicMode()`.
- `config/documents/shareableDocuments.js` — added the 3 pack configs (config-only, no
  page imports → no import cycle).
- `config/documents/publicPackRenderers.js` (new) — maps pack endpoint → page renderers
  (imported only by the public page).
- `pages/public/PublicDocumentPage.js` — wraps the form in stub Auth + public-mode
  providers; renders pack step UI + its right panel (companyChanges keeps its Step-3
  inputs that live in the preview panel), or the generic renderer for config-driven docs.
- `ShareLinkButton` now also appears on the pack pages (they're shareable).

All 8 touched/new client files parse as JSX; all 6 server generators resolve.
Caveat: the complex pack UIs (companyChanges two-column, M5) are logic-verified + parse,
but the public UX truly needs an in-app run to confirm visually.

## Review — Phase 3 DONE (prefill + lock, signup source)

- Token now carries `prefill` (defaults) + `locked` (fixed field names). `create`
  accepts/validates/caps them (scalars only, JSON ≤ 2500 chars → URL stays usable);
  `getMeta` returns them; `generate` merges prefill as defaults then FORCES locked
  from prefill server-side. Verified: a visitor's attempt to override a locked field
  is blocked (locked value wins), while their own fields flow through.
- `ShareLinkButton` — two checkboxes: "prefill from my data" + "lock those fields".
- `PublicDocumentPage` — applies prefill to the initial form; disables locked fields
  in the generic renderer (packs: prefill shown, locks enforced server-side).
- Signup CTA tagged `/login?src=doc-share` for share-driven attribution.

## Status
Phases 1–3 complete and unit/stub-verified. Whole feature is UNCOMMITTED and has NOT
been run in the live app (needs `npm start` + Mongo + a Pro account). Recommended next:
an end-to-end browser pass (mint a link as Pro → open /dokument/:token incognito →
fill + generate), then commit.
