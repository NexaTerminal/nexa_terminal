import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Write-off Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * For write-off of receivables or liabilities based on accounting best practices
 */
export const writeOffDecisionConfig = {
  documentType: 'writeOffDecision',
  apiEndpoint: 'write-off-decision',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци за одлуката',
      description: 'Внесете ги основните податоци за одлуката за отпис',
      requiredFields: ['writeOffType', 'responsiblePerson', 'date']
    },
    {
      id: 2,
      title: 'Ставки за отпис',
      description: 'Додадете ги ставките кои се отпишуваат',
      requiredFields: ['writeOffItems']
    }
  ],

  // Form fields configuration
  fields: {
    writeOffType: {
      name: 'writeOffType',
      type: 'radio',
      label: 'Тип на отпис',
      options: [
        { value: 'ПОБАРУВАЊА', label: 'Побарувања (ненаплатени долгови од клиенти)' },
        { value: 'ОБВРСКИ', label: 'Обврски (застарени обврски кон добавувачи)' }
      ],
      required: true,
      helpText: 'Изберете дали ги отпишувате побарувањата (ненаплатени долгови од клиенти заради очекувана ненаплативост) или обврските (застарени обврски кон добавувачи). Одлуката мора да биде темелена на позитивните законски одредби и најдобрите расположиви проценки според досегашните искуства.'
    },
    responsiblePerson: {
      name: 'responsiblePerson',
      type: 'text',
      label: 'Име на одговорно лице',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Внесете го целото име и презиме на одговорното лице (управител/директор) кое ја донесува и потпишува оваа одлука. Ова лице мора да има овластување да донесува одлуки согласно Законот за трговски друштва и внатрешните акти на компанијата.'
    },
    date: {
      name: 'date',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога се донесува одлуката за отпис. Овој датум е правно релевантен за евидентирање на отписот во сметководствената документација и мора да одговара со периодот на финансиско известување.'
    },
    city: {
      name: 'city',
      type: 'text',
      label: 'Град',
      placeholder: 'Скопје',
      required: false,
      helpText: 'Внесете го градот каде што се донесува одлуката. Ако не се внесе, автоматски ќе се користи Скопје како стандарден град на седиште на компанијата.'
    },
    writeOffItems: {
      name: 'writeOffItems',
      type: 'array',
      label: 'Ставки за отпис',
      required: true,
      minItems: 1,
      itemFields: [
        {
          name: 'partnerName',
          type: 'text',
          label: 'Име на партнер (клиент/добавувач)',
          placeholder: 'пр. Компанија ДОО Скопје',
          required: true,
          helpText: 'Внесете го целото име на деловниот партнер (клиент од кој не може да се наплати побарување или добавувач кон кого е застарена обврската). Името мора да одговара со официјалните сметководствени евиденции на компанијата.'
        },
        {
          name: 'amount',
          type: 'number',
          label: 'Износ (во денари)',
          placeholder: '50000',
          min: 0.01,
          step: 0.01,
          required: true,
          helpText: 'Внесете го точниот износ во денари што се отпишува за овој партнер. Износот мора да одговара со сметководствените евиденции и да биде поткрепен со документација за ненаплативоста (за побарувања) или застареноста (за обврски). Износот ќе се прикаже во формат: 1.000,00 денари.'
        },
        {
          name: 'accountNumber',
          type: 'text',
          label: 'Евидентирано на с-ка',
          placeholder: 'пр. 1210',
          required: true,
          helpText: 'Внесете ја сметководствената сметка (конто) на која е евидентирано побарувањето или обврската што се отпишува. Користете ги важечките контни ознаки според Сметководствениот план на компанијата (пр. 1210 за побарувања од купувачи, 4210 за обврски кон добавувачи).'
        }
      ],
      helpText: 'Додадете ја секоја ставка (побарување или обврска) што се отпишува. За секоја ставка внесете го името на партнерот, износот и сметката на која е евидентирана. Можете да додавате повеќе ставки со копчето "Додади уште една ставка". Одлуката мора да биде темелена на документирани проценки за ненаплативост или застареност.'
    }
  },

  // Validation rules
  validationRules: [
    {
      field: 'writeOffType',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Тип на отпис'
    },
    {
      field: 'responsiblePerson',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име на одговорно лице'
    },
    {
      field: 'date',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на одлуката'
    },
    {
      field: 'writeOffItems',
      type: VALIDATION_TYPES.REQUIRED_ARRAY,
      label: 'Ставки за отпис',
      minItems: 1
    }
  ],

  // Initial form data
  initialFormData: {
    writeOffType: 'ПОБАРУВАЊА',
    responsiblePerson: '',
    date: '',
    city: 'Скопје',
    writeOffItems: [
      {
        partnerName: '',
        amount: '',
        accountNumber: ''
      }
    ],
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['writeOffType', 'responsiblePerson', 'date', 'city'],
    2: ['writeOffItems']
  };

  return fieldsByStep[stepId]?.map(fieldName => writeOffDecisionConfig.fields[fieldName]) || [];
};

export default writeOffDecisionConfig;
