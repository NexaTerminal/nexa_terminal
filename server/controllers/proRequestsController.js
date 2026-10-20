/**
 * Pro Requests controller — "Ask a Pro" bridge (Queries / Барања).
 *
 * Any authenticated (verified) user may create a request (demand side). Reads
 * are role-scoped via a `view` param: mine (requester) | assigned (Pro) | admin.
 * Approve-to-board and reject are ADMIN-only. Email notifications are best-effort
 * and never block the API response.
 */
const ProRequestsService = require('../services/proRequestsService');
const tierService = require('../services/tierService');
const emailService = require('../services/emailService');
const aiSummaryService = require('../services/aiSummaryService');
const userNotifications = require('../services/userNotificationService');

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

// Fire-and-forget in-app (bell) notification; best-effort, never blocks the request.
function notifyInApp(req, userId, opts) {
  if (!userId) return;
  const db = req.app.locals.db;
  const io = req.app.locals.io || null;
  Promise.resolve()
    .then(() => userNotifications.notify(db, userId, opts, io))
    .catch((e) => console.warn('[proRequests] in-app notify failed:', e?.message));
}

// Conversation-step email to one side, unless that side muted emails for this
// conversation (the toggle lives in the chat). Bell notifications are separate
// and always fire.
const USER_LINK = () => `${APP_URL()}/terminal/requests`;
const PRO_LINK = () => `${APP_URL()}/terminal/pro/conversations`;
function stepEmail(to, muted, subject, html, link) {
  if (muted) return;
  notify(to, subject,
    `${html}
     <p><a href="${link}">Отвори го разговорот</a></p>
     <p style="color:#666;font-size:12px">Овие известувања по е-пошта можете да ги исклучите во самиот разговор.</p>`);
}
const quoteBody = (text) => `<blockquote style="margin:8px 0;padding:8px 12px;border-left:3px solid #ccc;color:#333">${esc(text).replace(/\n/g, '<br/>')}</blockquote>`;
const snippet = (text) => { const t = String(text || '').replace(/\s+/g, ' ').trim(); return t.length > 120 ? `${t.slice(0, 117)}…` : t; };

const TYPE_LABEL = { consult: 'Прашање до професионалец', contract_review: 'Преглед на договор' };
const CATEGORY_LABEL = { legal: 'Правно', marketing: 'Маркетинг', hr: 'Човечки ресурси', insurance: 'Осигурување' };
const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
// Liability line shown to both sides — the Pro owns their advice; AI is informational.
const LIABILITY_NOTE =
  'Напомена: AI одговорите се информативни и не се правен совет. Ако професионалец се приклучи и даде совет, тој е професионално одговорен за точноста на својот совет.';

