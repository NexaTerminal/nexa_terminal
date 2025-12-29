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
      requiredFields: ['decisionDate', 'profitAmount', 'totalDividendAmount']
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
    profitAmount: {
      name: 'profitAmount',
      type: 'number',
      label: 'Вкупна добивка од претходната година (денари)',
      placeholder: '100000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете го вкупниот износ на добивката од претходната година која ќе се распредели како дивиденда, во денари. Овој износ мора да соодветствува со финансиските извештаи на друштвото и да биде во согласност со правилата за распределба на добивка според Законот за трговските друштва. Форматот ќе биде: 1.000,00 денари.'
    },
    totalDividendAmount: {
      name: 'totalDividendAmount',
      type: 'number',
      label: 'Вкупен износ на дивиденда за исплата (денари)',
      placeholder: '80000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете го вкупниот износ на дивиденда која ќе се исплати на содружниците, во денари. Овој износ претставува бруто износ пред одданочување. Согласно законот, на дивидендата се применува персонален данок на доход од 10%. Форматот ќе биде: 1.000,00 денари.'
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
      field: 'profitAmount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Вкупна добивка'
    },
    {
      field: 'totalDividendAmount',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Вкупен износ на дивиденда'
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
    profitAmount: '',
    totalDividendAmount: '',
    shareholdersList: [],
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['decisionDate', 'profitAmount', 'totalDividendAmount'],
    2: ['shareholdersList']
  };

  return fieldsByStep[stepId]?.map(fieldName => dividendPaymentDecisionConfig.fields[fieldName]) || [];
};

export default dividendPaymentDecisionConfig;
