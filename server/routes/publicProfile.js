// Public company profile — GET /api/public/profile/:slug (no auth, read-only).
// Profiles are always public (accepted via the „profile" feature terms on save).
const express = require('express');
const profiles = require('../services/profileService');

const router = express.Router();

router.get('/:slug', async (req, res) => {
  try {
    const profile = await profiles.findBySlug(req.app.locals.db, req.params.slug);
    if (!profile) return res.status(404).json({ message: 'Профилот не е пронајден.' });
    res.json({ profile });
  } catch (e) {
    console.error('[publicProfile] get:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
