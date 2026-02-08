// Employment Part 4: Посебна заштита (Special Protection)
const { questions, sanctions, gradeConfig, categoryNames, ANSWER_TYPES, SANCTION_LEVELS } = require('../../data/lhc/employmentPart4Questions');

class ComplianceEvaluator {
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
      if (!answer || answer === 'not_applicable') return;

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
    if (question.type === ANSWER_TYPES.CHOICE) {
      return this.evaluateChoiceQuestion(question, answer);
    }
    return this.evaluateYesNoQuestion(question, answer);
  }

  evaluateYesNoQuestion(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel } = question;
    let score = 0;
    let isCompliant = false;
    let message = '';

    switch (answer) {
      case 'yes':
        if (correctAnswer === 'yes') {
          score = weight;
          isCompliant = true;
          message = `✓ Постапувате во согласност со ${article}.`;
        } else {
          score = -weight;
          message = `✗ Постапувањето е спротивно на ${article}.${this.getSanctionText(sanctionLevel)}`;
        }
        break;

      case 'no':
        if (correctAnswer === 'no') {
          score = weight;
          isCompliant = true;
          message = `✓ Постапувате во согласност со ${article}.`;
        } else {
          score = -weight;
          message = `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(sanctionLevel)}`;
        }
        break;

      case 'partially':
        score = -(weight * 0.5);
        message = `⚠ Делумно постапување спротивно на ${article}.${this.getSanctionText(sanctionLevel)}`;
        break;
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
      : `✗ Постапувањето не е во согласност со ${question.article}.${this.getSanctionText(question.sanctionLevel)}`;

    return { score, isCompliant: isCorrect, message };
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
      recommendations: [...new Set(this.results.recommendations)]
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
      'Перфектна усогласеност': `Кај ${this.companyName} постои перфектна усогласеност во делот на посебна заштита (бременост и родителство).`,
      'Одлична усогласеност': `Кај ${this.companyName} постои одлична усогласеност во делот на посебна заштита (бременост и родителство).`,
      'Задоволителна усогласеност': `Кај ${this.companyName} постои задоволителна усогласеност во делот на посебна заштита.`,
      'Определена усогласеност': `Кај ${this.companyName} постои определена усогласеност во делот на посебна заштита.`,
      'Делумна усогласеност': `Кај ${this.companyName} постои делумна усогласеност во делот на посебна заштита.`,
      'Ниска усогласеност': `Кај ${this.companyName} постои ниска усогласеност во делот на посебна заштита.`,
      'Исклучително ниска усогласеност': `Кај ${this.companyName} постои исклучително ниска усогласеност во делот на посебна заштита. Ова е особено сериозно поради уставната заштита на бременоста и родителството.`
    };

    return descriptions[grade] || 'Не може да се одреди оценка.';
  }
}

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

    const evaluator = new ComplianceEvaluator(companySize, companyName);
    const report = evaluator.evaluate(answers);

    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'employment_part4',
      categoryTitle: 'Работни односи: Посебна заштита',
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

async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'employment_part4' })
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
