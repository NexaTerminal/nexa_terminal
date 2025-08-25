// Export all document template functions by documentType string
const terminationAgreement = require('./employment/terminationAgreement');
module.exports = {
  terminationAgreement,
  // Only include templates that exist. If none, leave empty.
  // Add new exports here as new templates are added
}; 