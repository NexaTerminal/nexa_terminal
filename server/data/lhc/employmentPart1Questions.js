// Employment Part 1: Вработување и договори (Hiring and Contracts)
// Categories: recruitment, contracts, work_organization, special_contracts
// 35 questions total

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
    text: 'При прегледување на вашите договори за вработување, дали забележувате клаузули кои предвидуваат помали права од оние утврдени со закон или колективен договор (на пр. помалку од 20 дена годишен одмор, пониска плата од минималната)?',
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
    text: 'По завршување на огласот за вработување, избраниот кандидат треба да биде известен во рок од 5 дена. Дали го почитувате овој рок при последните вработувања?',
    article: 'Член 23 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_always', text: 'Да, секогаш го известуваме избраниот кандидат во рокот', isCorrect: true },
      { value: 'usually', text: 'Обично да, но понекогаш го пропуштаме рокот', isCorrect: false },
      { value: 'no_formal_process', text: 'Немаме формализиран процес на известување', isCorrect: false },
      { value: 'no_recent_hiring', text: 'Немаме имале неодамнешно вработување', isCorrect: true }
    ],
    recommendation: 'По завршување на постапката за избор, работодавачот е должен во рок од 5 дена да го извести избраниот кандидат. Воспоставете стандардизиран процес на известување.'
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
    text: 'На вработен му се менува работното место или платата. Како ја формализирате промената?',
    article: 'Член 28 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'written_annex', text: 'Со писмен анекс на договорот за вработување, потпишан од двете страни', isCorrect: true },
      { value: 'verbal_notice', text: 'Усно го информираме работникот за промената', isCorrect: false },
      { value: 'internal_memo', text: 'Со интерен допис или е-пошта, без потпис од работникот', isCorrect: false },
      { value: 'no_changes', text: 'Досега немало промени на условите кај ниту еден вработен', isCorrect: true }
    ],
    recommendation: 'Секоја промена на условите за вработување (работно место, плата, работно време) мора да биде уредена со писмен анекс на договорот потпишан од двете страни. Усната промена нема правно дејство.'
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
    text: 'Дознавате дека еден од вашите вработени со полно работно време почнал да работи и за друга фирма. Дали претходно сте дале писмена согласност за тоа?',
    article: 'Член 121 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'yes_written', text: 'Да, имаме дадено писмена согласност пред тој да почне', isCorrect: true },
      { value: 'no_cases', text: 'Немаме таков случај - ниеден вработен не работи на друго место', isCorrect: true },
      { value: 'yes_verbal', text: 'Знаевме за тоа, но само усно се договоривме', isCorrect: false },
      { value: 'dont_know', text: 'Не знаеме дали некој од вработените работи и на друго место', isCorrect: false }
    ],
    recommendation: 'Вработен со полно работно време може да работи кај друг работодавач само со претходна писмена согласност. Без таа согласност, ангажманот е неправилен. Проверете ги вашите вработени и документирајте ги сите вакви случаи.'
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
    text: 'Вработен работи кај вас на договор на определено време веќе 4 години на истото работно место. Му нудите продолжување. Колку вкупно може да трае ваквиот договор?',
    article: 'Член 46 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'up_to_5', text: 'Вкупно до 5 години за исто работно место, значи може уште 1 година', isCorrect: true },
      { value: 'unlimited', text: 'Нема ограничување, може колку сакаме да го продолжуваме', isCorrect: false },
      { value: 'no_fixed_term', text: 'Немаме вработени на определено време', isCorrect: true },
      { value: 'dont_track', text: 'Не го следиме вкупното траење на ваквите договори', isCorrect: false }
    ],
    recommendation: 'Договорот за вработување на определено време за исти работи, со или без прекин, не може да трае повеќе од 5 години вкупно. По истекот, работниот однос автоматски се трансформира во неопределено време.'
  },
  {
    id: 'q31',
    category: 'special_contracts',
    text: 'Договорот на определено време на еден вработен истекол пред 2 недели, но тој продолжи да доаѓа на работа и вие не реагиравте. Каков е сега неговиот статус?',
    article: 'Член 46 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'transformed', text: 'Автоматски се смета за вработен на неопределено време - треба да склучиме нов договор', isCorrect: true },
      { value: 'still_fixed', text: 'Сè уште е на определено, ќе му направиме нов договор кога ќе стигнеме', isCorrect: false },
      { value: 'no_status', text: 'Нема договор, значи не е вработен - може да го испратиме дома', isCorrect: false },
      { value: 'never_happened', text: 'Немаме имале ваков случај', isCorrect: true }
    ],
    recommendation: 'Ако работникот продолжи да работи по истекот на договорот на определено време без нов договор, законот автоматски го третира тоа како договор на неопределено време. Веднаш формализирајте го односот со нов договор.'
  },
  {
    id: 'q32',
    category: 'special_contracts',
    text: 'Вработивте лице со неполно работно време (4 часа дневно). Дознавте дека работи уште 4 часа кај друг работодавач. Дали сте го координирале работното време?',
    article: 'Член 49 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_coordinated', text: 'Да, работното време е координирано и уредено во договорот', isCorrect: true },
      { value: 'no_parttime', text: 'Немаме вработени со неполно работно време', isCorrect: true },
      { value: 'no_knowledge', text: 'Не знаеме кај колку работодавачи уште работи', isCorrect: false },
      { value: 'not_in_contract', text: 'Тоа не е регулирано во нашиот договор', isCorrect: false }
    ],
    recommendation: 'Договорот за вработување со неполно работно време мора да содржи одредба за координација со обврските кај другиот работодавач. Без координација, ризикувате повреда на максималното работно време.'
  },
  {
    id: 'q33',
    category: 'special_contracts',
    text: 'Нов вработен е на пробна работа веќе 2 месеца. Не сте задоволни од неговата работа. На кој начин е уредена пробната работа?',
    article: 'Член 60 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'written_contract', text: 'Пробната работа е писмено уредена во договорот со точно определен период', isCorrect: true },
      { value: 'no_probation', text: 'Не применуваме пробна работа при вработување', isCorrect: true },
      { value: 'verbal', text: 'Усно му кажавме дека е на проба, нема ништо писмено', isCorrect: false },
      { value: 'informal', text: 'Нема формална проба, само неформално го набљудуваме првите месеци', isCorrect: false }
    ],
    recommendation: 'Пробната работа мора да биде писмено уговорена во договорот за вработување со јасно определен период. Без писмен договор за проба, не можете законски да го прекинете работниот однос врз основа на неуспешна проба.'
  },

  // ===== НОВИ ПРАШАЊА - ВРАБОТУВАЊЕ И ДОГОВОРИ (q85-q89) =====
  {
    id: 'q85',
    category: 'recruitment',
    text: 'Кандидат за вработување ви доставил CV каде наведува дека е член на политичка партија. Дали оваа информација влијае на вашата одлука за вработување?',
    article: 'Член 6 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no_influence', text: 'Не, политичката припадност не влијае на одлуката за вработување', isCorrect: true },
      { value: 'depends', text: 'Зависи од позицијата и природата на работата', isCorrect: false },
      { value: 'negative', text: 'Да, претпочитаме кандидати без политичка активност', isCorrect: false },
      { value: 'positive', text: 'Да, претпочитаме кандидати од определена партија', isCorrect: false }
    ],
    recommendation: 'Политичката припадност е заштитена лична околност. Дискриминацијата врз основа на политичко убедување при вработување е забранета и претставува тежок прекршок.'
  },
  {
    id: 'q86',
    category: 'recruitment',
    text: 'Вработивте ново лице во понеделник, но пријавата во Фондот за социјално осигурување ја направивте дури во среда. Дали ова е проблематично?',
    article: 'Член 13 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_problem', text: 'Да, пријавата мора да се направи најдоцна на денот на почнување со работа', isCorrect: true },
      { value: 'ok_3_days', text: 'Не, имаме 3 дена рок за пријава', isCorrect: false },
      { value: 'ok_week', text: 'Не, имаме една недела рок', isCorrect: false },
      { value: 'ok_month', text: 'Не, важно е да се пријави до крајот на месецот', isCorrect: false }
    ],
    recommendation: 'Работодавачот е должен да го пријави работникот во задолжително социјално осигурување НАЈДОЦНА на денот кој е определен како датум за почнување со работа. Задоцнетата пријава е прекршок и работникот работи без осигурување.'
  },
  {
    id: 'q87',
    category: 'contracts',
    text: 'Во договорот за вработување на еден работник стои само: име, работно место и плата. Дали овој договор ги содржи сите задолжителни елементи?',
    article: 'Член 15 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no_missing', text: 'Не, недостасуваат задолжителни елементи (датум на почеток, траење, работно време, одмор и др.)', isCorrect: true },
      { value: 'yes_enough', text: 'Да, тоа е доволно за валиден договор', isCorrect: false },
      { value: 'depends', text: 'Зависи од видот на работата', isCorrect: false },
      { value: 'can_add_later', text: 'Ќе ги додадеме останатите елементи подоцна со анекс', isCorrect: false }
    ],
    recommendation: 'Договорот мора да содржи: податоци за страните, датум на засновање, назив и опис на работно место, место на работа, работно време, траење, плата, годишен одмор и отказни рокови. Непотполен договор е ризик при инспекциски надзор.'
  },
  {
    id: 'q88',
    category: 'work_organization',
    text: 'Вработен бара да работи од дома 3 дена неделно. Го одобривте усно без да го менувате договорот. Дали ова е доволно?',
    article: 'Член 50 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'no_need_written', text: 'Не, работата од дома мора да биде уредена со писмен договор или анекс', isCorrect: true },
      { value: 'yes_enough', text: 'Да, доволна е усна согласност', isCorrect: false },
      { value: 'email_ok', text: 'Доволно е да имаме е-пошта како потврда', isCorrect: false },
      { value: 'no_remote', text: 'Не дозволуваме работа од дома', isCorrect: true }
    ],
    recommendation: 'Работата од дома (надвор од просториите на работодавачот) мора да биде уредена со писмен договор кој ги содржи условите за работа, средствата за работа, надомест за трошоци и начинот на надзор. Усната согласност не е доволна.'
  },
  {
    id: 'q89',
    category: 'special_contracts',
    text: 'Ангажиравте студент на договор за дело да работи секој ден од 9 до 17 часот, на исто работно место како останатите вработени. Дали ова е правилно?',
    article: 'Член 252 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no_disguised', text: 'Не, ова е прикриен работен однос - треба договор за вработување', isCorrect: true },
      { value: 'yes_ok', text: 'Да, договорот за дело е доволен за било какво ангажирање', isCorrect: false },
      { value: 'depends_duration', text: 'Зависи колку долго ќе трае ангажманот', isCorrect: false },
      { value: 'student_exception', text: 'За студенти не важат правилата за работен однос', isCorrect: false }
    ],
    recommendation: 'Ако лицето работи секојдневно, со фиксно работно време, на работно место на работодавачот и под негов надзор - тоа е работен однос без разлика на називот на договорот. Прикривањето на работен однос со договор за дело е тежок прекршок кој повлекува казна и задолжително склучување договор за вработување.'
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
