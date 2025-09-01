import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Annual Leave Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const annualLeaveDecisionConfig = {
  documentType: 'annualLeaveDecision',
  apiEndpoint: 'annual-leave-decision',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот и одморот',
      requiredFields: ['employeeName', 'employeePosition', 'annualLeaveStart', 'annualLeaveEnd', 'annualLeaveYear']
    }
  ],

  // Form fields configuration
  fields: {
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на вработениот',
      placeholder: 'пр. Марко Петровски',
      required: true
    },
    employeePosition: {
      name: 'employeePosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: true
    },
    annualLeaveStart: {
      name: 'annualLeaveStart',
      type: 'date',
      label: 'Почетен датум на годишниот одмор',
      placeholder: '',
      required: true
    },
    annualLeaveEnd: {
      name: 'annualLeaveEnd',
      type: 'date',
      label: 'Краен датум на годишниот одмор',
      placeholder: '',
      required: true
    },
    annualLeaveYear: {
      name: 'annualLeaveYear',
      type: 'number',
      label: 'Година за која се користи одморот',
      placeholder: 'пр. 2024',
      required: true,
      min: 2020,
      max: 2030
    }
  },

  // Validation rules
  validationRules: [
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име и презиме на вработениот'
    },
    {
      field: 'employeePosition',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Работна позиција'
    },
    {
      field: 'annualLeaveStart',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Почетен датум на годишниот одмор'
    },
    {
      field: 'annualLeaveEnd',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Краен датум на годишниот одмор'
    },
    {
      field: 'annualLeaveYear',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Година за која се користи одморот'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    employeePosition: '',
    annualLeaveStart: '',
    annualLeaveEnd: '',
    annualLeaveYear: new Date().getFullYear(), // Default to current year
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'employeePosition', 'annualLeaveStart', 'annualLeaveEnd', 'annualLeaveYear']
  };

  return fieldsByStep[stepId]?.map(fieldName => annualLeaveDecisionConfig.fields[fieldName]) || [];
};

export default annualLeaveDecisionConfig;