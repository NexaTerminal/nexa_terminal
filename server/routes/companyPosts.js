// „Објави" — structured company posts. Mounted at /api/company-posts behind
// subscriptionGuard (server.js), before CSRF like /api/sales (JWT in header).
//   GET  /meta              → labels, categories, limits, my quota + eligibility
//   GET  /feed              → live posts of all companies (Terminal feed)
//   GET  /mine              → my posts (any state)
//   POST /                  → create { type, ...fields }
//   POST /:id/end           → end my post early
//   POST /:id/interest      → „Заинтересирани сме" → message to the posting company
//   POST /:id/quote         → „Испратете понуда" (Бараме) → deal + quote draft for me
//   POST /:id/report        → report (3 reports hide the post)
//   GET  /admin/all, DELETE /admin/:id → admin moderation
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ObjectId } = require('mongodb');
const { authenticateJWT } = require('../middleware/auth');
const Posts = require('../services/companyPostsService');
const site = require('../services/profileSiteService');
const notifications = require('../services/userNotificationService');
const emailService = require('../services/emailService');

const router = express.Router();
router.use(authenticateJWT);

const svc = (req) => req.app.locals.companyPostsService;
const uid = (req) => String(req.user._id || req.user.id);
const isAdmin = (req) => req.user.role === 'admin' || req.user.isAdmin === true;
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const actionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => uid(req),
  message: { message: 'Премногу дејства. Обидете се подоцна.' },
});

