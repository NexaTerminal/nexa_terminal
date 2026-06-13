/**
 * Feature terms acceptance routes (JWT-protected).
 * Mounted at /api/terms in server.js, BEFORE the CSRF middleware (the SPA and
 * API live on different domains, so cookie-CSRF can't apply — same pattern as
 * /api/auto-documents).
 */
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const terms = require('../controllers/termsController');

router.get('/status', authenticateJWT, terms.getStatus);
router.post('/accept', authenticateJWT, terms.accept);

module.exports = router;
