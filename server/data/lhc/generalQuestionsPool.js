// General LHC Questions Pool - Aggregates all questions from all categories
// Општ Правен Здравствен Преглед - Случајни 20 прашања од сите области

const employmentData = require('./employmentQuestionsComplete');
const gdprQuestions = require('./gdprQuestionsComplete');
const healthAndSafetyQuestions = require('./healthAndSafetyQuestionsComplete');
const archivesQuestions = require('./archivesQuestionsComplete');

// Source category metadata
const SOURCE_CATEGORIES = {
  EMPLOYMENT: {
    id: 'employment',
    name: 'Работни односи',
    icon: '👔',
    color: '#3B82F6'
  },
  GDPR: {
    id: 'gdpr',
    name: 'Лични податоци',
    icon: '🔒',
    color: '#8B5CF6'
  },
  HEALTH_SAFETY: {
    id: 'health-safety',
    name: 'Безбедност и здравје',
    icon: '🦺',
    color: '#10B981'
  },
  ARCHIVES: {
    id: 'archives',
    name: 'Архивско работење',
    icon: '🗄️',
    color: '#D97706'
  }
};

// Normalize sanction levels across categories
const normalizeSanctionLevel = (sanctionLevel, sourceCategory) => {
  // Employment uses: sanction1 (HIGH), sanction2 (MEDIUM), none
  // GDPR uses: high, medium, low, none
  // Health & Safety uses: sanction3 (HIGH), sanction2 (MEDIUM), sanction1 (LOW), none

  if (sanctionLevel === 'none') return 'none';

  if (sourceCategory === 'employment') {
    if (sanctionLevel === 'sanction1') return 'high';
    if (sanctionLevel === 'sanction2') return 'medium';
    return 'low';
  }

  if (sourceCategory === 'gdpr') {
    return sanctionLevel; // Already uses high/medium/low/none
  }

  if (sourceCategory === 'health-safety') {
    if (sanctionLevel === 'sanction3') return 'high';
    if (sanctionLevel === 'sanction2') return 'medium';
    if (sanctionLevel === 'sanction1') return 'low';
    return 'none';
  }

  if (sourceCategory === 'archives') {
    return sanctionLevel; // Already uses high/medium/low/none
  }

  return 'medium';
};

// Readable MK category labels for Archives (mirrors archivesController)
const ARCHIVES_CATEGORY_LABELS = {
  applicability:         'Применливост',
  acts_lists:            'Основни акти: план и листи',
  office_evidence:       'Писарница и дневна евиденција',
  archive_storage:       'Архива и услови за чување',
  electronic_docs:       'Електронски документи',
  selection_destruction: 'Одбирање и уништување',
  disposition_cessation: 'Располагање и престанок',
  supervision_readiness: 'Надзор и подготвеност'
};

// Extract and enrich employment questions - prefix IDs to avoid collisions
const employmentQuestions = employmentData.questions.map(q => ({
  ...q,
  id: `emp_${q.id}`,
  originalId: q.id,
  sourceCategory: SOURCE_CATEGORIES.EMPLOYMENT.id,
  sourceCategoryName: SOURCE_CATEGORIES.EMPLOYMENT.name,
  sourceCategoryIcon: SOURCE_CATEGORIES.EMPLOYMENT.icon,
  sourceCategoryColor: SOURCE_CATEGORIES.EMPLOYMENT.color,
  normalizedSanctionLevel: normalizeSanctionLevel(q.sanctionLevel, 'employment'),
  originalSanctions: employmentData.sanctions,
  originalAnswerTypes: employmentData.ANSWER_TYPES,
  originalSanctionLevels: employmentData.SANCTION_LEVELS,
  originalCategoryNames: employmentData.categoryNames
}));

