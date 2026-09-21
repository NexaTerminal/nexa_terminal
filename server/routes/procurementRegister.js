// „Регистар на набавки" — owner routes (authenticated).
// Mounted behind subscriptionGuard in server.js; every op scoped to req.user.
const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/procurementRegisterController');

const router = express.Router();
router.use(authenticateJWT);

router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

router.post('/:id/offers', c.addOffer);
router.put('/:id/offers/:offerId', c.updateOffer);
router.delete('/:id/offers/:offerId', c.removeOffer);

module.exports = router;
