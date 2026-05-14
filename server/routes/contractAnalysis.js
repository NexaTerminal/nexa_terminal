const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { requireVerifiedCompany } = require('../middleware/verificationMiddleware');
const controller = require('../controllers/contractAnalysisController');

const auth = [authenticateJWT, requireVerifiedCompany];

router.get('/usage', ...auth, controller.getUsage);
router.post('/upload', ...auth, controller.uploadMiddleware, controller.uploadAndPreScan);
router.post('/analyze', ...auth, controller.analyze);

module.exports = router;
