const questions = require('../../data/lhc/archivesQuestionsComplete');
const { scoreModule } = require('./lhcScoring');

// Sanction configuration — Archives Law (135/2025) + Office/Archival Instruction (99/2014).
const sanctions = {
  high: 'Иматели „од посебен интерес": правно лице 500–1.000 €, одговорно лице 150–300 € (Член 59). За стандардните иматели — итна инспекциска наредба со рок и прекршочна изложеност при неизвршување.',
  medium: 'Инспекциска наредба со рок 7–15 дена за основните акти или до 12 месеци за други недостатоци (Член 56, 57). Прекршочна постапка при неизвршување на наредбата.',
  low: 'Препорака за усогласување со Упатството; ризик од забелешка при инспекциски надзор.',
  none: 'Без директна казна — препорачано како добра пракса.'
};

// Category labels in MK
const categoryNames = {
  acts_lists:              'Основни акти: план и листи',
  office_evidence:         'Писарница и дневна евиденција',
  archive_storage:         'Архива и услови за чување',
  electronic_docs:         'Електронски документи',
  selection_destruction:   'Одбирање и уништување',
  disposition_cessation:   'Располагање и престанок',
  supervision_readiness:   'Надзор и подготвеност'
};
const CATEGORY_ORDER = [
  'acts_lists', 'office_evidence', 'archive_storage', 'electronic_docs',
  'selection_destruction', 'disposition_cessation', 'supervision_readiness'
];

function archivesBandDescription(band, companyName, criticalCount) {
  const map = {
    4: `Кај ${companyName} постои висока усогласеност со Законот за архивски материјал и Упатството за канцелариско работење.`,
    3: `Кај ${companyName} постои задоволителна усогласеност, но има простор за подобрување.`,
    2: `Кај ${companyName} постои делумна усогласеност. Постојат значајни пропусти кои треба итно да се отстранат.`,
    1: `Кај ${companyName} постои ниска усогласеност. Основните обврски недостасуваат и инспекцискиот ризик е реален.`
  };
  let base = map[band] || map[1];
  if (criticalCount > 0) {
    base += ` Активирана е црвена линија (небезбедно чување, уништување трајна архива, отстапување кон странство или спречување надзор) — ${criticalCount} приоритетни ризици бараат итно постапување.`;
  }
  return base;
}

/**
 * Score the Archives module through the shared engine (§4–§6).
 * HIGH-sanction questions act as critical gates (the former "red flag").
 */
function evaluateArchives(answers, companyName) {
  const report = scoreModule({
    moduleId: 'archives',
    questions,
    answers,
    companyName,
    config: {
      severityOf: q => q.severity || 'medium',
      isCritical: q => q.critical === true,
      categoryTitleOf: q => categoryNames[q.category] || q.category,
      legalRefOf: q => q.legalRef || q.article,
      remediationOf: q => q.recommendation,
      sanctionHintOf: q => {
        const sev = q.severity === 'critical' ? 'high' : (q.severity || 'medium');
        return sanctions[sev] ? `Можна санкција: ${sanctions[sev]}` : '';
      },
      describeBand: archivesBandDescription
    }
  });
  // Preserve the legacy red-flag flag the Archives report renders.
  report.redFlagTriggered = report.criticalFailures.length > 0;
  return report;
}

/**
 * Get Archives questions grouped by category
 */
async function getQuestions(req, res) {
  try {
    const profiling = questions
      .filter(q => q.type === 'profiling')
      .map(q => ({ id: q.id, type: q.type, profilingType: q.profilingType, flag: q.flag || null, text: q.text, helpText: q.helpText || null, options: q.options }));

    const byCategory = {};
    questions.forEach(q => {
      if (q.type === 'profiling') return;
      if (!byCategory[q.category]) {
        byCategory[q.category] = { id: q.category, name: categoryNames[q.category] || q.category, questions: [] };
      }
      byCategory[q.category].questions.push({
        id: q.id, category: q.category, text: q.text, helpText: q.helpText || null,
        legalBasis: q.legalRef, article: q.legalRef, type: q.type, weight: q.weight,
        critical: !!q.critical, applicability: q.applicability || null, options: q.options || null
      });
    });

    const categories = CATEGORY_ORDER.filter(id => byCategory[id]).map(id => byCategory[id]);
    res.json({ success: true, data: { profiling, categories } });
  } catch (error) {
    console.error('Error fetching Archives questions:', error);
    res.status(500).json({ success: false, message: 'Грешка при преземање на прашањата' });
  }
}

/**
 * Evaluate Archives compliance based on answers
 */
async function evaluateCompliance(req, res) {
  try {
    const { answers } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ success: false, message: 'Мора да одговорите на барем едно прашање' });
    }

    const report = evaluateArchives(answers, companyName);

    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'archives',
      answers,
      ...report,
      createdAt: new Date()
    };
    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating Archives compliance:', error);
    res.status(500).json({ success: false, message: 'Грешка при евалуација на усогласеноста' });
  }
}

async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'archives' })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    res.json({ success: true, data: assessments });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Грешка при преземање на историјата' });
  }
}

async function getAssessmentById(req, res) {
  try {
    const { ObjectId } = require('mongodb');
    const db = req.app.locals.db;
    const assessment = await db
      .collection('lhcAssessments')
      .findOne({ _id: new ObjectId(req.params.id), userId: req.user._id });
    if (!assessment) return res.status(404).json({ success: false, message: 'Проценката не е пронајдена' });
    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, message: 'Грешка при преземање на проценката' });
  }
}

module.exports = {
  getQuestions,
  evaluateCompliance,
  getAssessmentHistory,
  getAssessmentById,
  evaluateArchives
};
