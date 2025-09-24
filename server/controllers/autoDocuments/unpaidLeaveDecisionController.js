const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateUnpaidLeaveDecisionDoc = require('../../document_templates/employment/unpaidLeaveDecision');

/**
 * Unpaid Leave Decision Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = ['employeeName', 'unpaidLeaveDuration', 'startingDate'];

/**
 * Custom validation function for unpaid leave
 */
const validateUnpaidLeave = (formData) => {
  const errors = {};
  const warnings = [];
  const missing = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!formData[field] || formData[field].toString().trim() === '') {
      missing.push(field);
    }
  });

  // Validate unpaid leave duration (max 3 months)
  if (formData.unpaidLeaveDuration) {
    const duration = parseInt(formData.unpaidLeaveDuration);
    if (isNaN(duration) || duration < 1) {
      errors.unpaidLeaveDuration = 'Времетраењето мора да биде позитивен број';
    } else if (duration > 3) {
      warnings.push('Согласно член 147 од ЗРО, неплатеното отсуство може да трае најдолго 3 месеци во текот на календарската година');
    }
  }

  // Validate starting date
  if (formData.startingDate) {
    const startDate = new Date(formData.startingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      warnings.push('Почетниот датум на отсуството е во минатото');
    }
  }

  return {
    isValid: missing.length === 0 && Object.keys(errors).length === 0,
    warnings,
    errors,
    missing
  };
};

// Create the controller using the base factory
const unpaidLeaveDecisionController = createDocumentController({
  templateFunction: generateUnpaidLeaveDecisionDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'unpaid-leave-decision',
  validateFunction: validateUnpaidLeave
});

module.exports = unpaidLeaveDecisionController;