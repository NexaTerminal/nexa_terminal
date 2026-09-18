// „Проценка на карактер" — owner routes (authenticated).
// Mounted behind subscriptionGuard in server.js, so only owners with active feature
// access (incl. the 60-day free window) reach these. Every op is scoped to req.user.
const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/characterAssessmentController');

const router = express.Router();
router.use(authenticateJWT);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.get);
router.post('/:id/resend', c.resendInvite);
router.delete('/:id', c.remove);

module.exports = router;
