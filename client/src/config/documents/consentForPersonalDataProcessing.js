/**
 * Configuration for Consent For Personal Data Processing Document (Согласност за обработка на лични податоци)
 */

export const consentForPersonalDataProcessingConfig = {
  documentType: 'consentForPersonalDataProcessing',
  apiEndpoint: 'consent-for-personal-data-processing',
  steps: [
    {
      id: 1,
      title: 'Основни информации за вработениот',
      description: 'Внесете ги основните податоци за вработениот кој дава согласност',
      fields: [
        {
          name: 'employeeName',
          label: 'Име и презиме на вработениот',
          type: 'text',
          required: true,
          placeholder: 'пр. Марко Петровски',
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          name: 'employeeAddress',
          label: 'Адреса на вработениот',
          type: 'text',
          required: true,
          placeholder: 'пр. ул. Македонија бр. 123, Скопје'
        },
        {
          name: 'employeeWorkPosition',
          label: 'Работна позиција',
          type: 'text',
          required: true,
          placeholder: 'пр. Софтверски инженер'
        }
      ]
    }
  ]
};

/**
 * Get fields for a specific step
 */
export const getStepFields = (stepId) => {
  const step = consentForPersonalDataProcessingConfig.steps.find(s => s.id === stepId);
  return step ? step.fields : [];
};

/**
 * Validate form data
 */
export const validateFormData = (formData) => {
  const errors = {};

  if (!formData.employeeName?.trim()) {
    errors.employeeName = 'Ова поле е задолжително';
  }

  if (!formData.employeeAddress?.trim()) {
    errors.employeeAddress = 'Ова поле е задолжително';
  }

  if (!formData.employeeWorkPosition?.trim()) {
    errors.employeeWorkPosition = 'Ова поле е задолжително';
  }

  return errors;
};

export default consentForPersonalDataProcessingConfig;
