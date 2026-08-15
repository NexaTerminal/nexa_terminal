/**
 * Storefront resolver — de-merge Phase 3.
 *
 * One build + one design system serves two SEPARATE public websites from two
 * hostnames (two audiences):
 *   'main'  → nexa.mk           / localhost          — Product A (SMB tools)
 *   'leads' → leads.nexa.mk     / leads.localhost    — Product B (lawyers)
 *
 * Resolution order (first match wins):
 *   1. REACT_APP_STOREFRONT build env ('leads' | 'main') — CI / preview builds
 *   2. hostname starts with "leads." → 'leads'   ← the real signal (prod + dev)
 *   3. ?storefront=leads|main query param — one-off preview on plain localhost
 *      (NOT persisted — so it can never "stick" and hijack the other site)
 *   4. default 'main'
 *
 * The interior (/terminal/*) is product-agnostic — it adapts by ROLE, not host.
 */

function hostnameStorefront() {
  try {
    if (typeof window !== 'undefined' && /^leads\./i.test(window.location.hostname)) {
      return 'leads';
    }
  } catch (_) { /* no window */ }
  return null;
}

function queryStorefront() {
  try {
    const q = new URLSearchParams(window.location.search).get('storefront');
    if (q === 'leads' || q === 'main') return q;
  } catch (_) { /* SSR */ }
  return null;
}

export function getStorefront() {
  const env = process.env.REACT_APP_STOREFRONT;
  if (env === 'leads' || env === 'main') return env;

  return hostnameStorefront()   // 2. real host decides (leads.* → leads)
      || queryStorefront()      // 3. one-off ?storefront= preview (not persisted)
      || 'main';                // 4. default → SMB
}

export const isLeadsStorefront = () => getStorefront() === 'leads';

/**
 * The product this DOMAIN represents — the driver of the terminal SHELL
 * (nav layout, dashboard home, branding). 'A' = SMB (nexa.mk), 'B' = lawyers
 * (leads.nexa.mk). Distinct from planProduct() in lib/tier.js, which is the
 * user's ENTITLEMENT (what they paid for). A login-time canonical redirect
 * keeps the two aligned for real users; see App/AuthContext.
 */
export function activeProduct() {
  return getStorefront() === 'leads' ? 'B' : 'A';
}

// Canonical public hostnames per product. Used by the login-time redirect to
// send a user to the domain that matches their plan (so the domain-driven shell
// never contradicts their entitlement).
export const CANONICAL_HOSTS = { A: 'nexa.mk', B: 'leads.nexa.mk' };

/** Host for a product letter ('A'|'B'); anything else → the SMB default. */
export function canonicalHost(product) {
  return CANONICAL_HOSTS[product] || CANONICAL_HOSTS.A;
}

/**
 * If a signed-in user's plan `product` ('A'|'B') doesn't match the storefront
 * host they're on, return a full URL that moves them to the correct host.
 * Returns null when already on the right host, or when the host isn't a known
 * storefront family (so we never bounce staging / previews / IPs).
 *
 * Works for BOTH prod (nexa.mk ↔ leads.nexa.mk) and dev (localhost ↔
 * leads.localhost), preserving the port. ADMIN passes 'ADMIN' and never moves.
 *
 * localStorage is per-origin, so a bare cross-origin redirect would land the
 * user logged out. When a `token` is supplied we route through /auth/callback
 * (the same path Google login uses) so the JWT transfers to the target origin.
 */
export function canonicalRedirectTarget(product, { token, path } = {}) {
  if (typeof window === 'undefined') return null;
  if (product !== 'A' && product !== 'B') return null; // ADMIN / unknown → stay

  const { hostname, port, pathname, search, hash, protocol } = window.location;
  const onLeads = /^leads\./i.test(hostname);
  const wantLeads = product === 'B';
  if (onLeads === wantLeads) return null; // already on the correct host

  // Resolve the storefront family; anything else (127.*, *.vercel.app, staging)
  // is left alone.
  const bare = hostname.replace(/^leads\./i, '').replace(/^www\./i, '');
  let aHost, bHost;
  if (bare === 'nexa.mk')        { aHost = 'nexa.mk';   bHost = 'leads.nexa.mk'; }
  else if (bare === 'localhost') { aHost = 'localhost'; bHost = 'leads.localhost'; }
  else return null;

  const targetHost = wantLeads ? bHost : aHost;
  const portPart = port ? `:${port}` : '';
  const dest = path || `${pathname}${search}${hash}`;

  if (token) {
    const cb = `/auth/callback?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(dest)}`;
    return `${protocol}//${targetHost}${portPart}${cb}`;
  }
  return `${protocol}//${targetHost}${portPart}${dest}`;
}

/**
 * Full URL to the OTHER storefront's host for cross-product navigation
 * (leads.nexa.mk ↔ nexa.mk, and leads.localhost ↔ localhost in dev). Preserves
 * protocol + port. On any host that isn't a known storefront family (previews,
 * IPs, staging) it returns the plain `path` so links never jump off-domain
 * unexpectedly. This is discovery navigation only — no auth/token transfer.
 */
export function otherStorefrontUrl(path = '/') {
  if (typeof window === 'undefined') return path;
  const { hostname, port, protocol } = window.location;
  const onLeads = /^leads\./i.test(hostname);
  const bare = hostname.replace(/^leads\./i, '').replace(/^www\./i, '');

  let aHost, bHost;
  if (bare === 'nexa.mk')        { aHost = 'nexa.mk';   bHost = 'leads.nexa.mk'; }
  else if (bare === 'localhost') { aHost = 'localhost'; bHost = 'leads.localhost'; }
  else return path; // unknown host → stay put

  const targetHost = onLeads ? aHost : bHost;
  const portPart = port ? `:${port}` : '';
  return `${protocol}//${targetHost}${portPart}${path}`;
}
