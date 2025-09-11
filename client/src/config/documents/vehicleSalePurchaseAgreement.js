import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Vehicle Sale-Purchase Agreement Document Configuration
 * Multi-step form with conditional fields based on user role and other party type
 */
export const vehicleSalePurchaseAgreementConfig = {
  documentType: 'vehicleSalePurchaseAgreement',
  apiEndpoint: 'vehicle-sale-purchase-agreement',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Улога и основни податоци',
      description: 'Изберете ја вашата улога и внесете основни податоци за договорот',
      requiredFields: ['userRole', 'contractDate', 'placeOfSigning', 'competentCourt']
    },
    {
      id: 2,
      title: 'Податоци за другата страна',
      description: 'Внесете ги податоците за другата договорна страна',
      requiredFields: ['otherPartyType', 'otherPartyAddress']
    },
    {
      id: 3,
      title: 'Податоци за возилото',
      description: 'Внесете ги техничките податоци за возилото',
      requiredFields: ['vehicleType', 'vehicleBrand', 'chassisNumber', 'productionYear', 'registrationNumber']
    },
    {
      id: 4,
      title: 'Финансиски услови',
      description: 'Определете ја цената и начинот на плаќање',
      requiredFields: ['price', 'paymentMethod']
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1 - Basic contract information
    userRole: {
      name: 'userRole',
      type: 'dropdown',
      label: 'Ваша улога во договорот',
      required: true,
      options: [
        { value: '', label: 'Изберете улога' },
        { value: 'seller', label: 'Продавач (ја продавам возилото)' },
        { value: 'buyer', label: 'Купувач (го купувам возилото)' }
      ],
      helpText: 'Изберете ја улогата на вашата компанија во договорот. Ако ја продавате возилото - изберете Продавач. Ако го купувате возилото - изберете Купувач. Оваа информација ќе ја определи структурата на договорот и правните обврски.'
    },
    contractDate: {
      name: 'contractDate',
      type: 'date',
      label: 'Датум на склучување на договорот',
      required: true,
      helpText: 'Внесете го датумот кога се склучува договорот за купопродажба на возилото. Ова обично е денешниот датум или датумот кога договорните страни се среќаваат за потпишување.'
    },
    placeOfSigning: {
      name: 'placeOfSigning',
      type: 'select',
      label: 'Место на потпишување на договорот',
      required: true,
      options: [
        { value: '', label: 'Изберете место' },
        { value: 'Берово', label: 'Берово' },
        { value: 'Битола', label: 'Битола' },
        { value: 'Богданци', label: 'Богданци' },
        { value: 'Валандово', label: 'Валандово' },
        { value: 'Велес', label: 'Велес' },
        { value: 'Виница', label: 'Виница' },
        { value: 'Гевгелија', label: 'Гевгелија' },
        { value: 'Гостивар', label: 'Гостивар' },
        { value: 'Дебар', label: 'Дебар' },
        { value: 'Делчево', label: 'Делчево' },
        { value: 'Демир Капија', label: 'Демир Капија' },
        { value: 'Демир Хисар', label: 'Демир Хисар' },
        { value: 'Кавадарци', label: 'Кавадарци' },
        { value: 'Кичево', label: 'Кичево' },
        { value: 'Кочани', label: 'Кочани' },
        { value: 'Кратово', label: 'Кратово' },
        { value: 'Крива Паланка', label: 'Крива Паланка' },
        { value: 'Крушево', label: 'Крушево' },
        { value: 'Куманово', label: 'Куманово' },
        { value: 'Македонска Каменица', label: 'Македонска Каменица' },
        { value: 'Македонски Брод', label: 'Македонски Брод' },
        { value: 'Неготино', label: 'Неготино' },
        { value: 'Охрид', label: 'Охрид' },
        { value: 'Пехчево', label: 'Пехчево' },
        { value: 'Прилеп', label: 'Прилеп' },
        { value: 'Пробиштип', label: 'Пробиштип' },
        { value: 'Радовиш', label: 'Радовиш' },
        { value: 'Ресен', label: 'Ресен' },
        { value: 'Свети Николе', label: 'Свети Николе' },
        { value: 'Скопје', label: 'Скопје' },
        { value: 'Струга', label: 'Струга' },
        { value: 'Струмица', label: 'Струмица' },
        { value: 'Тетово', label: 'Тетово' },
        { value: 'Штип', label: 'Штип' }
      ],
      helpText: 'Изберете го градот или местото каде се потпишува договорот. Ова место е важно за определување на надлежниот суд во случај на спор.'
    },
    competentCourt: {
      name: 'competentCourt',
      type: 'select',
      label: 'Надлежен суд',
      required: true,
      options: [
        { value: '', label: 'Изберете суд' },
        { value: 'Берово', label: 'Берово' },
        { value: 'Битола', label: 'Битола' },
        { value: 'Богданци', label: 'Богданци' },
        { value: 'Валандово', label: 'Валандово' },
        { value: 'Велес', label: 'Велес' },
        { value: 'Виница', label: 'Виница' },
        { value: 'Гевгелија', label: 'Гевгелија' },
        { value: 'Гостивар', label: 'Гостивар' },
        { value: 'Дебар', label: 'Дебар' },
        { value: 'Делчево', label: 'Делчево' },
        { value: 'Демир Капија', label: 'Демир Капија' },
        { value: 'Демир Хисар', label: 'Демир Хисар' },
        { value: 'Кавадарци', label: 'Кавадарци' },
        { value: 'Кичево', label: 'Кичево' },
        { value: 'Кочани', label: 'Кочани' },
        { value: 'Кратово', label: 'Кратово' },
        { value: 'Крива Паланка', label: 'Крива Паланка' },
        { value: 'Крушево', label: 'Крушево' },
        { value: 'Куманово', label: 'Куманово' },
        { value: 'Македонска Каменица', label: 'Македонска Каменица' },
        { value: 'Македонски Брод', label: 'Македонски Брод' },
        { value: 'Неготино', label: 'Неготино' },
        { value: 'Охрид', label: 'Охрид' },
        { value: 'Пехчево', label: 'Пехчево' },
        { value: 'Прилеп', label: 'Прилеп' },
        { value: 'Пробиштип', label: 'Пробиштип' },
        { value: 'Радовиш', label: 'Радовиш' },
        { value: 'Ресен', label: 'Ресен' },
        { value: 'Свети Николе', label: 'Свети Николе' },
        { value: 'Скопје', label: 'Скопје' },
        { value: 'Струга', label: 'Струга' },
        { value: 'Струмица', label: 'Струмица' },
        { value: 'Тетово', label: 'Тетово' },
        { value: 'Штип', label: 'Штип' }
      ],
      helpText: 'Изберете го градот чиј основен граѓански суд ќе биде надлежен во случај на спор. Обично е истиот како местото на потпишување на договорот.'
    },

    // Step 2 - Other party information
    otherPartyType: {
      name: 'otherPartyType',
      type: 'select',
      label: 'Тип на другата договорна страна',
      required: true,
      options: [
        { value: '', label: 'Изберете тип' },
        { value: 'natural', label: 'Физичко лице' },
        { value: 'company', label: 'Правно лице (фирма)' }
      ],
      helpText: 'Изберете дали другата договорна страна е физичко лице (граѓанин) или правно лице (компанија, установа). Оваа информација влијае на потребните документи за идентификација.'
    },
    otherPartyName: {
      name: 'otherPartyName',
      type: 'text',
      label: 'Име и презиме на другата страна',
      placeholder: 'пр. Марко Петровски',
      required: false,
      condition: { 
        field: 'otherPartyType', 
        operator: '===', 
        value: 'natural' 
      },
      helpText: 'Внесете го целосното име и презиме на физичкото лице како што е наведено во личната карта или пасошот. Проверете ги податоците со официјалните документи за идентификација.'
    },
    otherPartyCompanyName: {
      name: 'otherPartyCompanyName',
      type: 'text',
      label: 'Име на компанијата',
      placeholder: 'пр. ДОО Трговија Македонија',
      required: false,
      condition: { 
        field: 'otherPartyType', 
        operator: '===', 
        value: 'company' 
      },
      helpText: 'Внесете го точното правно име на компанијата како што е регистрирано во Централниот регистар. Користете ги податоците од извадокот од Централниот регистар.'
    },
    otherPartyPIN: {
      name: 'otherPartyPIN',
      type: 'text',
      label: 'ЕМБГ на другата страна',
      placeholder: '1234567890123',
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      required: false,
      condition: { 
        field: 'otherPartyType', 
        operator: '===', 
        value: 'natural' 
      },
      helpText: 'Внесете го ЕМБГ од точно 13 цифри според личната карта. ЕМБГ е задолжителен за идентификација на физичките лица во правните документи според македонското законодавство.'
    },
    otherPartyTaxNumber: {
      name: 'otherPartyTaxNumber',
      type: 'text',
      label: 'ЕДБ на компанијата',
      placeholder: '4030000000000',
      required: false,
      condition: { 
        field: 'otherPartyType', 
        operator: '===', 
        value: 'company' 
      },
      helpText: 'Внесете го Единствениот даночен број (ЕДБ) на компанијата. ЕДБ се наоѓа во извадокот од Централниот регистар и на сите официјални документи на компанијата.'
    },
    otherPartyManager: {
      name: 'otherPartyManager',
      type: 'text',
      label: 'Управител/претставник на компанијата',
      placeholder: 'пр. Петар Николовски',
      required: false,
      condition: { 
        field: 'otherPartyType', 
        operator: '===', 
        value: 'company' 
      },
      helpText: 'Внесете го името на лицето овластено да ја претставува компанијата (управител, директор, законски застапник). Проверете ги овластувањата во извадокот од Централниот регистар.'
    },
    otherPartyAddress: {
      name: 'otherPartyAddress',
      type: 'text',
      label: 'Адреса на другата страна',
      placeholder: 'пр. ул. Македонија бр. 10, Скопје',
      required: true,
      helpText: 'Внесете ја целосната адреса (улица, број, град) на другата договорна страна. За физичко лице - адреса според личната карта, за правно лице - седиште според Централниот регистар.'
    },

    // Step 3 - Vehicle information
    vehicleType: {
      name: 'vehicleType',
      type: 'text',
      label: 'Тип на возило',
      placeholder: 'пр. патничко моторно возило',
      required: true,
      helpText: 'Наведете го типот на возилото (патничко, товарно, автобус, мотоцикл и сл.) според сообраќајната дозвола. Типот на возилото влијае на регистрационите и даночните обврски.'
    },
    vehicleBrand: {
      name: 'vehicleBrand',
      type: 'text',
      label: 'Марка на возилото',
      placeholder: 'пр. BMW, Mercedes, Volkswagen',
      required: true,
      helpText: 'Внесете ја марката на возилото точно како што е наведено во сообраќајната дозвола. Марката е важна за идентификација на возилото.'
    },
    commercialBrand: {
      name: 'commercialBrand',
      type: 'text',
      label: 'Комерцијална ознака (модел)',
      placeholder: 'пр. 320d, E220, Golf',
      required: false,
      helpText: 'Внесете ја комерцијалната ознака или моделот на возилото (пр. 320d за BMW, Golf за Volkswagen). Оваа информација помага за попрецизна идентификација на возилото.'
    },
    chassisNumber: {
      name: 'chassisNumber',
      type: 'text',
      label: 'Број на шасија (VIN)',
      placeholder: 'пр. WVWZZZ1KZBW123456',
      required: true,
      helpText: 'Внесете го бројот на шасијата (VIN број) точно како што е наведен во сообраќајната дозвола. Овој број е единствена идентификација на возилото и е задолжителен за пренос на сопственоста.'
    },
    productionYear: {
      name: 'productionYear',
      type: 'number',
      label: 'Година на производство',
      placeholder: '2020',
      min: 1900,
      max: new Date().getFullYear() + 1,
      required: true,
      helpText: 'Внесете ја годината на производство на возилото според сообраќајната дозвола. Годината на производство влијае на пазарната вредност и даночните обврски.'
    },
    registrationNumber: {
      name: 'registrationNumber',
      type: 'text',
      label: 'Регистарски таблички',
      placeholder: 'пр. SK 1234 AA',
      required: true,
      helpText: 'Внесете ги тековните регистарски таблички на возилото. По склучувањето на договорот, новиот сопственик ќе треба да изврши препис на возилото со нови таблички.'
    },

    // Step 4 - Financial conditions
    price: {
      name: 'price',
      type: 'number',
      label: 'Договорена цена (во денари)',
      placeholder: '500000',
      min: 1,
      required: true,
      helpText: 'Внесете ја договорената цена за возилото во македонски денари без децимали. Цената треба да биде реална и соодветна на пазарната вредност на возилото за даночни цели.'
    },
    paymentMethod: {
      name: 'paymentMethod',
      type: 'select',
      label: 'Начин на плаќање',
      required: true,
      options: [
        { value: '', label: 'Изберете начин на плаќање' },
        { value: 'notary_day', label: 'На денот на заверката кај нотар' },
        { value: 'custom_date', label: 'На определен датум' }
      ],
      helpText: 'Изберете кога ќе се изврши плаќањето на договорената цена. Плаќањето на денот на заверката е најчест случај и обезбедува сигурност за двете страни.'
    },
    paymentDate: {
      name: 'paymentDate',
      type: 'date',
      label: 'Датум на плаќање',
      required: false,
      condition: { 
        field: 'paymentMethod', 
        operator: '===', 
        value: 'custom_date' 
      },
      helpText: 'Внесете го датумот кога треба да се изврши плаќањето. Овој датум треба да биде по потпишувањето на договорот и да овозможи доволно време за подготовка на средствата.'
    }
  },

  // Validation rules
  validationRules: [
    // Required fields
    {
      field: 'userRole',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Ваша улога во договорот'
    },
    {
      field: 'contractDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на склучување на договорот'
    },
    {
      field: 'placeOfSigning',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Место на потпишување на договорот'
    },
    {
      field: 'competentCourt',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Надлежен суд'
    },
    {
      field: 'otherPartyType',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Тип на другата договорна страна'
    },
    {
      field: 'otherPartyAddress',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Адреса на другата страна'
    },
    {
      field: 'vehicleType',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Тип на возило'
    },
    {
      field: 'vehicleBrand',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Марка на возилото'
    },
    {
      field: 'chassisNumber',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Број на шасија (VIN)'
    },
    {
      field: 'productionYear',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Година на производство'
    },
    {
      field: 'registrationNumber',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Регистарски таблички'
    },
    {
      field: 'price',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Договорена цена'
    },
    {
      field: 'paymentMethod',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Начин на плаќање'
    },

    // PIN validation
    {
      field: 'otherPartyPIN',
      type: VALIDATION_TYPES.PIN,
      label: 'ЕМБГ на другата страна'
    },

    // Conditional fields for other party - Natural person
    {
      field: 'otherPartyName',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Име и презиме на другата страна',
      condition: { field: 'otherPartyType', operator: '===', value: 'natural' }
    },
    {
      field: 'otherPartyPIN',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'ЕМБГ на другата страна',
      condition: { field: 'otherPartyType', operator: '===', value: 'natural' }
    },

    // Conditional fields for other party - Company
    {
      field: 'otherPartyCompanyName',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Име на компанијата',
      condition: { field: 'otherPartyType', operator: '===', value: 'company' }
    },
    {
      field: 'otherPartyTaxNumber',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'ЕДБ на компанијата',
      condition: { field: 'otherPartyType', operator: '===', value: 'company' }
    },
    {
      field: 'otherPartyManager',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Управител/претставник на компанијата',
      condition: { field: 'otherPartyType', operator: '===', value: 'company' }
    },

    // Conditional field for payment date
    {
      field: 'paymentDate',
      type: VALIDATION_TYPES.CONDITIONAL,
      label: 'Датум на плаќање',
      condition: { field: 'paymentMethod', operator: '===', value: 'custom_date' }
    }
  ],

  // Initial form data
  initialFormData: {
    userRole: '',
    contractDate: '',
    placeOfSigning: '',
    competentCourt: '',
    otherPartyType: '',
    otherPartyName: '',
    otherPartyCompanyName: '',
    otherPartyPIN: '',
    otherPartyTaxNumber: '',
    otherPartyManager: '',
    otherPartyAddress: '',
    vehicleType: '',
    vehicleBrand: '',
    commercialBrand: '',
    chassisNumber: '',
    productionYear: '',
    registrationNumber: '',
    price: '',
    paymentMethod: '',
    paymentDate: '',
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['userRole', 'contractDate', 'placeOfSigning', 'competentCourt'],
    2: ['otherPartyType', 'otherPartyName', 'otherPartyCompanyName', 'otherPartyPIN', 'otherPartyTaxNumber', 'otherPartyManager', 'otherPartyAddress'],
    3: ['vehicleType', 'vehicleBrand', 'commercialBrand', 'chassisNumber', 'productionYear', 'registrationNumber'],
    4: ['price', 'paymentMethod', 'paymentDate']
  };

  return fieldsByStep[stepId]?.map(fieldName => vehicleSalePurchaseAgreementConfig.fields[fieldName]) || [];
};

export default vehicleSalePurchaseAgreementConfig;