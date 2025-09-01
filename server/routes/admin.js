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

module.exports = router;