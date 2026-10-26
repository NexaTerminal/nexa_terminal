#!/usr/bin/env node
/**
 * Offline checks for chatbot/citationValidator.js — no DB, no OpenAI.
 *   node scripts/eval-citations.js
 */
const assert = require('assert');
const { validateCitations } = require('../chatbot/citationValidator');

const docs = [
  { metadata: { article: '23', documentName: 'Закон за работните односи.pdf', score: 0.62 } },
  { metadata: { article: '12-а', documentName: 'Закон за работните односи.pdf', score: 0.41 } },
  { metadata: { article: '23', documentName: 'Закон за трговските друштва.pdf', score: 0.5 } },
  { metadata: { article: '5', documentName: 'Закон за трговските друштва.pdf', score: 0.5 } },
  { metadata: { article: '99', documentName: 'brosura.pdf', score: 0.9 } },
  { metadata: { article: '8', documentName: 'Кривичен Законик.pdf', score: 0.5 } },
];
const isCitable = (m) => m.documentName !== 'brosura.pdf';

// [answer, expected verified "law#article", expected unverified]
const cases = [
  ['**Член 23 од Законот за работните односи** — ...', ['Закон за работните односи#23'], []],
  ['Според член 5 од ЗРО ...', [], ['5']],
  ['Според член 5 од ЗТД ...', ['Закон за трговските друштва#5'], []],
  ['Член 23 од Законот за облигационите односи ...', [], ['23']],
  ['членови 23 и 12-а од ЗРО', ['Закон за работните односи#23', 'Закон за работните односи#12-а'], []],
  ['Член 23, став 2 од ЗТД', ['Закон за трговските друштва#23'], []],
  ['Член 8 од Кривичниот законик', ['Кривичен Законик#8'], []],
  ['Член 23 од ЗОО', ['Закон за работните односи#23'], []], // unknown acronym → number-only
  ['Членови 23, 24 и 25 уредуваат...', ['Закон за работните односи#23'], ['24', '25']],
  ['Во рок од 8 дена според член 23 и 30 дена по...', ['Закон за работните односи#23'], []],
  ['Член 99 (брошура) не смее.', [], ['99']],
  ['Член 23 од Законот за работните односи е утврдено дека', ['Закон за работните односи#23'], []],
  ['Во соодветниот член на законот.', [], []],
];

let failed = 0;
for (const [answer, expV, expU] of cases) {
  const r = validateCitations(answer, docs, isCitable);
  try {
    assert.deepStrictEqual(r.citations.map((c) => `${c.law}#${c.article}`), expV);
    assert.deepStrictEqual(r.unverified, expU);
    assert.strictEqual(r.text.includes('⚠'), expU.length > 0);
    console.log('✓', answer);
  } catch (e) {
    failed += 1;
    console.log('✗', answer, '\n  got', JSON.stringify({ v: r.citations.map((c) => `${c.law}#${c.article}`), u: r.unverified }));
  }
}
console.log(failed ? `\n${failed} failed` : `\nAll ${cases.length} passed`);
process.exit(failed ? 1 : 0);
