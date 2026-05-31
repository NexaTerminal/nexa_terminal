const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const controller = require('../controllers/stancePreferencesController');

const router = express.Router();

// Modest per-user rate limit on the save endpoint so the form can't be hammered.
const putLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Премногу зачувувања во кратко време. Обидете се повторно.' }
});

router.get('/',  authenticateJWT, controller.getMine);
router.put('/',  authenticateJWT, putLimiter, controller.putMine);

module.exports = router;
