/**
 * Enhanced Security Configuration for Server Integration
 * 
 * This file provides the updated security middleware configuration
 * to be integrated into the main server.js file
 */

// Import enhanced security modules
const { 
  authRateLimitProgressive,
  documentGenerationLimit,
  adminRateLimit,
  suspiciousActivitySlowDown,
  contactRateLimit,
  uploadRateLimit,
  accountLockoutCheck,
  enhancedSecurityLogger
} = require('./enhancedSecurity');

const {
  enhancedSecurityHeaders,
  authValidation,
  documentValidation,
  adminValidation,
  createUploadLimits,
  createIPSecurity,
  requestFingerprinting
} = require('./securityEnhancements');

const { createAccountSecurityMiddleware } = require('./accountSecurity');

/**
 * Initialize enhanced security middleware
 */
function initializeEnhancedSecurity(app, database) {
  // Replace existing security headers with enhanced version
  app.use(enhancedSecurityHeaders());

  // Add request fingerprinting and IP security
  app.use(createIPSecurity({
    maxRequestsPerMinute: process.env.NODE_ENV === 'development' ? 200 : 60,
    suspiciousIPThreshold: 150,
    blockDuration: 15 * 60 * 1000
  }));

  app.use(requestFingerprinting);

  // Enhanced security logging (replaces basic securityLogger)
  app.use(enhancedSecurityLogger);

  // Suspicious activity slowdown
  app.use(suspiciousActivitySlowDown);

  // Account security middleware
  const { checkAccountLock, trackLogin, validatePassword, accountSecurity } = 
    createAccountSecurityMiddleware(database);

  // Make account security available to routes
  app.locals.accountSecurity = accountSecurity;

  return {
    checkAccountLock,
    trackLogin,
    validatePassword
  };
}

/**
 * Apply enhanced rate limiting to specific routes
 */
function applyEnhancedRateLimiting(app) {
  // Authentication endpoints - Progressive rate limiting
  app.use('/api/auth/login', authRateLimitProgressive);
  app.use('/api/auth/login-username', authRateLimitProgressive);
  app.use('/api/auth/register', authRateLimitProgressive);
  app.use('/api/auth/direct-login', authRateLimitProgressive);

  // Document generation - Resource protection
  app.use('/api/auto-documents', documentGenerationLimit);

  // Admin endpoints - Strict monitoring
  app.use('/api/admin', adminRateLimit);
  app.use('/api/realtime-admin', adminRateLimit);

  // Contact forms - Spam prevention
  app.use('/api/contact', contactRateLimit);

  // File uploads - Abuse prevention
  app.use('/api/verification/upload', uploadRateLimit);
  app.use('/uploads', uploadRateLimit);

  // Upload size and type restrictions
  app.use(createUploadLimits({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  }));
}

/**
 * Apply input validation to routes
 */
function applyInputValidation(app) {
  // Authentication validation
  app.use('/api/auth/register', authValidation.register);
  app.use('/api/auth/login', authValidation.login);
  app.use('/api/auth/login-username', authValidation.login);

  // Document validation
  app.use('/api/auto-documents/employment-agreement', documentValidation.employmentAgreement);

  // Admin validation
  app.use('/api/admin/users/:id', adminValidation.userUpdate);
  app.use('/api/admin/bulk-action', adminValidation.bulkAction);
}

module.exports = {
  initializeEnhancedSecurity,
  applyEnhancedRateLimiting,
  applyInputValidation
};