const { cleanFormData } = require('../../utils/baseDocumentController');
const generateDebtAssumptionAgreementDoc = require('../../document_templates/contracts/debtAssumptionAgreement');

/**
 * Debt Assumption Agreement Controller
 * Custom controller that allows document generation with warnings instead of blocking validation
 */

/**
 * Validation function for debt assumption agreement
 * Returns warnings instead of blocking errors to allow document generation
 */
const validateDebtAssumptionAgreement = (formData, user, company) => {
  const warnings = [];
  const errors = {};
  const missing = [];

  // Check required basic fields
  if (!formData.contractDate) {
    warnings.push('Препорачуваме да го внесете датумот на склучување на договорот');
  }

  if (!formData.contractTown) {
    warnings.push('Препорачуваме да го внесете местото на склучување на договорот');
  }

  if (!formData.userRole) {
    warnings.push('Препорачуваме да ја определите вашата улога во договорот');
  }

  if (!formData.debtAmount) {
    warnings.push('Препорачуваме да го внесете износот на долгот');
  }

  if (!formData.debtDescription) {
    warnings.push('Препорачуваме да го опишете долгот');
  }

  // Check party information based on role
  if (formData.userRole === 'creditor') {
    // When user is creditor, check original debtor and assuming party data
    if (formData.originalDebtorType === 'individual') {
      if (!formData.originalDebtorName) warnings.push('Препорачуваме да го внесете името на првичниот должник');
      if (!formData.originalDebtorPIN || !/^\d{13}$/.test(formData.originalDebtorPIN)) {
        warnings.push('Препорачуваме да внесете валиден ЕМБГ од 13 цифри за првичниот должник');
      }
    } else if (formData.originalDebtorType === 'company') {
      if (!formData.originalDebtorCompanyName) warnings.push('Препорачуваме да го внесете името на првичната должничка компанија');
      if (!formData.originalDebtorCompanyTaxNumber) warnings.push('Препорачуваме да го внесете даночниот број на првичната должничка компанија');
    }

    if (formData.otherPartyType === 'individual') {
      if (!formData.assumingPartyName) warnings.push('Препорачуваме да го внесете името на преземачот на долгот');
      if (!formData.assumingPartyPIN || !/^\d{13}$/.test(formData.assumingPartyPIN)) {
        warnings.push('Препорачуваме да внесете валиден ЕМБГ од 13 цифри за преземачот на долгот');
      }
    } else if (formData.otherPartyType === 'company') {
      if (!formData.assumingPartyCompanyName) warnings.push('Препорачуваме да го внесете името на компанијата преземач на долг');
      if (!formData.assumingPartyCompanyTaxNumber) warnings.push('Препорачуваме да го внесете даночниот број на компанијата преземач на долг');
    }
  } else if (formData.userRole === 'debtor') {
    // When user is debtor, check creditor and assuming party data
    if (formData.originalCreditorType === 'individual') {
      if (!formData.originalCreditorName) warnings.push('Препорачуваме да го внесете името на доверителот');
      if (!formData.originalCreditorPIN || !/^\d{13}$/.test(formData.originalCreditorPIN)) {
        warnings.push('Препорачуваме да внесете валиден ЕМБГ од 13 цифри за доверителот');
      }
    } else if (formData.originalCreditorType === 'company') {
      if (!formData.originalCreditorCompanyName) warnings.push('Препорачуваме да го внесете името на довериталската компанија');
      if (!formData.originalCreditorCompanyTaxNumber) warnings.push('Препорачуваме да го внесете даночниот број на довериталската компанија');
    }

    if (formData.otherPartyType === 'individual') {
      if (!formData.assumingPartyName) warnings.push('Препорачуваме да го внесете името на преземачот на долгот');
      if (!formData.assumingPartyPIN || !/^\d{13}$/.test(formData.assumingPartyPIN)) {
        warnings.push('Препорачуваме да внесете валиден ЕМБГ од 13 цифри за преземачот на долгот');
      }
    } else if (formData.otherPartyType === 'company') {
      if (!formData.assumingPartyCompanyName) warnings.push('Препорачуваме да го внесете името на компанијата преземач на долг');
      if (!formData.assumingPartyCompanyTaxNumber) warnings.push('Препорачуваме да го внесете даночниот број на компанијата преземач на долг');
    }
  } else if (formData.userRole === 'third_party') {
    // When user is assuming party, check creditor and original debtor data
    if (formData.originalCreditorType === 'individual') {
      if (!formData.originalCreditorName) warnings.push('Препорачуваме да го внесете името на доверителот');
      if (!formData.originalCreditorPIN || !/^\d{13}$/.test(formData.originalCreditorPIN)) {
        warnings.push('Препорачуваме да внесете валиден ЕМБГ од 13 цифри за доверителот');
      }
    } else if (formData.originalCreditorType === 'company') {
      if (!formData.originalCreditorCompanyName) warnings.push('Препорачуваме да го внесете името на довериталската компанија');
      if (!formData.originalCreditorCompanyTaxNumber) warnings.push('Препорачуваме да го внесете даночниот број на довериталската компанија');
    }

    if (formData.originalDebtorType === 'individual') {
      if (!formData.originalDebtorName) warnings.push('Препорачуваме да го внесете името на првичниот должник');
      if (!formData.originalDebtorPIN || !/^\d{13}$/.test(formData.originalDebtorPIN)) {
        warnings.push('Препорачуваме да внесете валиден ЕМБГ од 13 цифри за првичниот должник');
      }
    } else if (formData.originalDebtorType === 'company') {
      if (!formData.originalDebtorCompanyName) warnings.push('Препорачуваме да го внесете името на првичната должничка компанија');
      if (!formData.originalDebtorCompanyTaxNumber) warnings.push('Препорачуваме да го внесете даночниот број на првичната должничка компанија');
    }
  }

  return {
    isValid: true, // Always allow generation
    warnings,
    errors,
    missing
  };
};

