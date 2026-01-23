// General LHC Questions Pool - Aggregates all questions from all categories
// Општ Правен Здравствен Преглед - Случајни 20 прашања од сите области

const employmentData = require('./employmentQuestionsComplete');
const gdprQuestions = require('./gdprQuestionsComplete');
const healthAndSafetyQuestions = require('./healthAndSafetyQuestionsComplete');

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

  return 'medium';
};

// Extract and enrich employment questions (84 questions)
const employmentQuestions = employmentData.questions.map(q => ({
  ...q,
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

// Extract and enrich GDPR questions (39 questions)
const gdprQuestionsEnriched = gdprQuestions.map(q => ({
  ...q,
  sourceCategory: SOURCE_CATEGORIES.GDPR.id,
  sourceCategoryName: SOURCE_CATEGORIES.GDPR.name,
  sourceCategoryIcon: SOURCE_CATEGORIES.GDPR.icon,
  sourceCategoryColor: SOURCE_CATEGORIES.GDPR.color,
  normalizedSanctionLevel: normalizeSanctionLevel(q.sanctionLevel, 'gdpr')
}));

// Extract and enrich Health & Safety questions (46 questions)
const healthSafetyQuestionsEnriched = healthAndSafetyQuestions.map(q => ({
  ...q,
  sourceCategory: SOURCE_CATEGORIES.HEALTH_SAFETY.id,
  sourceCategoryName: SOURCE_CATEGORIES.HEALTH_SAFETY.name,
  sourceCategoryIcon: SOURCE_CATEGORIES.HEALTH_SAFETY.icon,
  sourceCategoryColor: SOURCE_CATEGORIES.HEALTH_SAFETY.color,
  normalizedSanctionLevel: normalizeSanctionLevel(q.sanctionLevel, 'health-safety')
}));

// All questions pool (169 total)
const allQuestions = [
  ...employmentQuestions,
  ...gdprQuestionsEnriched,
  ...healthSafetyQuestionsEnriched
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
    return allQuestions.find(q => q.id === id && questionIds.includes(q.id));
  }).filter(Boolean);
}

// Statistics about the question pool
const poolStats = {
  total: allQuestions.length,
  byCategory: {
    employment: employmentQuestions.length,
    gdpr: gdprQuestionsEnriched.length,
    'health-safety': healthSafetyQuestionsEnriched.length
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
