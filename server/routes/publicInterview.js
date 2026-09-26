// „Интервјуа" — public respondent funnel (no auth).
//
// Mounted BEFORE CSRF in server.js (same posture as publicCharacterAssessment):
// a candidate / departing employee opens their link, answers the stored questions,
// and submits. Answers are stored, an AI summary is generated best-effort, and the
// OWNER is emailed the transcript. The respondent only sees a thank-you.
//
//   GET  /:token         → meta + the interview's stored questions
//   POST /:token/submit   → validate + store + summarize + notify owner (idempotent)

const express = require('express');
const emailService = require('../services/emailService');
const { ownerResultsHtml } = require('../services/interviewEmail');
const { summarize } = require('../services/interviewSummary');

const router = express.Router();
const COLLECTION = 'hr_interviews';
const col = (req) => req.app.locals.db.collection(COLLECTION);
const TOKEN_RE = /^[a-f0-9]{32}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clientBase = () => (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

// Keep only answers to known question ids, in the right shape (rating→1..5 int,
// text→trimmed string ≤4000). Silently drops unknown/blank entries.
function cleanAnswers(questions = [], raw = {}) {
  const out = {};
  for (const q of questions) {
    const v = raw[q.id];
    if (v == null) continue;
    if (q.kind === 'rating') {
      const n = Math.round(Number(v));
      if (Number.isFinite(n) && n >= 1 && n <= 5) out[q.id] = n;
    } else {
      const s = String(v).trim().slice(0, 4000);
      if (s) out[q.id] = s;
    }
  }
  return out;
}

// Require a reasonable completion: at least half the questions answered.
function isComplete(questions = [], answers = {}) {
  if (!questions.length) return false;
  const answered = questions.filter((q) => answers[q.id] != null).length;
  return answered >= Math.ceil(questions.length / 2);
}

// Public meta + questions for the respondent page. Never leaks answers/summary.
router.get('/:token', async (req, res) => {
  try {
    if (!TOKEN_RE.test(req.params.token)) return res.status(404).json({ success: false, status: 'notfound' });
    const doc = await col(req).findOne({ token: req.params.token });
    if (!doc) return res.status(404).json({ success: false, status: 'notfound' });
    res.json({
      success: true,
      status: doc.status, // pending | completed
      data: {
        type: doc.type,
        companyName: doc.companyName || '',
        subjectName: doc.subjectName || '',
        role: doc.role || '',
        questions: (doc.questions || []).map((q) => ({ id: q.id, text: q.text, kind: q.kind })),
      },
    });
  } catch (err) {
    console.error('[publicInterview] meta error:', err);
    res.status(500).json({ success: false });
  }
});

router.post('/:token/submit', async (req, res) => {
  try {
    if (!TOKEN_RE.test(req.params.token)) return res.status(404).json({ success: false, status: 'notfound' });
    if (req.body?.website) return res.status(400).json({ success: false }); // honeypot

    const doc = await col(req).findOne({ token: req.params.token });
    if (!doc) return res.status(404).json({ success: false, status: 'notfound' });
    if (doc.status === 'completed') {
      return res.status(409).json({ success: false, status: 'completed', message: 'Ова интервју е веќе одговорено.' });
    }

    const answers = cleanAnswers(doc.questions || [], req.body?.answers || {});
    if (!isComplete(doc.questions || [], answers)) {
      return res.status(400).json({ success: false, message: 'Одговорете на повеќето прашања.' });
    }

    const now = new Date();
    // Guard against a double-submit race: only the first submit wins.
    const r = await col(req).updateOne(
      { token: req.params.token, status: 'pending' },
      { $set: { answers, status: 'completed', completedAt: now } }
    );
    if (r.modifiedCount === 0) {
      return res.status(409).json({ success: false, status: 'completed', message: 'Ова интервју е веќе одговорено.' });
    }

    // Best-effort AI summary — never blocks the respondent's success response.
    const aiSummary = await summarize({ type: doc.type, questions: doc.questions || [], answers });
    if (aiSummary) await col(req).updateOne({ token: req.params.token }, { $set: { aiSummary } });

    // Notify the owner (transcript + summary). Owner email is stored on the doc.
    try {
      const ownerEmail = doc.ownerEmail;
      if (ownerEmail && EMAIL_RE.test(ownerEmail)) {
        await emailService.sendEmail(
          ownerEmail,
          `${doc.type === 'exit' ? 'Излезно интервју' : 'Интервју'} · пополнето — ${doc.subjectName || ''}`.trim(),
          ownerResultsHtml({
            type: doc.type, subjectName: doc.subjectName, role: doc.role,
            companyName: doc.companyName, questions: doc.questions || [], answers,
            aiSummary, link: `${clientBase()}/terminal/interviews/${doc.type === 'exit' ? 'exit' : 'scan'}`,
          })
        );
        await col(req).updateOne(
          { token: req.params.token },
          { $set: { resultsEmailedTo: ownerEmail, resultsEmailedAt: new Date() } }
        );
      }
    } catch (e) {
      console.error('[publicInterview] owner notify failed:', e.message);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[publicInterview] submit error:', err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
