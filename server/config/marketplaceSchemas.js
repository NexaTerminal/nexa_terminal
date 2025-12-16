/**
 * Simplified MongoDB collection schemas for marketplace functionality
 * Automatic service provider enrollment for verified users
 */

const { ObjectId } = require('mongodb');

/**
 * Simplified Service Providers Collection Schema
 * Auto-created when users get verified
 */
const serviceProviderSchema = {
  _id: ObjectId,

  // Reference to user account
  userId: ObjectId, // Reference to users collection

  // Provider Identity (copied from user.companyInfo)
  name: String, // Company name from user.companyInfo.companyName
  email: String, // User email
  phone: String, // From user profile or contact info
  website: String, // From user profile

  // Service Information
  serviceCategory: String, // Single primary category
  specializations: [String], // Specific areas within category

  // Location (from user.companyInfo) - simplified to city string only
  location: String, // City name: "Скопје", "Битола", etc.

  // Admin tracking
  createdBy: ObjectId, // Admin who created (if manually added)

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

/**
 * Predefined Service Categories (7 official categories only)
 * These are hardcoded in the application
 */
const PREDEFINED_SERVICE_CATEGORIES = {
  legal: {
    name: 'legal',
    displayName: { en: 'Legal', mk: 'Правни услуги' },
    icon: '⚖️',
    specializations: ['Corporate Law', 'Contract Law', 'Employment Law', 'Tax Law', 'Intellectual Property']
  },
  accounting: {
    name: 'accounting',
    displayName: { en: 'Accounting', mk: 'Сметководство' },
    icon: '💰',
    specializations: ['Bookkeeping', 'Tax Preparation', 'Financial Planning', 'Auditing', 'Payroll']
  },
  marketing: {
    name: 'marketing',
    displayName: { en: 'Marketing', mk: 'Маркетинг' },
    icon: '📈',
    specializations: ['Digital Marketing', 'Social Media', 'Content Creation', 'SEO', 'Brand Strategy']
  },
  insurance: {
    name: 'insurance',
    displayName: { en: 'Insurance', mk: 'Осигурување' },
    icon: '🛡️',
    specializations: ['Business Insurance', 'Life Insurance', 'Health Insurance', 'Property Insurance', 'Risk Management']
  },
  realestate: {
    name: 'realestate',
    displayName: { en: 'Real Estate Agents', mk: 'Агенти за недвижен имот' },
    icon: '🏢',
    specializations: ['Property Management', 'Real Estate Law', 'Valuation', 'Investment', 'Commercial Leasing']
  },
  itsupport: {
    name: 'itsupport',
    displayName: { en: 'IT Support', mk: 'ИТ поддршка' },
    icon: '💻',
    specializations: ['Technical Support', 'Network Management', 'System Administration', 'Hardware Support', 'Software Installation']
  },
  other: {
    name: 'other',
    displayName: { en: 'Other', mk: 'Друго' },
    icon: '📋',
    specializations: ['General Services', 'Consulting', 'Other Professional Services']
  }
};

// Service Requests Collection REMOVED
// In simplified system, users browse providers directly
// No request/approval workflow needed

// Provider Offers Collection REMOVED
// In simplified system, users contact providers directly
// No offer/approval workflow needed

/**
 * Simplified validation functions for marketplace data
 */
const validators = {
  /**
   * Validate service provider data
   */
  validateServiceProvider(providerData) {
    const errors = [];

    if (!providerData.name || typeof providerData.name !== 'string') {
      errors.push('Provider name is required');
    }

    if (!providerData.email || !this.isValidEmail(providerData.email)) {
      errors.push('Valid email is required');
    }

    if (!providerData.serviceCategory || typeof providerData.serviceCategory !== 'string') {
      errors.push('Service category is required');
    }

    if (!PREDEFINED_SERVICE_CATEGORIES[providerData.serviceCategory]) {
      errors.push('Invalid service category');
    }

    if (!providerData.location || typeof providerData.location !== 'string' || providerData.location.trim() === '') {
      errors.push('Location (city) is required');
    }

    return errors;
  },

  /**
   * Email validation helper
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate ObjectId
   */
  isValidObjectId(id) {
    return ObjectId.isValid(id);
  },

  /**
   * Validate service category
   */
  isValidServiceCategory(category) {
    return PREDEFINED_SERVICE_CATEGORIES.hasOwnProperty(category);
  }
};

/**
 * Utility functions for marketplace
 */
const utils = {
  /**
   * Get all available service categories
   */
  getServiceCategories() {
    return Object.values(PREDEFINED_SERVICE_CATEGORIES);
  },

  /**
   * Get service category by name
   */
  getServiceCategory(categoryName) {
    return PREDEFINED_SERVICE_CATEGORIES[categoryName] || null;
  },

  /**
   * Get categories as options for forms
   */
  getCategoryOptions(language = 'en') {
    return Object.values(PREDEFINED_SERVICE_CATEGORIES).map(cat => ({
      value: cat.name,
      label: cat.displayName[language] || cat.displayName.en,
      icon: cat.icon
    }));
  }
};

module.exports = {
  schemas: {
    serviceProviderSchema
  },
  PREDEFINED_SERVICE_CATEGORIES,
  validators,
  utils
};