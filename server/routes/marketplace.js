/**
 * Simplified Marketplace Routes - API endpoints for service providers only
 * Auto-enrollment system with predefined categories
 */

const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const marketplaceController = require('../controllers/marketplaceController');

// ==================== SERVICE CATEGORIES ====================

// Get active categories (only categories with active providers)
router.get('/categories/active',
  authenticateJWT,
  marketplaceController.getActiveCategoriesOnly
);

// ==================== SERVICE PROVIDERS ====================

// Admin-only routes for service provider management
router.post('/providers',
  authenticateJWT,
  isAdmin,
  marketplaceController.createServiceProvider
);

router.get('/providers',
  authenticateJWT,
  marketplaceController.getServiceProviders
);

router.get('/providers/:id',
  authenticateJWT,
  marketplaceController.getServiceProviderById
);

router.put('/providers/:id',
  authenticateJWT,
  isAdmin,
  marketplaceController.updateServiceProvider
);

router.patch('/providers/:id/status',
  authenticateJWT,
  isAdmin,
  marketplaceController.updateProviderStatus
);

router.delete('/providers/:id',
  authenticateJWT,
  isAdmin,
  marketplaceController.deleteServiceProvider
);

router.get('/providers/:id/performance',
  authenticateJWT,
  marketplaceController.getProviderPerformance
);

// Analytics routes for provider engagement
router.post('/providers/:id/view',
  authenticateJWT,
  marketplaceController.incrementProviderViews
);

router.post('/providers/:id/contact',
  authenticateJWT,
  marketplaceController.incrementProviderContacts
);

// ==================== SERVICE CATEGORIES ====================
// Categories are now predefined - no database management needed

router.get('/categories',
  authenticateJWT,
  marketplaceController.getServiceCategories
);

router.get('/categories/:name',
  authenticateJWT,
  marketplaceController.getServiceCategory
);

// ==================== ANALYTICS ====================

router.get('/analytics',
  authenticateJWT,
  isAdmin,
  marketplaceController.getMarketplaceAnalytics
);

// ==================== SIMPLIFIED MARKETPLACE ====================
// Removed complex workflow routes:
// - No service requests (users browse providers directly)
// - No provider offers (users contact providers directly)
// - No approval workflows (auto-enrollment for verified users)
// - Categories are predefined (no management needed)

// This simplified system focuses on:
// 1. Service provider directory
// 2. Auto-enrollment for verified users with category selection
// 3. Direct contact between users and providers
// 4. Basic analytics (views, contacts)
// 5. Admin management (enable/disable providers)

module.exports = router;