// Employment Part 2: Работно место и заштита (Workplace and Worker Protection)
// Categories: protection, termination, payment
// 18 questions total

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
  // ===== ЗАШТИТА НА ЛИЧНОСТА И ПРАВАТА НА РАБОТНИКОТ (q27-q29) =====
  {
    id: 'q27',
    category: 'protection',
    text: 'Дали работодавачот преземал мерки за заштита на достоинството на работникот при вршење на работата?',
    article: 'Член 9-а од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се преземат конкретни мерки за заштита на достоинството на работниците.'
  },
  {
    id: 'q28',
    category: 'protection',
    text: 'Дали работодавачот има донесено посебен акт за заштита од малтретирање при работа (мобинг)?',
    article: 'Член 9-в од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се донесе посебен акт за заштита од малтретирање при работа.'
  },
  {
    id: 'q29',
    category: 'protection',
    text: 'Дали работодавачот има назначено лице задолжено за спречување на малтретирање при работа?',
    article: 'Член 9-в од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се назначи лице задолжено за спречување на малтретирање.'
  },

  // ===== ПРЕСТАНОК НА РАБОТНИОТ ОДНОС (q34-q44) =====
  {
    id: 'q34',
    category: 'termination',
    text: 'Дали работодавачот може едностарно да го раскине договорот за вработување без отказ и без надомест?',
    article: 'Член 81 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работодавачот не смее едностарно да го раскине договорот без законска основа, отказен рок и образложение.'
  },
  {
    id: 'q35',
    category: 'termination',
    text: 'Дали на работникот му е доставено писмено образложение при отказ на договорот за вработување?',
    article: 'Член 83 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Секој отказ мора да биде писмен, образложен и доставен до работникот.'
  },
  {
    id: 'q36',
    category: 'termination',
    text: 'Дали отказот на договорот за вработување е доставен лично на работникот или препорачано по пошта?',
    article: 'Член 83 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Отказот мора да биде доставен лично или препорачано по пошта со потврда за прием.'
  },
  {
    id: 'q37',
    category: 'termination',
    text: 'Дали работникот има право на отказен рок?',
    article: 'Член 82 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот мора да има законски отказен рок.'
  },
  {
    id: 'q38',
    category: 'termination',
    text: 'Дали работникот има право на надомест за време на отказниот рок?',
    article: 'Член 82 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на плата за време на отказниот рок.'
  },
  {
    id: 'q39',
    category: 'termination',
    text: 'Дали работодавачот може да го откаже договорот поради неспособност на работникот?',
    article: 'Член 79 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Отказот поради неспособност мора да биде оправдан со објективни причини.'
  },
  {
    id: 'q40',
    category: 'termination',
    text: 'Дали работодавачот може да го откаже договорот поради повреда на работната обврска?',
    article: 'Член 78 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Отказот поради повреда мора да биде оправдан со докази.'
  },
  {
    id: 'q41',
    category: 'termination',
    text: 'Дали работникот има право на севкупна отпремнина?',
    article: 'Член 94 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на отпремнина согласно законот.'
  },
  {
    id: 'q42',
    category: 'termination',
    text: 'Дали работникот може да го откаже договорот без отказен рок поради повреда на работодавачот?',
    article: 'Член 87 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работникот има право на итен отказ доколку работодавачот ги повредува обврските.'
  },
  {
    id: 'q43',
    category: 'termination',
    text: 'Дали работникот може да бара обештетување за штета доколку отказот е незаконит?',
    article: 'Член 101 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на обештетување за незаконит отказ.'
  },
  {
    id: 'q44',
    category: 'termination',
    text: 'Дали работодавачот може да го откаже договорот за време на бременост или породилно отсуство?',
    article: 'Член 89 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Забранет е отказ за време на бременост и породилно отсуство.'
  },

  // ===== ПЛАЌАЊЕ НА РАБОТА (q45-q48) =====
  {
    id: 'q45',
    category: 'payment',
    text: 'Дали работникот прима плата најмалку еднаш месечно?',
    article: 'Член 105 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Платата мора да се исплатува редовно, најмалку еднаш месечно.'
  },
  {
    id: 'q46',
    category: 'payment',
    text: 'Дали плата се исплатува најдоцна до 15-ти во месецот за претходниот месец?',
    article: 'Член 106 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Обезбедете платата да се исплатува до 15-ти во месецот за претходниот месец.'
  },
  {
    id: 'q47',
    category: 'payment',
    text: 'Дали работникот прима писмена потврда (платен лист) за исплатената плата?',
    article: 'Член 107 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Потребно е да се врачува платен лист на секој работник при исплата на плата.'
  },
  {
    id: 'q48',
    category: 'payment',
    text: 'Дали се исплаќа надомест за прекувремена работа?',
    article: 'Член 119 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се исплаќа соодветен надомест за прекувремена работа.'
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
  protection: 'Заштита на личноста и правата на работникот',
  termination: 'Престанок на работниот однос',
  payment: 'Плаќање на работа'
};

module.exports = {
  questions,
  sanctions,
  gradeConfig,
  categoryNames,
  ANSWER_TYPES,
  SANCTION_LEVELS
};
