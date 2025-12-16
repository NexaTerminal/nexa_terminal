/**
 * Configuration for Consent For Personal Data Processing Document (!>3;0A=>AB 70 >1@01>B:0 =0 ;8G=8 ?>40B>F8)
 */

export const consentForPersonalDataProcessingConfig = {
  documentType: 'consentForPersonalDataProcessing',
  endpoint: '/auto-documents/consent-for-personal-data-processing',
  steps: [
    {
      id: 1,
      title: 'A=>2=8 8=D>@<0F88 70 2@01>B5=8>B',
      description: '=5A5B5 38 >A=>2=8B5 ?>40B>F8 70 2@01>B5=8>B :>X 4020 A>3;0A=>AB',
      fields: [
        {
          name: 'employeeName',
          label: '<5 8 ?@578<5 =0 2@01>B5=8>B',
          type: 'text',
          required: true,
          placeholder: '?@. 0@:> 5B@>2A:8',
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          name: 'employeeAddress',
          label: '4@5A0 =0 2@01>B5=8>B',
          type: 'text',
          required: true,
          placeholder: '?@. C;. 0:54>=8X0 1@. 123, !:>?X5'
        },
        {
          name: 'employeeWorkPosition',
          label: ' 01>B=0 ?>78F8X0',
          type: 'text',
          required: true,
          placeholder: '?@. !>DB25@A:8 8=65=5@'
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
    errors.employeeName = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.employeeAddress?.trim()) {
    errors.employeeAddress = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.employeeWorkPosition?.trim()) {
    errors.employeeWorkPosition = '20 ?>;5 5 704>;68B5;=>';
  }

  return errors;
};

export default consentForPersonalDataProcessingConfig;
