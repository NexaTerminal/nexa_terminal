const questions = require('../../data/lhc/gdprQuestionsComplete');

// ============================================================================
// Category taxonomy (titles + optional weight multipliers). Scoring weight is
// carried per-question (1..5); category multipliers fine-tune relative impact.
// ============================================================================
const CATEGORY_META = {
  data_mapping:         { title: 'Евиденција и мапирање на податоците', multiplier: 1 },
  principles:           { title: 'Начела на обработка', multiplier: 1 },
  legal_basis:          { title: 'Правен основ', multiplier: 1.3 },
  transparency:         { title: 'Транспарентност и информирање', multiplier: 1 },
  data_subject_rights:  { title: 'Права на субјектите', multiplier: 1.3 },
  employees:            { title: 'Обработка во работни односи', multiplier: 1 },
  security:             { title: 'Безбедност на обработката', multiplier: 1.3 },
  dpo:                  { title: 'Офицер за заштита (ДПО)', multiplier: 1 },
  breach:               { title: 'Нарушување на безбедноста', multiplier: 1.3 },
  records:              { title: 'Евиденција на активности за обработка', multiplier: 1 },
  processors:           { title: 'Обработувачи / трети страни', multiplier: 1.3 },
  transfers:            { title: 'Пренос во трети земји', multiplier: 1 },
  website_cookies:      { title: 'Веб-страница и колачиња', multiplier: 1 },
  video_surveillance:   { title: 'Видеонадзор', multiplier: 1 },
  direct_marketing:     { title: 'Директен маркетинг', multiplier: 1 },
  dpia:                 { title: 'Проценка на влијание (ПВЗЛП)', multiplier: 1 },
  training:             { title: 'Обука и свест', multiplier: 1 }
};

const categoryTitle = (id) => (CATEGORY_META[id] ? CATEGORY_META[id].title : id);
const categoryMultiplier = (id) => (CATEGORY_META[id] ? CATEGORY_META[id].multiplier : 1);

const MAX_POINTS = 3; // points for the fully-implemented (a) option

// ============================================================================
// Compliance bands (overall). Ordered high → low.
// ============================================================================
const BANDS = [
  { band: 4, min: 85, label: 'Висока усогласеност', class: 'excellent' },
  { band: 3, min: 65, label: 'Задоволителна усогласеност', class: 'verygood' },
  { band: 2, min: 40, label: 'Делумна усогласеност', class: 'average' },
  { band: 1, min: 0,  label: 'Ниска усогласеност', class: 'low' }
];

const bandFromPct = (pct) => BANDS.find(b => pct >= b.min) || BANDS[BANDS.length - 1];
const bandByNumber = (n) => BANDS.find(b => b.band === n) || BANDS[BANDS.length - 1];

const { LHC_DISCLAIMER, computeCoverage } = require('./lhcShared');
const DISCLAIMER = LHC_DISCLAIMER + ' За прашања поврзани со заштита на личните податоци можете да се обратите и до офицер за заштита на личните податоци или до Агенцијата за заштита на личните податоци (АЗЛП, azlp.mk).';

const isProfiling = (q) => q.type === 'profiling';

// Build the applicability flags map from the profiling answers.
function computeFlags(answers) {
  const flags = {};
  questions.forEach(q => {
    if (isProfiling(q) && q.profilingType === 'boolean' && q.flag) {
      const ans = answers[q.id];
      if (ans === 'yes') flags[q.flag] = true;
      else if (ans === 'no') flags[q.flag] = false;
    }
  });
  return flags;
}

// A scored question applies unless a profiling flag explicitly excludes it.
function isApplicable(q, flags) {
  if (!q.applicability) return true;
  const { flag, appliesWhen } = q.applicability;
  if (!(flag in flags)) return true; // profiling unanswered → keep in scope
  return flags[flag] === appliesWhen;
}

/**
 * Deterministic GDPR compliance evaluator (a/b/c/d maturity model).
 */
class GDPREvaluator {
  constructor(companyName) {
    this.companyName = companyName || 'вашата компанија';
  }

