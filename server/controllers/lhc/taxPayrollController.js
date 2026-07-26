// LHC controller: Плати, придонеси и персонален данок (tax_payroll) —
// под-модул 3 од „Даночна усогласеност".
// Uses the shared profiling-aware scoring engine (lhcScoring.js).

const questions = require('../../data/lhc/taxPayrollQuestionsComplete');
const { scoreModule } = require('./lhcScoring');

const CATEGORY_TITLES = {
  pay_base: 'Основица и уплата',
  pay_benefits: 'Бенефиции и додатоци',
  pay_classification: 'Класификација на ангажмани',
  pay_filing: 'МПИН и рокови',
  pay_controls: 'Контрола на платниот список'
};
const CATEGORY_ORDER = [
  'pay_base', 'pay_benefits', 'pay_classification', 'pay_filing', 'pay_controls'
];

const DISCLAIMER = 'Овој извештај е индикативна самопроценка на усогласеноста со прописите за плати, придонеси од задолжително социјално осигурување и персонален данок. Не претставува даночен/сметководствен ниту правен совет, ниту задолжителни инструкции, ниту официјална оцена на Управата за јавни приходи (УЈП) — препораките и чекорите се само насоки. Стапките на придонеси, минималната основица, минималната плата и стапката на персонален данок се менуваат. За да ја потврдите вашата усогласеност, консултирајте овластен сметководител/даночен советник, адвокат и УЈП.';

// Payroll fines vary; underreporting the base and cash-in-hand payments are among
// the most serious tax offences (back-taxes + contributions + interest + fines).
const SANCTION_HINT = 'Потценета основица и исплата „на рака" се меѓу најсериозните даночни прекршоци — можен доод на данок и придонеси, камати и прекршочни глоби степенувани по големина на трговецот, со можни потешки последици.';

function taxPayrollBandDescription(band, companyName, criticalCount) {
  const map = {
    4: `Кај ${companyName} постои висока усогласеност со обврските за плати, придонеси и персонален данок.`,
    3: `Кај ${companyName} постои задоволителна усогласеност, но неколку ставки треба да се доуредат.`,
    2: `Кај ${companyName} постои делумна усогласеност. Постојат значителни ризици кај основицата, бенефициите или класификацијата.`,
    1: `Кај ${companyName} постои ниска усогласеност. При даночна контрола може да има доод на данок и придонеси, камати и глоби.`
  };
  let base = map[band] || map[1];
  if (criticalCount > 0) base += ` Забележани се ${criticalCount} приоритетни (критични) ризици што бараат итно постапување.`;
  return base;
}

function evaluateTaxPayroll(answers, companyName) {
  const report = scoreModule({
    moduleId: 'tax_payroll',
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
      describeBand: taxPayrollBandDescription
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
    console.error('Error fetching tax payroll questions:', error);
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

    const report = evaluateTaxPayroll(answers, companyName);

    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'tax_payroll',
      answers,
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating tax payroll compliance:', error);
    res.status(500).json({ success: false, message: 'Грешка при евалуација на усогласеноста' });
  }
}

async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'tax_payroll' })
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
  evaluateTaxPayroll
};