// GDPR questions now use a graduated a/b/c/d maturity schema (see
// gdprQuestionsComplete.js). The General pool + its evaluator/frontend only
// understand yes_no/choice/multi_check, so we adapt each a/b/c/d question into a
// `choice` question here: options a/b/c/d become choices, and the fully-compliant
// option (a) is the correct one. Profiling questions are excluded from the pool.
const GDPR_CATEGORY_LABELS = {
  data_mapping: 'Евиденција и мапирање', principles: 'Начела на обработка',
  legal_basis: 'Правен основ', transparency: 'Транспарентност', data_subject_rights: 'Права на субјектите',
  employees: 'Работни односи', security: 'Безбедност', dpo: 'Офицер за заштита',
  breach: 'Нарушување на безбедноста', records: 'Евиденција на активности', processors: 'Обработувачи',
  transfers: 'Пренос во трети земји', website_cookies: 'Веб и колачиња', video_surveillance: 'Видеонадзор',
  direct_marketing: 'Директен маркетинг', dpia: 'Проценка на влијание (ПВЗЛП)', training: 'Обука и свест'
};

const deriveGdprSanctionLevel = (q) => {
  if (q.critical || q.weight >= 4) return 'high';
  if (q.weight >= 3) return 'medium';
  return 'low';
};

const adaptGdprQuestion = (q) => {
  const scorableOptions = (q.options || []).filter(o => o.points !== null && o.points !== undefined);
  return {
    id: `gdpr_${q.id}`,
    originalId: q.id,
    text: q.text,
    article: q.legalBasis,
    type: 'choice',
    options: scorableOptions.map(o => ({
      value: o.key,
      label: o.label,
      isCorrect: o.points === 3 // fully-implemented (a) counts as compliant
    })),
    weight: q.weight || 3,
    sanctionLevel: deriveGdprSanctionLevel(q),
    recommendation: q.remediation,
    category: GDPR_CATEGORY_LABELS[q.category] || q.category,
    sourceCategory: SOURCE_CATEGORIES.GDPR.id,
    sourceCategoryName: SOURCE_CATEGORIES.GDPR.name,
    sourceCategoryIcon: SOURCE_CATEGORIES.GDPR.icon,
    sourceCategoryColor: SOURCE_CATEGORIES.GDPR.color,
    normalizedSanctionLevel: normalizeSanctionLevel(deriveGdprSanctionLevel(q), 'gdpr')
  };
};

const gdprQuestionsEnriched = gdprQuestions
  .filter(q => q.type !== 'profiling')
  .map(adaptGdprQuestion);

// Health & Safety now uses the a/b/c/d maturity schema. As with GDPR, adapt each
// scored a/b/c/d question into a `choice` for the general pool (option a = correct);
// profiling and scale_1_10 questions are excluded from the random pool.
const HS_CATEGORY_LABELS = {
  bzr_risk_statement: 'Изјава за безбедност', bzr_experts: 'Стручно лице и медицина на трудот',
  bzr_health: 'Здравствени прегледи', bzr_training: 'Обука и информирање',
  bzr_representatives: 'Претставници', bzr_emergency: 'Прва помош и евакуација',
  bzr_equipment: 'Опрема за работа', bzr_environment: 'Работна средина',
  bzr_ppe: 'Лична заштитна опрема', bzr_signs_workplace: 'Знаци и работен простор',
  bzr_screens: 'Работа со екрани', bzr_vulnerable: 'Бремени и млади работници',
  bzr_records: 'Евиденции', bzr_reporting: 'Пријавување и инспекција'
};
const deriveHsSanctionLevel = (q) => ((q.critical || q.severity === 'high') ? 'high' : (q.severity === 'medium' ? 'medium' : 'low'));
const adaptHealthQuestion = (q) => {
  const scorable = (q.options || []).filter(o => o.points !== null && o.points !== undefined);
  return {
    id: `hs_${q.id}`,
    originalId: q.id,
    text: q.text,
    article: q.legalRef,
    type: 'choice',
    options: scorable.map(o => ({ value: o.key, label: o.label, isCorrect: o.points === 3 })),
    weight: q.weight || 3,
    sanctionLevel: deriveHsSanctionLevel(q),
    recommendation: q.recommendation,
    category: HS_CATEGORY_LABELS[q.category] || q.category,
    sourceCategory: SOURCE_CATEGORIES.HEALTH_SAFETY.id,
    sourceCategoryName: SOURCE_CATEGORIES.HEALTH_SAFETY.name,
    sourceCategoryIcon: SOURCE_CATEGORIES.HEALTH_SAFETY.icon,
    sourceCategoryColor: SOURCE_CATEGORIES.HEALTH_SAFETY.color,
    normalizedSanctionLevel: deriveHsSanctionLevel(q)
  };
};
const healthSafetyQuestionsEnriched = healthAndSafetyQuestions
  .filter(q => q.type === 'abcd')
  .map(adaptHealthQuestion);

