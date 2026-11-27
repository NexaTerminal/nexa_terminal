// Public „Понуда" — the client of a Nexa company opens nexa.mk/ponuda/:token.
// No auth, mounted before CSRF. The token is a 144-bit random secret.
//   GET  /:token            → the quote (no costs, no margin, no owner ids)
//   POST /:token/view       → open tracking (the page calls it once per session)
//   POST /:token/respond    → { type: accept | decline | question, name, email?, note? }
const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const emailService = require('../services/emailService');
const notifications = require('../services/userNotificationService');

const router = express.Router();

const readLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
const respondLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Премногу обиди. Обидете се подоцна.' },
});

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const svc = (req) => req.app.locals.salesQuotesService;

const respondSchema = Joi.object({
  type: Joi.string().valid('accept', 'decline', 'question').required(),
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().max(150).allow(''),
  note: Joi.string().trim().max(1500).allow(''),
  website: Joi.string().allow(''), // honeypot
}).custom((v, h) => (v.type === 'question' && (!v.note || v.note.length < 5) ? h.error('any.invalid') : v));

const TEXT = {
  viewed: { title: 'Клиентот ја отвори понудата', icon: '👀' },
  accept: { title: 'Понудата е прифатена', icon: '✅' },
  decline: { title: 'Понудата е одбиена', icon: '✕' },
  question: { title: 'Прашање за понудата', icon: '💬' },
};

async function ownerEmail(db, q) {
  const u = await db.collection('users').findOne({ _id: q.userId }, { projection: { email: 1 } });
  return q.issuer?.email || u?.email || null;
}

/** Bell for every event; e-mail only for the client's answers (not for opens). */
async function tellOwner(req, q, kind, ev = {}) {
  const db = req.app.locals.db;
  const t = TEXT[kind];
  const who = ev.name ? ` — ${ev.name}` : '';
  const actionUrl = `/terminal/ponudi/${q._id}`;
  notifications.notify(db, q.userId, {
    type: 'sales_quote',
    title: `${t.icon} ${t.title}`,
    message: `${q.number} · ${q.client?.name || ''}${who}`.slice(0, 200),
    actionUrl,
    severity: kind === 'accept' ? 'success' : 'info',
  }, req.app.locals.io).catch(() => {});

  if (kind === 'viewed') return;
  const to = await ownerEmail(db, q);
  if (!to) return;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2937">
      <h2 style="color:#0B1220;margin:0 0 12px">${t.icon} ${esc(t.title)}</h2>
      <p style="margin:0 0 14px;color:#475569">Понуда <strong>${esc(q.number)}</strong>${q.title ? ` — ${esc(q.title)}` : ''} за <strong>${esc(q.client?.name || '')}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:6px 0;color:#64748b;width:110px">Име</td><td><strong>${esc(ev.name || '')}</strong></td></tr>
        ${ev.email ? `<tr><td style="padding:6px 0;color:#64748b">Е-пошта</td><td><a href="mailto:${esc(ev.email)}">${esc(ev.email)}</a></td></tr>` : ''}
      </table>
      ${ev.note ? `<div style="margin:16px 0;padding:14px 16px;background:#F7F8FA;border-radius:10px;white-space:pre-wrap;font-size:14px;line-height:1.55">${esc(ev.note)}</div>` : ''}
      <p style="margin:18px 0"><a href="https://nexa.mk${actionUrl}" style="background:#0B1220;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px">Отвори ја понудата во Nexa</a></p>
      ${kind === 'accept' ? '<p style="font-size:13px;color:#64748b">Зделката во „Клиенти" е преместена во Добиени.</p>' : ''}
    </div>`;
  emailService
    .sendEmail(to, `${t.title}: ${q.number} — ${q.client?.name || ''}`, html, ev.email ? { replyTo: ev.email } : {})
    .catch((e) => console.warn('[publicQuote] email failed:', e.message));
}

router.get('/:token', readLimiter, async (req, res) => {
  try {
    const q = await svc(req).findByToken(req.params.token);
    if (!q) return res.status(404).json({ message: 'Понудата не е пронајдена.' });
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.json({ quote: svc(req).toPublic(q) });
  } catch (e) {
    console.error('[publicQuote] get:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:token/view', readLimiter, async (req, res) => {
  try {
    const q = await svc(req).findByToken(req.params.token);
    if (q) {
      const first = await svc(req).recordView(q);
      if (first) await tellOwner(req, q, 'viewed');
    }
  } catch (e) { /* tracking is best-effort */ }
  res.status(204).end();
});

router.post('/:token/respond', respondLimiter, async (req, res) => {
  const { error, value } = respondSchema.validate(req.body || {}, { abortEarly: true });
  if (error) return res.status(400).json({ message: 'Внесете го Вашето име (и порака ако имате прашање).' });
  if (value.website) return res.status(201).json({ ok: true }); // bot
  try {
    const q = await svc(req).findByToken(req.params.token);
    if (!q) return res.status(404).json({ message: 'Понудата не е пронајдена.' });
    const r = await svc(req).respond(q, value);
    if (r.error === 'expired') return res.status(409).json({ message: 'Рокот на важење на понудата е истечен. Побарајте нова понуда од фирмата.' });
    if (r.error === 'answered') return res.status(409).json({ message: 'На оваа понуда веќе е одговорено.' });
    if (r.error === 'too_many') return res.status(429).json({ message: 'Испратени се премногу прашања. Контактирајте ја фирмата директно.' });
    await tellOwner(req, q, value.type, value);
    const fresh = await svc(req).findByToken(req.params.token);
    res.status(201).json({ ok: true, quote: svc(req).toPublic(fresh) });
  } catch (e) {
    console.error('[publicQuote] respond:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
