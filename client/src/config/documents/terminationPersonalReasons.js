import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Termination Decision Due to Personal Reasons Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Includes comprehensive legal compliance helpText for all fields
 */
export const terminationPersonalReasonsConfig = {
  documentType: 'terminationPersonalReasons',
  apiEndpoint: 'termination-personal-reasons',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Податоци за работникот',
      description: 'Внесете ги личните податоци за работникот чиј договор се прекинува',
      requiredFields: ['employeeName', 'employeePin', 'employeeAddress']
    },
    {
      id: 2,
      title: 'Работни податоци',
      description: 'Информации за работната позиција и договорот за работа',
      requiredFields: ['jobPosition', 'contractStartDate']
    },
    {
      id: 3,
      title: 'Детали за престанокот',
      description: 'Определете го датумот на престанок и опишете ги личните причини',
      requiredFields: ['terminationDate', 'personalReasonDescription', 'documentDate']
    }
  ],

  // Form fields configuration with comprehensive legal helpText
  fields: {
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Името како што е во договорот за работа или лична карта'
    },
    employeePin: {
      name: 'employeePin',
      type: 'text',
      label: 'ЕМБГ на работникот',
      placeholder: '1234567890123',
      required: true,
      maxLength: 13,
      pattern: '^\\d{13}$',
      inputMode: 'numeric',
      helpText: 'ЕМБГ од лична карта - точно 13 цифри'
    },
    employeeAddress: {
      name: 'employeeAddress',
      type: 'text',
      label: 'Адреса на работникот',
      placeholder: 'пр. ул. Партизанска бр. 15, Скопје',
      required: true,
      helpText: 'Адреса од лична карта или пријавена адреса на живеалиште'
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: true,
      helpText: 'Позиција како што е во договорот за работа'
    },
    contractStartDate: {
      name: 'contractStartDate',
      type: 'date',
      label: 'Датум на започнување на договорот',
      placeholder: '',
      required: true,
      max: new Date().toISOString().split('T')[0],
      helpText: 'Датум на потпишување на договорот за работа'
    },
    terminationDate: {
      name: 'terminationDate',
      type: 'date',
      label: 'Датум на престанок на договорот',
      placeholder: '',
      required: true,
      helpText: 'Последен работен ден - кога престанува работниот однос'
    },
    personalReasonDescription: {
      name: 'personalReasonDescription',
      type: 'textarea',
      label: 'Опис на личните причини за престанок',
      placeholder: 'пр. Здравствени причини кои го спречуваат понатамошното работење, семејни обврски кои бараат посветување на полно работно време, или други лични околности...',
      required: true,
      rows: 4,
      maxLength: 1000,
      helpText: 'Кратко објаснение за личните околности - здравствени, семејни или други лични причини'
    },
    documentDate: {
      name: 'documentDate',
      type: 'date',
      label: 'Датум на документот',
      placeholder: '',
      required: true,
      max: new Date().toISOString().split('T')[0],
      helpText: 'Датум на потпишување на одлуката од страна на компанијата'
    }
  },

  // Validation rules with comprehensive legal compliance
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
        const pinRegex = /^\d{13}$/;
        if (!pinRegex.test(value)) {
          return 'ЕМБГ мора да содржи точно 13 цифри';
        }
        return true;
      }
    },
    {
      field: 'employeeAddress',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Адреса на работникот'
    },
    {
      field: 'employeeAddress',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Адреса на работникот',
      value: 10
    },
    {
      field: 'jobPosition',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Работна позиција'
    },
    {
      field: 'jobPosition',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Работна позиција',
      value: 3
    },
    {
      field: 'contractStartDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на започнување на договорот'
    },
    {
      field: 'contractStartDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на започнување на договорот'
    },
    {
      field: 'terminationDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на престанок на договорот'
    },
    {
      field: 'terminationDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на престанок на договорот'
    },
    {
      field: 'terminationDate',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Датум на престанок на договорот',
      validator: (value, formData) => {
        if (!value || !formData.contractStartDate) return true;
        const startDate = new Date(formData.contractStartDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          return 'Датумот на престанок мора да биде после датумот на започнување на договорот';
        }
        return true;
      }
    },
    {
      field: 'personalReasonDescription',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Опис на личните причини'
    },
    {
      field: 'personalReasonDescription',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Опис на личните причини',
      value: 20
    },
    {
      field: 'personalReasonDescription',
      type: VALIDATION_TYPES.MAX_LENGTH,
      label: 'Опис на личните причини',
      value: 1000
    },
    {
      field: 'documentDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на документот'
    },
    {
      field: 'documentDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на документот'
    },
    {
      field: 'documentDate',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Датум на документот',
      validator: (value, formData) => {
        if (!value || !formData.terminationDate) return true;
        const docDate = new Date(value);
        const termDate = new Date(formData.terminationDate);
        if (docDate > termDate) {
          return 'Препорачуваме датумот на документот да биде пред или во денот на престанокот';
        }
        return true;
      }
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    employeePin: '',
    employeeAddress: '',
    jobPosition: '',
    contractStartDate: '',
    terminationDate: '',
    personalReasonDescription: '',
    documentDate: new Date().toISOString().split('T')[0], // Default to today
    acceptTerms: false
  }
};

export default terminationPersonalReasonsConfig;