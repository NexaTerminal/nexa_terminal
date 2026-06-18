# Security Hardening — Remediation Checklist

Branch: `security-hardening`. Fix one → verify → next. Do not push.

## Critical
- [x] 1. Remove unauthenticated admin debug routes (`/test`, `/test-offer-requests`, `/test-users`) in `server/routes/admin.js` (defined before the auth guard → public PII/stack leak).

## High
- [x] 2. Throttle `POST /login` + remove `/direct-login` testing endpoint (`server/routes/auth.js`).
- [x] 3. Dependency vulns — assess `xlsx` usage; bump what's safely bumpable; document the rest.
- [x] 4. Replace blacklist sanitization with `express-mongo-sanitize` (NoSQL operator injection).

## Medium
- [x] 5. Remove hardcoded `JWT_SECRET` / `MONGODB_URI` fallbacks (`passport.js`, etc.).
- [x] 6. Central error handler — stop leaking `error.message` / `error.stack` to clients.
- [x] 7. Consistent strong password policy (fix `updateCredentials` 6-char rule; wire validation).
- [x] 8. Sanitize upload filename (`server/routes/admin.js` multer storage).
- [x] 9. Remove `/api/debug/cors` info-disclosure endpoint.

## Noted (architectural — not in this pass)
- JWT in localStorage / 7d / no revocation → refresh-token redesign (separate effort).
- CSP `'unsafe-inline'` styles tightening (risk of visual breakage — needs verification).

## Review

All fixes on branch `security-hardening` (not pushed). Every changed file passes
`node --check` and all touched modules `require()` cleanly.

**Done & verified**
1. ✅ Deleted unauthenticated admin debug routes (no routes remain above the auth guard).
2. ✅ Rate-limited `/login` + `/create-admin`; removed `/direct-login` route+handler;
   closed the `/create-admin` hardcoded-key backdoor (fail-closed, timing-safe).
3. ✅ Deps 10→5 vulns (prod: 2). Removed unused `csurf`; bounded the reachable `xlsx`
   path (row cap + 10MB limit). Follow-ups: `nodemailer` major bump (email regression
   risk — test first); swap `xlsx`→`exceljs` (no upstream fix).
4. ✅ Hardened NoSQL sanitizer — drops `$`/dotted/proto keys (asserted against payloads).
5. ✅ Removed hardcoded `JWT_SECRET` fallback in passport (boot already fails closed).
6. ✅ Production-safe global error handler; removed the stack-in-response leak.
   Follow-up: ~90 inline `error.message` returns (low sev — needs broad, tested pass).
7. ✅ Single shared password policy (`utils/passwordPolicy.js`) used by register +
   credentials update (no recursion; asserted).
8. ✅ Sanitized multer upload filename (traversal payloads confined; asserted).
9. ✅ Removed `/api/debug/cors`.

**New criticals found during fixes:** `/create-admin` hardcoded-key admin backdoor (#2),
public stack traces via deleted `test-users` (#1).

**Not done (architectural, separate effort):** JWT-in-localStorage → refresh-token
redesign; CSP `'unsafe-inline'` styles tightening (needs visual verification).
