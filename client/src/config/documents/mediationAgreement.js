import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Mediation Agreement Document Configuration
 * Complex conditional logic based on user role (mediator/client) and client type (natural/legal)
 */
export const mediationAgreementConfig = {
  documentType: 'mediationAgreement',
  apiEndpoint: 'mediation-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Ваша улога и основни информации',
      requiredFields: ['agreementDate', 'userRole']
    },
    {
      id: 2,
      title: 'Информации за другата страна',
      description: 'Податоци за другата договорна страна',
      requiredFields: [] // Will be determined dynamically
    },
    {
      id: 3,
      title: 'Услови на договорот',
      description: 'Детали за услугите и условите',
      requiredFields: ['serviceDescription', 'commissionStructure', 'duration']
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Information
    agreementDate: {
      name: 'agreementDate',
      type: 'date',
      label: 'Датум на склучување на договор',
      required: true,
      helpText: 'Внесете го датумот кога се склучува договорот за посредување. Овој датум ќе се појави во документот и претставува почетокот на обврските за посредување.'
    },
    userRole: {
      name: 'userRole',
      type: 'select',
      label: 'Ваша улога во договорот',
      options: [
        { value: '', label: 'Изберете ја вашата улога' },
        { value: 'mediator', label: 'Посредник (јас давам услуги на посредување)' },
        { value: 'client', label: 'Клиент (јас барам услуги на посредување)' }
      ],
      required: true,
      helpText: 'Изберете дали вашата компанија ќе биде посредник што дава услуги или клиент што бара услуги на посредување. Ова влијае на тоа кои полиња ќе треба да ги внесете.'
    },

    // Client Type Selection (only for user role = client)
    clientType: {
      name: 'clientType',
      type: 'select',
      label: 'Тип на вашата компанија како клиент',
      options: [
        { value: '', label: 'Изберете тип на компанија' },
        { value: 'natural', label: 'Физичко лице' },
        { value: 'legal', label: 'Правно лице (компанија)' }
      ],
      required: false, // Will be conditionally required
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Ако сте клиент, изберете дали барате услугите како физичко лице (индивидуалец) или како правно лице (компанија, ДООЕЛ, АД, итн.).'
    },

    // Step 2: Other Party Information
    // === FIELDS FOR WHEN USER IS MEDIATOR ===
    // Client Natural Person Fields
    naturalClientName: {
      name: 'naturalClientName',
      type: 'text',
      label: 'Име и презиме на клиентот',
      placeholder: 'пр. Марко Петровски',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'natural' },
      helpText: 'Внесете го целосното име и презиме на физичкото лице кое бара услуги на посредување од вашата компанија.'
    },
    naturalClientAddress: {
      name: 'naturalClientAddress',
      type: 'text',
      label: 'Адреса на живеење на клиентот',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'natural' },
      helpText: 'Внесете ја адресата на живеење на клиентот (улица, број, град) според личната карта.'
    },
    naturalClientPin: {
      name: 'naturalClientPin',
      type: 'text',
      label: 'ЕМБГ на клиентот',
      placeholder: 'пр. 1234567890123',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'natural' },
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      helpText: 'Внесете го ЕМБГ бројот (точно 13 цифри) на клиентот како што е наведен во личната карта. Ова е задолжително за правна валидност на договорот.'
    },

    // Client Legal Entity Fields
    legalClientName: {
      name: 'legalClientName',
      type: 'text',
      label: 'Име на компанијата клиент',
      placeholder: 'пр. ДОО Иновација Солушенс',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете го целосното официјално име на компанијата клиент како што е регистрирана во Централниот регистар на РСМ.'
    },
    legalClientAddress: {
      name: 'legalClientAddress',
      type: 'text',
      label: 'Адреса на седиште на компанијата клиент',
      placeholder: 'пр. ул. Македонија бр. 456, Скопје',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете ја адресата на седиштето на компанијата клиент како што е регистрирана во трговскиот регистар.'
    },
    legalClientTaxNumber: {
      name: 'legalClientTaxNumber',
      type: 'text',
      label: 'Даночен број на компанијата клиент',
      placeholder: 'пр. 4567890',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете го даночниот број (ЕДБ) на компанијата клиент како што е регистриран во Управата за јавни приходи.'
    },
    legalClientManager: {
      name: 'legalClientManager',
      type: 'text',
      label: 'Управител/Директор на компанијата клиент',
      placeholder: 'пр. Ана Стојановска',
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      subConditional: { field: 'clientTypeForMediator', value: 'legal' },
      helpText: 'Внесете го името на управителот или директорот кој ја застапува компанијата клиент при склучување на договорот.'
    },

    // Client Type Selection for Mediator
    clientTypeForMediator: {
      name: 'clientTypeForMediator',
      type: 'select',
      label: 'Тип на клиентот',
      options: [
        { value: '', label: 'Изберете тип на клиент' },
        { value: 'natural', label: 'Физичко лице' },
        { value: 'legal', label: 'Правно лице (компанија)' }
      ],
      required: false,
      conditional: { field: 'userRole', value: 'mediator' },
      helpText: 'Изберете дали клиентот што бара ваши услуги е физичко лице или правно лице (компанија).'
    },

    // === FIELDS FOR WHEN USER IS CLIENT ===
    // Mediator Company Information
    mediatorCompanyName: {
      name: 'mediatorCompanyName',
      type: 'text',
      label: 'Име на компанијата посредник',
      placeholder: 'пр. ДОО Посредување Експерт',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете го целосното официјално име на компанијата што ви дава услуги на посредување како што е регистрирана во Централниот регистар на РСМ.'
    },
    mediatorCompanyAddress: {
      name: 'mediatorCompanyAddress',
      type: 'text',
      label: 'Адреса на седиште на посредникот',
      placeholder: 'пр. ул. Центар бр. 789, Скопје',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете ја адресата на седиштето на компанијата посредник како што е регистрирана во трговскиот регистар.'
    },
    mediatorCompanyTaxNumber: {
      name: 'mediatorCompanyTaxNumber',
      type: 'text',
      label: 'Даночен број на посредникот',
      placeholder: 'пр. 7891234',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете го даночниот број (ЕДБ) на компанијата посредник како што е регистриран во Управата за јавни приходи.'
    },
    mediatorCompanyManager: {
      name: 'mediatorCompanyManager',
      type: 'text',
      label: 'Управител/Директор на посредникот',
      placeholder: 'пр. Петар Николовски',
      required: false,
      conditional: { field: 'userRole', value: 'client' },
      helpText: 'Внесете го името на управителот или директорот кој ја застапува компанијата посредник при склучување на договорот.'
    },

    // Step 3: Contract Terms
    serviceDescription: {
      name: 'serviceDescription',
      type: 'textarea',
      label: 'Опис на услугите за посредување',
      placeholder: 'Детален опис на тоа што опфаќаат услугите на посредување...',
      rows: 4,
      required: true,
      helpText: 'Опишете детално кои услуги на посредување ќе се извршуваат. Ова е клучен дел од договорот што дефинира обемот на работа и одговорностите на посредникот.'
    },
    commissionStructure: {
      name: 'commissionStructure',
      type: 'textarea',
      label: 'Структура на провизија/надоместок',
      placeholder: 'пр. 5% од вкупната вредност на трансакцијата, плативо по успешно завршување...',
      rows: 3,
      required: true,
      helpText: 'Наведете како се пресметува и плаќа провизијата или надоместокот за услугите. Вклучете проценти, фиксни износи, услови за плаќање и рокови согласно македонското законодавство.'
    },
    duration: {
      name: 'duration',
      type: 'number',
      label: 'Времетраење',
      placeholder: 'пр. 12',
      required: true,
      min: 1,
      max: 60,
      helpText: 'Внесете бројка за времетраењето на договорот (пр. 12 за 12 месеци). Максимално времетраење е 60 месеци согласно деловната практика.'
    },
    durationUnit: {
      name: 'durationUnit',
      type: 'select',
      label: 'Единица за времетраење',
      options: [
        { value: 'месеци', label: 'Месеци' },
        { value: 'години', label: 'Години' }
      ],
      required: true,
      helpText: 'Изберете дали времетраењето е во месеци или години. За договори подолги од 12 месеци препорачуваме избор на години.'
    },
    territory: {
      name: 'territory',
      type: 'text',
      label: 'Територија на посредување',
      placeholder: 'пр. Република Северна Македонија, град Скопје',
      required: false,
      helpText: 'Наведете на која територија ќе се извршува посредувањето (град, регион, земја). Ако не се внесе, ќе се смета дека важи за цела територија на РСМ.'
    },
    terminationConditions: {
      name: 'terminationConditions',
      type: 'textarea',
      label: 'Услови за раскинување',
      placeholder: 'Договорот може да се раскине со писмено известување од 30 дена...',
      rows: 3,
      required: false,
      helpText: 'Наведете под кои услови и на кој начин може да се раскине договорот пред истекот на договореното време. Ако не се внесе, ќе се применат стандардните законски одредби.'
    },
    disputeResolution: {
      name: 'disputeResolution',
      type: 'textarea',
      label: 'Решавање на спорови',
      placeholder: 'Сите спорови ќе се решаваат согласно законодавството на Република Северна Македонија...',
      rows: 2,
      required: false,
      helpText: 'Наведете како ќе се решаваат евентуалните спорови (медијација, арбитража, судови). Ако не се внесе, ќе се применат стандардните законски процедури на РСМ.'
    },
    additionalTerms: {
      name: 'additionalTerms',
      type: 'textarea',
      label: 'Дополнителни услови (опционо)',
      placeholder: 'Внесете дополнителни услови или специфични одредби...',
      rows: 4,
      required: false,
      helpText: 'Можете да додадете дополнителни услови, ограничувања или специфични одредби кои не се опфатени во стандардниот договор за посредување.'
    }
  },

  // Initial form data
  initialFormData: {
    agreementDate: '',
    userRole: '',
    clientType: '',

    // Mediator fields (when user is client)
    mediatorCompanyName: '',
    mediatorCompanyAddress: '',
    mediatorCompanyTaxNumber: '',
    mediatorCompanyManager: '',

    // Client fields (when user is mediator)
    clientTypeForMediator: '',
    naturalClientName: '',
    naturalClientAddress: '',
    naturalClientPin: '',
    legalClientName: '',
    legalClientAddress: '',
    legalClientTaxNumber: '',
    legalClientManager: '',

    // Contract terms
    serviceDescription: '',
    commissionStructure: '',
    duration: '12',
    durationUnit: 'месеци',
    territory: 'Република Северна Македонија',
    terminationConditions: '',
    disputeResolution: '',
    additionalTerms: ''
  },

  // Validation rules
  validationRules: [
    // Basic required fields
    { field: 'agreementDate', type: VALIDATION_TYPES.REQUIRED, label: 'Датум на договор' },
    { field: 'agreementDate', type: VALIDATION_TYPES.DATE, label: 'Датум на договор' },
    { field: 'userRole', type: VALIDATION_TYPES.REQUIRED, label: 'Ваша улога' },

    // Client type required when user is client
    { field: 'clientType', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Тип на компанија', condition: { field: 'userRole', value: 'client' } },

    // Mediator company fields (when user is client)
    { field: 'mediatorCompanyName', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Име на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyAddress', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Адреса на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyTaxNumber', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Даночен број на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyManager', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Управител на посредник', condition: { field: 'userRole', value: 'client' } },
    { field: 'mediatorCompanyTaxNumber', type: VALIDATION_TYPES.NUMBER, label: 'Даночен број на посредник' },

    // Client type selection for mediator
    { field: 'clientTypeForMediator', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Тип на клиент', condition: { field: 'userRole', value: 'mediator' } },

    // Natural client validations (when user is mediator)
    { field: 'naturalClientName', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Име на клиент', condition: { field: 'clientTypeForMediator', value: 'natural' } },
    { field: 'naturalClientAddress', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Адреса на клиент', condition: { field: 'clientTypeForMediator', value: 'natural' } },
    { field: 'naturalClientPin', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'ЕМБГ на клиент', condition: { field: 'clientTypeForMediator', value: 'natural' } },
    { field: 'naturalClientPin', type: VALIDATION_TYPES.PIN, label: 'ЕМБГ на клиент' },

    // Legal client validations (when user is mediator)
    { field: 'legalClientName', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Име на клиент компанија', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientAddress', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Адреса на клиент компанија', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientTaxNumber', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Даночен број на клиент', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientManager', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Управител на клиент', condition: { field: 'clientTypeForMediator', value: 'legal' } },
    { field: 'legalClientTaxNumber', type: VALIDATION_TYPES.NUMBER, label: 'Даночен број на клиент' },

    // Contract terms validations
    { field: 'serviceDescription', type: VALIDATION_TYPES.REQUIRED, label: 'Опис на услугите' },
    { field: 'commissionStructure', type: VALIDATION_TYPES.REQUIRED, label: 'Структура на провизија' },
    { field: 'duration', type: VALIDATION_TYPES.REQUIRED, label: 'Времетраење' },
    { field: 'duration', type: VALIDATION_TYPES.NUMBER, label: 'Времетраење' },
    { field: 'durationUnit', type: VALIDATION_TYPES.REQUIRED, label: 'Единица за времетраење' }
  ]
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId, formData = {}) => {
  const fieldsByStep = {
    1: ['agreementDate', 'userRole'],
    2: [],
    3: ['serviceDescription', 'commissionStructure', 'duration', 'durationUnit', 'territory', 'terminationConditions', 'disputeResolution', 'additionalTerms']
  };

  // Dynamic step 2 fields based on user role
  if (stepId === 2) {
    if (formData.userRole === 'client') {
      // Add client type selection first
      fieldsByStep[2].push('clientType');
      // Add mediator company fields
      fieldsByStep[2].push('mediatorCompanyName', 'mediatorCompanyAddress', 'mediatorCompanyTaxNumber', 'mediatorCompanyManager');
    } else if (formData.userRole === 'mediator') {
      // Add client type selection
      fieldsByStep[2].push('clientTypeForMediator');
      // Add client fields based on client type
      if (formData.clientTypeForMediator === 'natural') {
        fieldsByStep[2].push('naturalClientName', 'naturalClientAddress', 'naturalClientPin');
      } else if (formData.clientTypeForMediator === 'legal') {
        fieldsByStep[2].push('legalClientName', 'legalClientAddress', 'legalClientTaxNumber', 'legalClientManager');
      }
    }
  }

  // Add client type selection to step 1 when user is client
  if (stepId === 1 && formData.userRole === 'client') {
    fieldsByStep[1] = [...fieldsByStep[1], 'clientType'];
  }

  return fieldsByStep[stepId]?.map(fieldName => mediationAgreementConfig.fields[fieldName]).filter(Boolean) || [];
};