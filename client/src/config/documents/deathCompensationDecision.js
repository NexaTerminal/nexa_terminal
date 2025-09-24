import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Death Compensation Decision Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 */
export const deathCompensationDecisionConfig = {
  documentType: 'deathCompensationDecision',
  apiEndpoint: 'death-compensation-decision',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Податоци за вработениот и семејството',
      description: 'Внесете ги податоците за вработениот и починатиот член на семејно домаќинство',
      requiredFields: ['employeeName', 'familyMember']
    },
    {
      id: 2,
      title: 'Финансиски детали и датуми',
      description: 'Внесете го износот на надомест и релевантните датуми',
      requiredFields: ['compensationAmount', 'decisionDate', 'paymentDate']
    }
  ],

  // Form fields configuration
  fields: {
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на вработениот',
      placeholder: 'пр. Марко Петровски',
      required: true,
      helpText: 'Внесете го целосното име и презиме на вработениот кој има право на надомест според член 35 од Општиот колективен договор за приватниот сектор.'
    },
    familyMember: {
      name: 'familyMember',
      type: 'select',
      label: 'Починат член на семејно домаќинство',
      required: true,
      options: [
        { value: '', label: 'Изберете член на семејо' },
        { value: 'сопруг', label: 'Сопруг' },
        { value: 'сопруга', label: 'Сопруга' },
        { value: 'син', label: 'Син' },
        { value: 'ќерка', label: 'Ќерка' },
        { value: 'татко', label: 'Татко' },
        { value: 'мајка', label: 'Мајка' }
      ],
      helpText: 'Изберете го семејниот статус на починатиот член кој живеел во истата семејна заедница. Правото на надомест важи за сопруг/сопруга, деца и родители според важечките прописи.'
    },
    compensationAmount: {
      name: 'compensationAmount',
      type: 'number',
      label: 'Износ на надомест (во денари)',
      placeholder: 'пр. 80000',
      required: true,
      min: 1,
      helpText: 'Внесете го износот на надомест во висина од две месечни просечни нето плати исплатени во РСМ во последните три месеци. Податокот се добива од Државниот завод за статистика.'
    },
    decisionDate: {
      name: 'decisionDate',
      type: 'date',
      label: 'Датум на донесување на одлуката',
      required: true,
      helpText: 'Изберете го датумот кога се донесува оваа одлука за исплата на надомест. Ова е датумот кога работодавачот официјално го одобрува надоместот.'
    },
    paymentDate: {
      name: 'paymentDate',
      type: 'date',
      label: 'Датум на исплата',
      required: true,
      helpText: 'Изберете го датумот кога ќе се изврши исплатата на надоместот на вработениот. Датумот мора да биде по датумот на донесување на одлуката.'
    }
  },

  // Validation rules
  validationRules: [
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име и презиме на вработениот'
    },
    {
      field: 'familyMember',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Починат член на семејно домаќинство'
    },
    {
      field: 'compensationAmount',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Износ на надомест'
    },
    {
      field: 'compensationAmount',
      type: VALIDATION_TYPES.POSITIVE_NUMBER,
      label: 'Износ на надомест'
    },
    {
      field: 'decisionDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на донесување на одлуката'
    },
    {
      field: 'paymentDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на исплата'
    },
    {
      field: 'paymentDate',
      type: VALIDATION_TYPES.DATE_AFTER_FIELD,
      label: 'Датум на исплата',
      compareField: 'decisionDate',
      compareLabel: 'Датум на донесување на одлуката'
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    employeeName: '',
    familyMember: '',
    compensationAmount: '',
    decisionDate: '',
    paymentDate: '',
    acceptTerms: false
  }
};

export default deathCompensationDecisionConfig;