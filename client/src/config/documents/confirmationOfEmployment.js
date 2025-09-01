import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Confirmation of Employment Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const confirmationOfEmploymentConfig = {
  documentType: 'confirmationOfEmployment',
  apiEndpoint: 'confirmation-of-employment',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Податоци за вработениот',
      description: 'Внесете ги основните податоци за вработениот',
      requiredFields: ['employeeName', 'employeePIN', 'employeeAddress', 'jobPosition', 'agreementDurationType']
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
    employeePIN: {
      name: 'employeePIN',
      type: 'text',
      label: 'ЕМБГ на вработениот',
      placeholder: 'пр. 1234567890123',
      required: true,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric'
    },
    employeeAddress: {
      name: 'employeeAddress',
      type: 'text',
      label: 'Адреса на вработениот',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: true
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: true
    },
    agreementDurationType: {
      name: 'agreementDurationType',
      type: 'select',
      label: 'Тип на договор',
      required: true,
      options: [
        { value: '', label: 'Изберете тип на договор' },
        { value: 'неопределено време', label: 'Неопределено време' },
        { value: 'определено време', label: 'Определено време' }
      ]
    },
    definedDuration: {
      name: 'definedDuration',
      type: 'date',
      label: 'Краен датум на договор',
      placeholder: '',
      required: false,
      conditional: {
        field: 'agreementDurationType',
        value: 'определено време'
      }
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
      field: 'employeePIN',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'ЕМБГ на работникот'
    },
    {
      field: 'employeePIN',
      type: VALIDATION_TYPES.PIN,
      label: 'ЕМБГ на работникот'
    },
    {
      field: 'employeeAddress',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Адреса на работникот'
    },
    {
      field: 'jobPosition',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Работна позиција'
    },
    {
      field: 'agreementDurationType',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Тип на договор'
    },
    {
      field: 'definedDuration',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Краен датум на договор',
      condition: {
        field: 'agreementDurationType',
        value: 'определено време'
      }
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    employeePIN: '',
    employeeAddress: '',
    jobPosition: '',
    agreementDurationType: '',
    definedDuration: '',
    acceptTerms: false
  }
};

export default confirmationOfEmploymentConfig;