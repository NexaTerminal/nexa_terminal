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
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Information
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: false,
      helpText: 'Внесете го целосното име и презиме на работникот како што е наведено во личната карта или пасошот.'
    },
    employeeAddress: {
      name: 'employeeAddress',
      type: 'text',
      label: 'Адреса на седиште на работникот',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
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
      placeholder: 'пр. Скопје, ул. Македонска 123',
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
    concurrentClause: {
      name: 'concurrentClause',
      type: 'checkbox',
      label: 'Конкурентска клаузула',
      required: false
    },
    concurrentClauseInput: {
      name: 'concurrentClauseInput',
      type: 'textarea',
      label: 'Опишете ја конкурентската клаузула',
      placeholder: 'пр. Работникот се обврзува дека во периодот од 1 година...',
      rows: 3,
      required: false,
      condition: {
        field: 'concurrentClause',
        operator: 'truthy'
      }
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
    dailyWorkTime: 'започнува од 08:00 часот, а завршува во 16:00 часот',
    otherWorkTime: '',
    concurrentClause: false,
    concurrentClauseInput: '',
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
    4: ['placeOfWork', 'otherWorkPlace', 'agreementDurationType', 'definedDuration', 'dailyWorkTime', 'otherWorkTime', 'concurrentClause', 'concurrentClauseInput']
  };

  return fieldsByStep[stepId]?.map(fieldName => employmentAgreementConfig.fields[fieldName]) || [];
};