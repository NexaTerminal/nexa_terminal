const { createDocumentController, cleanFormData } = require('../../utils/baseDocumentController');
const generateMarketingPerformanceReport = require('../../marketing_templates/reports/marketingPerformanceReport');

/**
 * Marketing Performance Report Controller
 * Uses the base controller factory for common functionality
 */

// No strict required fields - allow flexible report generation
const REQUIRED_FIELDS = [];

/**
 * Preprocess form data before document generation
 */
const preprocessMarketingData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Ensure arrays are properly handled
  if (typeof processed.marketingChannels === 'string') {
    processed.marketingChannels = [processed.marketingChannels];
  }
  if (typeof processed.challenges === 'string') {
    processed.challenges = [processed.challenges];
  }

  // Ensure numeric fields are parsed
  if (processed.totalBudget) {
    processed.totalBudget = parseFloat(processed.totalBudget);
  }
  if (processed.actualSpent) {
    processed.actualSpent = parseFloat(processed.actualSpent);
  }
  if (processed.totalLeads) {
    processed.totalLeads = parseInt(processed.totalLeads, 10);
  }
  if (processed.totalSales) {
    processed.totalSales = parseInt(processed.totalSales, 10);
  }
  if (processed.estimatedRevenue) {
    processed.estimatedRevenue = parseFloat(processed.estimatedRevenue);
  }
  if (processed.costPerLead) {
    processed.costPerLead = parseFloat(processed.costPerLead);
  }
  if (processed.costPerSale) {
    processed.costPerSale = parseFloat(processed.costPerSale);
  }

  return processed;
};

// Create the marketing performance report controller using the base factory
const marketingPerformanceReportController = createDocumentController({
  templateFunction: generateMarketingPerformanceReport,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'marketing-performance-report',
  validateFunction: null,
  preprocessFunction: preprocessMarketingData
});

module.exports = marketingPerformanceReportController;
