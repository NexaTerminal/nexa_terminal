const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateJWT } = require('../middleware/auth');
const newsletterController = require('../controllers/newsletterController');

// Initialize controller with database
function initializeController(database) {
  newsletterController.setDatabase(database);
}

// Multer configuration for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Дозволени се само CSV датотеки'), false);
    }
  }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Пристапот е одбиен. Потребни се администраторски привилегии.' });
  }
};

// Subscriber Management Routes
router.get('/subscribers', authenticateJWT, isAdmin, newsletterController.getSubscribers);
router.post('/subscribers', authenticateJWT, isAdmin, newsletterController.addSubscriber);
router.post('/subscribers/import-csv', authenticateJWT, isAdmin, upload.single('csvFile'), newsletterController.importCsvSubscribers);
router.patch('/subscribers/:id', authenticateJWT, isAdmin, newsletterController.updateSubscriber);
router.delete('/subscribers/:id', authenticateJWT, isAdmin, newsletterController.deleteSubscriber);
router.post('/subscribers/bulk-delete', authenticateJWT, isAdmin, newsletterController.bulkDeleteSubscribers);
router.get('/subscribers/export-csv', authenticateJWT, isAdmin, newsletterController.exportSubscribersCsv);

// Campaign Management Routes
router.get('/campaigns', authenticateJWT, isAdmin, newsletterController.getCampaigns);
router.get('/campaigns/:id', authenticateJWT, isAdmin, newsletterController.getCampaign);
router.post('/campaigns', authenticateJWT, isAdmin, newsletterController.createCampaign);
router.patch('/campaigns/:id', authenticateJWT, isAdmin, newsletterController.updateCampaign);
router.post('/campaigns/:id/send', authenticateJWT, isAdmin, newsletterController.sendCampaign);
router.post('/campaigns/:id/schedule', authenticateJWT, isAdmin, newsletterController.scheduleCampaign);
router.post('/campaigns/:id/test', authenticateJWT, isAdmin, newsletterController.sendTestEmail);
router.delete('/campaigns/:id', authenticateJWT, isAdmin, newsletterController.deleteCampaign);

// Analytics Routes
router.get('/analytics/overview', authenticateJWT, isAdmin, newsletterController.getAnalyticsOverview);
router.get('/analytics/campaigns/:id', authenticateJWT, isAdmin, newsletterController.getCampaignAnalytics);
router.get('/analytics/campaigns/:id/subscribers', authenticateJWT, isAdmin, newsletterController.getCampaignSubscriberDetails);

// Helper Routes
router.get('/blogs/recent', authenticateJWT, isAdmin, newsletterController.getRecentBlogs);

module.exports = { router, initializeController };
