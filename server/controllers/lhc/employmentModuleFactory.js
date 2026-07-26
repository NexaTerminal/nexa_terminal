// Factory for the Employment Part 1–4 controllers. They share identical scoring
// logic (yes_no + choice, company-size sanctions) and differ only in their data
// module, persisted category key, and descriptive wording. Each thin controller
// calls createEmploymentModule() with its specifics.

const { scoreModule } = require('./lhcScoring');

const EMPLOYMENT_SEVERITY = { sanction1: 'high', sanction2: 'medium', none: 'none' };

function createEmploymentModule({ data, categoryKey, categoryTitle, sectorPhrase }) {
  const { questions, sanctions, categoryNames } = data;

  function describeBand(band, companyName, criticalCount) {
    const map = {
      4: `Кај ${companyName} постои висока усогласеност ${sectorPhrase}.`,
      3: `Кај ${companyName} постои задоволителна усогласеност ${sectorPhrase}, но има простор за подобрување.`,
      2: `Кај ${companyName} постои делумна усогласеност ${sectorPhrase}. Постојат значителни пропусти што треба да се отстранат.`,
      1: `Кај ${companyName} постои ниска усогласеност ${sectorPhrase}. При евентуална инспекција може да има сериозни последици.`
    };
    let base = map[band] || map[1];
    if (criticalCount > 0) base += ` Забележани се ${criticalCount} приоритетни ризици што бараат итно постапување.`;
    return base;
  }

  // Map canonical severity → the legacy sanction bucket used for penalty amounts.
  const sanctionBucket = (q) => {
    if (q.sanctionLevel) return q.sanctionLevel;
    const sev = q.severity;
    if (sev === 'high' || sev === 'critical') return 'sanction1';
    if (sev === 'medium') return 'sanction2';
    return 'none';
  };

  function evaluate(answers, companySize, companyName) {
    // Company size may come from the profiling question (EPROF-01) or the request.
    const size = (answers && answers['EPROF-01']) || companySize || 'micro';
    const sizeSanctions = sanctions[size] || sanctions.micro;
    return scoreModule({
      moduleId: categoryKey,
      questions,
      answers,
      companyName,
      config: {
        // Prefer explicit per-question severity (a/b/c/d modules); else map sanctionLevel.
        severityOf: q => q.severity || EMPLOYMENT_SEVERITY[q.sanctionLevel] || 'medium',
        isCritical: q => q.critical === true,
        categoryTitleOf: q => categoryNames[q.category] || q.category,
        legalRefOf: q => q.article,
        remediationOf: q => q.recommendation,
        sanctionHintOf: q => {
          const bucket = sanctionBucket(q);
          if (bucket === 'none') return '';
          const s = sizeSanctions && sizeSanctions[bucket];
          return s ? `Можна санкција: ${s.employer} за работодавачот и ${s.responsible} за одговорното лице.` : '';
        },
        describeBand
      }
    });
  }

  async function getQuestions(req, res) {
    try {
      const profiling = questions
        .filter(q => q.type === 'profiling')
        .map(q => ({ id: q.id, type: q.type, profilingType: q.profilingType, flag: q.flag || null, text: q.text, helpText: q.helpText || null, options: q.options }));

      const groupedByCategory = questions.reduce((acc, q) => {
        if (q.type === 'profiling') return acc;
        if (!acc[q.category]) acc[q.category] = { id: q.category, name: categoryNames[q.category], questions: [] };
        acc[q.category].questions.push({
          id: q.id, category: q.category, text: q.text, helpText: q.helpText || null,
          article: q.article, legalBasis: q.article, type: q.type, weight: q.weight,
          critical: !!q.critical, applicability: q.applicability || null, options: q.options
        });
        return acc;
      }, {});

      res.json({ success: true, data: { profiling, categories: Object.values(groupedByCategory) } });
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ success: false, message: 'Грешка при преземање на прашањата' });
    }
  }

  async function evaluateCompliance(req, res) {
    try {
      const { answers, companySize } = req.body;
      const userId = req.user._id;
      const companyName = req.user.companyInfo?.companyName || 'вашата компанија';

      if (!answers || Object.keys(answers).length === 0) {
        return res.status(400).json({ success: false, message: 'Мора да одговорите на барем едно прашање' });
      }

      const report = evaluate(answers, companySize || 'micro', companyName);

      const db = req.app.locals.db;
      const assessment = {
        userId,
        category: categoryKey,
        categoryTitle,
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
      res.status(500).json({ success: false, message: 'Грешка при евалуација на усогласеноста' });
    }
  }

  async function getAssessmentHistory(req, res) {
    try {
      const db = req.app.locals.db;
      const assessments = await db.collection('lhcAssessments')
        .find({ userId: req.user._id, category: categoryKey })
        .sort({ createdAt: -1 }).limit(10).toArray();
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
      const assessment = await db.collection('lhcAssessments')
        .findOne({ _id: new ObjectId(req.params.id), userId: req.user._id });
      if (!assessment) return res.status(404).json({ success: false, message: 'Проценката не е пронајдена' });
      res.json({ success: true, data: assessment });
    } catch (error) {
      console.error('Error fetching assessment:', error);
      res.status(500).json({ success: false, message: 'Грешка при преземање на проценката' });
    }
  }

  return { getQuestions, evaluateCompliance, getAssessmentHistory, getAssessmentById, evaluate };
}

module.exports = { createEmploymentModule };
