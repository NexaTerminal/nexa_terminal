/**
 * Controllers for the Inquiry Board (Nexa 3.0 §7 — manual model).
 *
 * Two surfaces:
 *   - Member endpoints: board list / get / submit interest / my claims / my engagements
 *   - Admin endpoints:  create / list / detail / update / approve / mark-introduced / close
 *
 * Auth + tier gating in the routes layer. CSRF exemption + JWT mount applied
 * at the server.js level.
 */

const InquiriesService = require('../services/inquiriesService');
const tierService = require('../services/tierService');
const emails = require('../emails/inquiryEmails');

const make = (req) => new InquiriesService(req.app.locals.db);

const handle = (res, err, status = 500) => {
  const map = {
    INVALID_ID:         400,
    INVALID_INPUT:      400,
    INCOMPLETE:         400,
    INVALID_TRANSITION: 400,
    TRIAL_LOCKED:       403,
    TIER_FORBIDDEN:     403,
    FORBIDDEN:          403,
    NOT_ADMIN:          403,
    NOT_FOUND:          404,
    INQUIRY_CLOSED:     409,
    ALREADY_INTERESTED: 409,
    CATEGORY_TAKEN:     409,
    QUOTA_EXCEEDED:     409
  };
  return res.status(map[err.code] || status).json({
    success: false, code: err.code || 'ERROR', message: err.message, fields: err.fields
  });
};

async function sendIfEmail(req, user, template) {
  const email = user?.email; if (!email) return;
  try {
    const svc = req.app.locals.emailService;
    if (!svc?.send) return;
    await svc.send({ to: email, subject: template.subject, html: template.html });
  } catch (e) { console.warn('[inquiries] email send failed:', e.message); }
}

// ── member endpoints ────────────────────────────────────────────────────────

exports.listBoard = async (req, res) => {
  try {
    const items = await make(req).listBoardFor(req.user);
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.getOne = async (req, res) => {
  try {
    const doc = await make(req).getForMember(req.user, req.params.id);
    if (!doc) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, inquiry: doc });
  } catch (err) { return handle(res, err); }
};

exports.submitInterest = async (req, res) => {
  try {
    const svc = make(req);
    const signal = await svc.submitInterest(req.user, req.params.id, req.body || {});
    // Send acknowledgement email (fire-and-forget)
    const inq = await svc.col.findOne({ _id: signal.inquiryId });
    if (inq) {
      const t = emails.inquiryAcknowledged({
        name: req.user.fullName || req.user.username,
        topic: inq.topic,
        city: inq.city
      }, 'mk');
      sendIfEmail(req, req.user, t);
    }
    return res.status(201).json({ success: true, signal });
  } catch (err) { return handle(res, err); }
};

exports.getMySignal = async (req, res) => {
  try {
    const sig = await make(req).getMySignal(req.user, req.params.id);
    return res.json({ success: true, signal: sig || null });
  } catch (err) { return handle(res, err); }
};

exports.listMyClaims = async (req, res) => {
  try {
    const items = await make(req).listMyClaims(req.user);
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.listMyEngagements = async (req, res) => {
  try {
    const items = await make(req).listMyEngagements(req.user);
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

// ── admin endpoints ────────────────────────────────────────────────────────

exports.adminList = async (req, res) => {
  try {
    const { status, page, perPage } = req.query;
    const result = await make(req).listForAdmin({
      status: status || null,
      page: Number(page) || 1,
      perPage: Math.min(100, Number(perPage) || 30)
    });
    return res.json({ success: true, ...result });
  } catch (err) { return handle(res, err); }
};

exports.adminCreate = async (req, res) => {
  try {
    const doc = await make(req).create(req.user, req.body || {});
    return res.status(201).json({ success: true, inquiry: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminGetDetail = async (req, res) => {
  try {
    const data = await make(req).getForAdmin(req.params.id);
    if (!data) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, ...data });
  } catch (err) { return handle(res, err); }
};

exports.adminUpdate = async (req, res) => {
  try {
    const doc = await make(req).update(req.user, req.params.id, req.body || {});
    return res.json({ success: true, inquiry: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminApprove = async (req, res) => {
  try {
    const { signalId, operatorNotes } = req.body || {};
    const result = await make(req).approveSignal(req.user, req.params.id, signalId, operatorNotes || '');
    return res.json({ success: true, ...result });
  } catch (err) { return handle(res, err); }
};

exports.adminMarkIntroduced = async (req, res) => {
  try {
    const { approvalId } = req.body || {};
    const svc = make(req);
    const result = await svc.markIntroduced(req.user, req.params.id, approvalId);
    // Send acknowledgement to all sibling members whose signals were acknowledged.
    if (result.acknowledgedMemberIds.length > 0) {
      const inq = await svc.col.findOne({ _id: InquiriesService.toObjectId(req.params.id) });
      const members = await svc.users.find(
        { _id: { $in: result.acknowledgedMemberIds } },
        { projection: { email: 1, fullName: 1, username: 1 } }
      ).toArray();
      for (const m of members) {
        const t = emails.inquiryAcknowledgedNotChosen({
          name: m.fullName || m.username,
          topic: inq?.topic || ''
        }, 'mk');
        sendIfEmail(req, m, t);
      }
    }
    return res.json({ success: true, ...result });
  } catch (err) { return handle(res, err); }
};

exports.adminClose = async (req, res) => {
  try {
    const doc = await make(req).closeInquiry(req.user, req.params.id);
    return res.json({ success: true, inquiry: doc });
  } catch (err) { return handle(res, err); }
};

// ── middleware ─────────────────────────────────────────────────────────────

exports.requireBcOrAdmin = (req, res, next) => {
  const t = tierService.effectiveTier(req.user);
  if (t === 'B' || t === 'ADMIN') return next();
  return res.status(403).json({ success: false, code: 'TIER_FORBIDDEN',
    message: 'Барањата се достапни само за Про членови.' });
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, code: 'NOT_ADMIN', message: 'Admin only.' });
};
