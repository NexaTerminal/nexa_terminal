const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateWarningLetterDoc = require('../../document_templates/employment/warningLetter');

/**
 * Warning Letter Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [
  'employeeName',
  'warningDate',
  'employeeWrongDoing',
  'rulesNotRespected',
  'articleNumber'
];

/**
 * Custom validation function
 */
const validateWarningLetter = (formData, user, company) => {
  const errors = {};
  const missing = [];

  // Validate employee name
  if (!validators.nonEmpty(formData.employeeName)) {
    missing.push('Име и презиме на работникот');
  }

  // Validate warning date
  if (!validators.nonEmpty(formData.warningDate)) {
    missing.push('Датум на опомената');
  } else if (!validators.date(formData.warningDate)) {
    errors.warningDate = 'Внесете валиден датум на опомената';
  }

  // Validate employee wrongdoing
  if (!validators.nonEmpty(formData.employeeWrongDoing)) {
    missing.push('Опис на неправилното однесување на работникот');
  }

  // Validate rules not respected
  if (!validators.nonEmpty(formData.rulesNotRespected)) {
    missing.push('Опис на правилата кои не се почитуваат');
  }

  // Validate article number
  if (!validators.nonEmpty(formData.articleNumber)) {
    missing.push('Член од правилникот');
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
const warningLetterController = createDocumentController({
  templateFunction: generateWarningLetterDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'warning-letter-employee',
  validateFunction: validateWarningLetter
});

module.exports = warningLetterController;