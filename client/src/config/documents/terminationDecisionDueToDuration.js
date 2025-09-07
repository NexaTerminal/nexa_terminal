import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Termination Decision Due to Duration Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const terminationDecisionDueToDurationConfig = {
  documentType: 'terminationDecisionDueToDuration',
  apiEndpoint: 'termination-decision-due-to-duration',
  fileName: null, // Will be auto-generated

  // Single step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Внесете ги потребните податоци за издавање одлука за престанок поради истек на времето',
      requiredFields: ['employeeName', 'jobPosition', 'employmentEndDate', 'decisionDate', 'agreementDate']
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
      helpText: 'Внесете го полното име и презиме на работникот'
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Административен референт',
      required: true,
      helpText: 'Внесете ја работната позиција според договорот за вработување'
    },
    employmentEndDate: {
      name: 'employmentEndDate',
      type: 'date',
      label: 'Датум на престанок на работниот однос',
      placeholder: '',
      required: true,
      helpText: 'Датумот кога истекува договорот за вработување на определено време'
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: '',
      required: true,
      max: new Date().toISOString().split('T')[0], // Cannot be in the future
      helpText: 'Датумот кога е донесена оваа одлука'
    },
    agreementDate: {
      name: 'agreementDate',
      type: 'date',
      label: 'Датум на склучување на договорот за вработување',
      placeholder: '',
      required: true,
      helpText: 'Датумот кога е склучен договорот за вработување на определено време'
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
      field: 'employmentEndDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на престанок на работниот однос'
    },
    {
      field: 'employmentEndDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на престанок на работниот однос'
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
      field: 'agreementDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на склучување на договорот за вработување'
    },
    {
      field: 'agreementDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на склучување на договорот за вработување'
    },
    {
      field: 'agreementDate',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Датум на склучување на договорот за вработување',
      validator: (value, formData) => {
        if (!value || !formData.employmentEndDate) return true;
        const agreementDate = new Date(value);
        const endDate = new Date(formData.employmentEndDate);
        if (agreementDate >= endDate) {
          return 'Датумот на склучување мора да биде пред датумот на истек на договорот';
        }
        return true;
      }
    },
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Датум на одлуката',
      validator: (value, formData) => {
        if (!value || !formData.employmentEndDate) return true;
        const decisionDate = new Date(value);
        const endDate = new Date(formData.employmentEndDate);
        if (decisionDate > endDate) {
          return 'Датумот на одлуката не треба да биде по датумот на престанок';
        }
        return true;
      }
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    jobPosition: '',
    employmentEndDate: '',
    decisionDate: '',
    agreementDate: ''
  }
};

export default terminationDecisionDueToDurationConfig;