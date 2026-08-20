// Public, unauthenticated case status page — the read-only view a lawyer shares
// with their client. Redaction happens in the service (getPublicByToken).
const express = require('express');
const c = require('../controllers/casesController');

const router = express.Router();
router.get('/:token', c.getPublic);

module.exports = router;
