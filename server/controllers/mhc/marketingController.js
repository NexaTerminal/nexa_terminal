const { questions, INDUSTRIES, INDUSTRY_WEIGHTS, categoryNames, maturityLevels, ANSWER_TYPES } = require('../../data/mhc/marketingQuestions');

/**
 * Marketing Health Check Evaluator
 * Industry-aware evaluation with qualitative assessment
 */
class MarketingEvaluator {
  constructor(industry, companyName, companyInfo) {
    this.industry = industry || 'other';
    this.companyName = companyName;
    this.companyInfo = companyInfo;
    this.categoryScores = {};
    this.maxCategoryScores = {};
  }

  /**
   * Main evaluation method
   */
  evaluate(answers) {
    let totalWeightedScore = 0;
    let totalMaxWeightedScore = 0;

    // Initialize category tracking
    Object.keys(categoryNames).forEach(cat => {
      this.categoryScores[cat] = 0;
      this.maxCategoryScores[cat] = 0;
    });

    // Evaluate each answered question
    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer === undefined || answer === null) return;

      const industryMultiplier = this.getIndustryMultiplier(question.category);
      const effectiveWeight = question.weight * industryMultiplier;

      let questionScore = 0;
      let maxQuestionScore = 4; // Max score for choice questions

      if (question.type === ANSWER_TYPES.CHOICE) {
        const selectedOption = question.options.find(opt => opt.value === answer);
        if (selectedOption) {
          questionScore = selectedOption.score;
        }
      } else if (question.type === ANSWER_TYPES.SCALE) {
        // Scale 1-10 mapped to 0-4 score
        const scaleValue = parseInt(answer, 10);
        if (scaleValue >= 1 && scaleValue <= 10) {
          questionScore = (scaleValue - 1) * (4 / 9); // Maps 1->0, 10->4
        }
      }

      // Apply weighted scores
      const weightedScore = questionScore * effectiveWeight;
      const weightedMax = maxQuestionScore * effectiveWeight;

      totalWeightedScore += weightedScore;
      totalMaxWeightedScore += weightedMax;

