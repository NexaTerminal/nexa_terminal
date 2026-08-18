const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/clientsController');

const router = express.Router();
router.use(authenticateJWT);
router.use(c.requireProOrAdmin);

router.get('/',        c.list);
router.post('/',       c.create);
router.get('/:id',     c.get);
router.put('/:id',     c.update);
router.delete('/:id',  c.remove);

module.exports = router;
