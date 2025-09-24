import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Unpaid Leave Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const unpaidLeaveDecisionConfig = {
  documentType: 'unpaidLeaveDecision',
  apiEndpoint: 'unpaid-leave-decision',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот и неплатеното отсуство',
      requiredFields: ['employeeName', 'unpaidLeaveDuration', 'startingDate']
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
      helpText: 'Внесете го целосното име и презиме на вработениот кој бара неплатено отсуство како што е наведено во личните документи и договорот за вработување.'
    },
    unpaidLeaveDuration: {
      name: 'unpaidLeaveDuration',
      type: 'select',
      label: 'Времетраење на неплатеното отсуство',
      placeholder: 'Изберете времетраење',
      required: true,
      options: [
        { value: 1, label: '1 месец' },
        { value: 2, label: '2 месеца' },
        { value: 3, label: '3 месеца' }
      ],
      helpText: 'Изберете го времетраењето во месеци. Согласно член 147 од Законот за работни односи, неплатеното отсуство може да трае максимум 3 месеци. Датумот за враќање ќе се пресмета автоматски.'
    },
    startingDate: {
      name: 'startingDate',
      type: 'date',
      label: 'Датум на почеток на неплатеното отсуство',
      placeholder: '',
      required: true,
      helpText: 'Изберете го датумот кога започнува неплатеното отсуство. Овој датум треба да се согласи со вработениот и да овозможи нормално функционирање на работата.'
    },
  },

  // Validation rules
  validationRules: [
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име и презиме на вработениот'
    },
    {
      field: 'unpaidLeaveDuration',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Времетраење на неплатеното отсуство'
    },
    {
      field: 'startingDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на почеток на неплатеното отсуство'
    },
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    unpaidLeaveDuration: '',
    startingDate: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'unpaidLeaveDuration', 'startingDate']
  };

  return fieldsByStep[stepId]?.map(fieldName => unpaidLeaveDecisionConfig.fields[fieldName]) || [];
};

export default unpaidLeaveDecisionConfig;