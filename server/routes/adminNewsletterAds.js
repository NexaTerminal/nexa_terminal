const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/newsletterAdsController');

const router = express.Router();

router.use(authenticateJWT);
router.use(c.requireAdmin);

router.get('/',            c.adminList);
router.post('/:id/cancel', c.adminCancel);

module.exports = router;
