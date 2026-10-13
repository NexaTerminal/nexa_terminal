const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/documentShareLinksController');

// All routes require an authenticated Pro (B) / ADMIN user.
router.use(authenticateJWT);
router.use(c.requireProOrAdmin);

router.get('/shareable', c.shareable);
router.post('/', c.create);

module.exports = router;
