// Public company one-pager — no auth, mounted before CSRF.
//   GET  /:slug                 → the profile (all profiles are public)
//   GET  /img/:userId/:kind     → uploaded logo/cover (MongoDB-backed)
//   POST /:slug/contact         → visitor message → emailed to the company
//   POST /:slug/view            → monthly view counter (owner insights)
const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const profiles = require('../services/profileService');
const site = require('../services/profileSiteService');
const emailService = require('../services/emailService');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Премногу пораки. Обидете се подоцна.' },
});
const viewLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const contactSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(150).required(),
  phone: Joi.string().trim().max(30).allow(''),
  message: Joi.string().trim().min(10).max(2000).required(),
  service: Joi.string().trim().max(120).allow(''), // „Побарај понуда" on a „Што нудиме" card
  postId: Joi.string().hex().length(24).allow(''),   // „Контактирајте" on an „Актуелно" post
  consent: Joi.boolean().valid(true).required(),
  website: Joi.string().allow(''), // honeypot
});

router.get('/img/:userId/:kind', async (req, res) => {
  try {
    const img = await site.getImage(req.app.locals.db, req.params.userId, req.params.kind);
    if (!img) return res.status(404).end();
    res.set('Content-Type', img.contentType);
    // URLs carry ?v=<timestamp>, so a new upload is a new URL.
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(img.data);
  } catch (e) {
    console.error('[publicProfile] img:', e);
    res.status(500).end();
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const profile = await profiles.findBySlug(db, req.params.slug);
    if (!profile) return res.status(404).json({ message: 'Профилот не е пронајден.' });
    let posts = [];
    try {
      const u = await db.collection('users').findOne({ 'publicProfile.slug': String(req.params.slug) }, { projection: { _id: 1 } });
      if (u && req.app.locals.companyPostsService) posts = await req.app.locals.companyPostsService.forUser(u._id);
    } catch (_) { /* posts are optional */ }
    res.json({ profile, posts });
  } catch (e) {
    console.error('[publicProfile] get:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:slug/view', viewLimiter, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await db.collection('users').findOne({ 'publicProfile.slug': String(req.params.slug) }, { projection: { _id: 1 } });
    if (user) await site.bump(db, user._id, 'views');
    res.status(204).end();
  } catch (e) {
    res.status(204).end(); // stats are best-effort
  }
});

router.post('/:slug/contact', contactLimiter, async (req, res) => {
  const { error, value } = contactSchema.validate(req.body || {}, { abortEarly: true });
  if (error) return res.status(400).json({ message: 'Проверете ги полињата и согласноста.' });
  if (value.website) return res.status(201).json({ ok: true }); // bot: pretend success, store nothing
  try {
    const db = req.app.locals.db;
    const user = await db.collection('users').findOne(
      { 'publicProfile.slug': String(req.params.slug) },
      { projection: { email: 1, publicProfile: 1 } }
    );
    if (!user?.publicProfile) return res.status(404).json({ message: 'Профилот не е пронајден.' });
    const p = user.publicProfile;
    const to = p.contactEmail || user.email;
    // Only keep a service that is really one of the company's offers.
    const service = value.service && (p.offers || []).includes(value.service) ? value.service : '';
    // A post reference counts only if it is a live post of this company.
    let postRef = null;
    if (value.postId && req.app.locals.companyPostsService) {
      const post = await req.app.locals.companyPostsService.findLive(value.postId);
      if (post && String(post.userId) === String(user._id)) postRef = { postId: post._id, postTitle: post.title };
    }

    await site.saveMessage(db, user._id, { name: value.name, email: value.email, phone: value.phone || '', message: value.message, service, ...(postRef || {}) });

    if (to) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2937">
          <h2 style="color:#0B1220;margin:0 0 12px">Нова порака од Вашиот профил на Nexa</h2>
          <p style="margin:0 0 16px;color:#475569">Посетител на <a href="https://nexa.mk/f/${esc(p.slug)}">nexa.mk/f/${esc(p.slug)}</a> Ви пиша:</p>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr><td style="padding:6px 0;color:#64748b;width:110px">Име</td><td><strong>${esc(value.name)}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Е-пошта</td><td><a href="mailto:${esc(value.email)}">${esc(value.email)}</a></td></tr>
            ${value.phone ? `<tr><td style="padding:6px 0;color:#64748b">Телефон</td><td>${esc(value.phone)}</td></tr>` : ''}
            ${service ? `<tr><td style="padding:6px 0;color:#64748b">Бара понуда за</td><td><strong>${esc(service)}</strong></td></tr>` : ''}
            ${postRef ? `<tr><td style="padding:6px 0;color:#64748b">Во врска со</td><td><strong>${esc(postRef.postTitle)}</strong></td></tr>` : ''}
          </table>
          <div style="margin:16px 0;padding:14px 16px;background:#F7F8FA;border-radius:10px;white-space:pre-wrap;font-size:14px;line-height:1.55">${esc(value.message)}</div>
          <p style="font-size:13px;color:#64748b">Одговорете директно на оваа порака — одговорот оди до посетителот. Во Nexa → Моја страница можете со еден клик да го додадете во Клиенти и да му направите понуда.</p>
        </div>`;
      emailService
        .sendEmail(to, service ? `Барање понуда: ${service} — ${value.name}` : `Нова порака од профилот — ${value.name}`, html, { replyTo: value.email })
        .catch((e) => console.warn('[publicProfile] email failed:', e.message));
    }
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[publicProfile] contact:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