// Broadcast an open request to every Pro (bell + email) + confirm to the requester.
// Pros only ever get the anonymized subject (`proSubject`) + the anonymized summary.
async function broadcastToBoard(req, svc, item, summary, proSubject) {
  const pros = await svc.eligibleProsForCategory(item.category);
  const boardLink = `${APP_URL()}/terminal/pro/conversations`;
  const summaryHtml = esc(item.context?.aiSummary || summary || '').replace(/\n/g, '<br/>');
  for (const p of pros) {
    notify(
      p.email,
      `Ново барање на таблата: ${esc(proSubject)}`,
      `<p>Пристигна ново барање од корисник на Nexa што бара помош или проверка од професионалец.</p>
       <p><strong>Област:</strong> ${esc(CATEGORY_LABEL[item.category] || item.category)}<br/>
       <strong>Наслов:</strong> ${esc(proSubject)}</p>
       ${summaryHtml ? `<p><strong>Резиме на разговорот со AI:</strong><br/>${summaryHtml}</p>` : ''}
       <p>Првиот професионалец што ќе се приклучи го презема разговорот. <a href="${boardLink}">Отвори ја таблата со барања</a>.</p>
       <p style="color:#666;font-size:12px">${esc(LIABILITY_NOTE)}</p>`
    );
    notifyInApp(req, p._id, {
      type: 'pro_request_open',
      title: 'Ново барање за професионалец',
      message: proSubject,
      actionUrl: '/terminal/pro/conversations',
      severity: 'info',
    });
  }
  notify(
    item.userEmail,
    'Вашето барање е споделено со професионалци',
    `<p>Вашето барање „${esc(item.subject)}" е споделено со проверени професионалци. Наскоро некој ќе се приклучи во разговорот.</p>
     <p><a href="${APP_URL()}/terminal/requests">Следете го тука</a>.</p>
     <p style="color:#666;font-size:12px">${esc(LIABILITY_NOTE)}</p>`
  );
  return pros.length;
}

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
    // Summarize the AI↔user conversation up-front so the admin reviews a clean
    // brief before approving, and the same text rides onto the Pro board. Fails
    // safe (trimmed fallback) — never blocks creation.
    const ctx = req.body?.context || {};
    const summary = await aiSummaryService.summarizeConversation({
      subject: req.body?.subject,
      question: ctx.question,
      transcript: ctx.transcriptExcerpt,
      type: req.body?.type,
    });

    const { item, proSubject } = await make(req).create(req.user, req.body || {}, summary);

    // Requests are auto-published to the Pro board — broadcast to eligible Pros now.
    const notified = await broadcastToBoard(req, make(req), item, summary, proSubject);

    // Admin gets a heads-up copy (informational; approval is no longer required).
    const adminLink = `${APP_URL()}/terminal/admin-user/requests`;
    const summaryHtml = esc(item.context?.aiSummary || '').replace(/\n/g, '<br/>');
    notify(
      ADMIN_EMAIL(),
      `Ново барање: ${TYPE_LABEL[item.type] || item.type}`,
      `<p>Пристигна ново барање за професионалец (автоматски објавено на таблата).</p>
       <p><strong>Вид:</strong> ${esc(TYPE_LABEL[item.type] || item.type)}<br/>
       <strong>Наслов:</strong> ${esc(item.subject)}<br/>
       <strong>Корисник:</strong> ${esc(item.userName || '')} ${item.userEmail ? `(${esc(item.userEmail)})` : ''}<br/>
       <strong>Фирма:</strong> ${esc(item.companyName || '-')}</p>
       ${summaryHtml ? `<p><strong>Резиме на разговорот со AI:</strong><br/>${summaryHtml}</p>` : ''}
       ${item.context?.question ? `<p><strong>Прашање:</strong><br/>${esc(item.context.question)}</p>` : ''}
       ${item.context?.documentName ? `<p><strong>Документ:</strong> ${esc(item.context.documentName)}</p>` : ''}
       <p><a href="${adminLink}">Отвори во админ панел</a> за да го отстраниш ако е потребно.</p>`
    );
    return res.status(201).json({ success: true, item, notified });
  } catch (err) { return handle(res, err); }
};

// ── Thread ──────────────────────────────────────────────────────────────────────
exports.addMessage = async (req, res) => {
  try {
    const { request, message, authorRole, targets, proBody } = await make(req).addMessage(req.user, req.params.id, req.body?.body, isAdmin(req));
    // Notify the counterpart (email unless muted + bell). Use raw `targets` (not
    // the masked `request`); the Pro only ever gets the anonymized subject/text.
    if (authorRole === 'user') {
      stepEmail(targets.assignedProEmail, targets.proEmailMuted, 'Нова порака од клиент',
        `<p>Клиентот напиша нова порака во „${esc(targets.proSubject)}":</p>${quoteBody(proBody)}`, PRO_LINK());
      notifyInApp(req, targets.assignedProId, { type: 'pro_request_message', title: 'Нова порака од клиент', message: snippet(proBody), actionUrl: '/terminal/pro/conversations', severity: 'info' });
    } else {
      const who = request.assignedProName || 'Професионалецот';
      stepEmail(targets.userEmail, targets.userEmailMuted, 'Нова порака од професионалец',
        `<p><strong>${esc(who)}</strong> ви одговори во „${esc(targets.subject)}":</p>${quoteBody(message.body)}`, USER_LINK());
      notifyInApp(req, targets.userId, { type: 'pro_request_message', title: `Нова порака од ${who}`, message: snippet(message.body), actionUrl: '/terminal/requests', severity: 'info' });
    }
    return res.json({ success: true, item: request, message });
  } catch (err) { return handle(res, err); }
};

