/* eslint-env node */
/**
 *   node server/services/__tests__/topicsService.test.js
 *
 * Pure-function tests. DB paths covered by live integration testing.
 */

const assert = require('node:assert/strict');
const Svc = require('../topicsService');

// ── _normalizeQuestions ──────────────────────────────────────────────────
assert.throws(() => Svc._normalizeQuestions([]), /Минимум 5/);
assert.throws(() => Svc._normalizeQuestions([{ prompt: 'a' }, { prompt: 'b' }]), /Минимум 5/);
console.log('✓ _normalizeQuestions enforces minimum 5');

const five = Svc._normalizeQuestions([
  { prompt: '  Q1  ' }, { prompt: 'Q2' }, { prompt: 'Q3' },
  { prompt: 'Q4', notes: 'n' }, { prompt: 'Q5' }, { prompt: '' }
]);
assert.equal(five.length, 5);
assert.equal(five[0].order, 1);
assert.equal(five[0].prompt, 'Q1');
console.log('✓ _normalizeQuestions trims, drops empties, assigns order');

const twentyOne = Array.from({ length: 25 }, (_, i) => ({ prompt: 'Q' + (i + 1) }));
const capped = Svc._normalizeQuestions(twentyOne);
assert.equal(capped.length, 20);
console.log('✓ _normalizeQuestions caps at 20');

// ── validateWorklistInput ────────────────────────────────────────────────
assert.throws(() => Svc.validateWorklistInput({}), /Минимум 5/);  // throws on questions first
console.log('✓ validateWorklistInput rejects empty');

const ok = Svc.validateWorklistInput({
  title: 'Test',
  practiceArea: 'employment_law',
  category: 'labor',
  targetKeyword: 'kw',
  scope: 'This is a long enough scope paragraph that crosses the 40 character minimum.',
  questions: [
    { prompt: 'Q1' }, { prompt: 'Q2' }, { prompt: 'Q3' }, { prompt: 'Q4' }, { prompt: 'Q5' }
  ]
});
assert.equal(ok.title, 'Test');
assert.equal(ok.questions.length, 5);
assert.equal(ok.targetLengthWords, 1500);     // default
assert.equal(ok.softDeadlineDays, 28);        // default
console.log('✓ validateWorklistInput defaults targetLength + softDeadline');

// ── wordCount ────────────────────────────────────────────────────────────
assert.equal(Svc.wordCount('<p>Hello <b>brave</b> new world</p>'), 4);
assert.equal(Svc.wordCount(''), 0);
console.log('✓ wordCount strips HTML and counts');

// ── buildPageDoc ─────────────────────────────────────────────────────────
const page = Svc.buildPageDoc({
  worklist: {
    _id: 'WL1',
    title: 'Severance pay',
    practiceArea: 'employment_law',
    category: 'labor',
    targetKeyword: 'отпремнина',
    scope: 'Scope',
    questions: [
      { order: 1, prompt: 'What is it?' },
      { order: 2, prompt: 'Who qualifies?' }
    ]
  },
  submission: {
    _id: 'SUB1',
    authorId: 'A1',
    answers: [
      { order: 1, text: 'Severance pay is...' },
      { order: 2, text: 'Employees over 5 years tenure...' }
    ]
  },
  author: { _id: 'A1', fullName: 'Ana Lawyer', companyInfo: { companyName: 'Lex DOO' } },
  slug: 'severance-pay',
  publicUrl: 'https://topics.nexa.mk/severance-pay',
  acceptedAt: new Date('2026-05-29T00:00:00Z')
});
assert.ok(page.contentHtml.includes('Severance pay'));
assert.ok(page.contentHtml.includes('Ana Lawyer'));
assert.ok(page.contentHtml.includes('Lex DOO'));
assert.ok(page.contentHtml.includes('disclaimer'));
assert.equal(page.slug, 'severance-pay');
assert.ok(Array.isArray(page.jsonLd) && page.jsonLd[0]['@type'] === 'FAQPage');
assert.equal(page.jsonLd[0].mainEntity.length, 2);
console.log('✓ buildPageDoc renders article + JSON-LD + byline');

console.log('\nAll topics-service assertions pass.');
