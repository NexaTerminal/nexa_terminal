const { createDocumentController } = require('../../utils/baseDocumentController');
const generateServicesContractDoc = require('../../document_templates/contracts/servicesContract');

/**
 * Services Contract Controller
 * Uses base document controller factory for consistent handling
 * Implements custom validation for milestone-based payment structure
 */

/**
 * Custom validation for services contract
 * Validates milestone percentages must total 100%
 */
function validateServicesContract(formData) {
  const warnings = [];
  const errors = {};
  const missing = [];

  // Validate payment structure specific requirements
  if (formData.paymentStructure === 'milestone-based') {
    const numberOfMilestones = parseInt(formData.numberOfMilestones) || 0;

    if (numberOfMilestones < 2) {
      warnings.push('Milestone-based payment requires at least 2 milestones. Consider using fixed or time-based payment structure.');
    }

    // Validate milestone percentages total 100%
    let totalPercentage = 0;
    for (let i = 1; i <= numberOfMilestones; i++) {
      const percentage = parseFloat(formData[`milestone${i}Percentage`]) || 0;
      totalPercentage += percentage;

      if (!formData[`milestone${i}Description`]) {
        missing.push(`Milestone ${i} description`);
      }

      if (!formData[`milestone${i}Amount`] && !formData[`milestone${i}Percentage`]) {
        missing.push(`Milestone ${i} amount or percentage`);
      }
    }

    if (totalPercentage !== 100 && numberOfMilestones > 0) {
      warnings.push(`Milestone percentages total ${totalPercentage}% instead of 100%. Please adjust the percentages to ensure proper payment distribution.`);
    }
  }

  // Validate time-based payment structure
  if (formData.paymentStructure === 'time-based') {
    if (!formData.hourlyRate) {
      missing.push('Hourly rate for time-based payment');
    }

    if (!formData.estimatedHours) {
      warnings.push('Estimated hours not provided. Consider adding an estimate for better cost planning.');
    }
  }

  // Validate dates
  if (formData.startDate && formData.deadline) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.deadline);

    if (end <= start) {
      warnings.push('Deadline should be after the start date. Please verify the execution timeline.');
    }
  }

  // Validate inspection and warranty periods
  const inspectionPeriod = parseInt(formData.inspectionPeriod) || 0;
  const warrantyPeriod = parseInt(formData.warrantyPeriod) || 0;

  if (inspectionPeriod < 7) {
    warnings.push('Inspection period less than 7 days may be too short for proper quality assessment according to Article 634 of the Law on Obligations.');
  }

  if (warrantyPeriod < 1) {
    warnings.push('Warranty period less than 1 month. Consider extending to provide adequate defect liability coverage per Articles 637-640.');
  }

  // Validate material provider consistency
  if (formData.materialProvider === 'none' && formData.materialsDescription) {
    warnings.push('Material provider set to "none" but materials description is provided. This may cause confusion in the contract.');
  }

  // Return validation result - allow generation with warnings
  return {
    isValid: true, // Allow generation even with warnings
    warnings,
    errors,
    missing
  };
}

/**
 * Services Contract Controller using factory pattern
 */
const servicesContractController = createDocumentController({
  templateFunction: generateServicesContractDoc,
  documentName: 'ServicesContract',
  validationFunction: validateServicesContract // Custom validation
});

module.exports = servicesContractController;
