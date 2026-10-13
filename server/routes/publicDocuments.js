const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const c = require('../controllers/publicDocumentsController');

// Rate-limit public generation per IP to bound abuse of the owner's credits.
const generateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 30 : 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `pubdoc:${req.ip}`,
  handler: (req, res) => res.status(429).json({
    success: false,
    message: 'Премногу обиди. Обидете се повторно подоцна.'
  })
});

// Public — no auth, mounted before CSRF. The signed token authorizes everything.
router.get('/:token', c.getMeta);
router.post('/:token/generate', generateLimit, c.generate);

module.exports = router;
