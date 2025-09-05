const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationWarningDoc = require('../../document_templates/employment/terminationWarning');

/**
 * Termination Warning Controller
 * Uses the base controller factory for common functionality
 * Handles pre-termination warning documents for employee discipline
 */

// Define required fields for termination warning
const REQUIRED_FIELDS = [
  'employeeName',
  'jobPosition', 
  'decisionDate',
  'workTaskFailure',
  'employeeWrongDoing',
  'fixingDeadline'
];

/**
 * Custom validation function for termination warning
 */
const validateTerminationWarning = (formData, user, company) => {
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
    missing.push('Датум на одлука');
  } else if (!validators.date(formData.decisionDate)) {
    errors.decisionDate = 'Внесете валиден датум';
  }

  // Validate work task failure
  if (!validators.nonEmpty(formData.workTaskFailure)) {
    missing.push('Обврска која работникот не ја исполнил');
  }

  // Validate employee wrong doing
  if (!validators.nonEmpty(formData.employeeWrongDoing)) {
    missing.push('Постапување спротивно на обврската');
  }

  // Validate fixing deadline
  if (!validators.nonEmpty(formData.fixingDeadline)) {
    missing.push('Рок за исправка на однесувањето');
  } else if (!validators.date(formData.fixingDeadline)) {
    errors.fixingDeadline = 'Внесете валиден датум за рокот';
  }

  // Validate that fixing deadline is after decision date
  if (formData.decisionDate && formData.fixingDeadline && validators.date(formData.decisionDate) && validators.date(formData.fixingDeadline)) {
    const decisionDateObj = new Date(formData.decisionDate);
    const fixingDeadlineObj = new Date(formData.fixingDeadline);
    
    if (fixingDeadlineObj <= decisionDateObj) {
      errors.fixingDeadline = 'Рокот за исправка мора да биде после датумот на одлуката';
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
const preprocessTerminationWarningData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.decisionDate) {
    processed.decisionDate = new Date(processed.decisionDate).toISOString().split('T')[0];
  }
  
  if (processed.fixingDeadline) {
    processed.fixingDeadline = new Date(processed.fixingDeadline).toISOString().split('T')[0];
  }

  return processed;
};

// Create the termination warning controller using the base factory
const terminationWarningController = createDocumentController({
  templateFunction: generateTerminationWarningDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'предупредување-пред-откажување',
  validateFunction: validateTerminationWarning,
  preprocessFunction: preprocessTerminationWarningData
});

module.exports = terminationWarningController;