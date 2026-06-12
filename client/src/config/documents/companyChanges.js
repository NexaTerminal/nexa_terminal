/**
 * „Промени во фирма" (Централен регистар) — document package configuration.
 *
 * Dynamic package: the user checkboxes which changes they need (Step 1), enters
 * company + shareholder/manager data once (Step 2), fills only the fields for the
 * selected changes (Step 3, conditional), then agent/general data (Step 4) and a
 * review (Step 5). The backend assembles the matching documents into one .docx.
 *
 * Phase 1 modules: M1 Назив, M2 Седиште, M3 Лични податоци, M4 Управител,
 * M6 Уплата на влог, M7 Подружница. (M5 Пренос на удел = Phase 2, disabled.)
 *
 * NOTE: only "plain" fields carry a `step` tag and are rendered via getStepFields.
 * The change checkboxes, the shareholder/manager lists and the review are rendered
 * by custom components in CompanyChangesPage.js.
 */

/** Change modules shown as checkboxes in Step 1. */
export const CHANGE_OPTIONS = [
  { value: 'M1', label: 'Промена на назив (фирма)', helpText: 'Промена на полниот и скратениот назив на друштвото, како и називот во правниот промет со странство.' },
  { value: 'M2', label: 'Промена на седиште (адреса)', helpText: 'Промена на адресата на седиштето на друштвото.' },
  { value: 'M3', label: 'Промена на лични податоци', helpText: 'Промена на лични податоци (адреса на живеење, број на пасош/лична карта) на содружник и/или управител.' },
  { value: 'M4', label: 'Промена на управител', helpText: 'Отповикување и/или избор на управител, или промена на овластувања/мандат.' },
  { value: 'M6', label: 'Уплата на основачки влог', helpText: 'Уплата на основачкиот влог кога истиот не бил уплатен при основањето.' },
  { value: 'M7', label: 'Промена кај подружница', helpText: 'Промена на седиште или раководител на подружница.' },
  { value: 'M5', label: 'Пренос на удел', helpText: 'Истапување/пристапување на содружник, со или без надомест, целосен или делумен пренос на удел. Преносот задолжително се заверува кај нотар.' }
];

