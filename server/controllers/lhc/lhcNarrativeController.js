// AI narrative for a Legal Health Check report.
//
// Turns the deterministic §6.2 score object (score, bands, critical failures,
// remediation plan) into a short, plain-language advisory for a business owner:
// where they stand + what to do first. Grounded ONLY in the report's own
// findings — it never invents laws, articles, amounts or deadlines.
//
// Endpoint: POST /api/lhc/narrative/:assessmentId
// - loads the stored assessment (must belong to the requesting user)
// - returns a cached narrative if one exists; otherwise generates, caches, returns
// - fail-open: on any LLM error the report simply renders without a narrative

const { ObjectId } = require('mongodb');
const { ChatOpenAI } = require('@langchain/openai');

const NARRATIVE_SYSTEM = `Ти си правен советник што му објаснува на СОПСТВЕНИК НА БИЗНИС (не правник) што значи неговиот извештај за правна усогласеност и што да направи.

Добиваш СТРУКТУРИРАНИ НАОДИ од веќе пресметан извештај. Твојата задача е кратко, јасно резиме и приоритетен план — НЕ нов преглед.

ПРАВИЛА:
- Пиши на македонски (кирилица), топло но директно, како советник што сака клиентот да успее.
- Потпирај се ИСКЛУЧИВО на дадените наоди. НЕ измислувај закони, членови, износи, рокови или проценти што ги нема во наодите.
- Биди конкретен и практичен: што прво, зошто е важно за бизнисот (ризик од инспекција/санкција/спор), кој е следниот чекор.
- Кратко: 200–350 зборови вкупно.

ФОРМАТ (markdown):
## Каде стоите
2–3 реченици: општа состојба според резултатот и band-от, со најважната порака.

## Што прво да средите
Нумерирана листа од најмногу 4 ставки (почни од критичните/најслабите). За секоја: што да се направи + една реченица зошто е важно. Каде наодот дава правна основа, спомни ја како што е дадена (без да измислуваш број на член).

## Добро е што
1–2 реченици за она што е веќе усогласено (ако има), за охрабрување.

НЕ додавај disclaimer — тоа веќе го има извештајот.`;

function buildFindingsBlock(a) {
  const lines = [];
  const title = a.categoryTitle || a.title || a.moduleId || 'Проверка на усогласеност';
  const pct = a.percentage ?? a.scoreNumber ?? 0;
  const band = a.grade || a.scoreLabel || '';
  lines.push(`Модул: ${title}`);
  lines.push(`Резултат: ${pct}% — ${band}`);
  if (a.bandDescription || a.gradeDescription) lines.push(`Опис: ${a.bandDescription || a.gradeDescription}`);

  const crit = a.criticalFailures || [];
  if (crit.length) {
    lines.push('\nКРИТИЧНИ НАОДИ:');
    crit.slice(0, 6).forEach((c, i) => {
      lines.push(`${i + 1}. ${c.question}`);
      if (c.whyItMatters) lines.push(`   Зошто: ${c.whyItMatters}`);
      if (c.remediation) lines.push(`   Мерка: ${c.remediation}`);
      if (c.legalRef) lines.push(`   Основа: ${c.legalRef}`);
    });
  }

  // Remediation plan (§6.2 modules) or the legacy `recommendations` list (General).
  const plan = a.remediationPlan || [];
  if (plan.length) {
    lines.push('\nПЛАН ЗА УСОГЛАСУВАЊЕ (подреден):');
    plan.slice(0, 8).forEach((r, i) => {
      lines.push(`${i + 1}. [${r.severity || 'medium'}] ${r.text}${r.legalRef ? ` (${r.legalRef})` : ''}`);
    });
  } else if (Array.isArray(a.recommendations) && a.recommendations.length) {
    lines.push('\nПРЕПОРАКИ:');
    a.recommendations.slice(0, 8).forEach((r, i) => {
      const text = typeof r === 'string' ? r : (r.text || '');
      const cat = (r && r.sourceCategoryName) ? ` (${r.sourceCategoryName})` : '';
      if (text) lines.push(`${i + 1}. ${text}${cat}`);
    });
  }

  // Category scores: §6.2 `categories` array or the legacy `categoryBreakdown` map.
  const cats = a.categories || [];
  if (cats.length) {
    lines.push('\nОБЛАСТИ (%):');
    cats.slice(0, 12).forEach(c => lines.push(`- ${c.title}: ${c.pct}%`));
  } else if (a.categoryBreakdown && typeof a.categoryBreakdown === 'object') {
    lines.push('\nОБЛАСТИ (%):');
    Object.values(a.categoryBreakdown)
      .filter(c => c && c.total > 0)
      .slice(0, 12)
      .forEach(c => lines.push(`- ${c.name}: ${c.percentage}%`));
  }
  return lines.join('\n');
}

exports.generate = async (req, res) => {
  try {
    const db = req.app.locals.db;
    let _id;
    try { _id = new ObjectId(req.params.assessmentId); }
    catch { return res.status(400).json({ success: false, message: 'Невалиден идентификатор.' }); }

    const col = db.collection('lhcAssessments');
    const assessment = await col.findOne({ _id, userId: req.user._id });
    if (!assessment) return res.status(404).json({ success: false, message: 'Извештајот не е пронајден.' });

    // Cached
    if (assessment.aiNarrative) {
      return res.json({ success: true, narrative: assessment.aiNarrative, cached: true });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI резиме моментално не е достапно.' });
    }

    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-5.1',
      temperature: 0.3,
      maxTokens: 1000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const findings = buildFindingsBlock(assessment);
    const resp = await model.invoke([
      { role: 'system', content: NARRATIVE_SYSTEM },
      { role: 'user', content: `Наоди од извештајот:\n\n${findings}\n\nНапиши го резимето и приоритетниот план.` },
    ]);
    const narrative = (resp?.content || '').toString().trim();
    if (!narrative) return res.status(502).json({ success: false, message: 'Не успеа генерирање.' });

    await col.updateOne({ _id }, { $set: { aiNarrative: narrative, aiNarrativeAt: new Date() } });
    return res.json({ success: true, narrative, cached: false });
  } catch (err) {
    console.error('[lhc/narrative] error:', err.message);
    return res.status(500).json({ success: false, message: 'Грешка при генерирање на резимето.' });
  }
};
