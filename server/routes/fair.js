/**
 * Виртуелен саем (Virtual Fair) routes.
 *
 * Browsing (GET) is open to any authenticated user. Writing the caller's own
 * booth is gated by requireBoothPoster (active paid plans only). Admin
 * moderation hides/republishes booths.
 *
 * Mounted at /api/fair in server.js.
 * NOTE: specific paths (/meta, /admin, /me) are declared BEFORE /:id so the
 * param route doesn't swallow them.
 */

const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const requireBoothPoster = require('../middleware/requireBoothPoster');
const fair = require('../controllers/fairController');

// Admin schedule settings (no moderation/approval — booths post freely).
router.get('/admin/settings', authenticateJWT, isAdmin, fair.adminGetSettings);
router.post('/admin/settings', authenticateJWT, isAdmin, fair.adminSaveSettings);

// Own booth.
router.get('/me', authenticateJWT, fair.getMyBooth);
router.put('/me', authenticateJWT, requireBoothPoster, fair.upsertMyBooth);
router.post('/me/image', authenticateJWT, requireBoothPoster, fair.upload.single('image'), fair.uploadImage);

// Browse + detail (open to all authenticated users). Contact happens directly
// via the booth's website / email — no platform-mediated inquiry.
router.get('/', authenticateJWT, fair.listPublished);
router.get('/:id', authenticateJWT, fair.getById);

module.exports = router;