      // Track by category
      this.categoryScores[question.category] += weightedScore;
      this.maxCategoryScores[question.category] += weightedMax;
    });

    // Calculate overall percentage (internal use only)
    const percentage = totalMaxWeightedScore > 0
      ? (totalWeightedScore / totalMaxWeightedScore) * 100
      : 0;

    // Determine maturity level
    const maturityLevel = this.determineMaturityLevel(percentage);

    // Generate strengths and weaknesses
    const { strengths, weaknesses } = this.analyzeStrengthsWeaknesses(answers);

    // Generate improvement suggestions
    const improvements = this.generateImprovements(answers, weaknesses);

    // Generate overall assessment text
    const overallAssessment = this.generateOverallAssessment(maturityLevel, percentage);

    // Generate conclusion
    const conclusion = this.generateConclusion(maturityLevel, strengths.length, weaknesses.length);

    return {
      industry: this.industry,
      industryName: INDUSTRIES[this.industry]?.name || 'Друго',
      maturityLevel: maturityLevel.label,
      maturityClass: maturityLevel.class,
      maturityDescription: maturityLevel.description,
      overallAssessment,
      strengths,
      weaknesses,
      improvements,
      conclusion,
      categoryAnalysis: this.generateCategoryAnalysis(),
      // Internal data (not shown directly to user but stored)
      _internal: {
        percentage: Math.round(percentage),
        totalScore: Math.round(totalWeightedScore * 10) / 10,
        maxScore: Math.round(totalMaxWeightedScore * 10) / 10
      }
    };
  }

  /**
   * Get industry multiplier for a category
   */
  getIndustryMultiplier(category) {
    const weights = INDUSTRY_WEIGHTS[category];
    if (!weights) return 1.0;
    return weights[this.industry] || 1.0;
  }

  /**
   * Determine maturity level based on percentage
   */
  determineMaturityLevel(percentage) {
    const levels = Object.values(maturityLevels).sort((a, b) => b.threshold - a.threshold);
    for (const level of levels) {
      if (percentage >= level.threshold) {
        return level;
      }
    }
    return maturityLevels.veryLow;
  }

  /**
   * Analyze strengths and weaknesses based on answers
   */
  analyzeStrengthsWeaknesses(answers) {
    const strengths = [];
    const weaknesses = [];

    // Category analysis
    Object.keys(categoryNames).forEach(category => {
      const score = this.categoryScores[category];
      const maxScore = this.maxCategoryScores[category];

      if (maxScore === 0) return; // No questions answered in this category

      const categoryPercentage = (score / maxScore) * 100;
      const industryMultiplier = this.getIndustryMultiplier(category);
      const isRelevant = industryMultiplier >= 0.8; // Only report on relevant categories

      if (categoryPercentage >= 70 && isRelevant) {
        strengths.push(this.generateStrengthText(category, categoryPercentage));
      } else if (categoryPercentage < 40 && isRelevant) {
        weaknesses.push(this.generateWeaknessText(category, categoryPercentage));
      } else if (categoryPercentage < 55 && industryMultiplier >= 1.1) {
        // High-relevance category with moderate score is a weakness
        weaknesses.push(this.generateWeaknessText(category, categoryPercentage));
      }
    });

    // Specific answer-based insights
    this.addSpecificInsights(answers, strengths, weaknesses);

    // Limit to 4 each
    return {
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 4)
    };
  }

  /**
   * Generate strength text for a category
   */
  generateStrengthText(category, percentage) {
    const templates = {
      strategy: 'Компанијата покажува солидна основа во стратешкото планирање и поставување цели за маркетинг активностите.',
      brand: 'Визуелниот идентитет и брендирањето се на добро ниво, со конзистентна презентација.',
      website: 'Онлајн присуството преку веб-страницата е добро поставено и функционално.',
      social_media: 'Активноста на социјалните мрежи е на задоволително ниво со редовно присуство.',
      content: 'Креирањето содржина е добро организирано со фокус на потребите на клиентите.',
      trust_signals: 'Елементите за градење доверба (препораки, референци) се добро искористени.',
      b2b_channels: 'B2B каналите и деловните односи се активно одржувани.',
      local_presence: 'Локалното присуство и видливост се на добро ниво.',
      execution: 'Извршувањето на маркетинг активностите е систематско со јасна одговорност.'
    };
    return templates[category] || `Добри перформанси во областа ${categoryNames[category]}.`;
  }

  /**
   * Generate weakness text for a category
   */
  generateWeaknessText(category, percentage) {
    const industryContext = this.industry !== 'other'
      ? `Во контекст на ${INDUSTRIES[this.industry]?.name?.toLowerCase() || 'вашата'} индустрија, `
      : '';

    const templates = {
      strategy: `${industryContext}недостига јасна маркетинг стратегија и дефинирани цели за активностите.`,
      brand: `${industryContext}визуелниот идентитет и брендирањето бараат дополнително внимание за поголема препознатливост.`,
      website: `${industryContext}веб-присуството има простор за значително подобрување во функционалност и јасност.`,
      social_media: `${industryContext}активноста на социјалните мрежи е ограничена и бара посистематски пристап.`,
      content: `${industryContext}креирањето содржина е спорадично и без јасен план за вредност кон клиентите.`,
      trust_signals: `${industryContext}елементите за градење доверба (препораки, референци) се недоволно искористени.`,
      b2b_channels: `${industryContext}B2B каналите и деловните настани не се доволно активирани.`,
      local_presence: `${industryContext}локалната видливост и препознатливост имаат значителен простор за подобрување.`,
      execution: `${industryContext}извршувањето на маркетинг активностите е неструктурирано и без јасна одговорност.`
    };
    return templates[category] || `${industryContext}областа ${categoryNames[category]} бара подобрување.`;
  }

  /**
   * Add specific insights based on individual answers
   */
  addSpecificInsights(answers, strengths, weaknesses) {
    // Check for specific high-impact questions

    // Strategy: Clear goals (q1)
    if (answers.q1 === 'a') {
      if (!strengths.some(s => s.includes('стратегија') || s.includes('цели'))) {
        strengths.push('Компанијата има јасно дефинирани и мерливи маркетинг цели.');
      }
    }

    // Trust: Testimonials (q30)
    if (answers.q30 === 'a' && this.getIndustryMultiplier('trust_signals') >= 1.0) {
      if (!strengths.some(s => s.includes('препораки') || s.includes('доверба'))) {
        strengths.push('Јавните препораки и мислења од клиенти се добро искористени за градење доверба.');
      }
    }

    // Website clarity (q13)
    if (answers.q13 === 'd') {
      weaknesses.push('Отсуството на веб-страница е значителен недостаток за онлајн видливост и доверба.');
    }

    // No marketing responsibility (q41)
    if (answers.q41 === 'd') {
      weaknesses.push('Недостигот на јасна одговорност за маркетинг активности може да доведе до неконзистентност.');
    }

    // Industry-specific insights
    if (this.industry === 'services' && answers.q31 === 'd') {
      weaknesses.push('Како услужна компанија, јасната комуникација на процесот на соработка е критична за градење доверба.');
    }

    if ((this.industry === 'manufacturing' || this.industry === 'construction') && answers.q36 === 'd') {
      weaknesses.push('За вашата индустрија, професионалните материјали за деловни партнери се есенцијални.');
    }

    if ((this.industry === 'hospitality' || this.industry === 'retail') && answers.q38 === 'd') {
      weaknesses.push('Точните информации на Google Maps се критични за локален бизнис како вашиот.');
    }
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovements(answers, weaknesses) {
    const improvements = [];

    // Based on weaknesses and specific answers
    if (answers.q1 !== 'a') {
      improvements.push({
        area: 'Стратегија',
        suggestion: 'Дефинирајте јасни, мерливи маркетинг цели (на пр. број на нови клиенти, посети на веб, engagement) и редовно следете го напредокот.'
      });
    }

    if (answers.q13 === 'd' || answers.q13 === 'c') {
      improvements.push({
        area: 'Веб-присуство',
        suggestion: 'Подобрувањето на веб-страницата со јасна порака и лесен контакт може значително да ја зголеми довербата кај потенцијалните клиенти.'
      });
    }

    if (answers.q30 !== 'a' && this.getIndustryMultiplier('trust_signals') >= 1.0) {
      improvements.push({
        area: 'Доверба',
        suggestion: 'Систематското собирање и прикажување на препораки од задоволни клиенти може значително да влијае на одлуката на нови клиенти.'
      });
    }

    if (answers.q21 !== 'a' && this.getIndustryMultiplier('social_media') >= 0.9) {
      improvements.push({
        area: 'Социјални мрежи',
        suggestion: 'Креирајте едноставен план за содржина со 2-3 објави неделно на вашите најрелевантни платформи.'
      });
    }

    if (answers.q41 === 'c' || answers.q41 === 'd') {
      improvements.push({
        area: 'Извршување',
        suggestion: 'Доделете јасна одговорност за маркетинг активностите - дури и ако е дел од друга позиција, мора да има конкретно лице.'
      });
    }

    if (answers.q16 !== 'a' && this.getIndustryMultiplier('local_presence') >= 1.0) {
      improvements.push({
        area: 'Локална видливост',
        suggestion: 'Ажурирајте го Google My Business профилот со точни информации, работно време и фотографии.'
      });
    }

    if (this.industry === 'services' && answers.q32 !== 'a') {
      improvements.push({
        area: 'Референци',
        suggestion: 'Создадете 2-3 детални студии на случај (case studies) кои покажуваат конкретни резултати од вашата работа.'
      });
    }

    if ((this.industry === 'manufacturing' || this.industry === 'construction') && answers.q35 !== 'a') {
      improvements.push({
        area: 'B2B настани',
        suggestion: 'Планирајте учество на релевантни саеми и бизнис настани - директниот контакт е клучен за вашата индустрија.'
      });
    }

    // Return top 5 most relevant improvements
    return improvements.slice(0, 5);
  }

  /**
   * Generate category analysis for detailed view
   */
  generateCategoryAnalysis() {
    const analysis = [];

    Object.keys(categoryNames).forEach(category => {
      const score = this.categoryScores[category];
      const maxScore = this.maxCategoryScores[category];

      if (maxScore === 0) return;

      const percentage = (score / maxScore) * 100;
      const industryMultiplier = this.getIndustryMultiplier(category);

      let level;
      if (percentage >= 70) level = 'добро';
      else if (percentage >= 50) level = 'умерено';
      else if (percentage >= 30) level = 'слабо';
      else level = 'критично';

      analysis.push({
        category: categoryNames[category],
        categoryKey: category,
        level,
        industryRelevance: industryMultiplier >= 1.1 ? 'висока' : industryMultiplier >= 0.9 ? 'средна' : 'ниска'
      });
    });

    return analysis;
  }

  /**
   * Generate overall assessment paragraph
   */
  generateOverallAssessment(maturityLevel, percentage) {
    const industryName = INDUSTRIES[this.industry]?.name || 'вашата индустрија';

    let assessment = `Маркетинг анализата на ${this.companyName} во контекст на индустријата ${industryName} покажува `;

    if (percentage >= 75) {
      assessment += 'добро развиена маркетинг функција со воспоставени процеси и активности. ';
      assessment += 'Компанијата има солидна основа на која може да гради понатаму.';
    } else if (percentage >= 60) {
      assessment += 'солидна маркетинг основа со простор за оптимизација во одредени области. ';
      assessment += 'Постојат добри практики кои треба да се зајакнат и систематизираат.';
    } else if (percentage >= 45) {
      assessment += 'умерено развиен маркетинг со неколку јасни области за подобрување. ';
      assessment += 'Потребен е пофокусиран пристап за градење на стабилна маркетинг инфраструктура.';
    } else if (percentage >= 25) {
      assessment += 'базични маркетинг активности без јасна структура. ';
      assessment += 'Препорачуваме приоритизирање на основните елементи пред да се шири на повеќе канали.';
    } else {
      assessment += 'почетно ниво на маркетинг активности со значителен потенцијал за развој. ';
      assessment += 'Фокусирајте се прво на основите - јасна порака, основно онлајн присуство и елементи за градење доверба.';
    }

    return assessment;
  }

  /**
   * Generate conclusion paragraph
   */
  generateConclusion(maturityLevel, strengthsCount, weaknessesCount) {
    let conclusion = 'Овој извештај дава преглед на моменталната состојба на маркетинг активностите во вашата компанија. ';

    if (strengthsCount >= weaknessesCount && strengthsCount > 0) {
      conclusion += 'Идентификуваните силни страни треба да се задржат и надградат, ';
      conclusion += 'додека слабостите претставуваат можности за понатамошен развој. ';
    } else {
      conclusion += 'Идентификуваните области за подобрување претставуваат можности за значителен напредок. ';
      conclusion += 'Препорачуваме фокус на 2-3 приоритетни области наместо обид за промена на сè одеднаш. ';
    }

    conclusion += 'За понатамошна анализа и конкретен план за акција, размислете за консултација со маркетинг професионалец.';

    return conclusion;
  }
}

