const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationDueToAgeLimitDoc = require('../../document_templates/employment/terminationDueToAgeLimit');

/**
 * Termination Due to Age Limit Controller
 * Uses the base controller factory for common functionality
 * Handles termination decisions for employees reaching retirement age
 */

// Define required fields for termination due to age limit
const REQUIRED_FIELDS = [
  'employeeName',
  'employeePin', 
  'decisionDate',
  'employmentEndDate'
];

/**
 * Custom validation function for termination due to age limit
 */
const validateTerminationDueToAgeLimit = (formData, user, company) => {
  const errors = {};
  const missing = [];

  // Validate employee name
  if (!validators.nonEmpty(formData.employeeName)) {
    missing.push('Име и презиме на работникот');
  }

  // Validate employee PIN (EMBG) - exactly 13 digits
  if (!validators.nonEmpty(formData.employeePin)) {
    missing.push('ЕМБГ на работникот');
  } else if (!validators.pin(formData.employeePin)) {
    errors.employeePin = 'ЕМБГ мора да содржи точно 13 цифри';
  }

  // Validate decision date
  if (!validators.nonEmpty(formData.decisionDate)) {
    missing.push('Датум на одлука');
  } else if (!validators.date(formData.decisionDate)) {
    errors.decisionDate = 'Внесете валиден датум';
  }

  // Validate employment end date
  if (!validators.nonEmpty(formData.employmentEndDate)) {
    missing.push('Датум на престанок на работен однос');
  } else if (!validators.date(formData.employmentEndDate)) {
    errors.employmentEndDate = 'Внесете валиден датум';
  }

  // Validate that employment end date is after decision date
  if (formData.decisionDate && formData.employmentEndDate && validators.date(formData.decisionDate) && validators.date(formData.employmentEndDate)) {
    const decisionDateObj = new Date(formData.decisionDate);
    const employmentEndDateObj = new Date(formData.employmentEndDate);
    
    if (employmentEndDateObj < decisionDateObj) {
      errors.employmentEndDate = 'Датумот на престанок мора да биде после или ист со датумот на одлуката';
    }
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
const preprocessTerminationDueToAgeLimitData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.decisionDate) {
    processed.decisionDate = new Date(processed.decisionDate).toISOString().split('T')[0];
  }
  
  if (processed.employmentEndDate) {
    processed.employmentEndDate = new Date(processed.employmentEndDate).toISOString().split('T')[0];
  }

  // Clean and validate PIN
  if (processed.employeePin) {
    processed.employeePin = processed.employeePin.toString().replace(/\D/g, ''); // Remove non-digits
  }

  return processed;
};

// Create the termination due to age limit controller using the base factory
const terminationDueToAgeLimitController = createDocumentController({
  templateFunction: generateTerminationDueToAgeLimitDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'решение-за-престанок-поради-возраст',
  validateFunction: validateTerminationDueToAgeLimit,
  preprocessFunction: preprocessTerminationDueToAgeLimitData
});

module.exports = terminationDueToAgeLimitController;