const { Packer } = require('docx');

/**
 * Base Document Controller Factory
 * Creates reusable document controllers with common error handling, validation, and response logic
 */
const createDocumentController = (config) => {
  const { 
    templateFunction, 
    requiredFields = [], 
    documentName = 'document',
    validateFunction = null,
    preprocessFunction = null
  } = config;

  return async (req, res) => {
    try {
      // Extract data from request
      const { formData } = req.body;
      const user = req.user;
      
      // Extract company information from user object
      const company = user.companyInfo || {};
      
      // Log user and company data for debugging
      console.log(`[${documentName}] User ID: ${user._id || user.id}`);
      console.log(`[${documentName}] User email: ${user.email}`);
      console.log(`[${documentName}] Company info available:`, !!user.companyInfo);
      
      if (user.companyInfo) {
        console.log(`[${documentName}] Company name: ${user.companyInfo.companyName}`);
        console.log(`[${documentName}] Company address: ${user.companyInfo.address}`);
        console.log(`[${documentName}] Company tax number: ${user.companyInfo.taxNumber}`);
        console.log(`[${documentName}] Company manager: ${user.companyInfo.role}`);
      } else {
        console.log(`[${documentName}] No company info found in user object`);
      }

      // Log request for debugging
      console.log(`[${documentName}] Processing request for user: ${user.email}`);
      console.log(`[${documentName}] Form data keys: ${Object.keys(formData).join(', ')}`);

      // Validate request data
      if (!formData || typeof formData !== 'object') {
        return res.status(400).json({
          message: 'Невалидни податоци во барањето',
          error: 'INVALID_REQUEST_DATA'
        });
      }

      // Custom validation if provided
      if (validateFunction) {
        const validationResult = validateFunction(formData, user, company);
        if (!validationResult.isValid) {
          return res.status(400).json({
            message: validationResult.message || 'Валидацијата не помина',
            errors: validationResult.errors,
            missingFields: validationResult.missing
          });
        }
      }

      // Basic required fields validation
      const missingRequired = validateRequiredFields(formData, requiredFields);
      if (missingRequired.length > 0) {
        console.log(`[${documentName}] Missing required fields: ${missingRequired.join(', ')}`);
        return res.status(400).json({
          message: `Недостасуваат задолжителни полиња: ${missingRequired.join(', ')}`,
          missingFields: missingRequired,
          error: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Preprocess data if needed
      let processedData = formData;
      if (preprocessFunction) {
        processedData = preprocessFunction(formData, user, company);
      }

      // Generate document using the template function
      console.log(`[${documentName}] Generating document...`);
      const doc = templateFunction(processedData, user, company);
      
      if (!doc) {
        throw new Error('Template function returned null or undefined');
      }

      // Convert document to buffer
      const buffer = await Packer.toBuffer(doc);
      
      if (!buffer || buffer.length === 0) {
        throw new Error('Generated document buffer is empty');
      }

      // Generate filename
      const filename = generateFilename(documentName, processedData);
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', buffer.length);

      // Log success
      console.log(`[${documentName}] Document generated successfully. Size: ${buffer.length} bytes`);
      
      // Send the file
      res.send(buffer);

    } catch (error) {
      console.error(`[${documentName}] Error generating document:`, error);
      
      // Handle specific error types
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          message: error.message,
          error: 'VALIDATION_ERROR'
        });
      }

      if (error.name === 'DocumentGenerationError') {
        return res.status(500).json({
          message: 'Грешка при генерирање на документот',
          error: 'DOCUMENT_GENERATION_ERROR'
        });
      }

      // Generic server error
      res.status(500).json({ 
        message: 'Внатрешна грешка на серверот',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
};

/**
 * Validate required fields
 */
const validateRequiredFields = (formData, requiredFields) => {
  const missing = [];
  
  requiredFields.forEach(field => {
    const value = formData[field];
    
    // Check if field is missing or empty
    if (!value) {
      missing.push(field);
      return;
    }
    
    // Check string fields
    if (typeof value === 'string' && !value.trim()) {
      missing.push(field);
      return;
    }
    
    // Check array fields
    if (Array.isArray(value) && value.filter(item => item && item.toString().trim()).length === 0) {
      missing.push(field);
      return;
    }
  });
  
  return missing;
};

/**
 * Generate filename for document
 */
const generateFilename = (documentName, formData) => {
  // Try to get a meaningful name from form data
  const nameField = formData.employeeName || formData.clientName || formData.name || formData.companyName;
  
  // Sanitize document name to remove any non-ASCII characters
  let filename = documentName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  
  if (nameField && typeof nameField === 'string') {
    // Sanitize name for filename - remove all non-ASCII characters to avoid HTTP header issues
    const sanitizedName = nameField
      .replace(/[^a-zA-Z0-9\s]/g, '') // Keep only alphanumeric and spaces
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .toLowerCase()
      .substring(0, 20); // Limit length
      
    if (sanitizedName && sanitizedName.length > 0) {
      filename = `${documentName}-${sanitizedName}`;
    }
  }
  
  // Add timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  filename = `${filename}-${timestamp}.docx`;
  
  return filename;
};

/**
 * Common field cleaning utilities
 */
const cleanFormData = (formData) => {
  const cleaned = { ...formData };
  
  // Clean array fields - remove empty items
  Object.keys(cleaned).forEach(key => {
    if (Array.isArray(cleaned[key])) {
      cleaned[key] = cleaned[key].filter(item => item && item.toString().trim());
    }
  });
  
  // Clean string fields - trim whitespace
  Object.keys(cleaned).forEach(key => {
    if (typeof cleaned[key] === 'string') {
      cleaned[key] = cleaned[key].trim();
    }
  });
  
  // Clean PIN fields - remove spaces for consistent validation
  ['employeePIN', 'PIN', 'pin', 'embg', 'EMBG'].forEach(pinField => {
    if (cleaned[pinField] && typeof cleaned[pinField] === 'string') {
      cleaned[pinField] = cleaned[pinField].replace(/\s/g, '');
    }
  });
  
  return cleaned;
};

/**
 * Common validation functions
 */
const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  date: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },
  
  number: (value) => {
    return !isNaN(value) && !isNaN(parseFloat(value));
  },
  
  nonEmpty: (value) => {
    return value && value.toString().trim().length > 0;
  },
  
  arrayNotEmpty: (arr) => {
    return Array.isArray(arr) && arr.some(item => item && item.toString().trim().length > 0);
  },
  
  // Macedonian PIN validation - must be exactly 13 digits
  pin: (value) => {
    if (!value) return false;
    const cleanPin = value.toString().replace(/\s/g, ''); // Remove spaces
    return /^\d{13}$/.test(cleanPin);
  }
};

module.exports = {
  createDocumentController,
  validateRequiredFields,
  generateFilename,
  cleanFormData,
  validators
};