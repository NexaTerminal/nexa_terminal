const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationPersonalReasonsDoc = require('../../document_templates/employment/terminationPersonalReasons');

/**
 * Termination Decision Due to Personal Reasons Controller
 * Uses the base controller factory for common functionality
 * Handles termination decisions for personal reasons on employee's side
 */

// Define required fields for termination decision due to personal reasons
const REQUIRED_FIELDS = [
  'employeeName',
  'employeePin',
  'employeeAddress',
  'jobPosition', 
  'contractStartDate',
  'terminationDate',
  'personalReasonDescription',
  'documentDate'
];

/**
 * Custom validation function for termination due to personal reasons
 */
const validateTerminationPersonalReasons = (formData, user, company) => {
  const errors = {};
  const missing = [];
  const warnings = [];

  // Validate employee name
  if (!validators.nonEmpty(formData.employeeName)) {
    missing.push('Име и презиме на работникот');
  }

  // Validate employee PIN (exactly 13 digits for Macedonia)
  if (!validators.nonEmpty(formData.employeePin)) {
    missing.push('ЕМБГ на работникот');
  } else if (!validators.pin(formData.employeePin)) {
    errors.employeePin = 'ЕМБГ мора да содржи точно 13 цифри';
  }

  // Validate employee address
  if (!validators.nonEmpty(formData.employeeAddress)) {
    missing.push('Адреса на работникот');
  }

  // Validate job position
  if (!validators.nonEmpty(formData.jobPosition)) {
    missing.push('Работна позиција');
  }

  // Validate contract start date
  if (!validators.nonEmpty(formData.contractStartDate)) {
    missing.push('Датум на започнување на договорот');
  } else if (!validators.date(formData.contractStartDate)) {
    errors.contractStartDate = 'Внесете валиден датум за започнување на договорот';
  }

  // Validate termination date
  if (!validators.nonEmpty(formData.terminationDate)) {
    missing.push('Датум на престанок на договорот');
  } else if (!validators.date(formData.terminationDate)) {
    errors.terminationDate = 'Внесете валиден датум за престанок на договорот';
  }

  // Validate document date
  if (!validators.nonEmpty(formData.documentDate)) {
    missing.push('Датум на документот');
  } else if (!validators.date(formData.documentDate)) {
    errors.documentDate = 'Внесете валиден датум на документот';
  }

  // Validate personal reason description
  if (!validators.nonEmpty(formData.personalReasonDescription)) {
    missing.push('Опис на личните причини');
  } else if (formData.personalReasonDescription.length < 20) {
    warnings.push('Описот на личните причини е кус. Препорачуваме подетален опис за правна сигурност.');
  }

  // Validate date logic
  if (formData.contractStartDate && formData.terminationDate && validators.date(formData.contractStartDate) && validators.date(formData.terminationDate)) {
    const startDate = new Date(formData.contractStartDate);
    const endDate = new Date(formData.terminationDate);
    
    if (endDate <= startDate) {
      errors.terminationDate = 'Датумот на престанок мора да биде после датумот на започнување';
    }
  }

  if (formData.documentDate && formData.terminationDate && validators.date(formData.documentDate) && validators.date(formData.terminationDate)) {
    const docDate = new Date(formData.documentDate);
    const termDate = new Date(formData.terminationDate);
    
    if (docDate > termDate) {
      warnings.push('Датумот на документот е после датумот на престанок. Проверете дали ова е точно.');
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

  // Return validation with warnings (allow generation with warnings)
  return {
    isValid: missing.length === 0 && Object.keys(errors).length === 0,
    missing,
    errors,
    warnings,
    message: missing.length > 0 ? `Недостасуваат задолжителни полиња: ${missing.join(', ')}` : null
  };
};

/**
 * Preprocess form data before document generation
 */
const preprocessTerminationPersonalReasonsData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.contractStartDate) {
    processed.contractStartDate = new Date(processed.contractStartDate).toISOString().split('T')[0];
  }
  
  if (processed.terminationDate) {
    processed.terminationDate = new Date(processed.terminationDate).toISOString().split('T')[0];
  }

  if (processed.documentDate) {
    processed.documentDate = new Date(processed.documentDate).toISOString().split('T')[0];
  }

  return processed;
};

// Create the termination personal reasons controller using the base factory
const terminationPersonalReasonsController = createDocumentController({
  templateFunction: generateTerminationPersonalReasonsDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'одлука-престанок-лични-причини',
  validateFunction: validateTerminationPersonalReasons,
  preprocessFunction: preprocessTerminationPersonalReasonsData
});

module.exports = terminationPersonalReasonsController;