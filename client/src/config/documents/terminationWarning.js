import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Termination Warning Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const terminationWarningConfig = {
  documentType: 'terminationWarning',
  apiEndpoint: 'termination-warning',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Податоци за работникот',
      description: 'Внесете ги основните податоци за работникот',
      requiredFields: ['employeeName', 'jobPosition']
    },
    {
      id: 2,
      title: 'Детали за прекршокот',
      description: 'Опишете ја обврската и постапувањето спротивно на истата',
      requiredFields: ['workTaskFailure', 'employeeWrongDoing']
    },
    {
      id: 3,
      title: 'Временски рамка',
      description: 'Определете ги важните датуми за предупредувањето',
      requiredFields: ['decisionDate', 'fixingDeadline']
    }
  ],

  // Form fields configuration
  fields: {
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
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: '',
      required: true,
      max: new Date().toISOString().split('T')[0], // Cannot be in the future
      helpText: 'Датумот кога е донесена одлуката за издавање предупредување'
    },
    workTaskFailure: {
      name: 'workTaskFailure',
      type: 'textarea',
      label: 'Обврска која работникот не ја исполнил',
      placeholder: 'пр. Навремено завршување на доделените проекти согласно утврдените рокови',
      required: true,
      rows: 3,
      maxLength: 500,
      helpText: 'Детално опишете ја работната обврска која не е исполнета'
    },
    employeeWrongDoing: {
      name: 'employeeWrongDoing',
      type: 'textarea',
      label: 'Постапување спротивно на обврската',
      placeholder: 'пр. Доцнење со извршување на задачите, недостаток на комуникација со тимот',
      required: true,
      rows: 4,
      maxLength: 800,
      helpText: 'Конкретно опишете го проблематичното однесување или постапување'
    },
    fixingDeadline: {
      name: 'fixingDeadline',
      type: 'date',
      label: 'Рок за исправка на однесувањето',
      placeholder: '',
      required: true,
      min: new Date().toISOString().split('T')[0], // Must be in the future
      helpText: 'Датумот до кој работникот мора да го исправи своето однесување'
    }
  },

  // Validation rules
  validationRules: [
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
      label: 'Датум на одлуката'
    },
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на одлуката'
    },
    {
      field: 'workTaskFailure',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Обврска која работникот не ја исполнил'
    },
    {
      field: 'workTaskFailure',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Обврска која работникот не ја исполнил',
      value: 10
    },
    {
      field: 'employeeWrongDoing',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Постапување спротивно на обврската'
    },
    {
      field: 'employeeWrongDoing',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Постапување спротивно на обврската',
      value: 15
    },
    {
      field: 'fixingDeadline',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Рок за исправка на однесувањето'
    },
    {
      field: 'fixingDeadline',
      type: VALIDATION_TYPES.DATE,
      label: 'Рок за исправка на однесувањето'
    },
    {
      field: 'fixingDeadline',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Рок за исправка на однесувањето',
      validator: (value, formData) => {
        if (!value || !formData.decisionDate) return true;
        const decisionDate = new Date(formData.decisionDate);
        const fixingDate = new Date(value);
        if (fixingDate <= decisionDate) {
          return 'Рокот за исправка мора да биде после датумот на одлуката';
        }
        return true;
      }
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    jobPosition: '',
    decisionDate: '',
    workTaskFailure: '',
    employeeWrongDoing: '',
    fixingDeadline: '',
    acceptTerms: false
  }
};

export default terminationWarningConfig;