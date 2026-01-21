const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateEmploymentAgreementDoc = require('../../document_templates/employment/employmentAgreement');

/**
 * Employment Agreement Controller
 * Uses the base controller factory for common functionality
 * This controller is now ~70% smaller than the original implementation
 */

// No required fields - all fields are optional per user request
const REQUIRED_FIELDS = [];

/**
 * No validation function - all fields are optional per user request
 */
const validateEmploymentAgreement = null;

/**
 * Format number with thousand separators (European style: 1.000)
 */
const formatMoney = (value) => {
  if (!value) return '';
  const num = parseInt(String(value).replace(/\./g, ''), 10);
  if (isNaN(num)) return value;
  return num.toLocaleString('de-DE');
};

/**
 * Preprocess form data before document generation
 */
const preprocessEmploymentData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Handle work tasks - convert to array of strings
  if (processed.workTasks) {
    if (Array.isArray(processed.workTasks)) {
      // Already an array - process each item
      processed.workTasks = processed.workTasks
        .map(task => typeof task === 'string' ? task.trim() : String(task).trim())
        .filter(task => task && task.length > 0);
    } else if (typeof processed.workTasks === 'object' && processed.workTasks !== null) {
      // Handle object with indexed keys (like {"0": "task1", "1": "task2"})
      processed.workTasks = Object.values(processed.workTasks)
        .map(task => typeof task === 'string' ? task.trim() : String(task).trim())
        .filter(task => task && task.length > 0);
    } else if (typeof processed.workTasks === 'string') {
      // Single string - convert to array
      processed.workTasks = [processed.workTasks.trim()].filter(task => task && task.length > 0);
    } else {
      // Fallback - empty array
      processed.workTasks = [];
    }
  } else {
    processed.workTasks = [];
  }

  // Set default values for optional fields
  processed.placeOfWork = processed.otherWorkPlace || processed.placeOfWork || 'просториите на седиштето на работодавачот';
  processed.agreementDurationType = processed.agreementDurationType || 'неопределено времетраење.';
  processed.dailyWorkTime = processed.otherWorkTime || processed.dailyWorkTime || 'започнува од 08:00 часот, а завршува во 16:00 часот';

  // Auto-calculate compensation if not provided (50% of salary)
  if (processed.concurrentClause && processed.netSalary && !processed.concurrentClauseCompensation) {
    const salary = parseInt(String(processed.netSalary).replace(/\./g, ''), 10);
    if (!isNaN(salary) && salary > 0) {
      processed.concurrentClauseCompensation = String(Math.round(salary * 0.5));
    }
  }

  // Format monetary values with thousand separators (1.000 format)
  if (processed.netSalary) {
    processed.netSalaryFormatted = formatMoney(processed.netSalary);
  }
  if (processed.concurrentClauseCompensation) {
    processed.concurrentClauseCompensationFormatted = formatMoney(processed.concurrentClauseCompensation);
  }

  // Convert duration from months to text
  if (processed.concurrentClauseDuration) {
    const months = parseInt(processed.concurrentClauseDuration, 10);
    if (!isNaN(months)) {
      if (months === 12) {
        processed.concurrentClauseDurationText = '1 (една) година';
      } else if (months === 24) {
        processed.concurrentClauseDurationText = '2 (две) години';
      } else if (months === 1) {
        processed.concurrentClauseDurationText = '1 (еден) месец';
      } else {
        processed.concurrentClauseDurationText = `${months} (${getMonthsInWords(months)}) месеци`;
      }
    }
  }

  return processed;
};

/**
 * Convert months number to Macedonian words
 */
const getMonthsInWords = (months) => {
  const words = {
    1: 'еден', 2: 'два', 3: 'три', 4: 'четири', 5: 'пет',
    6: 'шест', 7: 'седум', 8: 'осум', 9: 'девет', 10: 'десет',
    11: 'единаесет', 12: 'дванаесет', 18: 'осумнаесет', 24: 'дваесет и четири'
  };
  return words[months] || String(months);
};

// Create the employment agreement controller using the base factory
const employmentAgreementController = createDocumentController({
  templateFunction: generateEmploymentAgreementDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'договор-за-вработување',
  validateFunction: null,
  preprocessFunction: preprocessEmploymentData
});

module.exports = employmentAgreementController;