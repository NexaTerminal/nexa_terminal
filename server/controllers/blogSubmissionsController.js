/**
 * Controllers for the blog-submission workflow (Nexa 3.0 §6).
 *
 * Member endpoints: list/create/update/get + submit/retry.
 * Admin endpoints: list/accept/return/reject/publish.
 *
 * Auth + tier gating: routes layer applies authenticateJWT and (for member
 * endpoints) `requireSubmitBlog`. Admin endpoints check req.user.role.
 */

const BlogSubmissionsService = require('../services/blogSubmissionsService');
const tierService = require('../services/tierService');
const emailTemplates = require('../emails/blogSubmissionEmails');

const makeService = (req) => new BlogSubmissionsService(req.app.locals.db);

const handleErr = (res, err, defaultStatus = 500) => {
  const codeMap = {
    INVALID_USER:      400,
    INVALID_ID:        400,
    INCOMPLETE:        400,
    NOTES_REQUIRED:    400,
    NOT_EDITABLE:      400,
    NOT_SUBMITTABLE:   400,
    INVALID_TRANSITION:400,
    TIER_FORBIDDEN:    403,
    FORBIDDEN:         403,
    NOT_FOUND:         404,
    QUOTA_EXCEEDED:    409
  };
  const status = codeMap[err.code] || defaultStatus;
  return res.status(status).json({ success: false, code: err.code || 'ERROR', message: err.message });
};

// ── helpers for sending the lifecycle emails ────────────────────────────────
async function sendIfEmail(req, user, template) {
  const email = user?.email;
  if (!email) return;
  try {
    const svc = req.app.locals.emailService;
    if (!svc?.send) return;
    await svc.send({ to: email, subject: template.subject, html: template.html });
  } catch (e) {
    console.warn('[blog-submissions] email send failed:', e.message);
  }
}

async function loadAuthor(req, authorId) {
  try {
    return await req.app.locals.db.collection('users').findOne(
      { _id: authorId },
      { projection: { email: 1, username: 1, fullName: 1 } }
    );
  } catch { return null; }
}

// ── member endpoints ────────────────────────────────────────────────────────

exports.listMine = async (req, res) => {
  try {
    const items = await makeService(req).listMine(req.user);
    return res.json({ success: true, items });
  } catch (err) { return handleErr(res, err); }
};

exports.listMyPublished = async (req, res) => {
  try {
    const items = await makeService(req).listMyPublished(req.user);
    return res.json({ success: true, items });
  } catch (err) { return handleErr(res, err); }
};

exports.getOne = async (req, res) => {
  try {
    const doc = await makeService(req).getOne(req.user, req.params.id);
    if (!doc) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

exports.create = async (req, res) => {
  try {
    const doc = await makeService(req).createDraft(req.user, req.body || {});
    return res.status(201).json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

exports.update = async (req, res) => {
  try {
    const doc = await makeService(req).updateDraft(req.user, req.params.id, req.body || {});
    return res.json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

exports.submit = async (req, res) => {
  try {
    const svc = makeService(req);
    const doc = await svc.submit(req.user, req.params.id);
    // Fire-and-forget acknowledgement email
    if (!doc._escalated) {
      const t = emailTemplates.blogSubmissionReceived({
        name: req.user.fullName || req.user.username,
        title: doc.title,
        pass: doc.aiVerdict?.pass === true,
        issuesCount: doc.aiVerdict?.issues?.length || 0
      }, 'mk');
      sendIfEmail(req, req.user, t);
    }
    return res.json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

// Retry = same as submit when status is ai_failed. Kept as a separate
// endpoint so the frontend semantics are clear.
exports.retry = async (req, res) => {
  try {
    const doc = await makeService(req).submit(req.user, req.params.id);
    return res.json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

// ── admin endpoints ─────────────────────────────────────────────────────────

exports.adminList = async (req, res) => {
  try {
    const { status, page, perPage } = req.query;
    const result = await makeService(req).listForAdmin({
      status: status || null,
      page: Number(page) || 1,
      perPage: Math.min(100, Number(perPage) || 30)
    });
    return res.json({ success: true, ...result });
  } catch (err) { return handleErr(res, err); }
};

exports.adminGetOne = async (req, res) => {
  try {
    // Admin can see any submission; reuse the service getOne with req.user.role='admin' bypass.
    const doc = await makeService(req).getOne(req.user, req.params.id);
    if (!doc) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

exports.adminAccept = async (req, res) => {
  try {
    const svc = makeService(req);
    const doc = await svc.adminAccept(req.user, req.params.id);
    const author = await loadAuthor(req, doc.authorId);
    if (author?.email) {
      const t = emailTemplates.blogAcceptedScheduled({
        name: author.fullName || author.username,
        title: doc.title,
        newsletterMonth: doc.newsletterMonth,
        publicUrl: null
      }, 'mk');
      sendIfEmail(req, author, t);
    }
    return res.json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

exports.adminReturn = async (req, res) => {
  try {
    const notes = req.body?.editorialNotes;
    const svc = makeService(req);
    const doc = await svc.adminReturn(req.user, req.params.id, notes);
    const author = await loadAuthor(req, doc.authorId);
    if (author?.email) {
      const t = emailTemplates.blogReturnedForRevision({
        name: author.fullName || author.username,
        title: doc.title,
        editorialNotes: doc.editorialNotes
      }, 'mk');
      sendIfEmail(req, author, t);
    }
    return res.json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

exports.adminReject = async (req, res) => {
  try {
    const notes = req.body?.editorialNotes;
    const doc = await makeService(req).adminReject(req.user, req.params.id, notes);
    return res.json({ success: true, submission: doc });
  } catch (err) { return handleErr(res, err); }
};

exports.adminPublish = async (req, res) => {
  try {
    const { submission, blog } = await makeService(req).adminPublish(req.user, req.params.id);
    return res.json({ success: true, submission, blog: { _id: blog._id, slug: blog.slug } });
  } catch (err) { return handleErr(res, err); }
};

// ── middleware ──────────────────────────────────────────────────────────────
// Member endpoints require visibleTier B/C/ADMIN. Trial users see the form
// but cannot submit; this gate runs on the action endpoints, not on draft
// updates so revisions during trial don't block.

exports.requireBcOrAdmin = (req, res, next) => {
  const t = tierService.effectiveTier(req.user);
  if (t === 'B' || t === 'C' || t === 'ADMIN') return next();
  return res.status(403).json({ success: false, code: 'TIER_FORBIDDEN',
    message: 'Поднесувањето на прилози е достапно само за Nexa Мрежа корисници.' });
};

exports.requireSubmitAllowed = (req, res, next) => {
  const check = tierService.canSubmitBlog(req.user);
  if (check.allowed) return next();
  const code = check.reason === 'trial' ? 'TRIAL_LOCKED' : 'TIER_FORBIDDEN';
  const message = check.reason === 'trial'
    ? 'Поднесувањето на прилози е достапно по активирање на платена претплата.'
    : 'Поднесувањето на прилози е достапно само за Nexa Мрежа корисници.';
  return res.status(403).json({ success: false, code, message });
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, code: 'NOT_ADMIN', message: 'Admin only.' });
};
