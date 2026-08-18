/**
 * Clients controller — saved client company profiles (Pro/lawyer feature).
 * Gated to tier B (Pro) or ADMIN; every operation is scoped to req.user._id.
 */
const ClientsService = require('../services/clientsService');
const tierService = require('../services/tierService');

const make = (req) => new ClientsService(req.app.locals.db);

const handle = (res, err) => {
  const map = { INVALID_INPUT: 400, INVALID_ID: 400, NOT_FOUND: 404 };
  return res.status(map[err.code] || 500).json({
    success: false, code: err.code || 'ERROR', message: err.message, fields: err.fields
  });
};

// Pro (B) or ADMIN only. Trial-with-Pro-intent may also manage clients so a
// lawyer can set up before paying; mirrors visibleTier used elsewhere.
exports.requireProOrAdmin = (req, res, next) => {
  const v = tierService.visibleTier(req.user);
  if (v === 'B' || v === 'ADMIN') return next();
  return res.status(403).json({ success: false, code: 'TIER_FORBIDDEN',
    message: 'Клиентските профили се достапни само за Про членови.' });
};

exports.list = async (req, res) => {
  try {
    const items = await make(req).list(req.user._id, { search: req.query.search });
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.create = async (req, res) => {
  try {
    const item = await make(req).create(req.user._id, req.body || {});
    return res.status(201).json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.get = async (req, res) => {
  try {
    const item = await make(req).getOwned(req.user._id, req.params.id);
    if (!item) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.update = async (req, res) => {
  try {
    const item = await make(req).update(req.user._id, req.params.id, req.body || {});
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.remove = async (req, res) => {
  try {
    const result = await make(req).remove(req.user._id, req.params.id);
    return res.json({ success: true, ...result });
  } catch (err) { return handle(res, err); }
};