  evaluate(answers) {
    const flags = computeFlags(answers);

    let num = 0;   // Σ(points * weight)
    let den = 0;   // Σ(MAX_POINTS * weight)
    let answeredApplicable = 0;

    const catAgg = {};        // category id → { num, den, answered }
    const findings = [];      // per-question detail (for the report)
    const criticalFailures = [];
    const remediationSet = new Map(); // dedupe remediation by question id
    const legalRefs = new Set();
    let criticalD = 0;        // count of critical questions answered 'd'
    let criticalCorD = 0;     // count of critical questions answered 'c' or 'd'

    questions.forEach(q => {
      if (isProfiling(q)) return;
      if (!isApplicable(q, flags)) return;

      const rawAnswer = answers[q.id];
      if (!rawAnswer) return; // unanswered → excluded from denominator

      const option = (q.options || []).find(o => o.key === rawAnswer);
      if (!option) return;
      if (option.points === null || option.points === undefined) return; // NA → excluded

      const w = (q.weight || 3) * categoryMultiplier(q.category);
      const points = option.points;

      num += points * w;
      den += MAX_POINTS * w;
      answeredApplicable += 1;

      if (!catAgg[q.category]) catAgg[q.category] = { num: 0, den: 0, answered: 0 };
      catAgg[q.category].num += points * w;
      catAgg[q.category].den += MAX_POINTS * w;
      catAgg[q.category].answered += 1;

      const isStrong = points >= MAX_POINTS;       // fully compliant
      const isWeak = option.key === 'c' || option.key === 'd';

      legalRefs.add(q.legalBasis);

      findings.push({
        id: q.id,
        category: q.category,
        categoryTitle: categoryTitle(q.category),
        question: q.text,
        answerLabel: option.label,
        points,
        maxPoints: MAX_POINTS,
        isStrong,
        isWeak,
        legalBasis: q.legalBasis,
        remediation: q.remediation
      });

      // Collect remediation for anything not fully implemented.
      if (!isStrong && q.remediation) {
        remediationSet.set(q.id, {
          id: q.id,
          category: q.category,
          categoryTitle: categoryTitle(q.category),
          text: q.remediation,
          legalBasis: q.legalBasis,
          weight: q.weight || 3,
          critical: !!q.critical,
          points
        });
      }

      // Critical gate tracking.
      if (q.critical && isWeak) {
        criticalCorD += 1;
        if (option.key === 'd') criticalD += 1;
        criticalFailures.push({
          id: q.id,
          question: q.text,
          selected: option.label,
          remediation: q.remediation,
          legalBasis: q.legalBasis
        });
      }
    });

    const overallPct = den > 0 ? Math.round((num / den) * 100) : 0;

    const applicableTotal = questions.filter(q => !isProfiling(q) && isApplicable(q, flags)).length;
    const { coveragePct, provisional } = computeCoverage(answeredApplicable, applicableTotal);

    // Base band from percentage, then apply critical gates (§7.4).
    let bandInfo = bandFromPct(overallPct);
    if (criticalD >= 2) {
      if (bandInfo.band > 1) bandInfo = bandByNumber(1);
    } else if (criticalCorD >= 1) {
      if (bandInfo.band > 2) bandInfo = bandByNumber(2);
    }

    // Category results.
    const categories = Object.keys(catAgg).map(id => {
      const c = catAgg[id];
      const pct = c.den > 0 ? Math.round((c.num / c.den) * 100) : 0;
      const cb = bandFromPct(pct);
      return {
        id,
        title: categoryTitle(id),
        pct,
        band: cb.band,
        bandLabel: cb.label,
        bandClass: cb.class,
        answered: c.answered,
        verdict: this.categoryVerdict(pct)
      };
    }).sort((a, b) => a.pct - b.pct); // weakest first

    // Remediation plan: critical first, then weakest category %, then weight desc.
    const catPctById = {};
    categories.forEach(c => { catPctById[c.id] = c.pct; });
    const remediationPlan = Array.from(remediationSet.values())
      .sort((a, b) => {
        if (a.critical !== b.critical) return a.critical ? -1 : 1;
        const pa = catPctById[a.category] ?? 100;
        const pb = catPctById[b.category] ?? 100;
        if (pa !== pb) return pa - pb;
        return b.weight - a.weight;
      })
      .map((r, i) => ({
        priority: i + 1,
        id: r.id,
        category: r.category,
        categoryTitle: r.categoryTitle,
        text: r.text,
        legalBasis: r.legalBasis,
        critical: r.critical
      }));

    return {
      overallPct: Math.max(0, Math.min(100, overallPct)),
      band: bandInfo.band,
      bandLabel: bandInfo.label,
      bandClass: bandInfo.class,
      bandDescription: this.bandDescription(bandInfo.band, criticalFailures.length),
      scoreNum: Math.round(num * 100) / 100,
      scoreDen: Math.round(den * 100) / 100,
      coveragePct,
      provisional,
      categories,
      criticalFailures,
      remediationPlan,
      findings,
      legalReferences: Array.from(legalRefs).sort((a, b) => a.localeCompare(b, 'mk')),
      disclaimer: DISCLAIMER,
      profile: { flags },

      // --- Backward-friendly aliases (kept so any generic consumer still works) ---
      percentage: Math.max(0, Math.min(100, overallPct)),
      grade: bandInfo.label,
      gradeClass: bandInfo.class,
      gradeDescription: this.bandDescription(bandInfo.band, criticalFailures.length)
    };
  }

