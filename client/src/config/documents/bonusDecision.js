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
      description: 'Тип, износ и причина за доделување на бонусот',
      requiredFields: ['bonusType', 'bonusAmount']
    },
    {
      id: 3,
      title: 'Дополнителни услови',
      description: 'Критериуми, период на важење и дополнителни спецификации',
      requiredFields: []
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
    bonusType: {
      name: 'bonusType',
      type: 'select',
      label: 'Тип на бонус',
      placeholder: 'Изберете тип на бонус',
      required: true,
      options: [
        { value: 'работна успешност', label: 'Работна успешност' },
        { value: 'квалитет на работа', label: 'Квалитет на работа' },
        { value: 'навремено завршување проект', label: 'Навремено завршување проект' },
        { value: 'надминување на цели', label: 'Надминување на продажни/производни цели' },
        { value: 'иновации и подобрувања', label: 'Иновации и подобрувања во работата' },
        { value: 'лојалност и посветеност', label: 'Лојалност и посветеност кон компанијата' },
        { value: 'професионален развој', label: 'Професионален развој и стекнување сертификати' },
        { value: 'тимска работа', label: 'Исклучителна тимска работа и соработка' },
        { value: 'друго', label: 'Друг тип на бонус' }
      ],
      helpText: 'Изберете ја категоријата на бонусот според Законот за работни односи, член 105. Ова помага во правилно документирање на причината за доделување.'
    },
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
    },

    // Step 3: Additional Conditions
    criteria: {
      name: 'criteria',
      type: 'select',
      label: 'Критериуми за доделување',
      placeholder: 'Изберете критериум',
      required: false,
      options: [
        { value: 'постигнување на планираните цели', label: 'Постигнување на планираните цели (90%+)' },
        { value: 'одсуство на дисциплински мерки', label: 'Одсуство на дисциплински мерки' },
        { value: 'минимум работен стаж', label: 'Минимум 6 месеци работен стаж' },
        { value: 'квалитет на извршената работа', label: 'Високо ниво на квалитет на работата' },
        { value: 'навременост и редовност', label: 'Навременост и редовност во работата' },
        { value: 'иницијатива и креативност', label: 'Покажана иницијатива и креативност' },
        { value: 'соработка со колеги', label: 'Одлична соработка со колеги и тимови' },
        { value: 'професионален развој', label: 'Континуиран професионален развој' },
        { value: 'придржување до политики', label: 'Строго придржување до политиките на компанијата' },
        { value: 'комбинирани критериуми', label: 'Комбинација од повеќе критериуми' }
      ],
      helpText: 'Изберете го главниот критериум врз основа на кој се донесува одлуката за бонус. Ова обезбедува транспарентност и еднаквост во третманот на вработените.'
    },
    bonusPeriod: {
      name: 'bonusPeriod',
      type: 'select',
      label: 'Период на кој се однесува бонусот',
      placeholder: 'Изберете период',
      required: false,
      options: [
        { value: 'тековен месец', label: 'Тековен месец' },
        { value: 'претходен месец', label: 'Претходен месец' },
        { value: 'прво тримесечје', label: 'Прво тримесечје' },
        { value: 'второ тримесечје', label: 'Второ тримесечје' },
        { value: 'трето тримесечје', label: 'Трето тримесечје' },
        { value: 'четврто тримесечје', label: 'Четврто тримесечје' },
        { value: 'прво полугодие', label: 'Прво полугодие' },
        { value: 'второ полугодие', label: 'Второ полугодие' },
        { value: 'целата година', label: 'Целата година' },
        { value: 'конкретен проект', label: 'Конкретен проект/задача' },
        { value: 'не се однесува', label: 'Не се однесува на конкретен период' }
      ],
      helpText: 'Изберете го временскиот период за кој се доделува бонусот. Ова помага во точно документирање на основата за наградувањето.'
    },
    isRecurring: {
      name: 'isRecurring',
      type: 'checkbox',
      label: 'Редовен/повторувачки бонус',
      required: false,
      helpText: 'Означете дали овој бонус е дел од редовна политика на компанијата (пр. квартални бонуси) или е еднократен. Ова влијае на идните очекувања и обврски.'
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
      field: 'bonusType',
      type: VALIDATION_TYPES.REQUIRED_SELECT,
      label: 'Тип на бонус'
    },
    {
      field: 'bonusAmount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Износ на бонусот'
    },

    // Step 3 - Additional fields are optional
    {
      field: 'bonusReason',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Детална причина за доделување на бонусот'
    },
    {
      field: 'criteria',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Критериуми за доделување'
    },
    {
      field: 'bonusPeriod',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Период на кој се однесува бонусот'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    employeeWorkPosition: '',
    decisionDate: '',
    effectiveDate: '',
    bonusType: '',
    bonusAmount: '',
    bonusReason: '',
    criteria: '',
    bonusPeriod: '',
    isRecurring: false,
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'employeeWorkPosition', 'decisionDate', 'effectiveDate'],
    2: ['bonusType', 'bonusAmount', 'bonusReason'],
    3: ['criteria', 'bonusPeriod', 'isRecurring']
  };

  return fieldsByStep[stepId]?.map(fieldName => bonusDecisionConfig.fields[fieldName]) || [];
};

export default bonusDecisionConfig;