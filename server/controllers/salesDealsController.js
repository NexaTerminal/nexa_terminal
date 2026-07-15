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

module.exports = { summary, list, create, update, setStage, remove };
