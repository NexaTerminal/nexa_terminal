require('dotenv').config({ path: __dirname + '/../.env.development' });

/**
 * RAG Retrieval Eval — golden-question harness for the legal AI.
 *
 * Measures retrieval quality WITHOUT calling the answer LLM, so a full run
 * costs fractions of a cent (query embeddings only + the occasional
 * gpt-4o-mini decomposition on complex questions).
 *
 * For each golden question it runs the REAL retrieval path
 * (ChatBotService.retrieveRelevantDocuments — hybrid vector+keyword+RRF) and
 * scores hit@k: does any retrieved chunk come from the expected document?
 *
 * Usage:
 *   node scripts/eval-rag.js              # full golden set
 *   node scripts/eval-rag.js --limit 5    # first 5 questions (quick check)
 *
 * Run this BEFORE and AFTER any retrieval/corpus change — if the hit rate
 * drops, the change made things worse regardless of how it "feels".
 */

const path = require('path');
const goldenSet = require('./eval/golden-questions.json');

const argLimit = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : null;
})();

async function main() {
  if (!process.env.OPENAI_API_KEY || !process.env.QDRANT_URL) {
    console.error('❌ OPENAI_API_KEY and QDRANT_URL must be set (.env.development)');
    process.exit(1);
  }

  // Use the real service so the eval exercises the production retrieval path.
  const chatBotService = require('../chatbot/ChatBotService');

  // Wait for the async Qdrant verification kicked off in the constructor.
  await new Promise(r => setTimeout(r, 2500));
  if (!chatBotService.vectorStore) {
    console.error('❌ Qdrant collection not available — run process-documents.js first');
    process.exit(1);
  }

  const questions = argLimit ? goldenSet.slice(0, argLimit) : goldenSet;
  console.log(`\n🧪 RAG Retrieval Eval — ${questions.length} golden questions\n${'='.repeat(72)}`);

  let hits = 0;
  const failures = [];

  for (const [i, item] of questions.entries()) {
    const docs = await chatBotService.retrieveRelevantDocuments(item.q);
    const names = docs.map(d => (d.metadata?.documentName || '').toLowerCase());
    const expected = item.expectDoc.toLowerCase();
    const hit = names.some(n => n.includes(expected));
    const rank = names.findIndex(n => n.includes(expected)) + 1;

    if (hit) {
      hits++;
      console.log(`  ✅ [${i + 1}/${questions.length}] hit@${rank}  ${item.q.substring(0, 60)}`);
    } else {
      failures.push(item);
      console.log(`  ❌ [${i + 1}/${questions.length}] MISS    ${item.q.substring(0, 60)}`);
      console.log(`         expected: ${item.expectDoc}`);
      console.log(`         got: ${[...new Set(docs.slice(0, 4).map(d => d.metadata?.documentName))].join(' | ').substring(0, 100)}`);
    }
  }

  const rate = ((hits / questions.length) * 100).toFixed(1);
  console.log(`${'='.repeat(72)}`);
  console.log(`\n📊 Hit rate: ${hits}/${questions.length} (${rate}%)`);
  if (failures.length > 0) {
    console.log(`\nFailing questions (fix corpus/retrieval, then re-run):`);
    failures.forEach(f => console.log(`  - ${f.q}  → ${f.expectDoc}`));
  }
  console.log('');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Eval failed:', err.message);
  process.exit(1);
});
