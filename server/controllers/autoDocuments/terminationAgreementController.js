const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateTerminationAgreementDoc = require('../../document_templates/employment/terminationAgreement');

/**
 * Termination Agreement Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [
  'employeeName',
  'employeePIN',
  'employeeAddress',
  'endDate'
];

/**
 * Custom validation function
 */
const validateTerminationAgreement = (formData, user, company) => {
  const errors = {};
  const missing = [];

  // Validate employee name
  if (!validators.nonEmpty(formData.employeeName)) {
    missing.push('Име и презиме на работникот');
  }

  // Validate employee PIN
  if (!validators.nonEmpty(formData.employeePIN)) {
    missing.push('ЕМБГ на работникот');
  } else if (!validators.pin(formData.employeePIN)) {
    errors.employeePIN = 'ЕМБГ мора да содржи точно 13 цифри';
  }

  // Validate employee address
  if (!validators.nonEmpty(formData.employeeAddress)) {
    missing.push('Адреса на работникот');
  }

  // Validate end date
  if (!validators.nonEmpty(formData.endDate)) {
    missing.push('Датум на престанок на работниот однос');
  } else if (!validators.date(formData.endDate)) {
    errors.endDate = 'Внесете валиден датум';
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
const terminationAgreementController = createDocumentController({
  templateFunction: generateTerminationAgreementDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'termination-agreement',
  validateFunction: validateTerminationAgreement
});

module.exports = terminationAgreementController; 