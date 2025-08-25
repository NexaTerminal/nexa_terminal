const crypto = require('crypto');

/**
 * Simple CSRF Protection Implementation
 * Using double-submit cookie pattern
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production';

/**
 * Generate a CSRF token
 * @returns {string} CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

/**
 * Verify CSRF token
 * @param {string} token - Token from request
 * @param {string} cookieToken - Token from cookie
 * @returns {boolean} Whether tokens match
 */
const verifyCSRFToken = (token, cookieToken) => {
  if (!token || !cookieToken) {
    return false;
  }
  
  // Use crypto.timingSafeEqual to prevent timing attacks
  try {
    const tokenBuffer = Buffer.from(token, 'hex');
    const cookieBuffer = Buffer.from(cookieToken, 'hex');
    
    if (tokenBuffer.length !== cookieBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(tokenBuffer, cookieBuffer);
  } catch (error) {
    console.error('CSRF token verification error:', error);
    return false;
  }
};

/**
 * Middleware to generate and set CSRF token
 */
const setCSRFToken = (req, res, next) => {
  const token = generateCSRFToken();
  
  // Set secure cookie with CSRF token
  res.cookie('csrfToken', token, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
  
  // Also make token available to the response
  req.csrfToken = token;
  next();
};

/**
 * Middleware to verify CSRF token
 */
const verifyCSRFMiddleware = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF in development if disabled
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CSRF === 'true') {
    console.warn('CSRF protection disabled in development');
    return next();
  }
  
  const tokenFromHeader = req.get('X-CSRF-Token') || req.get('X-XSRF-Token');
  const tokenFromBody = req.body._csrfToken;
  const tokenFromQuery = req.query._csrfToken;
  const cookieToken = req.cookies.csrfToken;
  
  const submittedToken = tokenFromHeader || tokenFromBody || tokenFromQuery;
  
  if (!verifyCSRFToken(submittedToken, cookieToken)) {
    console.warn('CSRF token verification failed:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      hasToken: !!submittedToken,
      hasCookie: !!cookieToken,
      timestamp: new Date().toISOString()
    });
    
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }
  
  next();
};

/**
 * Route to get CSRF token
 */
const getCSRFToken = (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken
  });
};

/**
 * Middleware to exempt certain routes from CSRF protection
 */
const exemptCSRF = (exemptRoutes = []) => {
  return (req, res, next) => {
    const isExempt = exemptRoutes.some(route => {
      if (typeof route === 'string') {
        return req.path === route;
      }
      if (route instanceof RegExp) {
        return route.test(req.path);
      }
      return false;
    });
    
    if (isExempt) {
      return next();
    }
    
    return verifyCSRFMiddleware(req, res, next);
  };
};

module.exports = {
  generateCSRFToken,
  verifyCSRFToken,
  setCSRFToken,
  verifyCSRFMiddleware,
  exemptCSRF,
  getCSRFToken
};