export const companyChangesConfig = {
  documentType: 'companyChanges',
  apiEndpoint: 'company-changes',
  fileName: null,

  initialFormData: {
    changes: [],
    companyForm: 'dooel',
    shareholdersList: [],
    managersList: [],
    city: 'Скопје'
  },

  steps: [
    { id: 1, title: 'Избор на промени', description: 'Изберете една или повеќе промени што сакате да ги впишете во Трговскiот регистар.', requiredFields: [] },
    { id: 2, title: 'Податоци за друштвото, содружници и управители', description: 'Основните податоци се предложени од вашиот профил — проверете ги и дополнете ги.', requiredFields: [] },
    { id: 3, title: 'Полиња по промена', description: 'Внесете ги податоците за избраните промени.', requiredFields: [] },
    { id: 4, title: 'Регистрационен агент и општи податоци', description: 'Податоци за адвокатот/агентот што ги поднесува документите и за одлуките.', requiredFields: [] },
    { id: 5, title: 'Преглед', description: 'Преглед на документите што ќе се генерираат.', requiredFields: [] }
  ],

  // arrayFields used by the PersonList component (Step 2)
  shareholdersList: {
    name: 'shareholdersList',
    label: 'Содружници',
    addLabel: '+ Додади содружник',
    helpText: 'Внесете ги сите содружници. Кај ДООЕЛ има точно еден содружник, кај ДОО два или повеќе. Податоците мора да одговараат со официјалните документи и со состојбата во Централниот регистар.',
    arrayFields: [
      { name: 'entityType', type: 'select', label: 'Тип', options: [ { value: 'physical', label: 'Физичко лице' }, { value: 'legal', label: 'Правно лице' } ], helpText: 'Изберете дали содружникот е физичко или правно лице.' },
      { name: 'name', type: 'text', label: 'Име и презиме / Назив', placeholder: 'пр. Петар Петров', helpText: 'Внесете го целосното име и презиме (за физичко лице) или целосниот назив (за правно лице).' },
      { name: 'isForeign', type: 'select', label: 'Странец', options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ], helpText: 'Дали лицето е странски државјанин/правно лице.' },
      { name: 'citizenship', type: 'text', label: 'Државјанство / Држава', placeholder: 'пр. Република Бугарија', helpText: 'Се пополнува само за странски лица — државјанство (физичко) или држава на регистрација (правно лице).' },
      { name: 'address', type: 'text', label: 'Адреса (живеалиште/седиште)', placeholder: 'пр. ул. Прва бр. 1, Скопје', helpText: 'Адреса на живеење (физичко лице) или седиште (правно лице).' },
      { name: 'idType', type: 'select', label: 'Документ', options: [ { value: 'ЕМБГ', label: 'ЕМБГ (13 цифри)' }, { value: 'пасош', label: 'Број на пасош' }, { value: 'ЕМБС', label: 'ЕМБС / рег. број' } ], helpText: 'ЕМБГ за домашни физички лица (13 цифри), број на пасош за странци, ЕМБС/рег. број за правни лица.' },
      { name: 'idNumber', type: 'text', label: 'Број', placeholder: 'пр. 1234567890123', helpText: 'Вредноста на избраниот документ. ЕМБГ е точно 13 цифри според личната карта.' },
      { name: 'sharePercent', type: 'text', label: 'Удел (%)', placeholder: 'пр. 100', helpText: 'Процентот на учество на содружникот во основната главнина. Кај ДОО се прикажува во содружничката структура во пречистениот текст.' },
      { name: 'isAlsoManager', type: 'select', label: 'Е и управител', options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ], helpText: 'Дали ова лице е воедно и управител на друштвото (влијае на изјавите и полномошната).' }
    ]
  },

  managersList: {
    name: 'managersList',
    label: 'Управители',
    addLabel: '+ Додади управител',
    helpText: 'Внесете ги управителите на друштвото. Управителот го застапува друштвото и ја дава изјавата по член 32.',
    arrayFields: [
      { name: 'name', type: 'text', label: 'Име и презиме', placeholder: 'пр. Петар Петров', helpText: 'Целосно име и презиме на управителот според личната карта.' },
      { name: 'isForeign', type: 'select', label: 'Странец', options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ], helpText: 'Дали управителот е странски државјанин.' },
      { name: 'citizenship', type: 'text', label: 'Државјанство', placeholder: 'пр. Република Бугарија', helpText: 'Се пополнува само за странски управители.' },
      { name: 'address', type: 'text', label: 'Адреса на живеење', placeholder: 'пр. ул. Прва бр. 1, Скопје', helpText: 'Адреса на живеење на управителот.' },
      { name: 'idType', type: 'select', label: 'Документ', options: [ { value: 'ЕМБГ', label: 'ЕМБГ (13 цифри)' }, { value: 'пасош', label: 'Број на пасош' } ], helpText: 'ЕМБГ за домашни лица, број на пасош за странци.' },
      { name: 'idNumber', type: 'text', label: 'Број', placeholder: 'пр. 1234567890123', helpText: 'Вредноста на избраниот документ.' }
    ]
  },

  // Plain fields rendered through getStepFields(step)
  fields: {
    // --- Step 2: company identity (prefilled from profile in the page) ---
    companyForm: {
      name: 'companyForm', type: 'select', label: 'Форма на друштво', step: 2, required: true,
      options: [ { value: 'dooel', label: 'ДООЕЛ (еден содружник)' }, { value: 'doo', label: 'ДОО (повеќе содружници)' } ],
      helpText: 'Изберете ја формата на друштвото. ДООЕЛ има еден содружник, ДОО има двајца или повеќе. Формата го одредува типот на одлуките и потписниците.'
    },
    companyFullName: {
      name: 'companyFullName', type: 'text', label: 'Полн назив на друштвото', step: 2, required: true,
      placeholder: 'пр. Друштво за трговија АМАКО НЕТ ДООЕЛ Скопје',
      helpText: 'Целосниот регистриран назив на друштвото како што е запишан во Централниот регистар. Предложено од вашиот профил — изменете доколку е потребно.'
    },
    companyShortName: {
      name: 'companyShortName', type: 'text', label: 'Скратен назив', step: 2,
      placeholder: 'пр. АМАКО НЕТ ДООЕЛ Скопје',
      helpText: 'Скратениот назив на друштвото. Го содржи клучниот бренд + формата (ДООЕЛ/ДОО) + градот.'
    },
    companyAddress: {
      name: 'companyAddress', type: 'text', label: 'Адреса на седиште (тековна)', step: 2, required: true,
      placeholder: 'пр. ул. Перо Наков бр. 126Б, Скопје',
      helpText: 'Тековната (досегашна) адреса на седиштето. Предложена од вашиот профил. При промена на седиште, новата адреса се внесува во чекор 3.'
    },
    companyEMBS: {
      name: 'companyEMBS', type: 'text', label: 'ЕМБС (матичен број)', step: 2, required: true,
      maxLength: 7, inputMode: 'numeric', placeholder: 'пр. 4918835',
      helpText: 'Единствен матичен број на субјектот — точно 7 цифри. Се користи само за идентификација и НИКОГАШ не се менува.'
    },
    companyEDB: {
      name: 'companyEDB', type: 'text', label: 'ЕДБ (даночен број)', step: 2, required: true,
      maxLength: 13, inputMode: 'numeric', placeholder: 'пр. 4030994340019',
      helpText: 'Единствен даночен број — 13 цифри. Предложен од вашиот профил. Се користи само за идентификација и НИКОГАШ не се менува.'
    },
    companyForeignName: {
      name: 'companyForeignName', type: 'text', label: 'Назив во правниот промет со странство (латиница)', step: 2,
      placeholder: 'пр. Company AMAKO NET DOOEL Skopje',
      helpText: 'Називот на друштвото на латиница, како што се користи во меѓународниот промет. Единствениот дозволен исклучок од кирилица.'
    },
    companyCapitalEUR: {
      name: 'companyCapitalEUR', type: 'text', label: 'Основна главнина (ЕУР)', step: 2,
      placeholder: 'пр. 5.000', inputMode: 'numeric',
      helpText: 'Вкупната основна главнина на друштвото изразена во евра. Се прикажува во пречистениот текст на Актот (член „Основна главнина").'
    },
    companyContributionType: {
      name: 'companyContributionType', type: 'select', label: 'Вид на влог', step: 2,
      options: [ { value: 'паричен', label: 'Паричен влог' }, { value: 'непаричен', label: 'Непаричен влог' } ],
      helpText: 'Дали основната главнина е внесена како паричен или непаричен влог.'
    },
    companyActivityCode: {
      name: 'companyActivityCode', type: 'text', label: 'Приоритетна дејност (шифра)', step: 2,
      placeholder: 'пр. 70.22',
      helpText: 'Шифрата на приоритетната (главна приходна) дејност. НЕ СЕ МЕНУВА — само се прикажува во пречистениот текст на Актот.'
    },
    companyActivityText: {
      name: 'companyActivityText', type: 'text', label: 'Приоритетна дејност (опис)', step: 2,
      placeholder: 'пр. Дејности на советување во врска со работењето',
      helpText: 'Описот на приоритетната дејност што одговара на шифрата.'
    },

    // --- Step 3: per-change fields (self-hide via condition by selected module) ---

    // M1 — Назив
    newCompanyFullName: {
      name: 'newCompanyFullName', type: 'text', label: 'Нов полн назив', step: 3, required: true,
      placeholder: 'пр. Друштво за трговија НОВ НАЗИВ ДООЕЛ Скопје',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M1'),
      helpText: 'Новиот целосен назив на друштвото што ќе се впише во Трговскiот регистар.'
    },
    newCompanyShortName: {
      name: 'newCompanyShortName', type: 'text', label: 'Нов скратен назив', step: 3, required: true,
      placeholder: 'пр. НОВ НАЗИВ ДООЕЛ Скопје',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M1'),
      helpText: 'Новиот скратен назив. Го содржи клучниот бренд + формата (ДООЕЛ/ДОО) + градот.'
    },
    newCompanyForeignName: {
      name: 'newCompanyForeignName', type: 'text', label: 'Нов назив во странство (латиница)', step: 3,
      placeholder: 'пр. NEW NAME DOOEL Skopje',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M1'),
      helpText: 'Новиот назив во правниот промет со странство — на латиница (единствен дозволен исклучок од кирилица).'
    },

    // M2 — Седиште
    newSeatAddress: {
      name: 'newSeatAddress', type: 'text', label: 'Нова адреса на седиште', step: 3, required: true,
      placeholder: 'пр. ул. Маршал Тито бр. 10, Скопје',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M2'),
      helpText: 'Внесете ја новата адреса на седиштето на друштвото. Промената на седиште се впишува во Трговскiот регистар преку регистрациониот агент.'
    },

    // M3 — Лични податоци
    m3Capacity: {
      name: 'm3Capacity', type: 'select', label: 'Својство на лицето', step: 3,
      options: [
        { value: 'единствениот содружник – основач', label: 'Единствен содружник / основач' },
        { value: 'содружникот', label: 'Содружник' },
        { value: 'управителот', label: 'Управител' },
        { value: 'единствениот содружник – основач и управител', label: 'Единствен содружник и управител' }
      ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M3'),
      helpText: 'Изберете во кое својство е лицето чии лични податоци се менуваат.'
    },
    m3SubjectName: {
      name: 'm3SubjectName', type: 'text', label: 'Име и презиме на лицето', step: 3,
      placeholder: 'пр. Петар Петров',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M3'),
      helpText: 'Името и презимето на лицето чии лични податоци се менуваат (како што е во внесените содружници/управители).'
    },
    m3NewData: {
      name: 'm3NewData', type: 'textarea', label: 'Нови лични податоци (целосно)', step: 3, rows: 3, maxLength: 600,
      placeholder: 'пр. Петар Петров, со живеалиште на ул. Нова бр. 5, Скопје, со ЕМБГ 1234567890123',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M3'),
      helpText: 'Внесете ја целосната нова идентификација на лицето (име, адреса/живеалиште, и ЕМБГ или нов број на пасош). Овој текст се внесува во одлуката како нова состојба.'
    },

    // M4 — Управител
    m4ChangeType: {
      name: 'm4ChangeType', type: 'select', label: 'Вид на промена на управител', step: 3,
      options: [
        { value: 'a', label: 'Отповикување и избор на нов управител' },
        { value: 'b', label: 'Само избор на нов/дополнителен управител' },
        { value: 'c', label: 'Само отповикување на управител' },
        { value: 'd', label: 'Само промена на овластувања/мандат' }
      ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4'),
      helpText: 'Изберете ја варијантата на промена на управител.'
    },
    m4DismissedName: {
      name: 'm4DismissedName', type: 'text', label: 'Управител што се отповикува', step: 3,
      placeholder: 'пр. Марјан Малов, со ЕМБГ 1501973450150',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'c'].includes(fd.m4ChangeType),
      helpText: 'Целосна идентификација на управителот што се отповикува (име, адреса, ЕМБГ/пасош).'
    },
    m4NewManagerName: {
      name: 'm4NewManagerName', type: 'text', label: 'Нов управител — име и презиме', step: 3,
      placeholder: 'пр. Радосав Гочманац',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b'].includes(fd.m4ChangeType),
      helpText: 'Името и презимето на новиот управител. Новиот управител дава Изјава по член 183 и 231 став 4 и потпишува ЗП образец.'
    },
    m4NewManagerForeign: {
      name: 'm4NewManagerForeign', type: 'select', label: 'Нов управител — странец', step: 3,
      options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b'].includes(fd.m4ChangeType),
      helpText: 'Дали новиот управител е странски државјанин.'
    },
    m4NewManagerCitizenship: {
      name: 'm4NewManagerCitizenship', type: 'text', label: 'Нов управител — државјанство', step: 3,
      placeholder: 'пр. Република Србија',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b'].includes(fd.m4ChangeType) && fd.m4NewManagerForeign === 'да',
      helpText: 'Државјанство на новиот управител (само за странци).'
    },
    m4NewManagerAddress: {
      name: 'm4NewManagerAddress', type: 'text', label: 'Нов управител — адреса', step: 3,
      placeholder: 'пр. ул. Прва бр. 1, Скопје',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b'].includes(fd.m4ChangeType),
      helpText: 'Адреса на живеење на новиот управител.'
    },
    m4NewManagerIdNumber: {
      name: 'm4NewManagerIdNumber', type: 'text', label: 'Нов управител — ЕМБГ/пасош', step: 3,
      placeholder: 'пр. 1234567890123',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b'].includes(fd.m4ChangeType),
      helpText: 'ЕМБГ (13 цифри) за домашен или број на пасош за странски управител.'
    },
    m4Mandate: {
      name: 'm4Mandate', type: 'select', label: 'Мандат на управителот', step: 3,
      options: [ { value: 'неопределено', label: 'Неопределено време' }, { value: 'определено', label: 'Определено време' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b', 'd'].includes(fd.m4ChangeType),
      helpText: 'Дали управителот се именува на неопределено или определено време.'
    },
    m4MandateUntil: {
      name: 'm4MandateUntil', type: 'text', label: 'Мандат до (датум/рок)', step: 3,
      placeholder: 'пр. 31.12.2028 година',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b', 'd'].includes(fd.m4ChangeType) && fd.m4Mandate === 'определено',
      helpText: 'Рокот до кој се именува управителот (само за определено време).'
    },
    m4Powers: {
      name: 'm4Powers', type: 'select', label: 'Овластувања', step: 3,
      options: [ { value: 'неограничени', label: 'Неограничени (внатрешен и надворешен промет)' }, { value: 'ограничени', label: 'Со ограничувања' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b', 'd'].includes(fd.m4ChangeType),
      helpText: 'Обемот на овластувањата на управителот.'
    },
    m4PowersText: {
      name: 'm4PowersText', type: 'textarea', label: 'Опис на ограничувањата', step: 3, rows: 2, maxLength: 500,
      placeholder: 'пр. со ко-потпис на вториот управител за договори над 10.000 ЕУР',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M4') && ['a', 'b', 'd'].includes(fd.m4ChangeType) && fd.m4Powers === 'ограничени',
      helpText: 'Опишете ги ограничувањата на овластувањата на управителот.'
    },

    // M6 — Уплата на основачки влог
    m6AmountEUR: {
      name: 'm6AmountEUR', type: 'text', label: 'Износ на влог (ЕУР)', step: 3, inputMode: 'numeric',
      placeholder: 'пр. 5.000',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M6'),
      helpText: 'Износот на основачкиот влог што се уплатува, изразен во евра.'
    },
    m6AmountMKD: {
      name: 'm6AmountMKD', type: 'text', label: 'Денарска противвредност (МКД)', step: 3, inputMode: 'numeric',
      placeholder: 'пр. 308.000',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M6'),
      helpText: 'Денарската противвредност на влогот според среден курс на НБ на РСМ на денот на уплатата.'
    },

    // M7 — Подружница
    m7Action: {
      name: 'm7Action', type: 'select', label: 'Промена кај подружница', step: 3,
      options: [ { value: 'седиште', label: 'Промена на седиште' }, { value: 'раководител', label: 'Промена на раководител' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M7'),
      helpText: 'Изберете дали се менува седиштето или раководителот на подружницата.'
    },
    branchFullName: {
      name: 'branchFullName', type: 'text', label: 'Полн назив на подружницата', step: 3,
      placeholder: 'пр. {друштво} – Подружница Продавница Струмица',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M7'),
      helpText: 'Целосниот назив на подружницата како што е запишан во Трговскiот регистар.'
    },
    branchSubNumber: {
      name: 'branchSubNumber', type: 'text', label: 'Подброј на подружницата', step: 3,
      placeholder: 'пр. 5182140/2',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M7'),
      helpText: 'Подбројот на подружницата (ЕМБС/n).'
    },
    m7OldBranchAddress: {
      name: 'm7OldBranchAddress', type: 'text', label: 'Стара адреса на подружницата', step: 3,
      placeholder: 'пр. ул. Климент Охридски бр. 13, Струмица',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M7') && fd.m7Action === 'седиште',
      helpText: 'Досегашната адреса/седиште на подружницата.'
    },
    m7NewBranchAddress: {
      name: 'm7NewBranchAddress', type: 'text', label: 'Нова адреса на подружницата', step: 3,
      placeholder: 'пр. ул. Климент Охридски бр. 180, Струмица',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M7') && fd.m7Action === 'седиште',
      helpText: 'Новата адреса/седиште на подружницата.'
    },
    m7DismissedHeadName: {
      name: 'm7DismissedHeadName', type: 'text', label: 'Раководител што се отповикува', step: 3,
      placeholder: 'пр. Марјан Малов, со ЕМБГ 1501973450150',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M7') && fd.m7Action === 'раководител',
      helpText: 'Целосна идентификација на раководителот што се отповикува.'
    },
    m7NewHeadName: {
      name: 'm7NewHeadName', type: 'text', label: 'Нов раководител (целосна идентификација)', step: 3,
      placeholder: 'пр. Радосав Гочманац, државјанин на Р. Србија, пасош 013826215, адреса ...',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M7') && fd.m7Action === 'раководител',
      helpText: 'Целосна идентификација на новиот раководител на подружницата (име, државјанство/адреса, документ).'
    },

    // M5 — Пренос на удел (most complex module)
    m5TransferorName: {
      name: 'm5TransferorName', type: 'text', label: 'Отстапувач (од постоечките содружници)', step: 3, required: true,
      placeholder: 'пр. Андреја Хочевар',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Внесете го името на содружникот кој го отстапува уделот, точно како што е внесен во листата на содружници (чекор 2). Системот ги презема неговите целосни податоци од таму.'
    },
    m5TransferScope: {
      name: 'm5TransferScope', type: 'select', label: 'Обем на пренос', step: 3,
      options: [ { value: 'целосен', label: 'Целосен удел' }, { value: 'делумен', label: 'Дел од удел' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Дали се пренесува целиот удел на отстапувачот или само дел од него.'
    },
    m5TransferAmountEUR: {
      name: 'm5TransferAmountEUR', type: 'text', label: 'Износ на уделот што се пренесува (ЕУР)', step: 3, inputMode: 'numeric',
      placeholder: 'пр. 5.000',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Износот на уделот што се пренесува, изразен како влог во евра. Согласно ЗТД, преносот на удел задолжително се заверува кај нотар, а основната главнина не се менува со преносот.'
    },
    m5PartialPercent: {
      name: 'm5PartialPercent', type: 'text', label: 'Процент што се пренесува (%)', step: 3,
      placeholder: 'пр. 30',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5TransferScope === 'делумен',
      helpText: 'Процентот од уделите што се пренесува (само за делумен пренос). Се користи за пресметка на новата содружничка структура.'
    },
    m5WithCompensation: {
      name: 'm5WithCompensation', type: 'select', label: 'Надомест', step: 3,
      options: [ { value: 'без', label: 'Без надомест' }, { value: 'со', label: 'Со надомест (купопродажна цена)' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Дали преносот е без надомест или за купопродажна цена.'
    },
    m5Price: {
      name: 'm5Price', type: 'text', label: 'Купопродажна цена', step: 3, inputMode: 'numeric',
      placeholder: 'пр. 10.000',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5WithCompensation === 'со',
      helpText: 'Вкупниот надомест (купопродажна цена) за пренесениот удел.'
    },
    m5Currency: {
      name: 'm5Currency', type: 'select', label: 'Валута на надоместот', step: 3,
      options: [ { value: 'ЕУР', label: 'ЕУР (евра)' }, { value: 'МКД', label: 'МКД (денари)' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5WithCompensation === 'со',
      helpText: 'Валутата во која се изразува купопродажната цена.'
    },
    m5PaymentTerms: {
      name: 'm5PaymentTerms', type: 'textarea', label: 'Начин и рок на плаќање', step: 3, rows: 2, maxLength: 500,
      placeholder: 'пр. на трансакциска сметка на отстапувачот најдоцна до 31.12.2026 година',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5WithCompensation === 'со',
      helpText: 'Начинот и рокот на исплата на надоместот (член 3 од Договорот за пренос).'
    },
    m5TransferorWithdraws: {
      name: 'm5TransferorWithdraws', type: 'select', label: 'Отстапувачот истапува', step: 3,
      options: [ { value: 'да', label: 'Да — истапува целосно од Друштвото' }, { value: 'не', label: 'Не — останува со намален удел' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Дали со преносот отстапувачот целосно истапува од Друштвото или останува содружник со намален удел.'
    },
    m5TransfereeIsNew: {
      name: 'm5TransfereeIsNew', type: 'select', label: 'Стекнувачот е ново лице', step: 3,
      options: [ { value: 'да', label: 'Да — ново лице што пристапува' }, { value: 'не', label: 'Не — постоен содружник' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Дали уделот го презема ново лице (пристапува кон Друштвото) или постоен содружник (неговиот удел се зголемува).'
    },
    m5TransfereeName: {
      name: 'm5TransfereeName', type: 'text', label: 'Стекнувач — име и презиме / назив', step: 3, required: true,
      placeholder: 'пр. Марко Марковски',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Името на стекнувачот на уделот. За постоен содружник внесете го точно како во листата на содружници.'
    },
    m5TransfereeForeign: {
      name: 'm5TransfereeForeign', type: 'select', label: 'Стекнувач — странец', step: 3,
      options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5TransfereeIsNew === 'да',
      helpText: 'Дали стекнувачот е странско лице (бара пасош + државјанство и упис во Регистар на директни инвестиции).'
    },
    m5TransfereeCitizenship: {
      name: 'm5TransfereeCitizenship', type: 'text', label: 'Стекнувач — државјанство', step: 3,
      placeholder: 'пр. Република Србија',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5TransfereeIsNew === 'да' && fd.m5TransfereeForeign === 'да',
      helpText: 'Државјанство на стекнувачот (само за странци).'
    },
    m5TransfereeAddress: {
      name: 'm5TransfereeAddress', type: 'text', label: 'Стекнувач — адреса', step: 3,
      placeholder: 'пр. ул. Прва бр. 1, Скопје',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5TransfereeIsNew === 'да',
      helpText: 'Адреса на живеење (физичко лице) или седиште (правно лице) на стекнувачот.'
    },
    m5TransfereeIdType: {
      name: 'm5TransfereeIdType', type: 'select', label: 'Стекнувач — документ', step: 3,
      options: [ { value: 'ЕМБГ', label: 'ЕМБГ (13 цифри)' }, { value: 'пасош', label: 'Број на пасош' }, { value: 'ЕМБС', label: 'ЕМБС / рег. број' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5TransfereeIsNew === 'да',
      helpText: 'ЕМБГ за домашно физичко лице, пасош за странец, ЕМБС/рег. број за правно лице.'
    },
    m5TransfereeIdNumber: {
      name: 'm5TransfereeIdNumber', type: 'text', label: 'Стекнувач — број', step: 3,
      placeholder: 'пр. 1234567890123',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5') && fd.m5TransfereeIsNew === 'да',
      helpText: 'Вредноста на избраниот документ на стекнувачот.'
    },
    m5TransfereeIsManager: {
      name: 'm5TransfereeIsManager', type: 'select', label: 'Стекнувачот станува и управител', step: 3,
      options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ],
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Дали стекнувачот станува и управител (тогаш дава и Изјава по член 183 и 231 став 4 и потпишува ЗП образец).'
    },
    m5TotalCapitalEUR: {
      name: 'm5TotalCapitalEUR', type: 'text', label: 'Вкупна основна главнина (ЕУР)', step: 3, inputMode: 'numeric',
      placeholder: 'пр. 5.000',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M5'),
      helpText: 'Вкупната основна главнина на Друштвото во евра. Не се менува со преносот на удел — се наведува во договорот, одлуката, пријавата и книгата на удели.'
    },

    // --- Step 4: registration agent + general ---
    newSeatAddress: {
      name: 'newSeatAddress', type: 'text', label: 'Нова адреса на седиште', step: 3, required: true,
      placeholder: 'пр. ул. Маршал Тито бр. 10, Скопје',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M2'),
      helpText: 'Внесете ја новата адреса на седиштето на друштвото. Промената на седиште се впишува во Трговскiот регистар преку регистрациониот агент.'
    },
    seatDecisionNumber: {
      name: 'seatDecisionNumber', type: 'text', label: 'Број на одлука (опционо)', step: 3,
      placeholder: 'пр. 0101/1',
      condition: (fd) => Array.isArray(fd.changes) && fd.changes.includes('M2'),
      helpText: 'Доколку водите внатрешна нумерација на одлуки, внесете го бројот. Ќе се прикаже како „ОДЛУКА БРОЈ … од … година" пред потписите.'
    },

    // --- Step 4: registration agent + general ---
    decisionDate: {
      name: 'decisionDate', type: 'date', label: 'Датум на одлуките', step: 4, required: true,
      helpText: 'Датумот на донесување на одлуките. Сите документи во пакетот (одлуки, изјави, полномошна) го носат истиот датум.'
    },
    city: {
      name: 'city', type: 'text', label: 'Место', step: 4, placeholder: 'Скопје',
      helpText: 'Местото каде се донесуваат одлуките и се потпишуваат документите.'
    },
    agentName: {
      name: 'agentName', type: 'text', label: 'Регистрационен агент (адвокат/друштво)', step: 4,
      placeholder: 'пр. Адвокатско друштво Лаличиќ и Партнери',
      helpText: 'Назив на адвокатот или адвокатското друштво кое како регистрационен агент ги поднесува документите електронски до Централниот регистар.'
    },
    agentAddress: {
      name: 'agentAddress', type: 'text', label: 'Адреса на агентот', step: 4,
      placeholder: 'пр. ул. Македонија бр. 26/1-5, Скопје',
      helpText: 'Седиштето/адресата на регистрациониот агент.'
    },
    agentPersons: {
      name: 'agentPersons', type: 'textarea', label: 'Овластени лица кај агентот', step: 4, rows: 3, maxLength: 1000,
      placeholder: 'пр. адвокат Марко Марковски и адвокатски приправник Ана Анева',
      helpText: 'Наброј ги адвокатите/приправниците кои се овластуваат во полномошното (по желба).'
    }
  }
};

/** Returns the plain fields belonging to a step (in declaration order). */
export const getStepFields = (step) =>
  Object.values(companyChangesConfig.fields).filter((f) => f.step === step);

export default companyChangesConfig;
