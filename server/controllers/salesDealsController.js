// Продажна инка — HTTP layer. Thin handlers over SalesDealsService;
// ownership enforced by scoping every query to req.user._id in the service.

const { ObjectId } = require('mongodb');
const { STAGES } = require('../services/salesDealsService');

const svc = (req) => req.app.locals.salesDealsService;
const badId = (id) => !ObjectId.isValid(id);

async function summary(req, res) {
  try {
    const data = await svc(req).summary(req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[sales] summary error:', err);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на инката.' });
  }
}

/**
 * Dashboard strip „Продажба овој месец": pipeline, quotes and the one-pager in
 * one call. Every block is best-effort so one failing source never hides the rest.
 */
async function overview(req, res) {
  try {
    const db = req.app.locals.db;
    const uid = new ObjectId(String(req.user._id));
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const quotesSvc = req.app.locals.salesQuotesService;
    const { computeTotals, effectiveStatus, MKD_PER_EUR } = require('../services/salesQuotesService');
    const toMkd = (q, n) => (q.currency === 'EUR' ? n * MKD_PER_EUR : n);

    const [pipe, quotes, stats, newMessages] = await Promise.all([
      svc(req).summary(req.user._id).catch(() => null),
      quotesSvc ? db.collection('sales_quotes').find({ userId: uid, status: { $ne: 'draft' } })
        .project({ items: 1, discountPct: 1, currency: 1, status: 1, validUntil: 1, sentAt: 1, response: 1, viewCount: 1 })
        .toArray().catch(() => []) : [],
      db.collection('profile_stats').findOne({ userId: uid, month: new Date().toISOString().slice(0, 7) }).catch(() => null),
      db.collection('profile_messages').countDocuments({ userId: uid, dealId: { $exists: false }, createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }).catch(() => 0),
    ]);

    let awaiting = 0; let awaitingMkd = 0; let unopened = 0;
    let sentMonth = 0; let acceptedMonth = 0; let acceptedMonthMkd = 0;
    for (const q of quotes) {
      const st = effectiveStatus(q);
      const net = computeTotals(q.items || [], q.discountPct).net;
      if (st === 'sent' || st === 'viewed') { awaiting += 1; awaitingMkd += toMkd(q, net); if (!q.viewCount) unopened += 1; }
      if (q.sentAt && q.sentAt >= monthStart) sentMonth += 1;
      if (st === 'accepted' && q.response?.at && q.response.at >= monthStart) { acceptedMonth += 1; acceptedMonthMkd += toMkd(q, net); }
    }
    const open = pipe ? ['potential', 'contacted', 'offer', 'negotiation'].reduce((a, k) => a + (pipe.stages[k]?.count || 0), 0) : 0;
    const openValue = pipe ? ['potential', 'contacted', 'offer', 'negotiation'].reduce((a, k) => a + (pipe.stages[k]?.value || 0), 0) : 0;

    res.json({ success: true, data: {
      pipeline: { open, openValueEur: Math.round(openValue), overdue: pipe?.overdue || 0, wonMonth: pipe?.wonThisMonth || { count: 0, value: 0 } },
      quotes: { awaiting, awaitingMkd: Math.round(awaitingMkd), unopened, sentMonth, acceptedMonth, acceptedMonthMkd: Math.round(acceptedMonthMkd) },
      page: { views: stats?.views || 0, contacts: stats?.contacts || 0, newMessages },
    } });
  } catch (err) {
    console.error('[sales] overview error:', err);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на прегледот.' });
  }
}

async function list(req, res) {
  try {
    const items = await svc(req).list(req.user._id, { stage: req.query.stage, q: req.query.q });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[sales] list error:', err);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на зделките.' });
  }
}

async function create(req, res) {
  try {
    if (!req.body?.name || !String(req.body.name).trim()) {
      return res.status(400).json({ success: false, message: 'Името на компанијата/контактот е задолжително.' });
    }
    const doc = await svc(req).create(req.user._id, req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('[sales] create error:', err);
    res.status(500).json({ success: false, message: 'Грешка при креирање на зделката.' });
  }
}

async function update(req, res) {
  try {
    if (badId(req.params.id)) return res.status(400).json({ success: false, message: 'Невалиден идентификатор.' });
    const doc = await svc(req).update(req.user._id, req.params.id, req.body || {});
    if (!doc) return res.status(404).json({ success: false, message: 'Зделката не е пронајдена.' });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[sales] update error:', err);
    res.status(500).json({ success: false, message: 'Грешка при зачувување на зделката.' });
  }
}

async function setStage(req, res) {
  try {
    if (badId(req.params.id)) return res.status(400).json({ success: false, message: 'Невалиден идентификатор.' });
    const stage = req.body?.stage;
    if (!STAGES.includes(stage)) {
      return res.status(400).json({ success: false, message: 'Невалидна фаза.' });
    }
    const doc = await svc(req).setStage(req.user._id, req.params.id, stage, req.body?.lostReason);
    if (!doc) return res.status(404).json({ success: false, message: 'Зделката не е пронајдена.' });
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[sales] setStage error:', err);
    res.status(500).json({ success: false, message: 'Грешка при преместување на зделката.' });
  }
}

async function remove(req, res) {
  try {
    if (badId(req.params.id)) return res.status(400).json({ success: false, message: 'Невалиден идентификатор.' });
    const ok = await svc(req).remove(req.user._id, req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Зделката не е пронајдена.' });
    res.json({ success: true });
  } catch (err) {
    console.error('[sales] remove error:', err);
    res.status(500).json({ success: false, message: 'Грешка при бришење на зделката.' });
  }
}

module.exports = { summary, overview, list, create, update, setStage, remove };
