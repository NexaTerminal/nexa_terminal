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
const { getAgentName } = require('../chatbot/agentProfiles');

const make = (req) => new ProRequestsService(req.app.locals.db);
const isAdmin = (req) => tierService.visibleTier(req.user) === 'ADMIN';
const isProOrAdmin = (req) => ['B', 'ADMIN'].includes(tierService.visibleTier(req.user));
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
// Pro-facing conversation emails (board broadcast to every Pro, new client
// message, conversation closed) are OFF — they reached every Pro and felt
// spammy. Pros still get the in-app bell. Set PRO_CHAT_EMAILS=on to restore.
const PRO_CHAT_EMAILS = require('../utils/proEmailPolicy').proEventEmailsEnabled;
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

const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
// Liability line shown to both sides — the Pro owns their advice; AI is informational.
const LIABILITY_NOTE =
  'Напомена: AI одговорите се информативни и не се правен совет. Ако професионалец се приклучи и даде совет, тој е професионално одговорен за точноста на својот совет.';

// Announce an open request to every Pro: in-app bell only. No email to anyone on
// invite (user rule, Nov 2026): Pros see waiting invites when they log in.
async function broadcastToBoard(req, svc, item, proSubject) {
  const pros = await svc.eligibleProsForCategory(item.category);
  for (const p of pros) {
    notifyInApp(req, p._id, {
      type: 'pro_request_open',
      title: 'Ново барање за професионалец',
      message: proSubject,
      actionUrl: '/terminal/pro/conversations',
      severity: 'info',
    });
  }
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
// The Pro's intro covers ONLY the user's current session with the AI character:
// the latest messages of the linked conversation with no pause longer than
// SESSION_GAP_MS between them (earlier sessions in the same thread stay private).
const SESSION_GAP_MS = 60 * 60 * 1000;
const SESSION_MAX_MESSAGES = 16;
const cleanAi = (t) => String(t || '')
  .replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/g, '')
  .replace(/\[\[HANDOFF:[a-z]*\]\]/gi, '')
  .trim();

async function currentSessionTranscript(req, conversationId, agent) {
  const conversationService = req.app.locals.conversationService;
  if (!conversationId || !conversationService) return null;
  try {
    const conv = await conversationService.getConversation(String(conversationId), req.user._id);
    const msgs = (conv.messages || []).filter((m) => (m.content || '').trim());
    if (!msgs.length) return null;
    let start = msgs.length - 1;
    while (start > 0 && msgs.length - start < SESSION_MAX_MESSAGES) {
      const gap = new Date(msgs[start].timestamp) - new Date(msgs[start - 1].timestamp);
      if (!(gap <= SESSION_GAP_MS)) break;
      start -= 1;
    }
    const aiName = getAgentName(agent || conv.agent) || 'AI';
    const turns = msgs.slice(start)
      .map((m) => `${m.type === 'user' ? 'Јас' : aiName}: ${m.type === 'user' ? m.content.trim() : cleanAi(m.content).slice(0, 1500)}`);
    // Stored excerpts are capped (6000 chars) — drop the OLDEST turns, keep the latest.
    while (turns.length > 1 && turns.join('\n\n').length > 5800) turns.shift();
    return turns.join('\n\n');
  } catch (_) {
    return null; // not the caller's conversation / not found → keep the client excerpt
  }
}

exports.create = async (req, res) => {
  const svc = make(req);
  let lockId = null;
  try {
    const ctx = req.body?.context || {};
    // One live invite per conversation. Checked before the slow AI summary below,
    // so repeated clicks can't each run it and each reach the board.
    const slot = await svc.reserveInvite(req.user, ctx.conversationId);
    if (slot.item) return res.json({ success: true, item: slot.item, notified: 0, deduped: true });
    if (slot.pending) return res.json({ success: true, pending: true, notified: 0, deduped: true });
    lockId = slot.lockId;

    // Summarize the AI↔user conversation up-front; the same text rides onto the
    // Pro board. Fails safe (trimmed fallback) — never blocks creation.
    // From a chat: the transcript is built server-side from the current session only.
    const session = await currentSessionTranscript(req, ctx.conversationId, req.body?.agent);
    if (session) {
      ctx.transcriptExcerpt = session;
      req.body.context = ctx;
    }
    const summary = await aiSummaryService.summarizeConversation({
      subject: req.body?.subject,
      question: ctx.question,
      transcript: ctx.transcriptExcerpt,
      type: req.body?.type,
    });

    const { item, proSubject } = await svc.create(req.user, req.body || {}, summary);

    // Requests are auto-published to the Pro board — announce to eligible Pros now.
    const notified = await broadcastToBoard(req, svc, item, proSubject);
    return res.status(201).json({ success: true, item, notified });
  } catch (err) {
    return handle(res, err);
  } finally {
    if (lockId) await svc.releaseInvite(lockId);
  }
};

// ── Thread ──────────────────────────────────────────────────────────────────────
exports.addMessage = async (req, res) => {
  try {
    const { request, message, authorRole, targets, proBody } = await make(req).addMessage(req.user, req.params.id, req.body?.body, isAdmin(req));
    // Notify the counterpart (email unless muted + bell). Use raw `targets` (not
    // the masked `request`); the Pro only ever gets the anonymized subject/text.
    if (authorRole === 'user') {
      stepEmail(targets.assignedProEmail, targets.proEmailMuted || !PRO_CHAT_EMAILS(), 'Нова порака од клиент',
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
      stepEmail(targets.assignedProEmail, targets.proEmailMuted || !PRO_CHAT_EMAILS(), 'Разговорот е затворен',
        `<p>Разговорот „${esc(targets.proSubject)}" е затворен.</p>`, PRO_LINK());
      notifyInApp(req, targets.assignedProId, { type: 'pro_request_closed', title: 'Разговорот е затворен', message: snippet(targets.proSubject), actionUrl: '/terminal/pro/conversations', severity: 'info' });
    }
    return res.json({ success: true, item });
  } catch (err) { return handle(res, err); }
};

// Owner withdraws an unclaimed invite. Nobody has joined, so nobody is notified.
exports.cancelInvite = async (req, res) => {
  try {
    const { item } = await make(req).cancelInvite(req.user, req.params.id, isAdmin(req));
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
// Requester: conversations with pro replies they haven't seen yet ({ count }).
exports.unread = async (req, res) => {
  try {
    const { count } = await make(req).unreadSummaryForUser(req.user._id);
    return res.json({ success: true, count });
  } catch (err) { return handle(res, err); }
};

exports.unanswered = async (req, res) => {
  try {
    if (!isProOrAdmin(req)) return res.json({ success: true, count: 0, items: [] });
    const { count, items } = await make(req).unansweredForPro(req.user._id);
    return res.json({ success: true, count, items });
  } catch (err) { return handle(res, err); }
};
