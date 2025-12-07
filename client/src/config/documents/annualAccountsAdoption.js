import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Annual Accounts Adoption Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Based on Article 215 paragraph 1 point 1 of the Law on Trading Companies
 */
export const annualAccountsAdoptionConfig = {
  documentType: 'annualAccountsAdoption',
  apiEndpoint: 'annual-accounts-adoption',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци за одлуката',
      description: 'Внесете ги основните податоци за усвојување на годишната сметка',
      requiredFields: ['articleNumber', 'meetingDate', 'year', 'managerName', 'city', 'date', 'chairman']
    },
    {
      id: 2,
      title: 'Финансиски резултати',
      description: 'Внесете ги финансиските резултати од работењето на друштвото',
      requiredFields: ['revenues', 'expenses', 'taxOnExpenses']
    }
  ],

  // Form fields configuration
  fields: {
    articleNumber: {
      name: 'articleNumber',
      type: 'text',
      label: 'Број на член од Договорот/Статутот',
      placeholder: 'пр. 12',
      required: true,
      helpText: 'Внесете го бројот на членот од Договорот за друштво или Статутот кој ги регулира надлежностите на собранието на содружниците. Согласно член 215 став 1 точка 1 од Законот за трговските друштва, собранието има исклучива надлежност за усвојување на годишната сметка и финансиските извештаи.'
    },
    meetingDate: {
      name: 'meetingDate',
      type: 'date',
      label: 'Датум на седница на собранието',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот кога е одржана седницата на собранието на содружниците на која се донесува оваа одлука. Согласно Законот за трговските друштва, годишната сметка и финансиските извештаи мораат да бидат усвоени најдоцна до 30 јуни во тековната година за претходната деловна година.'
    },
    year: {
      name: 'year',
      type: 'number',
      label: 'Година на извештајот',
      placeholder: '2024',
      min: 2000,
      max: 2099,
      step: 1,
      required: true,
      helpText: 'Внесете ја деловната година за која се усвојуваат годишната сметка и финансиските извештаи. Овој податок се однесува на извештајниот период за кој се составени финансиските извештаи во согласност со Законот за трговските друштва и меѓународните сметководствени стандарди.'
    },
    revenues: {
      name: 'revenues',
      type: 'number',
      label: 'Остварени приходи (денари)',
      placeholder: '1000000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете ги вкупните остварени приходи од работењето на друштвото за извештајната година во денари. Податокот мора да одговара со податоците од Билансот на успех и да биде подготвен согласно меѓународните сметководствени стандарди. Форматот ќе биде: 1.000,00 денари.'
    },
    expenses: {
      name: 'expenses',
      type: 'number',
      label: 'Остварени расходи (денари)',
      placeholder: '800000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете ги вкупните остварени расходи од работењето на друштвото за извештајната година во денари. Податокот мора да одговара со податоците од Билансот на успех и да биде подготвен согласно меѓународните сметководствени стандарди. Форматот ќе биде: 1.000,00 денари.'
    },
    profitBeforeTax: {
      name: 'profitBeforeTax',
      type: 'number',
      label: 'Остварена добивка пред оданочување (денари)',
      placeholder: 'Автоматски пресметано',
      readOnly: true,
      required: false,
      helpText: 'Оваа вредност се пресметува автоматски како разлика помеѓу остварените приходи и расходи (приходи - расходи). Претставува финансиски резултат пред примена на оданочување согласно Законот за данокот на добивка.'
    },
    taxOnExpenses: {
      name: 'taxOnExpenses',
      type: 'number',
      label: 'Данок на непризнаени расходи (денари)',
      placeholder: '50000',
      min: 0,
      step: 1,
      required: true,
      helpText: 'Внесете го износот на данокот на добивка кој произлегува од непризнаени расходи согласно Законот за данокот на добивка. Ова се расходи кои не се признати како даночно признаени трошоци и се облагаат со данок на добивка. Форматот ќе биде: 1.000,00 денари.'
    },
    profitAfterTax: {
      name: 'profitAfterTax',
      type: 'number',
      label: 'Остварена добивка по оданочување (денари)',
      placeholder: 'Автоматски пресметано',
      readOnly: true,
      required: false,
      helpText: 'Оваа вредност се пресметува автоматски како разлика помеѓу добивката пред оданочување и данокот на непризнаени расходи (добивка пред оданочување - данок). Претставува нето добивка која е достапна за распределба или акумулација согласно Законот за трговските друштва.'
    },
    managerName: {
      name: 'managerName',
      type: 'text',
      label: 'Име на Управител/Директор',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Внесете го целото име и презиме на управителот, односно членовите на одборот на директорите (управниот и надзорниот одбор) чија работа се одобрува со оваа одлука. Согласно член 215 став 1 точка 1 од Законот за трговските друштва, собранието има надлежност да ја одобри работата на управните органи.'
    },
    city: {
      name: 'city',
      type: 'text',
      label: 'Град',
      placeholder: 'Скопје',
      required: true,
      helpText: 'Внесете го името на градот каде се донесува одлуката. Стандардно е тоа седиштето на друштвото. Овој податок е дел од формалниот потпис на одлуката и треба да одговара со податоците од Централниот регистар.'
    },
    date: {
      name: 'date',
      type: 'date',
      label: 'Датум на донесување на одлуката',
      placeholder: '',
      required: true,
      helpText: 'Внесете го датумот на кој формално се донесува оваа одлука. Обично тоа е истиот датум како датумот на седницата на собранието. Согласно член 215 од Законот за трговските друштва, одлуката влегува во сила со денот на донесувањето.'
    },
    chairman: {
      name: 'chairman',
      type: 'text',
      label: 'Име на претседавач на собранието',
      placeholder: 'пр. Јован Јовановски',
      required: true,
      helpText: 'Внесете го целото име и презиме на претседавачот на собранието на содружниците кој ја потпишува оваа одлука. Претседавачот на собранието е овластен да ги потпишува одлуките донесени од содружниците согласно Законот за трговските друштва и Договорот за друштвото.'
    }
  },

  // Validation rules
  validationRules: [
    {
      field: 'articleNumber',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Број на член од Договорот/Статутот'
    },
    {
      field: 'meetingDate',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на седница'
    },
    {
      field: 'year',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Година на извештајот'
    },
    {
      field: 'revenues',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Остварени приходи'
    },
    {
      field: 'expenses',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Остварени расходи'
    },
    {
      field: 'taxOnExpenses',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Данок на непризнаени расходи'
    },
    {
      field: 'managerName',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име на Управител/Директор'
    },
    {
      field: 'city',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Град'
    },
    {
      field: 'date',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Датум на донесување'
    },
    {
      field: 'chairman',
      type: VALIDATION_TYPES.REQUIRED_TEXT,
      label: 'Име на претседавач'
    }
  ],

  // Initial form data
  initialFormData: {
    articleNumber: '',
    meetingDate: '',
    year: new Date().getFullYear() - 1, // Previous year by default
    revenues: '',
    expenses: '',
    profitBeforeTax: '',
    taxOnExpenses: '',
    profitAfterTax: '',
    managerName: '',
    city: 'Скопје',
    date: '',
    chairman: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['articleNumber', 'meetingDate', 'year', 'managerName', 'city', 'date', 'chairman'],
    2: ['revenues', 'expenses', 'profitBeforeTax', 'taxOnExpenses', 'profitAfterTax']
  };

  return fieldsByStep[stepId]?.map(fieldName => annualAccountsAdoptionConfig.fields[fieldName]) || [];
};

export default annualAccountsAdoptionConfig;
