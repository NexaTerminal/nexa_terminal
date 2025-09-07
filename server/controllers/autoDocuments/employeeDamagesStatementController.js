const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateEmployeeDamagesStatementDoc = require('../../document_templates/employment/employeeDamagesStatement');

/**
 * Employee Damages Statement Controller
 * Uses baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [
  'employeeName',
  'jobPosition',
  'decisionDate',
  'damages',
  'amount'
];

/**
 * Custom validation function
 */
const validateEmployeeDamagesStatement = (formData, user, company) => {
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

  // Validate decision date
  if (!validators.nonEmpty(formData.decisionDate)) {
    missing.push('Датум на изјавата');
  } else if (!validators.date(formData.decisionDate)) {
    errors.decisionDate = 'Внесете валиден датум на изјавата';
  }

  // Validate damages description
  if (!validators.nonEmpty(formData.damages)) {
    missing.push('Опис на штетата');
  }

  // Validate amount
  if (!validators.nonEmpty(formData.amount)) {
    missing.push('Износ на штетата');
  } else if (!validators.number(formData.amount)) {
    errors.amount = 'Внесете валиден износ на штетата';
  } else if (parseFloat(formData.amount) <= 0) {
    errors.amount = 'Износот мора да биде поголем од нула';
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
  }

  return {
    isValid: missing.length === 0 && Object.keys(errors).length === 0,
    missing,
    errors,
    message: missing.length > 0 ? `Недостасуваат задолжителни полиња: ${missing.join(', ')}` : null
  };
};

// Create the controller using the base factory
const employeeDamagesStatementController = createDocumentController({
  templateFunction: generateEmployeeDamagesStatementDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'employee-damages-statement',
  validateFunction: validateEmployeeDamagesStatement
});

module.exports = employeeDamagesStatementController;