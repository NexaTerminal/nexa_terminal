const questions = require('../../data/lhc/healthAndSafetyQuestionsComplete');

// Sanction configuration by company size
const sanctions = {
  micro: {
    sanction1: { employer: 'глоба од 200-300 евра', responsible: '150 евра' },
    sanction2: { employer: 'глоба од 300-400 евра', responsible: '200 евра' },
    sanction3: { employer: 'глоба од 500-1.000 евра', responsible: '300 евра' }
  },
  small: {
    sanction1: { employer: 'глоба од 200-300 евра', responsible: '150 евра' },
    sanction2: { employer: 'глоба од 300-400 евра', responsible: '200 евра' },
    sanction3: { employer: 'глоба од 500-1.000 евра', responsible: '300 евра' }
  },
  medium: {
    sanction1: { employer: 'глоба од 300-400 евра', responsible: '300 евра' },
    sanction2: { employer: 'глоба од 600-800 евра', responsible: '350 евра' },
    sanction3: { employer: 'глоба од 1.000-2.000 евра', responsible: '400 евра' }
  },
  large: {
    sanction1: { employer: 'глоба од 400-600 евра', responsible: '400 евра' },
    sanction2: { employer: 'глоба од 800-1.000 евра', responsible: '450 евра' },
    sanction3: { employer: 'глоба од 3.000-4.000 евра', responsible: '500 евра' }
  }
};

// Grade configuration
const gradeConfig = {
  perfect: { min: 100, label: 'Перфектна усогласеност', class: 'perfect' },
  excellent: { min: 80, label: 'Одлична усогласеност', class: 'excellent' },
  veryGood: { min: 70, label: 'Задоволителна усогласеност', class: 'verygood' },
  good: { min: 60, label: 'Определена усогласеност', class: 'good' },
  average: { min: 50, label: 'Делумна усогласеност', class: 'average' },
  low: { min: 40, label: 'Ниска усогласеност', class: 'low' },
  veryLow: { min: 0, label: 'Исклучително ниска усогласеност', class: 'low' }
};

// Category names in Macedonian
const categoryNames = {
  general_obligations: 'Општи обврски и стручни лица',
  planning: 'Планирање на мерки',
  safety_declaration: 'Изјава за безбедност',
  risk_assessment: 'Процена на ризик',
  organization: 'Организација на безбедноста',
  workplace_safety: 'Безбедност на работното место',
  cooperation: 'Соработка со други работодавачи',
  financial: 'Финансирање на мерките',
  safety_measures: 'Мерки за безбедност',
  professional_conditions: 'Услови за стручното лице',
  medical_exams: 'Здравствени прегледи',
  notifications: 'Известувања',
  fire_safety: 'Заштита од пожар',
  evacuation: 'План за евакуација',
  first_aid: 'Прва помош',
  information: 'Информирање на вработените',
  emergency_procedures: 'Постапки при опасност',
  consultation: 'Консултација со вработени',
  representatives: 'Претставници на вработените',
  training: 'Обука на вработени',
  inspections: 'Испитувања'
};

const ANSWER_TYPES = {
  YES_NO: 'yes_no',
  TRUE_FALSE: 'true_false',
  YES_NO_NA: 'yes_no_na',
  YES_PARTIAL_NO: 'yes_partial_no',
  MULTI_CHECK: 'multi_check'
};

const SANCTION_LEVELS = {
  HIGH: 'sanction3',
  MEDIUM: 'sanction2',
  LOW: 'sanction1',
  NONE: 'none'
};

/**
 * Smart evaluation engine - handles all question types including multi-check
 */
class HealthAndSafetyEvaluator {
  constructor(companySize, companyName) {
    this.companySize = companySize || 'micro';
    this.companyName = companyName;
    this.sanctions = sanctions[this.companySize];
    this.results = {
      score: 0,
      maxScore: 0,
      violations: [],
      recommendations: []
    };
  }

  evaluate(answers) {
    questions.forEach(question => {
      const answer = answers[question.id];

      // Handle multi-check questions
      if (question.type === ANSWER_TYPES.MULTI_CHECK) {
        this.evaluateMultiCheck(question, answers);
        return;
      }

      if (!answer || answer === 'na' || answer === 'not_applicable') return;

      this.results.maxScore += question.weight;
      const finding = this.evaluateQuestion(question, answer);

      if (!finding.isCompliant) {
        this.results.violations.push({
          question: question.text,
          article: question.article,
          category: categoryNames[question.category],
          finding: finding.message,
          severity: question.sanctionLevel
        });

        if (question.recommendation) {
          this.results.recommendations.push(question.recommendation);
        }
      }

      this.results.score += finding.score;
    });

    return this.generateReport();
  }

  evaluateMultiCheck(question, answers) {
    let checkedCount = 0;
    let totalOptions = question.options.length;
    const uncheckedItems = [];

    question.options.forEach(option => {
      const isChecked = answers[option.id] === '1' || answers[option.id] === true;
      if (isChecked) {
        checkedCount++;
        this.results.score += option.weight;
      } else {
        uncheckedItems.push(option.label);
        this.results.score -= option.weight;
      }
      this.results.maxScore += option.weight;
    });

    // If any items are unchecked, add violation
    if (uncheckedItems.length > 0) {
      const message = `✗ Следните мерки не се преземени: ${uncheckedItems.join('; ')}.${this.getSanctionText(question.sanctionLevel)}`;

      this.results.violations.push({
        question: question.text,
        article: question.article,
        category: categoryNames[question.category],
        finding: message,
        severity: question.sanctionLevel
      });

      const customRecommendation = question.recommendation + ': ' + uncheckedItems.join('; ');
      this.results.recommendations.push(customRecommendation);
    }
  }

