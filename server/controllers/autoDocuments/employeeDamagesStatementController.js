const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateEmployeeDamagesStatementDoc = require('../../document_templates/employment/employeeDamagesStatement');

/**
 * Employee Damages Statement Controller
 * Uses baseDocumentController for proper company data mapping
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function
 */
const validateFunction = null;
// Create the controller using the base factory
const employeeDamagesStatementController = createDocumentController({
  templateFunction: generateEmployeeDamagesStatementDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'employee-damages-statement',
  validateFunction: null
});

module.exports = employeeDamagesStatementController;