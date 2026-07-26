const questions = require('../../data/lhc/healthAndSafetyQuestionsComplete');
const { scoreModule } = require('./lhcScoring');

// Sanction amounts by company size (ЗБЗР — степенувани по големина).
const sanctions = {
  micro: { high: 'глоба 300-400 евра за правно лице и 200 евра за одговорно лице', medium: 'глоба 200-300 евра', low: 'глоба до 200 евра / опомена' },
  small: { high: 'глоба 300-400 евра за правно лице и 200 евра за одговорно лице', medium: 'глоба 200-300 евра', low: 'глоба до 200 евра / опомена' },
  medium: { high: 'глоба 600-800 евра за правно лице и 350 евра за одговорно лице', medium: 'глоба 300-400 евра', low: 'глоба до 300 евра / опомена' },
  large: { high: 'глоба 800-1.000 евра за правно лице и 450 евра за одговорно лице', medium: 'глоба 400-600 евра', low: 'глоба до 400 евра / опомена' }
};

const categoryNames = {
  bzr_risk_statement: 'Изјава за безбедност (проценка на ризик)',
  bzr_experts: 'Стручно лице и медицина на трудот',
  bzr_health: 'Здравствени прегледи',
  bzr_training: 'Обука и информирање',
  bzr_representatives: 'Претставници и консултации',
  bzr_emergency: 'Прва помош, евакуација, пожар',
  bzr_equipment: 'Опрема за работа',
  bzr_environment: 'Работна средина (испитувања)',
  bzr_ppe: 'Лична заштитна опрема',
  bzr_signs_workplace: 'Знаци и работен простор',
  bzr_screens: 'Работа со екрани',
  bzr_vulnerable: 'Бремени и млади работници',
  bzr_records: 'Евиденции',
  bzr_reporting: 'Пријавување и инспекција'
};
const CATEGORY_ORDER = [
  'bzr_risk_statement', 'bzr_experts', 'bzr_health', 'bzr_training', 'bzr_representatives',
  'bzr_emergency', 'bzr_equipment', 'bzr_environment', 'bzr_ppe', 'bzr_signs_workplace',
  'bzr_screens', 'bzr_vulnerable', 'bzr_records', 'bzr_reporting'
];

const DISCLAIMER = 'Овој извештај е индикативна самопроценка на усогласеноста со Законот за безбедност и здравје при работа и подзаконските правилници. Не претставува правен совет ниту официјална оцена на Државниот инспекторат за труд. За обврзувачка проценка ангажирајте овластено стручно лице за безбедност при работа и овластена здравствена установа (медицина на трудот).';

function healthBandDescription(band, companyName, criticalCount) {
  const map = {
    4: `Кај ${companyName} постои висока усогласеност со Законот за безбедност и здравје при работа.`,
    3: `Кај ${companyName} постои задоволителна усогласеност, но неколку обврски треба да се доуредат.`,
    2: `Кај ${companyName} постои делумна усогласеност. Постојат значителни пропусти што треба да се отстранат.`,
    1: `Кај ${companyName} постои ниска усогласеност. При инспекциски надзор може да има сериозни последици по безбедноста.`
  };
  let base = map[band] || map[1];
  if (criticalCount > 0) base += ` Забележани се ${criticalCount} приоритетни (критични) ризици што бараат итно постапување.`;
  return base;
}

/**
 * Score the Occupational Safety & Health module through the shared engine (§4–§6).
 */
function evaluateHealthSafety(answers, companySize, companyName) {
  const size = (answers && answers['BZPROF-01']) || companySize || 'micro';
  const sizeSanctions = sanctions[size] || sanctions.micro;
  const report = scoreModule({
    moduleId: 'health_safety',
    questions,
    answers,
    companyName,
    config: {
      severityOf: q => q.severity || 'medium',
      isCritical: q => q.critical === true,
      categoryTitleOf: q => categoryNames[q.category] || q.category,
      legalRefOf: q => q.legalRef,
      remediationOf: q => q.recommendation,
      sanctionHintOf: q => {
        const sev = q.severity === 'critical' ? 'high' : (q.severity || 'medium');
        const hint = sizeSanctions[sev];
        return hint ? `Можна санкција: ${hint}.` : '';
      },
      describeBand: healthBandDescription
    }
  });
  report.disclaimer = DISCLAIMER;
  return report;
}

/**
 * Return the questionnaire: profiling questions + scored questions grouped by category.
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
    console.error('Error fetching health and safety questions:', error);
    res.status(500).json({ success: false, message: 'Грешка при преземање на прашањата' });
  }
}

/**
 * Evaluate compliance based on answers.
 */
async function evaluateCompliance(req, res) {
  try {
    const { answers, companySize } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ success: false, message: 'Мора да одговорите на барем едно прашање' });
    }

    const report = evaluateHealthSafety(answers, companySize || 'micro', companyName);

    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'health_safety',
      answers,
      companySize,
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating health and safety compliance:', error);
    res.status(500).json({ success: false, message: 'Грешка при евалуација на усогласеноста' });
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
      .find({ userId: req.user._id, category: 'health_safety' })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    res.json({ success: true, data: assessments });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Грешка при преземање на историјата' });
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
  evaluateHealthSafety
};
