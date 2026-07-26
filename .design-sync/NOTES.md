# design-sync notes — Nexa Terminal (client)

- This is a CRA app, not a packaged library: JSX lives in `.js` files, which the
  converter's esbuild doesn't parse. `.design-sync/build-ds-dist.mjs` (cfg.buildCmd)
  transpiles `client/src` → `client/.ds-dist` first; `cfg.entry` points at the
  generated `ds-entry.js` there. Always run buildCmd before the converter.
- `Notifications` is excluded (`componentSrcMap: null`): dead code — imports
  `@fortawesome/*` which is not in client/package.json, and nothing imports it.
- Auth/i18n/router context: previews wrap in `PreviewProvider`
  (`.design-sync/preview-provider.jsx`, shipped via extraEntries). It stubs
  `AuthContext` with a verified demo company user; the pre-build appends
  `export { AuthContext }` to the transpiled AuthContext.js to make that possible.
- Inter font is loaded by the app from Google Fonts (public/index.html); the
  ds bundle carries the same remote `@import` in `ds-styles.css` → expect
  `[FONT_REMOTE]`, not `[FONT_MISSING]`.
- Non-visual route guards deliberately out of scope: PrivateRoute, AuthCallback,
  ProfileRequired, VerificationRequired, PromoRedeemWatcher.
