require('dotenv').config({ path: __dirname + '/../.env.development' });

/**
 * ANSWER-QUALITY Eval — LLM-as-judge harness for the legal AI.
 *
 * Unlike eval-rag.js (which only measures whether the right DOCUMENT is
 * retrieved), this generates the REAL answer for each golden question and scores
 * the answer itself on the things that actually matter to users:
 *
 *   - faithfulness       — no facts invented beyond the retrieved context
 *   - citation_discipline— cites ONLY citable legal sources; never names a
 *                          background source (brochure / .json / unofficial pdf)
 *   - article_accuracy   — a cited „Член N" is one that appears in the context
 *   - decisiveness       — decisive where the law is clear, hedged only where it
 *                          genuinely depends on facts/evidence/interpretation
 *   - practicality       — concrete, actionable, protective of the user
 *   - language_mk        — Macedonian, clear for a non-lawyer
 *
 * Each criterion is scored 0–2 by a judge model; a run prints per-criterion
 * averages, an overall pass rate, and every weak/failed answer with the judge's
 * note. Run it BEFORE and AFTER any prompt/retrieval/model change: quality must
 * not drop.
 *
 * Cost: one answer generation (gpt-4o) + one judge call per question (~12 Qs).
 *
 * Usage:
 *   node scripts/eval-answers.js                 # full set, default persona
 *   node scripts/eval-answers.js --limit 3       # quick check
 *   node scripts/eval-answers.js --persona direct
 *   EVAL_JUDGE_MODEL=gpt-4o node scripts/eval-answers.js
 */

const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const goldenSet = require('./eval/golden-answers.json');
const StancePreferencesService = require('../services/stancePreferencesService');

const CRITERIA = ['faithfulness', 'citation_discipline', 'article_accuracy', 'decisiveness', 'practicality', 'language_mk'];
const MAX_PER_CRITERION = 2;

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
};
const argLimit = arg('--limit') ? parseInt(arg('--limit'), 10) : null;
const personaKey = arg('--persona');       // optional: score a specific persona voice
const answerModel = arg('--answer-model'); // optional: A/B a different answer model vs the configured one

