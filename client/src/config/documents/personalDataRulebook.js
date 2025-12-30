export const personalDataRulebookConfig = {
  documentType: 'businessSecretRulebook',
  apiEndpoint: 'business-secret-rulebook',
  fileName: null, // Will be auto-generated

  // Single-step form configuration
  steps: [
    {
      id: 1,
      title: 'Правилник за заштита на деловна тајна',
      description: 'Внесете ги сите податоци за правилникот',
      requiredFields: []
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1 - Basic Information
    effectiveDate: {
      name: 'effectiveDate',
      type: 'date',
      label: 'Датум на влегување во сила',
      required: false,
      helpText: 'Внесете го датумот кога правилникот за заштита на деловна тајна ќе влезе во сила. Согласно член 35 од Законот за работни односи, компаниите имаат право да определат кои податоци се сметаат за деловна тајна. Ако не се внесе датум, автоматски ќе се користи денешниот датум.'
    },

    // Protected Information
    productNameProtected: {
      name: 'productNameProtected',
      type: 'checkbox-with-text',
      label: 'Назив на заштитен производ/услуга',
      placeholder: 'Опишете ги заштитените информации',
      required: false,
      rows: 8,
      options: [
        {
          value: 'software',
          label: 'ИТ Софтвер и алгоритми',
          description: 'Софтверски код, алгоритми, технички решенија и програмски методи развиени од компанијата, вклучувајќи и изворен код, документација и технички спецификации.'
        },
        {
          value: 'mobile_app',
          label: 'Мобилни апликации',
          description: 'Мобилни апликации, нивните функционалности, дизајн, архитектура и сите поврзани технички детали што обезбедуваат конкурентска предност.'
        },
        {
          value: 'web_platform',
          label: 'Веб платформи и системи',
          description: 'Веб платформи, онлајн системи, нивната архитектура, база на податоци, интеграции и специфични технолошки решенија.'
        },
        {
          value: 'production_tech',
          label: 'Производствена технологија',
          description: 'Производствени процеси, технолошки постапки, методи на работа, специјализирани техники и know-how што го подобруваат квалитетот и ефикасноста на производството.'
        },
        {
          value: 'formulas',
          label: 'Хемиски формули и рецепти',
          description: 'Хемиски формули, рецепти, состави на производи, соодноси на суровини и специфични постапки за производство кои се резултат на истражување и развој.'
        },
        {
          value: 'business_strategy',
          label: 'Деловна стратегија',
          description: 'Деловни стратегии, планови за развој, маркетинг стратегии, ценовна политика, планови за експанзија и други стратешки информации.'
        },
        {
          value: 'marketing',
          label: 'Маркетинг кампањи',
          description: 'Маркетинг кампањи, креативни концепти, рекламни стратегии, анализи на пазарот и специфични методи за промоција на производи и услуги.'
        },
        {
          value: 'client_data',
          label: 'Клиентска база',
          description: 'База на клиенти, информации за договори, купувачки навики, историја на соработка, специфични потреби и преференции на клиентите.'
        },
        {
          value: 'financial_model',
          label: 'Финансиски модели',
          description: 'Финансиски модели, методи за калкулација, ценовни стратегии, трошоци на производство и други финансиски информации кои влијаат на конкурентноста.'
        },
        {
          value: 'design_brand',
          label: 'Дизајн и брендирање',
          description: 'Дизајнерски решенија, графички елементи, брендинг стратегии, визуелен идентитет и сите креативни елементи кои го издвојуваат брендот на пазарот.'
        }
      ],
      helpText: 'Изберете една или повеќе категории на заштитени информации. Можете да го уредите текстот за да ги прилагодите описите според вашите специфични потреби.'
    },

    // Step 3 - Additional Terms
    confidentialityPeriod: {
      name: 'confidentialityPeriod',
      type: 'select',
      label: 'Период на доверливост по престанок на работен однос',
      required: false,
      options: [
        { value: '1', label: '1 година' },
        { value: '2', label: '2 години (стандардно)' },
        { value: '3', label: '3 години' },
        { value: '5', label: '5 години' }
      ],
      defaultValue: '2',
      helpText: 'Изберете колку долго вработените се обврзани да чуваат доверливост по престанок на работниот однос. Стандардниот рок според правилникот е 2 години, но раководните лица можат да определат подолг рок за специфични деловни тајни според важноста на информациите.'
    },
    
    additionalProtections: {
      name: 'additionalProtections',
      type: 'checkbox',
      label: 'Дополнителни мерки за заштита',
      required: false,
      options: [
        { value: 'physicalSecurity', label: 'Зајакната физичка безбедност за документи' },
        { value: 'digitalSecurity', label: 'Дополнителни мерки за електронски документи' },
        { value: 'accessControl', label: 'Ограничен пристап според оддели' },
        { value: 'ndaRequired', label: 'Задолжителни договори за доверливост со трети лица' }
      ],
      helpText: 'Изберете дополнителни мерки за заштита кои вашата компанија ги применува или планира да ги примени. Овие мерки ќе бидат вклучени во правилникот како дел од безбедносната политика за заштита на деловни тајни и know-how.'
    }
  },

  // Initial form data
  initialFormData: {
    effectiveDate: '',
    productNameProtected: '',
    confidentialityPeriod: '2',
    additionalProtections: [],
    acceptTerms: false
  }
};

// Helper function to get fields for a specific step
export const getStepFields = (stepId) => {
  const fieldsByStep = {
    1: ['effectiveDate', 'productNameProtected', 'confidentialityPeriod', 'additionalProtections']
  };

  return fieldsByStep[stepId]?.map(fieldName => personalDataRulebookConfig.fields[fieldName]) || [];
};

export default personalDataRulebookConfig;