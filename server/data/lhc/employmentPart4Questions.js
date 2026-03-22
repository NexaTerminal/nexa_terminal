// Employment Part 4: Посебна заштита (Special Protection)
// Categories: special_protection
// 12 questions total

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
    text: 'Вработена ви соопшти дека е бремена и побара породилно отсуство. Колку месеци отсуство и одобрувате?',
    article: 'Член 165 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'nine_months', text: '9 месеци непрекинато (или 15 за близнаци/повеќе деца)', isCorrect: true },
      { value: 'six_months', text: '6 месеци', isCorrect: false },
      { value: 'three_months', text: '3 месеци', isCorrect: false },
      { value: 'negotiate', text: 'Се договараме колку може да отсуствува според деловните потреби', isCorrect: false }
    ],
    recommendation: 'Породилното отсуство е 9 месеци непрекинато (15 за близнаци). Ова е апсолутно право - работодавачот не смее да бара скратување, ниту да инсистира на предвремено враќање. Барање работничката да се врати порано е тежок прекршок.'
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
    text: 'Вработен доставил решение дека има намалена работна способност и не може да ги извршува тековните задачи. Како постапувате?',
    article: 'Член 175 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'reassign', text: 'Му нудиме друго соодветно работно место или приспособени задачи', isCorrect: true },
      { value: 'no_such', text: 'Немаме вработени со намалена работна способност', isCorrect: true },
      { value: 'dismiss', text: 'Му даваме отказ бидејќи не може да ја врши работата', isCorrect: false },
      { value: 'same_position', text: 'Останува на истото место - тој треба да се снајде', isCorrect: false }
    ],
    recommendation: 'Работодавачот е должен прво да понуди соодветно работно место или приспособена работа. Отказ е дозволен САМО ако не постои никакво друго работно место кај работодавачот. Директен отказ без понуда за алтернатива е незаконит.'
  },

  // ===== НОВИ ПРАШАЊА - ПОСЕБНА ЗАШТИТА (q102-q106) =====
  {
    id: 'q102',
    category: 'special_protection',
    text: 'Вработена се врати од породилно отсуство. Дали и го враќате истото работно место или еквивалентно?',
    article: 'Член 166 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'same_position', text: 'Да, се враќа на истото или еквивалентно работно место со исти услови', isCorrect: true },
      { value: 'different', text: 'Ја ставаме каде што има место во моментот', isCorrect: false },
      { value: 'lower_position', text: 'Бидејќи долго отсуствувала, и нудиме пониска позиција', isCorrect: false },
      { value: 'no_maternity', text: 'Немале сме работнички на породилно отсуство', isCorrect: true }
    ],
    recommendation: 'По завршување на породилното отсуство, работничката има право да се врати на истото работно место со исти услови. Ако местото е укинато, мора да и се понуди еквивалентно. Понижување или влошување на условите е забрането.'
  },
  {
    id: 'q103',
    category: 'special_protection',
    text: 'Вработена е во 7-ми месец од бременоста и работи на позиција која вклучува кревање тешки предмети. Дали сте преземале нешто?',
    article: 'Член 163 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'reassigned', text: 'Да, ја преместивме на полесна работа со задржување на истата плата', isCorrect: true },
      { value: 'sick_leave', text: 'И кажавме да земе боледување ако не може да работи', isCorrect: false },
      { value: 'same_work', text: 'Продолжува на истото место - таа не се жалела', isCorrect: false },
      { value: 'no_pregnant', text: 'Немаме бремени работнички на такви позиции', isCorrect: true }
    ],
    recommendation: 'Бремена работничка МОРА да биде преместена на полесна или безопасна работа, со задржување на платата од претходното работно место. Ова е обврска на работодавачот, не избор. Не смеете да чекате работничката да побара - вие мора проактивно да реагирате.'
  },
  {
    id: 'q104',
    category: 'special_protection',
    text: 'Вработена со дете од 3 години ви кажува дека не сака да работи ноќна смена. Дали мора да ја ослободите?',
    article: 'Член 164 став 4 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_must', text: 'Да, работник со дете под 7 години не може да работи ноќе без негова/нејзина писмена согласност', isCorrect: true },
      { value: 'no_obligation', text: 'Не, обврска на работникот е да ги прифати сите смени', isCorrect: false },
      { value: 'only_infant', text: 'Ова важи само за деца под 1 година', isCorrect: false },
      { value: 'no_night_work', text: 'Немаме ноќна работа', isCorrect: true }
    ],
    recommendation: 'Работник/работничка со дете до 7 години не може да биде распореден/а на ноќна или прекувремена работа без негова/нејзина претходна писмена согласност. Ова правило е апсолутно и не може да се заобиколи со внатрешни правилници.'
  },
  {
    id: 'q105',
    category: 'special_protection',
    text: 'Татко на новороденче бара да го искористи правото на породилно отсуство наместо мајката, по првите 45 дена. Дали му го одобрувате?',
    article: 'Член 165 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_legal_right', text: 'Да, таткото може да го преземе породилното отсуство по првите 45 дена', isCorrect: true },
      { value: 'no_only_mother', text: 'Не, породилното отсуство е само за мајката', isCorrect: false },
      { value: 'only_if_mother_works', text: 'Само ако мајката е вработена и се согласи', isCorrect: false },
      { value: 'no_such_request', text: 'Немаме имале вакво барање', isCorrect: true }
    ],
    recommendation: 'По истекот на првите 45 дена од породилното отсуство, таткото има право да го преземе остатокот од отсуството. Ова е законско право кое не може да се одбие. Работодавачот на таткото мора да го одобри отсуството.'
  },
  {
    id: 'q106',
    category: 'special_protection',
    text: 'Вработен со утврден инвалидитет (60% телесно оштетување) бара зголемен годишен одмор. Дали му следува?',
    article: 'Член 137 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_additional', text: 'Да, му следуваат дополнителни 3 работни дена годишен одмор над минималните 20', isCorrect: true },
      { value: 'same_as_others', text: 'Не, сите добиваат ист одмор без разлика', isCorrect: false },
      { value: 'only_if_requested', text: 'Само ако достави барање со документација', isCorrect: false },
      { value: 'no_disabled', text: 'Немаме вработени со утврден инвалидитет', isCorrect: true }
    ],
    recommendation: 'Работници со телесно оштетување од 60% или повеќе имаат законско право на зголемен годишен одмор (дополнителни 3 работни дена). Ова право не зависи од барање - работодавачот е должен автоматски да го пресмета при доделувањето на одморот.'
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
  special_protection: 'Посебна заштита (бременост, родителство и инвалидитет)'
};

module.exports = {
  questions,
  sanctions,
  gradeConfig,
  categoryNames,
  ANSWER_TYPES,
  SANCTION_LEVELS
};
