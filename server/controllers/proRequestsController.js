/**
 * Pro Requests controller — "Ask a Pro" bridge (Queries / Барања).
 *
 * Any authenticated (verified) user may create a request (demand side). Reads
 * are role-scoped via a `view` param: mine (requester) | assigned (Pro) | admin.
 * Approve/reject/providers are ADMIN-only. Email notifications are best-effort
 * and never block the API response.
 */
const ProRequestsService = require('../services/proRequestsService');
const tierService = require('../services/tierService');
const emailService = require('../services/emailService');

const make = (req) => new ProRequestsService(req.app.locals.db);
const isAdmin = (req) => tierService.visibleTier(req.user) === 'ADMIN';
const isProOrAdmin = (req) => ['B', 'ADMIN'].includes(tierService.visibleTier(req.user));
const ADMIN_EMAIL = () => process.env.ADMIN_EMAIL || 'terminalnexa@gmail.com';
const APP_URL = () => process.env.CLIENT_URL || process.env.APP_URL || 'https://nexa.mk';

const handle = (res, err) => {
  const map = { INVALID_INPUT: 400, INVALID_ID: 400, NOT_FOUND: 404, FORBIDDEN: 403 };
  return res.status(map[err.code] || 500).json({
    success: false, code: err.code || 'ERROR', message: err.message, fields: err.fields,
  });
};

// Fire-and-forget email; swallow all errors so the request flow is never blocked.
function notify(to, subject, html) {
  if (!to) return;
  Promise.resolve()
    .then(() => emailService.sendEmail(to, subject, html))
    .catch((e) => console.warn('[proRequests] email failed:', e?.message));
}

const TYPE_LABEL = { consult: 'Прашање до професионалец', contract_review: 'Преглед на договор' };
const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

// ── Reads ──────────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const view = req.query.view || 'mine';
    if (view === 'admin') {
      if (!isAdmin(req)) return handle(res, { code: 'FORBIDDEN', message: 'Само за администратор.' });
      return res.json({ success: true, items: await make(req).listForAdmin({ status: req.query.status }) });
    }
    if (view === 'assigned') {
      if (!isProOrAdmin(req)) return handle(res, { code: 'FORBIDDEN', message: 'Само за Про членови.' });
      return res.json({ success: true, items: await make(req).listForPro(req.user._id) });
    }
    return res.json({ success: true, items: await make(req).listForUser(req.user._id) });
  } catch (err) { return handle(res, err); }
};

exports.get = async (req, res) => {
  try {
    const item = await make(req).getForActor(req.user, req.params.id, isAdmin(req));
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

// ── Create (requester) ──────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const item = await make(req).create(req.user, req.body || {});
    const adminLink = `${APP_URL()}/terminal/admin-user/requests`;
    notify(
      ADMIN_EMAIL(),
      `Ново барање: ${TYPE_LABEL[item.type] || item.type}`,
      `<p>Пристигна ново барање за професионалец.</p>
       <p><strong>Вид:</strong> ${esc(TYPE_LABEL[item.type] || item.type)}<br/>
       <strong>Наслов:</strong> ${esc(item.subject)}<br/>
       <strong>Корисник:</strong> ${esc(item.userName || '')} ${item.userEmail ? `(${esc(item.userEmail)})` : ''}<br/>
       <strong>Фирма:</strong> ${esc(item.companyName || '-')}</p>
       ${item.context?.question ? `<p><strong>Прашање:</strong><br/>${esc(item.context.question)}</p>` : ''}
       ${item.context?.documentName ? `<p><strong>Документ:</strong> ${esc(item.context.documentName)}</p>` : ''}
       <p><a href="${adminLink}">Отвори во админ панел</a> за одобрување и доделување.</p>`
    );
    return res.status(201).json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

// ── Thread ──────────────────────────────────────────────────────────────────────
exports.addMessage = async (req, res) => {
  try {
    const { request, message, authorRole } = await make(req).addMessage(req.user, req.params.id, req.body?.body, isAdmin(req));
    // Notify the counterpart.
    const link = `${APP_URL()}/terminal/requests`;
    const body = `<p>Нова порака во барањето „${esc(request.subject)}".</p><p><a href="${link}">Отвори го разговорот</a></p>`;
    if (authorRole === 'user') notify(request.assignedProEmail, 'Нова порака од клиент', body);
    else notify(request.userEmail, 'Нова порака од професионалец', body);
    return res.json({ success: true, item: request, message });
  } catch (err) { return handle(res, err); }
};

exports.addQuote = async (req, res) => {
  try {
    const { amount, currency, body } = req.body || {};
    const { request, message } = await make(req).addQuote(req.user, req.params.id, { amount, currency, body }, isAdmin(req));
    const link = `${APP_URL()}/terminal/requests`;
    notify(
      request.userEmail,
      'Понуда за цена од професионалец',
      `<p>Професионалецот предложи цена за „${esc(request.subject)}": <strong>${esc(message.amount)} ${esc(message.currency)}</strong>.</p>
       ${message.body ? `<p>${esc(message.body)}</p>` : ''}
       <p><a href="${link}">Отвори го разговорот</a></p>`
    );
    return res.json({ success: true, item: request, message });
  } catch (err) { return handle(res, err); }
};

// ── Admin actions ────────────────────────────────────────────────────────────────
exports.approve = async (req, res) => {
  try {
    if (!isAdmin(req)) return handle(res, { code: 'FORBIDDEN', message: 'Само за администратор.' });
    const item = await make(req).approveAndAssign(req.params.id, req.body?.assignedProId);
    const link = `${APP_URL()}/terminal/requests`;
    notify(
      item.assignedProEmail,
      `Доделено ново барање: ${esc(item.subject)}`,
      `<p>Ви е доделено барање од клиент на Nexa.</p>
       <p><strong>Наслов:</strong> ${esc(item.subject)}</p>
       ${item.context?.question ? `<p><strong>Прашање:</strong><br/>${esc(item.context.question)}</p>` : ''}
       ${item.context?.documentRef ? `<p><strong>Документ за преглед:</strong> <a href="${esc(item.context.documentRef)}">отвори</a></p>` : ''}
       <p><a href="${link}">Отвори го разговорот</a> за да одговориш.</p>`
    );
    notify(
      item.userEmail,
      'Вашето барање е прифатено',
      `<p>Вашето барање „${esc(item.subject)}" е прегледано и доделено на професионалец. Може да започнете разговор.</p>
       <p><a href="${link}">Отвори го разговорот</a></p>`
    );
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.reject = async (req, res) => {
  try {
    if (!isAdmin(req)) return handle(res, { code: 'FORBIDDEN', message: 'Само за администратор.' });
    const item = await make(req).reject(req.params.id, req.body?.reason);
    notify(
      item.userEmail,
      'Ажурирање за вашето барање',
      `<p>За жал, вашето барање „${esc(item.subject)}" не може да биде обработено во моментот.</p>
       ${item.rejectionReason ? `<p>${esc(item.rejectionReason)}</p>` : ''}`
    );
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.close = async (req, res) => {
  try {
    const item = await make(req).close(req.user, req.params.id, isAdmin(req));
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

exports.providers = async (req, res) => {
  try {
    if (!isAdmin(req)) return handle(res, { code: 'FORBIDDEN', message: 'Само за администратор.' });
    return res.json({ success: true, items: await make(req).listProviders() });
  } catch (err) { return handle(res, err); }
};
