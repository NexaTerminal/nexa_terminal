// „Мој профил" — optional company profile (see services/profileService.js).
// Nothing in the app depends on having one.
//
//   GET    /me       → { profile|null, suggested, completion }
//   PUT    /me       → create/update (prefill-friendly; slug assigned once)
//   DELETE /me       → remove the profile entirely
//   GET    /:slug    → a profile (all profiles are public)

const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateJWT } = require('../middleware/auth');
const profiles = require('../services/profileService');

const router = express.Router();
const uid = (req) => String(req.user._id || req.user.id);

router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(uid(req)) },
      { projection: { publicProfile: 1, companyInfo: 1, superUser: 1, isVerified: 1, role: 1, email: 1, officialEmail: 1 } }
    );
    const profile = user?.publicProfile ? await profiles.toView(db, user, uid(req)) : null;
    res.json({
      profile,
      suggested: profiles.suggestFromCompany(user || {}),
      completion: profiles.completion(user?.publicProfile),
    });
  } catch (e) {
    console.error('[profile] me:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role === 'sub_seat') return res.status(403).json({ message: 'Профилот го уредува сопственикот на сметката.' });
    const { errors, data } = profiles.sanitize(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });
    const db = req.app.locals.db;
    const saved = await profiles.saveProfile(db, uid(req), data);
    const profile = await profiles.findBySlug(db, saved.slug, { viewerId: uid(req) });
    res.json({ profile, completion: profiles.completion(saved) });
  } catch (e) {
    console.error('[profile] save:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/me', authenticateJWT, async (req, res) => {
  try {
    await profiles.deleteProfile(req.app.locals.db, uid(req));
    res.json({ ok: true });
  } catch (e) {
    console.error('[profile] delete:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:slug', authenticateJWT, async (req, res) => {
  try {
    const profile = await profiles.findBySlug(req.app.locals.db, req.params.slug, { viewerId: uid(req) });
    if (!profile) return res.status(404).json({ message: 'Профилот не е пронајден.' });
    res.json({ profile });
  } catch (e) {
    console.error('[profile] get:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
