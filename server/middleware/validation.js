const Joi = require('joi');

/**
 * Validation schemas for different inputs
 */
const schemas = {
  // User registration validation
  userRegistration: Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().min(8).max(128).required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    firstName: Joi.string().min(1).max(50).required().trim(),
    lastName: Joi.string().min(1).max(50).required().trim(),
    role: Joi.string().valid('user', 'admin').default('user')
  }),

  // User login validation
  userLogin: Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().min(1).max(128).required()
  }),

  // Document generation validation
  documentGeneration: Joi.object({
    documentType: Joi.string().min(1).max(100).required().trim(),
    templateName: Joi.string().min(1).max(200).required().trim(),
    category: Joi.string().min(1).max(100).required().trim()
  }).unknown(true), // Allow additional fields for form data

  // Consent for Personal Data Processing document validation
  consentPersonalDataProcessing: Joi.object({
    formData: Joi.object({
      employeeName: Joi.string().min(1).max(200).required().trim(),
      employeeAddress: Joi.string().min(1).max(500).required().trim(),
      employeeWorkPosition: Joi.string().min(1).max(200).required().trim(),
      // Optional fields that might be added later
      processingPurposes: Joi.string().allow('').trim(),
      dataTypes: Joi.string().allow('').trim(),
      legalBasis: Joi.string().allow('').trim(),
      retentionPeriod: Joi.string().allow('').trim(),
      dataSubjectRights: Joi.string().allow('').trim()
    }).required()
  }),

  // Company verification validation
  companyVerification: Joi.object({
    companyName: Joi.string().min(1).max(200).required().trim(),
    registrationNumber: Joi.string().min(1).max(50).required().trim(),
    address: Joi.string().min(1).max(300).required().trim(),
    contactEmail: Joi.string().email().required().trim(),
    contactPhone: Joi.string().min(8).max(20).required().trim(),
    businessType: Joi.string().min(1).max(100).required().trim(),
    description: Joi.string().max(1000).allow('').trim()
  }),

  // Contact form validation
  contactForm: Joi.object({
    name: Joi.string().min(1).max(100).required().trim(),
    email: Joi.string().email().required().trim(),
    subject: Joi.string().min(1).max(200).required().trim(),
    message: Joi.string().min(10).max(2000).required().trim(),
    phone: Joi.string().min(8).max(20).allow('').trim()
  }),

  // Social post validation
  socialPost: Joi.object({
    content: Joi.string().min(1).max(2000).required().trim(),
    type: Joi.string().valid('text', 'link', 'image').default('text'),
    url: Joi.string().uri().allow('').trim(),
    tags: Joi.array().items(Joi.string().min(1).max(50).trim()).max(5)
  })
};

/**
 * Middleware factory for validating request body
 * @param {string} schemaName - Name of the validation schema to use
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validateInput = (schemaName, source = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Invalid validation schema'
      });
    }

    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types (e.g., strings to numbers)
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Replace the original data with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Sanitize string inputs to prevent NoSQL injection
 * @param {any} input - Input to sanitize
 * @returns {any} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential NoSQL injection patterns
    return input
      .replace(/\$where/gi, '')
      .replace(/\$ne/gi, '')
      .replace(/\$gt/gi, '')
      .replace(/\$lt/gi, '')
      .replace(/\$in/gi, '')
      .replace(/\$nin/gi, '')
      .replace(/\$or/gi, '')
      .replace(/\$and/gi, '')
      .replace(/\$regex/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/eval\(/gi, '')
      .replace(/function\(/gi, '');
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        // Sanitize object keys and values
        const sanitizedKey = typeof key === 'string' ? sanitizeInput(key) : key;
        sanitized[sanitizedKey] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
};

/**
 * Middleware to sanitize all request data
 */
const sanitizeRequest = (req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    next();
  } catch (error) {
    console.error('Request sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid request data'
    });
  }
};

/**
 * Validate ObjectId format
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    next();
  };
};

module.exports = {
  validateInput,
  sanitizeRequest,
  sanitizeInput,
  validateObjectId,
  schemas
};
