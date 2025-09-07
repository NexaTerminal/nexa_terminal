const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateTerminationDueToFaultDoc = require('../../document_templates/employment/terminationDueToFault');

/**
 * Ultra-Simplified Termination Due to Fault by Employee Controller
 * Based on Articles 81 and 82 of Macedonia Labor Law
 * Only handles article case selection and optional factual situation
 * All fields optional - can generate empty document for manual completion
 */

// All fields are optional - users can complete manually in .docx
const REQUIRED_FIELDS = [];

/**
 * Ultra-simplified validation function - all fields optional
 * Users can complete document manually in .docx file
 */
const validateTerminationDueToFault = (formData, user, company) => {
  const warnings = [];

  // Only EMBG validation if provided
  if (formData.employeePIN && !validators.pin(formData.employeePIN)) {
    warnings.push('ЕМБГ треба да содржи точно 13 цифри доколку го внесувате');
  }

  return {
    isValid: true, // Always allow document generation - even completely empty
    missing: [],
    errors: {},
    warnings,
    message: warnings.length > 0 ? 
      `Препораки: ${warnings.join(' ')}` : 
      null
  };
};

/**
 * Ultra-simplified preprocessing for termination document
 * Handles article case parsing and basic data cleanup
 */
const preprocessTerminationDueToFaultData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Parse selected article case to determine notice requirements
  if (processed.articleCase) {
    // Article 81 cases start with 'article_81_case_'
    // Article 82 cases start with 'article_82_case_'
    if (processed.articleCase.startsWith('article_81_case_')) {
      processed.applicableLegalArticle = 'член 81 од ЗРО';
      processed.noticeRequired = true;
      processed.noticePeriod = 30;
      processed.articleType = '81';
      processed.caseNumber = processed.articleCase.replace('article_81_case_', '');
    } else if (processed.articleCase.startsWith('article_82_case_')) {
      processed.applicableLegalArticle = 'член 82 од ЗРО';
      processed.noticeRequired = false;
      processed.noticePeriod = 0;
      processed.articleType = '82';
      processed.caseNumber = processed.articleCase.replace('article_82_case_', '');
    }
  } else {
    // Default fallback for empty documents
    processed.applicableLegalArticle = 'член 81 или член 82 од ЗРО';
    processed.noticeRequired = null;
    processed.articleType = null;
    processed.caseNumber = null;
  }

  return processed;
};

// Create the ultra-simplified termination controller using the base factory
const terminationDueToFaultController = createDocumentController({
  templateFunction: generateTerminationDueToFaultDoc,
  requiredFields: REQUIRED_FIELDS, // Empty array - all fields optional
  documentName: 'одлука-за-престанок-поради-вина',
  validateFunction: validateTerminationDueToFault,
  preprocessFunction: preprocessTerminationDueToFaultData
});

module.exports = terminationDueToFaultController;