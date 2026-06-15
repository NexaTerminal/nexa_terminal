/**
 * „Основање на фирма" (Централен регистар) — incorporation document pack config.
 *
 * Multi-step form: (1) company + capital, (2) founders, (3) managers,
 * (4) registration agent + general, (5) review. The backend assembles the
 * constitutive document + statutory statements + POAs + ЗП образец into one .docx.
 *
 * Like „Промени во фирма", this pack shows a document-list review instead of a
 * rendered live preview (`disableLivePreview`). Founders/managers are repeating
 * lists rendered by a custom component in CompanyFormationPage.js.
 */

export const companyIncorporationConfig = {
  documentType: 'companyIncorporation',
  apiEndpoint: 'company-incorporation',
  fileName: null,
  disableLivePreview: true,

  initialFormData: {
    companyForm: 'dooel',
    contributionType: 'monetary',
    paymentTiming: 'at_incorporation',
    capitalEUR: '5.000',
    foundersList: [],
    managersList: [],
    companyCity: 'Скопје',
    businessClause: 'Општа клаузула за бизнис.'
  },

  steps: [
    { id: 1, title: 'Друштво и основна главнина', description: 'Основни податоци за друштвото што се основа и за основната главнина.', requiredFields: [] },
    { id: 2, title: 'Основачи / содружници', description: 'Внесете ги основачите. ДООЕЛ има точно еден, ДОО двајца или повеќе.', requiredFields: [] },
    { id: 3, title: 'Управители', description: 'Внесете ги управителите. Ако не внесете, единствениот основач се смета за управител.', requiredFields: [] },
    { id: 4, title: 'Регистрационен агент и општи податоци', description: 'Податоци за агентот што ги поднесува документите и други општи податоци.', requiredFields: [] },
    { id: 5, title: 'Преглед', description: 'Преглед на документите што ќе се генерираат.', requiredFields: [] }
  ],

  // Repeating founders list (Step 2)
  foundersList: {
    name: 'foundersList',
    label: 'Основачи / содружници',
    addLabel: '+ Додади основач',
    helpText: 'Внесете ги сите основачи. Кај ДООЕЛ има точно еден основач, кај ДОО двајца или повеќе (најмногу 50). Збирот на влоговите мора да одговара на основната главнина.',
    arrayFields: [
      { name: 'personType', type: 'select', label: 'Тип на лице', options: [ { value: 'natural_domestic', label: 'Физичко — домашно' }, { value: 'natural_foreign', label: 'Физичко — странско' }, { value: 'legal_entity', label: 'Правно лице' } ], helpText: 'Изберете го типот на основачот — домашно физичко лице (со ЕМБГ), странско физичко лице (со пасош) или правно лице (со ЕМБС).' },
      { name: 'name', type: 'text', label: 'Име и презиме / Назив', placeholder: 'пр. Марко Марковски', helpText: 'Целосно име и презиме (физичко лице) или целосен назив (правно лице).' },
      { name: 'nameLat', type: 'text', label: 'Латинично име', placeholder: 'пр. Marko Markovski', condition: (item) => item.personType === 'natural_foreign', helpText: 'Латинично пишување на името за странски државјанин (како во пасошот).' },
      { name: 'country', type: 'text', label: 'Државјанство / Држава', placeholder: 'пр. Република Бугарија', condition: (item) => item.personType !== 'natural_domestic', helpText: 'Државјанство (странско физичко лице) или држава на регистрација (правно лице).' },
      { name: 'city', type: 'text', label: 'Град', placeholder: 'пр. Скопје', condition: (item) => item.personType !== 'legal_entity', helpText: 'Местото на живеење на физичкото лице.' },
      { name: 'address', type: 'text', label: 'Адреса / седиште', placeholder: 'пр. ул. Прва бр. 1, Скопје', helpText: 'Адреса на живеење (физичко лице) или седиште (правно лице).' },
      { name: 'idNumber', type: 'text', label: 'ЕМБГ / пасош / ЕМБС', placeholder: 'пр. 1234567890123', helpText: 'ЕМБГ (13 цифри) за домашно физичко лице, број на пасош/лична карта за странец, ЕМБС/рег. број за правно лице.' },
      { name: 'entityRep', type: 'text', label: 'Застапник (за правно лице)', placeholder: 'пр. управителот Петар Петров', condition: (item) => item.personType === 'legal_entity', helpText: 'Управителот/застапникот кој потпишува во име на правното лице основач.' },
      { name: 'shareEUR', type: 'text', label: 'Влог (ЕУР)', placeholder: 'пр. 5.000', helpText: 'Поединечниот основачки влог во евра. Збирот од сите влогови = основната главнина.' },
      { name: 'sharePercent', type: 'text', label: 'Удел (%)', placeholder: 'пр. 100', helpText: 'Процентот на учество во основната главнина. Збирот од сите удели = 100%.' },
      { name: 'equipment', type: 'textarea', label: 'Опрема (непаричен влог)', rows: 3, placeholder: 'по еден ред: Опрема | Количина | ЕВРО | ДЕНАРИ\nпр. Лаптоп | 2 | 1.000 | 61.650', condition: (item, formData) => formData.contributionType === 'non_monetary', helpText: 'Се внесува само при непаричен влог. Секој предмет во посебен ред во формат: Опрема | Количина | ЕВРО | ДЕНАРИ. Се прикажува како табела во Договорот за непаричен влог.' }
    ]
  },

  // Repeating managers list (Step 3)
  managersList: {
    name: 'managersList',
    label: 'Управители',
    addLabel: '+ Додади управител',
    helpText: 'Управителот го застапува друштвото и потпишува ЗП образец и изјавите по чл. 32/183/231. Ако не внесете управител, единствениот основач се смета за управител.',
    arrayFields: [
      { name: 'personType', type: 'select', label: 'Тип на лице', options: [ { value: 'natural_domestic', label: 'Физичко — домашно' }, { value: 'natural_foreign', label: 'Физичко — странско' } ], helpText: 'Управителот е физичко лице — домашно (ЕМБГ) или странско (пасош).' },
      { name: 'name', type: 'text', label: 'Име и презиме', placeholder: 'пр. Марко Марковски', helpText: 'Целосно име и презиме на управителот според личната карта/пасош.' },
      { name: 'country', type: 'text', label: 'Државјанство', placeholder: 'пр. Република Србија', condition: (item) => item.personType === 'natural_foreign', helpText: 'Се пополнува само за странски управител.' },
      { name: 'city', type: 'text', label: 'Град', placeholder: 'пр. Скопје', helpText: 'Местото на живеење на управителот.' },
      { name: 'address', type: 'text', label: 'Адреса на живеење', placeholder: 'пр. ул. Прва бр. 1, Скопје', helpText: 'Адреса на живеење на управителот.' },
      { name: 'idNumber', type: 'text', label: 'ЕМБГ / пасош', placeholder: 'пр. 1234567890123', helpText: 'ЕМБГ (13 цифри) за домашен или број на пасош за странски управител.' },
      { name: 'isFounder', type: 'select', label: 'Е и основач', options: [ { value: 'да', label: 'Да' }, { value: 'не', label: 'Не' } ], helpText: 'Дали управителот е воедно и основач (влијае на изјавите што ги потпишува).' },
      { name: 'powers', type: 'select', label: 'Овластувања', options: [ { value: 'unlimited', label: 'Неограничени' }, { value: 'limited', label: 'Ограничени' } ], helpText: 'Неограничени овластувања во внатрешниот и надворешниот промет, или ограничени со праг над кој е потребна согласност.' },
      { name: 'limitEUR', type: 'text', label: 'Праг за ограничување (ЕУР)', placeholder: 'пр. 10.000', condition: (item) => item.powers === 'limited', helpText: 'Износ над кој управителот бара претходна писмена согласност на содружникот/собирот.' }
    ]
  },

  fields: {
    // --- Step 1: company + capital ---
    companyForm: {
      name: 'companyForm', type: 'select', label: 'Форма на друштво', step: 1, required: true,
      options: [ { value: 'dooel', label: 'ДООЕЛ (еден основач)' }, { value: 'doo', label: 'ДОО (двајца или повеќе)' } ],
      helpText: 'ДООЕЛ има еден основач (конститутивен акт = Изјава за основање). ДОО има двајца или повеќе (конститутивен акт = Договор за основање).'
    },
    companyFullName: {
      name: 'companyFullName', type: 'text', label: 'Полн назив на друштвото', step: 1, required: true,
      placeholder: 'пр. Друштво за трговија и услуги ПРИМЕР ДООЕЛ Скопје',
      helpText: 'Целосниот назив со дејноста + ДОО/ДООЕЛ + град. Се запишува во Трговскиот регистар.'
    },
    companyShortName: {
      name: 'companyShortName', type: 'text', label: 'Скратен назив', step: 1, required: true,
      placeholder: 'пр. ПРИМЕР ДООЕЛ Скопје',
      helpText: 'Скратениот назив на друштвото (бренд + форма + град).'
    },
    companyForeignName: {
      name: 'companyForeignName', type: 'text', label: 'Назив во странство (латиница)', step: 1,
      placeholder: 'пр. Company for trade and services PRIMER DOOEL Skopje',
      helpText: 'Називот на латиница за меѓународен промет — единствениот дозволен исклучок од кирилица.'
    },
    companySeat: {
      name: 'companySeat', type: 'text', label: 'Седиште (адреса)', step: 1, required: true,
      placeholder: 'пр. ул. Прва бр. 1, Скопје – Центар, Република Северна Македонија',
      helpText: 'Целосна адреса на седиштето: улица + населба + општина + Република Северна Македонија.'
    },
    companyCity: {
      name: 'companyCity', type: 'text', label: 'Град / општина', step: 1, placeholder: 'пр. Скопје',
      helpText: 'Градот од суфиксот на називот (Скопје, Битола, Кавадарци…).'
    },
    nkdActivity: {
      name: 'nkdActivity', type: 'text', label: 'Приоритетна дејност (НКД шифра и назив)', step: 1, required: true,
      placeholder: 'пр. 62.01 – Компјутерско програмирање',
      helpText: 'Главната приходна шифра + назив од Националната класификација на дејности (НКД). Внимание: системот НЕ ја проверува шифрата — мора да постои во официјалниот НКД список.'
    },
    businessClause: {
      name: 'businessClause', type: 'textarea', label: 'Предмет на работење (клаузула)', step: 1, rows: 2, maxLength: 800,
      placeholder: 'Општа клаузула за бизнис.',
      helpText: 'Текстот што се запишува како предмет на работење. По правило „Општа клаузула за бизнис".'
    },
    contributionType: {
      name: 'contributionType', type: 'select', label: 'Вид на влог', step: 1, required: true,
      options: [ { value: 'monetary', label: 'Паричен влог' }, { value: 'non_monetary', label: 'Непаричен влог (ствари)' } ],
      helpText: 'Основната главнина може да биде паричен влог или непаричен влог (подвижни предмети). Кај непаричен влог дополнително се генерираат Изјава чл. 34/35/172/176/177 и Договор за непаричен влог.'
    },
    paymentTiming: {
      name: 'paymentTiming', type: 'select', label: 'Рок на уплата (паричен влог)', step: 1,
      options: [ { value: 'at_incorporation', label: 'Во целост при основањето' }, { value: 'within_one_year', label: 'Во рок од една година од уписот' } ],
      condition: (fd) => fd.contributionType !== 'non_monetary',
      helpText: 'Паричниот влог може да се уплати во целост при основањето или најдоцна во рок од една година од уписот во трговскиот регистар.'
    },
    capitalEUR: {
      name: 'capitalEUR', type: 'text', label: 'Основна главнина (ЕУР)', step: 1, required: true, inputMode: 'numeric',
      placeholder: 'пр. 5.000',
      helpText: 'Вкупната основна главнина во евра. Законски минимум е ЕУР 5.000. Денарската противвредност се пресметува автоматски (1 ЕУР = 61,65 ден).'
    },
    capitalWords: {
      name: 'capitalWords', type: 'text', label: 'Основна главнина со зборови', step: 1,
      placeholder: 'пр. (пет илјади евра)',
      helpText: 'Износот на основната главнина искажан со зборови, во заграда.'
    },
    appraiser: {
      name: 'appraiser', type: 'text', label: 'Овластен проценувач (непаричен влог)', step: 1,
      placeholder: 'пр. Друштво за проценка ПРОЦЕНА ДОО Скопје, овластен проценувач',
      condition: (fd) => fd.contributionType === 'non_monetary',
      helpText: 'Назив на овластениот проценувач што ја извршил проценката на непаричниот влог. Се наведува во Изјавата чл. 35 и во Договорот за непаричен влог.'
    },

    // --- Step 4: registration agent + general ---
    date: {
      name: 'date', type: 'date', label: 'Датум на основање', step: 4, required: true,
      helpText: 'Датумот на конститутивниот акт. Сите документи во пакетот го носат истиот датум.'
    },
    agentName: {
      name: 'agentName', type: 'text', label: 'Регистрационен агент (адвокат/друштво)', step: 4,
      placeholder: 'пр. Адвокатско друштво Пример и Партнери',
      helpText: 'Назив на адвокатот/адвокатското друштво кое како регистрационен агент ги поднесува документите. Не е хардкодирано — внесете го вашиот агент.'
    },
    agentAddress: {
      name: 'agentAddress', type: 'text', label: 'Адреса на агентот', step: 4,
      placeholder: 'пр. ул. Македонија бр. 26/1-5, Скопје',
      helpText: 'Седиштето/адресата на регистрациониот агент.'
    },
    agentPersons: {
      name: 'agentPersons', type: 'textarea', label: 'Овластени лица кај агентот', step: 4, rows: 2, maxLength: 800,
      placeholder: 'пр. адвокат Марко Марковски и адвокатски приправник Ана Анеска',
      helpText: 'Адвокатите/приправниците што се овластуваат во полномошното (по желба).'
    },
    agentBlock: {
      name: 'agentBlock', type: 'textarea', label: 'Целосен текст за агентот (по желба)', step: 4, rows: 2, maxLength: 1000,
      placeholder: 'пр. го овластувам Адвокатско друштво …, со седиште на …, преку адвокат …',
      helpText: 'Опционо: целосна формулација на агентскиот блок што се вметнува во полномошното. Ако е празно, се составува од називот и адресата погоре.'
    },
    specialClauses: {
      name: 'specialClauses', type: 'textarea', label: 'Дополнителни одредби (ДОО)', step: 4, rows: 3, maxLength: 2000,
      placeholder: 'Дополнителни клаузули за Договорот за основање (по желба).',
      helpText: 'Опционо: дополнителни клаузули што се додаваат на крајот од Договорот за основање (само за ДОО).'
    }
  }
};

/** Returns the plain fields belonging to a step (in declaration order). */
export const getStepFields = (step) =>
  Object.values(companyIncorporationConfig.fields).filter((f) => f.step === step);

export default companyIncorporationConfig;
