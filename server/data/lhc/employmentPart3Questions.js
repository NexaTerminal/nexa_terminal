// Employment Part 3: Работно време и одмор (Working Time and Rest)
// Categories: working_time, rest_breaks
// 29 questions total

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
  // ===== РАБОТНО ВРЕМЕ (q49-q63) =====
  {
    id: 'q49',
    category: 'working_time',
    text: 'Дали полното работно време на работникот изнесува 40 часа неделно?',
    article: 'Член 116 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Полното работно време мора да изнесува 40 часа неделно.'
  },
  {
    id: 'q50',
    category: 'working_time',
    text: 'Дали работникот може да работи прекувремено повеќе од 8 часа неделно?',
    article: 'Член 119 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Прекувременото работење е ограничено на максимум 8 часа неделно.'
  },
  {
    id: 'q51',
    category: 'working_time',
    text: 'Дали се води евиденција за работното време на вработените?',
    article: 'Член 117 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се води евиденција за работното време на сите вработени.'
  },
  {
    id: 'q52',
    category: 'working_time',
    text: 'Дали работникот може да работи повеќе од 12 часа дневно?',
    article: 'Член 118 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Дневното работно време не смее да надминува 12 часа.'
  },
  {
    id: 'q53',
    category: 'working_time',
    text: 'Дали работникот работи на недела или на државен празник?',
    article: 'Член 129 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no', text: 'Не', isCorrect: true },
      { value: 'with_consent', text: 'Да, со писмена согласност', isCorrect: true },
      { value: 'without_consent', text: 'Да, без согласност', isCorrect: false }
    ],
    recommendation: 'Работа на недела бара писмена согласност на работникот.'
  },
  {
    id: 'q54',
    category: 'working_time',
    text: 'Дали работникот добива зголемена плата за работа на недела или празник?',
    article: 'Член 129 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работата на недела и празник се компензира со зголемена плата.'
  },
  {
    id: 'q55',
    category: 'working_time',
    text: 'Дали работникот може да работи ноќе (од 22:00 до 6:00)?',
    article: 'Член 128 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Ноќна работа мора да биде соодветно надоместена.'
  },
  {
    id: 'q56',
    category: 'working_time',
    text: 'Дали работникот добива зголемена плата за ноќна работа?',
    article: 'Член 128 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Ноќната работа се компензира со зголемена плата.'
  },
  {
    id: 'q57',
    category: 'working_time',
    text: 'Дали работникот може да работи во смени?',
    article: 'Член 126 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работата во смени мора да биде уредена со распоред.'
  },
  {
    id: 'q58',
    category: 'working_time',
    text: 'Дали работникот има право на одмор од најмалку 12 часа меѓу две смени?',
    article: 'Член 126 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се обезбеди одмор од најмалку 12 часа меѓу две смени.'
  },
  {
    id: 'q59',
    category: 'working_time',
    text: 'Дали работникот може да работи повеќе од 48 часа просечно неделно во период од 4 месеци?',
    article: 'Член 119 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Просечното работно време не смее да надминува 48 часа неделно.'
  },
  {
    id: 'q60',
    category: 'working_time',
    text: 'Дали работникот има право на скратено работно време поради посебни услови на работа?',
    article: 'Член 122 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете скратено работно време за работници со посебни услови.'
  },
  {
    id: 'q61',
    category: 'working_time',
    text: 'Дали работникот може да работи на неколку работни места кај истиот работодавач?',
    article: 'Член 42 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Работата на неколку работни места мора да биде уредена со договор.'
  },
  {
    id: 'q62',
    category: 'working_time',
    text: 'Дали работникот има право на исплата на плата за време на боледување?',
    article: 'Член 93 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на надомест за време на боледување.'
  },
  {
    id: 'q63',
    category: 'working_time',
    text: 'Дали работодавачот води евиденција за прекувремената работа?',
    article: 'Член 117 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се води евиденција за прекувремената работа.'
  },

  // ===== ПАУЗИ И ОДМОРИЕ (q64-q77) =====
  {
    id: 'q64',
    category: 'rest_breaks',
    text: 'Дали работникот има право на дневна пауза од најмалку 30 минути?',
    article: 'Член 132 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете дневна пауза од најмалку 30 минути за сите работници.'
  },
  {
    id: 'q65',
    category: 'rest_breaks',
    text: 'Дали работникот има право на неделен одмор од најмалку 24 часа непрекинато?',
    article: 'Член 133 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се обезбеди неделен одмор од најмалку 24 часа.'
  },
  {
    id: 'q66',
    category: 'rest_breaks',
    text: 'Дали работникот остварува годишен одмор од најмалку 20 работни дена?',
    article: 'Член 138 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Годишниот одмор мора да биде најмалку 20 работни дена.'
  },
  {
    id: 'q67',
    category: 'rest_breaks',
    text: 'Дали работникот може да се откаже од правото на годишен одмор?',
    article: 'Член 141 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот не може да се откаже од годишниот одмор, ниту да прими парична компензација.'
  },
  {
    id: 'q68',
    category: 'rest_breaks',
    text: 'Дали работодавачот води евиденција за искористениот годишен одмор?',
    article: 'Член 140 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се води евиденција за годишниот одмор.'
  },
  {
    id: 'q69',
    category: 'rest_breaks',
    text: 'Дали работникот има право на зголемен годишен одмор (повеќе од 20 дена)?',
    article: 'Член 138 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Работникот може да има право на зголемен годишен одмор според колективен договор.'
  },
  {
    id: 'q70',
    category: 'rest_breaks',
    text: 'Дали работникот може да го користи годишниот одмор во два дела?',
    article: 'Член 139 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Годишниот одмор може да се користи во два дела.'
  },
  {
    id: 'q71',
    category: 'rest_breaks',
    text: 'Дали работникот има право на платено отсуство за семејни потреби?',
    article: 'Член 147 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работникот има право на платено отсуство за семејни потреби.'
  },
  {
    id: 'q72',
    category: 'rest_breaks',
    text: 'Дали работникот има право на неплатено отсуство?',
    article: 'Член 148 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Работникот може да побара неплатено отсуство.'
  },
  {
    id: 'q73',
    category: 'rest_breaks',
    text: 'Дали работникот има право на платено отсуство за стручно усовршување?',
    article: 'Член 143 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работникот има право на платено отсуство за стручно усовршување.'
  },
  {
    id: 'q74',
    category: 'rest_breaks',
    text: 'Дали работникот има право на годишен одмор и за периодот на боледување?',
    article: 'Член 138 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Боледувањето не ја намалува должината на годишниот одмор.'
  },
  {
    id: 'q75',
    category: 'rest_breaks',
    text: 'Дали работникот користи годишен одмор во текот на календарската година?',
    article: 'Член 137 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Годишниот одмор мора да се користи во текот на календарската година.'
  },
  {
    id: 'q76',
    category: 'rest_breaks',
    text: 'Дали работодавачот го отповикува работникот од годишен одмор?',
    article: 'Член 142 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работодавачот може да го отповика работникот само во исклучителни случаи.'
  },
  {
    id: 'q77',
    category: 'rest_breaks',
    text: 'Дали работникот има право на компензација за неискористен годишен одмор по престанок на работниот однос?',
    article: 'Член 141 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Работникот има право на компензација за неискористен годишен одмор.'
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
  working_time: 'Работно време',
  rest_breaks: 'Паузи и одморие'
};

module.exports = {
  questions,
  sanctions,
  gradeConfig,
  categoryNames,
  ANSWER_TYPES,
  SANCTION_LEVELS
};
