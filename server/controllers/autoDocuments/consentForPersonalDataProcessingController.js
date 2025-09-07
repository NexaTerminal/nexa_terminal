const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateConsentForPersonalDataProcessingDoc = require('../../document_templates/personalDataProtection/consentForPersonalDataProcessing');

/**
 * Consent for Personal Data Processing Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [
  'employeeName',
  'employeeAddress', 
  'employeeWorkPosition'
];

/**
 * Custom validation function
 */
const validateConsent = (formData, user, company) => {
  const errors = {};
  const missing = [];

  // Validate employee name
  if (!validators.nonEmpty(formData.employeeName)) {
    missing.push('Име и презиме на работникот');
  }

  // Validate employee address
  if (!validators.nonEmpty(formData.employeeAddress)) {
    missing.push('Адреса на работникот');
  }

  // Validate employee work position
  if (!validators.nonEmpty(formData.employeeWorkPosition)) {
    missing.push('Работна позиција');
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
  }

  return {
    isValid: missing.length === 0 && Object.keys(errors).length === 0,
    missing,
    errors,
    message: missing.length > 0 ? `Недостасуваат задолжителни полиња: ${missing.join(', ')}` : null
  };
};

// Create the controller using the base factory
const consentController = createDocumentController({
  templateFunction: generateConsentForPersonalDataProcessingDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'consent-for-personal-data',
  validateFunction: validateConsent
});

module.exports = consentController; 