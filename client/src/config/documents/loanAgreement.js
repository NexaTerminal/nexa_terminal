import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Loan Agreement Document Configuration (Договор за заем)
 * Based on Macedonian Law Articles 545-554 (Loan Agreement)
 * This configuration drives the entire form behavior, validation, and API integration
 */

export const loanAgreementConfig = {
  documentType: 'loanAgreement',
  apiEndpoint: 'loan-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration (3 steps)
  steps: [
    {
      id: 1,
      title: 'Основни информации за заемот',
      description: 'Износ, тип на заем и камата',
      requiredFields: ['loanAmount', 'loanType', 'hasInterest', 'contractDate', 'userRole']
    },
    {
      id: 2,
      title: 'Услови за враќање',
      description: 'Начин на враќање и банкарски детали',
      requiredFields: ['repaymentType', 'borrowerBankAccount', 'borrowerBank']
    },
    {
      id: 3,
      title: 'Дополнителни услови',
      description: 'Предвремено враќање и завршни одредби',
      requiredFields: []
    }
  ],

  // Form fields configuration
  fields: {
    // STEP 1: Basic Loan Information
    contractDate: {
      name: 'contractDate',
      type: 'date',
      label: 'Датум на склучување на договорот',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога се склучува договорот за заем. Овој датум е почеток на договорниот однос и рокови за исплата и враќање на заемот согласно Член 545 од ЗОО.'
    },

    contractLocation: {
      name: 'contractLocation',
      type: 'hidden',
      label: 'Место на склучување',
      placeholder: 'пр. Скопје',
      required: false,
      helpText: 'Внесете го градот каде што се склучува договорот за заем. Местото е релевантно за определување на надлежен суд во случај на спорови.'
    },

    userRole: {
      name: 'userRole',
      type: 'select',
      label: 'Вашата компанија е',
      placeholder: 'Изберете улога',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'давател', label: 'Давател на заемот (Lender)' },
        { value: 'примател', label: 'Примател на заемот (Borrower)' }
      ],
      helpText: 'Изберете дали вашата компанија го дава заемот или го примa заемот. Оваа улога определува кои податоци за другата страна треба да ги внесете и кои права и обврски ги имате согласно Членови 545-554 од ЗОО.'
    },

    loanAmount: {
      name: 'loanAmount',
      type: 'number',
      label: 'Износ на заем (денари)',
      placeholder: '100000',
      min: 1,
      step: 1,
      required: true,
      helpText: 'Внесете го износот на паричниот заем во денари согласно Член 545 од ЗОО. Ова е главницата која примателот мора да ја врати, без камата (доколку има договорена камата).'
    },

    loanType: {
      name: 'loanType',
      type: 'select',
      label: 'Тип на заем',
      placeholder: 'Изберете тип на заем',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'general', label: 'Општ заем (може да се користи за било која намена)' },
        { value: 'business', label: 'Деловен заем (за деловни цели на компанијата)' },
        { value: 'purpose-specific', label: 'Наменски заем (само за договорена специфична намена)' }
      ],
      helpText: 'Изберете го типот на заем. Наменскиот заем (Член 554 од ЗОО) е ограничен само за договорената намена и примателот не смее да ги користи средствата за други цели.'
    },

    loanPurpose: {
      name: 'loanPurpose',
      type: 'textarea',
      label: 'Намена на заемот (за наменски заем)',
      placeholder: 'пр. Заемот е наменет за набавка на основни средства, опрема и материјали потребни за непречено функционирање на дејноста на примателот.',
      rows: 4,
      maxLength: 1500,
      required: false,
      condition: (formData) => formData.loanType === 'purpose-specific',
      helpText: 'Прецизно опишете ја намената на заемот согласно Член 554 од ЗОО. Примателот е должен средствата да ги користи само за оваа договорена намена, инаку давателот има право да бара итно враќање на заемот.'
    },

    hasInterest: {
      name: 'hasInterest',
      type: 'select',
      label: 'Дали заемот носи камата?',
      placeholder: 'Изберете',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'yes', label: 'Да, со камата' },
        { value: 'no', label: 'Не, безкаматен заем' }
      ],
      helpText: 'Изберете дали на заемот се пресметува камата согласно Член 546 од ЗОО. Доколку не е договорена камата, заемот е безкаматен и примателот враќа само главницата.'
    },

    interestRate: {
      name: 'interestRate',
      type: 'number',
      label: 'Годишна каматна стапка (%)',
      placeholder: '5.5',
      min: 0.1,
      max: 30,
      step: 0.1,
      required: false,
      condition: (formData) => formData.hasInterest === 'yes',
      helpText: 'Внесете ја годишната каматна стапка во проценти согласно Член 546 од ЗОО. Каматата се пресметува од денот на исплатата до денот на враќањето на заемот. Стапката мора да биде разумна и во согласност со пазарните услови.'
    },

    // STEP 1: Other Party Information
    borrowerName: {
      name: 'borrowerName',
      type: 'text',
      label: 'Име на примателот на заемот',
      placeholder: 'пр. ДОО Бизнис Скопје',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го целото правно име на компанијата-примател која го прима заемот, точно како што е запишано во Централниот регистар на Република Северна Македонија.'
    },

    borrowerAddress: {
      name: 'borrowerAddress',
      type: 'text',
      label: 'Адреса на седиште на примателот',
      placeholder: 'пр. Даме Груев 12, Скопје 1000',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете ја целата адреса на седиштето на примателот (улица, број, град, поштенски број) според податоците од Централниот регистар.'
    },

    borrowerTaxNumber: {
      name: 'borrowerTaxNumber',
      type: 'text',
      label: 'Даночен број на примателот',
      placeholder: 'пр. 4030123456789',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го единствениот даночен број на примателот (ЕДБ за правни лица) според податоците од Централниот регистар или од веб страната на www.ujp.gov.mk.'
    },

    borrowerManager: {
      name: 'borrowerManager',
      type: 'text',
      label: 'Управител/директор на примателот',
      placeholder: 'пр. Петар Петровски',
      required: false,
      condition: (formData) => formData.userRole === 'давател',
      helpText: 'Внесете го целото име и презиме на лицето овластено да ја претставува компанијата-примател (обично управител или извршен директор) според Решението за запишување во Централниот регистар.'
    },

    lenderName: {
      name: 'lenderName',
      type: 'text',
      label: 'Име на давателот на заемот',
      placeholder: 'пр. ДОО Финансии Скопје',
      required: false,
      condition: (formData) => formData.userRole === 'примател',
      helpText: 'Внесете го целото правно име на компанијата која го дава заемот, точно како што е запишано во Централниот регистар на Република Северна Македонија.'
    },

    lenderAddress: {
      name: 'lenderAddress',
      type: 'text',
      label: 'Адреса на седиште на давателот',
      placeholder: 'пр. Партизанска 25, Скопје 1000',
      required: false,
      condition: (formData) => formData.userRole === 'примател',
      helpText: 'Внесете ја целата адреса на седиштето на давателот на заем (улица, број, град, поштенски број) според податоците од Централниот регистар.'
    },

    lenderTaxNumber: {
      name: 'lenderTaxNumber',
      type: 'text',
      label: 'Даночен број на давателот',
      placeholder: 'пр. 4030987654321',
      required: false,
      condition: (formData) => formData.userRole === 'примател',
      helpText: 'Внесете го единствениот даночен број на давателот на заем (ЕМБС за правни лица) според податоците од Централниот регистар или деловниот извод.'
    },

    lenderManager: {
      name: 'lenderManager',
      type: 'text',
      label: 'Управител/директор на давателот',
      placeholder: 'пр. Ана Ивановска',
      required: false,
      condition: (formData) => formData.userRole === 'примател',
      helpText: 'Внесете го целото име и презиме на лицето овластено да ја претставува компанијата-давател на заем (обично управител или извршен директор) според Решението за запишување во Централниот регистар.'
    },

    // STEP 2: Repayment Terms
    repaymentType: {
      name: 'repaymentType',
      type: 'select',
      label: 'Начин на враќање на заемот',
      placeholder: 'Изберете начин на враќање',
      required: true,
      options: [
        { value: '', label: 'Избери' },
        { value: 'single', label: 'Еднократно враќање (цел износ одеднаш)' },
        { value: 'installments', label: 'Враќање на рати (повеќе месечни/квартални плаќања)' }
      ],
      helpText: 'Изберете го начинот на враќање на заемот согласно Член 550 од ЗОО. Еднократно враќање значи целиот износ се враќа на еден датум, додека ратно враќање го распределува износот на повеќе периодични плаќања.'
    },

    repaymentDeadline: {
      name: 'repaymentDeadline',
      type: 'date',
      label: 'Рок за враќање на заемот',
      placeholder: '',
      required: false,
      condition: (formData) => formData.repaymentType === 'single',
      helpText: 'Внесете го крајниот датум до кога примателот мора да го врати целиот износ на заемот согласно Член 550 од ЗОО. Задоцнетото враќање може да резултира со казнена камата и правото на давателот да бара обештетување.'
    },

    numberOfInstallments: {
      name: 'numberOfInstallments',
      type: 'number',
      label: 'Број на рати',
      placeholder: '12',
      min: 2,
      max: 120,
      step: 1,
      required: false,
      condition: (formData) => formData.repaymentType === 'installments',
      helpText: 'Внесете го бројот на рати на кои заемот ќе се враќа (минимум 2, максимум 120). Секоја рата опфаќа дел од главницата и каматата (доколку е договорена камата).'
    },

    firstPaymentDate: {
      name: 'firstPaymentDate',
      type: 'date',
      label: 'Датум на прва рата',
      placeholder: '',
      required: false,
      condition: (formData) => formData.repaymentType === 'installments',
      helpText: 'Внесете го датумот кога доспева првата рата. Следните рати доспеваат според договорената фреквенција (месечно, квартално или годишно) сметајќи од овој датум.'
    },

    paymentFrequency: {
      name: 'paymentFrequency',
      type: 'select',
      label: 'Фреквенција на плаќање на ратите',
      placeholder: 'Изберете фреквенција',
      required: false,
      condition: (formData) => formData.repaymentType === 'installments',
      options: [
        { value: '', label: 'Избери' },
        { value: 'monthly', label: 'Месечно (12 рати годишно)' },
        { value: 'quarterly', label: 'Квартално (4 рати годишно)' },
        { value: 'annually', label: 'Годишно (еднаш годишно)' }
      ],
      helpText: 'Изберете колку често се плаќаат ратите. Месечно е најчеста фреквенција за деловни заеми. Фреквенцијата започнува од датумот на првата рата.'
    },

    borrowerBankAccount: {
      name: 'borrowerBankAccount',
      type: 'text',
      label: 'Трансакциска сметка на примателот',
      placeholder: 'пр. 200000012345678',
      required: true,
      helpText: 'Внесете го бројот на жиро-сметка на примателот каде што давателот ќе го исплати износот на заемот согласно Член 547 од ЗОО (обврска на давателот да го стави износот на располагање). Проверете дека бројот е точен и активен.'
    },

    borrowerBank: {
      name: 'borrowerBank',
      type: 'select',
      label: 'Банка депонент на примателот',
      placeholder: 'Изберете банка',
      required: true,
      options: [
        { value: '', label: 'Избери банка' },
        { value: 'Комерцијална банка АД Скопје', label: 'Комерцијална банка АД Скопје' },
        { value: 'Стопанска банка АД Скопје', label: 'Стопанска банка АД Скопје' },
        { value: 'НЛБ банка АД Скопје', label: 'НЛБ банка АД Скопје' },
        { value: 'Халк банка АД Скопје', label: 'Халк банка АД Скопје' },
        { value: 'Шпаркасе банка АД Скопје', label: 'Шпаркасе банка АД Скопје' },
        { value: 'ПроKредит банка АД Скопје', label: 'ПроKредит банка АД Скопје' },
        { value: 'Универзална инвестициона банка АД Скопје', label: 'Универзална инвестициона банка АД Скопје' },
        { value: 'Централна кооперативна банка АД Скопје', label: 'Централна кооперативна банка АД Скопје' },
        { value: 'АЛТА банка АД Битола', label: 'АЛТА банка АД Битола' },
        { value: 'ТТК банка АД Скопје', label: 'ТТК банка АД Скопје' },
        { value: 'Силк Роуд Банка АД Скопје', label: 'Силк Роуд Банка АД Скопје' },
        { value: 'Капитал банка АД Скопје', label: 'Капитал банка АД Скопје' },
        { value: 'Развојна банка на Северна Македонија АД Скопје', label: 'Развојна банка на Северна Македонија АД Скопје' }
      ],
      helpText: 'Изберете ја банката каде што е отворена трансакциската сметка на примателот на заемот. Користете го точното правно име на банката.'
    },

    // STEP 3: Additional Terms
    earlyRepayment: {
      name: 'earlyRepayment',
      type: 'select',
      label: 'Дозволено предвремено враќање?',
      placeholder: 'Изберете',
      required: false,
      options: [
        { value: '', label: 'Избери' },
        { value: 'yes', label: 'Да, дозволено е предвремено враќање' },
        { value: 'no', label: 'Не, заемот мора да се врати според договорениот распоред' }
      ],
      helpText: 'Изберете дали примателот има право на предвремено враќање на заемот согласно Член 551 од ЗОО. Ако е дозволено, примателот може да го врати заемот пред рокот, плаќајќи камата само до денот на враќањето.'
    },

    earlyRepaymentNotice: {
      name: 'earlyRepaymentNotice',
      type: 'number',
      label: 'Период за известување пред предвремено враќање (денови)',
      placeholder: '30',
      min: 7,
      max: 90,
      step: 1,
      required: false,
      condition: (formData) => formData.earlyRepayment === 'yes',
      helpText: 'Внесете колку денови однапред примателот мора да го извести давателот доколку сака предвремено да го врати заемот. Стандардно е 15-30 денови. Ова овозможува на давателот да планира реинвестирање на средствата.'
    },

    specialConditions: {
      name: 'specialConditions',
      type: 'textarea',
      label: 'Специјални услови (опционално)',
      placeholder: 'пр. Примателот се обврзува редовно да го известува давателот за намената на користените средства и да овозможи увид во финансиското работење доколку тоа биде потребно.',
      rows: 4,
      maxLength: 1500,
      required: false,
      helpText: 'Внесете дополнителни специфични услови доколку има договорени дополнителни обврски, ограничувања или права на страните што не се покриени во стандардните членови на договорот.'
    },

    disputeResolution: {
      name: 'disputeResolution',
      type: 'textarea',
      label: 'Решавање на спорови',
      placeholder: 'Во случај на спор двете страни ќе се обидат да го решат истиот спогодбено, во спротивно надлежен за решавање на спорот е Основниот суд Скопје II во Скопје.',
      rows: 3,
      maxLength: 500,
      required: false,
      helpText: 'Опишете како се решаваат спорови кои произлегуваат од договорот. Стандардно е надлежен граѓански суд, но странките може да договорат арбитража или медијација за побрзо решавање.'
    }
  },

  // Validation rules
  validationRules: [
    // Step 1
    { field: 'contractDate', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Датум на склучување' },
    { field: 'userRole', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Ваша улога' },
    { field: 'loanAmount', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Износ на заем' },
    { field: 'loanType', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Тип на заем' },
    { field: 'hasInterest', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Камата' },

    // Step 2
    { field: 'repaymentType', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Начин на враќање' },
    { field: 'borrowerBankAccount', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Трансакциска сметка' },
    { field: 'borrowerBank', type: VALIDATION_TYPES.REQUIRED_TEXT, label: 'Банка' }
  ],

  // Initial form data
  initialFormData: {
    contractDate: '',
    contractLocation: 'Скопје', // Default value for hidden field
    userRole: '',
    loanAmount: '',
    loanType: '',
    loanPurpose: '',
    hasInterest: '',
    interestRate: '',
    borrowerName: '',
    borrowerAddress: '',
    borrowerTaxNumber: '',
    borrowerManager: '',
    lenderName: '',
    lenderAddress: '',
    lenderTaxNumber: '',
    lenderManager: '',
    repaymentType: '',
    repaymentDeadline: '',
    numberOfInstallments: '',
    firstPaymentDate: '',
    paymentFrequency: '',
    borrowerBankAccount: '',
    borrowerBank: '',
    earlyRepayment: 'yes',
    earlyRepaymentNotice: '30',
    specialConditions: '',
    disputeResolution: 'Во случај на спор двете страни ќе се обидат да го решат истиот спогодбено, во спротивно надлежен за решавање на спорот е Основниот суд Скопје II во Скопје.',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['contractDate', 'userRole', 'loanAmount', 'loanType', 'loanPurpose', 'hasInterest', 'interestRate', 'borrowerName', 'borrowerAddress', 'borrowerTaxNumber', 'borrowerManager', 'lenderName', 'lenderAddress', 'lenderTaxNumber', 'lenderManager'],
    2: ['repaymentType', 'repaymentDeadline', 'numberOfInstallments', 'firstPaymentDate', 'paymentFrequency', 'borrowerBankAccount', 'borrowerBank'],
    3: ['earlyRepayment', 'earlyRepaymentNotice', 'specialConditions', 'disputeResolution']
  };

  return fieldsByStep[stepId]?.map(fieldName => loanAgreementConfig.fields[fieldName]) || [];
};

export default loanAgreementConfig;
