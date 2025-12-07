import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Cash Register Maximum Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Based on Article 20 of the Payment Transactions Law
 */
export const cashRegisterMaximumDecisionConfig = {
  documentType: 'cashRegisterMaximumDecision',
  apiEndpoint: 'cash-register-maximum-decision',
  fileName: null, // Will be auto-generated

  // Single-step form configuration (simple document)
  steps: [
    {
      id: 1,
      title: 'Одлука за благајнички максимум',
      description: 'Внесете ги потребните податоци за утврдување на благајничкиот максимум',
      requiredFields: ['companyManager', 'year', 'amount']
    }
  ],

  // Form fields configuration
  fields: {
    companyManager: {
      name: 'companyManager',
      type: 'text',
      label: 'Име на управител',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Внесете го целото име и презиме на управителот/директорот на компанијата кој ја потпишува оваа одлука. Ова лице мора да има овластување да донесува одлуки според Законот за трговски друштва.'
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: '',
      required: false,
      helpText: 'Внесете го датумот кога се донесува одлуката за благајнички максимум. Ако не се внесе, автоматски ќе се користи денешниот датум. Овој датум е важен за правните дејства на одлуката според член 20 од Законот за платниот промет.'
    },
    year: {
      name: 'year',
      type: 'number',
      label: 'Година на важење',
      placeholder: new Date().getFullYear().toString(),
      min: 2020,
      max: 2099,
      step: 1,
      required: true,
      helpText: 'Внесете го годината за која важи благајничкиот максимум (пр. 2025). Одлуката за благајнички максимум се донесува годишно според Законот за платниот промет, член 20.'
    },
    amount: {
      name: 'amount',
      type: 'number',
      label: 'Износ на благајнички максимум (во денари)',
      placeholder: '50000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете го максималниот износ на готовина што може да се чува во благајната на компанијата во денари. Согласно член 20 од Законот за платниот промет, сите готовински средства над овој износ мора да се уплатат на трансакциска сметка истиот или најдоцна наредниот работен ден. Износот се прикажува во формат: 1.000,00 денари.'
    }
  },

  // Validation rules
  validationRules: [
    {
      field: 'companyManager',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име на управител'
    },
    {
      field: 'year',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Година на важење'
    },
    {
      field: 'amount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Износ на благајнички максимум'
    }
  ],

  // Initial form data
  initialFormData: {
    companyManager: '',
    decisionDate: '',
    year: new Date().getFullYear(),
    amount: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['companyManager', 'decisionDate', 'year', 'amount']
  };

  return fieldsByStep[stepId]?.map(fieldName => cashRegisterMaximumDecisionConfig.fields[fieldName]) || [];
};

export default cashRegisterMaximumDecisionConfig;
