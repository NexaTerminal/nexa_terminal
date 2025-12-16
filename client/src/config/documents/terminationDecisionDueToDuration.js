/**
 * Configuration for Termination Decision Due To Duration Document (Одлука за престанок поради истек на времето)
 */

export const terminationDecisionDueToDurationConfig = {
  documentType: 'terminationDecisionDueToDuration',
  endpoint: '/auto-documents/termination-decision-due-to-duration',
  steps: [
    {
      id: 1,
      title: 'Основни информации',
      description: 'Внесете ги потребните податоци за одлуката за престанок на работниот однос поради истек на времето',
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
          name: 'jobPosition',
          label: 'Работна позиција',
          type: 'text',
          required: true,
          placeholder: 'пр. Административен референт'
        },
        {
          name: 'employmentEndDate',
          label: 'Датум на престанок на работниот однос',
          type: 'date',
          required: true
        },
        {
          name: 'decisionDate',
          label: 'Датум на одлуката',
          type: 'date',
          required: true
        },
        {
          name: 'agreementDate',
          label: 'Датум на склучување на договорот за вработување',
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
  const step = terminationDecisionDueToDurationConfig.steps.find(s => s.id === stepId);
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

  if (!formData.jobPosition?.trim()) {
    errors.jobPosition = 'Ова поле е задолжително';
  }

  if (!formData.employmentEndDate?.trim()) {
    errors.employmentEndDate = 'Ова поле е задолжително';
  }

  if (!formData.decisionDate?.trim()) {
    errors.decisionDate = 'Ова поле е задолжително';
  }

  if (!formData.agreementDate?.trim()) {
    errors.agreementDate = 'Ова поле е задолжително';
  }

  return errors;
};

export default terminationDecisionDueToDurationConfig;