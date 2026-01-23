// General LHC Controller - Hybrid evaluator for mixed categories
// Општ Правен Здравствен Преглед - 20 случајни прашања од сите области

const { getRandomQuestions, SOURCE_CATEGORIES, poolStats, normalizeSanctionLevel } = require('../../data/lhc/generalQuestionsPool');
const { sanctions: employmentSanctions, gradeConfig, categoryNames: employmentCategoryNames } = require('../../data/lhc/employmentQuestionsComplete');

/**
 * Hybrid evaluation engine - handles all question types from all categories
 */
class GeneralComplianceEvaluator {
  constructor(companySize, companyName) {
    this.companySize = companySize || 'micro';
    this.companyName = companyName;
    this.employmentSanctions = employmentSanctions[this.companySize];
    this.results = {
      score: 0,
      maxScore: 0,
      violations: [],
      recommendations: [],
      categoryBreakdown: {}
    };
  }

  evaluate(answers, questions) {
    // Initialize category breakdown
    Object.values(SOURCE_CATEGORIES).forEach(cat => {
      this.results.categoryBreakdown[cat.id] = {
        name: cat.name,
        icon: cat.icon,
        score: 0,
        maxScore: 0,
        violations: 0,
        total: 0
      };
    });

    questions.forEach(question => {
      const answer = answers[question.id];
      if (!answer || answer === 'not_applicable' || answer === 'na') return;

      // Update category breakdown
      const catBreakdown = this.results.categoryBreakdown[question.sourceCategory];
      catBreakdown.total++;
      catBreakdown.maxScore += question.weight;
      this.results.maxScore += question.weight;

      const finding = this.evaluateQuestion(question, answer);

      if (!finding.isCompliant) {
        this.results.violations.push({
          questionId: question.id,
          question: question.text,
          article: question.article,
          category: question.originalCategoryNames
            ? question.originalCategoryNames[question.category]
            : question.category,
          sourceCategory: question.sourceCategory,
          sourceCategoryName: question.sourceCategoryName,
          sourceCategoryIcon: question.sourceCategoryIcon,
          finding: finding.message,
          severity: question.normalizedSanctionLevel
        });

        catBreakdown.violations++;

        if (question.recommendation) {
          this.results.recommendations.push({
            text: question.recommendation,
            sourceCategory: question.sourceCategory,
            sourceCategoryName: question.sourceCategoryName
          });
        }
      }

      this.results.score += finding.score;
      catBreakdown.score += finding.score;
    });

    // Calculate percentages for each category
    Object.keys(this.results.categoryBreakdown).forEach(catId => {
      const cat = this.results.categoryBreakdown[catId];
      cat.percentage = cat.maxScore > 0
        ? Math.max(0, Math.min(100, Math.round((cat.score / cat.maxScore) * 100)))
        : 0;
    });

    return this.generateReport();
  }

  evaluateQuestion(question, answer) {
    const questionType = question.type;

    // Handle multi_check questions (Health & Safety)
    if (questionType === 'multi_check') {
      return this.evaluateMultiCheckQuestion(question, answer);
    }

    // Handle choice questions
    if (questionType === 'choice') {
      return this.evaluateChoiceQuestion(question, answer);
    }

    // Handle yes/no and variants (yes_no, yes_no_na, yes_partial_no, true_false)
    return this.evaluateYesNoQuestion(question, answer);
  }

  evaluateYesNoQuestion(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel, type } = question;
    let score = 0;
    let isCompliant = false;
    let message = '';

    // Normalize answer for true/false type
    let normalizedAnswer = answer;
    if (type === 'true_false') {
      normalizedAnswer = answer === 'true' ? 'yes' : (answer === 'false' ? 'no' : answer);
    }

    // Normalize correct answer
    let normalizedCorrect = correctAnswer;
    if (correctAnswer === 'true') normalizedCorrect = 'yes';
    if (correctAnswer === 'false') normalizedCorrect = 'no';

    const answerMatchesCorrect = normalizedAnswer === normalizedCorrect;

    switch (normalizedAnswer) {
      case 'yes':
        if (normalizedCorrect === 'yes') {
          score = weight;
          isCompliant = true;
          message = `✓ Постапувате во согласност со ${article}.`;
        } else {
          score = -weight;
          message = `✗ Постапувањето е спротивно на ${article}.${this.getSanctionText(question)}`;
        }
        break;

      case 'no':
        if (normalizedCorrect === 'no') {
          score = weight;
          isCompliant = true;
          message = `✓ Постапувате во согласност со ${article}.`;
        } else {
          score = -weight;
          message = `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(question)}`;
        }
        break;

      case 'partial':
      case 'partially':
        score = -(weight * 0.5);
        message = `⚠ Делумно постапување спротивно на ${article}.${this.getSanctionText(question)}`;
        break;

      default:
        // Handle any other values as non-compliant
        score = -(weight * 0.25);
        isCompliant = false;
        message = `⚠ Неодредено постапување во однос на ${article}.`;
    }