// Archives now uses the a/b/c/d maturity schema — adapt to `choice` for the pool
// (option a = correct); profiling questions are excluded.
const deriveArcSanctionLevel = (q) => ((q.critical || q.severity === 'high') ? 'high' : (q.severity === 'medium' ? 'medium' : 'low'));
const adaptArchivesQuestion = (q) => {
  const scorable = (q.options || []).filter(o => o.points !== null && o.points !== undefined);
  return {
    id: `arc_${q.id}`,
    originalId: q.id,
    text: q.text,
    article: q.legalRef,
    type: 'choice',
    options: scorable.map(o => ({ value: o.key, label: o.label, isCorrect: o.points === 3 })),
    weight: q.weight || 3,
    sanctionLevel: deriveArcSanctionLevel(q),
    recommendation: q.recommendation,
    category: ARCHIVES_CATEGORY_LABELS[q.category] || q.category,
    sourceCategory: SOURCE_CATEGORIES.ARCHIVES.id,
    sourceCategoryName: SOURCE_CATEGORIES.ARCHIVES.name,
    sourceCategoryIcon: SOURCE_CATEGORIES.ARCHIVES.icon,
    sourceCategoryColor: SOURCE_CATEGORIES.ARCHIVES.color,
    normalizedSanctionLevel: deriveArcSanctionLevel(q)
  };
};
const archivesQuestionsEnriched = archivesQuestions
  .filter(q => q.type === 'abcd')
  .map(adaptArchivesQuestion);

// All questions pool (all modules combined)
const allQuestions = [
  ...employmentQuestions,
  ...gdprQuestionsEnriched,
  ...healthSafetyQuestionsEnriched,
  ...archivesQuestionsEnriched
];

// Fisher-Yates shuffle algorithm for true randomness
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random questions from the pool
 * @param {number} count - Number of questions to select (default 20)
 * @returns {Array} Array of randomly selected questions
 */
function getRandomQuestions(count = 20) {
  const shuffled = shuffleArray(allQuestions);
  return shuffled.slice(0, Math.min(count, allQuestions.length));
}

/**
 * Get questions by specific IDs (for retaking same test)
 * @param {Array} questionIds - Array of question IDs to retrieve
 * @returns {Array} Array of questions matching the IDs
 */
function getQuestionsByIds(questionIds) {
  return questionIds.map(id => {
    return allQuestions.find(q => q.id === id);
  }).filter(Boolean);
}

// Statistics about the question pool
const poolStats = {
  total: allQuestions.length,
  byCategory: {
    employment: employmentQuestions.length,
    gdpr: gdprQuestionsEnriched.length,
    'health-safety': healthSafetyQuestionsEnriched.length,
    archives: archivesQuestionsEnriched.length
  }
};

module.exports = {
  allQuestions,
  getRandomQuestions,
  getQuestionsByIds,
  SOURCE_CATEGORIES,
  poolStats,
  normalizeSanctionLevel
};