router.get('/meta', async (req, res) => {
  try {
    const [quota, eligibility] = await Promise.all([svc(req).quota(uid(req)), svc(req).eligibility(uid(req))]);
    res.json({
      benefits: Posts.BENEFITS, audiences: Posts.AUDIENCES, newsKinds: Posts.NEWS_KINDS,
      categories: Posts.SEEK_CATEGORIES, limits: Posts.LIMITS, quota, eligibility,
    });
  } catch (e) {
    console.error('[posts] meta:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/feed', async (req, res) => {
  try {
    res.json({ items: await svc(req).feed(uid(req), { limit: parseInt(req.query.limit, 10) || 20 }) });
  } catch (e) {
    console.error('[posts] feed:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/mine', async (req, res) => {
  try { res.json({ items: await svc(req).mine(uid(req)) }); } catch (e) {
    console.error('[posts] mine:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', actionLimiter, async (req, res) => {
  try {
    const { type, ...fields } = req.body || {};
    const r = await svc(req).create(uid(req), type, fields);
    if (r.error) return res.status(r.code === 'eligibility' ? 403 : 400).json({ message: r.error });
    res.status(201).json({ post: r.post });
  } catch (e) {
    console.error('[posts] create:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/end', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Невалиден идентификатор.' });
    const ok = await svc(req).end(uid(req), req.params.id);
    if (!ok) return res.status(404).json({ message: 'Објавата не е пронајдена.' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[posts] end:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/** The viewer's company as the posting company will see it. */
async function senderCard(db, userId) {
  const u = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { email: 1, companyInfo: 1, publicProfile: 1 } }
  );
  const p = u?.publicProfile || {};
  return {
    name: String(u?.companyInfo?.companyName || p.displayName || 'Фирма на Nexa').slice(0, 100),
    email: p.contactEmail || u?.email || '',
    phone: p.phone || '',
    slug: p.slug || '',
  };
}

async function ownerEmail(db, userId) {
  const u = await db.collection('users').findOne({ _id: new ObjectId(String(userId)) }, { projection: { email: 1, publicProfile: 1 } });
  return u?.publicProfile?.contactEmail || u?.email || null;
}

router.post('/:id/interest', actionLimiter, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const post = await svc(req).findLive(req.params.id);
    if (!post) return res.status(404).json({ message: 'Објавата не е повеќе активна.' });
    if (String(post.userId) === uid(req)) return res.status(400).json({ message: 'Ова е Ваша објава.' });
    const fresh = await svc(req).markInterested(uid(req), post);
    if (!fresh) return res.json({ ok: true, already: true });

    const me = await senderCard(db, uid(req));
    const note = String(req.body?.note || '').trim().slice(0, 500);
    const message = `Заинтересирани сме за Вашата објава „${post.title}".${note ? `\n\n${note}` : ''}`;
    await site.saveMessage(db, post.userId, {
      name: me.name, email: me.email, phone: me.phone, message, service: '',
      postId: post._id, postTitle: post.title, fromUserId: new ObjectId(uid(req)), fromSlug: me.slug,
    });
    notifications.notify(db, post.userId, {
      type: 'company_post', title: '🤝 Интерес за Вашата објава',
      message: `${me.name} · ${post.title}`.slice(0, 200), actionUrl: '/terminal/moj-profil',
    }, req.app.locals.io).catch(() => {});
    const to = await ownerEmail(db, post.userId);
    if (to) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2937">
          <h2 style="color:#0B1220;margin:0 0 12px">🤝 Интерес за Вашата објава</h2>
          <p style="margin:0 0 12px;color:#475569"><strong>${esc(me.name)}</strong> е заинтересирана за „${esc(post.title)}".</p>
          ${note ? `<div style="margin:12px 0;padding:12px 14px;background:#F7F8FA;border-radius:10px;white-space:pre-wrap;font-size:14px">${esc(note)}</div>` : ''}
          <p style="font-size:14px">${me.email ? `Е-пошта: <a href="mailto:${esc(me.email)}">${esc(me.email)}</a>` : ''}${me.phone ? ` · ${esc(me.phone)}` : ''}</p>
          ${me.slug ? `<p style="font-size:14px"><a href="https://nexa.mk/f/${esc(me.slug)}">Страницата на фирмата</a></p>` : ''}
          <p style="font-size:13px;color:#64748b">Во Nexa → Моја страница можете со еден клик да ја додадете во Клиенти.</p>
        </div>`;
      emailService.sendEmail(to, `Интерес за Вашата објава — ${me.name}`, html, me.email ? { replyTo: me.email } : {})
        .catch((e) => console.warn('[posts] email failed:', e.message));
    }
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[posts] interest:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// „Испратете понуда" on a „Бараме" post: the poster becomes a deal in MY
// pipeline (Контактирани) and a quote draft opens for it. When I send that
// quote, the poster is notified with the link (controllers/salesQuotesController).
router.post('/:id/quote', actionLimiter, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const post = await svc(req).findLive(req.params.id);
    if (!post || post.type !== 'seeking') return res.status(404).json({ message: 'Објавата не е повеќе активна.' });
    if (String(post.userId) === uid(req)) return res.status(400).json({ message: 'Ова е Ваша објава.' });
    const quotes = req.app.locals.salesQuotesService;
    const existing = await db.collection('sales_quotes').findOne({ userId: new ObjectId(uid(req)), postId: post._id });
    if (existing) return res.json({ quoteId: existing._id, existing: true });

    const poster = await db.collection('users').findOne({ _id: post.userId }, { projection: { companyInfo: 1, publicProfile: 1 } });
    const name = String(poster?.companyInfo?.companyName || poster?.publicProfile?.displayName || 'Фирма').slice(0, 200);
    const email = poster?.publicProfile?.contactEmail || '';
    const deal = await req.app.locals.salesDealsService.create(uid(req), {
      name, stage: 'contacted',
      contact: { person: '', email, phone: poster?.publicProfile?.phone || '' },
      note: `Од објава „Бараме" на Nexa (${post.fields.category}): ${post.fields.what}${post.fields.quantity ? ` · ${post.fields.quantity}` : ''}${post.fields.city ? ` · ${post.fields.city}` : ''}`,
    });
    const quote = await quotes.create(uid(req), {
      dealId: String(deal._id),
      title: post.fields.what,
      client: { name, email, phone: poster?.publicProfile?.phone || '' },
    });
    await db.collection('sales_quotes').updateOne({ _id: quote._id }, { $set: { postId: post._id, postOwnerId: post.userId } });
    await svc(req).markInterested(uid(req), post);
    res.status(201).json({ quoteId: quote._id, dealId: deal._id });
  } catch (e) {
    console.error('[posts] quote:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/report', actionLimiter, async (req, res) => {
  try {
    const r = await svc(req).report(uid(req), req.params.id, req.body?.reason);
    if (r.error === 'not_found') return res.status(404).json({ message: 'Објавата не е пронајдена.' });
    if (r.error === 'own') return res.status(400).json({ message: 'Не можете да ја пријавите својата објава.' });
    if (r.hidden) {
      try {
        const admins = await req.app.locals.db.collection('users').find({ role: 'admin' }).project({ _id: 1 }).toArray();
        for (const a of admins) {
          notifications.notify(req.app.locals.db, a._id, {
            type: 'company_post', title: '⚠ Објава скриена по пријави', message: r.post.title.slice(0, 200),
            actionUrl: '/terminal', severity: 'warning',
          }, req.app.locals.io).catch(() => {});
        }
      } catch (_) { /* best-effort */ }
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('[posts] report:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin/all', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try { res.json({ items: await svc(req).adminList() }); } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/admin/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const ok = await svc(req).adminRemove(req.params.id);
    res.status(ok ? 200 : 404).json({ ok });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
