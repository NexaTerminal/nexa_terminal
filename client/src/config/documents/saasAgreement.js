import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * SaaS Agreement Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Follows established patterns from other contract documents
 */
export const saasAgreementConfig = {
  documentType: 'saasAgreement',
  apiEndpoint: 'saas-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за договорните страни и датум на договорот',
      requiredFields: ['agreementDate', 'userRole']
    },
    {
      id: 2,
      title: 'Податоци за другата страна',
      description: 'Информации за клиентот или давателот на услуга',
      requiredFields: []
    },
    {
      id: 3,
      title: 'Опис на услугата',
      description: 'Детали за софтверската услуга',
      requiredFields: ['serviceName', 'serviceDescription']
    },
    {
      id: 4,
      title: 'Финансиски услови',
      description: 'Цена, начин на плаќање и банкарски детали',
      requiredFields: ['subscriptionFee', 'paymentDay', 'bankAccount', 'bankName']
    },
    {
      id: 5,
      title: 'Нивоа на услуга и рокови',
      description: 'Техничка поддршка, системска достапност и времетраење на договорот',
      requiredFields: []
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Information
    agreementDate: {
      name: 'agreementDate',
      type: 'date',
      label: 'Датум на склучување на договорот',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога се склучува договорот за софтверската услуга. Овој датум ќе биде наведен во договорот како „Датум на склучување" и претставува почеток на договорниот однос.'
    },
    effectiveDateType: {
      name: 'effectiveDateType',
      type: 'select',
      label: 'Датум на влегување во сила',
      placeholder: 'Изберете датум на влегување во сила',
      required: true,
      options: [
        { value: 'датум на склучување', label: 'Денот на потпишување (стандардно)' },
        { value: 'специфичен датум', label: 'Специфичен датум (внеси подолу)' }
      ],
      helpText: 'Изберете кога договорот станува правно важечки. Стандардно, договорот важи од датумот на потпишување од двете страни. Ако имате договорено поинакво, изберете „Специфичен датум".'
    },
    specificEffectiveDate: {
      name: 'specificEffectiveDate',
      type: 'date',
      label: 'Специфичен датум на влегување во сила',
      placeholder: '',
      required: false,
      condition: (formData) => formData.effectiveDateType === 'специфичен датум',
      helpText: 'Внесете го конкретниот датум кога договорот треба да влезе во сила, доколку тој е различен од датумот на склучување. Овој датум мора да биде во иднина или идентичен со датумот на склучување.'
    },
    userRole: {
      name: 'userRole',
      type: 'select',
      label: 'Вашата компанија е',
      placeholder: 'Изберете улога',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'давател', label: 'Давател на SaaS услуга (Provider)' },
        { value: 'клиент', label: 'Клиент (Client)' }
      ],
      helpText: 'Изберете дали вашата компанија е давател на софтверската услуга (обезбедува SaaS платформа) или клиент (користи SaaS платформа). Податоците за другата страна ќе ги внесете во следниот чекор.'
    },

    // Step 2: Other Party Information
    clientName: {
      name: 'clientName',
      type: 'text',
      label: 'Име на клиентот',
      placeholder: 'пр. ДОО Технологија Скопје',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го целото правно име на компанијата-клиент која ја користи вашата SaaS услуга, точно како што е запишано во Централниот регистар на Република Северна Македонија.'
    },
    clientAddress: {
      name: 'clientAddress',
      type: 'text',
      label: 'Адреса на седиште на клиентот',
      placeholder: 'пр. Даме Груев 12, Скопје 1000',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете ја целата адреса на седиштето на клиентот (улица, број, град, поштенски број) според податоците од Централниот регистар.'
    },
    clientTaxNumber: {
      name: 'clientTaxNumber',
      type: 'text',
      label: 'Даночен број на клиентот',
      placeholder: 'пр. 4030123456789',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го единствениот даночен број на клиентот (ЕМБС за правни лица) според податоците од Централниот регистар или деловниот извод.'
    },
    clientManager: {
      name: 'clientManager',
      type: 'text',
      label: 'Управител/директор на клиентот',
      placeholder: 'пр. Петар Петровски',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го целото име и презиме на лицето овластено да ја претставува и застапува компанијата-клиент (обично управител или извршен директор) според Решението за запишување во Централниот регистар.'
    },
    providerName: {
      name: 'providerName',
      type: 'text',
      label: 'Име на давателот на услуга',
      placeholder: 'пр. ДОО СофтХаус Скопје',
      required: false,
      condition: (formData) => formData.userRole === 'клиент',
      helpText: 'Внесете го целото правно име на компанијата која обезбедува SaaS услуга, точно како што е запишано во Централниот регистар на Република Северна Македонија.'
    },
    providerAddress: {
      name: 'providerAddress',
      type: 'text',
      label: 'Адреса на седиште на давателот',
      placeholder: 'пр. Партизанска 25, Скопје 1000',
      required: false,
      condition: (formData) => formData.userRole === 'клиент',
      helpText: 'Внесете ја целата адреса на седиштето на давателот на услуга (улица, број, град, поштенски број) според податоците од Централниот регистар.'
    },
    providerTaxNumber: {
      name: 'providerTaxNumber',
      type: 'text',
      label: 'Даночен број на давателот',
      placeholder: 'пр. 4030987654321',
      required: false,
      condition: (formData) => formData.userRole === 'клиент',
      helpText: 'Внесете го единствениот даночен број на давателот на услуга (ЕМБС за правни лица) според податоците од Централниот регистар или деловниот извод.'
    },
    providerManager: {
      name: 'providerManager',
      type: 'text',
      label: 'Управител/директор на давателот',
      placeholder: 'пр. Ана Ивановска',
      required: false,
      condition: (formData) => formData.userRole === 'клиент',
      helpText: 'Внесете го целото име и презиме на лицето овластено да ја претставува и застапува компанијата-давател на услуга (обично управител или извршен директор) според Решението за запишување во Централниот регистар.'
    },

    // Step 3: Service Description
    serviceName: {
      name: 'serviceName',
      type: 'select',
      label: 'Назив на услугата',
      placeholder: 'Изберете вид на SaaS услуга',
      required: true,
      options: [
        { value: 'CRM Платформа', label: 'CRM Платформа (Управување со односи со клиенти)' },
        { value: 'ERP Систем', label: 'ERP Систем (Планирање на ресурси)' },
        { value: 'Систем за управување со проекти', label: 'Систем за управување со проекти' },
        { value: 'Платформа за e-Commerce', label: 'Платформа за e-Commerce' },
        { value: 'Систем за управување со документи', label: 'Систем за управување со документи' },
        { value: 'HR Софтвер', label: 'HR Софтвер (Управување со човечки ресурси)' },
        { value: 'Сметководствен софтвер', label: 'Сметководствен софтвер' },
        { value: 'Маркетинг автоматизација', label: 'Маркетинг автоматизација' },
        { value: 'Софтвер за поддршка на клиенти', label: 'Софтвер за поддршка на клиенти (Help Desk)' },
        { value: 'Систем за email маркетинг', label: 'Систем за email маркетинг' },
        { value: 'Платформа за онлајн обука', label: 'Платформа за онлајн обука (LMS)' },
        { value: 'Систем за управување со залихи', label: 'Систем за управување со залихи' },
        { value: 'Друго', label: 'Друго (внесете рачно)' }
      ],
      helpText: 'Изберете го видот на софтверската услуга која се обезбедува преку договорот. Доколку вашата услуга не е на списокот, изберете "Друго".'
    },
    serviceDescription: {
      name: 'serviceDescription',
      type: 'textarea',
      label: 'Опис на услугата',
      placeholder: 'пр. облачен систем за управување со односи со клиенти вклучувајќи модули за продажба, маркетинг и поддршка',
      required: true,
      rows: 4,
      maxLength: 1500,
      helpText: 'Опишете ја SaaS услугата со детален опис на функционалностите, модулите и можностите што ги нуди. Овој опис дефинира што точно е предмет на договорот и помага во толкување на договорните обврски.'
    },
    serviceURL: {
      name: 'serviceURL',
      type: 'text',
      label: 'URL адреса на услугата',
      placeholder: 'пр. https://app.company.com или https://company.com/terms',
      required: false,
      helpText: 'Внесете ја целата веб-адреса каде што се наоѓаат условите за користење, политиките и SaaS платформата. Ова е важно за правна референца на договорните услови и технички детали.'
    },

    // Step 4: Financial Terms
    subscriptionFee: {
      name: 'subscriptionFee',
      type: 'number',
      label: 'Месечен претплатен надоместок',
      placeholder: '5000',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Внесете го месечниот износ што клиентот го плаќа за користење на SaaS услугата. Внесете го износот во избраната валута (денари, евра или долари) и во форматот: 1000 (без запирки или точки).'
    },
    currency: {
      name: 'currency',
      type: 'select',
      label: 'Валута',
      placeholder: 'Изберете валута',
      required: true,
      options: [
        { value: 'денари', label: 'Денари (MKD)' },
        { value: 'евра', label: 'Евра (EUR)' },
        { value: 'долари', label: 'Долари (USD)' }
      ],
      helpText: 'Изберете ја валутата во која се врши плаќањето на месечниот претплатен надоместок. За договори со странски компании обично се користат евра или долари, додека за домашни договори се користат денари.'
    },
    includesVAT: {
      name: 'includesVAT',
      type: 'checkbox',
      label: 'Цената вклучува ДДВ',
      required: false,
      helpText: 'Штиклирајте го ова поле доколку месечниот надоместок веќе содржи данок на додадена вредност (ДДВ од 18%). Според македонското законодавство, SaaS услугите се предмет на ДДВ доколку давателот е регистриран за ДДВ.'
    },
    paymentDay: {
      name: 'paymentDay',
      type: 'number',
      label: 'Ден во месецот за плаќање',
      placeholder: '5',
      min: 1,
      max: 28,
      step: 1,
      required: true,
      helpText: 'Внесете го денот во месецот кога треба да се изврши плаќањето (препорачливо е од 1 до 28 поради различна должина на месеците). Пример: ако внесете 5, плаќањето е на 5-ти секој месец.'
    },
    bankAccount: {
      name: 'bankAccount',
      type: 'text',
      label: 'Број на трансакциска сметка',
      placeholder: 'пр. 200000012345678',
      required: true,
      helpText: 'Внесете го бројот на трансакциската сметка (жиро-сметка) на давателот на услуга каде што треба да се извршува уплатата. Бројот мора да биде точен и да одговара со официјалните банкарски податоци.'
    },
    bankName: {
      name: 'bankName',
      type: 'select',
      label: 'Име на банка',
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
      helpText: 'Изберете ја банката каде што е отворена трансакциската сметка на давателот на услуга. Користете го точното правно име на банката.'
    },

    // Step 5: Service Levels and Terms
    systemAvailability: {
      name: 'systemAvailability',
      type: 'number',
      label: 'Системска достапност (%)',
      placeholder: '98',
      min: 90,
      max: 100,
      step: 0.1,
      required: false,
      helpText: 'Внесете го минималниот процент на време кога системот треба да биде достапен во текот на месецот (обично 98-99.9%). Ова е важна SLA метрика која дефинира квалитетот на услугата според индустриските стандарди.'
    },
    supportHours: {
      name: 'supportHours',
      type: 'select',
      label: 'Часови за техничка поддршка',
      placeholder: 'Изберете часови за поддршка',
      required: false,
      options: [
        { value: 'работни часови', label: 'Работни часови (09:00-17:00, работни денови)' },
        { value: '24/7', label: '24/7 поддршка (секој ден, 24 часа)' },
        { value: 'работни денови', label: 'Работни денови (09:00-17:00)' },
        { value: 'прилагодени', label: 'Прилагодени часови (наведи во забелешки)' }
      ],
      helpText: 'Изберете го временскиот период во кој е достапна техничката поддршка. Работни часови обично се 09:00-17:00 работни денови, додека 24/7 значи континуирана поддршка секој ден во годината.'
    },
    durationType: {
      name: 'durationType',
      type: 'select',
      label: 'Времетраење на договорот',
      placeholder: 'Изберете времетраење',
      required: true,
      options: [
        { value: 'неопределено', label: 'Неопределено време (се раскинува со отказ)' },
        { value: 'определено', label: 'Определено време (наведи краен датум)' }
      ],
      helpText: 'Изберете дали договорот е на неопределено време (важи додека една страна не го раскине со отказ) или на определено време (важи до конкретен датум). За SaaS договори најчесто се користи неопределено време со можност за раскинување.'
    },
    durationMonths: {
      name: 'durationMonths',
      type: 'number',
      label: 'Времетраење во месеци',
      placeholder: '12',
      min: 1,
      max: 120,
      step: 1,
      required: false,
      condition: (formData) => formData.durationType === 'определено',
      helpText: 'Внесете го бројот на месеци за кои важи договорот (пр. 12 месеци = 1 година, 24 месеци = 2 години). Ова е релевантно само за договори на определено време.'
    },
    endDate: {
      name: 'endDate',
      type: 'date',
      label: 'Краен датум на договорот',
      placeholder: '',
      required: false,
      condition: (formData) => formData.durationType === 'определено',
      helpText: 'Внесете го конкретниот датум кога договорот престанува да важи. Овој датум треба да биде во иднина и да одговара со договореното времетраење на соработката.'
    },
    terminationNoticeDays: {
      name: 'terminationNoticeDays',
      type: 'number',
      label: 'Отказен рок (денови)',
      placeholder: '30',
      min: 7,
      max: 90,
      step: 1,
      required: false,
      helpText: 'Внесете го бројот на денови однапред потребни за известување при раскинување на договорот (обично 30 дена). Според Законот за облигациони односи, разумен отказен рок е неопходен за заштита на двете страни.'
    }
  },

  // Validation rules
  validationRules: [
    // Step 1
    {
      field: 'agreementDate',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на склучување на договорот'
    },
    {
      field: 'effectiveDateType',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на влегување во сила'
    },
    {
      field: 'userRole',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Вашата улога во договорот'
    },

    // Step 3
    {
      field: 'serviceName',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Назив на услугата'
    },
    {
      field: 'serviceDescription',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Опис на услугата'
    },

    // Step 4
    {
      field: 'subscriptionFee',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Месечен претплатен надоместок'
    },
    {
      field: 'currency',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Валута'
    },
    {
      field: 'paymentDay',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Ден во месецот за плаќање'
    },
    {
      field: 'bankAccount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Број на трансакциска сметка'
    },
    {
      field: 'bankName',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име на банка'
    },

    // Step 5
    {
      field: 'durationType',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Времетраење на договорот'
    }
  ],

  // Initial form data
  initialFormData: {
    agreementDate: '',
    effectiveDateType: 'датум на склучување',
    specificEffectiveDate: '',
    userRole: '',
    clientName: '',
    clientAddress: '',
    clientTaxNumber: '',
    clientManager: '',
    providerName: '',
    providerAddress: '',
    providerTaxNumber: '',
    providerManager: '',
    serviceName: '',
    serviceDescription: '',
    serviceURL: '',
    subscriptionFee: '',
    currency: 'денари',
    includesVAT: false,
    paymentDay: '',
    bankAccount: '',
    bankName: '',
    systemAvailability: '98',
    supportHours: 'работни часови',
    durationType: 'неопределено',
    durationMonths: '',
    endDate: '',
    terminationNoticeDays: '30',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['agreementDate', 'effectiveDateType', 'specificEffectiveDate', 'userRole'],
    2: ['clientName', 'clientAddress', 'clientTaxNumber', 'clientManager', 'providerName', 'providerAddress', 'providerTaxNumber', 'providerManager'],
    3: ['serviceName', 'serviceDescription', 'serviceURL'],
    4: ['subscriptionFee', 'currency', 'includesVAT', 'paymentDay', 'bankAccount', 'bankName'],
    5: ['systemAvailability', 'supportHours', 'durationType', 'durationMonths', 'endDate', 'terminationNoticeDays']
  };

  return fieldsByStep[stepId]?.map(fieldName => saasAgreementConfig.fields[fieldName]) || [];
};

export default saasAgreementConfig;
