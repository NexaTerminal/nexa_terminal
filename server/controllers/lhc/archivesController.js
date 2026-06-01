const questions = require('../../data/lhc/archivesQuestionsComplete');

// Sanction configuration — Archives Law (135/2025) + Office/Archival Instruction (99/2014).
// Standard private companies (Член 30, not "од посебен интерес") face inspector orders
// with fix deadlines, not direct fines. "От посебен интерес" entities + serious breaches
// fall under Член 59.
const sanctions = {
  high: 'Иматели „од посебен интерес": правно лице 500–1.000 €, одговорно лице 150–300 € (Член 59). За стандардните иматели — итна инспекциска наредба со рок и прекршочна изложеност при неизвршување.',
  medium: 'Инспекциска наредба со рок 7–15 дена за основните акти или до 12 месеци за други недостатоци (Член 56, 57). Прекршочна постапка при неизвршување на наредбата.',
  low: 'Препорака за усогласување со Упатството; ризик од забелешка при инспекциски надзор.',
  none: 'Без директна казна — препорачано како добра пракса.'
};

// Grade configuration (same bands as other LHC modules)
const gradeConfig = {
  perfect: { min: 100, label: 'Перфектна усогласеност', class: 'perfect' },
  excellent: { min: 80, label: 'Одлична усогласеност', class: 'excellent' },
  veryGood: { min: 70, label: 'Задоволителна усогласеност', class: 'verygood' },
  good: { min: 60, label: 'Определена усогласеност', class: 'good' },
  average: { min: 50, label: 'Делумна усогласеност', class: 'average' },
  low: { min: 40, label: 'Ниска усогласеност', class: 'low' },
  veryLow: { min: 0, label: 'Исклучително ниска усогласеност', class: 'verylow' }
};

