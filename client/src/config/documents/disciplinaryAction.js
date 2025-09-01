import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Disciplinary Action Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const disciplinaryActionConfig = {
  documentType: 'disciplinaryAction',
  apiEndpoint: 'disciplinary-action',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот',
      requiredFields: ['employeeName', 'jobPosition']
    },
    {
      id: 2,
      title: 'Детали за казната',
      description: 'Висина и период на дисциплинската мерка',
      requiredFields: ['sanctionAmount', 'sanctionPeriod', 'sanctionDate']
    },
    {
      id: 3,
      title: 'Причина за казната',
      description: 'Опис на прекршокот и постапувањето',
      requiredFields: ['workTaskFailure', 'employeeWrongDoing', 'employeeWrongdoingDate']
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
      required: true
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: true
    },

    // Step 2: Sanction Details
    sanctionAmount: {
      name: 'sanctionAmount',
      type: 'select',
      label: 'Висина на казната (% од нето плата)',
      required: true,
      options: [
        { value: '', label: 'Изберете висина на казната' },
        { value: '5', label: '5%' },
        { value: '10', label: '10%' },
        { value: '15', label: '15%' }
      ]
    },
    sanctionPeriod: {
      name: 'sanctionPeriod',
      type: 'select',
      label: 'Период на казната (месеци)',
      required: true,
      options: [
        { value: '', label: 'Изберете период' },
        { value: '1', label: '1 месец' },
        { value: '2', label: '2 месеци' },
        { value: '3', label: '3 месеци' },
        { value: '4', label: '4 месеци' },
        { value: '5', label: '5 месеци' },
        { value: '6', label: '6 месеци' }
      ]
    },
    sanctionDate: {
      name: 'sanctionDate',
      type: 'date',
      label: 'Датум на изрекување на казната',
      placeholder: '',
      required: false // Will default to current date if not provided
    },

    // Step 3: Violation Details
    workTaskFailure: {
      name: 'workTaskFailure',
      type: 'textarea',
      label: 'Работна обврска која работникот ја запоставил',
      placeholder: 'пр. Навремено доаѓање на работно место',
      rows: 3,
      required: true
    },
    employeeWrongDoing: {
      name: 'employeeWrongDoing',
      type: 'textarea',
      label: 'Постапување на работникот спротивно на обврската',
      placeholder: 'пр. Доцнење на работа без оправдана причина',
      rows: 3,
      required: true
    },
    employeeWrongdoingDate: {
      name: 'employeeWrongdoingDate',
      type: 'date',
      label: 'Датум на постапувањето спротивно на обврската',
      placeholder: '',
      required: true
    }
  },

  // Validation rules
  validationRules: [
    // Step 1 - Basic Information
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име и презиме на работnikот'
    },
    {
      field: 'jobPosition',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Работна позиција'
    },

    // Step 2 - Sanction Details
    {
      field: 'sanctionAmount',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Висина на казната'
    },
    {
      field: 'sanctionPeriod',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Период на казната'
    },

    // Step 3 - Violation Details
    {
      field: 'workTaskFailure',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Работна обврска која е запостави.'
    },
    {
      field: 'employeeWrongDoing',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Постапување спротивно на обврската'
    },
    {
      field: 'employeeWrongdoingDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на постапувањето'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    jobPosition: '',
    sanctionAmount: '',
    sanctionPeriod: '',
    sanctionDate: '',
    workTaskFailure: '',
    employeeWrongDoing: '',
    employeeWrongdoingDate: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'jobPosition'],
    2: ['sanctionAmount', 'sanctionPeriod', 'sanctionDate'],
    3: ['workTaskFailure', 'employeeWrongDoing', 'employeeWrongdoingDate']
  };

  return fieldsByStep[stepId]?.map(fieldName => disciplinaryActionConfig.fields[fieldName]) || [];
};

export default disciplinaryActionConfig;