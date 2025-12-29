import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Invoice Signing Authorization Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Based on company founding agreement for delegating invoice signing authority
 */
export const invoiceSigningAuthorizationConfig = {
  documentType: 'invoiceSigningAuthorization',
  apiEndpoint: 'invoice-signing-authorization',
  fileName: null, // Will be auto-generated

  // Single-step form configuration (simple document)
  steps: [
    {
      id: 1,
      title: 'Овластување за потпишување фактури',
      description: 'Внесете ги потребните податоци за издавање овластување за потпишување на излезни фактури',
      requiredFields: ['authorizedPerson', 'position', 'effectiveDate', 'date']
    }
  ],

  // Form fields configuration
  fields: {
    authorizedPerson: {
      name: 'authorizedPerson',
      type: 'text',
      label: 'Име и презиме на овластено лице',
      placeholder: 'пр. Петар Јовановски',
      required: true,
      helpText: 'Внесете го целото име и презиме на работникот кој се овластува за потпишување на излезни фактури. Ова лице мора да биде вработено во компанијата и да има соодветна стручна компетентност за работа со финансиска документација според Законот за сметководство.'
    },
    position: {
      name: 'position',
      type: 'text',
      label: 'Работно место на овластеното лице',
      placeholder: 'пр. Сметководител, Финансиски службеник',
      required: true,
      helpText: 'Внесете го точното работно место на овластеното лице според Систематизацијата на работни места и Договорот за вработување. Работното место мора да опфаќа работни задачи поврзани со проверка на документација и издавање фактури согласно Законот за сметководство и интерните акти на компанијата.'
    },
    effectiveDate: {
      name: 'effectiveDate',
      type: 'date',
      label: 'Датум на стапување на сила на овластувањето',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот од кој овластувањето стапува на правна сила. Од овој датум овластеното лице може законски да потпишува излезни фактури во име на компанијата. Датумот мора да биде внимателно избран со оглед на процедурите за пренесување на одговорности и обуката на лицето.'
    },
    date: {
      name: 'date',
      type: 'date',
      label: 'Датум на издавање на документот',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога се издава овластувањето. Ова е официјалниот датум на донесување на документот и мора да биде ист или пред датумот на стапување на сила. Овој датум е важен за правното евидентирање на овластувањето во книгата на акти на компанијата.'
    }
  },

  // Validation rules
  validationRules: [
    {
      field: 'authorizedPerson',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име на овластено лице'
    },
    {
      field: 'position',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Работно место'
    },
    {
      field: 'effectiveDate',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на стапување на сила'
    },
    {
      field: 'date',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на издавање'
    }
  ],

  // Initial form data
  initialFormData: {
    authorizedPerson: '',
    position: '',
    effectiveDate: '',
    date: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['authorizedPerson', 'position', 'effectiveDate', 'date']
  };

  return fieldsByStep[stepId]?.map(fieldName => invoiceSigningAuthorizationConfig.fields[fieldName]) || [];
};

export default invoiceSigningAuthorizationConfig;