function buildJudge() {
  return new ChatOpenAI({
    modelName: process.env.EVAL_JUDGE_MODEL || 'gpt-4o',
    temperature: 0,
    maxTokens: 500,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

const JUDGE_PROMPT = `Ти си строг оценувач на квалитетот на одговори од правен AI асистент за македонско право.
Оценуваш ОДГОВОР даден на КОРИСНИК, врз основа на КОНТЕКСТОТ (извори) што му бил достапен на асистентот.

Секој извор во контекстот е означен со citable=true/false и source_class.
- citable=true → официјален правен извор (закон/подзаконски/устав/судска пракса) — СМЕЕ да се цитира.
- citable=false → позадина (брошура/флаер/.json/неофицијален документ) — НЕ смее да се цитира/именува како извор.

Оцени го одговорот по СЕКОЈ критериум со 0, 1 или 2 (2 = одлично, 1 = делумно, 0 = лошо):
- faithfulness: тврдењата произлегуваат од контекстот или од јасно означено општо знаење; НИШТО измислено.
- citation_discipline: цитира само citable извори; НЕ именува ниту еден background извор. Ако одговорот не цитира ништо иако имало citable извор → најмногу 1.
- article_accuracy: секој цитиран „Член N" се совпаѓа со член што стои во контекстот. Ако измислил/претпоставил број на член што го нема во контекстот → 0.
- decisiveness: одлучен таму каде законот е јасен; се оградува само каде реално зависи од факти/докази/толкување.
- practicality: конкретен, применлив, го штити интересот на корисникот (чекори, ризици, рокови).
- language_mk: македонски (кирилица), јасен за не-правник.

Врати САМО валиден JSON:
{"faithfulness":0-2,"citation_discipline":0-2,"article_accuracy":0-2,"decisiveness":0-2,"practicality":0-2,"language_mk":0-2,"overall":"pass|weak|fail","issues":"кратко (една реченица) што недостасува или е добро"}

ПРАШАЊЕ:
{question}

КОНТЕКСТ (извори што му биле достапни на асистентот):
{context}

ОДГОВОР ЗА ОЦЕНУВАЊЕ:
{answer}`;

function summarizeSourcesForJudge(docs) {
  if (!docs || docs.length === 0) return '(нема извори)';
  return docs.slice(0, 10).map((d, i) => {
    const m = d.metadata || {};
    const cls = m.sourceClass || (m.external ? 'external' : 'unknown');
    const citable = (typeof m.citable === 'boolean') ? m.citable : '(untagged)';
    const art = m.article ? ` article=${m.article}` : '';
    const snip = (d.pageContent || '').replace(/\s+/g, ' ').slice(0, 240);
    return `[${i + 1}] ${m.documentName || '?'} | class=${cls} citable=${citable}${art}\n    "${snip}"`;
  }).join('\n');
}

async function main() {
  if (!process.env.OPENAI_API_KEY || !process.env.QDRANT_URL) {
    console.error('❌ OPENAI_API_KEY and QDRANT_URL must be set (.env.development)');
    process.exit(1);
  }

  const chatBotService = require('../chatbot/ChatBotService');
  await new Promise(r => setTimeout(r, 2500));
  if (!chatBotService.vectorStore) {
    console.error('❌ Qdrant collection not available — run process-documents.js first');
    process.exit(1);
  }

  // Optional persona voice for this run (baseline = '').
  let stancePrefix = '';
  if (personaKey) {
    const persona = StancePreferencesService.PERSONAS[personaKey];
    if (!persona) { console.error(`❌ Unknown persona: ${personaKey}`); process.exit(1); }
    stancePrefix = StancePreferencesService.buildPrefix({ ...StancePreferencesService.EMPTY, persona: personaKey });
    console.log(`🎭 Persona under test: ${persona.label}`);
  }

  // A/B: use an override answer model if requested, else the configured one.
  let answerLLM = chatBotService.chatModel;
  if (answerModel) {
    answerLLM = new ChatOpenAI({
      modelName: answerModel,
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.2,
      maxTokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 4096,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    console.log(`🔬 Answer model under test: ${answerModel} (vs configured ${process.env.OPENAI_MODEL || 'gpt-4o'})`);
  }
  const answerChain = RunnableSequence.from([
    chatBotService.promptTemplate,
    answerLLM,
    new StringOutputParser(),
  ]);
  const judge = buildJudge();

  const questions = argLimit ? goldenSet.slice(0, argLimit) : goldenSet;
  console.log(`\n🧪 Answer-Quality Eval — ${questions.length} golden questions (judge: ${process.env.EVAL_JUDGE_MODEL || 'gpt-4o'})\n${'='.repeat(76)}`);

  const totals = Object.fromEntries(CRITERIA.map(c => [c, 0]));
  let passCount = 0;
  const weak = [];

  for (const [i, item] of questions.entries()) {
    // Real retrieval + real answer generation (default or persona voice).
    const docs = await chatBotService.retrieveRelevantDocuments(item.q);
    const context = chatBotService.formatContext(docs);
    const raw = await answerChain.invoke({ stancePrefix, context, question: item.q });
    const { cleanResponse } = chatBotService.parseSuggestions(raw);

    // Judge
    let scores;
    try {
      const judgePrompt = JUDGE_PROMPT
        .replace('{question}', item.q)
        .replace('{context}', summarizeSourcesForJudge(docs))
        .replace('{answer}', cleanResponse);
      const out = await judge.invoke(judgePrompt);
      const text = (out?.content || out || '').toString();
      const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
      scores = JSON.parse(json);
    } catch (e) {
      console.log(`  ⚠️  [${i + 1}] judge parse failed: ${e.message}`);
      continue;
    }

    const sum = CRITERIA.reduce((s, c) => s + (Number(scores[c]) || 0), 0);
    const pct = Math.round((sum / (CRITERIA.length * MAX_PER_CRITERION)) * 100);
    CRITERIA.forEach(c => { totals[c] += (Number(scores[c]) || 0); });
    if (scores.overall === 'pass') passCount++;

    const flag = scores.overall === 'pass' ? '✅' : (scores.overall === 'weak' ? '🟡' : '❌');
    console.log(`  ${flag} [${i + 1}/${questions.length}] ${pct}%  (${item.domain}) ${item.q.slice(0, 52)}`);
    const perCrit = CRITERIA.map(c => `${c.split('_')[0]}:${scores[c]}`).join(' ');
    console.log(`        ${perCrit}  — ${scores.issues || ''}`);
    if (scores.overall !== 'pass') weak.push({ ...item, pct, issues: scores.issues });
  }

  const n = questions.length;
  console.log(`${'='.repeat(76)}`);
  console.log('\n📊 Per-criterion average (out of 2.0):');
  CRITERIA.forEach(c => {
    const avg = (totals[c] / n).toFixed(2);
    const bar = '█'.repeat(Math.round((totals[c] / n) * 10));
    console.log(`   ${c.padEnd(20)} ${avg}  ${bar}`);
  });
  const overallPct = Math.round((Object.values(totals).reduce((a, b) => a + b, 0) / (n * CRITERIA.length * MAX_PER_CRITERION)) * 100);
  console.log(`\n   Overall quality score: ${overallPct}%   |   Pass rate: ${passCount}/${n} (${Math.round(passCount / n * 100)}%)`);

  if (weak.length) {
    console.log(`\n⚠️  Weak / failed answers (fix, then re-run):`);
    weak.forEach(w => console.log(`   - [${w.pct}%] (${w.domain}) ${w.q}\n        → ${w.issues}`));
  }
  console.log('');
  process.exit(0);
}

main().catch(err => { console.error('❌ Eval failed:', err.message); process.exit(1); });