  categoryVerdict(pct) {
    if (pct >= 85) return 'Оваа област е добро воспоставена.';
    if (pct >= 65) return 'Оваа област е претежно воспоставена, со простор за подобрување.';
    if (pct >= 40) return 'Оваа област е делумно воспоставена — потребни се конкретни чекори.';
    return 'Оваа област е слабо воспоставена — приоритет за усогласување.';
  }

  bandDescription(band, criticalCount) {
    const name = this.companyName;
    let base;
    switch (band) {
      case 4:
        base = `Кај ${name} постои висока усогласеност со Законот за заштита на личните податоци. Идентификувани се само мали пропусти.`;
        break;
      case 3:
        base = `Кај ${name} постои задоволителна усогласеност, но неколку области треба да се доуредат.`;
        break;
      case 2:
        base = `Кај ${name} постои делумна усогласеност. Постојат значајни пропусти што треба да се отстранат.`;
        break;
      default:
        base = `Кај ${name} постои ниска усогласеност. При евентуална инспекција може да има сериозни последици.`;
    }
    if (criticalCount > 0) {
      base += ` Забележани се ${criticalCount} приоритетни (критични) ризици што бараат итно постапување.`;
    }
    return base;
  }
}

// ============================================================================
// Route handlers
// ============================================================================

/**
 * Return the questionnaire: profiling questions + scored questions grouped by
 * category (with a/b/c/d options and applicability metadata).
 */
async function getQuestions(req, res) {
  try {
    const profiling = questions
      .filter(isProfiling)
      .map(q => ({
        id: q.id,
        type: q.type,
        profilingType: q.profilingType,
        flag: q.flag || null,
        text: q.text,
        helpText: q.helpText || null,
        options: q.options
      }));

    const orderedCategoryIds = Object.keys(CATEGORY_META);
    const byCategory = {};
    questions.forEach(q => {
      if (isProfiling(q)) return;
      if (!byCategory[q.category]) {
        byCategory[q.category] = {
          id: q.category,
          name: categoryTitle(q.category),
          questions: []
        };
      }
      byCategory[q.category].questions.push({
        id: q.id,
        category: q.category,
        text: q.text,
        helpText: q.helpText || null,
        type: q.type,
        weight: q.weight,
        critical: !!q.critical,
        applicability: q.applicability || null,
        options: q.options,
        legalBasis: q.legalBasis,
        article: q.legalBasis // alias for existing frontend label
      });
    });

    const categories = orderedCategoryIds
      .filter(id => byCategory[id])
      .map(id => byCategory[id]);

    res.json({
      success: true,
      data: { profiling, categories }
    });
  } catch (error) {
    console.error('Error fetching GDPR questions:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при преземање на прашањата'
    });
  }
}

/**
 * Evaluate GDPR compliance based on answers.
 */
async function evaluateCompliance(req, res) {
  try {
    const { answers } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Мора да одговорите на барем едно прашање'
      });
    }

    const evaluator = new GDPREvaluator(companyName);
    const report = evaluator.evaluate(answers);

    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'gdpr',
      answers,
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating GDPR compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при евалуација на усогласеноста'
    });
  }
}

/**
 * Get user's assessment history.
 */
async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'gdpr' })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    res.json({ success: true, data: assessments });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при преземање на историјата'
    });
  }
}

/**
 * Get specific assessment by ID.
 */
async function getAssessmentById(req, res) {
  try {
    const { ObjectId } = require('mongodb');
    const db = req.app.locals.db;
    const assessment = await db
      .collection('lhcAssessments')
      .findOne({ _id: new ObjectId(req.params.id), userId: req.user._id });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Проценката не е пронајдена'
      });
    }

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при преземање на проценката'
    });
  }
}

module.exports = {
  getQuestions,
  evaluateCompliance,
  getAssessmentHistory,
  getAssessmentById,
  // Exported for tests / reuse
  GDPREvaluator,
  CATEGORY_META
};
