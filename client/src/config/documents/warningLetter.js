import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Warning Letter Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Similar to disciplinary action but WITHOUT amount and duration fields
 */
export const warningLetterConfig = {
  documentType: 'warningLetter',
  apiEndpoint: 'warning-letter',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Информации за вработениот и датум на опомената',
      requiredFields: ['employeeName', 'warningDate']
    },
    {
      id: 2,
      title: 'Причина за опомената',
      description: 'Детали за постапувањето и повредените правила',
      requiredFields: ['wrongDoingCategory', 'employeeWrongDoing', 'articleNumber']
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
      required: true
    },
    warningDate: {
      name: 'warningDate',
      type: 'date',
      label: 'Датум на опомената',
      placeholder: '',
      required: false // Will default to current date if not provided
    },

    // Step 2: Warning Details
    wrongDoingCategory: {
      name: 'wrongDoingCategory',
      type: 'select',
      label: 'Категорија на прекршок',
      required: true,
      helpText: 'Изберете ја категоријата на прекршокот што го направил работникот. Врз основа на изборот, автоматски ќе се пополни описот кој можете дополнително да го приспособите.',
      options: [
        { value: '', label: 'Избери категорија' },
        { value: 'доцнење', label: 'Доцнење на работа' },
        { value: 'отсуство', label: 'Неоправдано отсуство' },
        { value: 'работноВреме', label: 'Непочитување на работното време' },
        { value: 'неизвршување', label: 'Неизвршување на работни задачи' },
        { value: 'непрофесионално', label: 'Непрофесионално однесување' },
        { value: 'безбедност', label: 'Непочитување на безбедносни процедури' },
        { value: 'конфиденциjalност', label: 'Прекршување на конфиденциалност' },
        { value: 'дискриминација', label: 'Дискриминаторско однесување' },
        { value: 'алкохол', label: 'Појава под влијание на алкохол/дрога' },
        { value: 'имот', label: 'Злоупотреба на имот на компанијата' },
        { value: 'друго', label: 'Друго' }
      ]
    },
    employeeWrongDoing: {
      name: 'employeeWrongDoing',
      type: 'textarea',
      label: 'Детален опис на постапувањето',
      placeholder: 'Изберете категорија за автоматско пополнување...',
      rows: 4,
      required: true,
      helpText: 'Опишете го конкретното постапување на работникот. Текстот автоматски се пополнува врз основа на избраната категорија, но можете да го прилагодите.'
    },
    articleNumber: {
      name: 'articleNumber',
      type: 'text',
      label: 'Член од договорот за вработување',
      placeholder: 'пр. член 8, член 12.3',
      required: true,
      helpText: 'Внесете го бројот на членот од договорот за вработување кој е прекршен со ова постапување.'
    }
  },

  // Validation rules
  validationRules: [
    // Step 1 - Basic Information
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име и презиме на работникот'
    },

    // Step 2 - Warning Details
    {
      field: 'wrongDoingCategory',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Категорија на прекршок'
    },
    {
      field: 'employeeWrongDoing',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Детален опис на постапувањето'
    },
    {
      field: 'articleNumber',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Член од договорот за вработување'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    warningDate: '',
    wrongDoingCategory: '',
    employeeWrongDoing: '',
    articleNumber: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['employeeName', 'warningDate'],
    2: ['wrongDoingCategory', 'employeeWrongDoing', 'articleNumber']
  };

  return fieldsByStep[stepId]?.map(fieldName => warningLetterConfig.fields[fieldName]) || [];
};

// Helper function to get description based on category
export const getWrongDoingDescription = (category) => {
  const descriptions = {
    'доцнење': 'работникот честопати доцни на работа без оправдана причина, со што го нарушува редовното функционирање на работните процеси и создава несоодветна работна атмосфера',
    'отсуство': 'работникот беше отсутен од работа без претходна најава и оправдана причина, со што предизвика прекин на работните процеси и неможност за навремено извршување на работните задачи',
    'работноВреме': 'работникот не се придржува кон утврденото работно време, честопати заминува од работа пред завршување на работното време или прави неовластени паузи, со што го нарушува редовното работење',
    'неизвршување': 'работникот не ги извршува доделените работни задачи во договорениот рок или не ги извршува согласно утврдените стандарди на квалитет, со што ги загрозува работните резултати на тимот',
    'непрофесионално': 'работникот покажува непрофесионално однесување кон колегите, клиентите или деловните партнери, вклучувајќи невоспитано комуницирање, неповолно однесување или несоодветно претставување на компанијата',
    'безбедност': 'работникот не ги почитува пропишаните безбедносни процедури и мерки, со што го загрозува сопственото здравје и безбедност, како и здравјето и безбедноста на другите вработени',
    'конфиденциjalност': 'работникот ги прекршил правилата за заштита на доверливи информации со несоодветно споделување, објавување или користење на деловни или лични податоци без овластување',
    'дискриминација': 'работникот покажал дискриминаторско однесување кон колеги или клиенти врз основа на пол, возраст, национална припадност, религија или друга заштитена карактеристика',
    'алкохол': 'работникот се појавил на работа под влијание на алкохол или други опојни супстанци, со што го загрозил сопственото здравје и безбедност, како и безбедноста на другите вработени',
    'имот': 'работникот го злоупотребил имотот на компанијата за приватни цели без овластување, или предизвикал штета на опремата или материјалите на компанијата со невнимателно или небрежно постапување',
    'друго': ''
  };

  return descriptions[category] || '';
};

export default warningLetterConfig;