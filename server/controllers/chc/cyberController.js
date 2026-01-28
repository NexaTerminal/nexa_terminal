/**
 * Cyber Security Health Check Controller
 *
 * Handles evaluation of cyber security assessments with industry-aware scoring.
 * Returns qualitative maturity levels without showing numeric scores to users.
 */

const { ObjectId } = require('mongodb');
const {
  INDUSTRIES,
  INDUSTRY_WEIGHTS,
  CATEGORIES,
  CATEGORY_LABELS,
  maturityLevels
} = require('../../data/chc/cyberQuestions');

/**
 * Cyber Security Evaluator Class
 * Calculates scores with industry-specific weights
 */
class CyberEvaluator {
  constructor(answers, industry) {
    this.answers = answers;
    this.industry = industry;
    this.categoryScores = {};
    this.categoryDetails = {};
  }

  /**
   * Main evaluation method
   */
  evaluate() {
    // Calculate score for each category
    CATEGORIES.forEach(category => {
      const categoryResult = this.evaluateCategory(category);
      this.categoryScores[category.id] = categoryResult.score;
      this.categoryDetails[category.id] = categoryResult;
    });

    // Calculate weighted overall score
    const overallScore = this.calculateWeightedScore();

    // Determine maturity level
    const maturity = this.determineMaturityLevel(overallScore);

    // Analyze strengths and weaknesses
    const { strengths, weaknesses } = this.analyzeStrengthsWeaknesses();

    // Generate improvement suggestions
    const improvements = this.generateImprovements();

    // Generate category analysis for report
    const categoryAnalysis = this.generateCategoryAnalysis();

    // Generate overall assessment text
    const overallAssessment = this.generateOverallAssessment(maturity, strengths, weaknesses);

    // Generate conclusion
    const conclusion = this.generateConclusion(maturity);

    return {
      maturityLevel: maturity.label,
      maturityClass: maturity.class,
      maturityDescription: maturity.description,
      overallAssessment,
      strengths,
      weaknesses,
      improvements,
      categoryAnalysis,
      conclusion,
      // Internal score not exposed to user
      _internalScore: overallScore
    };
  }

