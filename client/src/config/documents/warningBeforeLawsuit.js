import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Warning Before Lawsuit Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Category: Other Business Documents (Други деловни документи)
 */
export const warningBeforeLawsuitConfig = {
  documentType: 'warningBeforeLawsuit',
  apiEndpoint: 'warning-before-lawsuit',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Податоци за должникот',
      description: 'Информации за лицето/компанијата што должи пари',
      requiredFields: ['debtorName', 'debtorAddress']
    },
    {
      id: 2,
      title: 'Детали за долгот',
      description: 'Основа и износ на долгот',
      requiredFields: ['debtBasis', 'totalAmountToBePaid']
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Debtor Information
    debtorName: {
      name: 'debtorName',
      type: 'text',
      label: 'Име на должникот',
      placeholder: 'пр. Компанија ДООЕЛ Скопје или Марко Петровски',
      required: true,
      helpText: 'Внесете го целото име на должникот (физичко или правно лице). Овој податок мора да одговара со официјалните документи за да биде правно валиден.'
    },
    debtorAddress: {
      name: 'debtorAddress',
      type: 'text',
      label: 'Адреса на должникот',
      placeholder: 'пр. ул. Илинденска бр. 5, Скопје',
      required: true,
      helpText: 'Внесете ја целата адреса на должникот. Оваа адреса е важна за правната валидност на опомената и евентуално дорачување на документот.'
    },

    // Step 2: Debt Details
    debtBasis: {
      name: 'debtBasis',
      type: 'select',
      label: 'Основа на долгот',
      required: true,
      options: [
        { value: '', label: 'Избери основа на долгот' },
        { value: 'фактура', label: 'Фактура' },
        { value: 'фактури', label: 'Фактури' },
        { value: 'договор', label: 'Договор' },
        { value: 'судска одлука', label: 'Судска одлука' },
        { value: 'меница', label: 'Меница' },
        { value: 'договор за заем', label: 'Договор за заем' },
        { value: 'друго', label: 'Друго правно основание' }
      ],
      helpText: 'Изберете го правното основание врз база на кое е настанат долгот. Ова е важно за поткрепување на побарувањето во случај на судска постапка.'
    },
    debtBasisOther: {
      name: 'debtBasisOther',
      type: 'text',
      label: 'Опишете го другото правно основание',
      placeholder: 'пр. Забелешка за долг, Меморандум за разбирање...',
      required: false,
      condition: (formData) => formData.debtBasis === 'друго',
      helpText: 'Наведете го конкретното правно основание на кое се заснова побарувањето доколку не е меѓу стандардните опции.'
    },
    totalAmountToBePaid: {
      name: 'totalAmountToBePaid',
      type: 'text',
      label: 'Вкупен износ на долгот (во денари)',
      placeholder: 'пр. 50.000',
      required: true,
      helpText: 'Внесете го точниот износ на долгот во денари. Форматот автоматски ќе се прилагоди со точки како хиљадници (пр. 50.000). Овој износ мора да одговара со документацијата што го докажува долгот.'
    },
    responseDeadlineDays: {
      name: 'responseDeadlineDays',
      type: 'text',
      label: 'Рок за одговор (во денови)',
      placeholder: 'пр. 8 (осум)',
      required: false,
      helpText: 'Наведете го рокот во кој должникот треба да одговори или да исплати. Стандардниот рок е 8 дена, но може да биде прилагоден според потребите. Наведете го бројот со зборови во загради (пр. 8 (осум)).'
    },
    contactInfo: {
      name: 'contactInfo',
      type: 'textarea',
      label: 'Контакт информации (опционо)',
      placeholder: 'пр. Телефон: 02/3123-456, Email: info@kompanija.mk',
      rows: 3,
      required: false,
      helpText: 'Внесете ги контакт податоците на кои должникот може да ве контактира за договарање околу плаќањето. Ова е опционо, но се препорачува за олеснување на комуникацијата.'
    }
  },

  // Validation rules
  validationRules: [
    // Step 1 - Debtor Information
    {
      field: 'debtorName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име на должникот'
    },
    {
      field: 'debtorAddress',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Адреса на должникот'
    },

    // Step 2 - Debt Details
    {
      field: 'debtBasis',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Основа на долгот'
    },
    {
      field: 'totalAmountToBePaid',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Вкупен износ на долгот'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    debtorName: '',
    debtorAddress: '',
    debtBasis: '',
    debtBasisOther: '',
    totalAmountToBePaid: '',
    responseDeadlineDays: '',
    contactInfo: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['debtorName', 'debtorAddress'],
    2: ['debtBasis', 'debtBasisOther', 'totalAmountToBePaid', 'responseDeadlineDays', 'contactInfo']
  };

  return fieldsByStep[stepId]?.map(fieldName => warningBeforeLawsuitConfig.fields[fieldName]) || [];
};

export default warningBeforeLawsuitConfig;
