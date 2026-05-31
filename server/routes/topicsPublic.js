/**
 * Public read endpoint for published Topics Q&A pages.
 * Consumed by the future topics.nexa.mk satellite renderer.
 * No auth required.
 */
const express = require('express');
const c = require('../controllers/topicsController');

const router = express.Router();
router.get('/:slug', c.publicPageBySlug);

module.exports = router;
