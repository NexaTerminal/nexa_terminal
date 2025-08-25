const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const verificationController = require('../controllers/verificationController');

// Submit company verification request
router.post('/', authenticateJWT, verificationController.upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxDocument', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 }
]), verificationController.submitVerification);

// Get user's verification status
router.get('/status', authenticateJWT, verificationController.getVerificationStatus);

// Get pending verification requests (admin only)
router.get('/pending', authenticateJWT, isAdmin, verificationController.getPendingVerifications);

// Approve verification (admin only)
router.post('/:id/approve', authenticateJWT, isAdmin, verificationController.approveVerification);

// Reject verification (admin only)
router.post('/:id/reject', authenticateJWT, isAdmin, verificationController.rejectVerification);

// Upload documents for verification
router.post('/upload', authenticateJWT, verificationController.upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxDocument', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 }
]), verificationController.uploadDocument);

module.exports = router;