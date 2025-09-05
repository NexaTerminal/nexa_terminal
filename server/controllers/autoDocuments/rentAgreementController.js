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
  const errors = {};
  const missing = [];
  const warnings = [];

  console.log('User data received:', JSON.stringify(user, null, 2));
  console.log('Company data received:', JSON.stringify(company, null, 2));
  console.log('Form data received:', JSON.stringify(formData, null, 2));

  // Validate contract basics - convert to warnings
  if (!validators.nonEmpty(formData.contractDate)) {
    warnings.push('Датум на договор не е внесен');
  } else if (!validators.date(formData.contractDate)) {
    warnings.push('Датумот на договор не е во валиден формат');
  }

  if (!validators.nonEmpty(formData.contractTown)) {
    warnings.push('Место на склучување на договор не е внесено');
  }

  // Validate user role (landlord or tenant)
  if (!validators.nonEmpty(formData.userRole)) {
    warnings.push('Ваша улога во договорот не е избрана');
  }

  // Always check if company data is available (user's company)
  if (!company || !company.companyName) {
    warnings.push('Информациите за компанијата не се пополнети во профилот');
  }

  // Check required company fields - convert to warnings
  if (company) {
    if (!company.companyName || company.companyName.trim() === '') {
      warnings.push('Име на компанијата не е внесено во профилот');
    }
    if (!company.address || company.address.trim() === '') {
      warnings.push('Адреса на компанијата не е внесена во профилот');
    }
    if (!company.taxNumber || company.taxNumber.trim() === '') {
      warnings.push('Даночен број на компанијата не е внесен во профилот');
    }
    if (!company.manager || company.manager.trim() === '') {
      warnings.push('Управител на компанијата не е внесен во профилот');
    }
  }

  // Validate other party type - convert to warnings
  if (!validators.nonEmpty(formData.otherPartyType)) {
    warnings.push('Тип на другата договорна страна не е избран');
  }

  // Validate other party data based on type - convert to warnings (optional fields)
  if (formData.otherPartyType === 'individual') {
    // Individual party validation (optional)
    if (formData.otherPartyName && !validators.nonEmpty(formData.otherPartyName)) {
      warnings.push('Име на другата страна не е внесено');
    }
    if (formData.otherPartyAddress && !validators.nonEmpty(formData.otherPartyAddress)) {
      warnings.push('Адреса на другата страна не е внесена');
    }
    if (formData.otherPartyPIN) {
      if (!validators.nonEmpty(formData.otherPartyPIN)) {
        warnings.push('ЕМБГ на другата страна не е внесено');
      } else if (!validators.pin(formData.otherPartyPIN)) {
        warnings.push('ЕМБГ на другата страна не е во валиден формат (мора да содржи точно 13 цифри)');
      }
    }
  } else if (formData.otherPartyType === 'company') {
    // Company party validation (optional)
    if (formData.otherPartyCompanyName && !validators.nonEmpty(formData.otherPartyCompanyName)) {
      warnings.push('Име на компанијата не е внесено');
    }
    if (formData.otherPartyCompanyAddress && !validators.nonEmpty(formData.otherPartyCompanyAddress)) {
      warnings.push('Адреса на компанијата не е внесена');
    }
    if (formData.otherPartyCompanyTaxNumber && !validators.nonEmpty(formData.otherPartyCompanyTaxNumber)) {
      warnings.push('Даночен број на компанијата не е внесен');
    }
    if (formData.otherPartyCompanyManager && !validators.nonEmpty(formData.otherPartyCompanyManager)) {
      warnings.push('Управител на компанијата не е внесен');
    }
  }

  // Validate property data - convert to warnings
  if (!validators.nonEmpty(formData.propertyAddress)) {
    warnings.push('Адреса на недвижност не е внесена');
  }

  if (!validators.nonEmpty(formData.cadastralParcelNumber)) {
    warnings.push('Број на катастарска парцела не е внесен');
  }

  if (!validators.nonEmpty(formData.cadastralMunicipality)) {
    warnings.push('Катастарска општина не е внесена');
  }

  if (!validators.nonEmpty(formData.propertySheetNumber)) {
    warnings.push('Број на имотен лист не е внесен');
  }

  if (!validators.nonEmpty(formData.propertySize)) {
    warnings.push('Површина на недвижност не е внесена');
  } else if (!validators.number(formData.propertySize) || parseFloat(formData.propertySize) <= 0) {
    warnings.push('Површината не е во валиден формат (мора да биде позитивен број)');
  }

  if (!validators.nonEmpty(formData.propertyType)) {
    warnings.push('Тип на објект не е избран');
  }

  // Additional property details validations - convert to warnings
  if (!validators.nonEmpty(formData.buildingNumber)) {
    warnings.push('Број на зграда не е внесен');
  }

  if (!validators.nonEmpty(formData.propertyPurpose)) {
    warnings.push('Намена на објектот не е внесена');
  }

  if (!validators.nonEmpty(formData.entrance)) {
    warnings.push('Влез не е внесен');
  }

  if (!validators.nonEmpty(formData.floor)) {
    warnings.push('Кат не е внесен');
  }

  if (!validators.nonEmpty(formData.apartmentNumber)) {
    warnings.push('Број на стан/локал не е внесен');
  }

  if (!validators.nonEmpty(formData.specificPurpose)) {
    warnings.push('Намена на посебен дел не е внесена');
  }

  // Validate rent data - convert to warnings
  if (!validators.nonEmpty(formData.rentAmount)) {
    warnings.push('Висина на закупнина не е внесена');
  } else if (!validators.number(formData.rentAmount) || parseFloat(formData.rentAmount) <= 0) {
    warnings.push('Закупнината не е во валиден формат (мора да биде позитивен број)');
  }

  if (!validators.nonEmpty(formData.rentPaymentDeadline)) {
    warnings.push('Рок за плаќање на закупнина не е избран');
  }

  // Validate duration - convert to warnings
  if (!validators.nonEmpty(formData.durationType)) {
    warnings.push('Тип на времетраење не е избран');
  }

  if (formData.durationType === 'определено' && !validators.nonEmpty(formData.durationValue)) {
    warnings.push('Времетраење на договор не е внесено');
  }

  if (formData.durationType === 'неопределено' && formData.endDate && !validators.date(formData.endDate)) {
    warnings.push('Крајниот датум не е во валиден формат');
  }

  // Validate deposit if required - convert to warnings
  if (formData.requiresDeposit) {
    if (!validators.nonEmpty(formData.depositAmount)) {
      warnings.push('Висина на депозит не е внесена');
    } else if (!validators.number(formData.depositAmount) || parseFloat(formData.depositAmount) <= 0) {
      warnings.push('Депозитот не е во валиден формат (мора да биде позитивен број)');
    }
  }

  // Validate bank details - convert to warnings
  if (!validators.nonEmpty(formData.bankAccount)) {
    warnings.push('Број на жиро сметка не е внесен');
  }

  if (!validators.nonEmpty(formData.bankName)) {
    warnings.push('Име на банка не е внесено');
  }

  // Always return valid=true to allow document generation, but include warnings
  return {
    isValid: true, // Always allow generation
    missing: [], // No blocking missing fields
    errors: {}, // No blocking errors  
    warnings: warnings, // Include warnings for user information
    message: warnings.length > 0 ? `Предупредување: ${warnings.join(', ')}` : null
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