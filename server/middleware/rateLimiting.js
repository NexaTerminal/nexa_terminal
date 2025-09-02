const rateLimit = require('express-rate-limit');

// Create rate limiting middleware for different endpoints
class RateLimitingService {
  
  // General authentication rate limiter
  static createAuthLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 requests per window per IP
      message: {
        error: 'Премногу обиди за автентикација. Обидете се повторно за 15 минути.',
        retryAfter: '15 минути',
        code: 'RATE_LIMIT_AUTH'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit by IP address
        return req.ip;
      },
      skip: (req) => {
        // Skip rate limiting in development for easier testing
        return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
      }
    });
  }

  // Strict login rate limiter
  static createLoginLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts per window
      skipSuccessfulRequests: true, // Don't count successful logins
      message: {
        error: 'Премногу неуспешни обиди за најава. Обидете се повторно за 15 минути.',
        retryAfter: '15 минути',
        code: 'RATE_LIMIT_LOGIN'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit by IP and optionally by username/email
        const identifier = req.body?.username || req.body?.email || '';
        return `${req.ip}-${identifier.toLowerCase()}`;
      }
    });
  }

  // Password reset request limiter
  static createPasswordResetLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 password reset requests per hour
      message: {
        error: 'Премногу барања за ресетирање на лозинка. Обидете се повторно за 1 час.',
        retryAfter: '1 час',
        code: 'RATE_LIMIT_PASSWORD_RESET'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit by IP and email combination
        const email = req.body?.email || '';
        return `${req.ip}-${email.toLowerCase()}`;
      }
    });
  }

  // Registration rate limiter
  static createRegistrationLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 registrations per hour per IP
      message: {
        error: 'Премногу обиди за регистрација. Обидете се повторно за 1 час.',
        retryAfter: '1 час',
        code: 'RATE_LIMIT_REGISTRATION'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip;
      }
    });
  }

  // Token validation rate limiter (for password reset tokens)
  static createTokenValidationLimiter() {
    return rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 10, // 10 token validation attempts per window
      message: {
        error: 'Премногу обиди за валидација на токен. Обидете се повторно за 10 минути.',
        retryAfter: '10 минути',
        code: 'RATE_LIMIT_TOKEN_VALIDATION'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit by IP and token combination
        const token = req.body?.token || req.query?.token || '';
        return `${req.ip}-${token.substring(0, 8)}`;
      }
    });
  }

  // Password change rate limiter (for authenticated users)
  static createPasswordChangeLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 password changes per hour
      message: {
        error: 'Премногу обиди за промена на лозинка. Обидете се повторно за 1 час.',
        retryAfter: '1 час',
        code: 'RATE_LIMIT_PASSWORD_CHANGE'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Rate limit by user ID and IP
        const userId = req.user?.id || 'anonymous';
        return `${req.ip}-${userId}`;
      }
    });
  }

  // General API rate limiter
  static createGeneralAPILimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window per IP
      message: {
        error: 'Премногу барања до API. Обидете се повторно за 15 минути.',
        retryAfter: '15 минути',
        code: 'RATE_LIMIT_API'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for static assets
        return req.url.startsWith('/static/') || 
               req.url.startsWith('/assets/') ||
               req.url.endsWith('.css') ||
               req.url.endsWith('.js') ||
               req.url.endsWith('.png') ||
               req.url.endsWith('.jpg') ||
               req.url.endsWith('.ico');
      }
    });
  }

  // Aggressive rate limiter for suspicious activity
  static createAggressiveLimiter() {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 3, // Only 3 requests per 5 minutes
      message: {
        error: 'Сомнителна активност детектирана. Пристапот е привремено ограничен.',
        retryAfter: '5 минути',
        code: 'RATE_LIMIT_SUSPICIOUS'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Custom rate limit check for specific scenarios
  static createCustomLimiter(options = {}) {
    const defaults = {
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: {
        error: 'Ограничување на пристап. Обидете се повторно подоцна.',
        code: 'RATE_LIMIT_CUSTOM'
      },
      standardHeaders: true,
      legacyHeaders: false
    };

    return rateLimit({ ...defaults, ...options });
  }

  // Middleware to handle rate limit errors consistently
  static handleRateLimitError() {
    return (error, req, res, next) => {
      if (error && error.type === 'rate-limit') {
        return res.status(429).json({
          success: false,
          error: error.message || 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: error.retryAfter
        });
      }
      next(error);
    };
  }

  // Get all available limiters for easy import
  static getAllLimiters() {
    return {
      auth: this.createAuthLimiter(),
      login: this.createLoginLimiter(),
      passwordReset: this.createPasswordResetLimiter(),
      registration: this.createRegistrationLimiter(),
      tokenValidation: this.createTokenValidationLimiter(),
      passwordChange: this.createPasswordChangeLimiter(),
      generalAPI: this.createGeneralAPILimiter(),
      aggressive: this.createAggressiveLimiter()
    };
  }
}

module.exports = RateLimitingService;