import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Disciplinary Action Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const disciplinaryActionConfig = {
  documentType: 'disciplinaryAction',
  apiEndpoint: 'disciplinary-action',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот',
      requiredFields: ['employeeName', 'jobPosition']
    },
    {
      id: 2,
      title: 'Детали за казната',
      description: 'Висина и период на дисциплинската мерка',
      requiredFields: ['sanctionAmount', 'sanctionPeriod', 'sanctionDate']
    },
    {
      id: 3,
      title: 'Причина за казната',
      description: 'Опис на прекршокот и постапувањето',
      requiredFields: ['workTaskFailure', 'employeeWrongDoing', 'employeeWrongdoingDate']
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Information
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Внесете го целосното име и презиме на работникот на кој му се изрекува дисциплинската мерка како што е наведено во личните документи и договорот за вработување.'
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: true,
      helpText: 'Наведете ја точната работна позиција (назив на работно место) на работникот според договорот за вработување.'
    },

    // Step 2: Sanction Details
    sanctionAmount: {
      name: 'sanctionAmount',
      type: 'select',
      label: 'Висина на казната (% од нето плата)',
      required: true,
      options: [
        { value: '', label: 'Изберете висина на казната' },
        { value: '5', label: '5%' },
        { value: '10', label: '10%' },
        { value: '15', label: '15%' }
      ],
      helpText: 'Изберете ја висината на казната како процент од месечната нето плата на работникот. Овој износ ќе биде одбиен од платата за одреден период.'
    },
    sanctionPeriod: {
      name: 'sanctionPeriod',
      type: 'select',
      label: 'Период на казната (месеци)',
      required: true,
      options: [
        { value: '', label: 'Изберете период' },
        { value: '1', label: '1 месец' },
        { value: '2', label: '2 месеци' },
        { value: '3', label: '3 месеци' },
        { value: '4', label: '4 месеци' },
        { value: '5', label: '5 месеци' },
        { value: '6', label: '6 месеци' }
      ],
      helpText: 'Изберете за колку месеци ќе трае дисциплинската мерка и одбивањето од платата. Периодот зависи од тежината на прекршокот.'
    },
    sanctionDate: {
      name: 'sanctionDate',
      type: 'date',
      label: 'Датум на изрекување на казната',
      placeholder: '',
      required: false, // Will default to current date if not provided
      helpText: 'Изберете го датумот кога се донесува решението за дисциплинска мерка. Ако не се внесе, автоматски ќе се користи денешниот датум.'
    },

    // Step 3: Violation Details
    workTaskFailure: {
      name: 'workTaskFailure',
      type: 'textarea',
      label: 'Работна обврска која работникот ја запоставил',
      placeholder: 'пр. Навремено доаѓање на работно место',
      rows: 3,
      required: true,
      helpText: 'Опишете ја конкретната работна обврска што работникот не ја исполнил во соодветност со договорот, правилниците за работа или подзаконските акти.'
    },
    employeeWrongDoing: {
      name: 'employeeWrongDoing',
      type: 'textarea',
      label: 'Постапување на работникот спротивно на обврската',
      placeholder: 'пр. Доцнење на работа без оправдана причина',
      rows: 3,
      required: true,
      helpText: 'Опишете го конкретното постапување на работникот што го довело до повреда на работната обврска. Бидете прецизни и објективни во описот.'
    },
    employeeWrongdoingDate: {
      name: 'employeeWrongdoingDate',
      type: 'date',
      label: 'Датум на постапувањето спротивно на обврската',
      placeholder: '',
      required: true,
      helpText: 'Изберете го точниот датум кога се случил прекршокот или неисполнувањето на работната обврска. Овој датум е важен за утврдување на временската рамка на прекршокот.'
    }
  },

  // Validation rules
  validationRules: [
    // Step 1 - Basic Information
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име и презиме на работnikот'
    },
    {
      field: 'jobPosition',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Работна позиција'
    },

    // Step 2 - Sanction Details
    {
      field: 'sanctionAmount',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Висина на казната'
    },
    {
      field: 'sanctionPeriod',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Период на казната'
    },

    // Step 3 - Violation Details
    {
      field: 'workTaskFailure',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Работна обврска која е запостави.'
    },
    {
      field: 'employeeWrongDoing',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Постапување спротивно на обврската'
    },
    {
      field: 'employeeWrongdoingDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на постапувањето'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    jobPosition: '',
    sanctionAmount: '',
    sanctionPeriod: '',
    sanctionDate: '',
    workTaskFailure: '',
    employeeWrongDoing: '',
    employeeWrongdoingDate: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'jobPosition'],
    2: ['sanctionAmount', 'sanctionPeriod', 'sanctionDate'],
    3: ['workTaskFailure', 'employeeWrongDoing', 'employeeWrongdoingDate']
  };

  return fieldsByStep[stepId]?.map(fieldName => disciplinaryActionConfig.fields[fieldName]) || [];
};

export default disciplinaryActionConfig;