  evaluateQuestion(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel, type, options } = question;
    let score = 0;
    let isCompliant = false;
    let message = '';

    // Handle different answer types
    switch (type) {
      case ANSWER_TYPES.YES_NO:
      case ANSWER_TYPES.YES_NO_NA:
        return this.evaluateYesNo(question, answer);

      case ANSWER_TYPES.TRUE_FALSE:
        return this.evaluateTrueFalse(question, answer);

      case ANSWER_TYPES.YES_PARTIAL_NO:
        return this.evaluateYesPartialNo(question, answer);

      default:
        return { score: 0, isCompliant: false, message: 'Невалиден тип на прашање' };
    }
  }

  evaluateYesNo(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel } = question;
    let score = 0;
    let isCompliant = false;
    let message = '';

    if (answer === correctAnswer) {
      score = weight;
      isCompliant = true;
      message = `✓ Постапувате во согласност со ${article}.`;
    } else if (answer === 'partial') {
      score = weight * 0.5;
      isCompliant = true;
      message = `⚠ Делумно постапување согласно со ${article}.`;
    } else {
      score = -weight;
      message = `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(sanctionLevel)}`;
    }

    return { score, isCompliant, message };
  }

  evaluateTrueFalse(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel } = question;
    let score = 0;
    let isCompliant = false;
    let message = '';

    if (answer === correctAnswer || (answer === 'true' && correctAnswer === 'true') || (answer === 'false' && correctAnswer === 'false')) {
      score = weight;
      isCompliant = true;
      message = `✓ Постапувате во согласност со ${article}.`;
    } else if (answer === 'partial') {
      score = -(weight * 0.5);
      message = `⚠ Делумно постапување спротивно на ${article}.${this.getSanctionText(sanctionLevel)}`;
    } else {
      score = -weight;
      message = `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(sanctionLevel)}`;
    }

    return { score, isCompliant, message };
  }

  evaluateYesPartialNo(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel } = question;
    let score = 0;
    let isCompliant = false;
    let message = '';

    if (answer === correctAnswer || answer === 'yes') {
      score = weight;
      isCompliant = true;
      message = `✓ Постапувате во согласност со ${article}.`;
    } else if (answer === 'partial') {
      score = -(weight * 0.5);
      message = `⚠ Делумно постапување спротивно на ${article}.${this.getSanctionText(sanctionLevel)}`;
    } else {
      score = -weight;
      message = `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(sanctionLevel)}`;
    }

    return { score, isCompliant, message };
  }

  getSanctionText(sanctionLevel) {
    if (sanctionLevel === SANCTION_LEVELS.NONE) {
      return ' Иако не се предвидени прекршочни одредби, ваквото постапување може да има штетни последици.';
    }

    const sanction = this.sanctions[sanctionLevel];
    if (!sanction) return '';

    return ` Можна санкција: ${sanction.employer} за работодавачот и ${sanction.responsible} за одговорното лице.`;
  }

  generateReport() {
    const percentage = this.results.maxScore > 0
      ? Math.round((this.results.score / this.results.maxScore) * 100)
      : 0;

    const gradeInfo = this.determineGrade(percentage);

    return {
      score: this.results.score,
      maxScore: this.results.maxScore,
      percentage: Math.max(0, Math.min(100, percentage)),
      grade: gradeInfo.label,
      gradeClass: gradeInfo.class,
      gradeDescription: this.getGradeDescription(gradeInfo.label),
      violations: this.results.violations,
      recommendations: [...new Set(this.results.recommendations)] // Remove duplicates
    };
  }

  determineGrade(percentage) {
    for (const grade of Object.values(gradeConfig)) {
      if (percentage >= grade.min) {
        return grade;
      }
    }
    return gradeConfig.veryLow;
  }

  getGradeDescription(grade) {
    const descriptions = {
      'Перфектна усогласеност': `Кај ${this.companyName} постои перфектна и целосна усогласеност со Законот за безбедност и здравје при работа.`,
      'Одлична усогласеност': `Кај ${this.companyName} постои одлична усогласеност. Меѓутоа, идентификувани се одредени пропусти.`,
      'Задоволителна усогласеност': `Кај ${this.companyName} постои задоволителна усогласеност, но има простор за подобрување.`,
      'Определена усогласеност': `Кај ${this.companyName} постои определена усогласеност, меѓутоа неколку практики треба да се подобрат.`,
      'Делумна усогласеност': `Кај ${this.companyName} постои делумна усогласеност. Постојат многу пропусти кои треба да се отстранат.`,
      'Ниска усогласеност': `Кај ${this.companyName} постои ниска усогласеност. Пропустите се значителни и лесно воочливи.`,
      'Исклучително ниска усогласеност': `Кај ${this.companyName} постои исклучително ниска усогласеност. При евентуална инспекција може да има сериозни последици.`
    };

    return descriptions[grade] || 'Не може да се одреди оценка.';
  }
}

/**
 * Get health and safety questions grouped by category
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
    console.error('Error fetching health and safety questions:', error);
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

    // Evaluate using smart engine
    const evaluator = new HealthAndSafetyEvaluator(companySize, companyName);
    const report = evaluator.evaluate(answers);

    // Save to database
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
      .find({ userId: req.user._id, category: 'health_safety' })
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
  getAssessmentById
};
