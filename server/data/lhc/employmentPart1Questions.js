// Employment Part 1: Вработување и договори (Hiring and Contracts)
// Categories: recruitment, contracts, work_organization, special_contracts
// 30 questions total

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
  // ===== ПРОЦЕС НА ВРАБОТУВАЊЕ, ОГЛАСИ И ОПШТИ ОКОЛНОСТИ (q1-q14) =====
  {
    id: 'q1',
    category: 'recruitment',
    text: 'Дали во процесот на вработување и барање на кандидати преку оглас, како услов се поставува определено потекло, пол, возраст или други лични околности на посакуваниот работник?',
    article: 'Членови 6, 7 и 8 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Потребно е да се отстрани негативната практика, да се поставуваат како услов за вработување потеклото, полот, возраста или другите лични околности на посакуваниот работник.'
  },
  {
    id: 'q2',
    category: 'recruitment',
    text: 'Дали во процесот на вработување од кандидатите се поставуваат прашања или се бараат документи во врска со личните околности на кандидатите за вработување, кои одговори може да немаат влијание на начинот на вршењето на работата?',
    article: 'Членови 6, 7 и 8 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Потребно е да се отстрани негативната практика при процесот на вработување, односно да не се бараат податоци и информации од кандидатите кои не се директно поврзани со работните задачи.'
  },
  {
    id: 'q3',
    category: 'recruitment',
    text: 'Дали во договорите за вработување се вметнуваат договорни клаузули кои предвидуваат помали права од правата предвидени со Законот за работните односи или друг закон?',
    article: 'Член 12 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Препорачливо е да се ревидираат договорите за вработување и да се отстранат клаузули кои се спротивни на Законот или Колективниот Договор.'
  },
  {
    id: 'q4',
    category: 'recruitment',
    text: 'Дали со сите ангажирани лица е потпишан договор за вработување?',
    article: 'Член 13 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Потребно е со сите ангажирани лица да се склучат договори за вработување. Ваквиот пропуст е сериозен и претставува единствен пропуст поради кој при инспекциски надзор би се изрекла директна прекршочна мерка.'
  },
  {
    id: 'q5',
    category: 'recruitment',
    text: 'Дали за лицата со кои е склучен договор за вработување има извршено пријавување во задолжително социјално осигурување на денот кој е определен како датум за почеток со работа?',
    article: 'Член 13 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Потребно е веднаш по склучување на договорот и пред започнување со работа, работникот да биде пријавен во задолжително социјално осигурување.'
  },
  {
    id: 'q6',
    category: 'recruitment',
    text: 'Дали во просториите на седиштето на работодавачот се чува писмена форма од Договорот за вработување?',
    article: 'Член 15 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Потребно е да се направи проверка и да се потврди дека сите договори се чуваат во седиштето на работодавачот.'
  },
  {
    id: 'q7',
    category: 'recruitment',
    text: 'Дали на вработените му се врачува договор за вработување на денот на потпишување на договорот за вработување?',
    article: 'Член 15 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Сите договори кои не се предадени на вработените, потребно е да се потпишат од двете страни и да се врачат на оние вработени кои не примиле договор.'
  },
  {
    id: 'q8',
    category: 'recruitment',
    text: 'Кое лице ги потпишува договорите за вработување во име на работодавачот?',
    article: 'Член 17 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'legal_rep', text: 'Законски застапник - Управител', isCorrect: true },
      { value: 'authorized', text: 'Ополномоштено лице со валидно овластување', isCorrect: true },
      { value: 'other', text: 'Друго лице без овластување', isCorrect: false }
    ],
    recommendation: 'Обезбедете договорите да ги потпишува законскиот застапник или валидно ополномоштено лице.'
  },
  {
    id: 'q9',
    category: 'recruitment',
    text: 'Дали од страна на работодавачот е ангажирано лице кое нема наполнето 15 години или дете кое не завршило задолжително образование?',
    article: 'Член 18 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Без одлагање да се прекине ангажманот на секое лице кое нема навршено 15 години.'
  },
  {
    id: 'q10',
    category: 'recruitment',
    text: 'Дали од страна на работодавачот во акт (акт за систематизација на работни места или друг акт) е определено кои се посебните услови за вршење на работа за секое поединечно работно место?',
    article: 'Член 19 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Препорачливо е да се изготви акт за систематизација и за секоја работна позиција да се определат услови за вршење на работа.'
  },
  {
    id: 'q11',
    category: 'recruitment',
    text: 'Дали со работодавачот е склучен договор за вработување со странец кој нема добиено дозвола за престој по однос на вработување кај работодавачот?',
    article: 'Член 20 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'За сите странски лица кои работат кај работодавачот, потребно е да се обезбеди дозвола за престој согласно Законот за странци.'
  },
  {
    id: 'q12',
    category: 'recruitment',
    text: 'Дали огласот за вработување содржи: назив на работното место, услови за вршење на работата, работно време, распоред, висина на плата, рок за пријавување, рок за избор и податоци за работодавачот?',
    article: 'Член 23 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.8,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете огласот да содржи сите задолжителни податоци пропишани со Законот.'
  },
  {
    id: 'q13',
    category: 'recruitment',
    text: 'Дали од кандидатот за вработување се бараат докази за брачен статус, семеен живот, планирање на семејство или социјален/политички статус?',
    article: 'Членови 6, 7, 8 и Закон за заштита на личните податоци',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Не смеат да се бараат лични податоци кои не се релевантни за вршење на работата.'
  },
  {
    id: 'q14',
    category: 'recruitment',
    text: 'Дали на огласот за вработување се наведени условите за вработување кои се однесуваат на работното место и условите за засновање на работниот однос?',
    article: 'Член 14 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете огласот да содржи јасни услови за вработување.'
  },

  // ===== ДОГОВОРИ ЗА ВРАБОТУВАЊЕ (q15-q17) =====
  {
    id: 'q15',
    category: 'contracts',
    text: 'Дали договорот за вработување содржи: вид на работа, место на работа, датум на засновање, траење, работно време и висина на плата?',
    article: 'Член 15 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Договорот мора да содржи сите задолжителни елементи пропишани со Законот.'
  },
  {
    id: 'q16',
    category: 'contracts',
    text: 'Дали договорот за вработување е склучен во писмена форма?',
    article: 'Член 15 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Сите договори мора да бидат склучени во писмена форма.'
  },
  {
    id: 'q17',
    category: 'contracts',
    text: 'Дали работникот има право да побара измена на договорот за вработување доколку се променат условите за работа?',
    article: 'Член 42 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете работниците да знаат за нивното право на измена на договорот при променети услови.'
  },

  // ===== ПРОЦЕС НА РАБОТА И ОРГАНИЗАЦИЈА (q18-q26) =====
  {
    id: 'q18',
    category: 'work_organization',
    text: 'Дали на работникот му е врачен акт за систематизација односно опис на работното место?',
    article: 'Член 28 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Обезбедете секој работник да добие писмен опис на своето работно место.'
  },
  {
    id: 'q19',
    category: 'work_organization',
    text: 'Дали на работното место на работникот му се доделуваат и задачи кои не се содржани во описот на неговото работно место?',
    article: 'Член 28 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    recommendation: 'Избегнувајте доделување задачи надвор од описот на работното место без соодветен анекс на договорот.'
  },
  {
    id: 'q20',
    category: 'work_organization',
    text: 'Дали работникот може да врши работа надвор од просториите на работодавачот (работа од дома)?',
    article: 'Член 43 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'no', text: 'Не', isCorrect: true },
      { value: 'with_agreement', text: 'Да, но со писмен договор', isCorrect: true },
      { value: 'without_agreement', text: 'Да, без договор', isCorrect: false }
    ],
    recommendation: 'Работа од дома мора да биде уредена со писмен договор.'
  },
  {
    id: 'q21',
    category: 'work_organization',
    text: 'Дали работодавачот има донесено правилник за работа?',
    article: 'Член 123 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Работодавачот мора да донесе правилник за работа.'
  },
  {
    id: 'q22',
    category: 'work_organization',
    text: 'Дали работникот може да врши работа за друг работодавач за време на траењето на работниот однос?',
    article: 'Член 44 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'no', text: 'Не', isCorrect: false },
      { value: 'with_consent', text: 'Да, со согласност на работодавачот', isCorrect: true },
      { value: 'without_consent', text: 'Да, без согласност', isCorrect: false }
    ],
    recommendation: 'Работа за друг работодавач бара писмена согласност.'
  },
  {
    id: 'q23',
    category: 'work_organization',
    text: 'Дали работодавачот води евиденција за работниците?',
    article: 'Член 96 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се води евиденција за сите работници.'
  },
  {
    id: 'q24',
    category: 'work_organization',
    text: 'Дали работодавачот има назначено лице задолжено за безбедност при работа?',
    article: 'Закон за безбедност и здравје при работа',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се назначи лице задолжено за безбедност при работа.'
  },
  {
    id: 'q25',
    category: 'work_organization',
    text: 'Дали работниците се обучени за безбедност и здравје при работа?',
    article: 'Закон за безбедност и здравје при работа',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Задолжително е да се спроведе обука за безбедност при работа.'
  },
  {
    id: 'q26',
    category: 'work_organization',
    text: 'Дали работодавачот има изготвено проценка на ризик за работните места?',
    article: 'Закон за безбедност и здравје при работа',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    recommendation: 'Потребно е да се изготви проценка на ризик за сите работни места.'
  },

  // ===== ПОСЕБНИ ВИДОВИ ДОГОВОРИ (q30-q33) =====
  {
    id: 'q30',
    category: 'special_contracts',
    text: 'Дали работодавачот склучува договори за вработување на определено време?',
    article: 'Член 45 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Договорите на определено време мора да бидат оправдани со објективни причини.'
  },
  {
    id: 'q31',
    category: 'special_contracts',
    text: 'Дали договорот на определено време трае подолго од 4 години?',
    article: 'Член 45 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Договорот на определено време не смее да трае подолго од 4 години.'
  },
  {
    id: 'q32',
    category: 'special_contracts',
    text: 'Дали работодавачот склучува договор за привремени и повремени работи?',
    article: 'Член 49 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Договорите за привремени работи мора да бидат уредени правилно.'
  },
  {
    id: 'q33',
    category: 'special_contracts',
    text: 'Дали работодавачот склучува договор за пробна работа?',
    article: 'Член 50 од Законот за работните односи',
    type: ANSWER_TYPES.YES_NO,
    correctAnswer: 'yes',
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    recommendation: 'Пробната работа мора да биде уредена со писмен договор.'
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
  recruitment: 'Процес на вработување, огласи и општи околности',
  contracts: 'Договори за вработување',
  work_organization: 'Процес на работа и организација',
  special_contracts: 'Посебни видови договори за вработување'
};

module.exports = {
  questions,
  sanctions,
  gradeConfig,
  categoryNames,
  ANSWER_TYPES,
  SANCTION_LEVELS
};
