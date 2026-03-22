// Employment Part 2: Работно место и заштита (Workplace and Worker Protection)
// Categories: protection, termination, payment
// 24 questions total

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
    text: 'Замислете дека одлучивте да му дадете отказ на вработен. Кој е вашиот вообичаен постапок?',
    article: 'Членови 74 и 85 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'written_reasoned', text: 'Издаваме писмена одлука за отказ со образложение, правна поука и отказен рок', isCorrect: true },
      { value: 'verbal', text: 'Усно му кажуваме на работникот дека повеќе не е потребен', isCorrect: false },
      { value: 'stop_paying', text: 'Едноставно престануваме да го повикуваме на работа или да му плаќаме', isCorrect: false },
      { value: 'mutual_always', text: 'Секогаш правиме спогодбен престанок за да избегнеме процедура', isCorrect: true }
    ],
    recommendation: 'Отказот мора да биде во писмена форма, со образложение на причините, правна поука за право на судска заштита и информација за правата при невработеност. Усниот отказ е незаконит и може да се оспори пред суд.'
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
    text: 'На вработен со 7 години стаж кај вас му давате отказ. Колку отказен рок му обезбедувате?',
    article: 'Член 88 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'two_months', text: '2 месеца (законски минимум за 5-10 години стаж)', isCorrect: true },
      { value: 'one_month', text: '1 месец', isCorrect: false },
      { value: 'two_weeks', text: '2 недели', isCorrect: false },
      { value: 'immediate', text: 'Заминува веднаш, без отказен рок', isCorrect: false }
    ],
    recommendation: 'Законски отказни рокови: до 5 години стаж = 1 месец; 5-10 години = 2 месеца; над 10 години = 3 месеца. Скратување на отказниот рок без спогодба со работникот е незаконито и основ за тужба.'
  },
  {
    id: 'q38',
    category: 'termination',
    text: 'Вработен е во отказен рок од 1 месец. Бара 4 часа неделно слободно за да бара нова работа. Како постапувате?',
    article: 'Член 92 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'approve_paid', text: 'Му одобруваме 4 часа платено отсуство неделно за барање работа', isCorrect: true },
      { value: 'deny', text: 'Му одбиваме - додека е кај нас, работи полно работно време', isCorrect: false },
      { value: 'unpaid_only', text: 'Може да оди, но без плата за тие часови', isCorrect: false },
      { value: 'no_notice_cases', text: 'Досега немаме имале отказ со отказен рок', isCorrect: true }
    ],
    recommendation: 'За време на отказниот рок, работодавачот е должен да му овозможи на работникот платено отсуство од 4 часа неделно за барање нова работа. Ова е законска обврска, а не одлука на работодавачот.'
  },
  {
    id: 'q39',
    category: 'termination',
    text: 'Вработен постојано не ги исполнува работните задачи на задоволително ниво. Размислувате за отказ. Дали претходно сте му дале писмено предупредување?',
    article: 'Членови 79 и 80 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_written', text: 'Да, дадовме писмено предупредување со рок за подобрување пред да размислуваме за отказ', isCorrect: true },
      { value: 'no_direct', text: 'Не, планираме директно да дадеме отказ без предупредување', isCorrect: false },
      { value: 'verbal_only', text: 'Само усно разговаравме со него за проблемот', isCorrect: false },
      { value: 'no_such_cases', text: 'Немаме такви случаи - сите вработени работат задоволително', isCorrect: true }
    ],
    recommendation: 'Пред отказ поради лични причини (неспособност), работодавачот мора претходно писмено да го предупреди работникот за неисполнување на обврските и да му даде разумен рок за подобрување. Отказ без предупредување може да биде поништен од суд.'
  },
  {
    id: 'q40',
    category: 'termination',
    text: 'Вработен направил сериозна повреда на работниот ред (на пр. дошол на работа под дејство на алкохол). Kako постапувате?',
    article: 'Членови 81 и 84 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'procedure', text: 'Му даваме можност за изјаснување, потоа донесуваме писмена одлука за дисциплинска мерка или отказ', isCorrect: true },
      { value: 'immediate', text: 'Го испраќаме дома веднаш без формална постапка', isCorrect: false },
      { value: 'verbal_warning', text: 'Само усно го опоменуваме, без документација', isCorrect: false },
      { value: 'no_cases', text: 'Немаме имале дисциплински проблеми', isCorrect: true }
    ],
    recommendation: 'При повреда на работниот ред, мора да се спроведе постапка: работникот има право на изјаснување, а одлуката (отказ или парична казна до 15% од нето плата) мора да биде писмена со образложение и правна поука.'
  },
  {
    id: 'q41',
    category: 'termination',
    text: 'Поради реорганизација, отпуштате вработен со 12 години стаж. Дали и колку отпремнина му исплатувате?',
    article: 'Член 97 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'correct_amount', text: 'Да, 3,5 нето плати (законски износ за 10-15 години стаж)', isCorrect: true },
      { value: 'flat_one', text: 'Една нето плата, без разлика на стажот', isCorrect: false },
      { value: 'no_severance', text: 'Не исплатуваме отпремнина - не е задолжително', isCorrect: false },
      { value: 'negotiated', text: 'Се договараме со работникот за износот', isCorrect: false }
    ],
    recommendation: 'Отпремнината при отказ поради деловни причини е задолжителна: до 5 год. = 1 нето плата; 5-10 год. = 2,5; 10-15 год. = 3,5; 15-20 год. = 4,5; 20-25 год. = 5,5; над 25 год. = 6,5 нето плати. Износите се минимални и не можат да бидат помали.'
  },
  {
    id: 'q42',
    category: 'termination',
    text: 'Вработен ви даде отказ без отказен рок, тврдејќи дека 3 месеци не сте му исплатиле плата. Дали може тоа да го направи?',
    article: 'Член 100 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_legal', text: 'Да, неисплатата на плата е основ за итен отказ од страна на работникот', isCorrect: true },
      { value: 'no_must_notice', text: 'Не, секогаш мора да даде отказен рок', isCorrect: false },
      { value: 'only_court', text: 'Може само ако суд претходно утврди повреда', isCorrect: false },
      { value: 'never_happened', text: 'Немаме такви случаи - платата секогаш е навремена', isCorrect: true }
    ],
    recommendation: 'Ако работодавачот не ги исполнува основните обврски (неисплата на плата, необезбедување заштита при работа), работникот може да го откаже договорот без отказен рок и да бара обештетување. Ова е силна законска заштита - редовно исплатувајте плати.'
  },
  {
    id: 'q43',
    category: 'termination',
    text: 'Пред секој отказ, дали консултирате правник или HR специјалист за да проверите дали постапката е законита?',
    article: 'Членови 74, 76 и 85 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'always', text: 'Да, секогаш проверуваме законитост и постапка пред отказ', isCorrect: true },
      { value: 'sometimes', text: 'Само кај посложени случаи, не секогаш', isCorrect: false },
      { value: 'no_need', text: 'Не, сами одлучуваме кога ќе дадеме отказ', isCorrect: false },
      { value: 'never_dismissed', text: 'Досега немаме давано отказ', isCorrect: true }
    ],
    recommendation: 'Незаконитиот отказ може да доведе до судско враќање на работникот, обештетување и трошоци. Секогаш проверете: дали постои законски основ, дали е спроведена постапка (предупредување, изјаснување), и дали одлуката е во писмена форма со правна поука.'
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
    article: 'Член 109 став 2 од Законот за работните односи',
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
  },

  // ===== НОВИ ПРАШАЊА - ЗАШТИТА, ОТКАЗ И ПЛАЌАЊЕ (q90-q95) =====
  {
    id: 'q90',
    category: 'protection',
    text: 'Вработен ви пријавил дека колега постојано го понижува и исклучува од тимски активности. Kako постапувате?',
    article: 'Член 9-б од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'formal_procedure', text: 'Го активираме назначеното лице за мобинг и спроведуваме постапка за утврдување на фактите', isCorrect: true },
      { value: 'ignore', text: 'Му кажуваме да не го сфаќа лично и да си ја гледа работата', isCorrect: false },
      { value: 'move_complainant', text: 'Го преместуваме жалителот на друго работно место за да го тргнеме од ситуацијата', isCorrect: false },
      { value: 'verbal_warning', text: 'Усно го опоменуваме колегата и не преземаме понатамошни чекори', isCorrect: false }
    ],
    recommendation: 'Работодавачот е должен да постапи по секоја пријава за мобинг преку назначеното лице и да спроведе постапка. Игнорирање или преместување на жртвата наместо решавање на проблемот е дополнителна повреда на обврските.'
  },
  {
    id: 'q91',
    category: 'termination',
    text: 'Вработена ви соопшти дека е бремена. Две недели подоцна, поради реорганизација, планирате да го укинете нејзиното работно место. Дали можете да и дадете отказ?',
    article: 'Член 101 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no_forbidden', text: 'Не, забранет е отказ на бремена работничка без разлика на причината', isCorrect: true },
      { value: 'yes_business', text: 'Да, ако причината е деловна а не поврзана со бременоста', isCorrect: false },
      { value: 'yes_with_severance', text: 'Да, ако и исплатиме отпремнина', isCorrect: false },
      { value: 'yes_consent', text: 'Да, ако таа се согласи со спогодбен престанок', isCorrect: true }
    ],
    recommendation: 'Отказот на бремена работничка е апсолутно забранет за време на бременоста и породилното отсуство. Единствен исклучок е спогодбен престанок (доброволна согласност на работничката). Прекршувањето повлекува висока казна.'
  },
  {
    id: 'q92',
    category: 'termination',
    text: 'Вработен одбива да потпише дека го примил отказот. Kako постапувате со доставувањето?',
    article: 'Член 83 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'registered_mail', text: 'Го испраќаме по препорачана пошта со повратница', isCorrect: true },
      { value: 'witnesses', text: 'Го оставаме пред него со двајца сведоци и составуваме записник', isCorrect: true },
      { value: 'email', text: 'Му го испраќаме на е-пошта', isCorrect: false },
      { value: 'give_up', text: 'Ако не потпише, не можеме да го отпуштиме', isCorrect: false }
    ],
    recommendation: 'Отказот мора да биде доставен лично со потпис или по препорачана пошта. Ако работникот одбива прием, доставата може да се изврши со записник пред сведоци. Е-пошта не е доволна за валидна достава на отказ.'
  },
  {
    id: 'q93',
    category: 'payment',
    text: 'Вработен работел 10 часа прекувремено овој месец. На платниот лист, прекувремените часови се прикажани со иста стапка како редовните. Дали ова е правилно?',
    article: 'Член 106 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no_increase', text: 'Не, прекувремената работа мора да се плати со зголемена стапка (најмалку 35% повеќе)', isCorrect: true },
      { value: 'yes_same', text: 'Да, доволно е да се платат часовите, стапката е иста', isCorrect: false },
      { value: 'compensatory', text: 'Наместо зголемена плата, му даваме слободни денови', isCorrect: false },
      { value: 'no_overtime', text: 'Немаме прекувремена работа', isCorrect: true }
    ],
    recommendation: 'Прекувремената работа се плаќа со зголемена стапка од најмалку 35% над редовната часовна плата. Исплатата по редовна стапка е повреда на законот. Слободни денови наместо плаќање не се предвидени како замена.'
  },
  {
    id: 'q94',
    category: 'payment',
    text: 'Вработен е на боледување 5 дена. На платниот лист му се прикажува 100% плата за тие денови. Дали ова е правилно?',
    article: 'Член 112 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'depends_reason', text: 'Зависи од причината - за повреда на работа 100%, за болест обично 70%', isCorrect: true },
      { value: 'always_100', text: 'Да, секогаш е 100% за време на боледување', isCorrect: false },
      { value: 'no_pay', text: 'Не треба да се плаќа за боледување - тоа го покрива Фондот', isCorrect: false },
      { value: 'flat_50', text: 'Секогаш е 50% од платата', isCorrect: false }
    ],
    recommendation: 'Надоместокот за боледување зависи од причината: 100% за повреда на работа или професионална болест, 70% за општа болест. Првите 30 дена се на товар на работодавачот, потоа преку Фондот за здравство.'
  },
  {
    id: 'q95',
    category: 'payment',
    text: 'На крајот на годината, дали на секој вработен му издавате писмена потврда за вкупно исплатената плата, придонеси и даноци (годишна потврда)?',
    article: 'Член 110 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_annually', text: 'Да, секоја година до 31 јануари издаваме потврда за претходната година', isCorrect: true },
      { value: 'only_if_asked', text: 'Само ако работникот побара', isCorrect: false },
      { value: 'no_not_aware', text: 'Не, не сме знаеле за оваа обврска', isCorrect: false },
      { value: 'payslip_enough', text: 'Месечните платни листови се доволни', isCorrect: false }
    ],
    recommendation: 'Работодавачот е должен до 31 јануари секоја година да му издаде на работникот потврда за исплатени плати, придонеси и даноци за претходната календарска година. Ова е посебна обврска, различна од месечниот платен лист.'
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
