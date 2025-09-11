import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * NDA (Non-Disclosure Agreement) Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const ndaConfig = {
  documentType: 'nda',
  apiEndpoint: 'nda',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за договорот и втората страна',
      requiredFields: ['agreementDate', 'partyType']
    },
    {
      id: 2,
      title: 'Деталии за договорот',
      description: 'Дополнителни услови и времетраење',
      requiredFields: ['agreementDuration']
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
      helpText: 'Внесете го датумот кога се склучува договорот за доверливост. Овој датум ќе се појави во документот и претставува почетокот на обврските за доверливост.'
    },
    partyType: {
      name: 'partyType',
      type: 'select',
      label: 'Тип на втората договорна страна',
      options: [
        { value: '', label: 'Изберете тип на договорна страна' },
        { value: 'natural', label: 'Физичко лице' },
        { value: 'legal', label: 'Правно лице (компанија)' }
      ],
      required: true,
      helpText: 'Изберете дали втората договорна страна е физичко лице (индивидуалец) или правно лице (компанија, ДООЕЛ, АД, итн.).'
    },

    // Fields for Natural Person
    naturalPersonName: {
      name: 'naturalPersonName',
      type: 'text',
      label: 'Име и презиме',
      placeholder: 'пр. Марко Петровски',
      required: false, // Will be conditionally required
      conditional: { field: 'partyType', value: 'natural' },
      helpText: 'Внесете го целосното име и презиме на физичкото лице со кое се склучува договорот за доверливост.'
    },
    naturalPersonAddress: {
      name: 'naturalPersonAddress',
      type: 'text',
      label: 'Адреса на живеење',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false, // Will be conditionally required
      conditional: { field: 'partyType', value: 'natural' },
      helpText: 'Внесете ја адресата на живеење на физичкото лице (улица, број, град) според личната карта.'
    },
    naturalPersonPin: {
      name: 'naturalPersonPin',
      type: 'text',
      label: 'ЕМБГ',
      placeholder: 'пр. 1234567890123',
      required: false, // Will be conditionally required
      conditional: { field: 'partyType', value: 'natural' },
      maxLength: 13,
      helpText: 'Внесете го ЕМБГ бројот (13 цифри) на физичкото лице како што е наведен во личната карта. Ова е задолжително за идентификација.'
    },

    // Fields for Legal Entity
    legalEntityName: {
      name: 'legalEntityName',
      type: 'text',
      label: 'Име на компанијата',
      placeholder: 'пр. ДОО Иновација Солушенс',
      required: false, // Will be conditionally required
      conditional: { field: 'partyType', value: 'legal' },
      helpText: 'Внесете го целосното официјално име на компанијата како што е регистрирана во Централниот регистар на РСМ.'
    },
    legalEntityAddress: {
      name: 'legalEntityAddress',
      type: 'text',
      label: 'Адреса на седиште',
      placeholder: 'пр. ул. Македонија бр. 456, Скопје',
      required: false, // Will be conditionally required
      conditional: { field: 'partyType', value: 'legal' },
      helpText: 'Внесете ја адресата на седиштето на компанијата (улица, број, град) како што е регистрирана во трговскиот регистар.'
    },
    legalEntityTaxNumber: {
      name: 'legalEntityTaxNumber',
      type: 'text',
      label: 'Даночен број на компанијата',
      placeholder: 'пр. 4567890',
      required: false, // Will be conditionally required
      conditional: { field: 'partyType', value: 'legal' },
      helpText: 'Внесете го даночниот број на компанијата како што е регистриран во Управата за јавни приходи. Ова е задолжително за правни лица.'
    },
    legalEntityManager: {
      name: 'legalEntityManager',
      type: 'text',
      label: 'Управител/Директор',
      placeholder: 'пр. Ана Стојановска',
      required: false, // Will be conditionally required
      conditional: { field: 'partyType', value: 'legal' },
      helpText: 'Внесете го името на управителот или директорот кој ја застапува компанијата при склучување на договорот.'
    },

    // Common optional field
    contactEmail: {
      name: 'contactEmail',
      type: 'email',
      label: 'Е-маил за контакт (опционо)',
      placeholder: 'пр. kontakt@example.com',
      required: false,
      helpText: 'Внесете е-маил адреса за официјална комуникација и известувања меѓу договорните страни. Ова поле е опционо.'
    },

    // Step 2: Agreement Details
    agreementDuration: {
      name: 'agreementDuration',
      type: 'number',
      label: 'Времетраење на договорот (години)',
      placeholder: 'пр. 2',
      required: true,
      min: 1,
      max: 10,
      helpText: 'Внесете колку години ќе важи договорот за доверливост. Стандардното времетраење е 2 години. Обврската за доверливост продолжува најмалку 5 години по завршување на договорот.'
    },
    agreementType: {
      name: 'agreementType',
      type: 'select',
      label: 'Тип на договор',
      options: [
        { value: 'bilateral', label: 'Двострана доверливост (двете страни споделуваат информации)' },
        { value: 'unilateral', label: 'Еднострана доверливост (само една страна споделува информации)' }
      ],
      required: false,
      helpText: 'Двострана доверливост = двете страни се обврзуваат да чуваат доверливи информации. Еднострана = само едната страна прима доверливи информации.'
    },
    additionalTerms: {
      name: 'additionalTerms',
      type: 'textarea',
      label: 'Дополнителни услови (опционо)',
      placeholder: 'Внесете дополнителни услови или специфични одредби...',
      rows: 4,
      required: false,
      helpText: 'Можете да додадете дополнителни услови, ограничувања или специфични одредби кои не се опфатени во стандардниот договор за доверливост.'
    }
  },

  // Initial form data
  initialFormData: {
    agreementDate: '',
    partyType: '',
    // Natural person fields
    naturalPersonName: '',
    naturalPersonAddress: '',
    naturalPersonPin: '',
    // Legal entity fields
    legalEntityName: '',
    legalEntityAddress: '',
    legalEntityTaxNumber: '',
    legalEntityManager: '',
    // Common fields
    contactEmail: '',
    agreementDuration: '2',
    agreementType: 'bilateral',
    additionalTerms: '',
    acceptTerms: false
  },

  // Validation rules
  validationRules: [
    // Required fields
    { field: 'agreementDate', type: VALIDATION_TYPES.REQUIRED, label: 'Датум на договор' },
    { field: 'agreementDate', type: VALIDATION_TYPES.DATE, label: 'Датум на договор' },
    { field: 'partyType', type: VALIDATION_TYPES.REQUIRED, label: 'Тип на договорна страна' },
    { field: 'agreementDuration', type: VALIDATION_TYPES.REQUIRED, label: 'Времетраење на договорот' },
    { field: 'agreementDuration', type: VALIDATION_TYPES.NUMBER, label: 'Времетраење на договорот' },

    // Conditional validations for natural person
    { field: 'naturalPersonName', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Име и презиме', condition: { field: 'partyType', value: 'natural' } },
    { field: 'naturalPersonAddress', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Адреса на живеење', condition: { field: 'partyType', value: 'natural' } },
    { field: 'naturalPersonPin', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'ЕМБГ', condition: { field: 'partyType', value: 'natural' } },
    { field: 'naturalPersonPin', type: VALIDATION_TYPES.PIN, label: 'ЕМБГ' },

    // Conditional validations for legal entity
    { field: 'legalEntityName', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Име на компанијата', condition: { field: 'partyType', value: 'legal' } },
    { field: 'legalEntityAddress', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Адреса на седиште', condition: { field: 'partyType', value: 'legal' } },
    { field: 'legalEntityTaxNumber', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Даночен број', condition: { field: 'partyType', value: 'legal' } },
    { field: 'legalEntityManager', type: VALIDATION_TYPES.CONDITIONAL_REQUIRED, label: 'Управител/Директор', condition: { field: 'partyType', value: 'legal' } },
    { field: 'legalEntityTaxNumber', type: VALIDATION_TYPES.NUMBER, label: 'Даночен број' },

    // Optional validations
    { field: 'contactEmail', type: VALIDATION_TYPES.EMAIL, label: 'Е-маил за контакт' }
  ]
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId, formData = {}) => {
  const fieldsByStep = {
    1: [
      'agreementDate', 
      'partyType',
      // Conditional fields based on party type
      ...(formData.partyType === 'natural' ? ['naturalPersonName', 'naturalPersonAddress', 'naturalPersonPin'] : []),
      ...(formData.partyType === 'legal' ? ['legalEntityName', 'legalEntityAddress', 'legalEntityTaxNumber', 'legalEntityManager'] : []),
      'contactEmail'
    ],
    2: ['agreementDuration', 'agreementType', 'additionalTerms']
  };

  return fieldsByStep[stepId]?.map(fieldName => ndaConfig.fields[fieldName]).filter(Boolean) || [];
};