/**
 * Controllers for Topics Q&A authoring (Nexa 3.0 §8 — Type C only).
 */

const TopicsService = require('../services/topicsService');
const tierService   = require('../services/tierService');
const emails        = require('../emails/topicsEmails');

const make = (req) => new TopicsService(req.app.locals.db);

const handle = (res, err, status = 500) => {
  const map = {
    INVALID_ID:         400,
    INVALID_INPUT:      400,
    INVALID_QUESTIONS:  400,
    INCOMPLETE:         400,
    NOTES_REQUIRED:     400,
    NOT_EDITABLE:       400,
    INVALID_TRANSITION: 400,
    TOO_LONG:           400,
    TIER_FORBIDDEN:     403,
    TRIAL_LOCKED:       403,
    FORBIDDEN:          403,
    NOT_ADMIN:          403,
    NOT_FOUND:          404,
    NOT_OPEN:           409,
    HAS_ACTIVE:         409,
    ALREADY_ACTIVE:     409
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
  } catch (e) { console.warn('[topics] email send failed:', e.message); }
}

async function loadAuthor(req, authorId) {
  try { return await req.app.locals.db.collection('users').findOne({ _id: authorId },
    { projection: { email: 1, username: 1, fullName: 1 } }); } catch { return null; }
}

// ── member endpoints ───────────────────────────────────────────────────────

exports.listOpenWorklist = async (req, res) => {
  try {
    const items = await make(req).listOpenForMember(req.user);
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.getWorklistItem = async (req, res) => {
  try {
    const doc = await make(req).getOneForMember(req.user, req.params.id);
    if (!doc) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, item: doc });
  } catch (err) { return handle(res, err); }
};

exports.requestToOpen = async (req, res) => {
  try {
    const svc = make(req);
    const sub = await svc.requestToOpen(req.user, req.params.id, req.body?.requestReason);
    const wl = await svc.worklist.findOne({ _id: sub.worklistId });
    if (wl) {
      sendIfEmail(req, req.user, emails.qaRequestReceived({
        name: req.user.fullName || req.user.username,
        topic: wl.title
      }, 'mk'));
    }
    return res.status(201).json({ success: true, submission: sub });
  } catch (err) { return handle(res, err); }
};

