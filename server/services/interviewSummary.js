// AI summary for a completed „Интервју" — turns the raw Q&A transcript into a
// short, structured read for the employer. Best-effort: never throws, degrades
// to null when no OPENAI_API_KEY is set. Cheap model (mini) per budget rules.
const OpenAI = require('openai');

const AI_MODEL = process.env.INTERVIEW_SUMMARY_MODEL || 'gpt-4o-mini';
let _openai = null;
const openai = () => {
  if (!_openai && process.env.OPENAI_API_KEY) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
};

const SYSTEM = {
  scan: `Ти си искусен HR аналитичар. Врз основа на одговорите на кандидат од интервју за меки вештини (адаптибилност, соработка, комуникација, иницијатива, справување со критика), напиши краток резиме на македонски за работодавачот. Биди објективен и конкретен, без измислување. Врати JSON со полиња: "summary" (2–3 реченици општ впечаток), "strengths" (низа од 2–4 силни страни), "watchouts" (низа од 1–3 работи за проверка на следен разговор). Не давај конечна одлука за вработување.`,
  exit: `Ти си искусен HR аналитичар. Врз основа на одговорите од излезно интервју на вработен што заминува, напиши краток резиме на македонски за работодавачот, фокусиран на задржување на кадар. Биди објективен, без измислување. Врати JSON со полиња: "summary" (2–3 реченици главна причина за заминување и тон), "themes" (низа од 2–4 повторливи теми/проблеми), "actions" (низа од 1–3 предлози за подобрување на задржувањето).`,
};

const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

// Render the transcript the model reads (question → answer, ratings labelled).
function transcript(questions = [], answers = {}) {
  return questions.map((q, i) => {
    const a = answers[q.id];
    const val = q.kind === 'rating'
      ? (a ? `${a}/5` : '(без оценка)')
      : (clip(a, 1200) || '(без одговор)');
    return `${i + 1}. [${q.kind === 'rating' ? 'оценка' : 'текст'}] ${q.text}\nОдговор: ${val}`;
  }).join('\n\n');
}

/**
 * Generate a summary object for a completed interview.
 * @returns {Promise<{ text, generatedAt } | null>}
 */
async function summarize({ type, questions, answers }) {
  const client = openai();
  if (!client) return null;
  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM[type === 'exit' ? 'exit' : 'scan'] },
        { role: 'user', content: `ОДГОВОРИ ОД ИНТЕРВЈУ:\n\n${transcript(questions, answers)}` },
      ],
    });
    const raw = response?.choices?.[0]?.message?.content || '{}';
    let parsed = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    // Store the parsed structure as `text` (JSON string) so the client can
    // render it richly; keep it compact and bounded.
    const shaped = {
      summary: clip(parsed.summary, 800),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4).map((x) => clip(x, 200)) : [],
      watchouts: Array.isArray(parsed.watchouts) ? parsed.watchouts.slice(0, 3).map((x) => clip(x, 200)) : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 4).map((x) => clip(x, 200)) : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3).map((x) => clip(x, 200)) : [],
    };
    if (!shaped.summary && !shaped.strengths.length && !shaped.themes.length) return null;
    return { text: JSON.stringify(shaped), generatedAt: new Date() };
  } catch (e) {
    console.error('[interviewSummary] failed:', e.message);
    return null;
  }
}

module.exports = { summarize };
