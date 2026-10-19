const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/proRequestsController');

const router = express.Router();
router.use(authenticateJWT);

// Static collections — must precede '/:id' so they aren't read as an id.
router.get('/board', c.board);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.get);

router.post('/:id/messages', c.addMessage);
router.post('/:id/quote', c.addQuote);
router.post('/:id/claim', c.claim);                 // Pro claims an open request (first-come)
router.post('/:id/reveal', c.reveal);               // requester reveals/hides identity to the Pro
router.post('/:id/reject', c.reject);               // admin removes a request
router.post('/:id/close', c.close);

module.exports = router;
