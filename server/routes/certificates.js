const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const CertificateController = require('../controllers/certificateController');

let certificateController;

// Initialize controller with database
function initializeController(db) {
  certificateController = new CertificateController(db);
}

// Get certificate status for a course
router.get('/:courseId/status', authenticateJWT, (req, res) => {
  if (!certificateController) {
    return res.status(500).json({ message: 'Certificate service not initialized' });
  }
  certificateController.getCertificateStatus(req, res);
});

// Generate new certificate
router.post('/:courseId/generate', authenticateJWT, (req, res) => {
  if (!certificateController) {
    return res.status(500).json({ message: 'Certificate service not initialized' });
  }
  certificateController.generateCertificate(req, res);
});

// Download existing certificate
router.get('/:courseId/download', authenticateJWT, (req, res) => {
  if (!certificateController) {
    return res.status(500).json({ message: 'Certificate service not initialized' });
  }
  certificateController.downloadCertificate(req, res);
});

module.exports = { router, initializeController };
