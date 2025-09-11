const { createDocumentController, validators } = require('../../utils/baseDocumentController');
const generateMandatoryBonusDoc = require('../../document_templates/employment/mandatoryBonus');

/**
 * Mandatory Bonus Controller
 * Handles multi-document generation for annual leave bonus (регрес за годишен одмор)
 * Generates 4 documents in one file with page breaks
 */

// Define required fields
const REQUIRED_FIELDS = [];
/**
 * Custom validation function for Mandatory Bonus
 */
const validateFunction = null;
// Create the controller using the base factory
const mandatoryBonusController = createDocumentController({
  templateFunction: generateMandatoryBonusDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'регрес-за-годишен-одмор',
  validateFunction: null
});

module.exports = mandatoryBonusController;