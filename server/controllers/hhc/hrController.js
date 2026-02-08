const {
  questions,
  categories,
  categoryNames,
  gradeConfig,
  categoryRecommendations,
  categoryMaxPoints
} = require('../../data/hhc/hrQuestions');

/**
 * HR Health Check Evaluator
 * Scoring: A=1, B=2, C=3, D=4 points per question
 * Max score: 80 points (20 questions)
 */
class HRHealthCheckEvaluator {
  constructor(companyName) {
    this.companyName = companyName;
    this.results = {
      totalScore: 0,
      maxScore: 80,
      categoryScores: {},
      recommendations: []
    };
  }

  evaluate(answers) {
    // Initialize category scores
    Object.values(categories).forEach(cat => {
      this.results.categoryScores[cat] = {
        score: 0,
        maxScore: categoryMaxPoints[cat],
        percentage: 0,
        level: 'low'
      };
    });

    // Calculate scores per question
    questions.forEach(question => {
      const answer = answers[question.id];
      if (!answer) return;

      const selectedOption = question.options.find(opt => opt.value === answer);
      if (!selectedOption) return;

      const points = selectedOption.points;
      this.results.totalScore += points;
      this.results.categoryScores[question.category].score += points;
    });

    // Calculate percentages and levels for each category
    Object.keys(this.results.categoryScores).forEach(cat => {
      const catData = this.results.categoryScores[cat];
      catData.percentage = Math.round((catData.score / catData.maxScore) * 100);
      catData.level = this.getCategoryLevel(catData.percentage);
      catData.name = categoryNames[cat];
    });

    // Generate recommendations based on category scores
    this.generateRecommendations();

    return this.generateReport();
  }

  getCategoryLevel(percentage) {
    if (percentage < 40) return 'low';
    if (percentage < 80) return 'medium';
    return 'high';
  }

  generateRecommendations() {
    Object.entries(this.results.categoryScores).forEach(([cat, data]) => {
      const recs = categoryRecommendations[cat];
      if (!recs) return;

      const relevantRecs = recs[data.level] || [];
      relevantRecs.forEach(rec => {
        this.results.recommendations.push({
          category: categoryNames[cat],
          categoryKey: cat,
          recommendation: rec,
          priority: data.level === 'low' ? 'high' : data.level === 'medium' ? 'medium' : 'low'
        });
      });
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.results.recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  determineGrade(score) {
    for (const [key, config] of Object.entries(gradeConfig)) {
      if (score >= config.min && score <= config.max) {
        return {
          key,
          label: config.label,
          emoji: config.emoji,
          description: config.description
        };
      }
    }
    return gradeConfig.critical;
  }

  generateReport() {
    const percentage = Math.round((this.results.totalScore / this.results.maxScore) * 100);
    const grade = this.determineGrade(this.results.totalScore);

    // Generate description with company name
    const gradeDescription = grade.description.replace('Фирмата', `${this.companyName}`);

    return {
      score: this.results.totalScore,
      maxScore: this.results.maxScore,
      percentage,
      grade: grade.label,
      gradeEmoji: grade.emoji,
      gradeKey: grade.key,
      gradeDescription,
      categoryScores: this.results.categoryScores,
      recommendations: this.results.recommendations
    };
  }
}

/**
 * Get HR Health Check questions grouped by category
 */
async function getQuestions(req, res) {
  try {
    const groupedByCategory = questions.reduce((acc, q) => {
      const category = q.category;
      if (!acc[category]) {
        acc[category] = {
          key: category,
          name: categoryNames[category],
          maxPoints: categoryMaxPoints[category],
          questions: []
        };
      }
      acc[category].questions.push({
        id: q.id,
        text: q.text,
        options: q.options.map(opt => ({
          value: opt.value,
          text: opt.text
        }))
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        categories: Object.values(groupedByCategory),
        totalQuestions: questions.length,
        maxScore: 80
      }
    });
  } catch (error) {
    console.error('Error fetching HR questions:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при преземање на прашањата'
    });
  }
}

/**
 * Evaluate HR Health Check based on answers
 */
async function evaluateCompliance(req, res) {
  try {
    const { answers } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'Вашата фирма';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Мора да одговорите на барем едно прашање'
      });
    }

    // Evaluate using the HR Health Check engine
    const evaluator = new HRHealthCheckEvaluator(companyName);
    const report = evaluator.evaluate(answers);

    // Save to database
    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'hr_operational',
      answers,
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('hhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating HR health check:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при евалуација на проценката'
    });
  }
}

/**
 * Get user's HR assessment history
 */
async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('hhcAssessments')
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    res.json({ success: true, data: assessments });
  } catch (error) {
    console.error('Error fetching HR history:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при преземање на историјата'
    });
  }
}

/**
 * Get specific HR assessment by ID
 */
async function getAssessmentById(req, res) {
  try {
    const { ObjectId } = require('mongodb');
    const db = req.app.locals.db;
    const assessment = await db
      .collection('hhcAssessments')
      .findOne({ _id: new ObjectId(req.params.id), userId: req.user._id });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Проценката не е пронајдена'
      });
    }

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error fetching HR assessment:', error);
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
