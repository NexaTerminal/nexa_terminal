import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Bonus Payment Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Follows established patterns from other employment documents
 */
export const bonusPaymentConfig = {
  documentType: 'bonusPayment',
  apiEndpoint: 'bonus-payment',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот и датум на одлуката',
      requiredFields: ['employeeName', 'employeeWorkPosition']
    },
    {
      id: 2,
      title: 'Детали за бонусот',
      description: 'Износ и причина за доделување на бонусот',
      requiredFields: ['bonusAmount', 'bonusReason']
    }
  ],

  // Form fields configuration - all fields optional for user flexibility
  fields: {
    // Step 1: Basic Information
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: false, // Optional for user flexibility
      tooltip: 'Внесете го целото име и презиме на работникот кому се доделува бонусот'
    },
    employeeWorkPosition: {
      name: 'employeeWorkPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер, Сметководител, Менаџер продажба',
      required: false, // Optional for user flexibility  
      tooltip: 'Наведете ја тековната работна позиција на работникот'
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: '',
      required: false, // Will default to current date if not provided
      tooltip: 'Датумот кога се донесува одлуката за бонус. Ако не се внесе, ќе се користи денешниот датум'
    },

    // Step 2: Bonus Details
    bonusAmount: {
      name: 'bonusAmount',
      type: 'text',
      label: 'Износ на бонусот (во денари)',
      placeholder: 'пр. 15,000, 25000, 30.000',
      required: false, // Optional for user flexibility
      tooltip: 'Внесете го нето износот на бонусот во македонски денари'
    },
    bonusReason: {
      name: 'bonusReason',
      type: 'textarea',
      label: 'Причина за доделување на бонусот',
      placeholder: 'пр. исклучителни резултати во тековното тримесечје, успешно завршување на проект, надминување на продажните цели...',
      rows: 4,
      required: false, // Optional for user flexibility
      tooltip: 'Опишете ја конкретната причина поради која се доделува бонусот. Ако не се внесе, ќе се користи стандарден текст'
    }
  },

  // Validation rules - lenient validation that provides warnings instead of blocking
  validationRules: [
    // Step 1 - Basic Information
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Име и презиме на работникот'
    },
    {
      field: 'employeeWorkPosition',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Работна позиција'
    },

    // Step 2 - Bonus Details
    {
      field: 'bonusAmount',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Износ на бонусот'
    },
    {
      field: 'bonusReason',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Причина за доделување на бонусот'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    employeeWorkPosition: '',
    decisionDate: '',
    bonusAmount: '',
    bonusReason: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'employeeWorkPosition', 'decisionDate'],
    2: ['bonusAmount', 'bonusReason']
  };

  return fieldsByStep[stepId]?.map(fieldName => bonusPaymentConfig.fields[fieldName]) || [];
};

export default bonusPaymentConfig;