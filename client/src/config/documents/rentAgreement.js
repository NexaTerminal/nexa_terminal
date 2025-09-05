import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Rent Agreement Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const rentAgreementConfig = {
  documentType: 'rentAgreement',
  apiEndpoint: 'rent-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за договорот',
      requiredFields: ['contractDate', 'contractTown']
    },
    {
      id: 2,
      title: 'Закуподавач и Закупец',
      description: 'Определете ја вашата улога и другата страна',
      requiredFields: ['userRole', 'otherPartyType']
    },
    {
      id: 3,
      title: 'Недвижност',
      description: 'Детали за недвижноста',
      requiredFields: ['propertyAddress', 'cadastralParcelNumber', 'cadastralMunicipality', 'propertySheetNumber', 'propertySize', 'propertyType']
    },
    {
      id: 4,
      title: 'Закупнина и услови',
      description: 'Финансиски услови и времетраење',
      requiredFields: ['rentAmount', 'rentPaymentDeadline', 'durationType']
    },
    {
      id: 5,
      title: 'Дополнителни услови',
      description: 'Банковни податоци и посебни обврски',
      requiredFields: ['bankAccount', 'bankName']
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Information
    contractDate: {
      name: 'contractDate',
      type: 'date',
      label: 'Датум на склучување на договор',
      required: true
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
      required: true
    },

    // Step 2: Parties - New Logic
    userRole: {
      name: 'userRole',
      type: 'select',
      label: 'Вашата компанија во овој договор е',
      options: [
        { value: 'landlord', label: 'Закуподавач (издавате под закуп)' },
        { value: 'tenant', label: 'Закупец (земате под закуп)' }
      ],
      required: true
    },
    otherPartyType: {
      name: 'otherPartyType',
      type: 'select',
      label: 'Другата договорна страна е',
      options: [
        { value: 'individual', label: 'Физичко лице' },
        { value: 'company', label: 'Правно лице (компанија)' }
      ],
      required: true
    },
    otherPartyName: {
      name: 'otherPartyName',
      type: 'text',
      label: 'Име на физичкото лице',
      placeholder: 'пр. Марко Петровски',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'individual'
      }
    },
    otherPartyAddress: {
      name: 'otherPartyAddress',
      type: 'text',
      label: 'Адреса на физичкото лице',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'individual'
      }
    },
    otherPartyPIN: {
      name: 'otherPartyPIN',
      type: 'text',
      label: 'ЕМБГ на другата страна',
      placeholder: 'пр. 1234567890123',
      required: false,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'individual'
      }
    },
    // Company party fields
    otherPartyCompanyName: {
      name: 'otherPartyCompanyName',
      type: 'text',
      label: 'Име на компанијата',
      placeholder: 'пр. ДОО Пример',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'company'
      }
    },
    otherPartyCompanyAddress: {
      name: 'otherPartyCompanyAddress',
      type: 'text',
      label: 'Адреса на компанијата',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'company'
      }
    },
    otherPartyCompanyManager: {
      name: 'otherPartyCompanyManager',
      type: 'text',
      label: 'Управител на компанијата',
      placeholder: 'пр. Петар Николовски',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'company'
      }
    },
    otherPartyCompanyTaxNumber: {
      name: 'otherPartyCompanyTaxNumber',
      type: 'text',
      label: 'Даночен број на компанијата',
      placeholder: 'пр. 4030123456789',
      required: false,
      condition: {
        field: 'otherPartyType',
        operator: '===',
        value: 'company'
      }
    },

    // Step 3: Property Details
    propertyAddress: {
      name: 'propertyAddress',
      type: 'text',
      label: 'Адреса на недвижноста',
      placeholder: 'пр. ул. Македонска бр. 123, Скопје',
      required: true
    },
    cadastralParcelNumber: {
      name: 'cadastralParcelNumber',
      type: 'text',
      label: 'Број на катастарска парцела',
      placeholder: 'пр. 1234.5',
      required: true
    },
    cadastralMunicipality: {
      name: 'cadastralMunicipality',
      type: 'text',
      label: 'Катастарска општина',
      placeholder: 'пр. Карпош',
      required: true
    },
    propertySheetNumber: {
      name: 'propertySheetNumber',
      type: 'text',
      label: 'Број на имотен лист',
      placeholder: 'пр. 12345',
      required: true
    },
    propertySize: {
      name: 'propertySize',
      type: 'number',
      label: 'Површина (м2)',
      placeholder: 'пр. 85',
      required: true
    },
    propertyType: {
      name: 'propertyType',
      type: 'select',
      label: 'Тип на објект',
      options: [
        { value: 'стан', label: 'Стан' },
        { value: 'куќа', label: 'Куќа' },
        { value: 'деловен простор', label: 'Деловен простор' },
        { value: 'канцеларии', label: 'Канцеларии' },
        { value: 'магацин', label: 'Магацин' },
        { value: 'гаража', label: 'Гаража' },
        { value: 'друго', label: 'Друго' }
      ],
      required: true
    },
    buildingNumber: {
      name: 'buildingNumber',
      type: 'text',
      label: 'Број на зграда/објект',
      placeholder: 'пр. 123',
      required: true
    },
    propertyPurpose: {
      name: 'propertyPurpose',
      type: 'text',
      label: 'Намена на зградата',
      placeholder: 'пр. стамбена зграда',
      required: true
    },
    entrance: {
      name: 'entrance',
      type: 'text',
      label: 'Влез',
      placeholder: 'пр. А',
      required: true
    },
    floor: {
      name: 'floor',
      type: 'text',
      label: 'Кат',
      placeholder: 'пр. 3',
      required: true
    },
    apartmentNumber: {
      name: 'apartmentNumber',
      type: 'text',
      label: 'Број на стан/локал',
      placeholder: 'пр. 12',
      required: true
    },
    specificPurpose: {
      name: 'specificPurpose',
      type: 'text',
      label: 'Намена на посебен дел од зграда',
      placeholder: 'пр. стамбен простор',
      required: true
    },

    // Step 4: Rent and Terms
    rentAmount: {
      name: 'rentAmount',
      type: 'number',
      label: 'Месечна закупнина (EUR)',
      placeholder: 'пр. 300',
      required: true
    },
    includesVAT: {
      name: 'includesVAT',
      type: 'checkbox',
      label: 'Закупнината вклучува ДДВ',
      required: false
    },
    rentPaymentDeadline: {
      name: 'rentPaymentDeadline',
      type: 'select',
      label: 'Закупнината се плаќа',
      options: [
        { value: 'до 5-ти во месецот за тековниот месец', label: 'До 5-ти во месецот за тековниот месец' },
        { value: 'до 10-ти во месецот за тековниот месец', label: 'До 10-ти во месецот за тековниот месец' },
        { value: 'до 15-ти во месецот за тековниот месец', label: 'До 15-ти во месецот за тековниот месец' },
        { value: 'до последниот ден во месецот', label: 'До последниот ден во месецот' },
        { value: 'во рок од 15 дена по истекот на месецот', label: 'Во рок од 15 дена по истекот на месецот' }
      ],
      required: true
    },
    requiresDeposit: {
      name: 'requiresDeposit',
      type: 'checkbox',
      label: 'Потребен е депозит',
      required: false
    },
    depositAmount: {
      name: 'depositAmount',
      type: 'select',
      label: 'Висина на депозит',
      options: [
        { value: '300', label: 'Една месечна закупнина' },
        { value: '600', label: 'Две месечни закупнини' },
        { value: 'custom', label: 'Друг износ' }
      ],
      required: false,
      condition: {
        field: 'requiresDeposit',
        operator: 'truthy'
      }
    },
    customDepositAmount: {
      name: 'customDepositAmount',
      type: 'number',
      label: 'Внесете го износот на депозит (EUR)',
      placeholder: 'пр. 500',
      required: false,
      condition: {
        field: 'depositAmount',
        operator: '===',
        value: 'custom'
      }
    },
    durationType: {
      name: 'durationType',
      type: 'select',
      label: 'Времетраење на договор',
      options: [
        { value: 'определено', label: 'Определено време' },
        { value: 'неопределено', label: 'Неопределено време' }
      ],
      required: true
    },
    durationValue: {
      name: 'durationValue',
      type: 'text',
      label: 'Времетраење',
      placeholder: 'пр. 1 година',
      required: false,
      condition: {
        field: 'durationType',
        operator: '===',
        value: 'определено'
      }
    },
    endDate: {
      name: 'endDate',
      type: 'date',
      label: 'Краен датум на договор',
      required: false,
      condition: {
        field: 'durationType',
        operator: '===',
        value: 'определено'
      }
    },

    // Step 5: Additional Conditions
    bankAccount: {
      name: 'bankAccount',
      type: 'text',
      label: 'Број на жиро сметка',
      placeholder: 'пр. 200-0123456789-12',
      required: true
    },
    bankName: {
      name: 'bankName',
      type: 'text',
      label: 'Име на банка',
      placeholder: 'пр. Комерцијална банка АД',
      required: true
    },
    requiresInsurance: {
      name: 'requiresInsurance',
      type: 'checkbox',
      label: 'Закупецот е обврзан да го осигури просторот од пожар, поплави и други слични ризици',
      required: false
    },
    allowsQuarterlyInspection: {
      name: 'allowsQuarterlyInspection',
      type: 'checkbox',
      label: 'Закупецот е обврзан тримесечно да овозможи инспекција на просторот од страна на закуподавачот',
      required: false
    },
    hasAnnualIncrease: {
      name: 'hasAnnualIncrease',
      type: 'checkbox',
      label: 'Закупнината се зголемува секоја година во јануари за индексот на официјалниот индекс на потрошувачките цени',
      required: false
    }
  },

  // Initial form data
  initialFormData: {
    contractDate: '',
    contractTown: 'Скопје',
    userRole: 'landlord',
    otherPartyType: 'individual',
    otherPartyName: '',
    otherPartyAddress: '',
    otherPartyPIN: '',
    otherPartyCompanyName: '',
    otherPartyCompanyAddress: '',
    otherPartyCompanyManager: '',
    otherPartyCompanyTaxNumber: '',
    propertyAddress: '',
    cadastralParcelNumber: '',
    cadastralMunicipality: '',
    propertySheetNumber: '',
    propertySize: '',
    propertyType: '',
    buildingNumber: '',
    propertyPurpose: '',
    entrance: '',
    floor: '',
    apartmentNumber: '',
    specificPurpose: '',
    rentAmount: '',
    includesVAT: false,
    rentPaymentDeadline: 'до 5-ти во месецот за тековниот месец',
    requiresDeposit: false,
    depositAmount: '300',
    customDepositAmount: '',
    durationType: 'определено',
    durationValue: '',
    endDate: '',
    bankAccount: '',
    bankName: '',
    requiresInsurance: false,
    allowsQuarterlyInspection: false,
    hasAnnualIncrease: false,
    acceptTerms: false
  },

  // Validation rules
  validationRules: [
    // Required fields
    { field: 'contractDate', type: VALIDATION_TYPES.REQUIRED, label: 'Датум на договор' },
    { field: 'contractTown', type: VALIDATION_TYPES.REQUIRED, label: 'Место на склучување' },
    { field: 'userRole', type: VALIDATION_TYPES.REQUIRED, label: 'Ваша улога' },
    { field: 'otherPartyType', type: VALIDATION_TYPES.REQUIRED, label: 'Тип на другата страна' },
    { field: 'propertyAddress', type: VALIDATION_TYPES.REQUIRED, label: 'Адреса на недвижност' },
    { field: 'cadastralParcelNumber', type: VALIDATION_TYPES.REQUIRED, label: 'Број на катастарска парцела' },
    { field: 'cadastralMunicipality', type: VALIDATION_TYPES.REQUIRED, label: 'Катастарска општина' },
    { field: 'propertySheetNumber', type: VALIDATION_TYPES.REQUIRED, label: 'Број на имотен лист' },
    { field: 'propertySize', type: VALIDATION_TYPES.REQUIRED, label: 'Површина на недвижност' },
    { field: 'propertyType', type: VALIDATION_TYPES.REQUIRED, label: 'Тип на објект' },
    { field: 'buildingNumber', type: VALIDATION_TYPES.REQUIRED, label: 'Број на зграда' },
    { field: 'propertyPurpose', type: VALIDATION_TYPES.REQUIRED, label: 'Намена на зграда' },
    { field: 'entrance', type: VALIDATION_TYPES.REQUIRED, label: 'Влез' },
    { field: 'floor', type: VALIDATION_TYPES.REQUIRED, label: 'Кат' },
    { field: 'apartmentNumber', type: VALIDATION_TYPES.REQUIRED, label: 'Број на стан/локал' },
    { field: 'specificPurpose', type: VALIDATION_TYPES.REQUIRED, label: 'Намена на посебен дел' },
    { field: 'rentAmount', type: VALIDATION_TYPES.REQUIRED, label: 'Месечна закупнина' },
    { field: 'rentPaymentDeadline', type: VALIDATION_TYPES.REQUIRED, label: 'Рок за плаќање' },
    { field: 'durationType', type: VALIDATION_TYPES.REQUIRED, label: 'Времетраење на договор' },
    { field: 'bankAccount', type: VALIDATION_TYPES.REQUIRED, label: 'Број на жиро сметка' },
    { field: 'bankName', type: VALIDATION_TYPES.REQUIRED, label: 'Име на банка' },

    // PIN validations
    { field: 'otherPartyPIN', type: VALIDATION_TYPES.PIN, label: 'ЕМБГ на другата страна' },

    // Conditional fields for other party
    {
      field: 'otherPartyName',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Име на физичкото лице',
      condition: { field: 'otherPartyType', operator: '===', value: 'individual' }
    },
    {
      field: 'otherPartyAddress',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Адреса на физичкото лице',
      condition: { field: 'otherPartyType', operator: '===', value: 'individual' }
    },
    {
      field: 'otherPartyPIN',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'ЕМБГ на другата страна',
      condition: { field: 'otherPartyType', operator: '===', value: 'individual' }
    },
    {
      field: 'otherPartyCompanyName',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Име на компанијата',
      condition: { field: 'otherPartyType', operator: '===', value: 'company' }
    },
    {
      field: 'otherPartyCompanyAddress',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Адреса на компанијата',
      condition: { field: 'otherPartyType', operator: '===', value: 'company' }
    },
    {
      field: 'otherPartyCompanyManager',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Управител на компанијата',
      condition: { field: 'otherPartyType', operator: '===', value: 'company' }
    },
    {
      field: 'otherPartyCompanyTaxNumber',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Даночен број на компанијата',
      condition: { field: 'otherPartyType', operator: '===', value: 'company' }
    },
    {
      field: 'depositAmount',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Висина на депозит',
      condition: { field: 'requiresDeposit', operator: 'truthy' }
    },
    {
      field: 'customDepositAmount',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Износ на депозит',
      condition: { field: 'depositAmount', operator: '===', value: 'custom' }
    },
    {
      field: 'durationValue',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Времетраење',
      condition: { field: 'durationType', operator: '===', value: 'определено' }
    }
  ]
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['contractDate', 'contractTown'],
    2: ['userRole', 'otherPartyType', 'otherPartyName', 'otherPartyAddress', 'otherPartyPIN', 'otherPartyCompanyName', 'otherPartyCompanyAddress', 'otherPartyCompanyManager', 'otherPartyCompanyTaxNumber'],
    3: ['propertyAddress', 'cadastralParcelNumber', 'cadastralMunicipality', 'propertySheetNumber', 'propertySize', 'propertyType', 'buildingNumber', 'propertyPurpose', 'entrance', 'floor', 'apartmentNumber', 'specificPurpose'],
    4: ['rentAmount', 'includesVAT', 'rentPaymentDeadline', 'requiresDeposit', 'depositAmount', 'customDepositAmount', 'durationType', 'durationValue', 'endDate'],
    5: ['bankAccount', 'bankName', 'requiresInsurance', 'allowsQuarterlyInspection', 'hasAnnualIncrease']
  };

  return fieldsByStep[stepId]?.map(fieldName => rentAgreementConfig.fields[fieldName]) || [];
};