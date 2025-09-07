const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateAnnualLeaveDecisionDoc = require('../../document_templates/employment/annualLeaveDecision');

/**
 * Annual Leave Decision Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [
  'employeeName',
  'employeePosition',
  'annualLeaveYear',
  'annualLeaveStart',
  'annualLeaveEnd'
];

/**
 * Custom validation function
 */
const validateAnnualLeave = (formData, user, company) => {
  const errors = {};
  const missing = [];

  // Validate employee name
  if (!validators.nonEmpty(formData.employeeName)) {
    missing.push('Име и презиме на работникот');
  }

  // Validate employee position
  if (!validators.nonEmpty(formData.employeePosition)) {
    missing.push('Работна позиција');
  }

  // Validate annual leave year
  if (!validators.nonEmpty(formData.annualLeaveYear)) {
    missing.push('Година за годишен одмор');
  } else if (!validators.number(formData.annualLeaveYear) || parseInt(formData.annualLeaveYear) < 2000 || parseInt(formData.annualLeaveYear) > 2050) {
    errors.annualLeaveYear = 'Внесете валидна година (2000-2050)';
  }

  // Validate start date
  if (!validators.nonEmpty(formData.annualLeaveStart)) {
    missing.push('Датум на почеток на одморот');
  } else if (!validators.date(formData.annualLeaveStart)) {
    errors.annualLeaveStart = 'Внесете валиден датум на почеток';
  }

  // Validate end date
  if (!validators.nonEmpty(formData.annualLeaveEnd)) {
    missing.push('Датум на завршување на одморот');
  } else if (!validators.date(formData.annualLeaveEnd)) {
    errors.annualLeaveEnd = 'Внесете валиден датум на завршување';
  }

  // Validate date sequence (start before end)
  if (validators.date(formData.annualLeaveStart) && validators.date(formData.annualLeaveEnd)) {
    const startDate = new Date(formData.annualLeaveStart);
    const endDate = new Date(formData.annualLeaveEnd);
    if (startDate >= endDate) {
      errors.annualLeaveEnd = 'Датумот на завршување мора да биде после датумот на почеток';
    }
  }

  // Validate company data
  if (!company || !company.companyName) {
    errors.company = 'Информациите за компанијата не се пополнети. Ве молиме пополнете ги во профилот.';
    missing.push('Информации за компанијата');
  }

  // Check required company fields for better error messages
  if (company) {
    if (!company.companyName || company.companyName.trim() === '') {
      missing.push('Име на компанијата');
    }
    if (!company.address || company.address.trim() === '') {
      missing.push('Адреса на компанијата');
    }
    if (!company.taxNumber || company.taxNumber.trim() === '') {
      missing.push('Даночен број на компанијата');
    }
    if (!company.manager || company.manager.trim() === '') {
      missing.push('Управител на компанијата');
    }
  }

  return {
    isValid: missing.length === 0 && Object.keys(errors).length === 0,
    missing,
    errors,
    message: missing.length > 0 ? `Недостасуваат задолжителни полиња: ${missing.join(', ')}` : null
  };
};

// Create the controller using the base factory
const annualLeaveController = createDocumentController({
  templateFunction: generateAnnualLeaveDecisionDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'annual-leave-decision',
  validateFunction: validateAnnualLeave
});

module.exports = annualLeaveController; 