  /**
   * Evaluate a single category
   */
  evaluateCategory(category) {
    let totalScore = 0;
    let maxScore = 0;
    let answeredQuestions = 0;
    const questionResults = [];

    category.questions.forEach(question => {
      const answer = this.answers[question.id];
      if (answer !== undefined) {
        answeredQuestions++;
        let questionScore = 0;

        if (question.type === 'choice') {
          const selectedOption = question.options.find(opt => opt.value === answer);
          if (selectedOption) {
            questionScore = selectedOption.score;
          }
        } else if (question.type === 'scale') {
          // Scale 1-10 converted to 0-100
          questionScore = ((parseInt(answer) - 1) / 9) * 100;
        }

        totalScore += questionScore;
        maxScore += 100;
        questionResults.push({
          questionId: question.id,
          score: questionScore,
          answer
        });
      }
    });

    const categoryScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      score: categoryScore,
      answeredQuestions,
      totalQuestions: category.questions.length,
      questionResults
    };
  }

  /**
   * Calculate weighted overall score based on industry
   */
  calculateWeightedScore() {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.keys(this.categoryScores).forEach(categoryId => {
      const weight = INDUSTRY_WEIGHTS[categoryId]?.[this.industry] || 1.0;
      weightedSum += this.categoryScores[categoryId] * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Determine maturity level based on score
   */
  determineMaturityLevel(score) {
    const levels = Object.values(maturityLevels).sort((a, b) => b.threshold - a.threshold);
    for (const level of levels) {
      if (score >= level.threshold) {
        return level;
      }
    }
    return maturityLevels.critical;
  }

  /**
   * Analyze strengths and weaknesses
   */
  analyzeStrengthsWeaknesses() {
    const strengths = [];
    const weaknesses = [];

    // Analyze each category
    Object.keys(this.categoryScores).forEach(categoryId => {
      const score = this.categoryScores[categoryId];
      const weight = INDUSTRY_WEIGHTS[categoryId]?.[this.industry] || 1.0;

      if (score >= 75) {
        // This is a strength
        const strengthMessages = this.getStrengthMessages(categoryId, score);
        if (strengthMessages) {
          strengths.push(strengthMessages);
        }
      } else if (score < 50) {
        // This is a weakness
        const weaknessMessages = this.getWeaknessMessages(categoryId, score);
        if (weaknessMessages) {
          // Prioritize based on industry weight
          weaknesses.push({
            message: weaknessMessages,
            priority: weight,
            categoryId
          });
        }
      }
    });

    // Sort weaknesses by priority and take top ones
    weaknesses.sort((a, b) => b.priority - a.priority);

    return {
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 4).map(w => w.message)
    };
  }

  /**
   * Get strength message for category
   */
  getStrengthMessages(categoryId, score) {
    const messages = {
      device_security: 'Добра заштита на работните уреди со ажурирани системи и антивирус софтвер.',
      data_protection: 'Солидна пракса за заштита и бекап на податоци.',
      network_security: 'Мрежната инфраструктура е добро заштитена.',
      email_phishing: 'Добра свесност и заштита од фишинг и е-пошта измами.',
      access_auth: 'Силни политики за автентикација и контрола на пристап.',
      employee_training: 'Вработените се добро обучени за сајбер безбедност.',
      incident_management: 'Постојат добри процедури за управување со инциденти.',
      physical_security: 'Физичката безбедност на просториите и опремата е на добро ниво.',
      compliance_policies: 'Безбедносните политики се добро дефинирани и имплементирани.'
    };
    return messages[categoryId];
  }

  /**
   * Get weakness message for category
   */
  getWeaknessMessages(categoryId, score) {
    const messages = {
      device_security: 'Потребно е подобрување на заштитата на работните уреди (антивирус, ажурирања).',
      data_protection: 'Заштитата и бекапот на податоците бара итно внимание.',
      network_security: 'Мрежната безбедност има значителни пропусти.',
      email_phishing: 'Потребна е подобра заштита од фишинг и е-пошта измами.',
      access_auth: 'Политиките за лозинки и автентикација треба да се зајакнат.',
      employee_training: 'Недостасува обука на вработените за сајбер безбедност.',
      incident_management: 'Немате адекватни процедури за управување со безбедносни инциденти.',
      physical_security: 'Физичката безбедност на просториите треба да се подобри.',
      compliance_policies: 'Потребно е да се формализираат безбедносните политики.'
    };
    return messages[categoryId];
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovements() {
    const improvements = [];
    const weight = INDUSTRY_WEIGHTS;

    // Sort categories by score (lowest first) and industry relevance
    const sortedCategories = Object.keys(this.categoryScores)
      .map(categoryId => ({
        categoryId,
        score: this.categoryScores[categoryId],
        weight: weight[categoryId]?.[this.industry] || 1.0
      }))
      .filter(cat => cat.score < 75)
      .sort((a, b) => {
        // Prioritize by combination of low score and high industry relevance
        const priorityA = (100 - a.score) * a.weight;
        const priorityB = (100 - b.score) * b.weight;
        return priorityB - priorityA;
      });

    // Generate suggestions for top categories needing improvement
    sortedCategories.slice(0, 5).forEach(cat => {
      const suggestion = this.getImprovementSuggestion(cat.categoryId, cat.score);
      if (suggestion) {
        improvements.push({
          area: CATEGORY_LABELS[cat.categoryId],
          suggestion,
          priority: cat.weight > 1.1 ? 'висок' : 'нормален'
        });
      }
    });

    return improvements;
  }

  /**
   * Get improvement suggestion for category
   */
  getImprovementSuggestion(categoryId, score) {
    const suggestions = {
      device_security: score < 30
        ? 'Итно инсталирајте антивирус софтвер на сите уреди и овозможете автоматско ажурирање на системите. Воведете политика за заклучување на екраните.'
        : 'Направете евиденција на сите работни уреди и осигурајте дека сите имаат ажуриран антивирус и редовни системски ажурирања.',

      data_protection: score < 30
        ? 'Итно воспоставете систем за редовен бекап на критичните податоци. Препорачуваме дневен бекап со копија во cloud.'
        : 'Тестирајте ги редовно бекапите за да бидете сигурни дека можат да се вратат. Разгледајте енкрипција на чувствителните податоци.',

      network_security: score < 30
        ? 'Веднаш сменете ја WiFi лозинката со силна комбинација и проверете дали користите WPA2/WPA3 енкрипција. Одделете ја мрежата за гости.'
        : 'Разгледајте воведување на VPN за работа од далечина и редовно менувајте ги мрежните лозинки.',

      email_phishing: score < 30
        ? 'Организирајте итна обука за препознавање на фишинг напади. Воведете процедура за пријавување на сомнителни е-пошти.'
        : 'Надградете ја е-пошта заштитата со напредно филтрирање на спам и малициозни прилози. Спроведувајте симулации на фишинг.',

      access_auth: score < 30
        ? 'Итно воведете двофакторска автентикација (2FA) за сите критични системи и воспоставете политика за силни лозинки.'
        : 'Воспоставете процедура за деактивација на сметки при заминување на вработени и елиминирајте го делењето на лозинки.',

      employee_training: score < 30
        ? 'Организирајте основна обука за сајбер безбедност за сите вработени. Ова е критично за заштита на компанијата.'
        : 'Воведете редовни обуки и известувања за нови безбедносни закани. Осигурајте дека сите знаат како да пријават инцидент.',

      incident_management: score < 30
        ? 'Подгответе основен план за одговор на сајбер напади. Определете одговорно лице и контакт за итни случаи.'
        : 'Документирајте ги сите безбедносни инциденти и редовно ревидирајте го планот за одговор.',

      physical_security: score < 30
        ? 'Обезбедете ги серверите и мрежната опрема во заклучена просторија. Воведете евиденција на посетители.'
        : 'Подобрете ја контролата на пристап и процедурите за безбедно уништување на стари дискови и документи.',

      compliance_policies: score < 30
        ? 'Напишете основна политика за сајбер безбедност и политика за прифатливо користење на ИТ ресурси. Проверете ја усогласеноста со ЗЗЛП.'
        : 'Ревидирајте ги постоечките политики и осигурајте дека сите вработени се запознаени со нив.'
    };

    return suggestions[categoryId];
  }

  /**
   * Generate category analysis for report
   */
  generateCategoryAnalysis() {
    return CATEGORIES.map(category => {
      const score = this.categoryScores[category.id];
      const weight = INDUSTRY_WEIGHTS[category.id]?.[this.industry] || 1.0;

      let level;
      if (score >= 80) level = 'добро';
      else if (score >= 60) level = 'умерено';
      else if (score >= 40) level = 'слабо';
      else level = 'критично';

      return {
        category: CATEGORY_LABELS[category.id],
        level,
        industryRelevance: weight > 1.1 ? 'висока' : weight < 0.9 ? 'ниска' : 'стандардна'
      };
    });
  }

  /**
   * Generate overall assessment text
   */
  generateOverallAssessment(maturity, strengths, weaknesses) {
    const industryName = INDUSTRIES[this.industry]?.name || 'вашата индустрија';

    let assessment = `Анализата на сајбер безбедноста на вашата компанија во контекст на ${industryName} `;

    if (maturity.class === 'excellent' || maturity.class === 'strong') {
      assessment += `покажува ${maturity.label.toLowerCase()}. Вашата организација има воспоставено добри безбедносни практики.`;
    } else if (maturity.class === 'good') {
      assessment += `покажува солидна безбедносна основа со простор за подобрување во одредени области.`;
    } else if (maturity.class === 'moderate') {
      assessment += `идентификува основна безбедносна заштита, но постојат значителни области кои бараат внимание.`;
    } else {
      assessment += `идентификува критични безбедносни пропусти кои бараат итно внимание за да се заштити компанијата од потенцијални закани.`;
    }

    if (strengths.length > 0) {
      assessment += ` Позитивно е што имате добри практики во областа на ${strengths[0].toLowerCase().replace(/\.$/, '')}.`;
    }

    if (weaknesses.length > 0) {
      assessment += ` Приоритетно треба да се адресира: ${weaknesses[0].toLowerCase().replace(/\.$/, '')}.`;
    }

    return assessment;
  }

  /**
   * Generate conclusion
   */
  generateConclusion(maturity) {
    const conclusions = {
      excellent: 'Вашата компанија покажува одлична посветеност на сајбер безбедноста. Продолжете со редовно ревидирање на политиките, следење на новите закани и континуирана едукација на тимот. Размислете за добивање на безбедносна сертификација.',
      strong: 'Имате напредни безбедносни практики кои ве штитат од повеќето закани. Фокусирајте се на идентификуваните области за подобрување и редовно тестирајте ги вашите одбранбени механизми.',
      good: 'Солидната безбедносна основа е добар темел. Сега е време да ги адресирате идентификуваните слабости и да воведете понапредни заштитни мерки, особено во областите кои се критични за вашата индустрија.',
      moderate: 'Имате основна заштита, но постојат значителни ризици. Препорачуваме да приоритизирате инвестиции во сајбер безбедност, започнувајќи со критичните области идентификувани во овој извештај.',
      low: 'Вашата компанија е изложена на значителен ризик од сајбер напади. Итно преземете акција за имплементација на основните безбедносни мерки, посебно бекап на податоци, антивирус заштита и обука на вработените.',
      critical: 'ИТНО: Вашата компанија има критични безбедносни пропусти кои ја прават ранлива на напади. Препорачуваме да ангажирате ИТ специјалист или безбедносна компанија за итна проценка и имплементација на основни заштитни мерки.'
    };

    return conclusions[maturity.class] || conclusions.moderate;
  }
}

// Controller methods
const cyberController = {
  /**
   * Get list of industries
   */
  getIndustries: async (req, res) => {
    try {
      const industriesList = Object.values(INDUSTRIES);
      res.json({ success: true, data: industriesList });
    } catch (error) {
      console.error('Error getting industries:', error);
      res.status(500).json({ success: false, message: 'Грешка при преземање на индустриите' });
    }
  },

  /**
   * Get questions for specific industry
   */
  getQuestions: async (req, res) => {
    try {
      const { industry } = req.query;

      if (!industry || !INDUSTRIES[industry]) {
        return res.status(400).json({
          success: false,
          message: 'Невалидна индустрија'
        });
      }

      // Prepare questions with industry relevance markers
      const categories = CATEGORIES.map(category => {
        const weight = INDUSTRY_WEIGHTS[category.id]?.[industry] || 1.0;

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          industryRelevance: weight > 1.1 ? 'high' : weight < 0.9 ? 'low' : 'normal',
          questions: category.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options?.map(opt => ({
              value: opt.value,
              text: opt.text
            })),
            scaleDescription: q.scaleDescription,
            isHighlyRelevant: weight > 1.1
          }))
        };
      });

      res.json({
        success: true,
        data: {
          industry: INDUSTRIES[industry],
          categories,
          totalQuestions: categories.reduce((sum, cat) => sum + cat.questions.length, 0)
        }
      });
    } catch (error) {
      console.error('Error getting questions:', error);
      res.status(500).json({ success: false, message: 'Грешка при преземање на прашањата' });
    }
  },

  /**
   * Evaluate cyber security assessment
   */
  evaluateMarketing: async (req, res) => {
    try {
      const { answers, industry } = req.body;
      const userId = req.user._id;
      const companyName = req.user.companyInfo?.companyName || 'Непознато';
      const companyInfo = req.user.companyInfo || {};

      if (!answers || !industry) {
        return res.status(400).json({
          success: false,
          message: 'Недостасуваат податоци за проценка'
        });
      }

      if (!INDUSTRIES[industry]) {
        return res.status(400).json({
          success: false,
          message: 'Невалидна индустрија'
        });
      }

      // Evaluate the assessment
      const evaluator = new CyberEvaluator(answers, industry);
      const result = evaluator.evaluate();

      // Get database from app.locals
      const db = req.app.locals.db;

      // Prepare assessment document
      const assessment = {
        userId,
        category: 'cyber_security',
        companyName,
        industry,
        industryName: INDUSTRIES[industry].name,
        companyInfo: {
          name: companyInfo.companyName,
          address: companyInfo.address,
          manager: companyInfo.manager
        },
        answers,
        ...result,
        createdAt: new Date(),
        type: 'cyber_health_check'
      };

      // Save to database
      const insertResult = await db.collection('chcAssessments').insertOne(assessment);
      assessment._id = insertResult.insertedId;

      res.json({
        success: true,
        data: assessment
      });
    } catch (error) {
      console.error('Error evaluating cyber assessment:', error);
      res.status(500).json({ success: false, message: 'Грешка при проценка' });
    }
  },

  /**
   * Get user's assessment history
   */
  getAssessmentHistory: async (req, res) => {
    try {
      const db = req.app.locals.db;

      const assessments = await db.collection('chcAssessments')
        .find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      res.json({ success: true, data: assessments });
    } catch (error) {
      console.error('Error getting assessment history:', error);
      res.status(500).json({ success: false, message: 'Грешка при преземање на историјата' });
    }
  },

  /**
   * Get specific assessment by ID
   */
  getAssessmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;

      const assessment = await db.collection('chcAssessments').findOne({
        _id: new ObjectId(id),
        userId: req.user._id
      });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Проценката не е пронајдена'
        });
      }

      res.json({ success: true, data: assessment });
    } catch (error) {
      console.error('Error getting assessment:', error);
      res.status(500).json({ success: false, message: 'Грешка при преземање на проценката' });
    }
  }
};

module.exports = cyberController;
