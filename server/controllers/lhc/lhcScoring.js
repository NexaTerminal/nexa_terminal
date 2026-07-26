// Unified Legal Health Check scoring engine (platform standard §4–§6).
//
// One normalized `complianceFraction ∈ [0,1]` per answer, weighted aggregation
// per category + overall, unified 4-level bands, critical gates, coverage guard,
// and the canonical §6.2 report object. Deterministic and pure.
//
// It emits the new §6.2 fields AND backward-compatible legacy aliases
// (percentage/grade/gradeClass/gradeDescription/violations/allFindings/
// recommendations/disclaimer/coveragePct/provisional) so existing report
// frontends keep working unchanged while the data is standardized.

const { LHC_DISCLAIMER, computeCoverage, isNaAnswer, NA_TOKENS } = require('./lhcShared');

// §6.1 shared bands (high → low)
const BANDS = [
  { band: 4, min: 85, label: 'Висока усогласеност', class: 'excellent' },
  { band: 3, min: 65, label: 'Задоволителна усогласеност', class: 'verygood' },
  { band: 2, min: 40, label: 'Делумна усогласеност', class: 'average' },
  { band: 1, min: 0,  label: 'Ниска усогласеност', class: 'low' }
];
const bandFromPct = (pct) => BANDS.find(b => pct >= b.min) || BANDS[BANDS.length - 1];
const bandByNumber = (n) => BANDS.find(b => b.band === n) || BANDS[BANDS.length - 1];

// §5 canonical severity
const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
const YES_NO_FAMILY = ['yes_no', 'yes_no_na', 'true_false', 'yes_partial_no'];
const CRITICAL_FAIL_MAX = 0.34; // a critical question at/below this fraction trips the gate

const normToken = (a) => (a === 'true' ? 'yes' : (a === 'false' ? 'no' : a));

/**
 * Normalized compliance fraction for a single answer, or null when the answer is
 * NA / missing / invalid (→ excluded from numerator and denominator).
 */
function answerFraction(question, answer) {
  if (isNaAnswer(answer)) return null;
  const type = question.type;

  if (type === 'abcd') {
    const opt = (question.options || []).find(o => o.key === answer);
    if (!opt || opt.points === null || opt.points === undefined) return null;
    return Math.max(0, Math.min(1, opt.points / 3));
  }

  if (type === 'choice') {
    const opt = (question.options || []).find(o => o.value === answer);
    if (!opt) return 0;
    if (typeof opt.fraction === 'number') return Math.max(0, Math.min(1, opt.fraction));
    return opt.isCorrect ? 1 : 0;
  }

  if (type === 'multi_check') {
    if (typeof answer !== 'object' || answer === null) return 0;
    let total = 0;
    let earned = 0;
    (question.options || []).forEach(o => {
      const w = o.weight || 1;
      total += w;
      if (answer[o.id]) earned += w;
    });
    return total > 0 ? earned / total : 0;
  }

  if (type === 'scale_1_10') {
    const v = Number(answer);
    if (!Number.isFinite(v)) return null;
    return Math.max(0, Math.min(1, (v - 1) / 9));
  }

  // yes_no family (and default): partial = 0.5, else compliant?1:0 with polarity.
  const a = normToken(answer);
  if (a === 'partial' || a === 'partially') return 0.5;
  let correct = question.correctAnswer;
  correct = correct === 'true' ? 'yes' : (correct === 'false' ? 'no' : (correct || 'yes'));
  return a === correct ? 1 : 0;
}

/** Human-readable label for the given answer (for the report). */
function answerLabel(question, answer) {
  if (question.type === 'choice') {
    const opt = (question.options || []).find(o => o.value === answer);
    return opt ? opt.label : answer;
  }
  if (question.type === 'abcd') {
    const opt = (question.options || []).find(o => o.key === answer);
    return opt ? opt.label : answer;
  }
  if (question.type === 'multi_check' && answer && typeof answer === 'object') {
    const checked = (question.options || []).filter(o => answer[o.id]).map(o => o.label);
    return checked.length ? `Означени: ${checked.join('; ')}` : 'Ниту една мерка не е означена';
  }
  const labels = { yes: 'Да', no: 'Не', partial: 'Делумно', partially: 'Делумно', true: 'Точно', false: 'Неточно', na: 'Не е применливо', not_applicable: 'Не е применливо' };
  return labels[answer] || answer;
}

/**
 * Compute applicability flags from profiling answers.
 * boolean → flags[flag] = (answer === 'yes'); single/multi → flags[flag] = raw answer.
 */
function computeFlags(questions, answers) {
  const flags = {};
  questions.forEach(q => {
    if (q.type !== 'profiling' || !q.flag) return;
    const a = answers[q.id];
    if (a === undefined || a === null || a === '') return;
    flags[q.flag] = q.profilingType === 'boolean' ? (a === 'yes') : a;
  });
  return flags;
}

