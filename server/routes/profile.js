// „Мој профил" — optional company profile (see services/profileService.js).
// Nothing in the app depends on having one.
//
//   GET    /me       → { profile|null, suggested, completion }
//   PUT    /me       → create/update (prefill-friendly; slug assigned once)
//   DELETE /me       → remove the profile entirely
//   PUT    /me/image/:kind   → upload logo/cover ({ dataUrl }, client-resized) → { url }
//   DELETE /me/image/:kind   → remove an uploaded image
//   GET    /me/insights      → views/contacts + latest visitor messages
//   GET    /:slug    → a profile (all profiles are public)

const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateJWT } = require('../middleware/auth');
const profiles = require('../services/profileService');
const site = require('../services/profileSiteService');

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

router.put('/me/image/:kind', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role === 'sub_seat') return res.status(403).json({ message: 'Профилот го уредува сопственикот на сметката.' });
    if (!site.KINDS.includes(req.params.kind)) return res.status(400).json({ message: 'Непознат тип слика.' });
    const parsed = site.parseDataUrl(req.body?.dataUrl);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const url = await site.saveImage(req.app.locals.db, uid(req), req.params.kind, parsed);
    res.json({ url });
  } catch (e) {
    console.error('[profile] image:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/me/image/:kind', authenticateJWT, async (req, res) => {
  try {
    if (!site.KINDS.includes(req.params.kind)) return res.status(400).json({ message: 'Непознат тип слика.' });
    await site.deleteImage(req.app.locals.db, uid(req), req.params.kind);
    res.json({ ok: true });
  } catch (e) {
    console.error('[profile] image delete:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me/insights', authenticateJWT, async (req, res) => {
  try {
    res.json(await site.insights(req.app.locals.db, uid(req)));
  } catch (e) {
    console.error('[profile] insights:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// „Додај во Клиенти": a visitor message becomes a potential deal (once).
router.post('/me/messages/:id/to-deal', authenticateJWT, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Невалиден идентификатор.' });
    const db = req.app.locals.db;
    const deals = req.app.locals.salesDealsService;
    const msgs = db.collection('profile_messages');
    const m = await msgs.findOne({ _id: new ObjectId(req.params.id), userId: new ObjectId(uid(req)) });
    if (!m) return res.status(404).json({ message: 'Пораката не е пронајдена.' });
    if (m.dealId) return res.json({ dealId: m.dealId, existing: true });
    const when = new Date(m.createdAt).toLocaleDateString('mk-MK');
    const deal = await deals.create(uid(req), {
      name: m.name,
      contact: { person: m.name, email: m.email || '', phone: m.phone || '' },
      stage: 'potential',
      note: `${m.service ? `Бара понуда за: ${m.service}\n` : ''}Порака од Моја страница (${when}):\n${m.message || ''}`,
      nextActionAt: new Date(),
      nextActionNote: m.service ? `Испрати понуда за ${m.service}` : 'Одговори на пораката',
    });
    await msgs.updateOne({ _id: m._id }, { $set: { dealId: deal._id } });
    res.status(201).json({ dealId: deal._id });
  } catch (e) {
    console.error('[profile] message to deal:', e);
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
