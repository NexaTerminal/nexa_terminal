// server/models/User.js

// This file defines the conceptual structure of a User document.
// It's not a Mongoose schema, as the project uses the native MongoDB driver.
// userService.js is responsible for actual database interactions and schema enforcement.

const userSchemaDefinition = {
  username: { type: 'String', required: true, unique: true, trim: true, lowercase: true }, // Added lowercase: true
  password: { type: 'String', required: true },
  email: { type: 'String', unique: true, lowercase: true, trim: true, sparse: true, required: false }, // Optional at signup
  profileComplete: { type: 'Boolean', default: false },
  isAdmin: { type: 'Boolean', default: false },
  companyInfo: {
    companyName: { type: 'String', trim: true, default: '' },
    mission: { type: 'String', trim: true, default: '' },
    website: { type: 'String', trim: true, default: '' },
    industry: { type: 'String', trim: true, default: '' },
    companySize: { type: 'String', trim: true, default: '' }, // Added: Company size
    role: { type: 'String', trim: true, default: '' }, // Added: User's role in company
    description: { type: 'String', trim: true, default: '' },
    crnNumber: { type: 'String', trim: true, default: '' }, // Company Registration Number
    address: { type: 'String', trim: true, default: '' }, // This will store the company address
    phone: { type: 'String', trim: true, default: '' },
    companyPIN: { type: 'String', trim: true, default: '' }, // Added: Company PIN
    taxNumber: { type: 'String', trim: true, default: '' }, // Added: Tax Number
    contactEmail: { type: 'String', lowercase: true, trim: true, default: '' } // Added: Company Contact Email
  },
  isVerified: { type: 'Boolean', default: false },
  profileImage: { type: 'String', default: '' },
  googleId: { type: 'String', sparse: true },
  role: { type: 'String', default: 'user' }, // From userService
  createdAt: { type: 'Date', default: Date.now },
  updatedAt: { type: 'Date', default: Date.now }
};

// Example validation function (can be expanded and used in userService)
function validateUser(userData, isNewUser = false) {
  const errors = [];
  if (isNewUser) {
    if (!userData.username || typeof userData.username !== 'string' || userData.username.trim().length < 3) {
      errors.push('Username is required and must be at least 3 characters.');
    }
    if (!userData.password || typeof userData.password !== 'string' || userData.password.length < 6) {
      errors.push('Password is required and must be at least 6 characters.');
    }
  }

  if (userData.email && (typeof userData.email !== 'string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(userData.email.trim()))) {
    errors.push('Invalid email format for user email.');
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
