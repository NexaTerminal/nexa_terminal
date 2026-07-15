// Продажна инка (Sales Funnel) — routes. Mounted at /api/sales behind
// subscriptionGuard (server.js) — Basic-tier tool like contracts, not
// credit-metered. authenticateJWT establishes req.user.

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/salesDealsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/summary', c.summary);
router.get('/', c.list);
router.post('/', c.create);
router.patch('/:id/stage', c.setStage);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
