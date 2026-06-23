/* eslint-env node */
/**
 * Parity test for tierService. Runs as a plain Node script (no Jest needed):
 *
 *   node server/services/__tests__/tierService.test.js
 *
 * Asserts that the canonical predicates produce the expected output for a
 * representative set of user shapes. The frontend mirror (client/src/lib/tier.js)
 * implements the same logic — change one, change the other.
 */

const assert = require('node:assert/strict');
const t = require('../tierService');

const cases = [
  // Paid Type A — standard plan, active.
  { name: 'paid-A',
    user: { role: 'standard_user', subscription: { status: 'active', plan: 'standard' } },
    expect: { effective: 'A', isTrial: false, visible: 'A',
              canSubmitBlog: false, canExpressInterest: false, canRequestQATopic: false,
              subSeats: 0 } },

  // Canonical Basic — basic plan, active.
  { name: 'paid-basic',
    user: { role: 'standard_user', subscription: { status: 'active', plan: 'basic' } },
    expect: { effective: 'A', isTrial: false, visible: 'A',
              canSubmitBlog: false, canExpressInterest: false, canRequestQATopic: false,
              subSeats: 0 } },

  // Canonical Pro — pro plan, active. Pro gets blog/interest/Topics + 25 seats.
  { name: 'paid-pro',
    user: { role: 'admin_user', subscription: { status: 'active', plan: 'pro' } },
    expect: { effective: 'B', isTrial: false, visible: 'B',
              canSubmitBlog: true, canExpressInterest: true, canRequestQATopic: true,
              subSeats: 25 } },

  // Legacy admin_5 — resolves to Pro (B) post-merge.
  { name: 'legacy-admin_5→B',
    user: { role: 'admin_user', subscription: { status: 'active', plan: 'admin_5' } },
    expect: { effective: 'B', isTrial: false, visible: 'B',
              canSubmitBlog: true, canExpressInterest: true, canRequestQATopic: true,
              subSeats: 25 } },

  // Legacy admin_10 (Ultra) — MERGED into Pro (B).
  { name: 'legacy-admin_10→B',
    user: { role: 'admin_user', subscription: { status: 'active', plan: 'admin_10' } },
    expect: { effective: 'B', isTrial: false, visible: 'B',
              canSubmitBlog: true, canExpressInterest: true, canRequestQATopic: true,
              subSeats: 25 } },

  // Trial user with intent of B — sees B sidebar, cannot act.
  { name: 'trial-intent-B',
    user: { role: 'standard_user', intendedPlan: 'admin_5', subscription: { status: 'trial' } },
    expect: { effective: 'A', isTrial: true, visible: 'B',
              canSubmitBlog: false, canExpressInterest: false, canRequestQATopic: false,
              subSeats: 0 } },

  // Trial user with legacy intent admin_10 — now surfaces Pro (B) sidebar.
  { name: 'trial-intent-admin_10→B',
    user: { role: 'standard_user', intendedPlan: 'admin_10', subscription: { status: 'trial' } },
    expect: { effective: 'A', isTrial: true, visible: 'B',
              canSubmitBlog: false, canExpressInterest: false, canRequestQATopic: false,
              subSeats: 0 } },

  // Sub-seat of a Pro parent — always renders as A.
  { name: 'sub-seat-of-pro',
    user: { role: 'sub_seat', parentSuperUserId: 'p1', subscription: { status: 'active', plan: 'admin_10' } },
    expect: { effective: 'A', isTrial: false, visible: 'A',
              canSubmitBlog: false, canExpressInterest: false, canRequestQATopic: false,
              subSeats: 0 } },

  // Platform admin — bypass.
  { name: 'admin',
    user: { role: 'admin' },
    expect: { effective: 'ADMIN', isTrial: false, visible: 'ADMIN',
              canSubmitBlog: true, canExpressInterest: true, canRequestQATopic: true,
              subSeats: 0 } },

  // Pending approval counts as trial — actions disabled (isTrial), but an
  // admin_user resolves to Pro (B) via the stale-data fallback, so sidebar +
  // seat hint reflect Pro. Real seat provisioning is gated server-side by status.
  { name: 'pending-approval-admin_user',
    user: { role: 'admin_user', intendedPlan: 'admin_5', subscription: { status: 'pending_approval' } },
    expect: { effective: 'B', isTrial: true, visible: 'B',
              canSubmitBlog: false, canExpressInterest: false, canRequestQATopic: false,
              subSeats: 25 } }
];

let failed = 0;
for (const c of cases) {
  try {
    assert.equal(t.effectiveTier(c.user),           c.expect.effective,         `${c.name} → effectiveTier`);
    assert.equal(t.isTrial(c.user),                 c.expect.isTrial,           `${c.name} → isTrial`);
    assert.equal(t.visibleTier(c.user),             c.expect.visible,           `${c.name} → visibleTier`);
    assert.equal(t.canSubmitBlog(c.user).allowed,   c.expect.canSubmitBlog,     `${c.name} → canSubmitBlog`);
    assert.equal(t.canExpressInterest(c.user).allowed, c.expect.canExpressInterest, `${c.name} → canExpressInterest`);
    assert.equal(t.canRequestQATopic(c.user).allowed,  c.expect.canRequestQATopic,  `${c.name} → canRequestQATopic`);
    assert.equal(t.subSeatLimit(c.user),            c.expect.subSeats,          `${c.name} → subSeatLimit`);
    console.log(`✓ ${c.name}`);
  } catch (e) {
    console.error(`✗ ${c.name}: ${e.message}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} tier predicates pass.`);
