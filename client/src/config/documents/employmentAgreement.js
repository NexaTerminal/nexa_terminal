import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Employment Agreement Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const employmentAgreementConfig = {
  documentType: 'employmentAgreement',
  apiEndpoint: 'employment-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за работникот',
      requiredFields: [] // All fields are optional
    },
    {
      id: 2,
      title: 'Работни обврски',
      description: 'Задачи и одговорности',
      requiredFields: [] // All fields are optional
    },
    {
      id: 3,
      title: 'Плата и датум',
      description: 'Финансиски информации',
      requiredFields: [] // All fields are optional
    },
    {
      id: 4,
      title: 'Работни услови',
      description: 'Услови на вработување',
      requiredFields: [] // All fields are optional
    },
    {
      id: 5,
      title: 'Дополнителни клаузули',
      description: 'Изберете кои клаузули да бидат вклучени во договорот',
      requiredFields: [] // All fields are optional
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Information
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Лице Лицески',
      required: false,
      helpText: 'Внесете го целосното име и презиме на работникот како што е наведено во личната карта или пасошот.'
    },
    employeeAddress: {
      name: 'employeeAddress',
      type: 'text',
      label: 'Адреса на седиште на работникот',
      placeholder: 'пр. ул. Примерна бр. 123, Скопје',
      required: false,
      helpText: 'Внесете ја адресата на постојано живеење на работникот (улица, број, град) како што е регистрирана.'
    },
    employeePIN: {
      name: 'employeePIN',
      type: 'text',
      label: 'ЕМБГ на работникот',
      placeholder: 'пр. 1234567890123',
      required: false,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      helpText: 'Внесете го ЕМБГ (Единствен матичен број на граѓанин) од точно 13 цифри како што е наведен во личната карта.'
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'searchable-select',
      label: 'Назив на работна позиција',
      placeholder: 'пр. Софтверски инженер или пребарајте од листата',
      required: false,
      searchable: true,
      allowCustom: true,
      dataSource: 'jobs',
      displayField: 'jobPosition',
      helpText: 'Внесете го точниот назив на работната позиција на која ќе биде вработен работникот според систематизацијата на работни места. Можете да пребарувате од листата или да внесете сопствена позиција.'
    },

    // Step 2: Work Tasks
    workTasks: {
      name: 'workTasks',
      type: 'array',
      label: 'Работни обврски',
      placeholder: 'Работна обврска',
      required: false,
      autoFillSource: 'jobPosition',
      autoFillField: 'jobTasks',
      helpText: 'Наведете ги основните задачи и одговорности на работникот. Ако сте избрале позиција од листата, автоматски ќе се пополнат типичните задачи. Можете да ги изменувате, бришете или додавате нови.'
    },

    // Step 3: Salary and Date
    netSalary: {
      name: 'netSalary',
      type: 'number',
      label: 'Основна плата',
      placeholder: 'пр. 25000',
      required: false,
      helpText: 'Внесете ја основната месечна плата во македонски денари. Ова е бруто платата пред одбивање на даноците и придонесите.'
    },
    agreementDate: {
      name: 'agreementDate',
      type: 'date',
      label: 'Датум на склучување на договор за вработување',
      required: false,
      helpText: 'Изберете го датумот кога се потпишува договорот за вработување. Овој датум ќе биде наведен во договорот и обично е денот кога почнува работата.'
    },

    // Additional fields for job position auto-fill
    education: {
      name: 'education',
      type: 'text',
      label: 'Потребно образование',
      placeholder: 'пр. Економски факултет',
      required: false,
      autoFillSource: 'jobPosition',
      autoFillField: 'education',
      helpText: 'Образованието потребно за оваа позиција. Ќе се пополни автоматски ако изберете позиција од листата.'
    },
    certification: {
      name: 'certification',
      type: 'text',
      label: 'Потребни сертификати/лиценци',
      placeholder: 'пр. Сертификат за...',
      required: false,
      autoFillSource: 'jobPosition',
      autoFillField: 'certification',
      helpText: 'Сертификатите или лиценците потребни за оваа позиција. Ќе се пополни автоматски ако изберете позиција од листата.'
    },

    // Step 4: Working Conditions
    placeOfWork: {
      name: 'placeOfWork',
      type: 'select',
      label: 'Место на вршење на работата',
      options: [
        { value: 'просториите на седиштето на работодавачот', label: 'Седиштето на работодавачот' },
        { value: 'Друго место', label: 'Друго место' }
      ],
      required: false,
      helpText: 'Изберете каде ќе ја врши работата работникот. Ако изберете \"Друго место\", ке мора да ја наведете локацијата.'
    },
    otherWorkPlace: {
      name: 'otherWorkPlace',
      type: 'text',
      label: 'Наведете го местото на вршење на работите',
      placeholder: 'пр. Скопје, ул. Примерна 123',
      required: false,
      condition: {
        field: 'placeOfWork',
        operator: '===',
        value: 'Друго место'
      },
      helpText: 'Внесете ја точната адреса каде ќе ја врши работата работникот ако не е во седиштето на компанијата.'
    },
    agreementDurationType: {
      name: 'agreementDurationType',
      type: 'select',
      label: 'Времетраење на договорот за вработување',
      options: [
        { value: 'неопределено времетраење.', label: 'Неопределено времетрање' },
        { value: 'определено времетраење', label: 'Определено времетрање' }
      ],
      required: false,
      helpText: 'Неопределено = договорот важи се доколку едната страна не го откаже. Определено = договорот важи до одреден датум.'
    },
    definedDuration: {
      name: 'definedDuration',
      type: 'date',
      label: 'Краен датум на договор',
      required: false,
      condition: {
        field: 'agreementDurationType',
        operator: '===',
        value: 'определено времетраење'
      },
      helpText: 'Изберете го датумот кога завршува договорот за вработување ако сте избрале определено времетраење. По овој датум договорот автоматски завршува.'
    },
    dailyWorkTime: {
      name: 'dailyWorkTime',
      type: 'select',
      label: 'Дневно работно време',
      options: [
        { value: 'започнува од 08:00 часот, а завршува во 16:00 часот', label: '08:00 - 16:00' },
        { value: 'започнува од 08:30 часот, а завршува во 16:30 часот', label: '08:30 - 16:30' },
        { value: 'започнува од 09:00 часот, а завршува во 17:00 часот', label: '09:00 - 17:00' },
        { value: 'се определува согласно распоред за работно време', label: 'Се определува согласно распоред за работно време' },
        { value: 'other', label: 'Друго' }
      ],
      required: false
    },
    otherWorkTime: {
      name: 'otherWorkTime',
      type: 'text',
      label: 'Наведете го работното време',
      placeholder: 'пр. од 10:00 до 18:00 часот',
      required: false,
      condition: {
        field: 'dailyWorkTime',
        operator: '===',
        value: 'other'
      }
    },
    // Employment type (full / part-time) — Чл. 48–49 ЗРО
    employmentType: {
      name: 'employmentType',
      type: 'select',
      label: 'Вид на работно време',
      options: [
        { value: 'полно', label: 'Полно работно време (40 часа неделно)' },
        { value: 'неполно', label: 'Неполно работно време' }
      ],
      required: false,
      helpText: 'Полно работно време е 40 часа неделно. Ако изберете неполно, во договорот мора да се наведе бројот на неделни часови (Член 48–49 од ЗРО).'
    },
    weeklyHours: {
      name: 'weeklyHours',
      type: 'number',
      label: 'Неделни работни часови',
      placeholder: 'пр. 20',
      required: false,
      condition: {
        field: 'employmentType',
        operator: '===',
        value: 'неполно'
      },
      helpText: 'Внесете го договорениот број часови неделно за неполно работно време (помалку од 40).'
    },
    // Reason for fixed-term contract — Чл. 46 ЗРО
    fixedTermReason: {
      name: 'fixedTermReason',
      type: 'select',
      label: 'Основ за определено времетраење',
      options: [
        { value: 'замена на привремено отсутен работник', label: 'Замена на привремено отсутен работник' },
        { value: 'привремено зголемен обем на работа', label: 'Привремено зголемен обем на работа' },
        { value: 'сезонска работа', label: 'Сезонска работа' },
        { value: 'извршување на проектно определена задача', label: 'Проектно определена задача' },
        { value: 'друго, во согласност со закон', label: 'Друго (во согласност со закон)' }
      ],
      required: false,
      condition: {
        field: 'agreementDurationType',
        operator: '===',
        value: 'определено времетраење'
      },
      helpText: 'Законот бара да се наведе причината за склучување договор на определено време. Без валиден основ, договорот може да се смета за склучен на неопределено време (Член 46 од ЗРО).'
    },
    // Annual leave days — Чл. 137 ЗРО (min 20)
    annualLeaveDays: {
      name: 'annualLeaveDays',
      type: 'select',
      label: 'Денови годишен одмор',
      options: [
        { value: '20', label: '20 работни денови (законски минимум)' },
        { value: '21', label: '21 работен ден' },
        { value: '22', label: '22 работни денови' },
        { value: '23', label: '23 работни денови' },
        { value: '24', label: '24 работни денови' },
        { value: '25', label: '25 работни денови' },
        { value: '26', label: '26 работни денови' }
      ],
      required: false,
      helpText: 'Законскиот минимум е 20 работни денови. Можете да доделите повеќе (за стаж, услови на работа и слично).'
    },
    // Notice period — Чл. 88 ЗРО
    noticePeriodDays: {
      name: 'noticePeriodDays',
      type: 'select',
      label: 'Отказен рок (во денови)',
      options: [
        { value: '30', label: '30 дена (законски минимум)' },
        { value: '60', label: '60 дена' },
        { value: '90', label: '90 дена' }
      ],
      required: false,
      helpText: 'Минималниот отказен рок е 30 дена. Со договорот може да се предвиди подолг рок.'
    },
    concurrentClause: {
      name: 'concurrentClause',
      type: 'checkbox',
      label: 'Конкурентска клаузула',
      required: false,
      helpText: 'Конкурентска клаузула - договорна забрана на конкурентското дејствување (Член 37-39). Ако работникот при своето работење се здобива со технички, производни или деловни знаења и деловни врски, може во договорот за вработување да се договори забрана за вршење на конкурентско дејствување по престанувањето на работниот однос. Конкурентската клаузула може да се договори најдолго за период од две години по престанувањето на договорот за вработување и тоа само во случаите кога на работникот му престанува договорот за вработување по негова волја или вина. Работодавачот е должен да му исплатува паричен надоместок на работникот (најмалку половина од просечната плата во последните три месеца пред престанувањето).'
    },
    concurrentClauseDuration: {
      name: 'concurrentClauseDuration',
      type: 'select',
      label: 'Времетраење на конкурентската клаузула',
      options: [
        { value: '3', label: '3 месеци' },
        { value: '6', label: '6 месеци' },
        { value: '9', label: '9 месеци' },
        { value: '12', label: '12 месеци (1 година)' },
        { value: '18', label: '18 месеци' },
        { value: '24', label: '24 месеци (2 години)' }
      ],
      required: false,
      condition: {
        field: 'concurrentClause',
        operator: 'truthy'
      },
      helpText: 'Конкурентската клаузула може да се договори најдолго за период од две години (24 месеци) по престанувањето на договорот за вработување.'
    },
    concurrentClauseCompensation: {
      name: 'concurrentClauseCompensation',
      type: 'text',
      label: 'Месечен паричен надоместок (во денари)',
      placeholder: 'Автоматски се пресметува',
      required: false,
      condition: {
        field: 'concurrentClause',
        operator: 'truthy'
      },
      inputMode: 'numeric',
      autoCalculateFrom: 'netSalary',
      autoCalculateMultiplier: 0.5,
      helpText: 'Автоматски се пресметува како 50% од основната плата. Можете да ја промените вредноста доколку сакате поинаков износ (најмалку половина од просечната плата).'
    },
    concurrentClauseInput: {
      name: 'concurrentClauseInput',
      type: 'textarea',
      label: 'Дополнителни услови на конкурентската клаузула (опционално)',
      placeholder: 'пр. Работникот се обврзува дека нема да работи за конкурентски компании во истата индустрија...',
      rows: 3,
      required: false,
      condition: {
        field: 'concurrentClause',
        operator: 'truthy'
      },
      helpText: 'Овде можете да додадете дополнителни специфични услови или ограничувања поврзани со конкурентската клаузула.'
    },

    // Probation — Чл. 60 ЗРО
    probationPeriod: {
      name: 'probationPeriod',
      type: 'checkbox',
      label: 'Пробна работа',
      required: false,
      helpText: 'Пробната работа е важечка само ако е писмено договорена со точно определен период. Без неа не можете законски да го прекинете односот поради неуспешна проба (Член 60 од ЗРО).'
    },
    probationDuration: {
      name: 'probationDuration',
      type: 'select',
      label: 'Времетраење на пробната работа',
      options: [
        { value: '1', label: '1 месец' },
        { value: '2', label: '2 месеци' },
        { value: '3', label: '3 месеци' },
        { value: '4', label: '4 месеци' },
        { value: '5', label: '5 месеци' },
        { value: '6', label: '6 месеци (законски максимум)' }
      ],
      required: false,
      condition: {
        field: 'probationPeriod',
        operator: 'truthy'
      },
      helpText: 'Пробната работа може да трае најмногу 6 месеци.'
    },

    // Remote work — Чл. 50 ЗРО
    remoteWork: {
      name: 'remoteWork',
      type: 'checkbox',
      label: 'Работа од дома / од далечина',
      required: false,
      helpText: 'Ако работникот (дел од времето) работи од дома, законот бара тоа да се уреди во договорот со средствата за работа, надоместокот на трошоци и начинот на надзор. Штиклирањето внесува соодветна клаузула (Член 50 од ЗРО).'
    },

    // Optional clause toggles — let the user build a tailored agreement (default ON)
    includeIPClause: {
      name: 'includeIPClause',
      type: 'checkbox',
      label: 'Вклучи клаузула за интелектуална сопственост',
      required: false,
      helpText: 'Пренос на права од интелектуална сопственост создадена во текот на работата врз работодавачот. Релевантно за креативни/технички позиции; за едноставни позиции може да се исклучи.'
    },
    includeConfidentialityClause: {
      name: 'includeConfidentialityClause',
      type: 'checkbox',
      label: 'Вклучи клаузула за доверливост',
      required: false,
      helpText: 'Обврска за чување на деловна тајна за време и по престанокот на работниот однос. Препорачливо е да остане вклучена.'
    },
    includeMedicalClause: {
      name: 'includeMedicalClause',
      type: 'checkbox',
      label: 'Вклучи клаузула за лекарски прегледи',
      required: false,
      helpText: 'Обврска за периодични лекарски прегледи. Релевантно кога проценката на ризик или природата на работата го бара тоа.'
    }
  },

  // Initial form data
  initialFormData: {
    employeeName: '',
    employeeAddress: '',
    employeePIN: '',
    jobPosition: '',
    workTasks: [''],
    education: '',
    certification: '',
    netSalary: '',
    placeOfWork: 'просториите на седиштето на работодавачот',
    otherWorkPlace: '',
    agreementDate: '',
    agreementDurationType: 'неопределено времетраење.',
    definedDuration: '',
    fixedTermReason: '',
    employmentType: 'полно',
    weeklyHours: '',
    dailyWorkTime: 'започнува од 08:00 часот, а завршува во 16:00 часот',
    otherWorkTime: '',
    annualLeaveDays: '20',
    noticePeriodDays: '30',
    concurrentClause: false,
    concurrentClauseDuration: '24',
    concurrentClauseCompensation: '',
    concurrentClauseInput: '',
    probationPeriod: false,
    probationDuration: '3',
    remoteWork: false,
    includeIPClause: true,
    includeConfidentialityClause: true,
    includeMedicalClause: true,
    acceptTerms: false
  },

  // Validation rules - All fields are optional
  validationRules: [
    // No validation rules - all fields are optional per user request
  ]
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'employeeAddress', 'employeePIN', 'jobPosition'],
    2: ['workTasks', 'education', 'certification'],
    3: ['netSalary', 'agreementDate'],
    4: ['employmentType', 'weeklyHours', 'placeOfWork', 'otherWorkPlace', 'remoteWork', 'agreementDurationType', 'definedDuration', 'fixedTermReason', 'dailyWorkTime', 'otherWorkTime', 'annualLeaveDays', 'noticePeriodDays'],
    5: ['probationPeriod', 'probationDuration', 'concurrentClause', 'concurrentClauseDuration', 'concurrentClauseCompensation', 'concurrentClauseInput', 'includeIPClause', 'includeConfidentialityClause', 'includeMedicalClause']
  };

  return fieldsByStep[stepId]?.map(fieldName => employmentAgreementConfig.fields[fieldName]) || [];
};