const UserAnalyticsService = require('../services/userAnalyticsService');

/**
 * Activity Logger Middleware
 * Automatically tracks user activities across the platform
 */
class ActivityLogger {
  constructor() {
    this.analyticsService = null;
  }

  // Initialize with database connection
  initialize(db) {
    this.analyticsService = new UserAnalyticsService(db);
  }

  /**
   * Track login activity
   */
  trackLogin(req, res, next) {
    if (req.user && this.analyticsService) {
      this.analyticsService.trackActivity(req.user.id, 'login', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      }).catch(err => console.error('Login tracking error:', err));
    }
    next();
  }

  /**
   * Track document generation
   */
  trackDocumentGeneration(documentType) {
    return (req, res, next) => {
      if (req.user && this.analyticsService) {
        this.analyticsService.trackActivity(req.user.id, 'document_generated', {
          documentType,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true
        }).catch(err => console.error('Document tracking error:', err));
      }
      next();
    };
  }

  /**
   * Track AI assistant queries
   */
  trackAIQuery(req, res, next) {
    if (req.user && this.analyticsService) {
      this.analyticsService.trackActivity(req.user.id, 'ai_query', {
        queryType: req.body.type || 'general',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }).catch(err => console.error('AI query tracking error:', err));
    }
    next();
  }

  /**
   * Track social media posts
   */
  trackSocialPost(req, res, next) {
    if (req.user && this.analyticsService) {
      this.analyticsService.trackActivity(req.user.id, 'social_post', {
        platform: req.body.platform,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }).catch(err => console.error('Social post tracking error:', err));
    }
    next();
  }

  /**
   * Track compliance report requests
   */
  trackComplianceReport(req, res, next) {
    if (req.user && this.analyticsService) {
      this.analyticsService.trackActivity(req.user.id, 'compliance_report', {
        reportType: req.body.reportType || 'general',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }).catch(err => console.error('Compliance report tracking error:', err));
    }
    next();
  }

  /**
   * Track verification activities
   */
  trackVerification(action) {
    return (req, res, next) => {
      if (req.user && this.analyticsService) {
        this.analyticsService.trackActivity(req.user.id, 'verification', {
          verificationAction: action,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }).catch(err => console.error('Verification tracking error:', err));
      }
      next();
    };
  }

  /**
   * Track profile updates
   */
  trackProfileUpdate(req, res, next) {
    if (req.user && this.analyticsService) {
      this.analyticsService.trackActivity(req.user.id, 'profile_update', {
        updateType: 'profile',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }).catch(err => console.error('Profile update tracking error:', err));
    }
    next();
  }

  /**
   * Generic activity tracker
   */
  trackActivity(action, getMetadata = () => ({})) {
    return (req, res, next) => {
      if (req.user && this.analyticsService) {
        const metadata = {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          ...getMetadata(req)
        };
        
        this.analyticsService.trackActivity(req.user.id, action, metadata)
          .catch(err => console.error(`Activity tracking error (${action}):`, err));
      }
      next();
    };
  }

  /**
   * Track response success/failure
   */
  trackResponse(action) {
    return (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        if (req.user && req.activityLogger?.analyticsService) {
          const success = res.statusCode >= 200 && res.statusCode < 400;
          req.activityLogger.analyticsService.trackActivity(req.user.id, action, {
            success,
            statusCode: res.statusCode,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }).catch(err => console.error('Response tracking error:', err));
        }
        
        return originalSend.call(this, data);
      };
      
      req.activityLogger = req.app.locals.activityLogger;
      next();
    };
  }
}

// Export singleton instance
const activityLogger = new ActivityLogger();

module.exports = activityLogger;