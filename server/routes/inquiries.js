const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/inquiriesController');

const router = express.Router();
router.use(authenticateJWT);
router.use(c.requireBcOrAdmin);

router.get('/',                  c.listBoard);
router.get('/:id',               c.getOne);
router.post('/:id/interest',     c.submitInterest);
router.get('/:id/my-interest',   c.getMySignal);

module.exports = router;
