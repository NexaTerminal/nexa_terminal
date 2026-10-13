/**
 * „Намалување на основна главнина" (Централен регистар) — capital-reduction config.
 *
 * Two-phase statutory procedure (чл. 261–263 ЗТД). One .docx holds BOTH phases:
 *  ФАЗА I  (намера)       — dated phase1Date (today)
 *  ФАЗА II (спроведување) — dated phase2Date (phase1Date + 91 days)
 *
 * Multi-step form: (1) company + manager, (2) shareholders (current/new влог in MKD),
 * (3) reduction params + Службен весник + creditors + optional personal-data change,
 * (4) agent + dates, (5) review. Amounts are MKD (денари). Like the other Централен
 * регистар packs, shows a document-list review instead of a live preview.
 */

export const capitalReductionConfig = {
  documentType: 'capitalReduction',
  apiEndpoint: 'company-capital-reduction',
  fileName: null,
  disableLivePreview: true,

  initialFormData: {
    companyForm: 'doo',
    phase: '1',
    shareholdersList: [],
    creditorStatus: 'settled',
    includePersonalDataChange: 'не',
    city: 'Скопје'
  },

  steps: [
    { id: 1, title: 'Фаза и друштво', description: 'Изберете ја фазата (I — намера или II — спроведување) и внесете ги основните податоци за друштвото и управителот.', requiredFields: [] },
    { id: 2, title: 'Содружници и влогови', description: 'Внесете ги содружниците со тековниот и новиот паричен влог (во денари). Намалувањето се пресметува од разликата.', requiredFields: [] },
    { id: 3, title: 'Намалување и објава', description: 'Причина за намалувањето; за Фаза II и податоци за објавата во Службен весник и доверители.', requiredFields: [] },
    { id: 4, title: 'Регистрационен агент и датум', description: 'Агентот што ги поднесува документите и датумот на избраната фаза.', requiredFields: [] },
    { id: 5, title: 'Преглед', description: 'Преглед на документите од избраната фаза што ќе се генерираат.', requiredFields: [] }
  ],

  // Repeating shareholders list (Step 2)
  shareholdersList: {
    name: 'shareholdersList',
    label: 'Содружници',
    addLabel: '+ Додади содружник',
    helpText: 'Внесете ги сите содружници. Кај ДООЕЛ има точно еден, кај ДОО двајца или повеќе. Тековниот збир на влоговите = тековна основна главнина; новиот збир = основна главнина по намалувањето.',
    arrayFields: [
      { name: 'entityType', type: 'select', label: 'Тип', options: [ { value: 'physical', label: 'Физичко лице' }, { value: 'legal', label: 'Правно лице' } ], helpText: 'Физичко или правно лице.' },
      { name: 'name', type: 'text', label: 'Име и презиме / Назив', placeholder: 'пр. Благоја Новески', helpText: 'Целосно име и презиме (физичко) или назив (правно лице).' },
      { name: 'isForeign', type: 'select', label: 'Странец', options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ], condition: (item) => item.entityType !== 'legal', helpText: 'Дали лицето е странски државјанин (бара пасош + државјанство).' },
      { name: 'citizenship', type: 'text', label: 'Државјанство', placeholder: 'пр. Република Србија', condition: (item) => item.entityType !== 'legal' && item.isForeign === 'да', helpText: 'Се пополнува само за странски физички лица.' },
      { name: 'address', type: 'text', label: 'Адреса (тековна)', placeholder: 'пр. ул. Аминта Трети бр. 60/1-8, Скопје', helpText: 'Тековната адреса на живеење (физичко) или седиште (правно лице).' },
      { name: 'newAddress', type: 'text', label: 'Нова адреса (само при промена на лични податоци)', placeholder: 'пр. Бул. Партизански одреди бр. 102/2-5, Скопје', helpText: 'Пополнете само ако во чекор 3 е избрана промена на лични податоци и адресата на ова лице се менува.' },
      { name: 'idType', type: 'select', label: 'Документ', options: [ { value: 'ЕМБГ', label: 'ЕМБГ (13 цифри)' }, { value: 'пасош', label: 'Број на пасош' }, { value: 'ЕМБС', label: 'ЕМБС / рег. број' } ], helpText: 'ЕМБГ за домашно физичко лице, пасош за странец, ЕМБС за правно лице.' },
      { name: 'idNumber', type: 'text', label: 'Број', placeholder: 'пр. 0706997450086', helpText: 'Вредноста на избраниот документ.' },
      { name: 'currentContributionMKD', type: 'text', label: 'Тековен влог (МКД)', placeholder: 'пр. 7000000', inputMode: 'numeric', helpText: 'Тековниот паричен влог на содружникот во денари (само цифри). Пр. 7000000 за 7.000.000,00 денари.' },
      { name: 'newContributionMKD', type: 'text', label: 'Нов влог (МКД)', placeholder: 'пр. 5500000', inputMode: 'numeric', helpText: 'Влогот по намалувањето. Ако на ова лице не му се намалува влогот, внесете ја истата вредност како тековниот влог.' }
    ]
  },

  fields: {
    // --- Step 1: phase + company + manager ---
    phase: {
      name: 'phase', type: 'select', label: 'Фаза на постапката', step: 1, required: true,
      options: [
        { value: '1', label: 'Фаза I — Намера за намалување' },
        { value: '2', label: 'Фаза II — Спроведување (по истекот на рокот)' }
      ],
      helpText: 'Намалувањето е двофазна постапка. Прво генерирајте ги документите за Фаза I (намера), а по истекот на законскиот рок (најмалку 90 дена од објавата) вратете се и изберете Фаза II за документите за спроведување.'
    },
    companyForm: {
      name: 'companyForm', type: 'select', label: 'Форма на друштво', step: 1, required: true,
      options: [ { value: 'doo', label: 'ДОО (двајца или повеќе содружници)' }, { value: 'dooel', label: 'ДООЕЛ (еден содружник)' } ],
      helpText: 'ДОО → пречистениот текст е Договор за основање. ДООЕЛ → Изјава за основање од едно лице. Формата го одредува и типот на преамбулите и потписниците.'
    },
    companyFullName: {
      name: 'companyFullName', type: 'text', label: 'Полн назив на друштвото', step: 1, required: true,
      placeholder: 'пр. Друштво за трговија и услуги ПРИМЕР ДОО Скопје',
      helpText: 'Целосниот регистриран назив. Предложено од вашиот профил.'
    },
    companyShortName: {
      name: 'companyShortName', type: 'text', label: 'Скратен назив', step: 1,
      placeholder: 'пр. ПРИМЕР ДОО Скопје',
      helpText: 'Скратениот назив (бренд + форма + град).'
    },
    companyAddress: {
      name: 'companyAddress', type: 'text', label: 'Адреса на седиште', step: 1, required: true,
      placeholder: 'пр. ул. Маршал Тито бр. 5, Македонски Брод',
      helpText: 'Адресата на седиштето. Предложена од вашиот профил.'
    },
    companyEMBS: {
      name: 'companyEMBS', type: 'text', label: 'ЕМБС (матичен број)', step: 1, required: true,
      maxLength: 7, inputMode: 'numeric', placeholder: 'пр. 7238401',
      helpText: 'Единствен матичен број — 7 цифри.'
    },
    companyEDB: {
      name: 'companyEDB', type: 'text', label: 'ЕДБ (даночен број)', step: 1,
      maxLength: 13, inputMode: 'numeric', placeholder: 'пр. 4018017502680',
      helpText: 'Единствен даночен број — 13 цифри. Предложен од вашиот профил.'
    },
    companyActivityCode: {
      name: 'companyActivityCode', type: 'text', label: 'Приоритетна дејност (шифра)', step: 1,
      placeholder: 'пр. 46.90',
      helpText: 'Главна приходна шифра — се прикажува во пречистениот текст на Актот.'
    },
    companyActivityText: {
      name: 'companyActivityText', type: 'text', label: 'Приоритетна дејност (опис)', step: 1,
      placeholder: 'пр. Неспецијализирана трговија на големо',
      helpText: 'Описот на приоритетната дејност.'
    },
    managerName: {
      name: 'managerName', type: 'text', label: 'Управител — име и презиме', step: 1, required: true,
      placeholder: 'пр. Стојан Новески',
      helpText: 'Управителот ги дава изјавите по чл. 263 (доверители) и чл. 32, и потпишува Книга на удели и Полномошно. Може да биде и еден од содружниците (внесете го истото име).'
    },
    managerAddress: {
      name: 'managerAddress', type: 'text', label: 'Управител — адреса', step: 1,
      placeholder: 'пр. ул. 4-ти Јули бр. 131, Кичево',
      helpText: 'Адреса на живеење на управителот.'
    },
    managerForeign: {
      name: 'managerForeign', type: 'select', label: 'Управител — странец', step: 1,
      options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ],
      helpText: 'Дали управителот е странски државјанин.'
    },
    managerCitizenship: {
      name: 'managerCitizenship', type: 'text', label: 'Управител — државјанство', step: 1,
      placeholder: 'пр. Република Србија',
      condition: (fd) => fd.managerForeign === 'да',
      helpText: 'Се пополнува само за странски управител.'
    },
    managerIdNumber: {
      name: 'managerIdNumber', type: 'text', label: 'Управител — ЕМБГ/пасош', step: 1,
      placeholder: 'пр. 1205957433000',
      helpText: 'ЕМБГ (13 цифри) за домашен или број на пасош за странски управител.'
    },

    // --- Step 3: reduction params ---
    reductionReason: {
      name: 'reductionReason', type: 'textarea', label: 'Причина за намалувањето', step: 3, rows: 2, maxLength: 600,
      placeholder: 'намален обем на работа, несоодветноста на основната главнина со капиталот на Друштвото, како и поради промени во деловните прилики на Друштвото во економскиот промет',
      helpText: 'Образложение зошто се намалува главнината. Ако е празно, се користи стандардниот текст.'
    },
    gazetteNumber: {
      name: 'gazetteNumber', type: 'text', label: 'Службен весник — број', step: 3,
      placeholder: 'пр. 233',
      condition: (fd) => fd.phase === '2',
      helpText: 'Само за Фаза II. Бројот на Службен весник во кој е објавена одлуката за намера од Фаза I.'
    },
    gazetteDate: {
      name: 'gazetteDate', type: 'date', label: 'Службен весник — датум на објава', step: 3,
      condition: (fd) => fd.phase === '2',
      helpText: 'Само за Фаза II. Датумот на објавата на намерата во Службен весник.'
    },
    creditorStatus: {
      name: 'creditorStatus', type: 'select', label: 'Доверители', step: 3, required: true,
      options: [
        { value: 'settled', label: 'Нема пријавени / сите намирени' },
        { value: 'none', label: 'Друштвото нема познати доверители' }
      ],
      condition: (fd) => fd.phase === '2',
      helpText: 'Само за Фаза II. Ја одредува варијантата на Изјавата на управителот по чл. 263 ст.3.'
    },
    includePersonalDataChange: {
      name: 'includePersonalDataChange', type: 'select', label: 'Вклучи промена на лични податоци', step: 3,
      options: [ { value: 'не', label: 'Не' }, { value: 'да', label: 'Да' } ],
      helpText: 'Ако е „Да", паралелно се спроведува и промена на адреса на содружниците (внесете ја „Новата адреса" кај содружниците во чекор 2). Актот се менува и во член 2 и во член 7.'
    },

    // --- Step 4: agent + date (of the chosen phase) ---
    phase1Date: {
      name: 'phase1Date', type: 'date', label: 'Датум на документите (Фаза I)', step: 4, required: true,
      condition: (fd) => (fd.phase || '1') !== '2',
      helpText: 'Датумот на документите од Фаза I (одлука за намера, изјави за потписи, полномошна).'
    },
    phase2Date: {
      name: 'phase2Date', type: 'date', label: 'Датум на документите (Фаза II)', step: 4, required: true,
      condition: (fd) => fd.phase === '2',
      helpText: 'Датумот на документите од Фаза II — денот кога ја спроведувате постапката (по истекот на рокот од Фаза I).'
    },
    city: {
      name: 'city', type: 'text', label: 'Место', step: 4, placeholder: 'Скопје',
      helpText: 'Местото каде се потпишуваат документите.'
    },
    decisionNumber: {
      name: 'decisionNumber', type: 'text', label: 'Број на одлука (опционо)', step: 4,
      placeholder: 'пр. 0102/1',
      helpText: 'Доколку водите внатрешна нумерација, се прикажува на Одлуката за измена на Актот.'
    },
    agentName: {
      name: 'agentName', type: 'text', label: 'Регистрационен агент (адвокат/друштво)', step: 4,
      placeholder: 'пр. Адвокат Мартин Бошкоски',
      helpText: 'Адвокатот/друштвото што како регистрационен агент ги поднесува документите.'
    },
    agentAddress: {
      name: 'agentAddress', type: 'text', label: 'Адреса на агентот', step: 4,
      placeholder: 'пр. ул. Македонија бр. 11/1-5, Скопје',
      helpText: 'Седиштето/адресата на регистрациониот агент.'
    },
    agentPersons: {
      name: 'agentPersons', type: 'textarea', label: 'Целосен текст за овластените лица (по желба)', step: 4, rows: 3, maxLength: 1000,
      placeholder: 'пр. Адвокат Ведран Лаличиќ од Скопје и Адвокат Мартин Бошкоски од Скопје и двајцата со седиште на ул. Македонија бр. 11/1-5, како и адвокатските приправници …',
      helpText: 'Опционо: целосната формулација на овластените лица што се вметнува во полномошната. Ако е празно, се составува од називот и адресата погоре.'
    }
  }
};

/** Returns the plain fields belonging to a step (in declaration order). */
export const getStepFields = (step) =>
  Object.values(capitalReductionConfig.fields).filter((f) => f.step === step);

export default capitalReductionConfig;
