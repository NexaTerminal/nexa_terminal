/**
 * Investment Model Schema Definition
 * Used for managing investment opportunities
 */

const { ObjectId } = require('mongodb');

const InvestmentSchema = {
  title: {
    type: 'string',
    required: true
  },
  description: {
    type: 'string',
    required: true
  },
  summary: {
    type: 'string',
    default: ''
  },
  amount: {
    type: 'number',
    required: true,
    min: 0
  },
  minInvestment: {
    type: 'number',
    min: 0
  },
  duration: {
    type: 'string',
    default: ''
  },
  returnRate: {
    type: 'string',
    default: ''
  },
  riskLevel: {
    type: 'string',
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  sector: {
    type: 'string',
    required: true
  },
  location: {
    type: 'string',
    default: ''
  },
  requirements: {
    type: 'string',
    default: ''
  },
  type: {
    type: 'string',
    required: true,
    enum: ['startup', 'real-estate', 'business', 'other'],
    default: 'other'
  },
  images: {
    type: 'array',
    items: {
      type: 'string'
    },
    default: []
  },
  contactInfo: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' }
    },
    default: {}
  },
  author: {
    type: 'objectId',
    required: true
  },
  status: {
    type: 'string',
    enum: ['active', 'closed', 'pending'],
    default: 'active'
  },
  views: {
    type: 'number',
    default: 0
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
const InvestmentIndexes = [
  { key: { createdAt: -1 }, name: 'createdAt_desc' },
  { key: { author: 1 }, name: 'author_asc' },
  { key: { type: 1 }, name: 'type_asc' },
  { key: { status: 1 }, name: 'status_asc' },
  { key: { location: 1 }, name: 'location_asc' },
  { key: { title: 'text', description: 'text' }, name: 'investment_text_search' }
];

// Validation function
function validateInvestment(investment) {
  const errors = [];
  
  if (!investment.title || investment.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!investment.description || investment.description.trim().length === 0) {
    errors.push('Description is required');
  }
  if (investment.amount === undefined || investment.amount === null) {
    errors.push('Investment amount is required');
  }
  if (investment.amount < 0) {
    errors.push('Investment amount must be non-negative');
  }
  if (!investment.sector || investment.sector.trim().length === 0) {
    errors.push('Sector is required');
  }
  if (!investment.author) {
    errors.push('Author is required');
  }
  
  // Validate type
  const validTypes = ['startup', 'real-estate', 'business', 'other'];
  if (investment.type && !validTypes.includes(investment.type)) {
    errors.push('Invalid investment type');
  }
  
  // Validate risk level
  const validRiskLevels = ['low', 'medium', 'high'];
  if (investment.riskLevel && !validRiskLevels.includes(investment.riskLevel)) {
    errors.push('Invalid risk level');
  }
  
  // Validate status
  const validStatuses = ['active', 'closed', 'pending'];
  if (investment.status && !validStatuses.includes(investment.status)) {
    errors.push('Invalid status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitization function
function sanitizeInvestment(investment) {
  const sanitized = { ...investment };
  
  // Trim string fields
  if (sanitized.title) sanitized.title = sanitized.title.trim();
  if (sanitized.description) sanitized.description = sanitized.description.trim();
  if (sanitized.summary) sanitized.summary = sanitized.summary.trim();
  if (sanitized.sector) sanitized.sector = sanitized.sector.trim();
  if (sanitized.location) sanitized.location = sanitized.location.trim();
  if (sanitized.duration) sanitized.duration = sanitized.duration.trim();
  if (sanitized.returnRate) sanitized.returnRate = sanitized.returnRate.trim();
  if (sanitized.requirements) sanitized.requirements = sanitized.requirements.trim();
  if (sanitized.type) sanitized.type = sanitized.type.trim();
  if (sanitized.status) sanitized.status = sanitized.status.trim();
  if (sanitized.riskLevel) sanitized.riskLevel = sanitized.riskLevel.trim();
  
  // Convert author to ObjectId if it's a string
  if (sanitized.author && typeof sanitized.author === 'string') {
    try {
      sanitized.author = new ObjectId(sanitized.author);
    } catch (error) {
      // Keep as string if conversion fails
    }
  }
  
  // Ensure amount and minInvestment are numbers
  if (sanitized.amount && typeof sanitized.amount === 'string') {
    sanitized.amount = parseFloat(sanitized.amount);
  }
  if (sanitized.minInvestment && typeof sanitized.minInvestment === 'string') {
    sanitized.minInvestment = parseFloat(sanitized.minInvestment);
  }
  
  // Ensure views is a number
  if (sanitized.views && typeof sanitized.views === 'string') {
    sanitized.views = parseInt(sanitized.views);
  }
  
  // Set defaults
  sanitized.type = sanitized.type || 'other';
  sanitized.status = sanitized.status || 'active';
  sanitized.riskLevel = sanitized.riskLevel || 'medium';
  sanitized.images = sanitized.images || [];
  sanitized.contactInfo = sanitized.contactInfo || {};
  sanitized.views = sanitized.views || 0;
  
  // Set timestamps
  const now = new Date();
  if (!sanitized.createdAt) sanitized.createdAt = now;
  sanitized.updatedAt = now;
  
  return sanitized;
}

module.exports = {
  InvestmentSchema,
  InvestmentIndexes,
  validateInvestment,
  sanitizeInvestment,
  collectionName: 'investments'
};
