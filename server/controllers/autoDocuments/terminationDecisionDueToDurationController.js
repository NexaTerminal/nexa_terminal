const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateTerminationDecisionDueToDurationDoc = require('../../document_templates/employment/terminationDecisionDueToDuration');

/**
 * Termination Decision Due to Duration Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [
  'employeeName',
  'jobPosition',
  'employmentEndDate',
  'decisionDate',
  'agreementDate'
];

/**
 * Custom validation function
 */
const validateTerminationDecision = (formData, user, company) => {
  const errors = {};
  const missing = [];

  // Validate employee name
  if (!validators.nonEmpty(formData.employeeName)) {
    missing.push('Име и презиме на работникот');
  }

  // Validate job position
  if (!validators.nonEmpty(formData.jobPosition)) {
    missing.push('Работна позиција');
  }

  // Validate employment end date
  if (!validators.nonEmpty(formData.employmentEndDate)) {
    missing.push('Датум на истек на договорот за вработување');
  } else if (!validators.date(formData.employmentEndDate)) {
    errors.employmentEndDate = 'Внесете валиден датум на истек';
  }

  // Validate decision date
  if (!validators.nonEmpty(formData.decisionDate)) {
    missing.push('Датум на донесување на одлуката');
  } else if (!validators.date(formData.decisionDate)) {
    errors.decisionDate = 'Внесете валиден датум на одлуката';
  }

  // Validate agreement date
  if (!validators.nonEmpty(formData.agreementDate)) {
    missing.push('Датум на склучување на договорот');
  } else if (!validators.date(formData.agreementDate)) {
    errors.agreementDate = 'Внесете валиден датум на склучување';
  }

  // Validate date sequence (agreement before end, decision before or on end)
  if (validators.date(formData.agreementDate) && validators.date(formData.employmentEndDate)) {
    const agreementDate = new Date(formData.agreementDate);
    const endDate = new Date(formData.employmentEndDate);
    if (agreementDate >= endDate) {
      errors.agreementDate = 'Датумот на склучување мора да биде пред датумот на истек';
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
const terminationDecisionController = createDocumentController({
  templateFunction: generateTerminationDecisionDueToDurationDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'termination-decision-due-to-duration',
  validateFunction: validateTerminationDecision
});

module.exports = terminationDecisionController;