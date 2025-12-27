import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Bonus Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Follows established patterns from other employment documents
 */
export const bonusDecisionConfig = {
  documentType: 'bonusDecision',
  apiEndpoint: 'bonus-decision',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот и основни податоци за одлуката',
      requiredFields: ['employeeName', 'employeeWorkPosition']
    },
    {
      id: 2,
      title: 'Детали за бонусот',
      description: 'Износ и причина за доделување на бонусот',
      requiredFields: ['bonusAmount']
    }
  ],

  // Form fields configuration - comprehensive bonus decision fields
  fields: {
    // Step 1: Basic Information
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Внесете го целото име и презиме на работникот кому се доделува бонусот според неговиот работен договор и личен документ за идентификација.'
    },
    employeeWorkPosition: {
      name: 'employeeWorkPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер, Сметководител, Менаџер продажба',
      required: true,
      helpText: 'Наведете ја тековната работна позиција на работникот според Актот за систематизација на работните места и работниот договор.'
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: '',
      required: false,
      helpText: 'Датумот кога се донесува одлуката за бонус. Ако не се внесе, автоматски ќе се користи денешниот датум. Овој датум е важен за правните дејства на одлуката.'
    },
    effectiveDate: {
      name: 'effectiveDate',
      type: 'date',
      label: 'Датум на влегување во сила',
      placeholder: '',
      required: false,
      helpText: 'Датумот од кој одлуката станува правно обврзувачка и се применува. Обично е ист како датумот на донесување, освен ако не е поинаку определено.'
    },

    // Step 2: Bonus Details
    bonusAmount: {
      name: 'bonusAmount',
      type: 'number',
      label: 'Износ на бонусот (во денари)',
      placeholder: '15000',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Внесете го нето износот на бонусот во македонски денари. Овој износ ќе биде исплатен на работникот како додаток на редовната плата и ќе се прикаже во формат: 1.000,00 денари.'
    },
    bonusReason: {
      name: 'bonusReason',
      type: 'select',
      label: 'Детална причина за доделување на бонусот',
      placeholder: 'Изберете причина за бонусот',
      required: false,
      options: [
        { value: 'исклучителни резултати во работата', label: 'Исклучителни резултати во работата' },
        { value: 'успешно завршување на клучен проект', label: 'Успешно завршување на клучен проект' },
        { value: 'надминување на продажните цели', label: 'Надминување на продажните/производните цели' },
        { value: 'придонес кон развојот на компанијата', label: 'Придонес кон развојот на компанијата' },
        { value: 'примерно однесување и професионализам', label: 'Примерно однесување и професионализам' },
        { value: 'иновативни решенија и подобрувања', label: 'Иновативни решенија и подобрувања' },
        { value: 'лојалност и долгогодишна соработка', label: 'Лојалност и долгогодишна соработка' },
        { value: 'стекнување нови вештини и сертификати', label: 'Стекнување нови вештини и сертификати' },
        { value: 'исклучителна тимска работа', label: 'Исклучителна тимска работа и лидерство' },
        { value: 'друго', label: 'Друга причина' }
      ],
      helpText: 'Изберете ја конкретната причина за доделување на бонусот. Ова помага во транспарентност и правна заштита на одлуката според член 105 од Законот за работни односи.'
    }
  },

  // Validation rules - comprehensive validation with helpful warnings
  validationRules: [
    // Step 1 - Basic Information
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име и презиме на работникот'
    },
    {
      field: 'employeeWorkPosition',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Работна позиција'
    },

    // Step 2 - Bonus Details
    {
      field: 'bonusAmount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Износ на бонусот'
    },
    {
      field: 'bonusReason',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Детална причина за доделување на бонусот'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    employeeWorkPosition: '',
    decisionDate: '',
    effectiveDate: '',
    bonusAmount: '',
    bonusReason: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'employeeWorkPosition', 'decisionDate', 'effectiveDate'],
    2: ['bonusAmount', 'bonusReason']
  };

  return fieldsByStep[stepId]?.map(fieldName => bonusDecisionConfig.fields[fieldName]) || [];
};

export default bonusDecisionConfig;