// Category labels in MK
const categoryNames = {
  applicability:           'Применливост',
  acts_lists:              'Основни акти: план и листи',
  office_evidence:         'Писарница и дневна евиденција',
  archive_storage:         'Архива и услови за чување',
  electronic_docs:         'Електронски документи',
  selection_destruction:   'Одбирање и уништување',
  disposition_cessation:   'Располагање и престанок',
  supervision_readiness:   'Надзор и подготвеност'
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
 * Archives Law Compliance Evaluator
 */
class ArchivesEvaluator {
  constructor(companyName) {
    this.companyName = companyName;
    this.results = {
      score: 0,
      maxScore: 0,
      violations: [],
      allFindings: [],
      recommendations: []
    };
  }

  getAnswerLabel(question, answer) {
    if (question.type === ANSWER_TYPES.CHOICE) {
      const option = question.options.find(opt => opt.value === answer);
      return option ? option.label : answer;
    }
    const labels = { yes: 'Да', no: 'Не', partial: 'Делумно', partially: 'Делумно', not_applicable: 'Не е применливо', na: 'Не е применливо' };
    return labels[answer] || answer;
  }

  evaluate(answers) {
    questions.forEach(question => {
      const answer = answers[question.id];
      if (!answer || answer === 'na') return;

      this.results.maxScore += question.weight;
      const finding = this.evaluateQuestion(question, answer);

      const findingRecord = {
        question: question.text,
        answer: this.getAnswerLabel(question, answer),
        article: question.article,
        category: categoryNames[question.category],
        finding: finding.message,
        severity: question.sanctionLevel,
        isCompliant: finding.isCompliant
      };
      this.results.allFindings.push(findingRecord);

      if (!finding.isCompliant) {
        this.results.violations.push({
          question: question.text,
          article: question.article,
          category: categoryNames[question.category],
          finding: finding.message,
          severity: question.sanctionLevel
        });
        if (question.recommendation) this.results.recommendations.push(question.recommendation);
      }

      this.results.score += finding.score;
    });

    return this.generateReport(answers);
  }

  evaluateQuestion(question, answer) {
    switch (question.type) {
      case ANSWER_TYPES.YES_NO:        return this.evaluateYesNo(question, answer);
      case ANSWER_TYPES.YES_NO_NA:     return this.evaluateYesNoNA(question, answer);
      case ANSWER_TYPES.YES_PARTIAL_NO: return this.evaluateYesPartialNo(question, answer);
      case ANSWER_TYPES.CHOICE:        return this.evaluateChoice(question, answer);
      default: return { score: 0, isCompliant: false, message: 'Невалиден тип на прашање' };
    }
  }

  evaluateYesNo(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel } = question;
    if (answer === correctAnswer) {
      return { score: weight, isCompliant: true, message: `✓ Постапувате во согласност со ${article}.` };
    }
    return { score: -weight, isCompliant: false, message: `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(sanctionLevel)}` };
  }

  evaluateYesNoNA(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel } = question;
    if (answer === correctAnswer) {
      return { score: weight, isCompliant: true, message: `✓ Постапувате во согласност со ${article}.` };
    }
    if (answer === 'na') {
      return { score: 0, isCompliant: true, message: 'Не е применливо' };
    }
    return { score: -weight, isCompliant: false, message: `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(sanctionLevel)}` };
  }

  evaluateYesPartialNo(question, answer) {
    const { correctAnswer, weight, article, sanctionLevel } = question;
    if (answer === correctAnswer || answer === 'yes') {
      return { score: weight, isCompliant: true, message: `✓ Постапувате во согласност со ${article}.` };
    }
    if (answer === 'partial' || answer === 'partially') {
      return { score: -(weight * 0.5), isCompliant: false, message: `⚠ Делумно постапување спротивно на ${article}.${this.getSanctionText(sanctionLevel)}` };
    }
    return { score: -weight, isCompliant: false, message: `✗ Постапувањето не е во согласност со ${article}.${this.getSanctionText(sanctionLevel)}` };
  }

  evaluateChoice(question, answer) {
    const selectedOption = question.options.find(opt => opt.value === answer);
    if (!selectedOption) return { score: 0, isCompliant: false, message: 'Невалиден одговор' };
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
    return ` Можна санкција: ${sanction}`;
  }

  /**
   * Red-flag override: a failed HIGH-sanction question forces "Висок ризик"
   * regardless of overall percentage (matches the user's spec).
   */
  hasRedFlagViolation(answers) {
    return questions.some(q => {
      if (q.sanctionLevel !== SANCTION_LEVELS.HIGH) return false;
      const ans = answers[q.id];
      if (!ans || ans === 'na') return false;
      if (q.type === ANSWER_TYPES.YES_PARTIAL_NO) return ans === 'no';
      if (q.type === ANSWER_TYPES.YES_NO_NA || q.type === ANSWER_TYPES.YES_NO) return ans !== q.correctAnswer;
      if (q.type === ANSWER_TYPES.CHOICE) {
        const sel = q.options.find(o => o.value === ans);
        return sel ? !sel.isCorrect : false;
      }
      return false;
    });
  }

  generateReport(answers) {
    const percentage = this.results.maxScore > 0
      ? Math.round((this.results.score / this.results.maxScore) * 100)
      : 0;

    let gradeInfo = this.determineGrade(percentage);
    // Red-flag override → force the lowest band.
    if (this.hasRedFlagViolation(answers)) {
      gradeInfo = gradeConfig.veryLow;
    }

    return {
      score: this.results.score,
      maxScore: this.results.maxScore,
      percentage: Math.max(0, Math.min(100, percentage)),
      grade: gradeInfo.label,
      gradeClass: gradeInfo.class,
      gradeDescription: this.getGradeDescription(gradeInfo.label),
      violations: this.results.violations,
      allFindings: this.results.allFindings,
      recommendations: [...new Set(this.results.recommendations)],
      redFlagTriggered: this.hasRedFlagViolation(answers)
    };
  }

  determineGrade(percentage) {
    for (const grade of Object.values(gradeConfig)) {
      if (percentage >= grade.min) return grade;
    }
    return gradeConfig.veryLow;
  }

  getGradeDescription(grade) {
    const c = this.companyName;
    const descriptions = {
      'Перфектна усогласеност':         `Кај ${c} постои перфектна усогласеност со Законот за архивски материјал и Упатството за канцелариско работење.`,
      'Одлична усогласеност':           `Кај ${c} постои одлична усогласеност. Идентификувани се одредени пропусти кои треба да се отстранат.`,
      'Задоволителна усогласеност':     `Кај ${c} постои задоволителна усогласеност, но има простор за подобрување.`,
      'Определена усогласеност':        `Кај ${c} постои определена усогласеност; неколку практики треба да се подобрат пред 1 јуни 2026.`,
      'Делумна усогласеност':           `Кај ${c} постои делумна усогласеност. Постојат значајни пропусти кои треба итно да се отстранат.`,
      'Ниска усогласеност':             `Кај ${c} постои ниска усогласеност. Основните обврски недостасуваат и инспекцискиот ризик е реален.`,
      'Исклучително ниска усогласеност': `Кај ${c} постои исклучително ниска усогласеност или активирана е црвена линија (небезбедно чување, уништување трајна архива, отстапување кон странство или спречување надзор).`
    };
    return descriptions[grade] || 'Не може да се одреди оценка.';
  }
}

/**
 * Get Archives questions grouped by category
 */
async function getQuestions(req, res) {
  try {
    const groupedByCategory = questions.reduce((acc, q) => {
      const category = q.category;
      if (!acc[category]) acc[category] = { name: categoryNames[category], questions: [] };
      acc[category].questions.push({
        id: q.id,
        text: q.text,
        article: q.article,
        type: q.type,
        options: q.options
      });
      return acc;
    }, {});
    res.json({ success: true, data: { categories: Object.values(groupedByCategory) } });
  } catch (error) {
    console.error('Error fetching Archives questions:', error);
    res.status(500).json({ success: false, message: 'Грешка при преземање на прашањата' });
  }
}

/**
 * Evaluate Archives compliance based on answers
 */
async function evaluateCompliance(req, res) {
  try {
    const { answers } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ success: false, message: 'Мора да одговорите на барем едно прашање' });
    }

    const evaluator = new ArchivesEvaluator(companyName);
    const report = evaluator.evaluate(answers);

    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'archives',
      answers,
      ...report,
      createdAt: new Date()
    };
    const result = await db.collection('lhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating Archives compliance:', error);
    res.status(500).json({ success: false, message: 'Грешка при евалуација на усогласеноста' });
  }
}

async function getAssessmentHistory(req, res) {
  try {
    const db = req.app.locals.db;
    const assessments = await db
      .collection('lhcAssessments')
      .find({ userId: req.user._id, category: 'archives' })
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
  getAssessmentById
};
