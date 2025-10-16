const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Global controller instances (will be initialized by server.js)
let offerRequestController;

// Test route (no auth required for debugging)
router.get('/test', (req, res) => {
  console.log('🔍 Admin test route called');
  res.json({ message: 'Admin routes are working', offerControllerExists: !!offerRequestController });
});

// Test offer requests route - direct database access
router.get('/test-offer-requests', async (req, res) => {
  console.log('🔍 Test offer requests route called');
  try {
    // Direct database access to verify data exists
    const { MongoClient } = require('mongodb');
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db();
    const collection = db.collection('offer_requests');

    const requests = await collection.find({}).toArray();
    console.log(`Found ${requests.length} offer requests in database`);

    await client.close();

    res.json({
      success: true,
      count: requests.length,
      requests: requests.map(r => ({
        _id: r._id,
        serviceType: r.serviceType,
        status: r.status,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// All admin routes require authentication and admin privileges
router.use(authenticateJWT, isAdmin);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.post('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/unsuspend', adminController.unsuspendUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/users/:id/activity', adminController.getUserActivity);

// Platform Analytics
router.get('/analytics', adminController.getPlatformAnalytics);
router.get('/dashboard', adminController.getAdminDashboard);

// Data Export
router.get('/export/users', adminController.exportUserData);

// Bulk Operations
router.post('/bulk-action', adminController.bulkUserAction);

// Marketplace Management (Service Providers)
router.get('/marketplace/providers', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').getServiceProviders(req, res, next);
});

router.post('/marketplace/providers', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').createServiceProvider(req, res, next);
});

router.get('/marketplace/providers/:id', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').getServiceProviderById(req, res, next);
});

router.put('/marketplace/providers/:id', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').updateServiceProvider(req, res, next);
});

router.patch('/marketplace/providers/:id/status', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').updateProviderStatus(req, res, next);
});

router.delete('/marketplace/providers/:id', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').deleteServiceProvider(req, res, next);
});

router.get('/marketplace/categories', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').getServiceCategories(req, res, next);
});

router.post('/marketplace/categories', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').createServiceCategory(req, res, next);
});

router.get('/marketplace/analytics', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').getMarketplaceAnalytics(req, res, next);
});

// Offer Request Management
router.get('/offer-requests', async (req, res, next) => {
  console.log('🔍 GET /admin/offer-requests - Admin route called');
  console.log('User:', { id: req.user?._id, isAdmin: req.user?.isAdmin });
  console.log('Query params:', req.query);
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.getRequestsForAdmin(req, res);
  } catch (error) {
    console.error('Admin offer requests route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/offer-requests/statistics', async (req, res, next) => {
  console.log('🔍 GET /admin/offer-requests/statistics - Admin route called');
  console.log('User:', { id: req.user?._id, isAdmin: req.user?.isAdmin });
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.getQualityStatistics(req, res);
  } catch (error) {
    console.error('Admin statistics route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/offer-requests/:id', async (req, res, next) => {
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.getOfferRequestDetails(req, res);
  } catch (error) {
    console.error('Admin request details route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get provider responses for a specific offer request
router.get('/offer-requests/:id/responses', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /admin/offer-requests/${id}/responses - Admin route called`);

    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }

    // Use the provider interest service to get responses
    const ProviderInterestService = require('../services/providerInterestService');
    const providerInterestService = new ProviderInterestService(req.app.locals.db);

    // Get all provider interests for this request (including responses)
    const responses = await providerInterestService.getResponsesByRequest(id);

    res.json({
      success: true,
      responses
    });

  } catch (error) {
    console.error('Admin get provider responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/offer-requests/:id/verify', async (req, res, next) => {
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.verifyOfferRequest(req, res);
  } catch (error) {
    console.error('Admin verify request route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/offer-requests/:id/reject', async (req, res, next) => {
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.rejectOfferRequest(req, res);
  } catch (error) {
    console.error('Admin reject request route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Initialize controller (to be called by server.js)
const initializeOfferRequestController = (database) => {
  const OfferRequestController = require('../controllers/offerRequestController');
  offerRequestController = new OfferRequestController(database);
};

module.exports = {
  router,
  initializeOfferRequestController
};