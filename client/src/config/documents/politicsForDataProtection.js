/**
 * Configuration for Politics For Data Protection Document (Политика за заштита на лични податоци)
 */

export const politicsForDataProtectionConfig = {
  documentType: 'politicsForDataProtection',
  apiEndpoint: 'politics-for-data-protection',
  steps: [
    {
      id: 1,
      title: 'Политика за заштита на лични податоци',
      description: 'Создавање на политика за заштита на лични податоци со избор на применливи категории податоци',
      fields: [
        {
          name: 'effectiveDate',
          label: 'Датум на влегување во сила',
          type: 'date',
          required: false,
          helpText: 'Изберете го датумот кога политиката за заштита на лични податоци официјално ќе влезе во сила во вашата компанија. Ова е правно значајниот датум за почеток на примена на политиката.'
        },
        {
          name: 'dataGroups',
          label: 'Категории на лични податоци кои ги обработува компанијата',
          type: 'custom',
          required: false,
          helpText: 'Изберете ги категориите на лични податоци кои вашата компанија ги обработува во рамките на својата деловна активност. Оваа информација е задолжителна за правилно дефинирање на обемот на политиката според GDPR и домашната легислатива за заштита на лични податоци.'
        }
      ]
    }
  ]
};

/**
 * Get fields for a specific step
 */
export const getStepFields = (stepId) => {
  const step = politicsForDataProtectionConfig.steps.find(s => s.id === stepId);
  return step ? step.fields : [];
};

/**
 * Validate form data
 */
export const validateFormData = (formData) => {
  const errors = {};
  // No required validation - allow empty generation
  return errors;
};

export default politicsForDataProtectionConfig;