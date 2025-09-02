const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateEmploymentAgreementDoc = require('../../document_templates/employment/employmentAgreement');

/**
 * Employment Agreement Controller
 * Uses the base controller factory for common functionality
 * This controller is now ~70% smaller than the original implementation
 */

// Define required fields for employment agreement
const REQUIRED_FIELDS = [
  'employeeName',
  'employeeAddress', 
  'employeePIN',
  'jobPosition',
  'workTasks',
  'netSalary',
  'agreementDate'
];

/**
 * Custom validation function for employment agreement
 */
const validateEmploymentAgreement = (formData, user, company) => {
  const errors = {};
  const missing = [];

  console.log('User data received:', JSON.stringify(user, null, 2));
  console.log('Company data received:', JSON.stringify(company, null, 2));

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

  // Validate work tasks (array with at least one non-empty item)
  if (!validators.arrayNotEmpty(formData.workTasks)) {
    missing.push('Работни обврски');
  }

  // Validate salary (must be a positive number)
  if (!validators.nonEmpty(formData.netSalary)) {
    missing.push('Основна плата');
  } else if (!validators.number(formData.netSalary) || parseFloat(formData.netSalary) <= 0) {
    errors.netSalary = 'Платата мора да биде позитивен број';
  }

  // Validate agreement date
  if (!validators.nonEmpty(formData.agreementDate)) {
    missing.push('Датум на договор');
  } else if (!validators.date(formData.agreementDate)) {
    errors.agreementDate = 'Внесете валиден датум';
  }

  // Conditional validations
  if (formData.placeOfWork === 'Друго место' && !validators.nonEmpty(formData.otherWorkPlace)) {
    missing.push('Место на работа (детали)');
  }

  if (formData.agreementDurationType === 'определено времетраење' && !validators.nonEmpty(formData.definedDuration)) {
    missing.push('Краен датум на договор');
  } else if (formData.definedDuration && !validators.date(formData.definedDuration)) {
    errors.definedDuration = 'Внесете валиден краен датум';
  }

  if (formData.dailyWorkTime === 'other' && !validators.nonEmpty(formData.otherWorkTime)) {
    missing.push('Работно време (детали)');
  }

  if (formData.concurrentClause && !validators.nonEmpty(formData.concurrentClauseInput)) {
    missing.push('Конкурентска клаузула (детали)');
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
const preprocessEmploymentData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Ensure work tasks is always an array
  if (!Array.isArray(processed.workTasks)) {
    processed.workTasks = processed.workTasks ? [processed.workTasks] : [];
  }

  // Set default values for optional fields
  processed.placeOfWork = processed.otherWorkPlace || processed.placeOfWork || 'просториите на седиштето на работодавачот';
  processed.agreementDurationType = processed.agreementDurationType || 'неопределено времетраење.';
  processed.dailyWorkTime = processed.otherWorkTime || processed.dailyWorkTime || 'започнува од 08:00 часот, а завршува во 16:00 часот';

  return processed;
};

// Create the employment agreement controller using the base factory
const employmentAgreementController = createDocumentController({
  templateFunction: generateEmploymentAgreementDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'договор-за-вработување',
  validateFunction: validateEmploymentAgreement,
  preprocessFunction: preprocessEmploymentData
});

module.exports = employmentAgreementController;