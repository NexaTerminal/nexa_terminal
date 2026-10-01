const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/proRequestsController');

const router = express.Router();
router.use(authenticateJWT);

// Admin hand-pick list — must precede '/:id' so "providers" isn't read as an id.
router.get('/providers', c.providers);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.get);

router.post('/:id/messages', c.addMessage);
router.post('/:id/quote', c.addQuote);
router.post('/:id/approve', c.approve);
router.post('/:id/reject', c.reject);
router.post('/:id/close', c.close);

module.exports = router;
