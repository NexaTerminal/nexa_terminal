// LHC controller: Управување со отпад, пакување и батерии (waste_management).
// Uses the shared profiling-aware scoring engine (lhcScoring.js).

const questions = require('../../data/lhc/wasteManagementQuestionsComplete');
const { scoreModule } = require('./lhcScoring');

const CATEGORY_TITLES = {
  waste_core: 'Општо управување со отпад',
  waste_records: 'Евиденција и извештаи',
  packaging: 'Пакување и отпад од пакување',
  plastic_bags: 'Пластични кеси',
  batteries: 'Батерии и акумулатори',
  eee: 'Електрична и електронска опрема',
  hazardous_waste: 'Опасен отпад',
  waste_storage: 'Складирање на отпад'
};
const CATEGORY_ORDER = [
  'waste_core', 'waste_records', 'packaging', 'plastic_bags',
  'batteries', 'eee', 'hazardous_waste', 'waste_storage'
];

const DISCLAIMER = 'Овој извештај е индикативна самопроценка на усогласеноста со прописите за управување со отпад, пакување и батерии. Не претставува правен совет ниту официјална оцена на Државниот пазарен инспекторат или инспекцијата за животна средина. Дел од обврските важат само за одредени дејности или над одредени прагови. За обврзувачко мислење консултирајте стручно лице.';

// Waste fines are scaled by trader size; a plain-language hint is enough here.
const SANCTION_HINT = 'Можна прекршочна глоба степенувана по големина на трговецот — од ~500 € (микро) до 5.000 € (голем) за евиденциски пропусти, и значително повисока (до 18.000–40.000 € за голем трговец) за потешки прекршоци како диво депонирање или EPR-обврски.';

function wasteBandDescription(band, companyName, criticalCount) {
  const map = {
    4: `Кај ${companyName} постои висока усогласеност со обврските за управување со отпад, пакување и батерии.`,
    3: `Кај ${companyName} постои задоволителна усогласеност, но неколку обврски треба да се доуредат.`,
    2: `Кај ${companyName} постои делумна усогласеност. Постојат значителни пропусти што треба да се отстранат.`,
    1: `Кај ${companyName} постои ниска усогласеност. При инспекциски надзор може да има сериозни последици.`
  };
  let base = map[band] || map[1];
  if (criticalCount > 0) base += ` Забележани се ${criticalCount} приоритетни (критични) ризици што бараат итно постапување.`;
  return base;
}

function evaluateWasteManagement(answers, companyName) {
  const report = scoreModule({
    moduleId: 'waste_management',
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
      describeBand: wasteBandDescription
    }
  });
  report.disclaimer = DISCLAIMER;
  return report;
}

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
    console.error('Error fetching waste management questions:', error);
    res.status(500).json({ success: false, message: 'Грешка при преземање на прашањата' });
  }
}

async function evaluateCompliance(req, res) {
  try {
    const { answers } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ success: false, message: 'Мора да одговорите на барем едно прашање' });
    }

    const report = evaluateWasteManagement(answers, companyName);

    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'waste_management',
      answers,
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating waste management compliance:', error);
    res.status(500).json({ success: false, message: 'Грешка при евалуација на усогласеноста' });
  }
}

async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'waste_management' })
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
  evaluateWasteManagement
};
