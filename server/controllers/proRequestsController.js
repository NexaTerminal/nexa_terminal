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
const CATEGORY_LABEL = { legal: 'Правно', marketing: 'Маркетинг', hr: 'Човечки ресурси', insurance: 'Осигурување' };
const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
// Liability line shown to both sides — the Pro owns their advice; AI is informational.
const LIABILITY_NOTE =
  'Напомена: AI одговорите се информативни и не се правен совет. Ако професионалец се приклучи и даде совет, тој е професионално одговорен за точноста на својот совет.';

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

    const item = await make(req).create(req.user, req.body || {}, summary);
    const adminLink = `${APP_URL()}/terminal/admin-user/requests`;
    const summaryHtml = esc(item.context?.aiSummary || '').replace(/\n/g, '<br/>');
    notify(
      ADMIN_EMAIL(),
      `Ново барање: ${TYPE_LABEL[item.type] || item.type}`,
      `<p>Пристигна ново барање за професионалец.</p>
       <p><strong>Вид:</strong> ${esc(TYPE_LABEL[item.type] || item.type)}<br/>
       <strong>Наслов:</strong> ${esc(item.subject)}<br/>
       <strong>Корисник:</strong> ${esc(item.userName || '')} ${item.userEmail ? `(${esc(item.userEmail)})` : ''}<br/>
       <strong>Фирма:</strong> ${esc(item.companyName || '-')}</p>
       ${summaryHtml ? `<p><strong>Резиме на разговорот со AI:</strong><br/>${summaryHtml}</p>` : ''}
       ${item.context?.question ? `<p><strong>Прашање:</strong><br/>${esc(item.context.question)}</p>` : ''}
       ${item.context?.documentName ? `<p><strong>Документ:</strong> ${esc(item.context.documentName)}</p>` : ''}
       <p><a href="${adminLink}">Отвори во админ панел</a> за да го објавиш на таблата за професионалци.</p>`
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
// Admin approves onto the open board, then broadcasts to all eligible Pros. The
// conversation summary was generated at creation; we only regenerate it here as
// a fallback (e.g. legacy rows that predate create-time summaries). First Pro to
// claim joins the thread.
exports.approveToBoard = async (req, res) => {
  try {
    if (!isAdmin(req)) return handle(res, { code: 'FORBIDDEN', message: 'Само за администратор.' });
    const svc = make(req);
    const current = await svc.getForActor(req.user, req.params.id, true);

    let summary = current.context?.aiSummary;
    if (!summary) {
      summary = await aiSummaryService.summarizeConversation({
        subject: current.subject,
        question: current.context?.question,
        transcript: current.context?.transcriptExcerpt,
        type: current.type,
      });
    }

    const item = await svc.approveToBoard(req.params.id, summary);
    const pros = await svc.eligibleProsForCategory(item.category);
    const boardLink = `${APP_URL()}/terminal/pro/board`;
    const summaryHtml = esc(item.context?.aiSummary || summary).replace(/\n/g, '<br/>');

    for (const p of pros) {
      notify(
        p.email,
        `Ново барање на таблата: ${esc(item.subject)}`,
        `<p>Пристигна ново барање од корисник на Nexa што бара помош или проверка од професионалец.</p>
         <p><strong>Област:</strong> ${esc(CATEGORY_LABEL[item.category] || item.category)}<br/>
         <strong>Наслов:</strong> ${esc(item.subject)}</p>
         <p><strong>Резиме на разговорот со AI:</strong><br/>${summaryHtml}</p>
         <p>Првиот професионалец што ќе се приклучи го презема разговорот. <a href="${boardLink}">Отвори ја таблата со барања</a>.</p>
         <p style="color:#666;font-size:12px">${esc(LIABILITY_NOTE)}</p>`
      );
    }

    notify(
      item.userEmail,
      'Вашето барање е споделено со професионалци',
      `<p>Вашето барање „${esc(item.subject)}" е одобрено и споделено со проверени професионалци. Наскоро некој ќе се приклучи во разговорот.</p>
       <p><a href="${APP_URL()}/terminal/requests">Следете го тука</a>.</p>
       <p style="color:#666;font-size:12px">${esc(LIABILITY_NOTE)}</p>`
    );

    return res.json({ success: true, item, notified: pros.length });
  } catch (err) { return handle(res, err); }
};

// Pro view of the open board (eligible, unclaimed requests).
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
    const item = await make(req).claim(req.user, req.params.id, { version: req.body?.consentVersion });
    const link = `${APP_URL()}/terminal/requests`;
    notify(
      item.userEmail,
      'Професионалец се приклучи во вашето барање',
      `<p><strong>${esc(item.assignedProName || 'Професионалец')}</strong> се приклучи во вашето барање „${esc(item.subject)}" и може да ви помогне.</p>
       <p><a href="${link}">Отвори го разговорот</a></p>
       <p style="color:#666;font-size:12px">${esc(LIABILITY_NOTE)}</p>`
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
