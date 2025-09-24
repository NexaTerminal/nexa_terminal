const { createDocumentController } = require('../../utils/baseDocumentController');
const generateProcedureForEstimationDoc = require('../../document_templates/personalDataProtection/procedureForEstimation');

/**
 * Data Protection Impact Assessment (DPIA) Procedure Controller
 * Generates comprehensive DPIA procedure document according to Macedonian GDPR law
 * Uses baseDocumentController for proper company data mapping
 */

// Create the controller using the base factory
const procedureForEstimationController = createDocumentController({
  templateFunction: generateProcedureForEstimationDoc,
  requiredFields: ['dpiaDate'], // Basic validation - mainly for date
  documentName: 'procedure-for-estimation',
  validateFunction: null // No complex validation needed
});

module.exports = procedureForEstimationController;