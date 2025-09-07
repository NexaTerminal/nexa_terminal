const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationByEmployeeRequestDoc = require('../../document_templates/employment/terminationByEmployeeRequest');

/**
 * Termination by Employee Request Controller
 * Uses the base controller factory for common functionality
 * Handles termination decisions based on employee requests according to Article 71
 * of the Macedonian Labor Law
 */

// Define required fields for termination by employee request
const REQUIRED_FIELDS = [
  'employeeName',
  'jobPosition', 
  'requestNumber',
  'requestDate',
  'employmentEndDate',
  'decisionDate'
];

/**
 * Custom validation function for termination by employee request
 * Uses lenient validation that provides warnings instead of blocking generation
 */
const validateTerminationByEmployeeRequest = (formData, user, company) => {
  const errors = {};
  const missing = [];
  const warnings = [];

  // Lenient validation - convert potential errors to warnings
  if (!validators.nonEmpty(formData.employeeName)) {
    warnings.push('Препорачуваме да го внесете името и презимето на работникот');
  }

  if (!validators.nonEmpty(formData.jobPosition)) {
    warnings.push('Препорачуваме да ја внесете работната позиција');
  }

  if (!validators.nonEmpty(formData.requestNumber)) {
    warnings.push('Препорачуваме да го внесете бројот на барањето');
  }

  // Date validation with warnings
  if (formData.requestDate && !validators.date(formData.requestDate)) {
    warnings.push('Форматот на датумот за поднесување на барањето може да не е валиден');
  }

  if (formData.employmentEndDate && !validators.date(formData.employmentEndDate)) {
    warnings.push('Форматот на датумот за престанок може да не е валиден');
  }

  if (formData.decisionDate && !validators.date(formData.decisionDate)) {
    warnings.push('Форматот на датумот на решението може да не е валиден');
  }

  // Cross-date validation with warnings
  if (formData.requestDate && formData.employmentEndDate && validators.date(formData.requestDate) && validators.date(formData.employmentEndDate)) {
    const requestDateObj = new Date(formData.requestDate);
    const endDateObj = new Date(formData.employmentEndDate);
    
    const daysDiff = Math.ceil((endDateObj - requestDateObj) / (1000 * 60 * 60 * 24));
    if (daysDiff < 30) {
      warnings.push('Отказниот рок може да биде прекраток - препорачува се најмалку 30 дена според член 88 од Законот');
    }
  }

  if (formData.requestDate && formData.decisionDate && validators.date(formData.requestDate) && validators.date(formData.decisionDate)) {
    const requestDateObj = new Date(formData.requestDate);
    const decisionDateObj = new Date(formData.decisionDate);
    
    if (decisionDateObj < requestDateObj) {
      warnings.push('Датумот на решението обично е после датумот на поднесување на барањето');
    }
  }

  // Check company information - only critical missing info blocks generation
  if (!company || !company.companyName || company.companyName.trim() === '') {
    errors.company = 'Информациите за компанијата мора да бидат пополнети за да се генерира документот.';
    missing.push('Име на компанијата');
  }

  if (company) {
    if (!company.address || company.address.trim() === '') {
      warnings.push('Препорачуваме да ја внесете адресата на компанијата во профилот');
    }
    if (!company.taxNumber || company.taxNumber.trim() === '') {
      warnings.push('Препорачуваме да го внесете даночниот број на компанијата во профилот');
    }
    if (!company.manager || company.manager.trim() === '') {
      warnings.push('Препорачуваме да го внесете името на управителот во профилот');
    }
  }

  return {
    isValid: missing.length === 0 && Object.keys(errors).length === 0,
    missing,
    errors,
    warnings,
    message: missing.length > 0 ? `Недостасуваат критични информации: ${missing.join(', ')}` : null
  };
};

/**
 * Preprocess form data before document generation
 */
const preprocessTerminationByEmployeeRequestData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Format dates to ensure consistency
  if (processed.requestDate) {
    processed.requestDate = new Date(processed.requestDate).toISOString().split('T')[0];
  }
  
  if (processed.employmentEndDate) {
    processed.employmentEndDate = new Date(processed.employmentEndDate).toISOString().split('T')[0];
  }

  if (processed.decisionDate) {
    processed.decisionDate = new Date(processed.decisionDate).toISOString().split('T')[0];
  }

  return processed;
};

// Create the termination by employee request controller using the base factory
const terminationByEmployeeRequestController = createDocumentController({
  templateFunction: generateTerminationByEmployeeRequestDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'решение-за-престанок-по-барање-работник',
  validateFunction: validateTerminationByEmployeeRequest,
  preprocessFunction: preprocessTerminationByEmployeeRequestData
});

module.exports = terminationByEmployeeRequestController;