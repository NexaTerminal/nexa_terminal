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

// Admin moderation + schedule settings.
router.get('/admin/settings', authenticateJWT, isAdmin, fair.adminGetSettings);
router.post('/admin/settings', authenticateJWT, isAdmin, fair.adminSaveSettings);
router.get('/admin/all', authenticateJWT, isAdmin, fair.adminList);
router.post('/admin/:id/status', authenticateJWT, isAdmin, fair.adminSetStatus);

// Own booth.
router.get('/me', authenticateJWT, fair.getMyBooth);
router.put('/me', authenticateJWT, requireBoothPoster, fair.upsertMyBooth);
router.post('/me/image', authenticateJWT, requireBoothPoster, fair.upload.single('image'), fair.uploadImage);

// Browse + detail + inquiry (open to all authenticated users).
router.get('/', authenticateJWT, fair.listPublished);
router.get('/:id', authenticateJWT, fair.getById);
router.post('/:id/inquiry', authenticateJWT, fair.sendInquiry);

module.exports = router;
