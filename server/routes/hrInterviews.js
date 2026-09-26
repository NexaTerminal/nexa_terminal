// „Интервјуа" — owner routes (authenticated).
// Mounted behind subscriptionGuard in server.js, so only owners with active feature
// access (incl. the 60-day free window) reach these. Every op is scoped to req.user.
const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/hrInterviewController');

const router = express.Router();
router.use(authenticateJWT);

router.get('/suggest', c.suggest);
router.get('/template', c.getTemplate);
router.put('/template', c.putTemplate);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.get);
router.post('/:id/resend', c.resendInvite);
router.delete('/:id', c.remove);

module.exports = router;
