const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateDisciplinaryActionDoc = require('../../document_templates/employment/disciplinaryAction');

/**
 * Disciplinary Action Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [
  'employeeName',
  'jobPosition',
  'sanctionAmount',
  'sanctionPeriod',
  'workTaskFailure',
  'employeeWrongDoing',
  'employeeWrongdoingDate'
];

/**
 * Custom validation function
 */
const validateDisciplinaryAction = (formData, user, company) => {
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

  // Validate sanction amount
  if (!validators.nonEmpty(formData.sanctionAmount)) {
    missing.push('Процент на намалување на плата');
  } else if (!validators.number(formData.sanctionAmount)) {
    errors.sanctionAmount = 'Процентот мора да биде број';
  } else {
    const sanctionAmount = parseInt(formData.sanctionAmount);
    if (sanctionAmount <= 0 || sanctionAmount > 15) {
      errors.sanctionAmount = 'Процентот на намалување мора да биде помеѓу 1% и 15%';
    }
  }

  // Validate sanction period
  if (!validators.nonEmpty(formData.sanctionPeriod)) {
    missing.push('Период на санкцијата во месеци');
  } else if (!validators.number(formData.sanctionPeriod)) {
    errors.sanctionPeriod = 'Периодот мора да биде број';
  } else {
    const sanctionPeriod = parseInt(formData.sanctionPeriod);
    if (sanctionPeriod <= 0 || sanctionPeriod > 6) {
      errors.sanctionPeriod = 'Периодот на санкцијата не може да биде подолг од 6 месеци';
    }
  }

  // Validate work task failure
  if (!validators.nonEmpty(formData.workTaskFailure)) {
    missing.push('Опис на неисполнување на работните задачи');
  }

  // Validate employee wrongdoing
  if (!validators.nonEmpty(formData.employeeWrongDoing)) {
    missing.push('Опис на повредата на работните обврски');
  }

  // Validate wrongdoing date
  if (!validators.nonEmpty(formData.employeeWrongdoingDate)) {
    missing.push('Датум на повредата');
  } else if (!validators.date(formData.employeeWrongdoingDate)) {
    errors.employeeWrongdoingDate = 'Внесете валиден датум на повредата';
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
const disciplinaryActionController = createDocumentController({
  templateFunction: generateDisciplinaryActionDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'disciplinary-action',
  validateFunction: validateDisciplinaryAction
});

module.exports = disciplinaryActionController;