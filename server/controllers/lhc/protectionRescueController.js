// LHC controller: Заштита, спасување и превенција на пожари (protection_rescue).
// Uses the shared profiling-aware scoring engine (lhcScoring.js).

const questions = require('../../data/lhc/protectionRescueQuestionsComplete');
const { scoreModule } = require('./lhcScoring');

const CATEGORY_TITLES = {
  pr_documentation: 'Документација (процена и план)',
  pr_organization: 'Организација и известување',
  pr_training: 'Обука и вежби на вработените',
  fire_equipment: 'Противпожарна опрема',
  fire_evacuation: 'Евакуација и означување',
  hazardous_materials: 'Опасни материи',
  pr_resources: 'Ресурси и соработка со надлежни органи'
};
const CATEGORY_ORDER = [
  'pr_documentation', 'pr_organization', 'pr_training',
  'fire_equipment', 'fire_evacuation', 'hazardous_materials', 'pr_resources'
];

const DISCLAIMER = 'Овој извештај е индикативна самопроценка на усогласеноста со Законот за заштита и спасување, Законот за пожарникарството, Правилникот за мерките за заштита од пожари, експлозии и опасни материи и Правилникот за противпожарни апарати. Не претставува правен совет ниту официјална оцена на надлежните органи (Дирекција за заштита и спасување, противпожарна инспекција). За обврзувачко мислење консултирајте стручно лице.';

const SANCTION_HINT = 'Можна глоба: до 5.000 € за правното лице и ~30% за одговорното лице (ЗЗС чл. 153); за обврските по Законот за пожарникарството 1.200–2.000 € (чл. 54/55).';

function protectionBandDescription(band, companyName, criticalCount) {
  const map = {
    4: `Кај ${companyName} постои висока усогласеност со обврските за заштита, спасување и превенција на пожари.`,
    3: `Кај ${companyName} постои задоволителна усогласеност, но неколку обврски треба да се доуредат.`,
    2: `Кај ${companyName} постои делумна усогласеност. Постојат значителни пропусти што треба да се отстранат.`,
    1: `Кај ${companyName} постои ниска усогласеност. При инспекциски надзор може да има сериозни последици по безбедноста.`
  };
  let base = map[band] || map[1];
  if (criticalCount > 0) base += ` Забележани се ${criticalCount} приоритетни (критични) ризици што бараат итно постапување.`;
  return base;
}

function evaluateProtectionRescue(answers, companyName) {
  const report = scoreModule({
    moduleId: 'protection_rescue',
    questions,
    answers,
    companyName,
    config: {
      severityOf: q => q.severity || 'medium',
      isCritical: q => q.critical === true,
      categoryTitleOf: q => CATEGORY_TITLES[q.category] || q.category,
      legalRefOf: q => q.legalRef,
      remediationOf: q => q.recommendation,
      sanctionHintOf: q => (q.severity === 'high' || q.severity === 'critical' ? SANCTION_HINT : ''),
      describeBand: protectionBandDescription
    }
  });
  report.disclaimer = DISCLAIMER; // module-specific disclaimer
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
        byCategory[q.category] = { id: q.category, name: CATEGORY_TITLES[q.category] || q.category, questions: [] };
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
    console.error('Error fetching protection/rescue questions:', error);
    res.status(500).json({ success: false, message: 'Грешка при преземање на прашањата' });
  }
}

/**
 * Evaluate compliance based on answers.
 */
async function evaluateCompliance(req, res) {
  try {
    const { answers } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ success: false, message: 'Мора да одговорите на барем едно прашање' });
    }

    const report = evaluateProtectionRescue(answers, companyName);

    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'protection_rescue',
      answers,
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating protection/rescue compliance:', error);
    res.status(500).json({ success: false, message: 'Грешка при евалуација на усогласеноста' });
  }
}

async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'protection_rescue' })
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
  // Exported for tests
  evaluateProtectionRescue
};
