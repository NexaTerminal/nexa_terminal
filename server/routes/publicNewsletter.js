const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

// Public routes - no authentication required

// Unsubscribe route
router.get('/unsubscribe/:token', newsletterController.unsubscribe);

// Tracking pixel route (returns 1x1 transparent GIF)
router.get('/track/open/:token', newsletterController.trackOpen);

// Click tracking route (records click and redirects to original URL)
router.get('/track/click/:token/:linkId', newsletterController.trackClick);

module.exports = router;
