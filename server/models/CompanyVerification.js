
/**
 * CompanyVerification Model Schema Definition
 * Used for managing company verification processes
 */

const { ObjectId } = require('mongodb');

const CompanyVerificationSchema = {
  userId: {
    type: 'objectId',
    required: true
  },
  companyInfo: {
    type: 'object',
    properties: {
      companyName: { type: 'string', required: true },
      mission: { type: 'string' },
      website: { type: 'string' },
      industry: { type: 'string' },
      description: { type: 'string' },
      crnNumber: { type: 'string' }, // Company Registration Number
      address: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string' }
    },
    required: true
  },
  documents: {
    type: 'array',
    items: {
      type: { type: 'string', required: true }, // 'registration', 'tax_certificate', 'utility_bill', etc.
      fileName: { type: 'string', required: true },
      filePath: { type: 'string', required: true },
      uploadedAt: { type: 'date', default: () => new Date() }
    },
    default: []
  },
  status: {
    type: 'string',
    enum: ['pending', 'under_review', 'approved', 'rejected', 'requires_additional_info'],
    default: 'pending'
  },
  submittedAt: {
    type: 'date',
    default: () => new Date()
  },
  reviewedAt: {
    type: 'date'
  },
  reviewedBy: {
    type: 'objectId'
  },
  reviewNotes: {
    type: 'string'
  },
  rejectionReason: {
    type: 'string'
  },
  additionalInfoRequested: {
    type: 'string'
  },
  // Auto-approval criteria
  autoApprovalScore: {
    type: 'number',
    default: 0
  },
  verificationChecks: {
    type: 'object',
    properties: {
      domainVerified: { type: 'boolean', default: false },
      phoneVerified: { type: 'boolean', default: false },
      addressVerified: { type: 'boolean', default: false },
      documentsComplete: { type: 'boolean', default: false }
    },
    default: {
      domainVerified: false,
      phoneVerified: false,
      addressVerified: false,
      documentsComplete: false
    }
  },
  createdAt: {
    type: 'date',
    default: () => new Date()
  },
  updatedAt: {
    type: 'date',
    default: () => new Date()
  }
};

// Index definitions for MongoDB
const CompanyVerificationIndexes = [
  { key: { userId: 1 }, name: 'userId_asc' },
  { key: { status: 1 }, name: 'status_asc' },
  { key: { submittedAt: -1 }, name: 'submittedAt_desc' },
  { key: { reviewedAt: -1 }, name: 'reviewedAt_desc' },
  { key: { 'companyInfo.companyName': 1 }, name: 'companyName_asc' }
];

// Validation function
function validateCompanyVerification(verification) {
  const errors = [];
  
  if (!verification.userId) {
    errors.push('User ID is required');
  }
  if (!verification.companyInfo) {
    errors.push('Company information is required');
  } else {
    if (!verification.companyInfo.companyName || verification.companyInfo.companyName.trim().length === 0) {
      errors.push('Company name is required');
    }
  }
  
  // Validate status
  const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'requires_additional_info'];
  if (verification.status && !validStatuses.includes(verification.status)) {
    errors.push('Invalid verification status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitization function
function sanitizeCompanyVerification(verification) {
  const sanitized = { ...verification };
  
  // Convert userId to ObjectId if it's a string
  if (sanitized.userId && typeof sanitized.userId === 'string') {
    try {
      sanitized.userId = new ObjectId(sanitized.userId);
    } catch (error) {
      // Keep as string if conversion fails
    }
  }
  
  // Convert reviewedBy to ObjectId if it's a string
  if (sanitized.reviewedBy && typeof sanitized.reviewedBy === 'string') {
    try {
      sanitized.reviewedBy = new ObjectId(sanitized.reviewedBy);
    } catch (error) {
      // Keep as string if conversion fails
    }
  }
  
  // Sanitize company info
  if (sanitized.companyInfo) {
    const companyInfo = sanitized.companyInfo;
    if (companyInfo.companyName) companyInfo.companyName = companyInfo.companyName.trim();
    if (companyInfo.mission) companyInfo.mission = companyInfo.mission.trim();
    if (companyInfo.website) companyInfo.website = companyInfo.website.trim();
    if (companyInfo.industry) companyInfo.industry = companyInfo.industry.trim();
    if (companyInfo.description) companyInfo.description = companyInfo.description.trim();
    if (companyInfo.crnNumber) companyInfo.crnNumber = companyInfo.crnNumber.trim();
    if (companyInfo.address) companyInfo.address = companyInfo.address.trim();
    if (companyInfo.phone) companyInfo.phone = companyInfo.phone.trim();
    if (companyInfo.email) companyInfo.email = companyInfo.email.trim();
  }
  
  // Set defaults
  sanitized.status = sanitized.status || 'pending';
  sanitized.documents = sanitized.documents || [];
  sanitized.autoApprovalScore = sanitized.autoApprovalScore || 0;
  sanitized.verificationChecks = sanitized.verificationChecks || {
    domainVerified: false,
    phoneVerified: false,
    addressVerified: false,
    documentsComplete: false
  };
  
  // Set timestamps
  const now = new Date();
  if (!sanitized.submittedAt) sanitized.submittedAt = now;
  if (!sanitized.createdAt) sanitized.createdAt = now;
  sanitized.updatedAt = now;
  
  return sanitized;
}

module.exports = {
  CompanyVerificationSchema,
  CompanyVerificationIndexes,
  validateCompanyVerification,
  sanitizeCompanyVerification,
  collectionName: 'companyverifications'
};
