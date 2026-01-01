const { createDocumentController, validators, cleanFormData } = require('../../utils/baseDocumentController');
const generateMediationAgreementDoc = require('../../document_templates/contracts/mediationAgreement');

/**
 * Enhanced Mediation Agreement Controller
 * Comprehensive legal compliance based on Civil Code Articles 869-882
 * Uses the base controller factory with enhanced conditional business logic
 * Supports mediator/client roles with comprehensive field requirements
 * Includes legal validation and proper data preprocessing
 */

// Define required fields (basic fields always required)
const REQUIRED_FIELDS = [];

/**
 * Preprocess form data before document generation
 * Implements conditional logic based on user role and client type
 */
const preprocessMediationAgreementData = (formData, user, company) => {
  const processed = cleanFormData(formData);

  // Set role-based flags for template conditional rendering
  processed.isMediator = processed.userRole === 'mediator';
  processed.isClient = processed.userRole === 'client';
  processed.isClientNatural = processed.clientType === 'natural' || processed.clientTypeForMediator === 'natural';
  processed.isClientLegal = processed.clientType === 'legal' || processed.clientTypeForMediator === 'legal';

  // Enhanced field mapping based on user role with comprehensive data handling
  if (processed.userRole === 'mediator') {
    // User's company is the mediator, other party is the client
    processed.mediatorName = company.companyName || '';
    processed.mediatorAddress = company.address || '';
    processed.mediatorTaxNumber = company.taxNumber || '';
    processed.mediatorManager = company.manager || '';
    processed.mediatorPhone = processed.mediatorPhone || '';
    processed.mediatorEmail = processed.mediatorEmail || '';

    // Client data from form input based on client type
    if (processed.clientTypeForMediator === 'natural') {
      processed.clientName = processed.naturalClientName || '';
      processed.clientAddress = processed.naturalClientAddress || '';
      processed.clientPin = processed.naturalClientPin || '';
      processed.clientPhone = processed.naturalClientPhone || '';
      processed.clientEmail = processed.naturalClientEmail || '';
      processed.clientTaxNumber = '';
      processed.clientManager = '';
    } else if (processed.clientTypeForMediator === 'legal') {
      processed.clientName = processed.legalClientName || '';
      processed.clientAddress = processed.legalClientAddress || '';
      processed.clientTaxNumber = processed.legalClientTaxNumber || '';
      processed.clientManager = processed.legalClientManager || '';
      processed.clientPhone = processed.legalClientPhone || '';
      processed.clientEmail = processed.legalClientEmail || '';
      processed.clientPin = '';
    }
  } else if (processed.userRole === 'client') {
    // User's company is the client, other party is the mediator
    processed.clientName = company.companyName || '';
    processed.clientAddress = company.address || '';
    processed.clientTaxNumber = company.taxNumber || '';
    processed.clientManager = company.manager || '';
    processed.clientPhone = processed.clientPhone || '';
    processed.clientEmail = processed.clientEmail || '';
    processed.clientPin = '';

    // Mediator data from form input
    processed.mediatorName = processed.mediatorCompanyName || '';
    processed.mediatorAddress = processed.mediatorCompanyAddress || '';
    processed.mediatorTaxNumber = processed.mediatorCompanyTaxNumber || '';
    processed.mediatorManager = processed.mediatorCompanyManager || '';
    processed.mediatorPhone = processed.mediatorCompanyPhone || '';
    processed.mediatorEmail = processed.mediatorCompanyEmail || '';
  }

  // Enhanced default values for comprehensive legal fields
  processed.agreementDuration = processed.agreementDuration || '';
  processed.territoryScope = processed.territoryScope || '';
  processed.typeOfMediation = processed.typeOfMediation || '';
  processed.specificContractType = processed.specificContractType || '';
  processed.targetContractValueRange = processed.targetContractValueRange || '';
  processed.commissionRate = processed.commissionRate || '';
  processed.commissionCalculation = processed.commissionCalculation || '';
  processed.fixedCommissionAmount = processed.fixedCommissionAmount || '';
  processed.minimumCommission = processed.minimumCommission || '';
  processed.maximumCommission = processed.maximumCommission || '';
  processed.paymentTiming = processed.paymentTiming || '';

  // Legal terms with proper defaults
  processed.costReimbursement = processed.costReimbursement === true || processed.costReimbursement === 'true';
  processed.travelCostsIncluded = processed.travelCostsIncluded === true || processed.travelCostsIncluded === 'true';
  processed.advertisementCostsIncluded = processed.advertisementCostsIncluded === true || processed.advertisementCostsIncluded === 'true';
  processed.legalConsultationCostsIncluded = processed.legalConsultationCostsIncluded === true || processed.legalConsultationCostsIncluded === 'true';
  processed.confidentialityPeriod = processed.confidentialityPeriod || '3 години';
  processed.mediatorDiaryRequired = processed.mediatorDiaryRequired !== false; // Default true - legally required
  processed.writtenAuthorizationForPerformance = processed.writtenAuthorizationForPerformance === true || processed.writtenAuthorizationForPerformance === 'true';
  processed.exclusiveMediation = processed.exclusiveMediation === true || processed.exclusiveMediation === 'true';
  processed.dualRepresentationAllowed = processed.dualRepresentationAllowed === true || processed.dualRepresentationAllowed === 'true';
  processed.earlyTerminationNoticePeriod = processed.earlyTerminationNoticePeriod || 'Без известување';
  processed.disputeResolution = processed.disputeResolution || 'Суд во Скопје';

  return processed;
};

// Simplified validation function - only check absolute essentials
const validateMediationAgreementData = (formData) => {
  const errors = {};
  const warnings = [];
  const missing = [];

  // Only check absolutely essential fields
  if (!formData.agreementDate) missing.push('agreementDate');
  if (!formData.userRole) missing.push('userRole');

  // Optional warnings for quality (won't prevent generation)
  if (formData.naturalClientPin && !/^\d{13}$/.test(formData.naturalClientPin)) {
    warnings.push('ЕМБГ мора да содржи точно 13 цифри');
  }

  if (formData.commissionRate) {
    const rate = parseFloat(formData.commissionRate);
    if (isNaN(rate) || rate < 0.1 || rate > 50) {
      warnings.push('Стапката на комисија треба да биде помеѓу 0.1% и 50%');
    }
  }

  // Email format warnings (won't prevent generation)
  const emailFields = ['mediatorCompanyEmail', 'naturalClientEmail', 'legalClientEmail'];
  emailFields.forEach(field => {
    if (formData[field] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field])) {
      warnings.push(`Неисправен формат на е-пошта за ${field}`);
    }
  });

  const isValid = missing.length === 0;

  // Log for debugging
  if (!isValid) {
    console.log('[Mediation Agreement] Validation failed. Missing fields:', missing);
    console.log('[Mediation Agreement] Received formData keys:', Object.keys(formData));
  }

  if (warnings.length > 0) {
    console.log('[Mediation Agreement] Warnings:', warnings);
  }

  return {
    isValid,
    message: isValid ? 'Validation passed' : `Недостасуваат задолжителни полиња: ${missing.join(', ')}`,
    warnings,
    errors,
    missing
  };
};

// Create the enhanced mediation agreement controller using the base factory
const mediationAgreementController = createDocumentController({
  templateFunction: generateMediationAgreementDoc,
  requiredFields: REQUIRED_FIELDS,
  documentName: 'договор-за-посредување',
  validateFunction: validateMediationAgreementData,
  preprocessFunction: preprocessMediationAgreementData
});

module.exports = mediationAgreementController;