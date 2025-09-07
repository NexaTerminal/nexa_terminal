import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Termination Due to Age Limit Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const terminationDueToAgeLimitConfig = {
  documentType: 'terminationDueToAgeLimit',
  apiEndpoint: 'termination-due-to-age-limit',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Податоци за работникот',
      description: 'Внесете ги основните податоци за работникот кој достигнува пензиска возраст',
      requiredFields: ['employeeName', 'employeePin']
    },
    {
      id: 2,
      title: 'Временска рамка',
      description: 'Определете ги важните датуми за решението',
      requiredFields: ['decisionDate', 'employmentEndDate']
    }
  ],

  // Form fields configuration
  fields: {
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Внесете го целосното име и презиме како што е наведено во договорот за работа'
    },
    employeePin: {
      name: 'employeePin',
      type: 'text',
      label: 'ЕМБГ на работникот',
      placeholder: 'пр. 1234567890123',
      required: true,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      helpText: 'Внесете го ЕМБГ-от (точно 13 цифри)'
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на донесување на решението',
      placeholder: '',
      required: true,
      max: new Date().toISOString().split('T')[0], // Cannot be in the future
      helpText: 'Датумот кога е донесено решението за престанок поради возраст'
    },
    employmentEndDate: {
      name: 'employmentEndDate',
      type: 'date',
      label: 'Датум на престанок на работен однос',
      placeholder: '',
      required: true,
      min: new Date().toISOString().split('T')[0], // Must be today or in the future
      helpText: 'Датумот кога официјално престанува работниот однос'
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
      field: 'employeeName',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Име и презиме на работникот',
      value: 3
    },
    {
      field: 'employeePin',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'ЕМБГ на работникот'
    },
    {
      field: 'employeePin',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'ЕМБГ на работникот',
      validator: (value) => {
        if (!value) return true;
        const pinPattern = /^\d{13}$/;
        if (!pinPattern.test(value)) {
          return 'ЕМБГ мора да содржи точно 13 цифри';
        }
        return true;
      }
    },
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на донесување на решението'
    },
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на донесување на решението'
    },
    {
      field: 'employmentEndDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на престанок на работен однос'
    },
    {
      field: 'employmentEndDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на престанок на работен однос'
    },
    {
      field: 'employmentEndDate',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Датум на престанок на работен однос',
      validator: (value, formData) => {
        if (!value || !formData.decisionDate) return true;
        const decisionDate = new Date(formData.decisionDate);
        const endDate = new Date(value);
        if (endDate < decisionDate) {
          return 'Датумот на престанок мора да биде после или ист со датумот на решението';
        }
        return true;
      }
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    employeePin: '',
    decisionDate: '',
    employmentEndDate: '',
    acceptTerms: false
  }
};

export default terminationDueToAgeLimitConfig;