/**
 * Get industries list
 */
async function getIndustries(req, res) {
  try {
    res.json({
      success: true,
      data: Object.values(INDUSTRIES)
    });
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при преземање на индустриите'
    });
  }
}

/**
 * Get marketing questions grouped by category
 */
async function getQuestions(req, res) {
  try {
    const { industry } = req.query;

    // Group questions by category
    const groupedByCategory = questions.reduce((acc, q) => {
      const category = q.category;
      if (!acc[category]) {
        acc[category] = {
          name: categoryNames[category],
          questions: []
        };
      }

      // Calculate industry relevance for display hints
      const industryMultiplier = industry ? (INDUSTRY_WEIGHTS[category]?.[industry] || 1.0) : 1.0;

      acc[category].questions.push({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        scaleDescription: q.scaleDescription,
        // Don't expose weights, but can hint at relevance
        isHighlyRelevant: industryMultiplier >= 1.2
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        categories: Object.values(groupedByCategory),
        totalQuestions: questions.length
      }
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
 * Evaluate marketing health check
 */
async function evaluateMarketing(req, res) {
  try {
    const { answers, industry } = req.body;
    const userId = req.user._id;
    const companyName = req.user.companyInfo?.companyName || 'вашата компанија';
    const companyInfo = req.user.companyInfo || {};

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Мора да одговорите на барем едно прашање'
      });
    }

    if (!industry) {
      return res.status(400).json({
        success: false,
        message: 'Мора да изберете индустрија'
      });
    }

    // Evaluate using smart engine
    const evaluator = new MarketingEvaluator(industry, companyName, companyInfo);
    const report = evaluator.evaluate(answers);

    // Save to database
    const db = req.app.locals.db;
    const assessment = {
      userId,
      category: 'marketing',
      answers,
      industry,
      companyName,
      companyInfo: {
        name: companyInfo.companyName,
        address: companyInfo.address,
        manager: companyInfo.manager
      },
      ...report,
      createdAt: new Date()
    };

    const result = await db.collection('mhcAssessments').insertOne(assessment);
    assessment._id = result.insertedId;

    res.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error evaluating marketing:', error);
    res.status(500).json({
      success: false,
      message: 'Грешка при евалуација на маркетингот'
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
      .collection('mhcAssessments')
      .find({ userId: req.user._id })
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
      .collection('mhcAssessments')
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
  getIndustries,
  getQuestions,
  evaluateMarketing,
  getAssessmentHistory,
  getAssessmentById
};
