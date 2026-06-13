/**
 * Sourcing / RFQ ("Барање за понуди") routes.
 * Mounted at /api/sourcing in server.js, BEFORE CSRF (cross-domain SPA, same as
 * /api/auto-documents). JWT + verified company required.
 */
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { requireVerifiedCompany } = require('../middleware/verificationMiddleware');
const sourcing = require('../controllers/sourcingController');

router.get('/me', authenticateJWT, sourcing.myRequests);
router.post('/', authenticateJWT, requireVerifiedCompany, sourcing.createRequest);
router.put('/:id', authenticateJWT, requireVerifiedCompany, sourcing.editRequest);

module.exports = router;
