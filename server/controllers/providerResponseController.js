/**
 * Provider Response Controller - Public API for provider responses without authentication
 * Handles token validation, response submission, and security tracking
 */

const { ObjectId } = require('mongodb');
const ProviderInterestService = require('../services/providerInterestService');

class ProviderResponseController {
  constructor(database) {
    this.db = database;
    this.providerInterestService = new ProviderInterestService(database);
  }

  /**
   * Validate provider response token (GET /api/provider-response/validate/:token)
   */
  async validateToken(req, res) {
    try {
      const { token } = req.params;

      if (!token || token.length < 32) {
        return res.status(400).json({
          success: false,
          message: 'Неважечки токен'
        });
      }

      // Extract security data from headers
      const securityData = {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || req.headers['x-user-agent'] || 'unknown',
        timestamp: new Date()
      };

      // Validate token with security tracking
      const tokenValidation = await this.providerInterestService.validateResponseToken(token, securityData);

      // Return sanitized data (no sensitive information)
      const response = {
        success: true,
        valid: true,
        request: {
          serviceType: tokenValidation.request.serviceType,
          budgetRange: tokenValidation.request.budgetRange,
          projectDescription: tokenValidation.request.projectDescription,
          projectType: tokenValidation.request.projectType,
          timeline: tokenValidation.request.timeline,
          serviceSpecificFields: tokenValidation.request.serviceSpecificFields,
          acceptedLocations: tokenValidation.request.acceptedLocations,
          createdAt: tokenValidation.request.createdAt
        },
        provider: {
          name: tokenValidation.provider.name,
          email: tokenValidation.provider.email,
          serviceCategory: tokenValidation.provider.serviceCategory
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Token validation error:', error);

      // Log security event for failed validation
      try {
        await this.providerInterestService.logSecurityEvent('token_validation_failed', {
          token: req.params.token?.substring(0, 8) + '...',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          error: error.message,
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Неважечки или истечен токен'
      });
    }
  }

  /**
   * Submit provider response (POST /api/provider-response/submit/:token)
   */
  async submitResponse(req, res) {
    try {
      const { token } = req.params;
      const responseData = req.body;

      if (!token || token.length < 32) {
        return res.status(400).json({
          success: false,
          message: 'Неважечки токен'
        });
      }

      // Extract security data from headers and request
      const securityData = {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || req.headers['x-user-agent'] || 'unknown',
        responseSource: 'email-link',
        timestamp: new Date()
      };

      // Validate required response type
      if (!responseData.responseType || !['accept', 'decline', 'unsubscribe'].includes(responseData.responseType)) {
        return res.status(400).json({
          success: false,
          message: 'Неважечки тип на одговор'
        });
      }

      // Submit response through service
      const result = await this.providerInterestService.submitProviderResponse(
        token,
        responseData,
        securityData
      );

      res.json({
        success: true,
        message: result.message,
        responseType: result.responseType
      });

    } catch (error) {
      console.error('Response submission error:', error);

      // Log security event for failed submission
      try {
        await this.providerInterestService.logSecurityEvent('response_submission_failed', {
          token: req.params.token?.substring(0, 8) + '...',
          responseType: req.body.responseType,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          error: error.message,
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }

      // Handle specific validation errors
      if (error.message.includes('валидација')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Handle token errors
      if (error.message.includes('токен')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Грешка при праќање на одговорот. Ве молиме обидете се повторно.'
      });
    }
  }

  /**
   * Get response statistics (for monitoring purposes)
   */
  async getResponseStatistics(req, res) {
    try {
      // This endpoint could be protected by admin auth in the future
      const stats = await this.providerInterestService.getResponseStatistics();

      res.json({
        success: true,
        statistics: stats
      });

    } catch (error) {
      console.error('Error getting response statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на статистики'
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      // Basic health check - verify database connection
      await this.db.collection('provider_interests').findOne({}, { projection: { _id: 1 } });

      res.json({
        success: true,
        message: 'Provider response service is healthy',
        timestamp: new Date(),
        version: '1.0.0'
      });

    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Service unavailable',
        timestamp: new Date()
      });
    }
  }

  /**
   * Rate limiting check for security
   */
  async checkRateLimit(req, res, next) {
    try {
      const clientIp = req.ip || req.connection.remoteAddress;
      const now = new Date();
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000);

      // Check requests from this IP in the last hour
      const securityLogs = this.db.collection('security_logs');
      const recentRequests = await securityLogs.countDocuments({
        'eventData.ipAddress': clientIp,
        timestamp: { $gte: oneHour }
      });

      // Allow up to 50 requests per hour per IP
      if (recentRequests > 50) {
        await this.providerInterestService.logSecurityEvent('rate_limit_exceeded', {
          ipAddress: clientIp,
          requestCount: recentRequests,
          timestamp: now
        });

        return res.status(429).json({
          success: false,
          message: 'Премногу барања. Ве молиме обидете се подоцна.'
        });
      }

      next();

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue with request if rate limiting fails
      next();
    }
  }
}

module.exports = ProviderResponseController;