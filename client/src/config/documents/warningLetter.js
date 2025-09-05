import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Warning Letter Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Similar to disciplinary action but WITHOUT amount and duration fields
 */
export const warningLetterConfig = {
  documentType: 'warningLetter',
  apiEndpoint: 'warning-letter',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот и датум на опомената',
      requiredFields: ['employeeName', 'warningDate']
    },
    {
      id: 2,
      title: 'Причина за опомената',
      description: 'Детали за постапувањето и повредените правила',
      requiredFields: ['employeeWrongDoing', 'rulesNotRespected', 'articleNumber']
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
    warningDate: {
      name: 'warningDate',
      type: 'date',
      label: 'Датум на опомената',
      placeholder: '',
      required: false // Will default to current date if not provided
    },

    // Step 2: Warning Details
    employeeWrongDoing: {
      name: 'employeeWrongDoing',
      type: 'textarea',
      label: 'Што направил работникот погрешно',
      placeholder: 'пр. доцнење на работа без оправдана причина, непочитување на работното време...',
      rows: 4,
      required: true
    },
    rulesNotRespected: {
      name: 'rulesNotRespected',
      type: 'textarea',
      label: 'Кои правила/обврски не се почитуваат',
      placeholder: 'пр. работно време согласно договорот за вработување, интерни правила за работа...',
      rows: 3,
      required: true
    },
    articleNumber: {
      name: 'articleNumber',
      type: 'text',
      label: 'Член од договорот за вработување',
      placeholder: 'пр. член 8, член 12.3',
      required: true
    }
  },

  // Validation rules
  validationRules: [
    // Step 1 - Basic Information
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име и презиме на работникот'
    },

    // Step 2 - Warning Details
    {
      field: 'employeeWrongDoing',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Што направил работникот погрешно'
    },
    {
      field: 'rulesNotRespected',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Кои правила/обврски не се почитуваат'
    },
    {
      field: 'articleNumber',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Член од договорот за вработување'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    warningDate: '',
    employeeWrongDoing: '',
    rulesNotRespected: '',
    articleNumber: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'warningDate'],
    2: ['employeeWrongDoing', 'rulesNotRespected', 'articleNumber']
  };

  return fieldsByStep[stepId]?.map(fieldName => warningLetterConfig.fields[fieldName]) || [];
};

export default warningLetterConfig;