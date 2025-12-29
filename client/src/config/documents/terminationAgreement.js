/**
 * Configuration for Termination Agreement Document (Спогодба за престанок на работен однос)
 */

export const terminationAgreementConfig = {
  documentType: 'terminationAgreement',
  apiEndpoint: 'termination-agreement',
  steps: [
    {
      id: 1,
      title: 'Основни информации за вработениот',
      description: 'Внесете ги основните податоци за вработениот кој престанува со работа',
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
          name: 'employeePIN',
          label: 'ЕМБГ на вработениот',
          type: 'text',
          required: true,
          placeholder: 'пр. 1234567890123',
          validation: {
            pattern: /^\d{13}$/,
            message: 'ЕМБГ мора да содржи точно 13 цифри'
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
          name: 'endDate',
          label: 'Датум на престанок',
          type: 'date',
          required: true
        }
      ]
    }
  ]
};

/**
 * Get fields for a specific step
 */
export const getStepFields = (stepId) => {
  const step = terminationAgreementConfig.steps.find(s => s.id === stepId);
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

  if (!formData.employeePIN?.trim()) {
    errors.employeePIN = 'Ова поле е задолжително';
  } else if (!/^\d{13}$/.test(formData.employeePIN)) {
    errors.employeePIN = 'ЕМБГ мора да содржи точно 13 цифри';
  }

  if (!formData.employeeAddress?.trim()) {
    errors.employeeAddress = 'Ова поле е задолжително';
  }

  if (!formData.endDate?.trim()) {
    errors.endDate = 'Ова поле е задолжително';
  }

  return errors;
};

export default terminationAgreementConfig;
