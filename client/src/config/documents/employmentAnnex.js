import { VALIDATION_TYPES } from '../../utils/documentValidation';

/**
 * Employment Annex Document Configuration
 * This configuration drives the entire form behavior, validation, and API integration
 * Supports different types of employment agreement amendments
 */
export const employmentAnnexConfig = {
  documentType: 'employmentAnnex',
  apiEndpoint: 'employment-annex',
  fileName: null, // Will be auto-generated

  // Multi-step form configuration
  steps: [
    {
      id: 1,
      title: 'Основни податоци',
      description: 'Внесете ги основните податоци за договорот и работникот',
      requiredFields: ['agreementNo', 'annexDate', 'employeeName', 'employeePIN', 'employeeAddress']
    },
    {
      id: 2,
      title: 'Тип на измена',
      description: 'Изберете го типот на измена што сакате да ја направите',
      requiredFields: ['changeType']
    },
    {
      id: 3,
      title: 'Детали за измената',
      description: 'Внесете ги деталите за избраната измена',
      requiredFields: [] // Dynamic based on changeType
    }
  ],

  // Form fields configuration
  fields: {
    // Step 1: Basic Information
    agreementNo: {
      name: 'agreementNo',
      type: 'text',
      label: 'Број на оригиналниот договор за вработување',
      placeholder: 'пр. 001/2024',
      required: true,
      helpText: 'Внесете го бројот на договорот за вработување кој се менува'
    },
    annexDate: {
      name: 'annexDate',
      type: 'date',
      label: 'Датум на анексот',
      placeholder: '',
      required: true,
      helpText: 'Датумот кога се потпишува анексот'
    },
    employeeName: {
      name: 'employeeName',
      type: 'text',
      label: 'Име и презиме на работникот',
      placeholder: 'пр. Марко Петровски',
      required: true
    },
    employeePIN: {
      name: 'employeePIN',
      type: 'text',
      label: 'ЕМБГ на работникот',
      placeholder: 'пр. 0101990000000',
      required: true,
      maxLength: 13,
      pattern: /^\d{13}$/,
      inputMode: 'numeric',
      helpText: 'Внесете го ЕМБГ-то (точно 13 цифри)'
    },
    employeeAddress: {
      name: 'employeeAddress',
      type: 'text',
      label: 'Адреса на работникот',
      placeholder: 'пр. ул. Македонија 1, Скопје',
      required: true,
      helpText: 'Целосна адреса на живеење на работникот'
    },

    // Step 2: Change Type
    changeType: {
      name: 'changeType',
      type: 'radio',
      label: 'Тип на измена',
      required: true,
      options: [
        {
          value: 'agreementDuration',
          label: 'Измена на времетраење на договорот',
          description: 'Променете го крајниот датум на договорот за вработување'
        },
        {
          value: 'basicSalary',
          label: 'Измена на основната плата',
          description: 'Променете ја основната плата наведена во договорот'
        },
        {
          value: 'jobPosition',
          label: 'Измена на работната позиција',
          description: 'Променете ја работната позиција/должност'
        },
        {
          value: 'otherAgreementChange',
          label: 'Друга измена',
          description: 'Измена на некој друг член од договорот'
        }
      ]
    },

    // Step 3: Change-specific fields
    // For agreementDuration - Duration type selection
    durationType: {
      name: 'durationType',
      type: 'radio',
      label: 'Тип на времетраење',
      required: false, // Made dynamic based on changeType
      options: [
        {
          value: 'indefinite',
          label: 'Неопределено време',
          description: 'Договорот се менува на неопределено време'
        },
        {
          value: 'definite',
          label: 'Определено време', 
          description: 'Договорот се менува на определено време со конкретен краен датум'
        }
      ],
      showWhen: (formData) => formData.changeType === 'agreementDuration'
    },
    
    // For agreementDuration - End date (only if definite)
    endDate: {
      name: 'endDate',
      type: 'date',
      label: 'Нов датум на престанок на договорот',
      placeholder: '',
      required: false, // Made dynamic based on changeType and durationType
      min: new Date().toISOString().split('T')[0], // Must be in the future
      helpText: 'Новиот датум кога ќе престане договорот за вработување',
      showWhen: (formData) => formData.changeType === 'agreementDuration' && formData.durationType === 'definite'
    },
    
    // Article number for duration change
    durationChangedArticle: {
      name: 'durationChangedArticle',
      type: 'text',
      label: 'Член кој се менува',
      placeholder: 'пр. Член 3 од договорот за вработување',
      required: false, // Made dynamic based on changeType
      helpText: 'Наведете го членот од договорот кој се однесува на времетраење',
      showWhen: (formData) => formData.changeType === 'agreementDuration'
    },

    // For basicSalary
    newBasicSalary: {
      name: 'newBasicSalary',
      type: 'number',
      label: 'Нова основна плата (во денари)',
      placeholder: 'пр. 35000',
      required: false, // Made dynamic based on changeType
      min: 1,
      step: 1,
      helpText: 'Внесете ја новата основна плата во денари',
      showWhen: (formData) => formData.changeType === 'basicSalary'
    },
    
    // Article number for salary change
    salaryChangedArticle: {
      name: 'salaryChangedArticle',
      type: 'text',
      label: 'Член кој се менува',
      placeholder: 'пр. Член 4 од договорот за вработување',
      required: false, // Made dynamic based on changeType
      helpText: 'Наведете го членот од договорот кој се однесува на платата',
      showWhen: (formData) => formData.changeType === 'basicSalary'
    },

    // For jobPosition
    newJobPosition: {
      name: 'newJobPosition',
      type: 'text',
      label: 'Нова работна позиција',
      placeholder: 'пр. Виш софтверски инженер',
      required: false, // Made dynamic based on changeType
      helpText: 'Внесете ја новата работна позиција/должност',
      showWhen: (formData) => formData.changeType === 'jobPosition'
    },
    
    // New job tasks for position change
    newJobTasks: {
      name: 'newJobTasks',
      type: 'textarea',
      label: 'Нови работни задачи/обврски',
      placeholder: 'Опишете ги новите работни задачи и одговорности...',
      required: false, // Made dynamic based on changeType
      rows: 4,
      maxLength: 1000,
      helpText: 'Детален опис на новите работни задачи и одговорности',
      showWhen: (formData) => formData.changeType === 'jobPosition'
    },
    
    // Article number for position change
    positionChangedArticle: {
      name: 'positionChangedArticle',
      type: 'text',
      label: 'Член кој се менува',
      placeholder: 'пр. Член 2 од договорот за вработување',
      required: false, // Made dynamic based on changeType
      helpText: 'Наведете го членот од договорот кој се однесува на работната позиција',
      showWhen: (formData) => formData.changeType === 'jobPosition'
    },

    // For otherAgreementChange
    changedArticle: {
      name: 'changedArticle',
      type: 'text',
      label: 'Член кој се менува',
      placeholder: 'пр. Член 5 од договорот за вработување',
      required: false, // Made dynamic based on changeType
      helpText: 'Наведете го членот или делот од договорот кој се менува',
      showWhen: (formData) => formData.changeType === 'otherAgreementChange'
    },
    otherAgreementChangeContent: {
      name: 'otherAgreementChangeContent',
      type: 'textarea',
      label: 'Нов текст на членот',
      placeholder: 'Внесете го новиот текст...',
      required: false, // Made dynamic based on changeType
      rows: 4,
      maxLength: 1000,
      helpText: 'Внесете го новиот текст на членот кој се менува',
      showWhen: (formData) => formData.changeType === 'otherAgreementChange'
    }
  },

  // Validation rules
  validationRules: [
    // Step 1 validations
    {
      field: 'agreementNo',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Број на оригиналниот договор за вработување'
    },
    {
      field: 'annexDate',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Датум на анексот'
    },
    {
      field: 'annexDate',
      type: VALIDATION_TYPES.DATE,
      label: 'Датум на анексот'
    },
    {
      field: 'employeeName',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Име и презиме на работникот'
    },
    {
      field: 'employeePIN',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'ЕМБГ на работникот'
    },
    {
      field: 'employeePIN',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'ЕМБГ на работникот',
      validator: (value) => {
        if (!value) return true; // Required validation handles empty values
        const cleanValue = value.replace(/\s/g, '');
        if (!/^\d{13}$/.test(cleanValue)) {
          return 'ЕМБГ мора да содржи точно 13 цифри';
        }
        return true;
      }
    },
    {
      field: 'employeeAddress',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Адреса на работникот'
    },

    // Step 2 validations
    {
      field: 'changeType',
      type: VALIDATION_TYPES.REQUIRED,
      label: 'Тип на измена'
    },

    // Step 3 conditional validations
    // Duration change validations
    {
      field: 'durationType',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Тип на времетраење',
      condition: (formData) => formData.changeType === 'agreementDuration'
    },
    {
      field: 'endDate',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Нов датум на престанок на договорот',
      condition: (formData) => formData.changeType === 'agreementDuration' && formData.durationType === 'definite'
    },
    {
      field: 'durationChangedArticle',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Член кој се менува (времетраење)',
      condition: (formData) => formData.changeType === 'agreementDuration'
    },
    {
      field: 'endDate',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Нов датум на престанок на договорот',
      validator: (value, formData) => {
        if (formData.changeType !== 'agreementDuration' || !value) return true;
        const endDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (endDate <= today) {
          return 'Датумот на престанок мора да биде во иднина';
        }
        return true;
      }
    },
    {
      field: 'newBasicSalary',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Нова основна плата',
      condition: (formData) => formData.changeType === 'basicSalary'
    },
    {
      field: 'salaryChangedArticle',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Член кој се менува (плата)',
      condition: (formData) => formData.changeType === 'basicSalary'
    },
    {
      field: 'newBasicSalary',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Нова основна плата',
      validator: (value, formData) => {
        if (formData.changeType !== 'basicSalary' || !value) return true;
        const salary = parseFloat(value);
        if (isNaN(salary) || salary <= 0) {
          return 'Внесете валидна сума поголема од 0';
        }
        return true;
      }
    },
    {
      field: 'newJobPosition',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Нова работна позиција',
      condition: (formData) => formData.changeType === 'jobPosition'
    },
    {
      field: 'newJobTasks',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Нови работни задачи/обврски',
      condition: (formData) => formData.changeType === 'jobPosition'
    },
    {
      field: 'positionChangedArticle',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Член кој се менува (позиција)',
      condition: (formData) => formData.changeType === 'jobPosition'
    },
    {
      field: 'changedArticle',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Член кој се менува',
      condition: (formData) => formData.changeType === 'otherAgreementChange'
    },
    {
      field: 'otherAgreementChangeContent',
      type: VALIDATION_TYPES.CONDITIONAL_REQUIRED,
      label: 'Нов текст на членот',
      condition: (formData) => formData.changeType === 'otherAgreementChange'
    },
    {
      field: 'otherAgreementChangeContent',
      type: VALIDATION_TYPES.CUSTOM,
      label: 'Нов текст на членот',
      validator: (value, formData) => {
        if (formData.changeType !== 'otherAgreementChange' || !value) return true;
        if (value.trim().length < 10) {
          return 'Новиот текст мора да содржи најмалку 10 знаци';
        }
        return true;
      }
    }
  ],

  // Initial form data - must match the field names exactly
  initialFormData: {
    agreementNo: '',
    annexDate: '',
    employeeName: '',
    employeePIN: '',
    employeeAddress: '',
    changeType: '',
    
    // Duration change fields
    durationType: '',
    endDate: '',
    durationChangedArticle: '',
    
    // Salary change fields
    newBasicSalary: '',
    salaryChangedArticle: '',
    
    // Position change fields
    newJobPosition: '',
    newJobTasks: '',
    positionChangedArticle: '',
    
    // Other change fields
    changedArticle: '',
    otherAgreementChangeContent: '',
    
    acceptTerms: false
  }
};

export default employmentAnnexConfig;