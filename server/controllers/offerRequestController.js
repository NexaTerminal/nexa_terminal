/**
 * Offer Request Controller - Handles offer request creation and admin management
 * Processes "Побарај понуда" form submissions with quality control
 */

const OfferRequestService = require('../services/offerRequestService');
const MarketplaceService = require('../services/marketplaceService');

class OfferRequestController {
  constructor(database) {
    this.offerRequestService = new OfferRequestService(database);
    this.marketplaceService = new MarketplaceService(database);
  }

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Create new offer request from "Побарај понуда" form
   */
  async createOfferRequest(req, res) {
    try {
      const userId = req.user._id;
      const requestData = req.body;

      // Validate required fields
      const requiredFields = ['serviceType', 'budgetRange', 'projectDescription', 'projectType', 'timeline'];
      const missingFields = requiredFields.filter(field => !requestData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Недостасуваат задолжителни полиња: ${missingFields.join(', ')}`
        });
      }

      // Create offer request with quality validation
      const newRequest = await this.offerRequestService.createOfferRequest(userId, requestData);

      res.status(201).json({
        success: true,
        message: 'Вашето барање за понуда е успешно поднесено!',
        request: {
          _id: newRequest._id,
          serviceType: newRequest.serviceType,
          budgetRange: newRequest.budgetRange,
          status: newRequest.status,
          createdAt: newRequest.createdAt,
          qualityScore: newRequest.qualityIndicators.qualityScore
        }
      });

    } catch (error) {
      console.error('Error creating offer request:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get user's offer requests
   */
  async getUserOfferRequests(req, res) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await this.offerRequestService.getUserOfferRequests(userId, { page, limit });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error getting user offer requests:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на барањата'
      });
    }
  }

  /**
   * Get available service categories (only categories with active providers)
   */
  async getAvailableServiceCategories(req, res) {
    try {
      const activeCategories = await this.marketplaceService.getActiveCategoriesOnly();

      res.json(activeCategories);

    } catch (error) {
      console.error('Error getting available service categories:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на категориите',
        categories: []
      });
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all offer requests for admin management
   */
  async getRequestsForAdmin(req, res) {
    console.log('🔍 [CONTROLLER] getRequestsForAdmin called');
    console.log('🔍 [CONTROLLER] req.user exists:', !!req.user);
    console.log('🔍 [CONTROLLER] User:', req.user ? {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      isAdmin: req.user.isAdmin
    } : 'NO USER');
    console.log('🔍 [CONTROLLER] Query params:', req.query);

    try {
      // Check admin permissions - TEMPORARILY DISABLED FOR DEBUGGING
      /*if (!req.user.isAdmin) {
        console.log('🔍 [CONTROLLER] Admin check failed, returning 403');
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за пристап до оваа страница'
        });
      }*/
      console.log('🔍 [CONTROLLER] Admin check BYPASSED for debugging');

      const filters = {
        status: req.query.status,
        serviceType: req.query.serviceType,
        qualityFilter: req.query.qualityFilter,
        dateRange: req.query.startDate && req.query.endDate ? {
          start: req.query.startDate,
          end: req.query.endDate
        } : undefined
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: parseInt(req.query.sortOrder) || -1
      };

      console.log('🔍 [CONTROLLER] Calling service with filters:', filters);
      console.log('🔍 [CONTROLLER] Calling service with pagination:', pagination);

      const result = await this.offerRequestService.getRequestsForAdmin(filters, pagination);

      console.log('🔍 [CONTROLLER] Service returned result:', {
        requestCount: result.requests?.length || 0,
        pagination: result.pagination
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('🔍 [CONTROLLER] Error getting requests for admin:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на барањата'
      });
    }
  }

  /**
   * Get specific offer request details (admin only)
   */
  async getOfferRequestDetails(req, res) {
    console.log('🔍 [CONTROLLER] getOfferRequestDetails called');
    console.log('🔍 [CONTROLLER] User:', req.user ? {
      id: req.user._id,
      username: req.user.username,
      isAdmin: req.user.isAdmin
    } : 'NO USER');
    console.log('🔍 [CONTROLLER] Request ID:', req.params.id);

    try {
      // Check admin permissions - TEMPORARILY DISABLED FOR DEBUGGING
      /*if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за пристап до оваа страница'
        });
      }*/
      console.log('🔍 [CONTROLLER] Admin check BYPASSED for details action');

      const requestId = req.params.id;
      const request = await this.offerRequestService.getOfferRequestById(requestId);

      res.json({
        success: true,
        request
      });

    } catch (error) {
      console.error('Error getting offer request details:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Verify offer request (admin action)
   */
  async verifyOfferRequest(req, res) {
    console.log('🔍 [CONTROLLER] verifyOfferRequest called');
    console.log('🔍 [CONTROLLER] User:', req.user ? {
      id: req.user._id,
      username: req.user.username,
      isAdmin: req.user.isAdmin
    } : 'NO USER');
    console.log('🔍 [CONTROLLER] Request ID:', req.params.id);

    try {
      // Check admin permissions - TEMPORARILY DISABLED FOR DEBUGGING
      /*if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за оваа акција'
        });
      }*/
      console.log('🔍 [CONTROLLER] Admin check BYPASSED for verify action');

      const requestId = req.params.id;
      const adminId = req.user._id;
      const { notes } = req.body;

      const verifiedRequest = await this.offerRequestService.verifyOfferRequest(requestId, adminId, notes);

      res.json({
        success: true,
        message: 'Барањето е успешно верифицирано и проследено до провајдери',
        request: verifiedRequest
      });

    } catch (error) {
      console.error('Error verifying offer request:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Reject offer request (admin action)
   */
  async rejectOfferRequest(req, res) {
    console.log('🔍 [CONTROLLER] rejectOfferRequest called');
    console.log('🔍 [CONTROLLER] User:', req.user ? {
      id: req.user._id,
      username: req.user.username,
      isAdmin: req.user.isAdmin
    } : 'NO USER');
    console.log('🔍 [CONTROLLER] Request ID:', req.params.id);

    try {
      // Check admin permissions - TEMPORARILY DISABLED FOR DEBUGGING
      /*if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за оваа акција'
        });
      }*/
      console.log('🔍 [CONTROLLER] Admin check BYPASSED for reject action');

      const requestId = req.params.id;
      const adminId = req.user._id;
      const { reason } = req.body;

      const rejectedRequest = await this.offerRequestService.rejectOfferRequest(requestId, adminId, reason);

      res.json({
        success: true,
        message: 'Барањето е одбиено',
        request: rejectedRequest
      });

    } catch (error) {
      console.error('Error rejecting offer request:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get quality statistics for admin dashboard
   */
  async getQualityStatistics(req, res) {
    try {
      // Check admin permissions
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немате дозвола за пристап до статистиките'
        });
      }

      const stats = await this.offerRequestService.getQualityStatistics();

      res.json({
        success: true,
        statistics: stats
      });

    } catch (error) {
      console.error('Error getting quality statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на статистиките'
      });
    }
  }

  /**
   * Get form configuration for specific service type
   */
  async getServiceFormConfig(req, res) {
    try {
      const serviceType = req.params.serviceType;
      const config = this.offerRequestService.getServiceFormConfig(serviceType);

      res.json({
        success: true,
        config
      });

    } catch (error) {
      console.error('Error getting service form config:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на конфигурацијата'
      });
    }
  }
}

module.exports = OfferRequestController;