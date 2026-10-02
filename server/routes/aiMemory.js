const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const controller = require('../controllers/userMemoryController');

const router = express.Router();

// Modest per-user rate limit on the mutating endpoints.
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Премногу барања во кратко време. Обидете се повторно.' },
});

router.get('/', authenticateJWT, controller.getMine);
router.put('/enabled', authenticateJWT, writeLimiter, controller.setEnabled);
router.delete('/:factId', authenticateJWT, writeLimiter, controller.deleteFact);
router.delete('/', authenticateJWT, writeLimiter, controller.clear);

module.exports = router;