exports.addQuote = async (req, res) => {
  try {
    const { amount, currency, body } = req.body || {};
    const { request, message, targets } = await make(req).addQuote(req.user, req.params.id, { amount, currency, body }, isAdmin(req));
    stepEmail(targets.userEmail, targets.userEmailMuted, 'Понуда за цена од професионалец',
      `<p>Професионалецот предложи цена за „${esc(targets.subject)}": <strong>${esc(message.amount)} ${esc(message.currency)}</strong>.</p>
       ${message.body ? quoteBody(message.body) : ''}`, USER_LINK());
    notifyInApp(req, targets.userId, { type: 'pro_request_quote', title: 'Понуда за цена', message: `${message.amount} ${message.currency} — ${snippet(targets.subject)}`, actionUrl: '/terminal/requests', severity: 'info' });
    return res.json({ success: true, item: request, message });
  } catch (err) { return handle(res, err); }
};

// Requester (SMB) reveals / re-hides their identity to the assigned Pro.
exports.reveal = async (req, res) => {
  try {
    const revealed = req.body?.revealed !== false; // default true
    const item = await make(req).setRevealed(req.user, req.params.id, revealed, isAdmin(req));
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

// ── Admin actions ────────────────────────────────────────────────────────────────
// Requests auto-publish to the board (no approval step). Admin oversight = remove
// (reject) a request if needed.

// Pro view of the open board (all unclaimed conversations).
exports.board = async (req, res) => {
  try {
    if (!isProOrAdmin(req)) return handle(res, { code: 'FORBIDDEN', message: 'Само за Про членови.' });
    return res.json({ success: true, items: await make(req).listBoardForPro(req.user) });
  } catch (err) { return handle(res, err); }
};

// Pro claims an open request (first-come) and joins the conversation. Requires an
// explicit professional-liability acknowledgment.
exports.claim = async (req, res) => {
  try {
    if (!isProOrAdmin(req)) return handle(res, { code: 'FORBIDDEN', message: 'Само за Про членови.' });
    if (!req.body?.acceptLiability) {
      return handle(res, { code: 'INVALID_INPUT', message: 'Мора да ја потврдите професионалната одговорност за да се приклучите.', fields: ['acceptLiability'] });
    }
    const { item, targets } = await make(req).claim(req.user, req.params.id, { version: req.body?.consentVersion });
    stepEmail(targets.userEmail, targets.userEmailMuted, 'Професионалец се приклучи во вашето барање',
      `<p><strong>${esc(item.assignedProName || 'Професионалец')}</strong> се приклучи во вашето барање „${esc(targets.subject)}" и може да ви помогне.</p>
       <p style="color:#666;font-size:12px">${esc(LIABILITY_NOTE)}</p>`, USER_LINK());
    notifyInApp(req, targets.userId, {
      type: 'pro_request_joined',
      title: 'Професионалец се приклучи',
      message: `${item.assignedProName || 'Професионалец'} се приклучи во „${targets.subject}"`,
      actionUrl: '/terminal/requests',
      severity: 'success',
    });
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
    const { item, closedBy, targets } = await make(req).close(req.user, req.params.id, isAdmin(req));
    // Tell the other side the conversation ended (admin closing → both sides).
    if (closedBy !== 'user') {
      stepEmail(targets.userEmail, targets.userEmailMuted, 'Разговорот е затворен',
        `<p>Разговорот „${esc(targets.subject)}" е затворен.</p>`, USER_LINK());
      notifyInApp(req, targets.userId, { type: 'pro_request_closed', title: 'Разговорот е затворен', message: snippet(targets.subject), actionUrl: '/terminal/requests', severity: 'info' });
    }
    if (closedBy !== 'pro') {
      stepEmail(targets.assignedProEmail, targets.proEmailMuted, 'Разговорот е затворен',
        `<p>Разговорот „${esc(targets.proSubject)}" е затворен.</p>`, PRO_LINK());
      notifyInApp(req, targets.assignedProId, { type: 'pro_request_closed', title: 'Разговорот е затворен', message: snippet(targets.proSubject), actionUrl: '/terminal/pro/conversations', severity: 'info' });
    }
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

// Either side turns this conversation's step emails on/off for themselves.
exports.emailPrefs = async (req, res) => {
  try {
    const item = await make(req).setEmailMuted(req.user, req.params.id, req.body?.muted === true, isAdmin(req));
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

// Pro: active conversations waiting on their reply (sidebar badge + banner).
exports.unanswered = async (req, res) => {
  try {
    if (!isProOrAdmin(req)) return res.json({ success: true, count: 0, items: [] });
    const { count, items } = await make(req).unansweredForPro(req.user._id);
    return res.json({ success: true, count, items });
  } catch (err) { return handle(res, err); }
};
