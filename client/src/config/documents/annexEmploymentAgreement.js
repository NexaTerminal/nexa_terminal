/**
 * Configuration for Annex Employment Agreement Document (=5:A =0 >3>2>@ 70 @01>BC20Z5)
 */

export const annexEmploymentAgreementConfig = {
  documentType: 'annexEmploymentAgreement',
  endpoint: '/documents/generate/employment-annex',
  steps: [
    {
      id: 1,
      title: '>40B>F8 70 2@01>B5=',
      description: 'A=>2=8 8=D>@<0F88 70 2@01>B5=8>B',
      fields: [
        {
          name: 'fullName',
          label: '<5 8 ?@578<5',
          type: 'text',
          required: true,
          placeholder: '=5A5B5 8<5 8 ?@578<5 =0 2@01>B5=8>B'
        },
        {
          name: 'position',
          label: ' 01>B=0 ?>78F8X0',
          type: 'text',
          required: true,
          placeholder: '=5A5B5 @01>B=0 ?>78F8X0'
        },
        {
          name: 'employeeId',
          label: 'ID =0 2@01>B5=',
          type: 'text',
          required: true,
          placeholder: '=5A5B5 ID =0 2@01>B5='
        },
        {
          name: 'department',
          label: '445;',
          type: 'text',
          required: true,
          placeholder: '=5A5B5 >445;'
        },
        {
          name: 'email',
          label: '-<08;',
          type: 'email',
          required: true,
          placeholder: '=5A5B5 5-<08; =0 2@01>B5=8>B',
          validation: {
            pattern: /\S+@\S+\.\S+/,
            message: '=5A5B5 20;84=0 5-<08; 04@5A0'
          }
        },
        {
          name: 'phone',
          label: '"5;5D>=',
          type: 'text',
          required: true,
          placeholder: '=5A5B5 B5;5D>=A:8 1@>X =0 2@01>B5=8>B',
          validation: {
            pattern: /^\+?[\d\s\-\(\)]+$/,
            message: '=5A5B5 20;845= B5;5D>=A:8 1@>X'
          }
        }
      ]
    },
    {
      id: 2,
      title: '=D>@<0F88 70 4>3>2>@',
      description: '5B0;8 70 4>3>2>@>B 70 2@01>BC20Z5',
      fields: [
        {
          name: 'agreementType',
          label: '"8? =0 4>3>2>@',
          type: 'select',
          required: true,
          options: [
            { value: '', label: '715@5B5 B8? =0 4>3>2>@' },
            { value: 'Contract Extension', label: '@>4>;6C20Z5 =0 4>3>2>@' },
            { value: 'Salary Amendment', label: '7<5=0 =0 ?;0B0' },
            { value: 'Position Change', label: '@><5=0 =0 @01>B=0 ?>78F8X0' },
            { value: 'Department Transfer', label: '"@0=AD5@ 2> 4@C3 >445;' },
            { value: 'Working Hours Modification', label: '7<5=0 =0 @01>B=> 2@5<5' },
            { value: 'Benefits Amendment', label: '7<5=0 =0 15=5D8F88' },
            { value: 'Other', label: '@C3>' }
          ]
        },
        {
          name: 'effectiveDate',
          label: '0BC< =0 206=>AB',
          type: 'date',
          required: true
        },
        {
          name: 'duration',
          label: '@5<5B@05Z5',
          type: 'text',
          required: true,
          placeholder: '?@. 12 <5A5F8, 5>?@545;5=>, > 31 5:, 2025'
        },
        {
          name: 'compensation',
          label: ';0B0/04><5AB>:',
          type: 'text',
          required: true,
          placeholder: '?@. 30000  <5A5G=>, 360000  3>48H=>'
        },
        {
          name: 'benefits',
          label: '5=5D8F88',
          type: 'textarea',
          required: true,
          placeholder: '02545B5 38 15=5D8F88B5 (74@02AB25=> >A83C@C20Z5, 45=>28 70 >4<>@, 8B=.)',
          rows: 3
        },
        {
          name: 'specialTerms',
          label: '>A51=8 CA;>28',
          type: 'textarea',
          required: true,
          placeholder: '8;> :0:28 ?>A51=8 CA;>28 8;8 >4@5418 70 >2>X 4>3>2>@',
          rows: 4
        }
      ]
    }
  ]
};

/**
 * Get fields for a specific step
 */
export const getStepFields = (stepId) => {
  const step = annexEmploymentAgreementConfig.steps.find(s => s.id === stepId);
  return step ? step.fields : [];
};

/**
 * Validate form data
 */
export const validateFormData = (formData) => {
  const errors = {};

  // Step 1 validation
  if (!formData.fullName?.trim()) {
    errors.fullName = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.position?.trim()) {
    errors.position = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.employeeId?.trim()) {
    errors.employeeId = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.department?.trim()) {
    errors.department = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.email?.trim()) {
    errors.email = '20 ?>;5 5 704>;68B5;=>';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = '=5A5B5 20;84=0 5-<08; 04@5A0';
  }

  if (!formData.phone?.trim()) {
    errors.phone = '20 ?>;5 5 704>;68B5;=>';
  } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
    errors.phone = '=5A5B5 20;845= B5;5D>=A:8 1@>X';
  }

  // Step 2 validation
  if (!formData.agreementType?.trim()) {
    errors.agreementType = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.effectiveDate?.trim()) {
    errors.effectiveDate = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.duration?.trim()) {
    errors.duration = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.compensation?.trim()) {
    errors.compensation = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.benefits?.trim()) {
    errors.benefits = '20 ?>;5 5 704>;68B5;=>';
  }

  if (!formData.specialTerms?.trim()) {
    errors.specialTerms = '20 ?>;5 5 704>;68B5;=>';
  }

  return errors;
};

export default annexEmploymentAgreementConfig;
