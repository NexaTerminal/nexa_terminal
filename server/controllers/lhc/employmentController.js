const { questions, sanctions, categoryNames } = require('../../data/lhc/employmentQuestionsComplete');
const { scoreModule } = require('./lhcScoring');

// Employment sanction level → canonical severity (§5)
const EMPLOYMENT_SEVERITY = { sanction1: 'high', sanction2: 'medium', none: 'none' };

function employmentBandDescription(band, companyName, criticalCount) {
  const map = {
    4: `Кај ${companyName} постои висока усогласеност со Законот за работните односи.`,
    3: `Кај ${companyName} постои задоволителна усогласеност со Законот за работните односи, но има простор за подобрување.`,
    2: `Кај ${companyName} постои делумна усогласеност со Законот за работните односи. Постојат значителни пропусти што треба да се отстранат.`,
    1: `Кај ${companyName} постои ниска усогласеност. При евентуална инспекција може да има сериозни последици.`
  };
  let base = map[band] || map[1];
  if (criticalCount > 0) base += ` Забележани се ${criticalCount} приоритетни ризици што бараат итно постапување.`;
  return base;
}

/**
 * Score the Employment module through the shared engine (§4–§6).
 */
function evaluateEmployment(answers, companySize, companyName) {
  const sizeSanctions = sanctions[companySize] || sanctions.micro;
  return scoreModule({
    moduleId: 'employment',
    questions,
    answers,
    companyName,
    config: {
      severityOf: q => EMPLOYMENT_SEVERITY[q.sanctionLevel] || 'medium',
      categoryTitleOf: q => categoryNames[q.category] || q.category,
      legalRefOf: q => q.article,
      remediationOf: q => q.recommendation,
      sanctionHintOf: q => {
        if (!q.sanctionLevel || q.sanctionLevel === 'none') return '';
        const s = sizeSanctions && sizeSanctions[q.sanctionLevel];
        return s ? `Можна санкција: ${s.employer} за работодавачот и ${s.responsible} за одговорното лице.` : '';
      },
      describeBand: employmentBandDescription
    }
  });
}

/**
 * Get employment questions grouped by category
 */
async function getQuestions(req, res) {
  try {
    const groupedByCategory = questions.reduce((acc, q) => {
      const category = q.category;
      if (!acc[category]) {
        acc[category] = {
          name: categoryNames[category],
          questions: []
        };
      }
      acc[category].questions.push({
        id: q.id,
        text: q.text,
        article: q.article,
        type: q.type,
        options: q.options
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: { categories: Object.values(groupedByCategory) }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при преземање на прашањата'
    });
  }
}

/**
 * Evaluate compliance based on answers
 */
async function evaluateCompliance(req, res) {
  try {
    const { answers, companySize } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Мора да одговорите на барем едно прашање'
      });
    }

    const report = evaluateEmployment(answers, companySize || 'micro', companyName);

    // Save to database
    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'employment',
      answers,
      companySize,
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при евалуација на усогласеноста'
    });
  }
}

/**
 * Get user's assessment history
 */
async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'employment' })
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
 * Get specific assessment by ID
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
  // Exported for tests
  evaluateEmployment
};
