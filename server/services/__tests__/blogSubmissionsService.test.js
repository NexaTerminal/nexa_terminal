/* eslint-env node */
/**
 *   node server/services/__tests__/blogSubmissionsService.test.js
 *
 * Pure-function tests: newsletter month calculation + AI normalize.
 * DB-touching paths are exercised by live integration.
 */

const assert = require('node:assert/strict');
const Svc = require('../blogSubmissionsService');
const AI  = require('../blogGuidelineCheckService');

// ── newsletter month: ≤25 → next; >25 → month after next ─────────────────
assert.equal(Svc.computeNewsletterMonth(new Date(Date.UTC(2026, 4,  1))), '2026-06', 'May 1 → June');
assert.equal(Svc.computeNewsletterMonth(new Date(Date.UTC(2026, 4, 25))), '2026-06', 'May 25 → June (on boundary)');
assert.equal(Svc.computeNewsletterMonth(new Date(Date.UTC(2026, 4, 26))), '2026-07', 'May 26 → July');
assert.equal(Svc.computeNewsletterMonth(new Date(Date.UTC(2026, 11, 20))), '2027-01', 'Dec 20 → Jan next year');
assert.equal(Svc.computeNewsletterMonth(new Date(Date.UTC(2026, 11, 26))), '2027-02', 'Dec 26 → Feb next year');
console.log('✓ computeNewsletterMonth: 25th cutoff math correct');

// ── AI verdict normalize: pass false when issues present ──────────────────
const raw1 = { pass: true, issues: [{ rule: 'tone', message: 'sales language' }], suggestedMetaDescription: 'x' };
const v1 = AI.normalize(raw1);
assert.equal(v1.pass, false, 'pass forced false when issues present');
assert.equal(v1.issues.length, 1);
console.log('✓ AI.normalize: pass forced false when issues exist');

// invalid rule key gets remapped to 'originality'
const v2 = AI.normalize({ pass: false, issues: [{ rule: 'invented', message: 'x' }] });
assert.equal(v2.issues[0].rule, 'originality');
console.log('✓ AI.normalize: invalid rule names remapped');

// keywords capped at 5
const v3 = AI.normalize({ pass: true, issues: [], suggestedKeywords: ['a','b','c','d','e','f','g'] });
assert.equal(v3.suggestedKeywords.length, 5);
console.log('✓ AI.normalize: keywords capped at 5');

// word count
assert.equal(AI.wordCount('<p>Hello <b>brave</b> new world</p>'), 4);
assert.equal(AI.wordCount(''), 0);
console.log('✓ AI.wordCount: strips HTML and counts');

console.log('\nAll blog-submissions assertions pass.');
