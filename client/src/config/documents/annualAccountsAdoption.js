import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Annual Accounts Adoption Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Based on Article 215 paragraph 1 point 1 of the Law on Trading Companies
 */
export const annualAccountsAdoptionConfig = {
  documentType: 'annualAccountsAdoption',
  apiEndpoint: 'annual-accounts-adoption',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци за одлуката',
      description: 'Внесете ги основните податоци за усвојување на годишната сметка',
      requiredFields: ['meetingDate', 'year', 'date', 'chairman']
    }
  ],

  // Form fields configuration
  fields: {
    meetingDate: {
      name: 'meetingDate',
      type: 'date',
      label: 'Датум на седница на собранието',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога е одржана седницата на собранието на содружниците на која се донесува оваа одлука. Согласно Законот за трговските друштва, годишната сметка и финансиските извештаи мораат да бидат усвоени најдоцна до 30 јуни во тековната година за претходната деловна година.'
    },
    year: {
      name: 'year',
      type: 'number',
      label: 'Година на извештајот',
      placeholder: '2025',
      min: 2000,
      max: 2099,
      step: 1,
      required: true,
      helpText: 'Внесете ја деловната година за која се усвојуваат годишната сметка и финансиските извештаи. Овој податок се однесува на извештајниот период за кој се составени финансиските извештаи во согласност со Законот за трговските друштва и меѓународните сметководствени стандарди.'
    },
    date: {
      name: 'date',
      type: 'date',
      label: 'Датум на донесување на одлуката',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот на кој формално се донесува оваа одлука. Обично тоа е истиот датум како датумот на седницата на собранието. Согласно член 215 од Законот за трговските друштва, одлуката влегува во сила со денот на донесувањето.'
    },
    chairman: {
      name: 'chairman',
      type: 'text',
      label: 'Име на претседавач на собранието',
      placeholder: 'пр. Јован Јовановски',
      required: true,
      helpText: 'Внесете го целото име и презиме на претседавачот на собранието на содружниците кој ја потпишува оваа одлука. Претседавачот на собранието е овластен да ги потпишува одлуките донесени од содружниците согласно Законот за трговските друштва и Договорот за друштвото.'
    }
  },

  // Validation rules
  validationRules: [
    {
      field: 'meetingDate',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на седница'
    },
    {
      field: 'year',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Година на извештајот'
    },
    {
      field: 'date',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на донесување'
    },
    {
      field: 'chairman',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име на претседавач'
    }
  ],

  // Initial form data
  initialFormData: {
    meetingDate: '',
    year: new Date().getFullYear() - 1, // Previous year by default
    date: '',
    chairman: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['meetingDate', 'year', 'date', 'chairman']
  };

  return fieldsByStep[stepId]?.map(fieldName => annualAccountsAdoptionConfig.fields[fieldName]) || [];
};

export default annualAccountsAdoptionConfig;
