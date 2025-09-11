import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Organization Act Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const organizationActConfig = {
  documentType: 'organizationAct',
  apiEndpoint: 'organization-act',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни информации',
      description: 'Внесете ги основните податоци за документот',
      requiredFields: ['documentDate']
    },
    {
      id: 2,
      title: 'Работни позиции',
      description: 'Дефинирајте ги работните позиции и нивните карактеристики',
      requiredFields: ['positions']
    }
  ],

  // Form fields configuration
  fields: {
    documentDate: {
      name: 'documentDate',
      type: 'date',
      label: 'Датум на документот',
      placeholder: '',
      required: true,
      max: new Date().toISOString().split('T')[0], // Cannot be in the future
      helpText: 'Датумот кога е создаден актот за систематизација'
    },
    positions: {
      name: 'positions',
      type: 'array',
      label: 'Работни позиции',
      placeholder: '',
      required: true,
      minItems: 1,
      helpText: 'Додајте најмалку една работна позиција'
    }
  },

  // Position template for dynamic fields
  positionTemplate: {
    positionName: {
      name: 'positionName',
      type: 'text',
      label: 'Име на позиција',
      placeholder: 'пр. Главен оперативен директор',
      required: true,
      helpText: 'Внесете го официјалното име на работната позиција'
    },
    numberOfEmployees: {
      name: 'numberOfEmployees',
      type: 'text',
      label: 'Број на вработени',
      placeholder: 'пр. 1 (еден)',
      required: true,
      helpText: 'Внесете го бројот на вработени за оваа позиција'
    },
    educationRequirements: {
      name: 'educationRequirements',
      type: 'textarea',
      label: 'Образовни барања',
      placeholder: 'пр. Да има завршено високо образование...',
      required: false,
      rows: 3,
      helpText: 'Опишете ги образовните барања за оваа позиција'
    },
    experienceRequirements: {
      name: 'experienceRequirements',
      type: 'textarea',
      label: 'Барања за работно искуство',
      placeholder: 'пр. работно искуство од најмалку 5 години во областа',
      required: false,
      rows: 2,
      helpText: 'Опишете ги барањата за работно искуство'
    },
    responsibilities: {
      name: 'responsibilities',
      type: 'textarea',
      label: 'Работни обврски',
      placeholder: 'Опишете ги работните обврски...',
      required: false,
      rows: 4,
      helpText: 'Детално опишете ги работните обврски и одговорности'
    }
  },

  // Validation rules
  validationRules: [
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
      field: 'positions',
      type: VALIDATION_TYPES.ARRAY,
      label: 'Работни позиции'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    documentDate: '',
    positions: [],
    acceptTerms: false
  }
};

export default organizationActConfig;