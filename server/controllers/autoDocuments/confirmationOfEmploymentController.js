const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateConfirmationOfEmploymentDoc = require('../../document_templates/employment/confirmationOfEmployment');

/**
 * Confirmation of Employment Controller
 * Uses the base controller factory for common functionality
 * Migrated to new architecture for consistency and maintainability
 */

// Define required fields for confirmation of employment
const REQUIRED_FIELDS = [
  'employeeName',
  'employeeAddress', 
  'employeePIN',
  'jobPosition',
  'agreementDurationType'
];

/**
 * Custom validation function for confirmation of employment
 */
const validateConfirmationOfEmployment = (formData, user, company) => {
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

  // Validate EMBG (must be exactly 13 digits)
  if (!validators.nonEmpty(formData.employeePIN)) {
    missing.push('ЕМБГ на работникот');
  } else if (!validators.pin(formData.employeePIN)) {
    errors.employeePIN = 'ЕМБГ мора да содржи точно 13 цифри';
  }

  // Validate job position
  if (!validators.nonEmpty(formData.jobPosition)) {
    missing.push('Работна позиција');
  }

  // Validate agreement duration type
  if (!validators.nonEmpty(formData.agreementDurationType)) {
    missing.push('Тип на договор');
  }

  // Conditional validation for defined duration
  if (formData.agreementDurationType === 'определено време' && !validators.nonEmpty(formData.definedDuration)) {
    missing.push('Краен датум на договор');
  } else if (formData.definedDuration && !validators.date(formData.definedDuration)) {
    errors.definedDuration = 'Внесете валиден датум';
  }

  // Check if company information is available
  if (!company || !company.companyName) {
    errors.company = 'Информациите за компанијата не се пополнети. Ве молиме пополнете ги во профилот.';
    missing.push('Информации за компанијата');
  }

  // Check required company fields
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

/**
 * Preprocess form data before document generation
 */
const preprocessConfirmationData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Clean up EMBG by removing spaces
  if (processed.employeePIN) {
    processed.employeePIN = processed.employeePIN.replace(/\s/g, '');
  }

  return processed;
};

// Create the confirmation of employment controller using the base factory
const confirmationOfEmploymentController = createDocumentController({
  templateFunction: generateConfirmationOfEmploymentDoc,
  requiredFields: [], // No required fields - allow generation with missing data
  documentName: 'потврда-за-вработување',
  validateFunction: null, // No validation - allow all submissions
  preprocessFunction: preprocessConfirmationData
});

module.exports = confirmationOfEmploymentController; 