/**
 * Preprocess form data before document generation
 */
const preprocessDebtAssumptionData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Set defaults for optional fields
  processed.debtCurrency = processed.debtCurrency || 'МКД';
  processed.assumptionType = processed.assumptionType || 'full';
  processed.releaseOriginalDebtor = processed.releaseOriginalDebtor !== undefined ? processed.releaseOriginalDebtor : true;

  // Ensure numeric fields are properly formatted
  if (processed.debtAmount) {
    processed.debtAmount = parseFloat(processed.debtAmount).toLocaleString('mk-MK');
  }

  return processed;
};

// Create a custom controller that allows document generation with warnings
const debtAssumptionAgreementController = async (req, res) => {
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

    console.log('[договор-за-преземање-на-долг] User ID:', user._id || user.id);
    console.log('[договор-за-преземање-на-долг] Processing request for user:', user.email);
    console.log('[договор-за-преземање-на-долг] Form data keys:', Object.keys(formData || {}).join(', '));

    // Validate request data
    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({
        message: 'Невалидни податоци во барањето',
        error: 'INVALID_REQUEST_DATA'
      });
    }

    // Run validation to get warnings (but don't block generation)
    const validationResult = validateDebtAssumptionAgreement(formData, user, company);

    // Preprocess data
    const processedData = preprocessDebtAssumptionData(formData, user, company);

    // Generate document using the template function
    console.log('[договор-за-преземање-на-долг] Generating document with warnings:', validationResult.warnings?.length || 0);
    const { doc } = generateDebtAssumptionAgreementDoc(processedData, user, company);

    // Pack the document
    const { Packer } = require('docx');
    const buffer = await Packer.toBuffer(doc);

    // Send response with warnings (but successful generation)
    const response = {
      success: true,
      message: 'Документот е успешно генериран',
      filename: `договор-за-преземање-на-долг-${Date.now()}.docx`
    };

    // Add warnings if any exist
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      response.warnings = validationResult.warnings;
      response.warningMessage = `Документот е генериран со предупредувања: ${validationResult.warnings.slice(0, 3).join(', ')}${validationResult.warnings.length > 3 ? '...' : ''}`;
    }

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="debt-assumption-agreement-${Date.now()}.docx"`
    });

    res.send(buffer);

  } catch (error) {
    console.error('[договор-за-преземање-на-долг] DETAILED Generation error:');
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

module.exports = debtAssumptionAgreementController;