exports.listMineSubmissions = async (req, res) => {
  try {
    const items = await make(req).listMineSubmissions(req.user);
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.listMinePublished = async (req, res) => {
  try {
    const items = await make(req).listMinePublished(req.user);
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.getSubmission = async (req, res) => {
  try {
    const data = await make(req).getSubmissionForOwnerOrAdmin(req.user, req.params.id);
    if (!data) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, ...data });
  } catch (err) { return handle(res, err); }
};

exports.saveDraft = async (req, res) => {
  try {
    const doc = await make(req).saveDraft(req.user, req.params.id, req.body?.answers || []);
    return res.json({ success: true, submission: doc });
  } catch (err) { return handle(res, err); }
};

exports.submitForReview = async (req, res) => {
  try {
    const doc = await make(req).submitForReview(req.user, req.params.id);
    return res.json({ success: true, submission: doc });
  } catch (err) { return handle(res, err); }
};

exports.release = async (req, res) => {
  try {
    const doc = await make(req).release(req.user, req.params.id);
    return res.json({ success: true, submission: doc });
  } catch (err) { return handle(res, err); }
};

// ── admin endpoints ────────────────────────────────────────────────────────

exports.adminWorklistList = async (req, res) => {
  try {
    const items = await make(req).listWorklistForAdmin({ status: req.query.status });
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.adminWorklistCreate = async (req, res) => {
  try {
    const doc = await make(req).createWorklistItem(req.user, req.body || {});
    return res.status(201).json({ success: true, item: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminWorklistUpdate = async (req, res) => {
  try {
    const doc = await make(req).updateWorklistItem(req.user, req.params.id, req.body || {});
    return res.json({ success: true, item: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminWorklistArchive = async (req, res) => {
  try {
    const doc = await make(req).archiveWorklistItem(req.user, req.params.id);
    return res.json({ success: true, item: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminWorklistGet = async (req, res) => {
  try {
    const doc = await make(req).getWorklistForAdmin(req.params.id);
    if (!doc) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, item: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminSubmissionsList = async (req, res) => {
  try {
    const items = await make(req).listSubmissionsForAdmin({ status: req.query.status });
    return res.json({ success: true, items });
  } catch (err) { return handle(res, err); }
};

exports.adminSubmissionApproveRequest = async (req, res) => {
  try {
    const svc = make(req);
    const sub = await svc.approveRequest(req.user, req.params.id);
    const wl = await svc.worklist.findOne({ _id: sub.worklistId });
    const author = await loadAuthor(req, sub.authorId);
    if (author?.email && wl) {
      const deadline = wl.softDeadlineDays + ' дена';
      const link = `https://nexa.mk/terminal/topics-qa/answer/${sub._id}`;
      sendIfEmail(req, author, emails.qaRequestApproved({
        name: author.fullName || author.username,
        topic: wl.title,
        scope: wl.scope,
        deadline,
        link
      }, 'mk'));
    }
    return res.json({ success: true, submission: sub });
  } catch (err) { return handle(res, err); }
};

exports.adminSubmissionDecline = async (req, res) => {
  try {
    const doc = await make(req).declineRequest(req.user, req.params.id, req.body?.reason || '');
    return res.json({ success: true, submission: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminSubmissionReturn = async (req, res) => {
  try {
    const svc = make(req);
    const sub = await svc.returnForRevision(req.user, req.params.id, req.body?.editorialNotes);
    const wl = await svc.worklist.findOne({ _id: sub.worklistId });
    const author = await loadAuthor(req, sub.authorId);
    if (author?.email && wl) {
      const link = `https://nexa.mk/terminal/topics-qa/answer/${sub._id}`;
      sendIfEmail(req, author, emails.qaSubmissionReturned({
        name: author.fullName || author.username,
        topic: wl.title,
        editorialNotes: sub.editorialNotes,
        link
      }, 'mk'));
    }
    return res.json({ success: true, submission: sub });
  } catch (err) { return handle(res, err); }
};

exports.adminSubmissionAccept = async (req, res) => {
  try {
    const doc = await make(req).accept(req.user, req.params.id);
    return res.json({ success: true, submission: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminSubmissionReject = async (req, res) => {
  try {
    const doc = await make(req).reject(req.user, req.params.id, req.body?.editorialNotes);
    return res.json({ success: true, submission: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminSubmissionForceRelease = async (req, res) => {
  try {
    const doc = await make(req).forceRelease(req.user, req.params.id, req.body?.reason || '');
    return res.json({ success: true, submission: doc });
  } catch (err) { return handle(res, err); }
};

exports.adminSubmissionPublish = async (req, res) => {
  try {
    const { submission, page } = await make(req).publish(req.user, req.params.id);
    const author = await loadAuthor(req, submission.authorId);
    const wl = await make(req).worklist.findOne({ _id: submission.worklistId });
    if (author?.email && wl) {
      sendIfEmail(req, author, emails.qaSubmissionPublished({
        name: author.fullName || author.username,
        topic: wl.title,
        publicUrl: submission.publishedUrl
      }, 'mk'));
    }
    return res.json({ success: true, submission, page: { slug: page.slug, url: page.url } });
  } catch (err) { return handle(res, err); }
};

// ── public read ────────────────────────────────────────────────────────────

exports.publicPageBySlug = async (req, res) => {
  try {
    const page = await make(req).getPageBySlug(req.params.slug);
    if (!page) return res.status(404).json({ success: false });
    return res.json({ success: true, page });
  } catch (err) { return handle(res, err); }
};

// ── middleware ─────────────────────────────────────────────────────────────

exports.requireProOrAdmin = (req, res, next) => {
  // Topics Q&A is a Pro (B) feature; trial-with-Pro-intent can SEE the list too.
  const v = tierService.visibleTier(req.user);
  if (v === 'B' || v === 'ADMIN') return next();
  return res.status(403).json({ success: false, code: 'TIER_FORBIDDEN',
    message: 'Topics Q&A е достапно само за Про членови.' });
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, code: 'NOT_ADMIN', message: 'Admin only.' });
};
