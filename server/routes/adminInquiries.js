const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/inquiriesController');

const router = express.Router();
router.use(authenticateJWT);
router.use(c.requireAdmin);

router.get('/',                          c.adminList);
router.post('/',                         c.adminCreate);
router.get('/:id',                       c.adminGetDetail);
router.put('/:id',                       c.adminUpdate);
router.post('/:id/approve',              c.adminApprove);
router.post('/:id/mark-introduced',      c.adminMarkIntroduced);
router.post('/:id/close',                c.adminClose);

module.exports = router;
