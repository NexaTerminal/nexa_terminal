// server/models/User.js

// This file defines the conceptual structure of a User document.
// It's not a Mongoose schema, as the project uses the native MongoDB driver.
// userService.js is responsible for actual database interactions and schema enforcement.

const userSchemaDefinition = {
  userName: { type: 'String', required: true, unique: true, trim: true, lowercase: true },
  password: { type: 'String', required: true },
  isAdmin: { type: 'Boolean', default: false },
  isVerified: { type: 'Boolean', default: false },
  officialEmail: { type: 'String', lowercase: true, trim: true, default: '' },
  companyInfo: {
    companyName: { type: 'String', trim: true, default: '' },
    companyAddress: { type: 'String', trim: true, default: '' },
    companyTaxNumber: { type: 'String', trim: true, default: '' },
    companyManager: { type: 'String', trim: true, default: '' },
    missionStatement: { type: 'String', trim: true, default: '' },
    website: { type: 'String', trim: true, default: '' },
    facebook: { type: 'String', trim: true, default: '' },
    linkedin: { type: 'String', trim: true, default: '' }
  },
  credits: {
    balance: { type: 'Number', default: 14 },
    weeklyAllocation: { type: 'Number', default: 14 },
    lastResetDate: { type: 'Date', default: null },
    lifetimeEarned: { type: 'Number', default: 14 },
    lifetimeSpent: { type: 'Number', default: 0 }
  },
  referralCode: { type: 'String', unique: true, sparse: true },
  referredBy: { type: 'String', default: null },
  referrals: {
    type: 'Array',
    default: [],
    items: {
      userId: { type: 'ObjectId' },
      email: { type: 'String' },
      status: { type: 'String' }, // 'pending', 'active', 'inactive'
      invitedAt: { type: 'Date' },
      activatedAt: { type: 'Date' }
    }
  },
  createdAt: { type: 'Date', default: Date.now },
  updatedAt: { type: 'Date', default: Date.now },
  lastLogin: { type: 'Date', default: null }
};

// Example validation function (can be expanded and used in userService)
function validateUser(userData, isNewUser = false) {
  const errors = [];
  if (isNewUser) {
    if (!userData.userName || typeof userData.userName !== 'string' || userData.userName.trim().length < 3) {
      errors.push('Username is required and must be at least 3 characters.');
    }
    if (!userData.password || typeof userData.password !== 'string' || userData.password.length < 6) {
      errors.push('Password is required and must be at least 6 characters.');
    }
  }

  if (userData.officialEmail && (typeof userData.officialEmail !== 'string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(userData.officialEmail.trim()))) {
    errors.push('Invalid email format for official email.');
  }
  
  // Validations for companyInfo fields
  if (userData.companyInfo) {
    if (userData.companyInfo.hasOwnProperty('contactEmail') && userData.companyInfo.contactEmail && 
        (typeof userData.companyInfo.contactEmail !== 'string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(userData.companyInfo.contactEmail.trim()))) {
      errors.push('Invalid email format for company contact email.');
    }

    if (userData.companyInfo.hasOwnProperty('companyPIN') && userData.companyInfo.companyPIN !== null && typeof userData.companyInfo.companyPIN !== 'string') {
      // Example: Add more specific validation like length or format if needed
      // if (userData.companyInfo.companyPIN.length !== 8) errors.push('Company PIN must be 8 characters.');
      errors.push('Company PIN must be a string.'); 
    }

    if (userData.companyInfo.hasOwnProperty('taxNumber') && userData.companyInfo.taxNumber !== null && typeof userData.companyInfo.taxNumber !== 'string') {
      // Example: Add more specific validation for tax number format if needed
      errors.push('Tax number must be a string.');
    }
    // Add more validation rules for other companyInfo fields as needed
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  userSchemaDefinition,
  validateUser,
};
