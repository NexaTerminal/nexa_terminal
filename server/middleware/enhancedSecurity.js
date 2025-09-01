const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

// Redis client for distributed rate limiting (optional)
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    legacyMode: true
  });
  redisClient.connect().catch(console.error);
}

/**
 * Progressive rate limiting with account lockout
 */
const createProgressiveRateLimit = (options) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxAttempts = 5,
    lockoutDuration = 30 * 60 * 1000, // 30 minutes
    keyPrefix = 'rl',
    message = 'Too many requests',
    skipSuccessfulRequests = true
  } = options;

  const store = redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined;

  return rateLimit({
    windowMs,
    max: maxAttempts,
    store,
    keyGenerator: (req) => `${keyPrefix}:${req.ip}:${req.user?.id || 'anon'}`,
    skipSuccessfulRequests,
    handler: (req, res) => {
      // Track failed attempts
      const key = `lockout:${req.ip}:${req.user?.id || 'anon'}`;
      
      if (redisClient) {
        redisClient.incr(key);
        redisClient.expire(key, lockoutDuration / 1000);
      }

      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        lockoutWarning: `Account may be locked after repeated failures`
      });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * Enhanced authentication rate limiting with progressive penalties
 */
const authRateLimitProgressive = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Progressive rate limiting based on IP/user history
    const baseLimit = process.env.NODE_ENV === 'development' ? 20 : 5;
    
    // Reduce limit for repeated offenders
    if (req.ip && req.rateLimit?.resetTime) {
      return Math.max(1, baseLimit - 2);
    }
    return baseLimit;
  },
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.username || req.body?.email || 'unknown'}`,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`Progressive auth rate limit exceeded for IP: ${req.ip}, endpoint: ${req.path}`);
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Account access may be restricted.',
      retryAfter: '15 minutes',
      severity: 'warning'
    });
  }
});

/**
 * Document generation rate limiting
 */
const documentGenerationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // Different limits based on user verification status
    if (req.user?.isVerified && req.user?.companyInfo) {
      return process.env.NODE_ENV === 'development' ? 100 : 20; // Verified companies
    }
    return process.env.NODE_ENV === 'development' ? 10 : 3; // Unverified users
  },
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => `docs:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    const isVerified = req.user?.isVerified && req.user?.companyInfo;
    console.warn(`Document generation limit exceeded for user: ${req.user?.id || req.ip}, verified: ${isVerified}`);
    
    res.status(429).json({
      success: false,
      message: isVerified 
        ? 'Document generation limit exceeded. Please try again later.'
        : 'Complete company verification to increase your document generation limit.',
      retryAfter: '1 hour',
      upgradeMessage: !isVerified ? 'Verify your company to increase limits' : undefined
    });
  }
});

/**
 * Admin endpoint rate limiting
 */
const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 50,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => `admin:${req.user?.id}:${req.ip}`,
  handler: (req, res) => {
    console.error(`SECURITY ALERT: Admin rate limit exceeded for user: ${req.user?.id}, IP: ${req.ip}, endpoint: ${req.path}`);
    
    // Log potential admin abuse
    if (req.app.locals.activityLogger) {
      req.app.locals.activityLogger.logActivity(req.user?.id, 'admin_rate_limit_exceeded', {
        ip: req.ip,
        endpoint: req.path,
        userAgent: req.get('User-Agent')
      });
    }

    res.status(429).json({
      success: false,
      message: 'Admin action rate limit exceeded. This incident has been logged.',
      retryAfter: '5 minutes'
    });
  }
});

/**
 * Speed limiter for suspicious activity
 */
const suspiciousActivitySlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow first 2 requests per window at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `slow:${req.ip}:${req.user?.id || 'anon'}`,
  onLimitReached: (req, res, options) => {
    console.warn(`Suspicious activity detected for IP: ${req.ip}, applying delays`);
  }
});

/**
 * Contact form rate limiting
 */
const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 contact submissions per hour
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => `contact:${req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many contact form submissions. Please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * File upload rate limiting
 */
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    if (req.user?.isVerified) return 20; // Verified users get more uploads
    return 5; // Unverified users limited to 5 uploads/hour
  },
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  keyGenerator: (req) => `upload:${req.user?.id || req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'File upload limit exceeded. Please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * Account lockout middleware
 */
const accountLockoutCheck = async (req, res, next) => {
  if (!redisClient) return next();

  const key = `lockout:${req.ip}:${req.body?.username || req.body?.email || 'unknown'}`;
  
  try {
    const attempts = await redisClient.get(key);
    if (attempts && parseInt(attempts) >= 10) { // Lock after 10 failed attempts
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to repeated failed attempts. Please try again later.',
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        contactSupport: 'Contact support if this is an error'
      });
    }
  } catch (error) {
    console.error('Account lockout check failed:', error);
  }
  
  next();
};

/**
 * Enhanced security logger with threat detection
 */
const enhancedSecurityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Threat patterns
  const threatPatterns = {
    xss: [/<script/i, /javascript:/i, /vbscript:/i, /onload/i, /onerror/i],
    sqli: [/'.*(\s+OR\s+|UNION|SELECT|DROP|DELETE)/i, /\bUNION\b.*\bSELECT\b/i],
    nosqli: [/\$where/i, /\$ne/i, /\$gt/i, /\$regex/i, /\$in.*\[.*\]/i],
    pathTraversal: [/\.\.[\/\\]/i, /etc\/passwd/i, /boot\.ini/i],
    commandInjection: [/[;&|`]/i, /\bcat\s+/i, /\bls\s+/i, /\bwhoami\b/i]
  };

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      origin: req.get('Origin')
    }
  });

  let threatLevel = 'low';
  const detectedThreats = [];

  // Analyze for threats
  Object.keys(threatPatterns).forEach(threatType => {
    const patterns = threatPatterns[threatType];
    if (patterns.some(pattern => pattern.test(requestData))) {
      detectedThreats.push(threatType);
      threatLevel = 'high';
    }
  });

  // Log suspicious activity
  if (detectedThreats.length > 0 || threatLevel === 'high') {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      threats: detectedThreats,
      threatLevel,
      userId: req.user?.id,
      sessionId: req.sessionID,
      requestSize: req.get('content-length') || 0
    };

    console.warn('🚨 SECURITY THREAT DETECTED:', securityEvent);

    // Log to activity logger if available
    if (req.app.locals.activityLogger) {
      req.app.locals.activityLogger.logActivity(
        req.user?.id || 'anonymous',
        'security_threat_detected',
        securityEvent
      );
    }

    // Block high-threat requests
    if (threatLevel === 'high' && detectedThreats.length > 2) {
      return res.status(403).json({
        success: false,
        message: 'Request blocked by security filter',
        incident: `SEC-${Date.now()}`
      });
    }
  }

  // Track response time for performance monitoring
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 10000) { // Log slow requests > 10s
      console.warn(`Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });

  next();
};

module.exports = {
  createProgressiveRateLimit,
  authRateLimitProgressive,
  documentGenerationLimit,
  adminRateLimit,
  suspiciousActivitySlowDown,
  contactRateLimit,
  uploadRateLimit,
  accountLockoutCheck,
  enhancedSecurityLogger,
  
  // Utility functions
  setupRedisStore: () => redisClient,
  isRedisConnected: () => !!redisClient?.isReady
};