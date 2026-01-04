import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Services Contract Document Configuration (Договор за услуги)
 * Based on Macedonian Law Articles 619-648 (Contract for Work)
 * This configuration drives the entire form behavior, validation, and API integration
 */

// Service type templates with auto-population data
export const serviceTemplates = {
  software: {
    label: 'Развој на софтвер и IT услуги',
    description: 'Развој на сопствен софтвер, веб апликации или мобилни апликации според спецификациите на клиентот, вклучувајќи дизајн, програмирање, тестирање и имплементација со соодветна документација.',
    deliverables: 'Изворен код, техничка документација, кориснички прирачник, тест извештаи',
    paymentStructure: 'milestone-based',
    inspectionPeriod: '30',
    warrantyPeriod: '6',
    qualityStandards: 'Софтверот мора да ги задоволува функционалните барања од спецификацијата, да биде без критични грешки и да работи на договорената платформа. Развојот следи современи софтверски стандарди за безбедност, перформанси и одржливост.',
    materialProvider: 'provider',
    supervisionRights: 'periodic'
  },
  consulting: {
    label: 'Консултантски услуги',
    description: 'Професионални консултантски услуги за деловно советување, стратешко планирање, организациско развивање или специјализирани експертски анализи и препораки.',
    deliverables: 'Консултантски извештај, препораки и акционен план, презентации за управата',
    paymentStructure: 'time-based',
    inspectionPeriod: '7',
    warrantyPeriod: '1',
    qualityStandards: 'Консултантските услуги треба да бидат изведени според професионалните стандарди на индустријата, со објективни анализи и применливи препораки. Работата се базира на проверени методологии и добра деловна пракса.',
    materialProvider: 'none',
    supervisionRights: 'periodic'
  },
  marketing: {
    label: 'Маркетинг и рекламни услуги',
    description: 'Креирање и спроведување на маркетинг кампањи, дизајн на рекламни материјали, управување со социјални медиуми, SEO/SEM активности и digital marketing стратегии.',
    deliverables: 'Маркетинг стратегија, креативни материјали (графика, видео, копирајтинг), извештаи за перформанси и ROI',
    paymentStructure: 'milestone-based',
    inspectionPeriod: '14',
    warrantyPeriod: '3',
    qualityStandards: 'Маркетинг материјалите мора да одговараат на договорениот бренд identity, да бидат креативно и технички исправни и да ги постигнат договорените KPI цели. Креативната работа треба да биде оригинална и да не крши авторски права.',
    materialProvider: 'provider',
    supervisionRights: 'periodic'
  },
  construction: {
    label: 'Градежни и реновирачки работи',
    description: 'Изведба на градежни, занаетчиски или реновирачки работи на објекти според договорената спецификација, вклучувајќи материјали, работна сила и сите потребни дејства за комплетирање.',
    deliverables: 'Завршен објект според проект, градежен дневник, гаранција за квалитет, технички извештај',
    paymentStructure: 'milestone-based',
    inspectionPeriod: '14',
    warrantyPeriod: '12',
    qualityStandards: 'Работите мора да бидат изведени според важечките градежни стандарди, техничка документација и одобрени проекти, со квалитетни материјали и занаетска изведба. Сите работи треба да ги задоволуваат барањата на Законот за градење.',
    materialProvider: 'mixed',
    supervisionRights: 'full'
  },
  professional: {
    label: 'Професионални услуги (правни, сметководствени)',
    description: 'Професионални услуги од лиценцирани експерти вклучувајќи правно советување, сметководствени услуги, ревизии, даночно планирање или други регулирани професионални активности.',
    deliverables: 'Професионални мислења, извештаи, поднесоци до институции, правни анализи',
    paymentStructure: 'time-based',
    inspectionPeriod: '7',
    warrantyPeriod: '3',
    qualityStandards: 'Услугите мора да бидат изведени според професионалните стандарди и етички кодекси, важечкото законодавство и добрата професионална пракса. Работата треба да биде прецизна, детална и базирана на точна интерпретација на законите.',
    materialProvider: 'none',
    supervisionRights: 'periodic'
  },
  design: {
    label: 'Дизајн и креативни услуги',
    description: 'Креирање на графички дизајн, веб дизајн, лого, бренд идентитет, пакувања, илустрации или други креативни визуелни решенија според барањата на клиентот.',
    deliverables: 'Финални дизајни во едитабилни формати, визуелен идентитет мануал, печатни фајлови',
    paymentStructure: 'milestone-based',
    inspectionPeriod: '7',
    warrantyPeriod: '2',
    qualityStandards: 'Дизајните мора да одговараат на договорениот креативен бриф, да бидат технички исправни за печат/веб употреба и да обезбедат авторски права за користење. Креативната работа треба да биде оригинална и во согласност со современите дизајн трендови.',
    materialProvider: 'provider',
    supervisionRights: 'periodic'
  },
  maintenance: {
    label: 'Одржување и сервисни услуги',
    description: 'Редовно или ad-hoc одржување, сервисирање, поправки и техничка поддршка за опрема, машини, возила или технички системи.',
    deliverables: 'Сервисен извештај, заменети резервни делови, гаранција за извршениот сервис',
    paymentStructure: 'fixed',
    inspectionPeriod: '7',
    warrantyPeriod: '3',
    qualityStandards: 'Сервисните работи мора да ја вратат опремата во исправна работна состојба, да се користат квалитетни резервни делови и да се следат препораки на производителот. Работата треба да биде безбедна и да не предизвика понатамошни проблеми.',
    materialProvider: 'mixed',
    supervisionRights: 'final'
  },
  training: {
    label: 'Обуки и едукативни услуги',
    description: 'Изведба на специјализирани обуки, семинари, работилници или едукативни програми за вработени или клиенти на нарачателот, со соодветни материјали и сертификати.',
    deliverables: 'Обучни материјали, сертификати за учесниците, евалуациски извештај',
    paymentStructure: 'fixed',
    inspectionPeriod: '7',
    warrantyPeriod: '1',
    qualityStandards: 'Обуките мора да ги покријат договорените теми, да бидат изведени од квалификувани обучувачи и да обезбедат применливи знаења и вештини. Учесниците треба да добијат сертификати и материјали за понатамошна референца.',
    materialProvider: 'provider',
    supervisionRights: 'full'
  },
  translation: {
    label: 'Преведувачки и локализациски услуги',
    description: 'Професионални преводи на документи, веб содржини, маркетинг материјали или софтвер со локализација за македонски или странски јазици, вклучувајќи лекторирање и проверка.',
    deliverables: 'Преведени документи, терминолошки речник, квалитетски извештај',
    paymentStructure: 'fixed',
    inspectionPeriod: '14',
    warrantyPeriod: '6',
    qualityStandards: 'Преводите мора да бидат точни, да го задржат значењето на оригиналот, да бидат граматички исправни и прилагодени на културниот контекст на целниот јазик. Се применуваат стандарди ISO 17100 за квалитет на преведување.',
    materialProvider: 'none',
    supervisionRights: 'periodic'
  },
  events: {
    label: 'Организација на настани и eventi',
    description: 'Планирање, организација и изведба на деловни или промотивни настани, конференции, семинари, лансирања или тим билдинг активности со комплетна логистика.',
    deliverables: 'Евент план и тајмлајн, координација на добавувачи, post-event извештај со фотографии',
    paymentStructure: 'milestone-based',
    inspectionPeriod: '7',
    warrantyPeriod: '1',
    qualityStandards: 'Настанот мора да биде изведен според договорениот концепт, во рамките на буџетот, со професионална координација и задоволство на учесниците. Сите логистички детали треба да бидат безгрешно организирани.',
    materialProvider: 'mixed',
    supervisionRights: 'full'
  },
  general: {
    label: 'Општи услуги (General Services)',
    description: 'Општи професионални услуги кои не спаѓаат во специфични категории. Опишете ја точно услугата што ја нудите или користите.',
    deliverables: 'Опишете ги очекуваните резултати или испораки за оваа услуга.',
    paymentStructure: 'fixed',
    inspectionPeriod: '14',
    warrantyPeriod: '6',
    qualityStandards: 'Услугата мора да биде изведена професионално, навремено и во согласност со договорените барања и стандарди на индустријата. Работата треба да ги задоволува очекувањата на клиентот и применливите законски барања.',
    materialProvider: 'mixed',
    supervisionRights: 'periodic'
  }
};

