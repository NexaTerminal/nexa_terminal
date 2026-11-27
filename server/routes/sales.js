// Продажна инка (Sales Funnel) — routes. Mounted at /api/sales behind
// subscriptionGuard (server.js) — Basic-tier tool like contracts, not
// credit-metered. authenticateJWT establishes req.user.

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const c = require('../controllers/salesDealsController');
const quotes = require('../controllers/salesQuotesController');

const router = express.Router();

router.use(authenticateJWT);

// „Понуда" — quotes (registered before the deal '/:id' routes).
// Миа texts: a small per-user daily cap (utility model, cheap but not free).
const aiTextLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: { success: false, message: 'Го достигнавте дневниот број AI текстови за понуди. Обидете се утре.' },
});
router.get('/quotes', quotes.list);
router.post('/quotes', quotes.create);
router.get('/quotes/:id', quotes.get);
router.patch('/quotes/:id', quotes.update);
router.post('/quotes/:id/send', quotes.send);
router.post('/quotes/:id/duplicate', quotes.duplicate);
router.post('/quotes/:id/ai-text', aiTextLimiter, quotes.aiText);
router.delete('/quotes/:id', quotes.remove);

router.get('/summary', c.summary);
router.get('/overview', c.overview);
router.get('/', c.list);
router.post('/', c.create);
router.patch('/:id/stage', c.setStage);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
