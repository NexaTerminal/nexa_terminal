const { validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateRentAgreementDoc = require('../../document_templates/contracts/rentAgreement');

/**
 * Rent Agreement Controller
 * Custom controller that allows document generation with warnings instead of blocking validation
 */

// Note: We don't enforce required fields anymore, allowing document generation with warnings
// Fields are validated as warnings in validateRentAgreement function

/**
 * Custom validation function for rent agreement
 * Returns warnings instead of blocking errors to allow document generation
 */
const validateRentAgreement = (formData, user, company) => {
  const warnings = [];
  const errors = {};
  const missing = [];

  // Check basic required fields
  if (!formData.contractDate) missing.push('Датум на договор');
  if (!formData.contractTown) missing.push('Место на склучување');
  if (!formData.userRole) missing.push('Ваша улога');
  if (!formData.otherPartyType) missing.push('Тип на другата страна');

  // Check other party data based on type
  if (formData.otherPartyType === 'individual') {
    if (!formData.otherPartyName) missing.push('Име на физичкото лице');
    if (!formData.otherPartyAddress) missing.push('Адреса на физичкото лице');
    if (!formData.otherPartyPIN) missing.push('ЕМБГ на другата страна');
  } else if (formData.otherPartyType === 'company') {
    if (!formData.otherPartyCompanyName) missing.push('Име на компанијата');
    if (!formData.otherPartyCompanyAddress) missing.push('Адреса на компанијата');
    if (!formData.otherPartyCompanyManager) missing.push('Управител на компанијата');
    if (!formData.otherPartyCompanyTaxNumber) missing.push('Даночен број на компанијата');
  }

  // Check property data
  if (!formData.propertyAddress) missing.push('Адреса на недвижност');
  if (!formData.propertySize) missing.push('Површина на недвижност');
  if (!formData.rentAmount) missing.push('Месечна закупнина');
  if (!formData.bankAccount) missing.push('Број на жиро сметка');
  if (!formData.bankName) missing.push('Име на банка');

  // Convert missing fields to warnings instead of errors
  if (missing.length > 0) {
    missing.forEach(field => {
      warnings.push(`Недостасува: ${field}`);
    });
  }

  return {
    isValid: true, // Always allow generation, but with warnings
    warnings,
    errors,
    missing
  };
};

/**
 * Preprocess form data before document generation
 */
const preprocessRentData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Set defaults for optional fields
  processed.includesVAT = processed.includesVAT !== undefined ? processed.includesVAT : false;
  processed.requiresDeposit = processed.requiresDeposit !== undefined ? processed.requiresDeposit : false;
  processed.requiresInsurance = processed.requiresInsurance !== undefined ? processed.requiresInsurance : false;
  processed.allowsQuarterlyInspection = processed.allowsQuarterlyInspection !== undefined ? processed.allowsQuarterlyInspection : false;
  processed.hasAnnualIncrease = processed.hasAnnualIncrease !== undefined ? processed.hasAnnualIncrease : false;

  // Ensure numeric fields are properly formatted
  if (processed.rentAmount) {
    processed.rentAmount = parseFloat(processed.rentAmount).toFixed(0);
  }
  
  if (processed.depositAmount && processed.requiresDeposit) {
    processed.depositAmount = parseFloat(processed.depositAmount).toFixed(0);
  }

  if (processed.propertySize) {
    processed.propertySize = parseFloat(processed.propertySize).toFixed(0);
  }

  return processed;
};

// Create a custom controller that allows document generation with warnings
const rentAgreementController = async (req, res) => {
  try {
    // Extract data from request
    const { formData } = req.body;
    const user = req.user;
    
    // Extract and normalize company information from user object
    const companyInfo = user.companyInfo || {};
    
    // Map company fields to standardized format for templates
    const company = {
      companyName: companyInfo.companyName || '',
      address: companyInfo.address || companyInfo.companyAddress || '',
      taxNumber: companyInfo.taxNumber || companyInfo.companyTaxNumber || '',
      manager: user.companyManager || companyInfo.manager || companyInfo.role || '',
      // Keep original fields for backward compatibility
      role: user.companyManager || companyInfo.manager || companyInfo.role || ''
    };
    
    console.log('[договор-за-закуп] User ID:', user._id || user.id);
    console.log('[договор-за-закуп] Processing request for user:', user.email);
    console.log('[договор-за-закуп] Form data keys:', Object.keys(formData || {}).join(', '));

    // Validate request data
    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({
        message: 'Невалидни податоци во барањето',
        error: 'INVALID_REQUEST_DATA'
      });
    }

    // Run validation to get warnings (but don't block generation)
    const validationResult = validateRentAgreement(formData, user, company);
    
    // Preprocess data
    const processedData = preprocessRentData(formData, user, company);

    // Generate document using the template function
    console.log('[договор-за-закуп] Generating document with warnings:', validationResult.warnings?.length || 0);
    const { doc } = generateRentAgreementDoc(processedData, user, company);
    
    // Pack the document
    const { Packer } = require('docx');
    const buffer = await Packer.toBuffer(doc);
    
    // Send response with warnings (but successful generation)
    const response = {
      success: true,
      message: 'Документот е успешно генериран',
      filename: `договор-за-закуп-${Date.now()}.docx`
    };
    
    // Add warnings if any exist
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      response.warnings = validationResult.warnings;
      response.warningMessage = `Документот е генериран со предупредувања: ${validationResult.warnings.slice(0, 3).join(', ')}${validationResult.warnings.length > 3 ? '...' : ''}`;
    }
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="rent-agreement-${Date.now()}.docx"`
    });
    
    res.send(buffer);
    
  } catch (error) {
    console.error('[договор-за-закуп] DETAILED Generation error:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('User data that caused error:', JSON.stringify(req.user, null, 2));
    console.error('Form data that caused error:', JSON.stringify(req.body.formData, null, 2));
    
    res.status(500).json({
      message: 'Грешка при генерирањето на документот',
      error: error.message || 'UNKNOWN_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = rentAgreementController;