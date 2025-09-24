import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Debt Assumption Agreement Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const debtAssumptionAgreementConfig = {
  documentType: 'debtAssumptionAgreement',
  apiEndpoint: 'debt-assumption-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за договорот и улогите',
      requiredFields: ['contractDate', 'contractTown', 'userRole']
    },
    {
      id: 2,
      title: 'Странки во договорот',
      description: 'Доверител, должник и преземач на долгот',
      requiredFields: ['otherPartyType']
    },
    {
      id: 3,
      title: 'Детали за долгот',
      description: 'Информации за должничката обврска',
      requiredFields: ['debtAmount', 'debtCurrency', 'debtDescription']
    },
    {
      id: 4,
      title: 'Услови на преземање',
      description: 'Тип на преземање и дополнителни услови',
      requiredFields: ['assumptionType', 'releaseOriginalDebtor']
    }
  ],

  // Form fields configuration with MANDATORY helpText for all fields
  fields: {
    // Step 1: Basic Information
    contractDate: {
      name: 'contractDate',
      type: 'date',
      label: 'Датум на склучување на договор',
      required: true,
      helpText: 'Внесете го датумот кога се склучува договорот за преземање на долг. Овој датум е важен за правната валидност на договорот и мора да биде точен.'
    },
    contractTown: {
      name: 'contractTown',
      type: 'select',
      label: 'Место на склучување на договор',
      options: [
        { value: 'Скопје', label: 'Скопје' },
        { value: 'Битола', label: 'Битола' },
        { value: 'Прилеп', label: 'Прилеп' },
        { value: 'Куманово', label: 'Куманово' },
        { value: 'Велес', label: 'Велес' },
        { value: 'Штип', label: 'Штип' },
        { value: 'Охрид', label: 'Охрид' },
        { value: 'Гостивар', label: 'Гостивар' },
        { value: 'Струмица', label: 'Струмица' },
        { value: 'Тетово', label: 'Тетово' }
      ],
      required: true,
      helpText: 'Изберете го градот каде што се склучува договорот. Ова е важно за определување на надлежноста на судот во случај на спор според Законот за облигационите односи.'
    },
    userRole: {
      name: 'userRole',
      type: 'select',
      label: 'Вашата компанија во овој договор е',
      options: [
        { value: 'creditor', label: 'Доверител (првичен доверител на долгот)' },
        { value: 'debtor', label: 'Должник (првичен должник што го пренесува долгот)' },
        { value: 'third_party', label: 'Преземач на долг (трето лице што го презема долгот)' }
      ],
      required: true,
      helpText: 'Определете ја улогата на вашата компанија во договорот за преземање на долг. Оваа информација е клучна за определување на правните обврски според Законот за облигационите односи.'
    },

    // Step 2: Other Parties
    otherPartyType: {
      name: 'otherPartyType',
      type: 'select',
      label: 'Преземачот на долг е',
      options: [
        { value: 'individual', label: 'Физичко лице' },
        { value: 'company', label: 'Правно лице (компанија)' }
      ],
      required: true,
      helpText: 'Определете дали субјектот што го презема долгот е физичко лице (поединец) или правно лице (компанија). Ова влијае на потребната документација и правните процедури.'
    },

    // Original Creditor fields (when user is not creditor)
    originalCreditorType: {
      name: 'originalCreditorType',
      type: 'select',
      label: 'Доверителот е',
      options: [
        { value: 'individual', label: 'Физичко лице' },
        { value: 'company', label: 'Правно лице (компанија)' }
      ],
      required: false,
      condition: {
        field: 'userRole',
        operator: '!==',
        value: 'creditor'
      },
      helpText: 'Определете дали доверителот (оној на кого му се должи) е физичко или правно лице. Ова е важно за правилно составување на договорот.'
    },
    originalCreditorName: {
      name: 'originalCreditorName',
      type: 'text',
      label: 'Име на доверителот',
      placeholder: 'пр. Марко Петровски',
      required: false,
      condition: {
        field: 'originalCreditorType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете го целосното име и презиме на доверителот според личната карта. Точноста на податоците е важна за правната валидност на договорот.'
    },
    originalCreditorAddress: {
      name: 'originalCreditorAddress',
      type: 'text',
      label: 'Адреса на доверителот',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      condition: {
        field: 'originalCreditorType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете ја адресата на живеење на доверителот според личната карта или извод од матична книга на граѓани.'
    },
    originalCreditorPIN: {
      name: 'originalCreditorPIN',
      type: 'text',
      label: 'ЕМБГ на доверителот',
      placeholder: 'пр. 1234567890123',
      required: false,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      condition: {
        field: 'originalCreditorType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете го ЕМБГ (Единствен матичен број на граѓанин) од точно 13 цифри според личната карта на доверителот. Ова е задолжително за идентификација.'
    },
    originalCreditorCompanyName: {
      name: 'originalCreditorCompanyName',
      type: 'text',
      label: 'Име на довериталската компанија',
      placeholder: 'пр. ДОО Пример',
      required: false,
      condition: {
        field: 'originalCreditorType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го целосното име на компанијата-доверител како што е регистрирано во Централниот регистар на Република Северна Македонија.'
    },
    originalCreditorCompanyAddress: {
      name: 'originalCreditorCompanyAddress',
      type: 'text',
      label: 'Адреса на довериталската компанија',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      condition: {
        field: 'originalCreditorType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете ја адресата на седиштето на компанијата-доверител како што е регистрирана во Централниот регистар.'
    },
    originalCreditorCompanyManager: {
      name: 'originalCreditorCompanyManager',
      type: 'text',
      label: 'Управител на довериталската компанија',
      placeholder: 'пр. Петар Николовски',
      required: false,
      condition: {
        field: 'originalCreditorType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го името на управителот или овластеното лице за застапување на компанијата според податоците од Централниот регистар.'
    },
    originalCreditorCompanyTaxNumber: {
      name: 'originalCreditorCompanyTaxNumber',
      type: 'text',
      label: 'Даночен број на довериталската компанија',
      placeholder: 'пр. 4030123456789',
      required: false,
      condition: {
        field: 'originalCreditorType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го даночниот број на компанијата-доверител како што е регистриран во Управата за јавни приходи (обично почнува со 4030).'
    },

    // Original Debtor fields (when user is not debtor)
    originalDebtorType: {
      name: 'originalDebtorType',
      type: 'select',
      label: 'Првичниот должник е',
      options: [
        { value: 'individual', label: 'Физичко лице' },
        { value: 'company', label: 'Правно лице (компанија)' }
      ],
      required: false,
      condition: {
        field: 'userRole',
        operator: '!==',
        value: 'debtor'
      },
      helpText: 'Определете дали првичниот должник (оној што првично ја има должничката обврска) е физичко или правно лице.'
    },
    originalDebtorName: {
      name: 'originalDebtorName',
      type: 'text',
      label: 'Име на првичниот должник',
      placeholder: 'пр. Марко Петровски',
      required: false,
      condition: {
        field: 'originalDebtorType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете го целосното име и презиме на првичниот должник според личната карта. Ова мора да одговара на податоците од првичниот договор.'
    },
    originalDebtorAddress: {
      name: 'originalDebtorAddress',
      type: 'text',
      label: 'Адреса на првичниот должник',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      condition: {
        field: 'originalDebtorType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете ја адресата на живеење на првичниот должник според личната карта или извод од матична книга на граѓани.'
    },
    originalDebtorPIN: {
      name: 'originalDebtorPIN',
      type: 'text',
      label: 'ЕМБГ на првичниот должник',
      placeholder: 'пр. 1234567890123',
      required: false,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      condition: {
        field: 'originalDebtorType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете го ЕМБГ од точно 13 цифри на првичниот должник според личната карта. Ова мора да одговара на податоците од првичниот договор.'
    },
    originalDebtorCompanyName: {
      name: 'originalDebtorCompanyName',
      type: 'text',
      label: 'Име на првичната должничка компанија',
      placeholder: 'пр. ДОО Пример',
      required: false,
      condition: {
        field: 'originalDebtorType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го целосното име на компанијата-првичен должник како што е регистрирано во Централниот регистар.'
    },
    originalDebtorCompanyAddress: {
      name: 'originalDebtorCompanyAddress',
      type: 'text',
      label: 'Адреса на првичната должничка компанија',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      condition: {
        field: 'originalDebtorType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете ја адресата на седиштето на компанијата-првичен должник како што е регистрирана во Централниот регистар.'
    },
    originalDebtorCompanyManager: {
      name: 'originalDebtorCompanyManager',
      type: 'text',
      label: 'Управител на првичната должничка компанија',
      placeholder: 'пр. Петар Николовски',
      required: false,
      condition: {
        field: 'originalDebtorType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го името на управителот или овластеното лице за застапување на компанијата-првичен должник според Централниот регистар.'
    },
    originalDebtorCompanyTaxNumber: {
      name: 'originalDebtorCompanyTaxNumber',
      type: 'text',
      label: 'Даночен број на првичната должничка компанија',
      placeholder: 'пр. 4030123456789',
      required: false,
      condition: {
        field: 'originalDebtorType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го даночниот број на компанијата-првичен должник според регистрацијата во Управата за јавни приходи.'
    },

    // Assuming Party fields (when user is not the assuming party)
    assumingPartyName: {
      name: 'assumingPartyName',
      type: 'text',
      label: 'Име на преземачот на долг',
      placeholder: 'пр. Марко Петровски',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете го целосното име и презиме на физичкото лице што го презема долгот според личната карта. Ова лице станува нов должник.'
    },
    assumingPartyAddress: {
      name: 'assumingPartyAddress',
      type: 'text',
      label: 'Адреса на преземачот на долг',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете ја адресата на живеење на преземачот на долг според личната карта. Оваа адреса ќе се користи за официјална кореспонденција.'
    },
    assumingPartyPIN: {
      name: 'assumingPartyPIN',
      type: 'text',
      label: 'ЕМБГ на преземачот на долг',
      placeholder: 'пр. 1234567890123',
      required: false,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'individual'
      },
      helpText: 'Внесете го ЕМБГ од точно 13 цифри на преземачот на долг според личната карта. Ова е задолжително за правна идентификација.'
    },
    assumingPartyCompanyName: {
      name: 'assumingPartyCompanyName',
      type: 'text',
      label: 'Име на компанијата преземач на долг',
      placeholder: 'пр. ДОО Пример',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го целосното име на компанијата што го презема долгот како што е регистрирано во Централниот регистар на Република Северна Македонија.'
    },
    assumingPartyCompanyAddress: {
      name: 'assumingPartyCompanyAddress',
      type: 'text',
      label: 'Адреса на компанијата преземач на долг',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете ја адресата на седиштето на компанијата-преземач како што е регистрирана во Централниот регистар.'
    },
    assumingPartyCompanyManager: {
      name: 'assumingPartyCompanyManager',
      type: 'text',
      label: 'Управител на компанијата преземач на долг',
      placeholder: 'пр. Петар Николовски',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го името на управителот или овластеното лице за застапување на компанијата-преземач според Централниот регистар.'
    },
    assumingPartyCompanyTaxNumber: {
      name: 'assumingPartyCompanyTaxNumber',
      type: 'text',
      label: 'Даночен број на компанијата преземач на долг',
      placeholder: 'пр. 4030123456789',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'company'
      },
      helpText: 'Внесете го даночниот број на компанијата-преземач според регистрацијата во Управата за јавни приходи (обично почнува со 4030).'
    },

    // Step 3: Debt Details
    debtAmount: {
      name: 'debtAmount',
      type: 'number',
      label: 'Износ на долгот',
      placeholder: 'пр. 50000',
      required: true,
      helpText: 'Внесете го точниот износ на должничката обврска што се презема. Овој износ мора да одговара на податоците од првичниот договор или фактура.'
    },
    debtCurrency: {
      name: 'debtCurrency',
      type: 'select',
      label: 'Валута на долгот',
      options: [
        { value: 'МКД', label: 'Денари (МКД)' },
        { value: 'EUR', label: 'Евра (EUR)' },
        { value: 'USD', label: 'Долари (USD)' }
      ],
      required: true,
      helpText: 'Изберете ја валутата во која е изразен долгот според првичниот договор. Ова мора да одговара на оригиналната должничка обврска.'
    },
    debtDescription: {
      name: 'debtDescription',
      type: 'textarea',
      label: 'Опис на должничката обврска',
      placeholder: 'пр. Долг за испорачана стока по фактура бр. 123 од 01.01.2024',
      required: true,
      rows: 3,
      helpText: 'Опишете ја должничката обврска што се презема (причина за настанувањето, број на фактура или договор, датум). Ова е важно за правна идентификација на долгот.'
    },
    originalContractDate: {
      name: 'originalContractDate',
      type: 'date',
      label: 'Датум на првичниот договор',
      required: false,
      helpText: 'Внесете го датумот кога е склучен првичниот договор од кој произлегува должничката обврска. Ова е важно за правната основа на долгот.'
    },
    originalContractNumber: {
      name: 'originalContractNumber',
      type: 'text',
      label: 'Број на првичниот договор',
      placeholder: 'пр. 001/2024',
      required: false,
      helpText: 'Внесете го бројот на првичниот договор или фактура од која произлегува должничката обврска, ако постои таков документ.'
    },
    dueDate: {
      name: 'dueDate',
      type: 'date',
      label: 'Датум на доспевање на долгот',
      required: false,
      helpText: 'Внесете го датумот кога долгот доспева за плаќање според првичниот договор. Ако долгот веќе е доспеан, внесете го датумот кога требало да биде платен.'
    },

    // Step 4: Assumption Terms
    assumptionType: {
      name: 'assumptionType',
      type: 'select',
      label: 'Тип на преземање на долгот',
      options: [
        { value: 'full', label: 'Целосно преземање (целиот долг)' },
        { value: 'partial', label: 'Делумно преземање (дел од долгот)' }
      ],
      required: true,
      helpText: 'Изберете дали се презема целиот долг или само дел од него. Во случај на делумно преземање, првичниот должник останува одговорен за остатокот.'
    },
    releaseOriginalDebtor: {
      name: 'releaseOriginalDebtor',
      type: 'select',
      label: 'Ослободување на првичниот должник',
      options: [
        { value: true, label: 'Да - првичниот должник се ослободува целосно' },
        { value: false, label: 'Не - првичниот должник останува солидарно одговорен' }
      ],
      required: true,
      helpText: 'Определете дали првичниот должник се ослободува од обврската или останува солидарно одговорен со преземачот. Според Законот за облигационите односи, ова е важна правна разлика.'
    },
    additionalConditions: {
      name: 'additionalConditions',
      type: 'textarea',
      label: 'Дополнителни услови (незадолжително)',
      placeholder: 'пр. Рокови за плаќање, камати, гаранции...',
      required: false,
      rows: 4,
      helpText: 'Внесете дополнителни услови или договорености помеѓу страните (рокови, камати, гаранции, итн.). Овие услови ќе станат дел од договорот и ќе бидат правно обврзувачки.'
    }
  },

  // Initial form data
  initialFormData: {
    contractDate: '',
    contractTown: 'Скопје',
    userRole: 'creditor',
    otherPartyType: 'individual',
    originalCreditorType: 'individual',
    originalCreditorName: '',
    originalCreditorAddress: '',
    originalCreditorPIN: '',
    originalCreditorCompanyName: '',
    originalCreditorCompanyAddress: '',
    originalCreditorCompanyManager: '',
    originalCreditorCompanyTaxNumber: '',
    originalDebtorType: 'individual',
    originalDebtorName: '',
    originalDebtorAddress: '',
    originalDebtorPIN: '',
    originalDebtorCompanyName: '',
    originalDebtorCompanyAddress: '',
    originalDebtorCompanyManager: '',
    originalDebtorCompanyTaxNumber: '',
    assumingPartyName: '',
    assumingPartyAddress: '',
    assumingPartyPIN: '',
    assumingPartyCompanyName: '',
    assumingPartyCompanyAddress: '',
    assumingPartyCompanyManager: '',
    assumingPartyCompanyTaxNumber: '',
    debtAmount: '',
    debtCurrency: 'МКД',
    debtDescription: '',
    originalContractDate: '',
    originalContractNumber: '',
    dueDate: '',
    assumptionType: 'full',
    releaseOriginalDebtor: true,
    additionalConditions: '',
    acceptTerms: false
  },

  // Validation rules
  validationRules: [
    // Required fields
    { field: 'contractDate', type: VALIDATION_TYPES.REQUIRED, label: 'Датум на договор' },
    { field: 'contractTown', type: VALIDATION_TYPES.REQUIRED, label: 'Место на склучување' },
    { field: 'userRole', type: VALIDATION_TYPES.REQUIRED, label: 'Ваша улога' },
    { field: 'otherPartyType', type: VALIDATION_TYPES.REQUIRED, label: 'Тип на преземач' },
    { field: 'debtAmount', type: VALIDATION_TYPES.REQUIRED, label: 'Износ на долг' },
    { field: 'debtCurrency', type: VALIDATION_TYPES.REQUIRED, label: 'Валута на долг' },
    { field: 'debtDescription', type: VALIDATION_TYPES.REQUIRED, label: 'Опис на долг' },
    { field: 'assumptionType', type: VALIDATION_TYPES.REQUIRED, label: 'Тип на преземање' },
    { field: 'releaseOriginalDebtor', type: VALIDATION_TYPES.REQUIRED, label: 'Ослободување на должник' },

    // PIN validations
    { field: 'originalCreditorPIN', type: VALIDATION_TYPES.PIN, label: 'ЕМБГ на доверител' },
    { field: 'originalDebtorPIN', type: VALIDATION_TYPES.PIN, label: 'ЕМБГ на првичен должник' },
    { field: 'assumingPartyPIN', type: VALIDATION_TYPES.PIN, label: 'ЕМБГ на преземач' },

    // Conditional validations based on user role and party types
    {
      field: 'originalCreditorType',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Тип на доверител',
      condition: { field: 'userRole', operator: '!==', value: 'creditor' }
    },
    {
      field: 'originalDebtorType',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Тип на првичен должник',
      condition: { field: 'userRole', operator: '!==', value: 'debtor' }
    }
  ]
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['contractDate', 'contractTown', 'userRole'],
    2: ['otherPartyType', 'originalCreditorType', 'originalCreditorName', 'originalCreditorAddress', 'originalCreditorPIN', 'originalCreditorCompanyName', 'originalCreditorCompanyAddress', 'originalCreditorCompanyManager', 'originalCreditorCompanyTaxNumber', 'originalDebtorType', 'originalDebtorName', 'originalDebtorAddress', 'originalDebtorPIN', 'originalDebtorCompanyName', 'originalDebtorCompanyAddress', 'originalDebtorCompanyManager', 'originalDebtorCompanyTaxNumber', 'assumingPartyName', 'assumingPartyAddress', 'assumingPartyPIN', 'assumingPartyCompanyName', 'assumingPartyCompanyAddress', 'assumingPartyCompanyManager', 'assumingPartyCompanyTaxNumber'],
    3: ['debtAmount', 'debtCurrency', 'debtDescription', 'originalContractDate', 'originalContractNumber', 'dueDate'],
    4: ['assumptionType', 'releaseOriginalDebtor', 'additionalConditions']
  };

  return fieldsByStep[stepId]?.map(fieldName => debtAssumptionAgreementConfig.fields[fieldName]) || [];
};