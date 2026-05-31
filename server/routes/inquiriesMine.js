/**
 * Mounted at /api/my-claims and /api/my-engagements (member-facing views
 * not nested under /api/inquiries to keep the URL shape per spec).
 */

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/inquiriesController');

const claims = express.Router();
claims.use(authenticateJWT);
claims.use(c.requireBcOrAdmin);
claims.get('/', c.listMyClaims);

const engagements = express.Router();
engagements.use(authenticateJWT);
engagements.use(c.requireBcOrAdmin);
engagements.get('/', c.listMyEngagements);

module.exports = { claims, engagements };
