const questions = require('../../data/lhc/gdprQuestionsComplete');

// Sanction configuration - GDPR has unified high penalties
const sanctions = {
  high: '2% од годишните приходи за претходната година за правното лице и соодветна глоба за одговорното лице',
  medium: 'глоба согласно Законот за заштита на личните податоци',
  low: 'можни административни мерки од Агенцијата',
  none: 'не се предвидени посебни прекршочни одредби'
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
  dpo: 'Офицер за заштита на лични податоци',
  records: 'Евиденција на операциите',
  access_control: 'Контрола на пристап',
  biometric: 'Биометриски податоци',
  monitoring: 'Следење на вработени',
  data_retention: 'Чување на податоци',
  employee_training: 'Обука на вработени',
  technical_security: 'Технички мерки за безбедност',
  website_security: 'Безбедност на веб страница',
  website_privacy: 'Приватност на веб страница',
  hosting: 'Хостирање',
  processors: 'Обработувачи',
  archiving: 'Архивирање',
  marketing: 'Директен маркетинг',
  video_surveillance: 'Видео надзор',
  physical_security: 'Физичка безбедност',
  backup: 'Сигурносни копии',
  data_destruction: 'Уништување на податоци',
  subject_rights: 'Права на субјектите',
  data_minimization: 'Минимизација на податоци'
};

const ANSWER_TYPES = {
  YES_NO: 'yes_no',
  YES_NO_NA: 'yes_no_na',
  YES_PARTIAL_NO: 'yes_partial_no',
  CHOICE: 'choice'
};

const SANCTION_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'none'
};

/**
 * GDPR Compliance Evaluator
 */
class GDPREvaluator {
  constructor(companyName) {
    this.companyName = companyName;
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

      if (!answer || answer === 'na') return;

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

  evaluateQuestion(question, answer) {
    const { type } = question;

    switch (type) {
      case ANSWER_TYPES.YES_NO:
        return this.evaluateYesNo(question, answer);

      case ANSWER_TYPES.YES_NO_NA:
        return this.evaluateYesNoNA(question, answer);

      case ANSWER_TYPES.YES_PARTIAL_NO:
        return this.evaluateYesPartialNo(question, answer);

      case ANSWER_TYPES.CHOICE:
        return this.evaluateChoice(question, answer);

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
    } else {
      score = -weight;
      message = `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(sanctionLevel)}`;
    }

    return { score, isCompliant, message };
  }

  evaluateYesNoNA(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel } = question;
    let score = 0;
    let isCompliant = false;
    let message = '';

    if (answer === correctAnswer) {
      score = weight;
      isCompliant = true;
      message = `✓ Постапувате во согласност со ${article}.`;
    } else if (answer === 'na') {
      // Not applicable - no score impact
      return { score: 0, isCompliant: true, message: 'Не е применливо' };
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

  evaluateChoice(question, answer) {
    const selectedOption = question.options.find(opt => opt.value === answer);
    if (!selectedOption) {
      return { score: 0, isCompliant: false, message: 'Невалиден одговор' };
    }

    const isCorrect = selectedOption.isCorrect;
    const score = isCorrect ? question.weight : -question.weight;
    const message = isCorrect
      ? `✓ Постапувате во согласност со ${question.article}.`
      : `✗ Постапувањето не е во согласност со ${question.article}.${this.getSanctionText(question.sanctionLevel)}`;

    return { score, isCompliant: isCorrect, message };
  }

  getSanctionText(sanctionLevel) {
    if (sanctionLevel === SANCTION_LEVELS.NONE) {
      return ' Иако не се предвидени прекршочни одредби, ваквото постапување може да има штетни последици.';
    }

    const sanction = sanctions[sanctionLevel];
    if (!sanction) return '';

    return ` Можна санкција: ${sanction}.`;
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
      'Перфектна усогласеност': `Кај ${this.companyName} постои перфектна и целосна усогласеност со Законот за заштита на личните податоци.`,
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
 * Get GDPR questions grouped by category
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
    console.error('Error fetching GDPR questions:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при преземање на прашањата'
    });
  }
}

/**
 * Evaluate GDPR compliance based on answers
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

    // Evaluate using GDPR evaluator
    const evaluator = new GDPREvaluator(companyName);
    const report = evaluator.evaluate(answers);

    // Save to database
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
 * Get user's assessment history
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
