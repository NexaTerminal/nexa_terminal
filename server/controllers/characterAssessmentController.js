/**
 * „Проценка на карактер" — owner side (authenticated).
 *
 * An employer creates a named assessment (candidate + optional role/email), gets a
 * shareable public link, and — once the candidate answers — sees a full Big Five
 * profile report. All ops are scoped to req.user._id. Feature access is enforced by
 * the route-level subscriptionGuard; both Basic (A) and Pro (B) owners may use it.
 *
 * Report scoring lives in data/characterAssessmentQuestions.js and only ever runs
 * server-side (also on the public submit path).
 */
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const emailService = require('../services/emailService');
const { score, DISCLAIMER } = require('../data/characterAssessmentQuestions');

const COLLECTION = 'character_assessments';
const col = (req) => req.app.locals.db.collection(COLLECTION);
const uid = (req) => String(req.user._id || req.user.id);
const clientBase = () => (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
const linkFor = (token) => `${clientBase()}/karakter/${token}`;

const clip = (s, n) => (s == null ? '' : String(s).trim().slice(0, n));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Owner-facing shape. Includes the computed report only when completed.
function present(doc) {
  const base = {
    id: doc._id.toString(),
    token: doc.token,
    link: linkFor(doc.token),
    candidateName: doc.candidateName,
    role: doc.role || '',
    inviteEmail: doc.inviteEmail || '',
    note: doc.note || '',
    status: doc.status,
    createdAt: doc.createdAt,
    invitedAt: doc.invitedAt || null,
    completedAt: doc.completedAt || null,
  };
  if (doc.status === 'completed' && doc.scores) {
    base.scores = doc.scores;
    base.report = score(doc.answers || {}).report;
    base.disclaimer = DISCLAIMER;
  }
  return base;
}

function inviteEmailHtml({ companyName, candidateName, link }) {
  const who = companyName || 'работодавач';
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0B1220;">
    <h2 style="color:#1e4db7;margin:0 0 12px;">Покана за проценка на карактер</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155;">
      Здраво${candidateName ? ' ' + candidateName : ''},<br/><br/>
      <strong>${who}</strong> Ве покани да пополните кратка проценка на личноста (модел „Големите пет“).
      Прашалникот има 25 кратки прашања и трае околу 5 минути. Нема точни или погрешни одговори —
      одговарајте искрено.
    </p>
    <p style="text-align:center;margin:26px 0;">
      <a href="${link}" style="display:inline-block;background:#1e4db7;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
        Започни ја проценката
      </a>
    </p>
    <p style="font-size:12.5px;color:#64748b;line-height:1.5;">
      Ако копчето не работи, копирајте го линкот: <br/>
      <a href="${link}" style="color:#1e4db7;">${link}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0;" />
    <p style="font-size:11.5px;color:#94a3b8;line-height:1.5;">
      Ова е индикативна самопроценка и не претставува клиничка дијагноза. — Nexa Terminal
    </p>
  </div>`;
}

async function sendInvite(req, doc) {
  if (!doc.inviteEmail) return false;
  const companyName = req.user.companyInfo?.companyName || req.user.username || '';
  try {
    await emailService.sendEmail(
      doc.inviteEmail,
      'Покана за проценка на карактер',
      inviteEmailHtml({ companyName, candidateName: doc.candidateName, link: linkFor(doc.token) })
    );
    return true;
  } catch (e) {
    console.error('[characterAssessment] invite email failed:', e.message);
    return false;
  }
}

// GET /  — the owner's assessments (newest first).
exports.list = async (req, res) => {
  try {
    const items = await col(req).find({ ownerId: uid(req) }).sort({ createdAt: -1 }).toArray();
    return res.json({ success: true, items: items.map(present) });
  } catch (err) {
    console.error('[characterAssessment] list error:', err);
    return res.status(500).json({ success: false });
  }
};

// POST /  — create + (optionally) email the link.
exports.create = async (req, res) => {
  try {
    const candidateName = clip(req.body?.candidateName, 120);
    if (!candidateName) {
      return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Внесете име за проценката.' });
    }
    const inviteEmail = clip(req.body?.inviteEmail, 160).toLowerCase();
    if (inviteEmail && !EMAIL_RE.test(inviteEmail)) {
      return res.status(400).json({ success: false, code: 'INVALID_INPUT', message: 'Невалидна е-пошта.' });
    }
    const now = new Date();
    const doc = {
      token: crypto.randomBytes(16).toString('hex'),
      ownerId: uid(req),
      companyName: req.user.companyInfo?.companyName || req.user.username || '',
      candidateName,
      role: clip(req.body?.role, 120),
      inviteEmail,
      note: clip(req.body?.note, 500),
      status: 'pending',
      module: 'bigfive_v1',
      answers: null,
      scores: null,
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
    console.error('[characterAssessment] create error:', err);
    return res.status(500).json({ success: false });
  }
};

// GET /:id — one owned assessment (with report if completed).
exports.get = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const doc = await col(req).findOne({ _id: new ObjectId(req.params.id), ownerId: uid(req) });
    if (!doc) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    return res.json({ success: true, item: present(doc) });
  } catch (err) {
    console.error('[characterAssessment] get error:', err);
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
    console.error('[characterAssessment] resend error:', err);
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
    console.error('[characterAssessment] remove error:', err);
    return res.status(500).json({ success: false });
  }
};
