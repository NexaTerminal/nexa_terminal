const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/blogSubmissionsController');

const router = express.Router();

router.use(authenticateJWT);
router.use(c.requireAdmin);

router.get('/',                  c.adminList);
router.get('/:id',               c.adminGetOne);
router.post('/:id/accept',       c.adminAccept);
router.post('/:id/return',       c.adminReturn);
router.post('/:id/reject',       c.adminReject);
router.post('/:id/publish',      c.adminPublish);

module.exports = router;
