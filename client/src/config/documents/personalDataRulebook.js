export const personalDataRulebookConfig = {
  documentType: 'personalDataRulebook',
  apiEndpoint: 'personal-data-rulebook',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни информации',
      description: 'Основни информации за правилникот за заштита на деловна тајна',
      requiredFields: []
    },
    {
      id: 2,
      title: 'Заштитени информации',
      description: 'Дефиниции на заштитени производи и услуги',
      requiredFields: []
    },
    {
      id: 3,
      title: 'Дополнителни одредби',
      description: 'Дополнителни мерки и рокови на доверливост',
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

    // Step 2 - Protected Information
    productNameProtected: {
      name: 'productNameProtected',
      type: 'text',
      label: 'Назив на заштитен производ/услуга',
      required: false,
      helpText: 'Внесете го називот на специфичен производ, услуга или процес кој е клучен за вашата компанија и чии детали се сметаат за деловна тајна. Ова може да биде технологија, формула, процедура или било што друго што ви дава конкурентна предност. Ако не се внесе, ќе се користи општ термин.'
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
    1: ['effectiveDate'],
    2: ['productNameProtected'],
    3: ['confidentialityPeriod', 'additionalProtections']
  };

  return fieldsByStep[stepId]?.map(fieldName => personalDataRulebookConfig.fields[fieldName]) || [];
};

export default personalDataRulebookConfig;