const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

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

module.exports = router;