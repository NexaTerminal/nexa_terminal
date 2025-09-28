/**
 * Offer Request Routes - "Побарај понуда" API endpoints
 * Handles offer request creation, admin management, and quality control
 */

const express = require('express');
const router = express.Router();
const OfferRequestController = require('../controllers/offerRequestController');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const { requireVerification } = require('../middleware/verification');

// Initialize controller (will be done in server.js)
let offerRequestController;

const initializeController = (database) => {
  offerRequestController = new OfferRequestController(database);
};

// ==================== PUBLIC USER ENDPOINTS ====================

/**
 * POST /offer-requests
 * Create new offer request from "Побарај понуда" form
 * Requires: Authentication, Verification
 */
router.post('/',
  authenticateJWT,
  requireVerification,
  async (req, res) => {
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.createOfferRequest(req, res);
    } catch (error) {
      console.error('Route error in create offer request:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при поднесување на барањето'
      });
    }
  }
);

/**
 * GET /offer-requests/my-requests
 * Get current user's offer requests
 * Requires: Authentication
 */
router.get('/my-requests',
  authenticateJWT,
  async (req, res) => {
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.getUserOfferRequests(req, res);
    } catch (error) {
      console.error('Route error in get user requests:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на барањата'
      });
    }
  }
);

// ==================== MARKETPLACE INTEGRATION ENDPOINTS ====================

/**
 * GET /offer-requests/categories/active
 * Get available service categories (only categories with active providers)
 * Requires: Authentication
 */
router.get('/categories/active',
  authenticateJWT,
  async (req, res) => {
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.getAvailableServiceCategories(req, res);
    } catch (error) {
      console.error('Route error in get active categories:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на категориите',
        categories: []
      });
    }
  }
);

/**
 * GET /offer-requests/form-config/:serviceType
 * Get form configuration for specific service type
 * Requires: Authentication
 */
router.get('/form-config/:serviceType',
  authenticateJWT,
  async (req, res) => {
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.getServiceFormConfig(req, res);
    } catch (error) {
      console.error('Route error in get form config:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на конфигурацијата'
      });
    }
  }
);

// ==================== ADMIN MANAGEMENT ENDPOINTS ====================

/**
 * GET /offer-requests/admin
 * Get all offer requests for admin management
 * Requires: Authentication, Admin
 * Query params: status, serviceType, qualityFilter, page, limit, sortBy, sortOrder
 */
router.get('/admin',
  authenticateJWT,
  isAdmin,
  async (req, res) => {
    console.log('🔍 GET /offer-requests/admin - Request received');
    console.log('User:', { id: req.user?._id, isAdmin: req.user?.isAdmin });
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.getRequestsForAdmin(req, res);
    } catch (error) {
      console.error('Route error in get admin requests:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на барањата'
      });
    }
  }
);

/**
 * GET /offer-requests/admin/:id
 * Get specific offer request details for admin
 * Requires: Authentication, Admin
 */
router.get('/admin/:id',
  authenticateJWT,
  isAdmin,
  async (req, res) => {
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.getOfferRequestDetails(req, res);
    } catch (error) {
      console.error('Route error in get request details:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на детали'
      });
    }
  }
);

/**
 * PUT /offer-requests/admin/:id/verify
 * Verify offer request and send to providers
 * Requires: Authentication, Admin
 * Body: { notes?: string }
 */
router.put('/admin/:id/verify',
  authenticateJWT,
  isAdmin,
  async (req, res) => {
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.verifyOfferRequest(req, res);
    } catch (error) {
      console.error('Route error in verify request:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при верификација на барањето'
      });
    }
  }
);

/**
 * PUT /offer-requests/admin/:id/reject
 * Reject offer request
 * Requires: Authentication, Admin
 * Body: { reason: string }
 */
router.put('/admin/:id/reject',
  authenticateJWT,
  isAdmin,
  async (req, res) => {
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.rejectOfferRequest(req, res);
    } catch (error) {
      console.error('Route error in reject request:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при одбивање на барањето'
      });
    }
  }
);

/**
 * GET /offer-requests/admin/statistics/quality
 * Get quality statistics for admin dashboard
 * Requires: Authentication, Admin
 */
router.get('/admin/statistics/quality',
  authenticateJWT,
  isAdmin,
  async (req, res) => {
    console.log('🔍 GET /offer-requests/admin/statistics/quality - Request received');
    console.log('User:', { id: req.user?._id, isAdmin: req.user?.isAdmin });
    try {
      if (!offerRequestController) {
        return res.status(500).json({
          success: false,
          message: 'Серверот не е иницијализиран правилно'
        });
      }
      await offerRequestController.getQualityStatistics(req, res);
    } catch (error) {
      console.error('Route error in get quality statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Серверска грешка при добивање на статистики'
      });
    }
  }
);

// ==================== ERROR HANDLING MIDDLEWARE ====================

router.use((error, req, res, next) => {
  console.error('Offer Request Routes Error:', error);
  res.status(500).json({
    success: false,
    message: 'Неочекувана серверска грешка'
  });
});

module.exports = { router, initializeController };