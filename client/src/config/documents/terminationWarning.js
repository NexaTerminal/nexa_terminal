import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Violation Categories - unified options that fill both fields
 */
export const violationCategoryOptions = [
  { value: '', label: 'Изберете категорија...' },
  { value: 'deadlines', label: 'Непочитување на рокови' },
  { value: 'attendance', label: 'Присуство и работно време' },
  { value: 'quality', label: 'Квалитет на работа' },
  { value: 'communication', label: 'Комуникација и соработка' },
  { value: 'safety', label: 'Безбедност при работа' },
  { value: 'confidentiality', label: 'Доверливост на информации' },
  { value: 'conduct', label: 'Професионално однесување' },
  { value: 'insubordination', label: 'Непочитување на претпоставени' },
  { value: 'other', label: 'Друго' }
];

/**
 * Get both descriptions for a violation category
 * Returns { obligation, wrongdoing } - fills both textareas
 */
export const getViolationDescriptions = (category) => {
  const descriptions = {
    'deadlines': {
      obligation: 'навремено завршување на доделените работни задачи и проекти согласно утврдените рокови и приоритети определени од претпоставениот',
      wrongdoing: 'континуирано доцнење со извршување на доделените работни задачи, пречекорување на утврдените рокови без навремено известување на претпоставениот'
    },
    'attendance': {
      obligation: 'редовно присуство на работа и почитување на утврденото работно време согласно договорот за вработување и интерните правила',
      wrongdoing: 'повторено доцнење на работа и/или неоправдано отсуство од работа без претходно одобрение, непочитување на утврденото работно време'
    },
    'quality': {
      obligation: 'извршување на работните задачи со потребното ниво на квалитет, точност и професионалност согласно стандардите на компанијата',
      wrongdoing: 'извршување на работните задачи со незадоволително ниво на квалитет, грешки кои влијаат на работата на тимот или компанијата'
    },
    'communication': {
      obligation: 'редовна и навремена комуникација со претпоставените и колегите, како и тимска соработка при извршување на работните задачи',
      wrongdoing: 'недостаток на комуникација со претпоставените и колегите, неодговарање на пораки и барања, неинформирање за статусот на задачите'
    },
    'safety': {
      obligation: 'почитување на правилата и процедурите за безбедност и здравје при работа утврдени со интерните акти на компанијата',
      wrongdoing: 'непочитување на правилата за безбедност при работа, изложување на себе или колегите на ризик'
    },
    'confidentiality': {
      obligation: 'чување на деловните тајни и доверливите информации на компанијата согласно договорот за вработување и политиката за доверливост',
      wrongdoing: 'неовластено споделување на доверливи информации, прекршување на политиката за заштита на податоци'
    },
    'conduct': {
      obligation: 'професионално и етичко однесување на работното место согласно кодексот на однесување и интерните правила на компанијата',
      wrongdoing: 'непрофесионално однесување кон колегите, создавање конфликтни ситуации, нарушување на работната атмосфера'
    },
    'insubordination': {
      obligation: 'почитување и извршување на упатствата и наредбите дадени од претпоставените во врска со работните задачи',
      wrongdoing: 'одбивање да се постапи по упатствата на претпоставениот, непочитување на хиерархијата и процедурите'
    },
    'other': {
      obligation: '',
      wrongdoing: ''
    }
  };
  return descriptions[category] || { obligation: '', wrongdoing: '' };
};

/**
 * Termination Warning Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const terminationWarningConfig = {
  documentType: 'terminationWarning',
  apiEndpoint: 'termination-warning',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Податоци за работникот',
      description: 'Внесете ги основните податоци за работникот',
      requiredFields: ['employeeName', 'jobPosition']
    },
    {
      id: 2,
      title: 'Детали за прекршокот',
      description: 'Изберете категорија за автоматско пополнување или внесете рачно',
      requiredFields: ['violationCategory', 'workTaskFailure', 'employeeWrongDoing']
    },
    {
      id: 3,
      title: 'Временски рамка',
      description: 'Определете ги важните датуми за предупредувањето',
      requiredFields: ['decisionDate', 'fixingDeadline']
    }
  ],

  // Form fields configuration
  fields: {
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: true
    },
    jobPosition: {
      name: 'jobPosition',
      type: 'text',
      label: 'Работна позиција',
      placeholder: 'пр. Софтверски инженер',
      required: true
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: '',
      required: true,
      max: new Date().toISOString().split('T')[0], // Cannot be in the future
      helpText: 'Датумот кога е донесена одлуката за издавање предупредување'
    },
    violationCategory: {
      name: 'violationCategory',
      type: 'select',
      label: 'Категорија на прекршок',
      required: false,
      options: violationCategoryOptions,
      helpText: 'Изберете категорија за автоматско пополнување на двете полиња подолу'
    },
    workTaskFailure: {
      name: 'workTaskFailure',
      type: 'textarea',
      label: 'Обврска која работникот не ја исполнил',
      placeholder: 'пр. Навремено завршување на доделените проекти согласно утврдените рокови',
      required: true,
      rows: 3,
      maxLength: 500,
      helpText: 'Опишете ја обврската или изберете категорија од горе'
    },
    employeeWrongDoing: {
      name: 'employeeWrongDoing',
      type: 'textarea',
      label: 'Постапување спротивно на обврската',
      placeholder: 'пр. Доцнење со извршување на задачите, недостаток на комуникација со тимот',
      required: true,
      rows: 4,
      maxLength: 800,
      helpText: 'Опишете го прекршокот или изберете категорија од горе'
    },
    fixingDeadline: {
      name: 'fixingDeadline',
      type: 'date',
      label: 'Рок за исправка на однесувањето',
      placeholder: '',
      required: true,
      minDaysAfter: { field: 'decisionDate', days: 15 }, // Dynamic: at least 15 days after decisionDate
      helpText: 'Минимум 15 дена по датумот на одлуката (законски рок)'
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
      field: 'workTaskFailure',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Обврска која работникот не ја исполнил'
    },
    {
      field: 'workTaskFailure',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Обврска која работникот не ја исполнил',
      value: 10
    },
    {
      field: 'employeeWrongDoing',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Постапување спротивно на обврската'
    },
    {
      field: 'employeeWrongDoing',
      type: VALIDATION_TYPES.MIN_LENGTH,
      label: 'Постапување спротивно на обврската',
      value: 15
    },
    {
      field: 'fixingDeadline',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Рок за исправка на однесувањето'
    },
    {
      field: 'fixingDeadline',
      type: VALIDATION_TYPES.DATE,
      label: 'Рок за исправка на однесувањето'
    },
    {
      field: 'fixingDeadline',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Рок за исправка на однесувањето',
      validator: (value, formData) => {
        if (!value || !formData.decisionDate) return true;
        const decisionDate = new Date(formData.decisionDate);
        const fixingDate = new Date(value);
        const minDate = new Date(decisionDate);
        minDate.setDate(minDate.getDate() + 15);
        if (fixingDate < minDate) {
          return 'Рокот за исправка мора да биде минимум 15 дена по датумот на одлуката (законски рок)';
        }
        return true;
      }
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    jobPosition: '',
    decisionDate: '',
    violationCategory: '',
    workTaskFailure: '',
    employeeWrongDoing: '',
    fixingDeadline: '',
    acceptTerms: false
  }
};

export default terminationWarningConfig;