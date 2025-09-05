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
      required: true,
      helpText: 'Внесете го целосното име и презиме на вработениот на кој му се одобрува годишниот одмор како што е наведено во личните документи.'
    },
    employeePosition: {
      name: 'employeePosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: true,
      helpText: 'Наведете ја работната позиција (назив на работно место) на вработениот според договорот за вработување и систематизацијата на работни места.'
    },
    annualLeaveStart: {
      name: 'annualLeaveStart',
      type: 'date',
      label: 'Почетен датум на годишниот одмор',
      placeholder: '',
      required: true,
      helpText: 'Изберете го датумот кога почнува годишниот одмор. Овој датум треба да се согласи со вработениот и да овозможи нормално функционирање на работата.'
    },
    annualLeaveEnd: {
      name: 'annualLeaveEnd',
      type: 'date',
      label: 'Краен датум на годишниот одмор',
      placeholder: '',
      required: true,
      helpText: 'Изберете го датумот кога завршува годишниот одмор. Овој датум треба да е по почетниот датум. Вработениот на овој датум повратно се враќа на работа.'
    },
    annualLeaveYear: {
      name: 'annualLeaveYear',
      type: 'number',
      label: 'Година за која се користи одморот',
      placeholder: 'пр. 2024',
      required: true,
      min: 2020,
      max: 2030,
      helpText: 'Наведете ја годината за која се користи годишниот одмор. Обично е тековната година или претходната година ако се користи неискористен одмор.'
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