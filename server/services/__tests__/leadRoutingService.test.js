/**
 * Inline assertion-based unit tests for pickAssignee.
 * Run with:  node services/__tests__/leadRoutingService.test.js
 *
 * No test framework required. Exits non-zero on any failure.
 */

const assert = require('assert');
const { pickAssignee } = require('../leadRoutingService');

let passed = 0;
const test = (name, fn) => {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
};

console.log('pickAssignee()');

const admin = (overrides = {}) => ({
  _id: 'u1', role: 'admin_user',
  subscription: { status: 'active' },
  superUser: { practiceAreas: ['immigration'], cities: [], lastAssignedAt: null },
  ...overrides
});

test('no candidates → null', () => {
  assert.strictEqual(pickAssignee({ practiceArea: 'immigration' }, []), null);
});

test('single matching candidate → returned', () => {
  const c = admin();
  const out = pickAssignee({ practiceArea: 'immigration', city: 'skopje' }, [c]);
  assert.strictEqual(out, c);
});

test('candidate with wrong practice area → not chosen', () => {
  const c = admin({ superUser: { practiceAreas: ['ip-law'], cities: [] } });
  assert.strictEqual(pickAssignee({ practiceArea: 'immigration' }, [c]), null);
});

test('candidate with empty practiceAreas matches anything', () => {
  const c = admin({ superUser: { practiceAreas: [], cities: [] } });
  const out = pickAssignee({ practiceArea: 'immigration' }, [c]);
  assert.strictEqual(out, c);
});

test('city filter: candidate cities match lead city', () => {
  const c = admin({ superUser: { practiceAreas: ['immigration'], cities: ['skopje'] } });
  const out = pickAssignee({ practiceArea: 'immigration', city: 'Skopje' }, [c]);
  assert.strictEqual(out, c);
});

test('city filter: candidate cities do NOT match lead city → excluded', () => {
  const c = admin({ superUser: { practiceAreas: ['immigration'], cities: ['bitola'] } });
  assert.strictEqual(pickAssignee({ practiceArea: 'immigration', city: 'skopje' }, [c]), null);
});

test('any-city candidate (empty cities) matches any lead', () => {
  const c = admin({ superUser: { practiceAreas: ['immigration'], cities: [] } });
  const out = pickAssignee({ practiceArea: 'immigration', city: 'Tetovo' }, [c]);
  assert.strictEqual(out, c);
});

test('expired (non-active subscription) candidate excluded', () => {
  const c = admin({ subscription: { status: 'suspended' } });
  assert.strictEqual(pickAssignee({ practiceArea: 'immigration' }, [c]), null);
});

test('round-robin: oldest lastAssignedAt wins', () => {
  const c1 = admin({ _id: 'A', superUser: { practiceAreas: ['immigration'], cities: [], lastAssignedAt: new Date('2026-05-20') } });
  const c2 = admin({ _id: 'B', superUser: { practiceAreas: ['immigration'], cities: [], lastAssignedAt: new Date('2026-05-10') } });
  const c3 = admin({ _id: 'C', superUser: { practiceAreas: ['immigration'], cities: [], lastAssignedAt: null } });
  const out = pickAssignee({ practiceArea: 'immigration' }, [c1, c2, c3]);
  // c3 has lastAssignedAt null → treated as oldest (epoch 0) → wins
  assert.strictEqual(out._id, 'C');
});

test('round-robin: between two never-assigned, deterministic on _id', () => {
  const c1 = admin({ _id: 'B', superUser: { practiceAreas: ['immigration'], cities: [], lastAssignedAt: null } });
  const c2 = admin({ _id: 'A', superUser: { practiceAreas: ['immigration'], cities: [], lastAssignedAt: null } });
  const out = pickAssignee({ practiceArea: 'immigration' }, [c1, c2]);
  assert.strictEqual(out._id, 'A');
});

test('city match is case-insensitive', () => {
  const c = admin({ superUser: { practiceAreas: ['immigration'], cities: ['Skopje'] } });
  const out = pickAssignee({ practiceArea: 'immigration', city: 'SKOPJE' }, [c]);
  assert.strictEqual(out, c);
});

test('multiple candidates, mixed practice areas — only matching considered', () => {
  const c1 = admin({ _id: 'A', superUser: { practiceAreas: ['ip-law'], cities: [], lastAssignedAt: new Date('2026-01-01') } });
  const c2 = admin({ _id: 'B', superUser: { practiceAreas: ['immigration'], cities: [], lastAssignedAt: new Date('2026-05-15') } });
  const c3 = admin({ _id: 'C', superUser: { practiceAreas: ['immigration', 'citizenship'], cities: [], lastAssignedAt: new Date('2026-05-01') } });
  const out = pickAssignee({ practiceArea: 'immigration' }, [c1, c2, c3]);
  assert.strictEqual(out._id, 'C'); // older lastAssignedAt among matching
});

console.log(`\n${passed} tests passed`);
