/**
 * „Интервјуа" — owner side (authenticated).
 *
 * An employer creates an interview (scan = candidate soft-skill screen, exit =
 * departing-employee exit interview), edits the suggested questions, gets a
 * shareable link, and — once answered — sees the transcript + AI summary. All ops
 * are scoped to req.user._id. Feature access is enforced by the route-level
 * subscriptionGuard; both Basic (A) and Pro (B) owners may use it.
 *
 * The FINALIZED question list is stored on each interview, so editing the static
 * banks (data/interviewQuestions.js) never mutates already-created interviews.
 * Owners may also persist a reusable default template per type.
 */
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const emailService = require('../services/emailService');
const { inviteEmailHtml } = require('../services/interviewEmail');
const { suggest, MAX_QUESTIONS } = require('../data/interviewQuestions');

const COLLECTION = 'hr_interviews';
const TEMPLATES = 'hr_interview_templates';
const col = (req) => req.app.locals.db.collection(COLLECTION);
const tpl = (req) => req.app.locals.db.collection(TEMPLATES);
const uid = (req) => String(req.user._id || req.user.id);
const clientBase = () => (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
const linkFor = (token) => `${clientBase()}/interview/${token}`;

const clip = (s, n) => (s == null ? '' : String(s).trim().slice(0, n));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TYPES = ['scan', 'exit'];
const normType = (t) => (TYPES.includes(t) ? t : 'scan');

// Sanitize a client-supplied question list into stored shape. Drops blanks,
// clamps count, ensures kind ∈ {text,rating} and unique non-empty ids.
function cleanQuestions(input) {
  if (!Array.isArray(input)) return null;
  const seen = new Set();
  const out = [];
  for (const q of input) {
    const text = clip(q?.text, 400);
    if (!text) continue;
    let id = clip(q?.id, 60).replace(/[^\w-]/g, '');
    if (!id || seen.has(id)) id = 'q_' + crypto.randomBytes(4).toString('hex');
    seen.add(id);
    out.push({ id, text, kind: q?.kind === 'rating' ? 'rating' : 'text' });
    if (out.length >= MAX_QUESTIONS) break;
  }
  return out.length ? out : null;
}

// Owner-facing shape.
function present(doc) {
  return {
    id: doc._id.toString(),
    token: doc.token,
    link: linkFor(doc.token),
    type: doc.type,
    subjectName: doc.subjectName,
    role: doc.role || '',
    inviteEmail: doc.inviteEmail || '',
    note: doc.note || '',
    questions: doc.questions || [],
    status: doc.status,
    answers: doc.status === 'completed' ? (doc.answers || {}) : undefined,
    aiSummary: doc.status === 'completed' ? (doc.aiSummary || null) : undefined,
    createdAt: doc.createdAt,
    invitedAt: doc.invitedAt || null,
    completedAt: doc.completedAt || null,
    resultsEmailedTo: doc.resultsEmailedTo || null,
    resultsEmailedAt: doc.resultsEmailedAt || null,
  };
}

async function sendInvite(req, doc) {
  if (!doc.inviteEmail) return false;
  const companyName = req.user.companyInfo?.companyName || req.user.username || '';
  try {
    await emailService.sendEmail(
      doc.inviteEmail,
      doc.type === 'exit' ? 'Покана за излезно интервју' : 'Покана за интервју',
      inviteEmailHtml({
        type: doc.type, companyName, subjectName: doc.subjectName,
        link: linkFor(doc.token), count: (doc.questions || []).length,
      })
    );
    return true;
  } catch (e) {
    console.error('[hrInterview] invite email failed:', e.message);
    return false;
  }
}

// GET /suggest?type=&role=  — suggested (editable) questions. Prefills from the
// owner's saved default for this type if one exists, else the static bank.
exports.suggest = async (req, res) => {
  try {
    const type = normType(req.query.type);
    const role = clip(req.query.role, 120);
    const saved = await tpl(req).findOne({ ownerId: uid(req), type });
    const questions = saved?.questions?.length
      ? saved.questions
      : suggest({ type, industry: req.user.companyInfo?.industry, role });
    return res.json({ success: true, questions, fromTemplate: !!saved });
  } catch (err) {
    console.error('[hrInterview] suggest error:', err);
    return res.status(500).json({ success: false });
  }
};

// GET /template?type=  — owner's saved default template for a type (or null).
exports.getTemplate = async (req, res) => {
  try {
    const type = normType(req.query.type);
    const saved = await tpl(req).findOne({ ownerId: uid(req), type });
    return res.json({ success: true, questions: saved?.questions || null });
  } catch (err) {
    console.error('[hrInterview] getTemplate error:', err);
    return res.status(500).json({ success: false });
  }
};

// PUT /template  — save/replace the owner's default template for a type.
exports.putTemplate = async (req, res) => {
  try {
    const type = normType(req.body?.type);
    const questions = cleanQuestions(req.body?.questions);
    if (!questions) {
      return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Внесете барем едно прашање.' });
    }
    await tpl(req).updateOne(
      { ownerId: uid(req), type },
      { $set: { questions, updatedAt: new Date() }, $setOnInsert: { ownerId: uid(req), type } },
      { upsert: true }
    );
    return res.json({ success: true, questions });
  } catch (err) {
    console.error('[hrInterview] putTemplate error:', err);
    return res.status(500).json({ success: false });
  }
};

// GET /  — the owner's interviews (optionally filtered by ?type=), newest first.
exports.list = async (req, res) => {
  try {
    const filter = { ownerId: uid(req) };
    if (TYPES.includes(req.query.type)) filter.type = req.query.type;
    const items = await col(req).find(filter).sort({ createdAt: -1 }).toArray();
    return res.json({ success: true, items: items.map(present) });
  } catch (err) {
    console.error('[hrInterview] list error:', err);
    return res.status(500).json({ success: false });
  }
};

// POST /  — create + (optionally) email the link.
exports.create = async (req, res) => {
  try {
    const type = normType(req.body?.type);
    const subjectName = clip(req.body?.subjectName, 120);
    if (!subjectName) {
      return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Внесете име.' });
    }
    const inviteEmail = clip(req.body?.inviteEmail, 160).toLowerCase();
    if (inviteEmail && !EMAIL_RE.test(inviteEmail)) {
      return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Невалидна е-пошта.' });
    }
    const role = clip(req.body?.role, 120);
    // Use the edited questions from the client; fall back to a fresh suggestion.
    const questions = cleanQuestions(req.body?.questions)
      || suggest({ type, industry: req.user.companyInfo?.industry, role });

    const now = new Date();
    const doc = {
      token: crypto.randomBytes(16).toString('hex'),
      ownerId: uid(req),
      ownerEmail: clip(req.user.email || req.user.username, 240).toLowerCase(),
      companyName: req.user.companyInfo?.companyName || req.user.username || '',
      type,
      subjectName,
      role,
      inviteEmail,
      note: clip(req.body?.note, 500),
      questions,
      status: 'pending',
      module: 'interview_v1',
      answers: null,
      aiSummary: null,
      createdAt: now,
      invitedAt: null,
      completedAt: null,
    };
    const emailed = inviteEmail ? await sendInvite(req, doc) : false;
    if (emailed) doc.invitedAt = now;
    const r = await col(req).insertOne(doc);
    doc._id = r.insertedId;
    return res.status(201).json({ success: true, item: present(doc), emailed });
  } catch (err) {
    console.error('[hrInterview] create error:', err);
    return res.status(500).json({ success: false });
  }
};

// GET /:id — one owned interview (with transcript + summary if completed).
exports.get = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const doc = await col(req).findOne({ _id: new ObjectId(req.params.id), ownerId: uid(req) });
    if (!doc) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, item: present(doc) });
  } catch (err) {
    console.error('[hrInterview] get error:', err);
    return res.status(500).json({ success: false });
  }
};

// POST /:id/resend — re-send (or first-send) the invite email.
exports.resendInvite = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const email = clip(req.body?.inviteEmail, 160).toLowerCase();
    const _id = new ObjectId(req.params.id);
    const doc = await col(req).findOne({ _id, ownerId: uid(req) });
    if (!doc) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    const target = email || doc.inviteEmail;
    if (!target || !EMAIL_RE.test(target)) {
      return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Невалидна е-пошта.' });
    }
    const emailed = await sendInvite(req, { ...doc, inviteEmail: target });
    if (emailed) {
      await col(req).updateOne({ _id }, { $set: { inviteEmail: target, invitedAt: new Date() } });
    }
    return res.json({ success: emailed, emailed });
  } catch (err) {
    console.error('[hrInterview] resend error:', err);
    return res.status(500).json({ success: false });
  }
};

// DELETE /:id
exports.remove = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const r = await col(req).deleteOne({ _id: new ObjectId(req.params.id), ownerId: uid(req) });
    if (!r.deletedCount) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true });
  } catch (err) {
    console.error('[hrInterview] remove error:', err);
    return res.status(500).json({ success: false });
  }
};
