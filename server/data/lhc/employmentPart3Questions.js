// Employment Part 3: Работно време и одмор (Working Time and Rest)
// Categories: working_time, rest_breaks
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
  // ===== РАБОТНО ВРЕМЕ (q49-q63) =====
  {
    id: 'q49',
    category: 'working_time',
    text: 'Разгледувате го распоредот на работниците за следната недела. Колку часа неделно се распоредени вашите вработени со полно работно време?',
    article: 'Член 116 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'up_to_40', text: 'До 40 часа неделно', isCorrect: true },
      { value: '36_40', text: 'Помеѓу 36 и 40 часа (скратено со колективен договор)', isCorrect: true },
      { value: 'over_40', text: 'Редовно над 40 часа, без евидентирање на прекувремена работа', isCorrect: false },
      { value: 'varies', text: 'Варира од недела во недела, не водиме точна евиденција', isCorrect: false }
    ],
    recommendation: 'Полното работно време не смее да надминува 40 часа неделно. Секој час над тоа мора да се евидентира и плати како прекувремена работа со зголемена стапка.'
  },
  {
    id: 'q50',
    category: 'working_time',
    text: 'Оваа недела имавте итен проект и вработените работеа по 10 часа прекувремено. Дали го надминавте законскиот лимит?',
    article: 'Член 117 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_over', text: 'Да, максимумот е 8 часа прекувремено неделно - надминавме со 2 часа', isCorrect: true },
      { value: 'no_fine', text: 'Не, дозволени се до 12 часа прекувремено неделно', isCorrect: false },
      { value: 'no_limit', text: 'Нема неделен лимит, само годишен', isCorrect: false },
      { value: 'no_overtime', text: 'Не воведуваме прекувремена работа', isCorrect: true }
    ],
    recommendation: 'Прекувремената работа е ограничена на максимум 8 часа неделно и 190 часа годишно. Пред секое воведување на прекувремена работа, мора писмено да се извести инспекцијата на трудот.'
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
    text: 'Во сезона, вработен работел вкупно 14 часа во еден ден (8 редовни + 6 прекувремено). Дали ова е дозволено?',
    article: 'Член 124 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no_max_12', text: 'Не, дневното работно време не смее да надмине 12 часа вклучувајќи прекувремена работа', isCorrect: true },
      { value: 'yes_ok', text: 'Да, нема дневен лимит додека се плаќа прекувремено', isCorrect: false },
      { value: 'yes_season', text: 'Да, во сезонска работа нема ограничување', isCorrect: false },
      { value: 'never_happens', text: 'Кај нас никој не работи повеќе од 10 часа дневно', isCorrect: true }
    ],
    recommendation: 'Апсолутниот максимум за дневно работно време е 12 часа, вклучувајќи ги и прекувремените часови. Ова важи и при прераспределба и сезонска работа. Надминување на овој лимит е тежок прекршок.'
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
    text: 'Имате вработени кои работат ноќна смена (22:00 - 06:00). Дали им обезбедувате посебна заштита - подолг одмор, исхрана и периодични здравствени прегледи?',
    article: 'Член 128 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_full', text: 'Да, обезбедуваме подолг одмор, исхрана/надоместок и лекарски прегледи', isCorrect: true },
      { value: 'no_night', text: 'Немаме ноќна работа', isCorrect: true },
      { value: 'pay_only', text: 'Само зголемена плата, без други мерки', isCorrect: false },
      { value: 'same_treatment', text: 'Ноќните работници се третираат исто како дневните', isCorrect: false }
    ],
    recommendation: 'За ноќни работници задолжително е: подолг одмор, обезбедена исхрана или надоместок, и периодични лекарски прегледи на трошок на работодавачот. Само зголемена плата не е доволно.'
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
    text: 'Вработен завршил со ноќна смена во 06:00 наутро и треба да дојде на дневна смена во 14:00 истиот ден. Дали е обезбеден доволен одмор?',
    article: 'Член 133 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no_only_8h', text: 'Не, тоа се само 8 часа - законскиот минимум е 12 часа меѓу две смени', isCorrect: true },
      { value: 'yes_enough', text: 'Да, 8 часа е доволно за одмор', isCorrect: false },
      { value: 'no_shifts', text: 'Немаме работа во смени', isCorrect: true },
      { value: 'worker_agreed', text: 'Работникот се согласи, значи е во ред', isCorrect: false }
    ],
    recommendation: 'Помеѓу две смени мора да има најмалку 12 часа непрекинат одмор. Согласноста на работникот не го менува ова правило - тоа е апсолутен минимум кој не може да се намали ниту со договор.'
  },
  {
    id: 'q58',
    category: 'working_time',
    text: 'Следната недела планирате да воведете прекувремена работа за одделот за производство. Дали претходно писмено ја известувате инспекцијата на трудот?',
    article: 'Член 117 став 6 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_always', text: 'Да, секогаш поднесуваме писмено известување пред воведување на прекувремена работа', isCorrect: true },
      { value: 'no_overtime', text: 'Не воведуваме прекувремена работа', isCorrect: true },
      { value: 'no_not_aware', text: 'Не, не знаевме дека мора да се известува инспекцијата', isCorrect: false },
      { value: 'only_long', text: 'Само кога прекувремената работа трае повеќе од месец дена', isCorrect: false }
    ],
    recommendation: 'Работодавачот е должен писмено да ја извести инспекцијата на трудот ПРЕД СЕКОЕ воведување на прекувремена работа. Ова важи секој пат, без разлика на траењето. Неизвестувањето е прекршок.'
  },
  {
    id: 'q59',
    category: 'working_time',
    text: 'Во последните 3 месеца, еден вработен просечно работел 52 часа неделно (редовно + прекувремено). Дали ова е проблематично?',
    article: 'Член 117 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_over', text: 'Да, просечното неделно работно време не смее да надмине 48 часа во период од 3 месеца', isCorrect: true },
      { value: 'no_seasonal', text: 'Не, ако е сезонска работа нема ограничување', isCorrect: false },
      { value: 'no_paid', text: 'Не, сè е платено значи е во ред', isCorrect: false },
      { value: 'not_tracked', text: 'Не следиме просечно работно време на квартално ниво', isCorrect: false }
    ],
    recommendation: 'Вкупното работно време (редовно + прекувремено) просечно не смее да надмине 48 часа неделно во период од 3 месеца. Редовно проверувајте ги евиденциите на квартална основа.'
  },
  {
    id: 'q60',
    category: 'working_time',
    text: 'Имате работни места со зголемена бучавост и хемиски испарувања. Дали сте проверувале дали овие работни места бараат скратено работно време?',
    article: 'Член 122-а од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_assessed', text: 'Да, направивме проценка и побаравме одобрение од министерството каде е потребно', isCorrect: true },
      { value: 'no_such_conditions', text: 'Немаме работни места со штетни услови', isCorrect: true },
      { value: 'not_applied', text: 'Знаеме дека треба, но не сме поднеле барање', isCorrect: false },
      { value: 'not_assessed', text: 'Не сме правеле проценка за ова', isCorrect: false }
    ],
    recommendation: 'За работни места со тешки, напорни или штетни услови, потребно е да поднесете барање до Министерството за труд за утврдување скратено работно време. Потребен е елаборат и мислење од медицина на трудот.'
  },
  {
    id: 'q61',
    category: 'working_time',
    text: 'Поради зголемен обем на работа, решивте привремено да го прераспределите работното време (некои денови по 10 часа, некои по 6). Дали ги известувате работниците писмено?',
    article: 'Член 123 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_written', text: 'Да, писмено ги известуваме најмалку еден ден однапред', isCorrect: true },
      { value: 'verbal', text: 'Усно им кажуваме за промените', isCorrect: false },
      { value: 'posted', text: 'Го ставаме новиот распоред на огласна табла без лично известување', isCorrect: false },
      { value: 'no_redistribution', text: 'Немаме прераспределба на работно време', isCorrect: true }
    ],
    recommendation: 'При привремена прераспределба на работното време, работодавачот мора писмено да го извести секој засегнат работник најмалку еден ден однапред. Усното известување или огласна табла не се доволни.'
  },
  {
    id: 'q62',
    category: 'working_time',
    text: 'Вработен донесе дознака за боледување за 10 дена поради настинка. Како го пресметувате надоместокот?',
    article: 'Член 112 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'correct_70', text: '70% од основицата за плата - боледување поради општа болест, на товар на работодавачот (првите 30 дена)', isCorrect: true },
      { value: 'full_pay', text: '100% од платата, исто како да работел', isCorrect: false },
      { value: 'no_pay', text: 'Не плаќаме за боледување - тоа е на товар на Фондот од прв ден', isCorrect: false },
      { value: 'half_pay', text: '50% од платата', isCorrect: false }
    ],
    recommendation: 'За боледување поради општа болест, надоместокот е 70% од основицата, а за повреда на работа или професионална болест 100%. Првите 30 дена се на товар на работодавачот, потоа преку Фондот за здравствено осигурување.'
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
    text: 'Работник кој работи 8-часовна смена ви кажува дека менаџерот не му дозволува да земе пауза бидејќи има многу работа. Каква е вашата реакција?',
    article: 'Член 132 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'enforce_break', text: 'Интервенираме - паузата од 30 минути е задолжителна и не може да се одбие', isCorrect: true },
      { value: 'manager_decides', text: 'Менаџерот одлучува - ако е зафатено, може да се прескокне паузата', isCorrect: false },
      { value: 'end_of_day', text: 'Му дозволуваме да замине 30 минути порано наместо пауза', isCorrect: false },
      { value: 'less_than_6h', text: 'Нашите работници работат помалку од 6 часа, па ова не се однесува на нас', isCorrect: true }
    ],
    recommendation: 'Паузата е задолжителна: 30 минути за работен ден од 6+ часа. Таа мора да се искористи по првите 2 часа работа и не може да биде на почетокот или крајот на работниот ден. Менаџер кој ја одбива ја крши законската обврска.'
  },
  {
    id: 'q65',
    category: 'rest_breaks',
    text: 'Во период на зголемена побарувачка, вработен работел 12 дена без ден одмор. Дали ова е проблематично?',
    article: 'Член 134 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_violation', text: 'Да, секој работник мора да има неделен одмор од најмалку 24 часа + 12 часа дневен одмор', isCorrect: true },
      { value: 'ok_paid', text: 'Не, ако му е платено прекувремено е во ред', isCorrect: false },
      { value: 'ok_compensatory', text: 'Во ред е ако му дадеме компензаторни денови подоцна', isCorrect: true },
      { value: 'never_happens', text: 'Кај нас никој не работи повеќе од 6 дена по ред', isCorrect: true }
    ],
    recommendation: 'Неделен одмор од 24 часа + 12 часа дневен одмор (вкупно 36 часа непрекинато) е задолжителен. Ако работникот работи на неделен одмор, мора да добие компензаторен одмор друг ден И зголемена плата.'
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
    text: 'Вработен ви предлага: „Нека ми ги платите неискористените денови одмор наместо да одам на одмор." Дали смеете да го прифатите ова?',
    article: 'Член 141 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no_forbidden', text: 'Не, законот забранува замена на годишен одмор со парична компензација за време на работниот однос', isCorrect: true },
      { value: 'yes_agreement', text: 'Да, ако двајцата се согласиме може', isCorrect: false },
      { value: 'yes_partial', text: 'Може за денови над минималните 20', isCorrect: false },
      { value: 'yes_written', text: 'Да, ако работникот тоа го побара писмено', isCorrect: false }
    ],
    recommendation: 'Работникот не може да се откаже од годишниот одмор. Паричната компензација за неискористен одмор е дозволена САМО при престанок на работниот однос. За време на траење на работниот однос, одморот мора да се искористи.'
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
    text: 'Имате работник (над 57 години) или родител на дете со попреченост. Дали му обезбедувате зголемен годишен одмор?',
    article: 'Член 137 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_provided', text: 'Да, ги идентификувавме таквите работници и им доделуваме дополнителни денови', isCorrect: true },
      { value: 'no_such', text: 'Немаме работници кои спаѓаат во овие категории', isCorrect: true },
      { value: 'not_checked', text: 'Не сме проверувале дали некој работник има право на зголемен одмор', isCorrect: false },
      { value: 'same_for_all', text: 'Сите добиваат исто - не правиме разлика', isCorrect: false }
    ],
    recommendation: 'Повозрасни работници, лица со инвалидност (60%+ телесно оштетување) и родители на деца со пречки во развојот имаат законско право на зголемен годишен одмор. Проверете ги вашите работници.'
  },
  {
    id: 'q70',
    category: 'rest_breaks',
    text: 'Вработен бара годишниот одмор да го искористи во 5 кратки делови по 4 дена. Дали мора да го одобрите во таква форма?',
    article: 'Член 141 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'partial_ok', text: 'Може да се дели, но еден дел мора да трае најмалку 2 непрекинати работни недели', isCorrect: true },
      { value: 'full_freedom', text: 'Работникот одлучува - може да го дели како сака', isCorrect: false },
      { value: 'employer_decides', text: 'Работодавачот одлучува - може да го одбиеме целосно', isCorrect: false },
      { value: 'no_splitting', text: 'Одморот мора да се искористи одеднаш, не може да се дели', isCorrect: false }
    ],
    recommendation: 'Годишниот одмор може да се дели на делови по договор со работодавачот, но еден дел мора да трае најмалку 2 непрекинати работни недели. Работодавачот не може да инсистира одморот да се зема само во кратки периоди.'
  },
  {
    id: 'q71',
    category: 'rest_breaks',
    text: 'На вработен му се родило дете и бара платено отсуство од 3 дена. Како постапувате?',
    article: 'Член 146 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'approve_paid', text: 'Му одобруваме платено отсуство - тоа е законско право до 7 дена годишно за семејни настани', isCorrect: true },
      { value: 'annual_leave', text: 'Му кажуваме да земе денови од годишниот одмор', isCorrect: false },
      { value: 'unpaid', text: 'Му одобруваме отсуство, но без плата', isCorrect: false },
      { value: 'deny', text: 'Не одобруваме - може да дојде на работа и да го слави после работно време', isCorrect: false }
    ],
    recommendation: 'Платено отсуство до 7 работни дена годишно е законско право за: раѓање на дете (татко), склучување брак, смрт на близок роднина. Не може да се одбие ниту да се замени со годишен одмор.'
  },
  {
    id: 'q72',
    category: 'rest_breaks',
    text: 'Вработен бара 3 месеци неплатено отсуство за лични причини. Го одобрувате. Дали го документирате формално?',
    article: 'Член 147 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'yes_documented', text: 'Да, со писмена одлука за неплатено отсуство и мирување на права и обврски', isCorrect: true },
      { value: 'verbal', text: 'Само усно се договоривме - нема потреба од документација', isCorrect: false },
      { value: 'no_unpaid', text: 'Не дозволуваме неплатено отсуство', isCorrect: true },
      { value: 'no_such_cases', text: 'Немаме имале вакви барања', isCorrect: true }
    ],
    recommendation: 'За време на неплатеното отсуство мируваат правата и обврските на работникот (социјално осигурување, стаж). Ова мора да биде писмено документирано за правна сигурност на двете страни.'
  },
  {
    id: 'q73',
    category: 'rest_breaks',
    text: 'Вработен оди на обука за нов софтвер што вие го воведувате. Бара платено отсуство за 2 дена обука. Како постапувате?',
    article: 'Член 143 став 1 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'approve_paid', text: 'Му одобруваме платено отсуство - обуката е во интерес на работодавачот', isCorrect: true },
      { value: 'annual_leave', text: 'Му бараме да користи годишен одмор за обуката', isCorrect: false },
      { value: 'unpaid', text: 'Му одобруваме отсуство, но без плата', isCorrect: false },
      { value: 'no_training', text: 'Не го испраќаме на обуки', isCorrect: true }
    ],
    recommendation: 'Кога обуката, преквалификацијата или усовршувањето е во интерес на работодавачот, работникот има право на платено отсуство. Ако работникот сам одлучил да се школува без врска со работата, ова правило не важи.'
  },
  {
    id: 'q74',
    category: 'rest_breaks',
    text: 'Вработен бил на годишен одмор 2 недели, но во текот на одморот се разболел и донел дознака за 5 дена боледување. Дали тие 5 дена се засметуваат во годишниот одмор?',
    article: 'Член 138 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'no_excluded', text: 'Не, деновите на боледување не се засметуваат - му следуваат уште 5 дена одмор', isCorrect: true },
      { value: 'yes_included', text: 'Да, одморот тече без разлика на боледувањето', isCorrect: false },
      { value: 'depends', text: 'Зависи од тежината на болеста', isCorrect: false },
      { value: 'employer_decides', text: 'Работодавачот одлучува дали ќе ги признае', isCorrect: false }
    ],
    recommendation: 'Деновите на боледување, државни празници и неработни денови НЕ се засметуваат во годишниот одмор. Ако работникот се разболи за време на одмор и достави дознака, има право на дополнителни денови одмор.'
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
    text: 'Вработен заминува од фирмата и му остануваат 12 неискористени дена годишен одмор. Дали му исплатувате компензација?',
    article: 'Член 140 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_always', text: 'Да, секогаш пресметуваме и исплатуваме парична компензација за неискористените денови', isCorrect: true },
      { value: 'only_if_asked', text: 'Само ако работникот изречно побара', isCorrect: false },
      { value: 'no_obligation', text: 'Не, неискористениот одмор пропаѓа при заминување', isCorrect: false },
      { value: 'no_terminations', text: 'Немаме имале прекин на работен однос', isCorrect: true }
    ],
    recommendation: 'При секој престанок на работниот однос, работодавачот мора да исплати парична компензација за СИТЕ неискористени денови годишен одмор. Ова е автоматска обврска - не зависи од тоа дали работникот ќе побара.'
  },

  // ===== НОВИ ПРАШАЊА - РАБОТНО ВРЕМЕ И ОДМОР (q96-q101) =====
  {
    id: 'q96',
    category: 'working_time',
    text: 'Имате над 25 вработени. Дали водите електронска евиденција на работното време (влез/излез на работниците)?',
    article: 'Член 116-а од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_electronic', text: 'Да, имаме електронски систем за евиденција на работно време', isCorrect: true },
      { value: 'manual', text: 'Водиме рачна евиденција во тетратка или табела', isCorrect: false },
      { value: 'under_25', text: 'Имаме помалку од 25 вработени', isCorrect: true },
      { value: 'no_records', text: 'Не водиме евиденција за работно време', isCorrect: false }
    ],
    recommendation: 'Работодавачи со над 25 вработени се должни да водат ЕЛЕКТРОНСКА евиденција на работното време. Рачната евиденција не е доволна. Ова е услов за валидна документација при инспекциски надзор.'
  },
  {
    id: 'q97',
    category: 'working_time',
    text: 'Вработен добил писмена наредба за прекувремена работа, но одбива да остане. Дали може да одбие?',
    article: 'Член 117 став 4 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.NONE,
    options: [
      { value: 'generally_no', text: 'Генерално не може да одбие ако е уредно наредена, освен ако е бремена, има дете под 7 год. или здравствени причини', isCorrect: true },
      { value: 'always_can', text: 'Да, прекувремената е секогаш доброволна', isCorrect: false },
      { value: 'never_can', text: 'Не, никој не може да одбие прекувремена работа', isCorrect: false },
      { value: 'no_overtime', text: 'Не наредуваме прекувремена работа', isCorrect: true }
    ],
    recommendation: 'Прекувремената работа е обврска на работникот кога е уредно наредена. Исклучок: бремени работнички, родители на деца под 7 години и лица со здравствени ограничувања можат да ја одбијат. За нив е потребна писмена согласност.'
  },
  {
    id: 'q98',
    category: 'rest_breaks',
    text: 'Вработен работи кај вас од 1 април. Бара годишен одмор во јуни - 5 месеци не поминале од вработувањето. Дали му следува одмор?',
    article: 'Член 137 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'proportional', text: 'Да, му следува пропорционален дел - 2 дена за секој месец работа', isCorrect: true },
      { value: 'must_wait', text: 'Не, мора да работи 6 месеци пред да стекне право на одмор', isCorrect: false },
      { value: 'full_leave', text: 'Да, му следуваат целите 20 дена веднаш', isCorrect: false },
      { value: 'no_leave_first_year', text: 'Во првата година нема право на годишен одмор', isCorrect: false }
    ],
    recommendation: 'Работникот стекнува право на пропорционален дел од годишниот одмор по 1 месец непрекинат работен однос (2 дена за секој месец). По 6 месеци стекнува право на целосен годишен одмор.'
  },
  {
    id: 'q99',
    category: 'rest_breaks',
    text: 'До крај на годината, вработен не го искористил целиот годишен одмор поради голем обем на работа. Дали пропаѓаат неискористените денови?',
    article: 'Член 141 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'carry_over', text: 'Не, се пренесуваат во наредната година и мора да се искористат до 30 јуни', isCorrect: true },
      { value: 'lost', text: 'Да, неискористените денови пропаѓаат со завршување на годината', isCorrect: false },
      { value: 'paid_out', text: 'Не, му ги исплатуваме паричен надоместок наместо одмор', isCorrect: false },
      { value: 'unlimited', text: 'Може да ги пренесе без временско ограничување', isCorrect: false }
    ],
    recommendation: 'Неискористениот годишен одмор се пренесува во наредната година и мора да се искористи најдоцна до 30 јуни. Ако работодавачот е причина за неискористувањето, тој сноси одговорност. Не е дозволена парична замена за време на работниот однос.'
  },
  {
    id: 'q100',
    category: 'working_time',
    text: 'Вработен е распореден да работи во недела. Дали покрај зголемената плата му обезбедувате и компензаторен ден за одмор?',
    article: 'Член 134 став 3 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes_both', text: 'Да, и зголемена плата и компензаторен ден за одмор во текот на неделата', isCorrect: true },
      { value: 'pay_only', text: 'Само зголемена плата, без компензаторен ден', isCorrect: false },
      { value: 'day_only', text: 'Само компензаторен ден, без зголемена плата', isCorrect: false },
      { value: 'no_sunday', text: 'Не работиме во недела', isCorrect: true }
    ],
    recommendation: 'Работникот кој работи во ден на неделен одмор има право на: 1) зголемена плата согласно колективен договор, И 2) компензаторен ден за одмор во текот на наредната недела. Двете права се кумулативни.'
  },
  {
    id: 'q101',
    category: 'rest_breaks',
    text: 'Работник кој работи 4,5 часа дневно (неполно работно време) бара пауза. Дали му следува?',
    article: 'Член 132 став 2 од Законот за работните односи',
    type: ANSWER_TYPES.CHOICE,
    weight: 0.5,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes_15min', text: 'Да, 15-минутна пауза (за работен ден од 4 до 6 часа)', isCorrect: true },
      { value: 'no_parttime', text: 'Не, работниците со неполно работно време немаат право на пауза', isCorrect: false },
      { value: 'yes_30min', text: 'Да, 30-минутна пауза како и останатите', isCorrect: false },
      { value: 'no_parttime_workers', text: 'Немаме вработени со неполно работно време', isCorrect: true }
    ],
    recommendation: 'Работник со работен ден од 4 до 6 часа има право на 15-минутна пауза. За 6+ часа, паузата е 30 минути. Работниците со неполно работно време не се исклучени од ова право.'
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
