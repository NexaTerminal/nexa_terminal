const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const { body, query, param } = require('express-validator');

/**
 * Enhanced security headers configuration
 */
const enhancedSecurityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net" // For CSS libraries if needed
        ],
        scriptSrc: [
          "'self'",
          // Remove 'unsafe-inline' for production
          process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : "'strict-dynamic'"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          process.env.NODE_ENV === 'development' ? "http://localhost:*" : "",
          process.env.API_URL || ""
        ].filter(Boolean),
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: { policy: "require-corp" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
    hidePoweredBy: true
  });
};

/**
 * Input validation and sanitization middleware
 */
const createInputValidator = (validationRules) => {
  return [
    ...validationRules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
          }))
        });
      }
      next();
    }
  ];
};

/**
 * Authentication input validation
 */
const authValidation = {
  register: createInputValidator([
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username must be 3-30 characters, alphanumeric, underscore or dash only'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special character'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format')
  ]),
  
  login: createInputValidator([
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Invalid username format'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required')
  ])
};

/**
 * Document generation validation
 */
const documentValidation = {
  employmentAgreement: createInputValidator([
    body('employeeName')
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-zA-ZčšđžćČŠĐŽĆ\s]+$/)
      .withMessage('Employee name must contain only letters and spaces'),
    body('employeePIN')
      .matches(/^\d{13}$/)
      .withMessage('EMBG must be exactly 13 digits'),
    body('employeeAddress')
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be 5-200 characters'),
    body('jobPosition')
      .isLength({ min: 2, max: 100 })
      .withMessage('Job position must be 2-100 characters'),
    body('netSalary')
      .isFloat({ min: 1, max: 999999 })
      .withMessage('Salary must be a positive number'),
    body('agreementDate')
      .isISO8601()
      .toDate()
      .withMessage('Invalid date format')
  ])
};

/**
 * Admin validation
 */
const adminValidation = {
  userUpdate: createInputValidator([
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Role must be user or admin'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be boolean')
  ]),
  
  bulkAction: createInputValidator([
    body('action')
      .isIn(['activate', 'deactivate', 'suspend', 'unsuspend'])
      .withMessage('Invalid action'),
    body('userIds')
      .isArray({ min: 1, max: 100 })
      .withMessage('UserIds must be array of 1-100 items'),
    body('userIds.*')
      .isMongoId()
      .withMessage('All user IDs must be valid MongoDB IDs')
  ])
};

/**
 * Request size and file upload limits
 */
const createUploadLimits = (options = {}) => {
  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = [
      'image/jpeg',
      'image/png', 
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  } = options;

  return (req, res, next) => {
    // Check content length
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > maxFileSize) {
      return res.status(413).json({
        success: false,
        message: `File too large. Maximum size: ${Math.round(maxFileSize / 1024 / 1024)}MB`
      });
    }

    // Check file type if file upload
    if (req.file) {
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
        });
      }
    }

    next();
  };
};

/**
 * IP-based security checks
 */
const createIPSecurity = (options = {}) => {
  const {
    maxRequestsPerMinute = 60,
    suspiciousIPThreshold = 100,
    blockDuration = 15 * 60 * 1000 // 15 minutes
  } = options;

  const ipTracker = new Map();
  const blockedIPs = new Map();

  return (req, res, next) => {
    const clientIP = req.ip;
    const now = Date.now();
    
    // Check if IP is blocked
    if (blockedIPs.has(clientIP)) {
      const blockedUntil = blockedIPs.get(clientIP);
      if (now < blockedUntil) {
        return res.status(429).json({
          success: false,
          message: 'IP temporarily blocked due to suspicious activity',
          blockedUntil: new Date(blockedUntil).toISOString()
        });
      } else {
        blockedIPs.delete(clientIP);
      }
    }

    // Track requests per IP
    if (!ipTracker.has(clientIP)) {
      ipTracker.set(clientIP, { requests: [], suspicious: 0 });
    }

    const ipData = ipTracker.get(clientIP);
    
    // Clean old requests (older than 1 minute)
    ipData.requests = ipData.requests.filter(timestamp => now - timestamp < 60000);
    
    // Add current request
    ipData.requests.push(now);

    // Check if IP exceeds limits
    if (ipData.requests.length > maxRequestsPerMinute) {
      ipData.suspicious++;
      
      if (ipData.suspicious >= 3) { // Block after 3 violations
        blockedIPs.set(clientIP, now + blockDuration);
        console.warn(`🚫 IP ${clientIP} blocked for suspicious activity`);
        
        return res.status(429).json({
          success: false,
          message: 'IP blocked due to excessive requests',
          blockedFor: `${blockDuration / 60000} minutes`
        });
      }
      
      // Temporary rate limit
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP',
        retryAfter: 60
      });
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [ip, data] of ipTracker) {
        if (data.requests.every(timestamp => now - timestamp > 300000)) { // 5 minutes old
          ipTracker.delete(ip);
        }
      }
    }

    next();
  };
};

/**
 * Advanced request fingerprinting for anomaly detection
 */
const requestFingerprinting = (req, res, next) => {
  const fingerprint = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    acceptLanguage: req.get('Accept-Language'),
    acceptEncoding: req.get('Accept-Encoding'),
    timestamp: Date.now(),
    method: req.method,
    path: req.path,
    sessionId: req.sessionID
  };

  // Detect potential bot traffic
  const botIndicators = [
    !fingerprint.userAgent,
    fingerprint.userAgent && fingerprint.userAgent.length < 20,
    !fingerprint.acceptLanguage,
    !fingerprint.acceptEncoding,
    /bot|crawler|spider|scraper/i.test(fingerprint.userAgent)
  ];

  const suspicionScore = botIndicators.filter(Boolean).length;
  
  if (suspicionScore >= 3) {
    console.warn(`🤖 Potential bot traffic detected from ${req.ip}:`, fingerprint);
    
    // Add additional delays for suspected bots
    return setTimeout(() => next(), Math.random() * 2000 + 1000);
  }

  // Store fingerprint for analysis
  req.fingerprint = fingerprint;
  next();
};

module.exports = {
  enhancedSecurityHeaders,
  createInputValidator,
  authValidation,
  documentValidation,
  adminValidation,
  createUploadLimits,
  createIPSecurity,
  requestFingerprinting
};