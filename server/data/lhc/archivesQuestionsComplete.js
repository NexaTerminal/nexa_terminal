// Archives Law / Office & Archival Operations — Compliance Questionnaire
// Material law: Закон за архивски материјал и архивска дејност (Сл. весник 135/2025; примена од 01.06.2026).
// Operational standard: Упатство за канцелариско и архивско работење (Сл. весник 99/2014).
// Target profile: standard private companies (имател по Член 30, not "од посебен интерес").

const ANSWER_TYPES = {
  YES_NO: 'yes_no',
  YES_NO_NA: 'yes_no_na',
  YES_PARTIAL_NO: 'yes_partial_no',
  CHOICE: 'choice'
};

const SANCTION_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'none'
};

const questions = [
  // ─── ДЕЛ 0 · Применливост ────────────────────────────────────────────
  {
    id: 'q0_2',
    category: 'applicability',
    text: 'Дали Државниот архив со решение Ве определил како имател „од посебен интерес за државата"?',
    article: 'Закон Член 27, 28, 59',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'no',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'no',      label: 'Не / стандарден случај' },
      { value: 'partial', label: 'Не сме сигурни' },
      { value: 'yes',     label: 'Да — определени сме' }
    ],
    recommendation: 'Ако сте определени како имател „од посебен интерес", за Вас се применуваат построги обврски и прекршочни одредби од Член 59 (правно лице 500–1.000 €). Направете посебна детална проценка и контактирајте го Државниот архив за упатства.'
  },

  // ─── ДЕЛ 1 · Основни акти ────────────────────────────────────────────
  {
    id: 'q1',
    category: 'acts_lists',
    text: 'Дали имате и применувате план на архивски знаци + листа на архивски материјал + листа на документарен материјал со рокови на чување?',
    article: 'Закон Член 30 ст.1; Упатство Член 5, Прилози 1–3',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — сите три и се применуваат' },
      { value: 'partial', label: 'Делумно' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Изработете ги трите акти: план на архивски знаци (општ дел 01–07 + посебен дел 08+), листа на архивски материјал и листа на документарен материјал со рокови. Без нив, инспекторот може да издаде решение со рок 7–15 дена за исправка (Член 56).'
  },
  {
    id: 'q2',
    category: 'acts_lists',
    text: 'Дали планот на архивски знаци го следи стандардниот општ дел 01–07 (Основање, Управување, Канцелариско-правни, ЧР, Финансиско, Безбедност, Електронски систем) плус посебен дел 08+?',
    article: 'Упатство Член 5, Прилог 1',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — структуриран 01–07 + посебен дел' },
      { value: 'partial', label: 'Делумно / нестандардна структура' },
      { value: 'no',      label: 'Не / немаме план' }
    ],
    recommendation: 'Општиот дел 01–07 е унифициран за сите иматели; посебниот дел (08+) го пишувате според Вашата дејност. Усогласете го планот со прилог 1 на Упатството.'
  },
  {
    id: 'q3',
    category: 'acts_lists',
    text: 'Дали Вашите рокови на чување соодветствуваат со стандардните (плати/кадровски досиеја 45 год., сметководство 10 год., договори 10 год., преписка 1 год.)?',
    article: 'Упатство Прилог 3',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — усогласени со стандардните рокови' },
      { value: 'partial', label: 'Делумно / не за сите видови' },
      { value: 'no',      label: 'Не — немаме дефинирани рокови' }
    ],
    recommendation: 'Усогласете ги роковите со прилог 3 на Упатството. Клучни рокови: исплатни листи и досиеја на вработени — 45 год.; сметководствени и даночни документи — 10 год.; договори — 10 год.; информативна преписка — 1 год.'
  },

  // ─── ДЕЛ 2 · Писарница и дневна евиденција ───────────────────────────
  {
    id: 'q4',
    category: 'office_evidence',
    text: 'Дали водите деловодник (основна книга на евиденција) со основни броеви и подброеви, заклучуван на крајот на годината?',
    article: 'Закон Член 30 ст.1; Упатство Член 8–11',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — уреден деловодник' },
      { value: 'partial', label: 'Делумно / неформална евиденција' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Воведете деловодник со основни броеви и подброеви; заклучете го на 31 декември. Деловодникот е основната алатка за следење на сите влезни и излезни документи.'
  },
  {
    id: 'q5',
    category: 'office_evidence',
    text: 'Дали на влезните документи ставате приемен штембил и роковен штембил (со четирицифрен архивски знак и рок на чување)?',
    article: 'Упатство Член 6 (Образец 1 и 2)',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — двата штембили' },
      { value: 'partial', label: 'Делумно (само приемен / нередовно)' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'На секој влезен документ ставете приемен штембил (датум и заводен број) и роковен штембил (архивски знак + рок на чување според листите). Тоа е минималната механика на писарницата.'
  },
  {
    id: 'q6',
    category: 'office_evidence',
    text: 'Дали со интерен акт сте утврдиле одговорност за канцелариско и архивско работење (организациска единица или едно овластено лице ако сте под 30 вработени)?',
    article: 'Закон Член 30 ст.2,3',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — единица или овластено лице' },
      { value: 'partial', label: 'Делумно — без формален акт' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Со одлука именувајте организациска единица, или ако сте под 30 вработени, едно овластено лице. Внатрешниот акт мора јасно да ги дефинира одговорностите.'
  },
  {
    id: 'q7',
    category: 'office_evidence',
    text: 'Дали решените предмети ги разведувате (ознака „а/а") со архивски знак и рок на чување пред да се архивираат?',
    article: 'Упатство Член 22, 23',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.LOW,
    options: [
      { value: 'yes',     label: 'Да' },
      { value: 'partial', label: 'Делумно' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Разведете ги решените предмети со ознака „а/а", архивски знак и рок на чување. Тоа е чекор пред архивирање и обезбедува правилно одбирање во иднина.'
  },

  // ─── ДЕЛ 3 · Архива и услови за чување ───────────────────────────────
  {
    id: 'q8',
    category: 'archive_storage',
    text: 'Во архивата, дали архивскиот материјал го чувате одвоено од документарниот (посебни папки), сложено во архивски кутии, со означено (испраќач, година, архивски знак, реден број)?',
    article: 'Упатство Член 26',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да' },
      { value: 'partial', label: 'Делумно' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Одвојте го архивскиот од документарниот материјал. Користете архивски кутии и означете секоја со испраќач, година, архивски знак и реден број.'
  },
  {
    id: 'q9',
    category: 'archive_storage',
    text: 'Дали материјалот се чува во заклучен/контролиран простор, заштитен од влага, висока температура, директна сончева светлина и пожар, со пристап само за овластени лица?',
    article: 'Закон Член 6, 7; Упатство Член 34, 36–39',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes',     label: 'Да' },
      { value: 'partial', label: 'Делумно' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Архивата мора да биде заклучен простор со огноотпорност ≥60 мин, систем за дојава на пожар, контролиран пристап и заштита од влага, висока температура и сончева светлина. Небезбедно чување е сериозен ризик при инспекциски надзор.'
  },
  {
    id: 'q10',
    category: 'archive_storage',
    text: 'Колку Вашите услови за чување (простор, влага/температура, противпожарна заштита, контрола на пристап, ред) ги исполнуваат стандардите?',
    article: 'Закон Член 6, 7; Упатство Член 34–41',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Високо — ги исполнуваме сите стандарди' },
      { value: 'partial', label: 'Средно — постојат недостатоци' },
      { value: 'no',      label: 'Ниско — имаме сериозни недостатоци' }
    ],
    recommendation: 'Направете проверка по контролна листа: огноотпорност на простор, климатски услови, контрола на пристап, поставеност на полиците. Документирајте мерките во интерниот акт за канцелариско работење.'
  },
  {
    id: 'q11',
    category: 'archive_storage',
    text: 'При издавање документи од архивата (за работа/позајмица), дали користите реверс и водите книга за реверси?',
    article: 'Упатство Член 26',
    type: ANSWER_TYPES.YES_NO_NA,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.LOW,
    options: [
      { value: 'yes', label: 'Да' },
      { value: 'no',  label: 'Не / неформално' },
      { value: 'na',  label: 'Не издаваме документи (N/A)' }
    ],
    recommendation: 'Воведете образец на реверс и книга за реверси за секое издавање документ од архивата. Тоа обезбедува следливост и враќање на материјалот.'
  },

  // ─── ДЕЛ 4 · Електронски документи ───────────────────────────────────
  {
    id: 'q12',
    category: 'electronic_docs',
    text: 'Дали електронските документи ги чувате во изворна/трајна форма, а софтверот за работа ги вградува елементите за канцелариско и архивско работење?',
    article: 'Закон Член 8, 23 ст.1; Упатство Член 24, 31',
    type: ANSWER_TYPES.YES_NO_NA,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes', label: 'Да' },
      { value: 'no',  label: 'Не / делумно' },
      { value: 'na',  label: 'Немаме електронски документи (N/A)' }
    ],
    recommendation: 'Чувајте ги електронските документи во изворна форма (PDF/A, оригинален формат). Софтверот мора да го поддржува уникатно нумерирање, архивски знак и рок на чување за секој документ.'
  },
  {
    id: 'q13',
    category: 'electronic_docs',
    text: 'Каде што е применливо, дали електронските документи се потпишани со електронски потпис/печат согласно прописите за доверливи услуги?',
    article: 'Закон Член 23 ст.3',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да' },
      { value: 'partial', label: 'Делумно' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'За документи со правен ефект, употребете електронски потпис/печат од овластен издавач (квалификуван сертификат). Без потпис документот може да биде оспорен во постапка.'
  },
  {
    id: 'q14',
    category: 'electronic_docs',
    text: 'Дали електронскиот материјал е заштитен од неовластен пристап, бришење, менување и губење, а серверската/наменската просторија ги исполнува условите (контролиран пристап, противпожарна заштита, климатски услови, одвоена од архивата)?',
    article: 'Закон Член 23 ст.6; Упатство Член 35, 41',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да' },
      { value: 'partial', label: 'Делумно' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Воведете контрола на пристап (RBAC), логирање, енкрипција и физичка заштита на серверот. Серверската просторија мора да биде одвоена од архивата и да ги исполнува климатските и противпожарните услови.'
  },
  {
    id: 'q15',
    category: 'electronic_docs',
    text: 'Колку е зрел Вашиот систем за резервни копии (backup), миграција и ИТ-безбедност на документацијата?',
    article: 'Закон Член 23 ст.6; Упатство Прилог 1 (0702)',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Високо — редовни backup, миграција и тестирање' },
      { value: 'partial', label: 'Средно — повремени backup, без план за миграција' },
      { value: 'no',      label: 'Ниско — нема систем за backup' }
    ],
    recommendation: 'Воведете дневни/неделни резервни копии, чувајте копија на одвоена локација и редовно тестирајте враќање. Подгответе план за миграција на старите формати кон поддржани.'
  },

  // ─── ДЕЛ 5 · Одбирање и уништување ───────────────────────────────────
  {
    id: 'q16',
    category: 'selection_destruction',
    text: 'Дали редовно вршите одбирање (одвојување на архивскиот од документарниот материјал) според листите — при одлагање или комисиски?',
    article: 'Закон Член 30; Упатство Член 27',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — редовно' },
      { value: 'partial', label: 'Повремено / неформално' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Спроведувајте годишно одбирање според листите. Формирајте комисија (3 лица) која ќе го одвои архивскиот од документарниот материјал.'
  },
  {
    id: 'q17',
    category: 'selection_destruction',
    text: 'Пред уништување, дали изготвувате Попис на документарен материјал за уништување и потврдувате дека рокот изминал и дека внатре нема архивски материјал?',
    article: 'Упатство Член 30 (Образец 10)',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — секогаш со попис' },
      { value: 'partial', label: 'Понекогаш' },
      { value: 'no',      label: 'Не — фрламе без попис' }
    ],
    recommendation: 'Користете го Образец 10 — Попис на документарен материјал за уништување. Комисијата потврдува дека роковите се изминати и дека во делумно нема материјал со трајна вредност.'
  },
  {
    id: 'q18',
    category: 'selection_destruction',
    text: 'Дали обезбедувате дека материјалот со трајна вредност (архивски) никогаш не се уништува?',
    article: 'Закон Член 6 ст.1',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes',     label: 'Да' },
      { value: 'partial', label: 'Делумно / не сме сигурни што е трајно' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Архивскиот материјал (со трајна вредност) НИКОГАШ не се уништува. Уништувањето трајна архива е една од најсериозните повреди и може да повлече прекршочна постапка.'
  },
  {
    id: 'q19',
    category: 'selection_destruction',
    text: 'При уништување, дали преземате мерки за заштита на личните податоци на засегнатите лица (физичко уништување без можност за реконструкција)?',
    article: 'Закон Член 20 ст.9',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да' },
      { value: 'partial', label: 'Делумно' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Користете уништувач (shredder) за хартиена документација и сигурно бришење за електронските податоци. Документирајте го процесот за докажливост.'
  },

  // ─── ДЕЛ 6 · Располагање и престанок ─────────────────────────────────
  {
    id: 'q20',
    category: 'disposition_cessation',
    text: 'Дали почитувате дека материјалот НЕ смее да се отуѓува или отстапува на странски физички и правни лица?',
    article: 'Закон Член 31 ст.2',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes',     label: 'Да — целосно' },
      { value: 'partial', label: 'Делумно свесни' },
      { value: 'no',      label: 'Не / веќе отстапено на странско лице' }
    ],
    recommendation: 'Архивскиот и документарниот материјал не смее да се пренесе во сопственост или на чување на странски лица без посебно одобрение. Отстапувањето кон странство е сериозна повреда.'
  },
  {
    id: 'q21',
    category: 'disposition_cessation',
    text: 'Имате ли план што се случува со документацијата при престанок, спојување или продажба (предавање на следбеник, документарен центар или понуда до Државниот архив)?',
    article: 'Закон Член 31',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.LOW,
    options: [
      { value: 'yes',     label: 'Да — имаме план' },
      { value: 'partial', label: 'Делумно' },
      { value: 'no',      label: 'Не сме размислувале' }
    ],
    recommendation: 'Документирајте процедура за управување со архивата при престанок/спојување/продажба. Архивскиот материјал се предава на следбеник или нудете го на Државниот архив.'
  },

  // ─── ДЕЛ 7 · Надзор и подготвеност ───────────────────────────────────
  {
    id: 'q22',
    category: 'supervision_readiness',
    text: 'Дали би овозможиле непречен инспекциски увид на овластени лица од Државниот архив?',
    article: 'Закон Член 54 ст.3; Член 56',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.HIGH,
    options: [
      { value: 'yes',     label: 'Да' },
      { value: 'partial', label: 'Со ограничувања' },
      { value: 'no',      label: 'Не' }
    ],
    recommendation: 'Инспекторот од Државниот архив има право на непречен увид. Спречување или ограничување на надзорот е сериозна повреда и може директно да повлече прекршочна постапка.'
  },
  {
    id: 'q23',
    category: 'supervision_readiness',
    text: 'Доколку добиете решение/наредба од инспектор, дали би постапиле во определениот рок?',
    article: 'Закон Член 56, 57',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.MEDIUM,
    options: [
      { value: 'yes',     label: 'Да — во рок' },
      { value: 'partial', label: 'Веројатно со задоцнување' },
      { value: 'no',      label: 'Не / не сме сигурни' }
    ],
    recommendation: 'Решенијата на инспекторот имаат рок од 7–15 дена за основни акти и до 12 месеци за останати недостатоци (Член 56). Игнорирањето води директно во прекршочна постапка.'
  },
  {
    id: 'q24',
    category: 'supervision_readiness',
    text: 'Колку сте подготвени за примената на законот од 1 јуни 2026 (план, листи, деловодник, штембили, одговорно лице, услови за чување, backup)?',
    article: 'Закон Член 68',
    type: ANSWER_TYPES.YES_PARTIAL_NO,
    correctAnswer: 'yes',
    weight: 1,
    sanctionLevel: SANCTION_LEVELS.LOW,
    options: [
      { value: 'yes',     label: 'Високо — целосно подготвени' },
      { value: 'partial', label: 'Средно — основните чекори се направени' },
      { value: 'no',      label: 'Ниско — сè уште не сме започнале' }
    ],
    recommendation: 'Подгответе временски план до 1 јуни 2026: трите акти → деловодник + штембили → именување одговорно лице → услови за чување → backup → пробно одбирање. Приоритизирајте го она што недостасува.'
  }
];

module.exports = questions;
