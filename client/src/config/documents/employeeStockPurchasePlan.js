import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Employee Stock Purchase Plan Document Configuration
 * Complex corporate document for employee stock purchase programs
 * Adapted for Macedonian corporate law (Закон за трговски друштва)
 */
export const employeeStockPurchasePlanConfig = {
  documentType: 'employeeStockPurchasePlan',
  apiEndpoint: 'employee-stock-purchase-plan',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци за планот',
      description: 'Датум на стапување во сила и цел на планот',
      requiredFields: []
    },
    {
      id: 2,
      title: 'Услови за квалификација',
      description: 'Критериуми за учество на вработените во планот',
      requiredFields: []
    },
    {
      id: 3,
      title: 'Параметри на планот',
      description: 'Финансиски параметри и услови на планот',
      requiredFields: []
    },
    {
      id: 4,
      title: 'Административни детали',
      description: 'Времетраење и административни аспекти',
      requiredFields: []
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Plan Information
    ownershipType: {
      name: 'ownershipType',
      type: 'select',
      label: 'Тип на друштво',
      placeholder: 'Изберете тип',
      required: false,
      options: [
        { value: '', label: 'Изберете' },
        { value: 'удели', label: 'ДОО/ДООЕЛ (Удели)' },
        { value: 'акции', label: 'АД (Акции)' }
      ],
      helpText: 'Изберете го типот на вашето друштво. За ДОО и ДООЕЛ вработените стекнуваат удели (изразени во %), за АД вработените стекнуваат акции (изразени во број).'
    },
    effectiveDate: {
      name: 'effectiveDate',
      type: 'date',
      label: 'Датум на стапување во сила',
      placeholder: '',
      required: false,
      helpText: 'Изберете го датумот кога планот официјално влегува во сила. Ако не се внесе, ќе се користи денешниот датум. Планот важи од овој датум наваму.'
    },
    purposeOwnership: {
      name: 'purposeOwnership',
      type: 'checkbox',
      label: 'Да им овозможи на вработените да станат сопственици',
      required: false,
      helpText: 'Основна цел на секој план за стекнување сопственост - да им даде на вработените можност да станат совласници на компанијата.'
    },
    purposeMotivation: {
      name: 'purposeMotivation',
      type: 'checkbox',
      label: 'Да ги мотивира вработените',
      required: false,
      helpText: 'Сопственоста на акции мотивира вработените да работат кон долгорочен успех на компанијата бидејќи нивниот личен финансиски интерес е поврзан со перформансите на компанијата.'
    },
    purposeRetention: {
      name: 'purposeRetention',
      type: 'checkbox',
      label: 'Да ги задржи квалитетните кадри',
      required: false,
      helpText: 'ESPP планот претставува додатен бенефит кој помага да се задржат талентираните вработени и да се намали флуктуацијата на кадри.'
    },
    purposeAlignment: {
      name: 'purposeAlignment',
      type: 'checkbox',
      label: 'Да ги усогласи интересите на вработените со акционерите',
      required: false,
      helpText: 'Кога вработените се и акционери, нивните интереси се усогласуваат со интересите на другите акционери - сите работат кон иста цел за успех на компанијата.'
    },
    purposeReward: {
      name: 'purposeReward',
      type: 'checkbox',
      label: 'Да ги наградува вработените за успехот на компанијата',
      required: false,
      helpText: 'Овозможува вработените директно да партиципираат во финансискиот успех и раст на компанијата преку зголемување на вредноста на акциите.'
    },
    purposeAttract: {
      name: 'purposeAttract',
      type: 'checkbox',
      label: 'Да привлече нови квалитетни кадри',
      required: false,
      helpText: 'ESPP планот е атрактивен бенефит кој помага при регрутирање на нови талентирани вработени и ја зголемува конкурентноста на компанијата на пазарот на труд.'
    },

    // Step 2: Eligibility Criteria
    minimumServiceMonths: {
      name: 'minimumServiceMonths',
      type: 'select',
      label: 'Минимален работен стаж (во месеци)',
      placeholder: 'Изберете период',
      required: false,
      options: [
        { value: '0', label: 'Без минимум - од првиот ден' },
        { value: '1', label: '1 месец' },
        { value: '3', label: '3 месеци' },
        { value: '6', label: '6 месеци' },
        { value: '12', label: '12 месеци (1 година)' },
        { value: '24', label: '24 месеци (2 години)' }
      ],
      helpText: 'Одредете го минималниот работен стаж потребен за учество во планот. Според Законот за работни односи, вообичаен е пробен период од 3-6 месеци. Стандардно се користи 3 месеци.'
    },
    minimumWorkHours: {
      name: 'minimumWorkHours',
      type: 'select',
      label: 'Минимални работни часови неделно',
      placeholder: 'Изберете број на часови',
      required: false,
      options: [
        { value: '10', label: '10 часа неделно (скратено работно време)' },
        { value: '20', label: '20 часа неделно (половично работно време)' },
        { value: '30', label: '30 часа неделно' },
        { value: '40', label: '40 часа неделно (полно работно време)' }
      ],
      helpText: 'Определете го минималниот број на работни часови неделно за квалификација. Според ЗРО, полно работно време е 40 часа. Стандардно е 20 часа за вклучување на вработени со половично работно време.'
    },

    // Step 3: Plan Parameters
    maximumSharesNumber: {
      name: 'maximumSharesNumber',
      type: 'text',
      label: 'Максимален број на акции достапни во планот',
      placeholder: 'пр. 10000, 50000, 100000',
      required: false,
      condition: (formData) => formData.ownershipType === 'акции',
      helpText: 'Внесете го вкупниот број на акции што ќе бидат достапни за стекнување преку овој план. Овој број треба да биде одобрен од Собранието на акционери според Законот за трговски друштва.'
    },
    maximumSharesPercentage: {
      name: 'maximumSharesPercentage',
      type: 'text',
      label: 'Максимален процент на удели достапни во планот',
      placeholder: 'пр. 10%, 15%, 20% од вкупните удели',
      required: false,
      condition: (formData) => formData.ownershipType === 'удели',
      helpText: 'Внесете го максималниот процент од вкупните удели што ќе бидат достапни за стекнување преку овој план (пр. 10 за 10%). Овој процент треба да биде одобрен од Собранието на членови според Законот за трговски друштва.'
    },
    purchasePricePercentage: {
      name: 'purchasePricePercentage',
      type: 'select',
      label: 'Процент на дисконт (цена на купување)',
      placeholder: 'Изберете дисконт',
      required: false,
      options: [
        { value: '70', label: '70% (30% попуст - многу атрактивно)' },
        { value: '75', label: '75% (25% попуст)' },
        { value: '80', label: '80% (20% попуст)' },
        { value: '85', label: '85% (15% попуст)' },
        { value: '90', label: '90% (10% попуст - умерено)' },
        { value: '95', label: '95% (5% попуст - минимално)' },
        { value: '100', label: '100% (без попуст - полна пазарна цена)' }
      ],
      helpText: 'Изберете го процентот од пазарната цена по кој вработените ќе можат да купуваат акции. Стандардно е 85% (15% попуст). Пониските проценти значат поатрактивна понуда за вработените.'
    },
    offeringPeriodMonths: {
      name: 'offeringPeriodMonths',
      type: 'select',
      label: 'Времетраење на период на понуда (во месеци)',
      placeholder: 'Изберете период',
      required: false,
      options: [
        { value: '3', label: '3 месеци (квартално)' },
        { value: '6', label: '6 месеци (полугодишно)' },
        { value: '12', label: '12 месеци (годишно)' },
        { value: '24', label: '24 месеци (двегодишно)' }
      ],
      helpText: 'Одредете колку долго трае секој период на понуда за купување акции. Стандардно е 6 месеци, што дава два циклуси годишно (февруари-август, август-февруари).'
    },
    enrollmentDates: {
      name: 'enrollmentDates',
      type: 'text',
      label: 'Датуми на запишување (опционално)',
      placeholder: 'пр. 1 февруари и 1 август, 1 јануари и 1 јули',
      required: false,
      helpText: 'Наведете ги датумите кога вработените можат да се запишат во планот. Стандардно е 1 февруари и 1 август. Ако не се внесе, ќе се користи стандардниот текст.'
    },
    maxPayrollDeductionPercentage: {
      name: 'maxPayrollDeductionPercentage',
      type: 'select',
      label: 'Максимален процент на одбивање од плата',
      placeholder: 'Изберете процент',
      required: false,
      options: [
        { value: '5', label: '5% (конзервативно)' },
        { value: '10', label: '10%' },
        { value: '15', label: '15%' },
        { value: '20', label: '20%' },
        { value: '25', label: '25%' },
        { value: '30', label: '30% (либерално)' }
      ],
      helpText: 'Максималниот процент од нето платата што вработените можат да го издвојуваат месечно за купување акции. Стандардно е 20%. Помал процент намалува финансиски ризик за вработените.'
    },

    // Step 4: Administrative Details
    termPeriod: {
      name: 'termPeriod',
      type: 'text',
      label: 'Времетраење на планот (број)',
      placeholder: 'пр. 5, 10, 15',
      required: false,
      helpText: 'Внесете го бројот за времетраењето на планот (колку години или месеци планот ќе биде активен). Стандардно е 5-10 години за корпоративни планови.'
    },
    termUnit: {
      name: 'termUnit',
      type: 'select',
      label: 'Единица за времетраење',
      placeholder: 'Изберете единица',
      required: false,
      options: [
        { value: 'месеци', label: 'Месеци' },
        { value: 'години', label: 'Години (стандардно)' }
      ],
      helpText: 'Изберете дали времетраењето е во месеци или години. За долгорочни планови, стандардно се користат години.'
    },
    committeeName: {
      name: 'committeeName',
      type: 'text',
      label: 'Име на одборот за администрација',
      placeholder: 'пр. Одборот за наградување, Комитет за компензации',
      required: false,
      helpText: 'Наведете го име на одборот или комитетот кој ќе го администрира планот. Стандардно е „Одборот за наградување". Ако не се внесе, ќе се користи стандардниот текст.'
    },
    allowsCashContributions: {
      name: 'allowsCashContributions',
      type: 'select',
      label: 'Дозволени готовински придонеси',
      placeholder: 'Изберете опција',
      required: false,
      options: [
        { value: 'не', label: 'Не - само одбивања од плата' },
        { value: 'да', label: 'Да - дозволени готовински придонеси' }
      ],
      helpText: 'Одлучете дали вработените можат да уплаќаат готовина директно, или само преку одбивања од плата. Во Македонија, доколку се одбива од плата, вработениот е потребно и да потпише изјава со која се согласува на тоа.'
    }
  },

  // Validation rules - lenient validation with optional fields
  validationRules: [
    // Step 1 - checkboxes don't need validation, ownershipType is dropdown

    // Step 2
    {
      field: 'minimumServiceMonths',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Минимален работен стаж'
    },
    {
      field: 'minimumWorkHours',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Минимални работни часови'
    },

    // Step 3
    {
      field: 'maximumSharesNumber',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Максимален број на акции'
    },
    {
      field: 'maximumSharesPercentage',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Максимален процент на удели'
    },
    {
      field: 'purchasePricePercentage',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Процент на дисконт'
    },
    {
      field: 'offeringPeriodMonths',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Времетраење на период на понуда'
    },
    {
      field: 'enrollmentDates',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Датуми на запишување'
    },
    {
      field: 'maxPayrollDeductionPercentage',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Максимален процент на одбивање од плата'
    },

    // Step 4
    {
      field: 'termPeriod',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Времетраење на планот'
    },
    {
      field: 'termUnit',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Единица за времетраење'
    },
    {
      field: 'committeeName',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Име на одборот'
    },
    {
      field: 'allowsCashContributions',
      type: VALIDATION_TYPES.OPTIONAL_TEXT,
      label: 'Готовински придонеси'
    }
  ],

  // Initial form data
  initialFormData: {
    // Step 1
    ownershipType: '',
    effectiveDate: '',
    purposeOwnership: false,
    purposeMotivation: false,
    purposeRetention: false,
    purposeAlignment: false,
    purposeReward: false,
    purposeAttract: false,

    // Step 2
    minimumServiceMonths: '3',
    minimumWorkHours: '20',

    // Step 3
    maximumSharesNumber: '',
    maximumSharesPercentage: '',
    purchasePricePercentage: '85',
    offeringPeriodMonths: '6',
    enrollmentDates: '',
    maxPayrollDeductionPercentage: '20',

    // Step 4
    termPeriod: '',
    termUnit: 'години',
    committeeName: '',
    allowsCashContributions: 'не',

    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['ownershipType', 'effectiveDate', 'purposeOwnership', 'purposeMotivation', 'purposeRetention', 'purposeAlignment', 'purposeReward', 'purposeAttract'],
    2: ['minimumServiceMonths', 'minimumWorkHours'],
    3: ['maximumSharesNumber', 'maximumSharesPercentage', 'purchasePricePercentage', 'offeringPeriodMonths', 'enrollmentDates', 'maxPayrollDeductionPercentage'],
    4: ['termPeriod', 'termUnit', 'committeeName', 'allowsCashContributions']
  };

  return fieldsByStep[stepId]?.map(fieldName => employeeStockPurchasePlanConfig.fields[fieldName]) || [];
};

export default employeeStockPurchasePlanConfig;
