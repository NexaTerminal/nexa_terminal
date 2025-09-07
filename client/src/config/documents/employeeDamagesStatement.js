import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Employee Damages Statement Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const employeeDamagesStatementConfig = {
  documentType: 'employeeDamagesStatement',
  apiEndpoint: 'employee-damages-statement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот и работната позиција',
      requiredFields: ['employeeName', 'jobPosition', 'decisionDate']
    },
    {
      id: 2,
      title: 'Детали за штетата',
      description: 'Опис на штетата и износот за намалување од платата',
      requiredFields: ['damages', 'amount']
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
      placeholder: 'пр. административен работник, продавач, менаџер...',
      required: true
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на изјавата',
      placeholder: '',
      required: true
    },

    // Step 2: Damage Details
    damages: {
      name: 'damages',
      type: 'textarea',
      label: 'Опис на предизвиканата штета',
      placeholder: 'пр. оштетување на опрема, загуба на материјал, несоодветно ракување со средства...',
      rows: 4,
      required: true
    },
    amount: {
      name: 'amount',
      type: 'number',
      label: 'Износ на штетата (во денари)',
      placeholder: 'пр. 5000',
      min: 1,
      step: 0.01,
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
    {
      field: 'jobPosition',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Работна позиција'
    },
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на изјавата'
    },

    // Step 2 - Damage Details
    {
      field: 'damages',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Опис на предизвиканата штета'
    },
    {
      field: 'amount',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Износ на штетата'
    },
    {
      field: 'amount',
      type: VALIDATION_TYPES.NUMBER,
      label: 'Износ на штетата',
      min: 1,
      message: 'Износот мора да биде поголем од нула'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    jobPosition: '',
    decisionDate: '',
    damages: '',
    amount: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'jobPosition', 'decisionDate'],
    2: ['damages', 'amount']
  };

  return fieldsByStep[stepId]?.map(fieldName => employeeDamagesStatementConfig.fields[fieldName]) || [];
};

export default employeeDamagesStatementConfig;