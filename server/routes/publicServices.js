// Public „Услуги" inquiry — POST /api/public/services/inquiry (no auth, pre-CSRF).
// Saves to `service_inquiries` and emails the admin (best-effort).
const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const emailService = require('../services/emailService');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests' },
});

const schema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(150).required(),
  phone: Joi.string().trim().max(30).allow(''),
  service: Joi.string().trim().max(60).allow(''),
  message: Joi.string().trim().min(10).max(3000).required(),
  language: Joi.string().valid('mk', 'en').default('mk'),
  consent: Joi.boolean().valid(true).required(),
  website: Joi.string().allow(''), // honeypot
});

const SERVICE_TITLES = {
  'due-diligence-nedviznosti': 'Due diligence на недвижности',
  'm-and-a': 'M&A — водење проекти',
  'startap-sovetuvanje': 'Советување за стартапи',
  'organizaciski-razvoj': 'Организациски развој',
  'vlez-na-pazar': 'Влез на македонскиот пазар',
};
const serviceTitle = (slug) => SERVICE_TITLES[slug] || slug || 'друго / не е избрано';

const esc = (s = '') => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

router.post('/inquiry', limiter, async (req, res) => {
  const { error, value } = schema.validate(req.body || {}, { stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.message });
  // Bots fill the hidden field: pretend success, store nothing.
  if (value.website) return res.status(201).json({ success: true });

  try {
    const doc = { ...value, status: 'new', createdAt: new Date() };
    delete doc.website;
    const r = await req.app.locals.db.collection('service_inquiries').insertOne(doc);

    const to = process.env.ADMIN_EMAIL || 'terminalnexa@gmail.com';
    const rows = [
      ['Услуга', serviceTitle(value.service)],
      ['Име', value.name], ['Е-пошта', value.email], ['Телефон', value.phone || '—'],
      ['Јазик', value.language],
    ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0">${esc(v)}</td></tr>`).join('');
    const html = `<h2 style="margin:0 0 12px">Ново барање за услуга</h2><table>${rows}</table>`
      + `<p style="white-space:pre-wrap;margin-top:16px">${esc(value.message)}</p>`;
    emailService.sendEmail(to, `Услуги: ${serviceTitle(value.service)} — ${value.name}`, html)
      .catch(e => console.error('[publicServices] email failed:', e.message));

    res.status(201).json({ success: true, id: r.insertedId });
  } catch (e) {
    console.error('[publicServices] inquiry:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