function verdictForPct(pct) {
  if (pct >= 85) return 'Оваа област е добро воспоставена.';
  if (pct >= 65) return 'Оваа област е претежно воспоставена, со простор за подобрување.';
  if (pct >= 40) return 'Оваа област е делумно воспоставена — потребни се конкретни чекори.';
  return 'Оваа област е слабо воспоставена — приоритет за усогласување.';
}

/**
 * Score a module.
 *
 * @param {Object} opts
 * @param {string} opts.moduleId
 * @param {Array}  opts.questions       raw module questions
 * @param {Object} opts.answers         { questionId: value }
 * @param {string} opts.companyName
 * @param {Object} opts.config
 *   - severityOf(q) -> 'critical'|'high'|'medium'|'low'|'none'
 *   - categoryTitleOf(q) -> MK title
 *   - legalRefOf(q) -> MK cite
 *   - remediationOf(q) -> MK action
 *   - sanctionHintOf(q) -> MK sanction sentence (optional)
 *   - isCritical(q) -> bool (optional; default severity==='critical')
 *   - isApplicable(q, answers) -> bool (optional; default true)
 *   - describeBand(band, companyName, criticalCount) -> MK string (optional)
 *   - categoryMultiplier(q) -> number (optional; default 1)
 */
function scoreModule({ moduleId, questions, answers = {}, companyName = 'вашата компанија', config = {} }) {
  const severityOf = config.severityOf || (q => q.severity || 'medium');
  const categoryTitleOf = config.categoryTitleOf || (q => q.category);
  const legalRefOf = config.legalRefOf || (q => q.article || q.legalBasis || '');
  const remediationOf = config.remediationOf || (q => q.recommendation || q.remediation || '');
  const sanctionHintOf = config.sanctionHintOf || (() => '');
  const isCritical = config.isCritical || (q => q.critical === true || severityOf(q) === 'critical');
  const categoryMultiplier = config.categoryMultiplier || (() => 1);
  const answerOf = config.answerOf || ((q, ans) => ans[q.id]);
  const isExplicitNa = (raw) => typeof raw === 'string' && NA_TOKENS.includes(raw);

  // Applicability from profiling flags (a question is dropped when its flag excludes it).
  const flags = computeFlags(questions, answers);
  // Applicability may be a single {flag, appliesWhen} condition or an array of
  // conditions (ALL must pass — logical AND). An unanswered flag keeps the
  // question in scope.
  const isApplicable = config.isApplicable || ((q) => {
    if (!q.applicability) return true;
    const conds = Array.isArray(q.applicability) ? q.applicability : [q.applicability];
    return conds.every(({ flag, appliesWhen }) => !(flag in flags) || flags[flag] === appliesWhen);
  });

  let num = 0;
  let den = 0;
  let answeredApplicable = 0;
  let totalApplicable = 0;

  const catAgg = {};            // category id → { num, den, title }
  const findings = [];
  const violations = [];
  const recommendations = [];
  const criticalFailures = [];
  const riskItems = [];
  const legalRefs = new Set();
  const remediationSet = new Map();
  let criticalFailCount = 0;
  let criticalZeroCount = 0;

  questions.forEach(q => {
    if (q.type === 'profiling') return; // profiling sets flags, never scored
    if (!isApplicable(q, answers)) return;

    const raw = answerOf(q, answers);
    // Explicit "Не е применливо" → excluded from numerator AND denominator (§4.4).
    if (isExplicitNa(raw)) return;

    // In scope for coverage (unanswered questions stay in the denominator).
    totalApplicable += 1;

    const fraction = answerFraction(q, raw);
    if (fraction === null) return; // unanswered / invalid → not scored, counts against coverage

    answeredApplicable += 1;

    const ew = (q.weight || 3) * categoryMultiplier(q);
    num += fraction * ew;
    den += ew;

    const catId = q.category;
    if (!catAgg[catId]) catAgg[catId] = { num: 0, den: 0, title: categoryTitleOf(q) };
    catAgg[catId].num += fraction * ew;
    catAgg[catId].den += ew;

    const severity = severityOf(q);
    const legalRef = legalRefOf(q);
    const remediation = remediationOf(q);
    const isCompliant = fraction >= 1;
    const hint = sanctionHintOf(q);
    if (legalRef) legalRefs.add(legalRef);

    let message;
    if (isCompliant) message = `✓ Постапувате во согласност со ${legalRef}.`;
    else if (fraction > 0) message = `⚠ Делумно постапување во однос на ${legalRef}.${hint ? ' ' + hint : ''}`;
    else message = `✗ Постапувањето не е во согласност со ${legalRef}.${hint ? ' ' + hint : ''}`;

    const finding = {
      question: q.text,
      answer: answerLabel(q, raw),
      article: legalRef,
      category: catAgg[catId].title,
      finding: message,
      severity,
      isCompliant,
      fraction
    };
    findings.push(finding);

    if (!isCompliant) {
      violations.push({ question: q.text, article: legalRef, category: catAgg[catId].title, finding: message, severity });
      if (remediation) {
        recommendations.push(remediation);
        remediationSet.set(q.id, { id: q.id, category: catId, categoryTitle: catAgg[catId].title, text: remediation, legalRef, severity, weight: q.weight || 3, critical: isCritical(q) });
      }
      if (SEVERITY_ORDER[severity] >= SEVERITY_ORDER.high) {
        riskItems.push({ question: q.text, severity, sanctionHint: hint || null, remediation, legalRef });
      }
      if (isCritical(q) && fraction <= CRITICAL_FAIL_MAX) {
        criticalFailCount += 1;
        if (fraction === 0) criticalZeroCount += 1;
        criticalFailures.push({ id: q.id, question: q.text, answer: answerLabel(q, raw), whyItMatters: hint || 'Ова е клучна обврска чие неисполнување носи висок ризик.', remediation, legalRef, severity });
      }
    }
  });

  const overallPct = den > 0 ? Math.round((num / den) * 100) : 0;

  // Bands + critical gates (§5.1)
  let bandInfo = bandFromPct(overallPct);
  if (criticalZeroCount >= 2 && bandInfo.band > 1) bandInfo = bandByNumber(1);
  else if (criticalFailCount >= 1 && bandInfo.band > 2) bandInfo = bandByNumber(2);

  const categories = Object.keys(catAgg).map(id => {
    const c = catAgg[id];
    const pct = c.den > 0 ? Math.round((c.num / c.den) * 100) : 0;
    const cb = bandFromPct(pct);
    return { id, title: c.title, pct, band: cb.band, bandClass: cb.class, verdict: verdictForPct(pct) };
  }).sort((a, b) => a.pct - b.pct);

  const catPctById = {};
  categories.forEach(c => { catPctById[c.id] = c.pct; });
  const remediationPlan = Array.from(remediationSet.values())
    .sort((a, b) => {
      const sd = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      if (sd !== 0) return sd;
      const pa = catPctById[a.category] ?? 100;
      const pb = catPctById[b.category] ?? 100;
      if (pa !== pb) return pa - pb;
      return b.weight - a.weight;
    })
    .map((r, i) => ({ priority: i + 1, category: r.category, categoryTitle: r.categoryTitle, text: r.text, legalRef: r.legalRef, severity: r.severity }));

  const { coveragePct, provisional } = computeCoverage(answeredApplicable, totalApplicable);

  const bandDescription = config.describeBand
    ? config.describeBand(bandInfo.band, companyName, criticalFailures.length)
    : defaultBandDescription(bandInfo.band, companyName, criticalFailures.length);

  return {
    // §6.2 canonical
    moduleId,
    companyName,
    scoreLabel: bandInfo.label,
    scoreNumber: Math.max(0, Math.min(100, overallPct)),
    band: bandInfo.band,
    bandClass: bandInfo.class,
    bandDescription,
    coveragePct,
    provisional,
    criticalFailures,
    categories,
    remediationPlan,
    riskItems,
    legalReferences: Array.from(legalRefs).sort((a, b) => a.localeCompare(b, 'mk')),
    disclaimer: LHC_DISCLAIMER,
    profile: { flags },

    // Backward-compatible legacy aliases (existing report frontends read these)
    score: Math.round(num * 100) / 100,
    maxScore: Math.round(den * 100) / 100,
    percentage: Math.max(0, Math.min(100, overallPct)),
    grade: bandInfo.label,
    gradeClass: bandInfo.class,
    gradeDescription: bandDescription,
    violations,
    allFindings: findings,
    recommendations: [...new Set(recommendations)]
  };
}

function defaultBandDescription(band, companyName, criticalCount) {
  let base;
  switch (band) {
    case 4: base = `Кај ${companyName} постои висока усогласеност. Идентификувани се само мали пропусти.`; break;
    case 3: base = `Кај ${companyName} постои задоволителна усогласеност, но неколку области треба да се доуредат.`; break;
    case 2: base = `Кај ${companyName} постои делумна усогласеност. Постојат значајни пропусти што треба да се отстранат.`; break;
    default: base = `Кај ${companyName} постои ниска усогласеност. При евентуална инспекција може да има сериозни последици.`;
  }
  if (criticalCount > 0) base += ` Забележани се ${criticalCount} приоритетни (критични) ризици што бараат итно постапување.`;
  return base;
}

module.exports = { scoreModule, answerFraction, answerLabel, computeFlags, BANDS, SEVERITY_ORDER };
