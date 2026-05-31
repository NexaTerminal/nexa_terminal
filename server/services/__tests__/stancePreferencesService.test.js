/* eslint-env node */
/**
 * Unit test for stancePreferencesService.
 *
 *   node server/services/__tests__/stancePreferencesService.test.js
 *
 * Tests the pure functions (validate + buildPrefix). DB-touching paths are
 * exercised by integration smoke testing on a live MongoDB.
 */

const assert = require('node:assert/strict');
const Svc = require('../stancePreferencesService');

// ── buildPrefix ────────────────────────────────────────────────────────────

const EMPTY_PREFS = { ...Svc.EMPTY };
assert.equal(Svc.buildPrefix(null),         '', 'null prefs → empty string');
assert.equal(Svc.buildPrefix(undefined),    '', 'undefined prefs → empty string');
assert.equal(Svc.buildPrefix(EMPTY_PREFS),  '', 'all-null prefs → empty string');
assert.equal(Svc.buildPrefix({ ...EMPTY_PREFS, freeNote: '   ' }), '', 'whitespace-only freeNote → empty');
console.log('✓ buildPrefix returns empty for empty/unset preferences');

const full = Svc.buildPrefix({
  riskPosture: 'balanced',
  contractRelation: 'long_term',
  detailLevel: 'detailed',
  commercialPriority: 'commercial',
  reviewTone: 'cautious',
  freeNote: 'Always note Macedonian law.'
});
assert.ok(full.includes('[User stance preferences]'), 'opens with marker');
assert.ok(full.includes('Risk posture: balanced'),    'risk posture line');
assert.ok(full.includes('Contract relationship preference: long-term'), 'contract long_term pretty-printed');
assert.ok(full.includes('Preferred level of detail: detailed'), 'detail level');
assert.ok(full.includes('When tradeoffs arise: prioritize commercial protection'), 'commercial pretty-printed');
assert.ok(full.includes('Review tone: cautious'),     'review tone');
assert.ok(full.includes('"Always note Macedonian law."'), 'freeNote quoted');
assert.ok(full.includes('[End user stance preferences]'), 'closes with marker');
assert.ok(full.includes('Do not mention these preferences explicitly'), 'invisibility instruction');
console.log('✓ buildPrefix renders all fields when fully populated');

const partial = Svc.buildPrefix({
  riskPosture: 'conservative',
  contractRelation: null,
  detailLevel: 'general',
  commercialPriority: null,
  reviewTone: null,
  freeNote: ''
});
assert.ok(partial.includes('Risk posture: conservative'));
assert.ok(partial.includes('Preferred level of detail: general'));
assert.ok(!partial.includes('Contract relationship'), 'omits null contract field');
assert.ok(!partial.includes('Review tone'),           'omits null review tone');
assert.ok(!partial.includes('Additional note'),       'omits empty freeNote');
console.log('✓ buildPrefix omits null fields');

// ── validate ───────────────────────────────────────────────────────────────

const valid = Svc.validate({
  riskPosture: 'balanced',
  contractRelation: 'easy_exit',
  detailLevel: 'general',
  commercialPriority: 'relationship',
  reviewTone: 'pragmatic',
  freeNote: '  trimmed  '
});
assert.equal(valid.riskPosture, 'balanced');
assert.equal(valid.freeNote, 'trimmed', 'freeNote is trimmed');
console.log('✓ validate accepts valid input + trims freeNote');

const allEmpty = Svc.validate({});
assert.equal(allEmpty.riskPosture, null);
assert.equal(allEmpty.freeNote, '');
console.log('✓ validate accepts empty input (returns all nulls)');

assert.throws(() => Svc.validate({ riskPosture: 'reckless' }), /Invalid value for riskPosture/);
console.log('✓ validate throws on bad enum value');

const longNote = 'x'.repeat(301);
assert.throws(() => Svc.validate({ freeNote: longNote }), /exceeds 300/);
console.log('✓ validate throws on freeNote > 300 chars');

assert.doesNotThrow(() => Svc.validate({ freeNote: 'x'.repeat(300) }), 'exactly 300 chars is valid');
console.log('✓ validate accepts exactly 300-char freeNote');

console.log('\nAll stance-preference assertions pass.');
