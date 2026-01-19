import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Mandatory Bonus Document Configuration
 * Generates multi-document system for annual leave bonus with reduced amount
 * Creates 4 documents: Decision, Minutes, Agreement, Union Consultation
 * All documents are generated in one file with page breaks
 */
export const mandatoryBonusConfig = {
  documentType: 'mandatoryBonus',
  apiEndpoint: 'mandatory-bonus',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни информации',
      description: 'Внесете ги основните податоци за одлуката за регрес за годишен одмор',
      requiredFields: ['decisionDate', 'year', 'amount']
    },
    {
      id: 2,
      title: 'Претставници',
      description: 'Определете го претставникот на вработените за преговори',
      requiredFields: ['employeesRepresentative']
    },
    {
      id: 3,
      title: 'Информации за синдикат',
      description: 'Изберете го синдикатот на гранка за консултација',
      requiredFields: ['employeeUnion']
    }
  ],

  // Form fields configuration with comprehensive legal compliance guidance
  fields: {
    // Step 1: Basic Information
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: 'Изберете датум',
      required: true,
      helpText: 'Датумот кога се донесува одлуката за исплата на регрес за годишен одмор. Овој датум ќе се користи во сите четири документи.'
    },
    year: {
      name: 'year',
      type: 'text',
      label: 'Година за која се исплаќа регресот',
      // placeholder: 'пр. 2026',
      placeholder: '2026',
      value: '2026',
      required: true,
      maxLength: 4,
      pattern: /^\d{4}$/,
      inputMode: 'numeric',
      helpText: 'Календарската година за која се исплаќа регресот за годишен одмор. Мора да биде во формат YYYY (пример: 2024).'
    },
    amount: {
      name: 'amount',
      type: 'number',
      label: 'Износ на регресот (во денари)',
      placeholder: '22000',
      required: true,
      min: 1,
      helpText: 'Износот на регресот по вработен во денари. Стандардниот износ е 3000 денари, но може да биде намален поради финансиски потешкотии.'
    },

    // Step 2: Representative Information
    employeesRepresentative: {
      name: 'employeesRepresentative',
      type: 'text',
      label: 'Претставник на вработените',
      placeholder: 'Име и презиме на претставникот',
      required: true,
      helpText: 'Лицето избрано од вработените за преговори и потпишување спогодба со работодавачот за висината на регресот за годишен одмор.'
    },

    // Step 3: Union Information
    employeeUnion: {
      name: 'employeeUnion',
      type: 'select',
      label: 'Избери синдикат',
      required: true,
      options: [
        { value: '', label: 'Изберете синдикат' },
        { 
          value: 'СИНДИКАТ ЗА ПРИВАТНИОТ, АДМИНИСТРАТИВНИОТ И ЈАВНИОТ СЕКТОР НА МАКЕДОНИЈА|ул. „Андреја Петковиќ" бр.16, Скопје', 
          label: 'СИНДИКАТ ЗА ПРИВАТНИОТ, АДМИНИСТРАТИВНИОТ И ЈАВНИОТ СЕКТОР НА МАКЕДОНИЈА (Препорачано)' 
        },
        { 
          value: 'СИНДИКАТОТ НА ИНДУСТРИЈА, ЕНЕРГЕТИКА И РУДАРСТВО НА МАКЕДОНИЈА (скратен назив СИЕР)|Ул. „12. Ударна бригада" бр. 2а, Скопје', 
          label: 'СИНДИКАТОТ НА ИНДУСТРИЈА, ЕНЕРГЕТИКА И РУДАРСТВО НА МАКЕДОНИЈА (СИЕР)' 
        },
        { 
          value: 'САМОСТОЕН СИНДИКАТ НА РАБОТНИЦИТЕ ОД ЕНЕРГЕТИКА И СТОПАНСТВОТО НА МАКЕДОНИЈА (скратен назив ССЕСМ)|Ул. „Никола Парапунов" бр. 33, 1000 Скопје', 
          label: 'САМОСТОЕН СИНДИКАТ НА РАБОТНИЦИТЕ ОД ЕНЕРГЕТИКА И СТОПАНСТВОТО НА МАКЕДОНИЈА (ССЕСМ)' 
        },
        { 
          value: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД ТРГОВИЈАТА НА МАКЕДОНИЈА|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД ТРГОВИЈАТА НА МАКЕДОНИЈА' 
        },
        { 
          value: 'СИНДИКАТ ЗА ГРАДЕЖНИШТВО, ИНДУСТРИЈА И ПРОЕКТИРАЊЕ НА РЕПУБЛИКА МАКЕДОНИЈА (СГИП)|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'СИНДИКАТ ЗА ГРАДЕЖНИШТВО, ИНДУСТРИЈА И ПРОЕКТИРАЊЕ НА РЕПУБЛИКА МАКЕДОНИЈА (СГИП)' 
        },
        { 
          value: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД СООБРАЌАЈОТ И ВРСКИТЕ НА РЕПУБЛИКА МАКЕДОНИЈА (скратен назив СРСВМ)|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД СООБРАЌАЈОТ И ВРСКИТЕ НА РЕПУБЛИКА МАКЕДОНИЈА (СРСВМ)' 
        },
        { 
          value: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД ТЕКСТИЛНАТА, КОЖАРСКАТА И ЧЕВЛАРСКАТА ИНДУСТРИЈА НА РЕПУБЛИКА МАКЕДОНИЈА (скратен назив СТКЧ)|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД ТЕКСТИЛНАТА, КОЖАРСКАТА И ЧЕВЛАРСКАТА ИНДУСТРИЈА НА РЕПУБЛИКА МАКЕДОНИЈА (СТКЧ)' 
        },
        { 
          value: 'САМОСТОЕН СИНДИКАТ ЗА ЗДРАВСТВО, ФАРМАЦИЈА И СОЦИЈАЛНА ЗАШТИТА НА РЕПУБЛИКА МАКЕДОНИЈА|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'САМОСТОЕН СИНДИКАТ ЗА ЗДРАВСТВО, ФАРМАЦИЈА И СОЦИЈАЛНА ЗАШТИТА НА РЕПУБЛИКА МАКЕДОНИЈА' 
        },
        { 
          value: 'СИНДИКАТ НА ГРАФИЧКА, ИНФОРМАТИВНА, ФИЛМСКА, ИЗДАВАЧКА ДЕЈНОСТ И ПРОИЗВОДСТВО НА ХАРТИЈА НА РЕПУБЛИКА МАКЕДОНИЈА (скратен назив ГИФИХ)|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'СИНДИКАТ НА ГРАФИЧКА, ИНФОРМАТИВНА, ФИЛМСКА, ИЗДАВАЧКА ДЕЈНОСТ И ПРОИЗВОДСТВО НА ХАРТИЈА НА РЕПУБЛИКА МАКЕДОНИЈА (ГИФИХ)' 
        },
        { 
          value: 'МАКЕДОНСКИ ПОЛИЦИСКИ СИНДИКАТ (скратен назив МПС)|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'МАКЕДОНСКИ ПОЛИЦИСКИ СИНДИКАТ (МПС)' 
        },
        { 
          value: 'САМОСТОЕН СИНДИКАТ НА ВРАБОТЕНИТЕ ВО УНИВЕРЗИТЕТСКИТЕ КЛИНИКИ,ЦЕНТРИ,КЛИНИЧКИ БОЛНИЦИ И ДРУГИ ЈАВНИ ЗДРАВСТВЕНИ УСТАНОВИ ВО РЕПУБЛИКА МАКЕДОНИЈА|ул. "Мајка Тереза" бр. 17, 1000 Скопје', 
          label: 'САМОСТОЕН СИНДИКАТ НА ВРАБОТЕНИТЕ ВО УНИВЕРЗИТЕТСКИТЕ КЛИНИКИ,ЦЕНТРИ,КЛИНИЧКИ БОЛНИЦИ И ДРУГИ ЈАВНИ ЗДРАВСТВЕНИ УСТАНОВИ ВО РЕПУБЛИКА МАКЕДОНИЈА' 
        },
        { 
          value: 'СИНДИКАТ НА ХЕМИЈА, НЕМЕТАЛИ И МЕТАЛИ НА МАКЕДОНИЈА (скратен назив СХНМ)|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'СИНДИКАТ НА ХЕМИЈА, НЕМЕТАЛИ И МЕТАЛИ НА МАКЕДОНИЈА (СХНМ)' 
        },
        { 
          value: 'УНИЈА НА НЕЗАВИСНИ И АВТОНОМНИ СИНДИКАТИ НА МАКЕДОНИЈА (скратен назив УНАСМ)|ул. "Васил Ѓоргов" бр.39, 1000 Скопје', 
          label: 'УНИЈА НА НЕЗАВИСНИ И АВТОНОМНИ СИНДИКАТИ НА МАКЕДОНИЈА (УНАСМ)' 
        },
        { 
          value: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД АГРОИНДУСТРИСКИОТ КОМПЛЕКС НА РЕПУБЛИКА МАКЕДОНИЈА (скратен назив АГРО СИНДИКАТ)|ул. Кеј 13 Ноември", ГТЦ, прв кат, 0380 локал, Скопје', 
          label: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД АГРОИНДУСТРИСКИОТ КОМПЛЕКС НА РЕПУБЛИКА МАКЕДОНИЈА (АГРО СИНДИКАТ)' 
        },
        { 
          value: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД УГОСТИТЕЛСТВОТО,ТУРИЗМОТ, КОМУНАЛНО-СТАНБЕНОТО СТОПАНСТВО, ЗАНАЕТЧИСТВОТО И ЗАШТИТНИТЕ ДРУШТВА НА РЕПУБЛИКА МАКЕДОНИЈА (скратен назив СУТКОЗ)|Ул. „12 Ударна бригада" бр. 2а, Скопје', 
          label: 'СИНДИКАТ НА РАБОТНИЦИТЕ ОД УГОСТИТЕЛСТВОТО,ТУРИЗМОТ, КОМУНАЛНО-СТАНБЕНОТО СТОПАНСТВО, ЗАНАЕТЧИСТВОТО И ЗАШТИТНИТЕ ДРУШТВА НА РЕПУБЛИКА МАКЕДОНИЈА (СУТКОЗ)' 
        },
        { 
          value: 'МУЛТИЕТНИЧКИ СИНДИКАТ НА ОБРАЗОВАНИЕ НА МАКЕДОНИЈА (скратен назив МЕСО)|Ул. Неготинска бр.20, Скопје', 
          label: 'МУЛТИЕТНИЧКИ СИНДИКАТ НА ОБРАЗОВАНИЕ НА МАКЕДОНИЈА (МЕСО)' 
        }
      ],
      helpText: 'Изберете го соодветниот синдикат на гранка со кој треба да се направи консултација согласно колективниот договор.'
    }
  },

  // Validation rules with legal compliance focus
  validationRules: [
    // Step 1 - Basic Information
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.REQUIRED_DATE,
      label: 'Датум на одлуката',
      message: 'Датумот на одлуката е задолжителен за правна валидност'
    },
    {
      field: 'year',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Година за која се исплаќа регресот',
      message: 'Годината мора да биде во формат YYYY (пр. 2026)',
      customValidation: (value) => {
        if (!value) return 'Годината е задолжителна';
        if (!/^\d{4}$/.test(value)) return 'Годината мора да биде во формат YYYY (пр. 2026)';
        return null;
      }
    },
    {
      field: 'amount',
      type: VALIDATION_TYPES.REQUIRED_NUMBER,
      label: 'Износ на регресот',
      message: 'Износот на регресот мора да биде позитивен број',
      customValidation: (value) => {
        if (!value) return 'Износот на регресот е задолжителен';
        if (parseFloat(value) <= 0) return 'Износот мора да биде позитивен број';
        return null;
      }
    },

    // Step 2 - Representative
    {
      field: 'employeesRepresentative',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Претставник на вработените',
      message: 'Претставникот на вработените е задолжителен за правна валидност'
    },

    // Step 3 - Union Information
    {
      field: 'employeeUnion',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Избери синдикат',
      message: 'Изборот на синдикат е задолжителен за консултација'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    decisionDate: '',
    year: '',
    amount: '',
    employeesRepresentative: '',
    employeeUnion: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['decisionDate', 'year', 'amount'],
    2: ['employeesRepresentative'],
    3: ['employeeUnion']
  };

  return fieldsByStep[stepId]?.map(fieldName => mandatoryBonusConfig.fields[fieldName]) || [];
};

export default mandatoryBonusConfig;