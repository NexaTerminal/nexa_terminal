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

// Enhanced validation function for comprehensive legal compliance
const validateMediationAgreementData = (formData) => {
  const errors = {};
  const warnings = [];
  const missing = [];

  // Basic validations
  if (!formData.agreementDate) missing.push('agreementDate');
  if (!formData.userRole) missing.push('userRole');
  if (!formData.agreementDuration) missing.push('agreementDuration');
  if (!formData.territoryScope) missing.push('territoryScope');

  // Role-specific validations
  if (formData.userRole === 'client') {
    if (!formData.clientType) missing.push('clientType');
    if (!formData.mediatorCompanyName) missing.push('mediatorCompanyName');
    if (!formData.mediatorCompanyAddress) missing.push('mediatorCompanyAddress');
    if (!formData.mediatorCompanyTaxNumber) missing.push('mediatorCompanyTaxNumber');
    if (!formData.mediatorCompanyManager) missing.push('mediatorCompanyManager');
    if (!formData.mediatorCompanyPhone) missing.push('mediatorCompanyPhone');
    if (!formData.mediatorCompanyEmail) missing.push('mediatorCompanyEmail');
  } else if (formData.userRole === 'mediator') {
    if (!formData.clientTypeForMediator) missing.push('clientTypeForMediator');

    if (formData.clientTypeForMediator === 'natural') {
      if (!formData.naturalClientName) missing.push('naturalClientName');
      if (!formData.naturalClientAddress) missing.push('naturalClientAddress');
      if (!formData.naturalClientPin) missing.push('naturalClientPin');
      if (!formData.naturalClientPhone) missing.push('naturalClientPhone');
      if (!formData.naturalClientEmail) missing.push('naturalClientEmail');

      // PIN validation
      if (formData.naturalClientPin && !/^\d{13}$/.test(formData.naturalClientPin)) {
        warnings.push('ЕМБГ мора да содржи точно 13 цифри');
      }
    } else if (formData.clientTypeForMediator === 'legal') {
      if (!formData.legalClientName) missing.push('legalClientName');
      if (!formData.legalClientAddress) missing.push('legalClientAddress');
      if (!formData.legalClientTaxNumber) missing.push('legalClientTaxNumber');
      if (!formData.legalClientManager) missing.push('legalClientManager');
      if (!formData.legalClientPhone) missing.push('legalClientPhone');
      if (!formData.legalClientEmail) missing.push('legalClientEmail');
    }
  }

  // Service and financial terms validations
  if (!formData.typeOfMediation) missing.push('typeOfMediation');
  if (!formData.specificContractType) missing.push('specificContractType');
  if (!formData.commissionRate) missing.push('commissionRate');
  if (!formData.commissionCalculation) missing.push('commissionCalculation');
  if (!formData.paymentTiming) missing.push('paymentTiming');

  // Commission rate validation
  if (formData.commissionRate) {
    const rate = parseFloat(formData.commissionRate);
    if (isNaN(rate) || rate < 0.1 || rate > 50) {
      warnings.push('Стапката на комисија треба да биде помеѓу 0.1% и 50%');
    }
  }

  // Fixed commission validation when required
  if (formData.commissionCalculation === 'Фиксен износ' && !formData.fixedCommissionAmount) {
    missing.push('fixedCommissionAmount');
  }

  // Legal terms validations
  if (!formData.confidentialityPeriod) missing.push('confidentialityPeriod');
  if (!formData.earlyTerminationNoticePeriod) missing.push('earlyTerminationNoticePeriod');
  if (!formData.disputeResolution) missing.push('disputeResolution');

  // Email validations
  const emailFields = ['mediatorCompanyEmail', 'naturalClientEmail', 'legalClientEmail'];
  emailFields.forEach(field => {
    if (formData[field] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field])) {
      warnings.push(`Неисправен формат на е-пошта за ${field}`);
    }
  });

  // Legal compliance warnings
  if (!formData.mediatorDiaryRequired) {
    warnings.push('Дневникот на посредување е законски задолжителен според член 877 од ЗОО');
  }

  if (formData.dualRepresentationAllowed && formData.exclusiveMediation) {
    warnings.push('Двојното застапување и ексклузивното посредување се контрадикторни');
  }

  const isValid = missing.length === 0;

  return {
    isValid,
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