const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateAnnualLeaveDecisionDoc = require('../../document_templates/employment/annualLeaveDecision');

/**
 * Annual Leave Decision Controller
 * Updated to use baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function
 */
const validateFunction = null;
// Create the controller using the base factory
const annualLeaveController = createDocumentController({
  templateFunction: generateAnnualLeaveDecisionDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'annual-leave-decision',
  validateFunction: null
});

module.exports = annualLeaveController; 