// Public teaser screening — „Бесплатна проверка" (master-plan Phase 1.1).
//
// 10 curated yes/no questions distilled from the full LHC screenings
// (employment, GDPR, health & safety). Evaluated ONLY server-side — the
// public endpoint must never leak correctAnswer to the browser.
//
// Each question carries the gap presentation for the results page:
//   gapTitle — short name of what's missing
//   risk     — consequence line (sanction ranges follow data/lhc sanction tables)
//   fix      — how Nexa solves it (label shown as a chip; no deep link needed,
//              the funnel CTA is registration).

const SEVERITY = { HIGH: 'high', MEDIUM: 'medium', ADVISORY: 'advisory' };

const questions = [
  {
    id: 't1',
    text: 'Дали со сите ангажирани лица имате склучено писмен договор за вработување?',
    article: 'Член 13 од Законот за работните односи',
    correctAnswer: 'yes',
    severity: SEVERITY.HIGH,
    weight: 2,
    gapTitle: 'Недостасуваат писмени договори за вработување',
    risk: 'Единствен пропуст за кој инспекторот изрекува директна прекршочна мерка — глоба 500–1.000 € за работодавачот и 250 € за одговорното лице.',
    fix: 'Договор за вработување — автоматизиран шаблон во Nexa'
  },
  {
    id: 't2',
    text: 'Дали сите вработени се пријавени во задолжително социјално осигурување најдоцна на денот на почеток со работа?',
    article: 'Член 13 став 2 од Законот за работните односи',
    correctAnswer: 'yes',
    severity: SEVERITY.HIGH,
    weight: 2,
    gapTitle: 'Непријавени вработени во социјално осигурување',
    risk: 'Тешка повреда при инспекциски надзор — прекршочна санкција и обврска за ретроактивна уплата на придонеси.',
    fix: 'Правна проверка на работните односи во Nexa — чекор по чекор'
  },
  {
    id: 't3',
    text: 'Дали на секој вработен му е врачен примерок од договорот на денот на потпишување?',
    article: 'Член 15 од Законот за работните односи',
    correctAnswer: 'yes',
    severity: SEVERITY.MEDIUM,
    weight: 1,
    gapTitle: 'Договорите не се врачени на вработените',
    risk: 'Прекршочна одредба — глоба 200–400 € за работодавачот при надзор.',
    fix: 'Проверка на работните односи во Nexa со приоритизиран извештај'
  },
  {
    id: 't4',
    text: 'Дали имате интерен акт за организација и систематизација на работните места?',
    article: 'Член 19 од Законот за работните односи',
    correctAnswer: 'yes',
    severity: SEVERITY.MEDIUM,
    weight: 1,
    gapTitle: 'Нема акт за организација и систематизација',
    risk: 'Без систематизација, распоредувањето и отказите се правно ранливи во спор.',
    fix: 'Акт за организација и систематизација — автоматизиран шаблон во Nexa'
  },
  {
    id: 't5',
    text: 'Дали на вработените им издавате решенија за користење на годишен одмор?',
    article: 'Членови 137–147 од Законот за работните односи',
    correctAnswer: 'yes',
    severity: SEVERITY.MEDIUM,
    weight: 1,
    gapTitle: 'Не се издаваат решенија за годишен одмор',
    risk: 'Прекршочна одредба и чест наод при инспекциски надзор на работните односи.',
    fix: 'Одлука за годишен одмор — автоматизиран шаблон во Nexa'
  },
  {
    id: 't6',
    text: 'Дали имате Правилник за заштита на личните податоци и водите евиденции за обработка?',
    article: 'Закон за заштита на личните податоци',
    correctAnswer: 'yes',
    severity: SEVERITY.HIGH,
    weight: 2,
    gapTitle: 'Нема правилник и евиденции за лични податоци',
    risk: 'АЗЛП изрекува санкции до 2% од годишниот приход за потешки повреди.',
    fix: 'GDPR пакет во Nexa — правилник, политики и евиденции'
  },
  {
    id: 't7',
    text: 'Дали земате согласност за обработка на лични податоци од вработените и клиентите каде што е потребна?',
    article: 'Закон за заштита на личните податоци',
    correctAnswer: 'yes',
    severity: SEVERITY.MEDIUM,
    weight: 1,
    gapTitle: 'Недостасуваат согласности за обработка на податоци',
    risk: 'Обработка без правен основ е директна повреда на ЗЗЛП.',
    fix: 'Согласност за обработка на лични податоци — шаблон во Nexa'
  },
  {
    id: 't8',
    text: 'Дали имате изјава за безбедност со проценка на ризик на работните места?',
    article: 'Член 11 од Законот за безбедност и здравје при работа',
    correctAnswer: 'yes',
    severity: SEVERITY.HIGH,
    weight: 2,
    gapTitle: 'Нема изјава за безбедност и проценка на ризик',
    risk: 'Задолжителен документ за секој работодавач — прекршочна санкција при надзор на трудовата инспекција.',
    fix: 'Проверка за безбедност и здравје при работа во Nexa'
  },
  {
    id: 't9',
    text: 'Дали пред откажување на договор поради вина на работникот издавате писмена опомена?',
    article: 'Член 73 од Законот за работните односи',
    correctAnswer: 'yes',
    severity: SEVERITY.MEDIUM,
    weight: 1,
    gapTitle: 'Отказите не се спроведуваат преку пропишана постапка',
    risk: 'Отказ без претходна опомена најчесто паѓа на суд — враќање на работа + надомест на плати.',
    fix: 'Опомена пред откажување и целосна отказна документација во Nexa'
  },
  {
    id: 't10',
    text: 'Дали со вработените и надворешните соработници склучувате договори за доверливост (NDA)?',
    article: 'Заштита на деловна тајна — Закон за работните односи и ЗЗЛП',
    correctAnswer: 'yes',
    severity: SEVERITY.ADVISORY,
    weight: 1,
    gapTitle: 'Деловните тајни не се договорно заштитени',
    risk: 'Без NDA, заштитата на know-how и клиентски листи во спор е значително послаба.',
    fix: 'Договор за доверливост (NDA) — автоматизиран шаблон во Nexa'
  }
];

const gradeConfig = [
  { min: 90, label: 'Одлична усогласеност',      class: 'excellent' },
  { min: 70, label: 'Добра усогласеност',        class: 'good' },
  { min: 50, label: 'Делумна усогласеност',      class: 'partial' },
  { min: 0,  label: 'Ниска усогласеност',        class: 'low' }
];

module.exports = { questions, gradeConfig, SEVERITY };