    return { score, isCompliant, message };
  }

  evaluateChoiceQuestion(question, answer) {
    const selectedOption = question.options.find(opt => opt.value === answer);
    if (!selectedOption) {
      return { score: 0, isCompliant: false, message: 'Невалиден одговор' };
    }

    const isCorrect = selectedOption.isCorrect;
    const score = isCorrect ? question.weight : -question.weight;
    const message = isCorrect
      ? `✓ Постапувате во согласност со ${question.article}.`
      : `✗ Постапувањето не е во согласност со ${question.article}.${this.getSanctionText(question)}`;

    return { score, isCompliant: isCorrect, message };
  }

  evaluateMultiCheckQuestion(question, answer) {
    // Multi-check answers come as an object { q25a: true, q25b: false, ... }
    if (typeof answer !== 'object') {
      return { score: 0, isCompliant: false, message: 'Невалиден формат на одговор' };
    }

    let totalWeight = 0;
    let earnedWeight = 0;
    const checkedItems = [];
    const uncheckedItems = [];

    question.options.forEach(opt => {
      totalWeight += opt.weight;
      if (answer[opt.id]) {
        earnedWeight += opt.weight;
        checkedItems.push(opt.label);
      } else {
        uncheckedItems.push(opt.label);
      }
    });

    const isFullyCompliant = uncheckedItems.length === 0;
    const score = earnedWeight - (totalWeight - earnedWeight) * 0.5;
    const complianceRatio = totalWeight > 0 ? earnedWeight / totalWeight : 0;

    let message;
    if (isFullyCompliant) {
      message = `✓ Сите мерки се превземени во согласност со ${question.article}.`;
    } else if (complianceRatio >= 0.5) {
      message = `⚠ Делумно превземени мерки. Недостасуваат: ${uncheckedItems.length} мерки.`;
    } else {
      message = `✗ Повеќето мерки не се превземени. ${this.getSanctionText(question)}`;
    }

    return { score, isCompliant: isFullyCompliant, message };
  }

  getSanctionText(question) {
    const normalizedLevel = question.normalizedSanctionLevel;

    if (normalizedLevel === 'none') {
      return ' Иако не се предвидени прекршочни одредби, ваквото постапување може да има штетни последици.';
    }

    // For employment questions, use specific sanctions
    if (question.sourceCategory === 'employment' && this.employmentSanctions) {
      const originalLevel = question.sanctionLevel;
      const sanction = this.employmentSanctions[originalLevel];
      if (sanction) {
        return ` Можна санкција: ${sanction.employer} за работодавачот и ${sanction.responsible} за одговорното лице.`;
      }
    }

    // Generic sanction text for other categories
    const sanctionDescriptions = {
      high: ' Постои ризик од значителни казни согласно законската регулатива.',
      medium: ' Постои ризик од умерени казни согласно законската регулатива.',
      low: ' Постои ризик од помали казни или опомени.'
    };

    return sanctionDescriptions[normalizedLevel] || '';
  }

  generateReport() {
    const percentage = this.results.maxScore > 0
      ? Math.round((this.results.score / this.results.maxScore) * 100)
      : 0;

    const gradeInfo = this.determineGrade(percentage);

    // Deduplicate recommendations
    const uniqueRecommendations = [];
    const seenTexts = new Set();
    this.results.recommendations.forEach(rec => {
      if (!seenTexts.has(rec.text)) {
        seenTexts.add(rec.text);
        uniqueRecommendations.push(rec);
      }
    });

    return {
      score: this.results.score,
      maxScore: this.results.maxScore,
      percentage: Math.max(0, Math.min(100, percentage)),
      grade: gradeInfo.label,
      gradeClass: gradeInfo.class,
      gradeDescription: this.getGradeDescription(gradeInfo.label),
      violations: this.results.violations,
      recommendations: uniqueRecommendations,
      categoryBreakdown: this.results.categoryBreakdown
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
      'Перфектна усогласеност': `Кај ${this.companyName} постои перфектна и целосна усогласеност со сите проверени области.`,
      'Одлична усогласеност': `Кај ${this.companyName} постои одлична усогласеност. Идентификувани се само мали пропусти.`,
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
 * Get 20 random questions from all categories
 */
async function getQuestions(req, res) {
  try {
    const questions = getRandomQuestions(20);

    // Format questions for frontend (simplified, no category grouping)
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      article: q.article,
      type: q.type,
      options: q.options,
      sourceCategory: q.sourceCategory,
      sourceCategoryName: q.sourceCategoryName,
      sourceCategoryIcon: q.sourceCategoryIcon,
      sourceCategoryColor: q.sourceCategoryColor
    }));

    res.json({
      success: true,
      data: {
        questions: formattedQuestions,
        totalPool: poolStats.total,
        poolBreakdown: poolStats.byCategory
      }
    });
  } catch (error) {
    console.error('Error fetching general questions:', error);
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
    const { answers, companySize, questionIds } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Мора да одговорите на барем едно прашање'
      });
    }

    if (!questionIds || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Недостасуваат информации за прашањата'
      });
    }

    // Retrieve the exact questions that were answered
    const { getQuestionsByIds, allQuestions } = require('../../data/lhc/generalQuestionsPool');

    // Find questions by their IDs from the full pool
    const questions = questionIds.map(id =>
      allQuestions.find(q => q.id === id)
    ).filter(Boolean);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Не можат да се пронајдат прашањата'
      });
    }

    // Evaluate using hybrid engine
    const evaluator = new GeneralComplianceEvaluator(companySize, companyName);
    const report = evaluator.evaluate(answers, questions);

    // Save to database
    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'general',
      answers,
      companySize,
      selectedQuestionIds: questionIds,
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating general compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при евалуација на усогласеноста'
    });
  }
}

/**
 * Get user's assessment history for general LHC
 */
async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'general' })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    res.json({ success: true, data: assessments });
  } catch (error) {
    console.error('Error fetching general history:', error);
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
    console.error('Error fetching general assessment:', error);
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
