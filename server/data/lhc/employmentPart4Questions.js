// Employment Part 4: Посебна заштита (Special Protection)
// Categories: special_protection
// 7 questions total

const ANSWER_TYPES = {
  YES_NO: 'yes_no',
  CHOICE: 'choice',
  MULTI_CHECK: 'multi_check'
};

const SANCTION_LEVELS = {
  HIGH: 'sanction1',
  MEDIUM: 'sanction2',
  NONE: 'none'
};

const questions = [
  // ===== ПОСЕБНА ЗАШТИТА (q78-q84) =====
  {
    id: 'q78',
    category: 'special_protection',
    text: 'Дали на бремена работничка и се доделува работа која е полесна или соодветна на нејзината состојба?',
    article: 'Член 163 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'На бремена работничка мора да и се обезбеди полесна работа или работа соодветна на нејзината состојба.'
  },
  {
    id: 'q79',
    category: 'special_protection',
    text: 'Дали на работничката која дои дете се дозволува платена пауза од еден и пол час дневно?',
    article: 'Член 164 став 4 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'На работничката која дои дете мора да и се даде платена пауза од еден и пол час дневно.'
  },
  {
    id: 'q80',
    category: 'special_protection',
    text: 'Дали бремена работничка може да работи ноќе?',
    article: 'Член 162 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Бремена работничка не смее да работи ноќе.'
  },
  {
    id: 'q81',
    category: 'special_protection',
    text: 'Дали бремена работничка може да работи прекувремено?',
    article: 'Член 162 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Бремена работничка не смее да работи прекувремено.'
  },
  {
    id: 'q82',
    category: 'special_protection',
    text: 'Дали работничката има право на отсуство поради бременост и раѓање?',
    article: 'Член 165 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работничката има право на породилно отсуство согласно законот.'
  },
  {
    id: 'q83',
    category: 'special_protection',
    text: 'Дали за евентуалното прекувремено или ноќно работење на работник/работничка која има дете до седум години, задолжително се прибавува писмена согласност?',
    article: 'Член 164 став 4 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Не смее да се задава прекувремена работа или работа ноќе на работник кој има дете помладо од седум години без негова/нејзина писмена согласност.'
  },
  {
    id: 'q84',
    category: 'special_protection',
    text: 'Дали работникот со намалена работна способност има право на соодветно работно место?',
    article: 'Член 175 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работодавачот мора да обезбеди соодветно работно место за работник со намалена работна способност.'
  }
];

// Company size-based sanctions
const sanctions = {
  micro: {
    sanction1: { employer: '500-1.000 евра', responsible: '250 евра' },
    sanction2: { employer: '200-400 евра', responsible: '100 евра' }
  },
  small: {
    sanction1: { employer: '500-1.000 евра', responsible: '250 евра' },
    sanction2: { employer: '200-400 евра', responsible: '100 евра' }
  },
  medium: {
    sanction1: { employer: '1.000-2.000 евра', responsible: '400 евра' },
    sanction2: { employer: '300-600 евра', responsible: '250 евра' }
  },
  large: {
    sanction1: { employer: '2.000-3.000 евра', responsible: '500 евра' },
    sanction2: { employer: '600-1.000 евра', responsible: '350 евра' }
  }
};

// Grade thresholds
const gradeConfig = {
  perfect: { min: 100, label: 'Перфектна усогласеност', class: 'perfect' },
  excellent: { min: 80, label: 'Одлична усогласеност', class: 'excellent' },
  veryGood: { min: 70, label: 'Задоволителна усогласеност', class: 'verygood' },
  good: { min: 60, label: 'Определена усогласеност', class: 'good' },
  average: { min: 50, label: 'Делумна усогласеност', class: 'average' },
  low: { min: 40, label: 'Ниска усогласеност', class: 'low' },
  veryLow: { min: 0, label: 'Исклучително ниска усогласеност', class: 'verylow' }
};

// Category display names
const categoryNames = {
  special_protection: 'Посебна заштита (бременост и родителство)'
};

module.exports = {
  questions,
  sanctions,
  gradeConfig,
  categoryNames,
  ANSWER_TYPES,
  SANCTION_LEVELS
};
