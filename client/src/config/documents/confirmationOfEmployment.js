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
      required: true,
      helpText: 'Внесете го целосното име и презиме на вработениот за кого се издава потврдата за вработеност како што е наведено во личните документи.'
    },
    employeePIN: {
      name: 'employeePIN',
      type: 'text',
      label: 'ЕМБГ на вработениот',
      placeholder: 'пр. 1234567890123',
      required: true,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      helpText: 'Внесете го ЕМБГ (Единствен матичен број на граѓанин) од точно 13 цифри на вработениот како што е наведен во личната карта.'
    },
    employeeAddress: {
      name: 'employeeAddress',
      type: 'text',
      label: 'Адреса на вработениот',
      placeholder: 'пр. ул. Македонија бр. 123, Скопје',
      required: true,
      helpText: 'Внесете ја адресата на постојано живеење на вработениот (улица, број, град) како што е регистрирана во работните документи.'
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: true,
      helpText: 'Наведете ја точната работна позиција (назив на работно место) на вработениот според договорот за вработување и систематизацијата.'
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
      ],
      helpText: 'Изберете го типот на договор кој се однесува на вработениот. Неопределено време = договор без краен датум. Определено време = договор со краен датум.'
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
      },
      helpText: 'Изберете го датумот кога завршува договорот ако сте избрале определено времетраење. Овој податок ќе биде наведен во потврдата за вработеност.'
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