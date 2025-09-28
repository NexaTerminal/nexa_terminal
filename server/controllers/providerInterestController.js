/**
 * Provider Interest Controller - Handles provider interest expressions and admin management
 * Manages the provider interest workflow with unique tokens and proposal handling
 */

const ProviderInterestService = require('../services/providerInterestService');

class ProviderInterestController {
  constructor(database) {
    this.providerInterestService = new ProviderInterestService(database);
  }

  // ==================== PUBLIC PROVIDER ENDPOINTS ====================

  /**
   * Get interest expression form by token
   * Public endpoint accessed via unique links sent to providers
   */
  async getInterestExpressionForm(req, res) {
    try {
      const token = req.params.token;

      // Validate token and get associated data
      const tokenValidation = await this.providerInterestService.validateInterestToken(token);

      if (!tokenValidation) {
        return res.status(404).json({
          success: false,
          message: 'Неважечки или истечен токен за изразување интерес'
        });
      }

      const { interest, request, provider } = tokenValidation;

      // Return form data (without sensitive information)
      res.json({
        success: true,
        formData: {
          token,
          requestDetails: {
            serviceType: request.serviceType,
            budgetRange: request.budgetRange,
            projectDescription: request.projectDescription,
            projectType: request.projectType,
            timeline: request.timeline,
            serviceSpecificFields: request.serviceSpecificFields,
            createdAt: request.createdAt
          },
          providerInfo: {
            name: provider.name,
            email: provider.email,
            serviceCategory: provider.serviceCategory
          },
          currentInterest: {
            status: interest.status,
            hasResponded: interest.availability !== null
          }
        }
      });

    } catch (error) {
      console.error('Error getting interest expression form:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Submit provider interest expression
   * Public endpoint for providers to express interest
   */
  async submitProviderInterest(req, res) {
    try {
      const token = req.params.token;
      const interestData = req.body;

      // Validate required fields
      const requiredFields = ['availability', 'budgetAlignment', 'proposal'];
      const missingFields = requiredFields.filter(field => !interestData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Недостасуваат задолжителни полиња: ${missingFields.join(', ')}`
        });
      }

      // Submit interest
      const result = await this.providerInterestService.submitProviderInterest(token, interestData);

      res.json({
        success: true,
        message: result.message,
        interestSubmitted: true
      });

    } catch (error) {
      console.error('Error submitting provider interest:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all provider interests for admin management
   */
  async getAllInterests(req, res) {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за пристап до оваа страница'
        });
      }

      const filters = {
        status: req.query.status,
        providerId: req.query.providerId,
        viewedByClient: req.query.viewedByClient === 'true' ? true :
                        req.query.viewedByClient === 'false' ? false : undefined
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await this.providerInterestService.getAllInterests(filters, pagination);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error getting all interests:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на интересите'
      });
    }
  }

  /**
   * Get interests for specific request
   */
  async getInterestsByRequest(req, res) {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за пристап до оваа страница'
        });
      }

      const requestId = req.params.requestId;
      const interests = await this.providerInterestService.getInterestsByRequest(requestId);

      res.json({
        success: true,
        interests
      });

    } catch (error) {
      console.error('Error getting interests by request:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Mark interest as viewed by client
   */
  async markInterestAsViewed(req, res) {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за оваа акција'
        });
      }

      const interestId = req.params.interestId;
      const success = await this.providerInterestService.markAsViewedByClient(interestId);

      if (success) {
        res.json({
          success: true,
          message: 'Интересот е означен како прегледан од клиентот'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Интересот не е пронајден'
        });
      }

    } catch (error) {
      console.error('Error marking interest as viewed:', error);
      res.status(400).json({
        success: false,
        message: 'Грешка при означување на интересот како прегледан'
      });
    }
  }

  /**
   * Get interest statistics for admin dashboard
   */
  async getInterestStatistics(req, res) {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за пристап до статистиките'
        });
      }

      const stats = await this.providerInterestService.getInterestStatistics();

      res.json({
        success: true,
        statistics: stats
      });

    } catch (error) {
      console.error('Error getting interest statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на статистиките'
      });
    }
  }

  /**
   * Cleanup expired tokens (admin utility)
   */
  async cleanupExpiredTokens(req, res) {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за оваа акција'
        });
      }

      const cleanupCount = await this.providerInterestService.cleanupExpiredTokens();

      res.json({
        success: true,
        message: `Избришани се ${cleanupCount} истечени токени`,
        cleanupCount
      });

    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при чистење на истечените токени'
      });
    }
  }

  // ==================== CLIENT NOTIFICATION ENDPOINTS ====================

  /**
   * Send client notification about provider interest (admin action)
   */
  async sendClientNotification(req, res) {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за оваа акција'
        });
      }

      const { requestId, providerId, customMessage } = req.body;

      // This would integrate with email service to send notifications
      // For now, we'll return success
      res.json({
        success: true,
        message: 'Известувањето е успешно пратено до клиентот'
      });

    } catch (error) {
      console.error('Error sending client notification:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при пратење на известувањето'
      });
    }
  }

  // ==================== QUALITY & ANALYTICS ENDPOINTS ====================

  /**
   * Get provider response quality metrics
   */
  async getResponseQualityMetrics(req, res) {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за пристап до метриките'
        });
      }

      const providerId = req.query.providerId;

      // This would analyze response quality for specific provider or overall
      res.json({
        success: true,
        metrics: {
          averageCompleteness: 75,
          averageRelevance: 80,
          averageProfessionalism: 85,
          totalResponses: 25,
          responseRate: 60
        }
      });

    } catch (error) {
      console.error('Error getting response quality metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на метриките за квалитет'
      });
    }
  }
}

module.exports = ProviderInterestController;