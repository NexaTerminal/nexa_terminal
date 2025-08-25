const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Configure security headers using Helmet
 */
const configureSecurityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "http://localhost:*"],
        connectSrc: ["'self'", "http://localhost:*"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Disable for development
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });
};

/**
 * General rate limiting for all API requests
 */
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More reasonable dev limit
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 10, // More reasonable dev limit
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Rate limiting for file uploads
 */
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    console.warn(`Upload rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * Rate limiting for contact form submissions
 */
const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 contact form submissions per hour
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    console.warn(`Contact rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
    res.status(429).json({
      success: false,
      message: 'Too many contact form submissions, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * Security event logging middleware
 */
const securityLogger = (req, res, next) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload/i,
    /onerror/i,
    /eval\(/i,
    /\$where/i,
    /\$ne/i
  ];

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

  if (isSuspicious) {
    console.warn('Suspicious request detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      data: requestData,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * IP whitelist middleware (for development)
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      if (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP.includes('localhost')) {
        return next();
      }
    }

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      console.warn(`Blocked request from unauthorized IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

/**
 * Request size limiter
 */
const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes

    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
    }

    next();
  };
};

module.exports = {
  configureSecurityHeaders,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  contactRateLimit,
  securityLogger,
  ipWhitelist,
  requestSizeLimiter
};
