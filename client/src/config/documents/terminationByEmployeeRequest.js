import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Termination by Employee Request Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Based on Article 71 of the Macedonian Labor Law
 */
export const terminationByEmployeeRequestConfig = {
  documentType: 'terminationByEmployeeRequest',
  apiEndpoint: 'termination-by-employee-request',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Податоци за работникот',
      description: 'Внесете ги основните податоци за работникот кој поднесува барање',
      requiredFields: ['employeeName', 'jobPosition']
    },
    {
      id: 2,
      title: 'Детали за барањето',
      description: 'Информации за поднесеното барање за престанок на работниот однос',
      requiredFields: ['requestNumber', 'requestDate', 'employmentEndDate']
    },
    {
      id: 3,
      title: 'Датум на одлуката',
      description: 'Определете го датумот кога е донесено решението',
      requiredFields: ['decisionDate']
    }
  ],

  // Form fields configuration
  fields: {
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: false, // Made optional for flexibility
      helpText: 'Внесете го целосното име и презиме на работникот кој поднесува барање'
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: false, // Made optional for flexibility
      helpText: 'Внесете ја точната работна позиција според договорот за работа'
    },
    requestNumber: {
      name: 'requestNumber',
      type: 'text',
      label: 'Број на барањето',
      placeholder: 'пр. 01/2024',
      required: false, // Made optional for flexibility
      helpText: 'Внесете го бројот на барањето за престанок на работниот однос'
    },
    requestDate: {
      name: 'requestDate',
      type: 'date',
      label: 'Датум на поднесување на барањето',
      placeholder: '',
      required: false, // Made optional for flexibility
      max: new Date().toISOString().split('T')[0], // Cannot be in the future
      helpText: 'Датумот кога работникот го поднел барањето за престанок'
    },
    employmentEndDate: {
      name: 'employmentEndDate',
      type: 'date',
      label: 'Датум на престанок на работниот однос',
      placeholder: '',
      required: false, // Made optional for flexibility
      helpText: 'Датумот до кој работникот бара да му престане работниот однос'
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на донесување на решението',
      placeholder: '',
      required: false, // Made optional for flexibility
      max: new Date().toISOString().split('T')[0], // Cannot be in the future
      helpText: 'Датумот кога работодавачот го донесува решението за престанок'
    }
  },

  // Lenient validation rules - provides warnings instead of blocking
  validationRules: [
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Име и презиме на работникот',
      value: 2,
      severity: 'warning'
    },
    {
      field: 'jobPosition',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Работна позиција',
      value: 2,
      severity: 'warning'
    },
    {
      field: 'requestNumber',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Број на барањето',
      value: 1,
      severity: 'warning'
    },
    {
      field: 'requestDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на поднесување на барањето',
      severity: 'warning'
    },
    {
      field: 'employmentEndDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на престанок на работниот однос',
      severity: 'warning'
    },
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на донесување на решението',
      severity: 'warning'
    },
    {
      field: 'employmentEndDate',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Датум на престанок на работниот однос',
      severity: 'warning',
      validator: (value, formData) => {
        if (!value || !formData.requestDate) return true;
        const requestDate = new Date(formData.requestDate);
        const endDate = new Date(value);
        if (endDate < requestDate) {
          return 'Датумот на престанок обично е после датумот на барањето';
        }
        return true;
      }
    },
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Датум на донесување на решението',
      severity: 'warning',
      validator: (value, formData) => {
        if (!value || !formData.requestDate) return true;
        const requestDate = new Date(formData.requestDate);
        const decisionDate = new Date(value);
        if (decisionDate < requestDate) {
          return 'Датумот на решението обично е после датумот на барањето';
        }
        return true;
      }
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    jobPosition: '',
    requestNumber: '',
    requestDate: '',
    employmentEndDate: '',
    decisionDate: '',
    acceptTerms: false
  }
};

export default terminationByEmployeeRequestConfig;