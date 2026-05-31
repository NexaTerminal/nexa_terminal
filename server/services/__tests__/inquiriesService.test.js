/* eslint-env node */
/**
 *   node server/services/__tests__/inquiriesService.test.js
 *
 * Pure-function tests for the inquiries service.
 */

const assert = require('node:assert/strict');
const Svc = require('../inquiriesService');

// ── validateInquiryInput: missing required fields ────────────────────────
assert.throws(() => Svc.validateInquiryInput({}), /Недостасуваат полиња/);
console.log('✓ validate rejects empty input');

const ok = Svc.validateInquiryInput({
  source: 'immigration.mk',
  topic: 'Residence permit help',
  city: 'Skopje',
  categories: ['legal', 'translation'],
  summary: 'A long enough summary that exceeds the 40-char minimum threshold.',
  language: 'en',
  urgency: 'urgent',
  inquirerName: 'Test User',
  inquirerEmail: 't@e.com',
  inquirerPhone: '+38970123456'
});
assert.equal(ok.source, 'immigration.mk');
assert.equal(ok.urgency, 'urgent');
assert.deepEqual(ok.categories, ['legal', 'translation']);
console.log('✓ validate normalizes valid input');

// urgency default
const inputNoUrgency = { ...ok, urgency: undefined };
assert.equal(Svc.validateInquiryInput({ ...inputNoUrgency }).urgency, 'standard');
console.log('✓ validate defaults urgency to standard');

// invalid category filtered out
const filtered = Svc.validateInquiryInput({ ...ok, categories: ['legal', 'invented'] });
assert.deepEqual(filtered.categories, ['legal']);
console.log('✓ validate filters invalid categories');

// ── publicProjection strips private fields ───────────────────────────────
const doc = {
  topic: 'X',
  summary: 'Y',
  inquirerName: 'Real Person',
  inquirerEmail: 'real@example.com',
  inquirerPhone: '+38970000000',
  originalEmailBody: 'PRIVATE',
  internalNotes: 'SECRET',
  createdBy: 'admin-id'
};
const pub = Svc.publicProjection(doc);
assert.equal(pub.topic, 'X');
assert.equal(pub.summary, 'Y');
assert.equal(pub.inquirerName,   undefined, 'inquirerName stripped');
assert.equal(pub.inquirerEmail,  undefined, 'inquirerEmail stripped');
assert.equal(pub.inquirerPhone,  undefined, 'inquirerPhone stripped');
assert.equal(pub.originalEmailBody, undefined, 'originalEmailBody stripped');
assert.equal(pub.internalNotes,  undefined, 'internalNotes stripped');
assert.equal(pub.createdBy,      undefined, 'createdBy stripped');
console.log('✓ publicProjection strips all private fields');

console.log('\nAll inquiries-service assertions pass.');