export const servicesContractConfig = {
  documentType: 'servicesContract',
  apiEndpoint: 'services-contract',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration (7 steps)
  steps: [
    {
      id: 1,
      title: 'Вид на услуга',
      description: 'Изберете го видот на услуга и основни податоци',
      requiredFields: ['serviceType', 'contractDate', 'contractLocation', 'userRole']
    },
    {
      id: 2,
      title: 'Податоци за другата страна',
      description: 'Информации за клиентот или давателот на услуга',
      requiredFields: []
    },
    {
      id: 3,
      title: 'Детали за извршување',
      description: 'Опис на услугата, резултати и рокови',
      requiredFields: ['serviceDescription', 'deliverables', 'startDate', 'deadline']
    },
    {
      id: 4,
      title: 'Плаќање и надоместок',
      description: 'Структура на плаќање, цена и банкарски детали',
      requiredFields: ['paymentStructure', 'paymentDeadline', 'bankAccount', 'bankName']
    },
    {
      id: 5,
      title: 'Материјали и ресурси',
      description: 'Обезбедување на материјали и опрема',
      requiredFields: ['materialProvider']
    },
    {
      id: 6,
      title: 'Квалитет и примопредавање',
      description: 'Стандарди, инспекција и гаранција',
      requiredFields: ['qualityStandards', 'acceptanceProcedure', 'inspectionPeriod', 'warrantyPeriod']
    },
    {
      id: 7,
      title: 'Завршни одредби',
      description: 'Раскинување, доверливост и решавање на спорови',
      requiredFields: ['disputeResolution']
    }
  ],

  // Form fields configuration
  fields: {
    // STEP 1: Service Type & Basic Info
    serviceType: {
      name: 'serviceType',
      type: 'select',
      label: 'Вид на услуга',
      placeholder: 'Изберете вид на услуга',
      required: true,
      options: [
        { value: '', label: 'Избери вид на услуга' },
        { value: 'software', label: serviceTemplates.software.label },
        { value: 'consulting', label: serviceTemplates.consulting.label },
        { value: 'marketing', label: serviceTemplates.marketing.label },
        { value: 'construction', label: serviceTemplates.construction.label },
        { value: 'professional', label: serviceTemplates.professional.label },
        { value: 'design', label: serviceTemplates.design.label },
        { value: 'maintenance', label: serviceTemplates.maintenance.label },
        { value: 'training', label: serviceTemplates.training.label },
        { value: 'translation', label: serviceTemplates.translation.label },
        { value: 'events', label: serviceTemplates.events.label },
        { value: 'general', label: serviceTemplates.general.label }
      ],
      helpText: 'Изберете го видот на услуга која е предмет на договорот. Вашиот избор ќе автоматски пополни препорачани вредности за квалитетски стандарди, гарантни рокови и структура на плаќање според Законот за облигациони односи (Членови 619-648).'
    },

    contractDate: {
      name: 'contractDate',
      type: 'date',
      label: 'Датум на склучување на договорот',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога се склучува договорот за услуги. Овој датум е почеток на договорниот однос и е релевантен за сметање на рокови за извршување и застареност согласно ЗОО.'
    },

    contractLocation: {
      name: 'contractLocation',
      type: 'text',
      label: 'Место на склучување',
      placeholder: 'пр. Скопје',
      required: true,
      helpText: 'Внесете го градот каде што се склучува договорот. Местото на склучување е релевантно за определување на надлежен суд во случај на спорови (Член 14 од договорот).'
    },

    userRole: {
      name: 'userRole',
      type: 'select',
      label: 'Вашата компанија е',
      placeholder: 'Изберете улога',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'давател', label: 'Давател на услугата (Service Provider)' },
        { value: 'корисник', label: 'Корисник на услугата (Client)' }
      ],
      helpText: 'Изберете дали вашата компанија ја обезбедува услугата или ја нарачува/користи. Оваа улога определува кои податоци за другата страна треба да ги внесете и кои права и обврски ги имате согласно Членови 622-626 од ЗОО.'
    },

    // STEP 2: Other Party Information
    clientName: {
      name: 'clientName',
      type: 'text',
      label: 'Име на корисникот на услугата',
      placeholder: 'пр. ДОО Бизнис Скопје',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го целото правно име на компанијата-корисник која ја нарачува/користи вашата услуга, точно како што е запишано во Централниот регистар на Република Северна Македонија.'
    },

    clientAddress: {
      name: 'clientAddress',
      type: 'text',
      label: 'Адреса на седиште на корисникот',
      placeholder: 'пр. Даме Груев 12, Скопје 1000',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете ја целата адреса на седиштето на корисникот (улица, број, град, поштенски број) според податоците од Централниот регистар.'
    },

    clientTaxNumber: {
      name: 'clientTaxNumber',
      type: 'text',
      label: 'Даночен број на корисникот',
      placeholder: 'пр. 4030123456789',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го единствениот даночен број на корисникот (ЕМБС за правни лица) според податоците од Централниот регистар или деловниот извод.'
    },

    clientManager: {
      name: 'clientManager',
      type: 'text',
      label: 'Управител/директор на корисникот',
      placeholder: 'пр. Петар Петровски',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го целото име и презиме на лицето овластено да ја претставува и застапува компанијата-корисник (обично управител или извршен директор) според Решението за запишување во Централниот регистар.'
    },

    providerName: {
      name: 'providerName',
      type: 'text',
      label: 'Име на давателот на услуга',
      placeholder: 'пр. ДОО Професионал Скопје',
      required: false,
      condition: (formData) => formData.userRole === 'корисник',
      helpText: 'Внесете го целото правно име на компанијата која обезбедува услугата, точно како што е запишано во Централниот регистар на Република Северна Македонија.'
    },

    providerAddress: {
      name: 'providerAddress',
      type: 'text',
      label: 'Адреса на седиште на давателот',
      placeholder: 'пр. Партизанска 25, Скопје 1000',
      required: false,
      condition: (formData) => formData.userRole === 'корисник',
      helpText: 'Внесете ја целата адреса на седиштето на давателот на услуга (улица, број, град, поштенски број) според податоците од Централниот регистар.'
    },

    providerTaxNumber: {
      name: 'providerTaxNumber',
      type: 'text',
      label: 'Даночен број на давателот',
      placeholder: 'пр. 4030987654321',
      required: false,
      condition: (formData) => formData.userRole === 'корисник',
      helpText: 'Внесете го единствениот даночен број на давателот на услуга (ЕМБС за правни лица) според податоците од Централниот регистар или деловниот извод.'
    },

    providerManager: {
      name: 'providerManager',
      type: 'text',
      label: 'Управител/директор на давателот',
      placeholder: 'пр. Ана Ивановска',
      required: false,
      condition: (formData) => formData.userRole === 'корисник',
      helpText: 'Внесете го целото име и презиме на лицето овластено да ја претставува и застапува компанијата-давател на услуга (обично управител или извршен директор) според Решението за запишување во Централниот регистар.'
    },

    // STEP 3: Service Details & Execution
    serviceDescription: {
      name: 'serviceDescription',
      type: 'textarea',
      label: 'Детален опис на услугата',
      placeholder: 'Се менува динамично според избраниот вид на услуга...',
      required: true,
      rows: 6,
      maxLength: 2000,
      helpText: 'Прецизно опишете ја услугата која треба да се изведе согласно Член 619 од Законот за облигациони односи. Внесете што услугата опфаќа, очекувани резултати, технички спецификации и сите релевантни детали кои јасно ја дефинираат работата.'
    },

    deliverables: {
      name: 'deliverables',
      type: 'textarea',
      label: 'Очекувани резултати/испораки',
      placeholder: 'Се менува динамично според избраниот вид на услуга...',
      required: true,
      rows: 4,
      maxLength: 1000,
      helpText: 'Наведете ги конкретните резултати/испораки кои давателот на услугата треба да ги достави согласно Член 619. Јасното дефинирање помага при утврдување на исполнетоста на договорот и квалитетот на работата (Член 633-640).'
    },

    startDate: {
      name: 'startDate',
      type: 'date',
      label: 'Почеток на извршување',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога давателот треба да започне со извршување на услугата. Според Член 626 од ЗОО, давателот е должен навремено да ја изврши работата.'
    },

    deadline: {
      name: 'deadline',
      type: 'date',
      label: 'Рок за завршување',
      placeholder: '',
      required: true,
      helpText: 'Внесете го крајниот датум до кога услугата мора да биде целосно завршена и предадена. Задоцнетото извршување може да резултира со обештетување согласно Член 626 од ЗОО и општите правила за задоцнување.'
    },

    deadlineExtensionAllowed: {
      name: 'deadlineExtensionAllowed',
      type: 'checkbox',
      label: 'Дозволено продолжување на рокот со согласност',
      required: false,
      helpText: 'Штиклирајте доколку страните може да договорат продолжување на рокот за завршување во случај на објективни причини (виша сила, промена на обем на работа, доцнење со обезбедување на материјали или информации).'
    },

    executionLocation: {
      name: 'executionLocation',
      type: 'text',
      label: 'Место на извршување',
      placeholder: 'пр. Седиште на клиентот, локација на објект, онлајн',
      required: false,
      helpText: 'Внесете каде физички се изведува услугата. Ова е релевантно за градежни работи, сервиси на лице место или услуги кои бараат физичко присуство.'
    },

    supervisionRights: {
      name: 'supervisionRights',
      type: 'select',
      label: 'Права на надзор на корисникот (Член 622)',
      placeholder: 'Изберете вид на надзор',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'full', label: 'Целосен надзор (корисникот може да надгледува во секое време)' },
        { value: 'periodic', label: 'Периодичен надзор (договорени checkpoint-и)' },
        { value: 'final', label: 'Само финална инспекција (без надзор за време на работа)' }
      ],
      helpText: 'Изберете го нивото на надзор кое корисникот може да го врши за време на извршувањето согласно Член 622 од ЗОО. Надзорот обезбедува дека работата се изведува правилно и навремено.'
    },

    // STEP 4: Payment Structure & Terms
    paymentStructure: {
      name: 'paymentStructure',
      type: 'select',
      label: 'Структура на плаќање (Член 642)',
      placeholder: 'Изберете структура на плаќање',
      required: true,
      options: [
        { value: '', label: 'Избери структура на плаќање' },
        { value: 'fixed', label: 'Фиксна цена (паушал - договорен износ)' },
        { value: 'time-based', label: 'Временски базирано (часовна стапка x часови)' },
        { value: 'milestone-based', label: 'Според фази/милстони (плаќање по етапи)' }
      ],
      helpText: 'Изберете како се пресметува цената на услугата согласно Член 642 од ЗОО. Фиксна цена е договорен износ за цела услуга, временски е по часови/денови, милстони се етапни плаќања.'
    },

    // Fixed price fields
    totalAmount: {
      name: 'totalAmount',
      type: 'number',
      label: 'Вкупен износ (денари)',
      placeholder: '50000',
      min: 1,
      step: 1,
      required: false,
      condition: (formData) => formData.paymentStructure === 'fixed',
      helpText: 'Внесете го договорениот фиксен износ за целата услуга во денари. Овој износ опфаќа сè што е договорено и не подлежи на промена освен со анекс на договорот.'
    },

    advancePayment: {
      name: 'advancePayment',
      type: 'checkbox',
      label: 'Аванс при почеток',
      required: false,
      condition: (formData) => formData.paymentStructure === 'fixed',
      helpText: 'Штиклирајте доколку корисникот плаќа аванс/акондација пред почеток на работата. Авансот е вообичаена пракса за покривање на почетни трошоци за материјали и мобилизација.'
    },

    advancePaymentPercentage: {
      name: 'advancePaymentPercentage',
      type: 'number',
      label: 'Процент на аванс (%)',
      placeholder: '30',
      min: 10,
      max: 50,
      step: 1,
      required: false,
      condition: (formData) => formData.paymentStructure === 'fixed' && formData.advancePayment === true,
      helpText: 'Внесете го процентот од вкупната цена кој се плаќа како аванс (обично 20-30%). Авансот се одбива од конечната фактура.'
    },

    // Time-based fields
    hourlyRate: {
      name: 'hourlyRate',
      type: 'number',
      label: 'Часовна стапка (денари)',
      placeholder: '2000',
      min: 1,
      step: 1,
      required: false,
      condition: (formData) => formData.paymentStructure === 'time-based',
      helpText: 'Внесете ја цената по работен час. Вкупната цена се пресметува како: часовна стапка x реално работени часови.'
    },

    estimatedHours: {
      name: 'estimatedHours',
      type: 'number',
      label: 'Проценет број на часови',
      placeholder: '40',
      min: 1,
      step: 1,
      required: false,
      condition: (formData) => formData.paymentStructure === 'time-based',
      helpText: 'Внесете проценет број на часови за завршување на услугата. Ова е само проценка - конечната цена зависи од реално работените часови.'
    },

    maxBudget: {
      name: 'maxBudget',
      type: 'number',
      label: 'Максимален буџет (опционо)',
      placeholder: '100000',
      min: 1,
      step: 1,
      required: false,
      condition: (formData) => formData.paymentStructure === 'time-based',
      helpText: 'Опционално внесете максимален износ кој не може да се надмине. Ова обезбедува буџетска контрола и согласно Член 642 претставува договорена горна граница.'
    },

    // Milestone-based fields
    numberOfMilestones: {
      name: 'numberOfMilestones',
      type: 'number',
      label: 'Број на фази/милстони',
      placeholder: '3',
      min: 2,
      max: 10,
      step: 1,
      required: false,
      condition: (formData) => formData.paymentStructure === 'milestone-based',
      helpText: 'Внесете колку фази/етапи има извршувањето на услугата (минимум 2, максимум 10). За секоја фаза ќе дефинирате опис, процент и износ.'
    },

    // Common payment fields
    paymentDeadline: {
      name: 'paymentDeadline',
      type: 'number',
      label: 'Рок за плаќање (денови)',
      placeholder: '30',
      min: 7,
      max: 120,
      step: 1,
      required: true,
      helpText: 'Внесете во колку денови по издавање на фактурата треба да се изврши плаќањето (обично 15, 30 или 60 денови). Според Законот за финансиска дисциплина, стандардниот рок е 60 денови за деловни трансакции.'
    },

    bankAccount: {
      name: 'bankAccount',
      type: 'text',
      label: 'Број на трансакциска сметка',
      placeholder: 'пр. 200000012345678',
      required: true,
      helpText: 'Внесете го бројот на жиро-сметка на давателот на услугата каде што треба да се врши уплатата. Проверете дека бројот е точен и активен.'
    },

    bankName: {
      name: 'bankName',
      type: 'select',
      label: 'Банка',
      placeholder: 'Изберете банка',
      required: true,
      options: [
        { value: '', label: 'Избери банка' },
        { value: 'Комерцијална банка АД Скопје', label: 'Комерцијална банка АД Скопје' },
        { value: 'Стопанска банка АД Скопје', label: 'Стопанска банка АД Скопје' },
        { value: 'НЛБ банка АД Скопје', label: 'НЛБ банка АД Скопје' },
        { value: 'Халк банка АД Скопје', label: 'Халк банка АД Скопје' },
        { value: 'Шпаркасе банка АД Скопје', label: 'Шпаркасе банка АД Скопје' },
        { value: 'ПроKредит банка АД Скопје', label: 'ПроKредит банка АД Скопје' },
        { value: 'Универзална инвестициона банка АД Скопје', label: 'Универзална инвестициона банка АД Скопје' },
        { value: 'Централна кооперативна банка АД Скопје', label: 'Централна кооперативна банка АД Скопје' },
        { value: 'АЛТА банка АД Битола', label: 'АЛТА банка АД Битола' },
        { value: 'ТТК банка АД Скопје', label: 'ТТК банка АД Скопје' },
        { value: 'Силк Роуд Банка АД Скопје', label: 'Силк Роуд Банка АД Скопје' },
        { value: 'Капитал банка АД Скопје', label: 'Капитал банка АД Скопје' },
        { value: 'Развојна банка на Северна Македонија АД Скопје', label: 'Развојна банка на Северна Македонија АД Скопје' }
      ],
      helpText: 'Изберете ја банката каде што е отворена трансакциската сметка на давателот на услугата. Користете го точното правно име на банката.'
    },

    includesVAT: {
      name: 'includesVAT',
      type: 'checkbox',
      label: 'Цената вклучува ДДВ',
      required: false,
      helpText: 'Штиклирајте доколку договорената цена веќе содржи данок на додадена вредност (18%). Ако не е штиклирано, ДДВ се додава на цената.'
    },

    latePaymentPenalty: {
      name: 'latePaymentPenalty',
      type: 'number',
      label: 'Казнена камата за задоцнето плаќање (% дневно)',
      placeholder: '0.3',
      min: 0.1,
      max: 1,
      step: 0.1,
      required: false,
      helpText: 'Внесете процент на дневна казнена камата за задоцнето плаќање (обично 0.3% дневно). Според Законот за финансиска дисциплина, законската казнена камата е пропишана стапка на НБРМ.'
    },

    // STEP 5: Materials & Resources
    materialProvider: {
      name: 'materialProvider',
      type: 'select',
      label: 'Обезбедување на материјали (Член 620-621)',
      placeholder: 'Изберете',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'provider', label: 'Давателот на услугата ги обезбедува сите материјали' },
        { value: 'client', label: 'Корисникот ги обезбедува сите материјали' },
        { value: 'mixed', label: 'Мешано (делумно давател, делумно корисник)' },
        { value: 'none', label: 'Не се применува (интелектуални услуги без материјали)' }
      ],
      helpText: 'Изберете кој ги обезбедува материјалите според Член 620-621 од ЗОО. Ова влијае на ризикот, цената и обврските за квалитет на материјалите. Ако давателот ги обезбедува, тој одговара за нивниот квалитет.'
    },

    materialsDescription: {
      name: 'materialsDescription',
      type: 'textarea',
      label: 'Опис на материјали',
      placeholder: 'пр. Градежни материјали, софтверски алатки, канцелариски материјали...',
      rows: 3,
      maxLength: 500,
      required: false,
      condition: (formData) => ['provider', 'client', 'mixed'].includes(formData.materialProvider),
      helpText: 'Опишете кои материјали, опрема, алатки или ресурси се потребни за извршување на услугата и кој точно ги обезбедува. Јасното дефинирање спречува спорови за обврски.'
    },

    materialsCostIncluded: {
      name: 'materialsCostIncluded',
      type: 'checkbox',
      label: 'Трошоците за материјали се вклучени во цената',
      required: false,
      condition: (formData) => formData.materialProvider === 'provider',
      helpText: 'Штиклирајте доколку договорената цена веќе ги опфаќа трошоците за материјали. Ако не е штиклирано, материјалите се фактурираат одделно.'
    },

    // STEP 6: Quality & Acceptance
    qualityStandards: {
      name: 'qualityStandards',
      type: 'textarea',
      label: 'Стандарди за квалитет и професионалност',
      placeholder: 'Се пополнува автоматски според избраниот вид на услуга...',
      rows: 5,
      maxLength: 1500,
      required: true,
      helpText: 'Опишете ги стандардите кои работата мора да ги задоволува согласно Член 626 од ЗОО (правилно и навремено извршување). Вклучете технички спецификации, индустриски стандарди, законски барања или професионални кодекси.'
    },

    acceptanceProcedure: {
      name: 'acceptanceProcedure',
      type: 'select',
      label: 'Постапка за примопредавање (Член 633)',
      placeholder: 'Изберете постапка',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'written-protocol', label: 'Писмен записник за примопредавање' },
        { value: 'inspection-approval', label: 'Инспекција и писмено одобрение' },
        { value: 'email-confirmation', label: 'Потврда преку е-пошта' },
        { value: 'automatic', label: 'Автоматска акцептација без приговор во рок' }
      ],
      helpText: 'Изберете како се врши прифаќањето на завршената работа согласно Член 633 од ЗОО. Писмен записник е најсигурна форма, а автоматска акцептација значи дека недостатоците мора да се пријават во рок, инаку работата се смета за прифатена.'
    },

    inspectionPeriod: {
      name: 'inspectionPeriod',
      type: 'number',
      label: 'Рок за инспекција и пријава на недостатоци (денови)',
      placeholder: '14',
      min: 7,
      max: 60,
      step: 1,
      required: true,
      helpText: 'Внесете во колку денови по примопредавањето корисникот мора да ја инспектира работата и да пријави видливи недостатоци согласно Член 634-635 од ЗОО. Стандардно е 7-30 денови зависно од сложеност.'
    },

    warrantyPeriod: {
      name: 'warrantyPeriod',
      type: 'number',
      label: 'Гарантен период за скриени недостатоци (месеци)',
      placeholder: '6',
      min: 1,
      max: 24,
      step: 1,
      required: true,
      helpText: 'Внесете колку месеци по примопредавањето давателот гарантира за квалитетот и одговара за скриени недостатоци согласно Член 637-640 од ЗОО. Обично 6-12 месеци, за градежни работи до 24 месеци.'
    },

    defectRemedies: {
      name: 'defectRemedies',
      type: 'select',
      label: 'Права на корисникот при недостатоци (Член 637-640)',
      placeholder: 'Изберете права (може повеќе)',
      required: false,
      multiple: true,
      options: [
        { value: 'repair', label: 'Отстранување на недостатоци (поправка)' },
        { value: 'price-reduction', label: 'Намалување на цената' },
        { value: 'redo', label: 'Повторно извршување на работата' },
        { value: 'termination', label: 'Раскинување на договорот и враќање на цената' }
      ],
      helpText: 'Изберете кои права корисникот ги има доколку работата има материјални недостатоци согласно Член 637-640 од ЗОО. Обично се дозволуваат сите законски опции, освен ако странките не договорат поинаку.'
    },

    // STEP 7: Term & Termination
    terminationNotice: {
      name: 'terminationNotice',
      type: 'number',
      label: 'Отказен рок при раскинување (денови)',
      placeholder: '15',
      min: 7,
      max: 60,
      step: 1,
      required: false,
      helpText: 'Внесете колку денови однапред мора да се достави писмено известување за раскинување. Разумен отказен рок е 15-30 денови и служи за планирање и завршување на тековните активности.'
    },

    terminationForBreach: {
      name: 'terminationForBreach',
      type: 'checkbox',
      label: 'Автоматско раскинување при суштествена повреда',
      required: false,
      helpText: 'Штиклирајте доколку договорот автоматски се раскинува при суштествена повреда (пр. неплаќање, голема задоцнување, грубо кршење на стандарди). Според ЗОО, суштествената повреда дава право на итно раскинување.'
    },

    confidentiality: {
      name: 'confidentiality',
      type: 'checkbox',
      label: 'Обврска за доверливост на информации',
      required: false,
      helpText: 'Штиклирајте доколку давателот на услугата мора да ги чува како доверливи деловните информации на корисникот до кои доаѓа при извршување на услугата.'
    },

    disputeResolution: {
      name: 'disputeResolution',
      type: 'select',
      label: 'Решавање на спорови',
      placeholder: 'Изберете метод',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'court', label: 'Надлежен суд во место на корисникот' },
        { value: 'arbitration', label: 'Арбитража' },
        { value: 'mediation-first', label: 'Медијација, потоа суд' }
      ],
      helpText: 'Изберете како се решаваат спорови кои произлегуваат од договорот. Стандардно е надлежен граѓански суд, но странките може да договорат арбитража или медијација за побрзо решавање.'
    }
  },

  // Validation rules
  validationRules: [
    // Step 1
    { field: 'serviceType', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Вид на услуга' },
    { field: 'contractDate', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Датум на склучување' },
    { field: 'contractLocation', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Место на склучување' },
    { field: 'userRole', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Ваша улога' },

    // Step 3
    { field: 'serviceDescription', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Опис на услугата' },
    { field: 'deliverables', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Очекувани резултати' },
    { field: 'startDate', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Почеток на извршување' },
    { field: 'deadline', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Рок за завршување' },

    // Step 4
    { field: 'paymentStructure', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Структура на плаќање' },
    { field: 'paymentDeadline', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Рок за плаќање' },
    { field: 'bankAccount', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Број на сметка' },
    { field: 'bankName', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Банка' },

    // Step 5
    { field: 'materialProvider', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Обезбедување на материјали' },

    // Step 6
    { field: 'qualityStandards', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Стандарди за квалитет' },
    { field: 'acceptanceProcedure', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Постапка за примопредавање' },
    { field: 'inspectionPeriod', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Рок за инспекција' },
    { field: 'warrantyPeriod', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Гарантен период' },

    // Step 7
    { field: 'disputeResolution', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Решавање на спорови' }
  ],

  // Initial form data
  initialFormData: {
    serviceType: '',
    contractDate: '',
    contractLocation: '',
    userRole: '',
    clientName: '',
    clientAddress: '',
    clientTaxNumber: '',
    clientManager: '',
    providerName: '',
    providerAddress: '',
    providerTaxNumber: '',
    providerManager: '',
    serviceDescription: '',
    deliverables: '',
    startDate: '',
    deadline: '',
    deadlineExtensionAllowed: false,
    executionLocation: '',
    supervisionRights: 'periodic',
    paymentStructure: '',
    totalAmount: '',
    advancePayment: false,
    advancePaymentPercentage: '30',
    hourlyRate: '',
    estimatedHours: '',
    maxBudget: '',
    numberOfMilestones: '',
    paymentDeadline: '30',
    bankAccount: '',
    bankName: '',
    includesVAT: false,
    latePaymentPenalty: '0.3',
    materialProvider: '',
    materialsDescription: '',
    materialsCostIncluded: false,
    qualityStandards: '',
    acceptanceProcedure: 'written-protocol',
    inspectionPeriod: '14',
    warrantyPeriod: '6',
    defectRemedies: ['repair', 'price-reduction', 'termination'],
    terminationNotice: '15',
    terminationForBreach: false,
    confidentiality: false,
    disputeResolution: 'court',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['serviceType', 'contractDate', 'contractLocation', 'userRole'],
    2: ['clientName', 'clientAddress', 'clientTaxNumber', 'clientManager', 'providerName', 'providerAddress', 'providerTaxNumber', 'providerManager'],
    3: ['serviceDescription', 'deliverables', 'startDate', 'deadline', 'deadlineExtensionAllowed', 'executionLocation', 'supervisionRights'],
    4: ['paymentStructure', 'totalAmount', 'advancePayment', 'advancePaymentPercentage', 'hourlyRate', 'estimatedHours', 'maxBudget', 'numberOfMilestones', 'paymentDeadline', 'bankAccount', 'bankName', 'includesVAT', 'latePaymentPenalty'],
    5: ['materialProvider', 'materialsDescription', 'materialsCostIncluded'],
    6: ['qualityStandards', 'acceptanceProcedure', 'inspectionPeriod', 'warrantyPeriod', 'defectRemedies'],
    7: ['terminationNotice', 'terminationForBreach', 'confidentiality', 'disputeResolution']
  };

  return fieldsByStep[stepId]?.map(fieldName => servicesContractConfig.fields[fieldName]) || [];
};

export default servicesContractConfig;
