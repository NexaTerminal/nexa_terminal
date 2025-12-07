import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Dividend Payment Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Based on Article 490 of the Law on Trading Companies
 */
export const dividendPaymentDecisionConfig = {
  documentType: 'dividendPaymentDecision',
  apiEndpoint: 'dividend-payment-decision',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци за одлуката',
      description: 'Внесете ги основните податоци за одлуката за исплата на дивиденда',
      requiredFields: ['decisionDate', 'accumulatedProfitYear', 'accumulatedProfitAmount', 'currentProfitYear', 'currentProfitAmount', 'totalDividendAmount', 'paymentYear', 'chairman']
    },
    {
      id: 2,
      title: 'Листа на содружници',
      description: 'Додадете ги содружниците и нивните износи на дивиденда',
      requiredFields: ['shareholdersList']
    }
  ],

  // Form fields configuration
  fields: {
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на одлуката',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога содружниците ја донесуваат одлуката за исплата на дивиденда. Овој датум е задолжителен според член 490 од Законот за трговските друштва (Службен весник на РМ бр. 28/04) и означува официјален почеток на правните дејства на одлуката.'
    },
    accumulatedProfitYear: {
      name: 'accumulatedProfitYear',
      type: 'number',
      label: 'Година на акумулирана добивка',
      placeholder: '2024',
      min: 2000,
      max: 2099,
      step: 1,
      required: true,
      helpText: 'Внесете ја годината од која потекнува акумулираната добивка што ќе се користи за исплата на дивиденда. Акумулираната добивка е неразделена добивка од претходни години која согласно Законот за трговските друштва може да се распредели како дивиденда на содружниците.'
    },
    accumulatedProfitAmount: {
      name: 'accumulatedProfitAmount',
      type: 'number',
      label: 'Износ на акумулирана добивка (денари)',
      placeholder: '100000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете го износот на акумулирана добивка од претходни години која ќе се распредели како дивиденда, во денари. Овој износ мора да соодветствува со финансиските извештаи на друштвото и да биде во согласност со правилата за распределба на добивка според Законот за трговските друштва. Форматот ќе биде: 1.000,00 денари.'
    },
    currentProfitYear: {
      name: 'currentProfitYear',
      type: 'number',
      label: 'Година на тековна добивка',
      placeholder: '2025',
      min: 2000,
      max: 2099,
      step: 1,
      required: true,
      helpText: 'Внесете ја годината за која се однесува тековната добивка што ќе се користи за исплата на дивиденда. Согласно Законот за трговските друштва, тековната добивка од извештајната година може да се распредели како дивиденда по усвојување на годишните финансиски извештаи.'
    },
    currentProfitAmount: {
      name: 'currentProfitAmount',
      type: 'number',
      label: 'Износ на тековна добивка (денари)',
      placeholder: '50000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете го износот на тековната добивка од извештајната година која ќе се распредели како дивиденда, во денари. Овој износ мора да биде потврден со усвоени годишни финансиски извештаи согласно Законот за трговските друштва. Форматот ќе биде: 1.000,00 денари.'
    },
    totalDividendAmount: {
      name: 'totalDividendAmount',
      type: 'number',
      label: 'Вкупен износ на дивиденда (денари)',
      placeholder: '150000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете го вкупниот износ на дивиденда која ќе се исплати (збир од акумулираната и тековната добивка), во денари. Овој износ претставува бруто износ пред одданочување. Согласно законот, на дивидендата се применува персонален данок на доход од 10%. Форматот ќе биде: 1.000,00 денари.'
    },
    paymentYear: {
      name: 'paymentYear',
      type: 'number',
      label: 'Година на исплата',
      placeholder: '2025',
      min: 2000,
      max: 2099,
      step: 1,
      required: true,
      helpText: 'Внесете ја годината во која ќе се изврши исплатата на дивидендата на содружниците. Според член 490 од Законот за трговските друштва, исплатата на дивиденда се врши на трансакциска сметка на содружниците во законски утврдениот рок.'
    },
    chairman: {
      name: 'chairman',
      type: 'text',
      label: 'Име на претседавач',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Внесете го целото име и презиме на претседавачот на собранието на содружниците кој ја потпишува оваа одлука. Согласно Законот за трговските друштва, претседавачот на собранието е овластен да ги потпишува одлуките донесени од содружниците на друштвото.'
    },
    shareholdersList: {
      name: 'shareholdersList',
      type: 'array',
      label: 'Листа на содружници',
      required: true,
      helpText: 'Внесете ги сите содружници на друштвото со нивните соодветни бруто износи на дивиденда. Распределбата на дивидендата мора да биде пропорционална на уделите во друштвото согласно Книгата на удели и тековната состојба од Централниот регистар. Износите се во бруто износ - 10% персонален данок на доход ќе се одбие при исплата.',
      arrayFields: [
        {
          name: 'shareholderName',
          type: 'text',
          label: 'Име и презиме / Назив на содружник',
          placeholder: 'пр. Петар Николовски или ДОО Бизнис',
          required: true,
          helpText: 'Внесете го точното име и презиме на физичкото лице или целиот назив на правното лице кое е содружник во друштвото. Податокот мора да одговара со податоците од Книгата на удели и Централниот регистар на РМ.'
        },
        {
          name: 'grossDividendAmount',
          type: 'number',
          label: 'Бруто износ на дивиденда (денари)',
          placeholder: '10000',
          min: 0,
          step: 1,
          required: true,
          helpText: 'Внесете го бруто износот на дивиденда која припаѓа на овој содружник во денари. Износот се пресметува пропорционално на уделот во друштвото. Од овој износ ќе се одбие 10% персонален данок на доход при исплата согласно Законот за данок на личен доход. Форматот ќе биде: 1.000,00 денари.'
        }
      ]
    }
  },

  // Validation rules
  validationRules: [
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на одлуката'
    },
    {
      field: 'accumulatedProfitYear',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Година на акумулирана добивка'
    },
    {
      field: 'accumulatedProfitAmount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Износ на акумулирана добивка'
    },
    {
      field: 'currentProfitYear',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Година на тековна добивка'
    },
    {
      field: 'currentProfitAmount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Износ на тековна добивка'
    },
    {
      field: 'totalDividendAmount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Вкупен износ на дивиденда'
    },
    {
      field: 'paymentYear',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Година на исплата'
    },
    {
      field: 'chairman',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име на претседавач'
    },
    {
      field: 'shareholdersList',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Листа на содружници'
    }
  ],

  // Initial form data
  initialFormData: {
    decisionDate: '',
    accumulatedProfitYear: new Date().getFullYear() - 1,
    accumulatedProfitAmount: '',
    currentProfitYear: new Date().getFullYear(),
    currentProfitAmount: '',
    totalDividendAmount: '',
    paymentYear: new Date().getFullYear(),
    chairman: '',
    shareholdersList: [],
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['decisionDate', 'accumulatedProfitYear', 'accumulatedProfitAmount', 'currentProfitYear', 'currentProfitAmount', 'totalDividendAmount', 'paymentYear', 'chairman'],
    2: ['shareholdersList']
  };

  return fieldsByStep[stepId]?.map(fieldName => dividendPaymentDecisionConfig.fields[fieldName]) || [];
};

export default dividendPaymentDecisionConfig;
