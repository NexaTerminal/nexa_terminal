// „Проценка на карактер" — public respondent funnel (no auth).
//
// Mounted BEFORE CSRF in server.js (same posture as publicScreening / employer-badge):
// a candidate/employee opens their link, reads statement texts, submits answers.
// Scoring happens strictly server-side; the browser never receives any scoring keys.
// The respondent sees only a thank-you — the full profile is owner-only.
//
//   GET  /questions      → statement texts (fixed order; id + trait + left/right)
//   GET  /:token         → assessment meta (company, candidate, status)
//   POST /:token/submit  → validate + score + mark completed (idempotent-guarded)

const express = require('express');
const {
  publicQuestions, cleanAnswers, isComplete, score,
} = require('../data/characterAssessmentQuestions');
const emailService = require('../services/emailService');
const { resultsEmailHtml } = require('../services/characterEmail');

const router = express.Router();
const COLLECTION = 'character_assessments';
const col = (req) => req.app.locals.db.collection(COLLECTION);
const TOKEN_RE = /^[a-f0-9]{32}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email the scored results to `to`. Best-effort; records who/when on the doc.
async function emailResults(req, doc, to) {
  if (!to || !EMAIL_RE.test(to)) return false;
  const { ranked, overall } = score(doc.answers || {});
  try {
    await emailService.sendEmail(
      to,
      'Вашите резултати · Проценка на карактер',
      resultsEmailHtml({ ranked, overall, candidateName: doc.candidateName, companyName: doc.companyName, self: true })
    );
    await col(req).updateOne(
      { token: doc.token },
      { $set: { resultsEmailedTo: to, resultsEmailedAt: new Date() } }
    );
    return true;
  } catch (e) {
    console.error('[publicCharacterAssessment] results email failed:', e.message);
    return false;
  }
}

router.get('/questions', (req, res) => {
  res.json({ success: true, data: publicQuestions() });
});

// Public meta for the intro screen. Never leaks answers/scores.
router.get('/:token', async (req, res) => {
  try {
    if (!TOKEN_RE.test(req.params.token)) return res.status(404).json({ success: false, status: 'notfound' });
    const doc = await col(req).findOne({ token: req.params.token });
    if (!doc) return res.status(404).json({ success: false, status: 'notfound' });
    res.json({
      success: true,
      status: doc.status, // pending | completed
      data: {
        companyName: doc.companyName || '',
        candidateName: doc.candidateName || '',
        role: doc.role || '',
      },
    });
  } catch (err) {
    console.error('[publicCharacterAssessment] meta error:', err);
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
      return res.status(409).json({ success: false, status: 'completed', message: 'Оваа проценка е веќе одговорена.' });
    }

    const answers = cleanAnswers(req.body?.answers || {});
    if (!isComplete(answers)) {
      return res.status(400).json({ success: false, message: 'Одговорете на повеќето прашања за веродостоен резултат.' });
    }

    const { scores } = score(answers);
    const now = new Date();
    // Guard against a double-submit race: only the first submit wins.
    const r = await col(req).updateOne(
      { token: req.params.token, status: 'pending' },
      { $set: { answers, scores, status: 'completed', completedAt: now } }
    );
    if (r.modifiedCount === 0) {
      return res.status(409).json({ success: false, status: 'completed', message: 'Оваа проценка е веќе одговорена.' });
    }

    // Auto-send results to the invited employee, and/or to an address the
    // respondent typed on the finish screen. Never blocks the response on email.
    const completed = { ...doc, answers, status: 'completed' };
    const respondentEmail = String(req.body?.email || '').trim().toLowerCase();
    let emailedToInvite = false;
    let emailedToSelf = false;
    if (doc.inviteEmail) emailedToInvite = await emailResults(req, completed, doc.inviteEmail);
    if (respondentEmail && respondentEmail !== doc.inviteEmail && EMAIL_RE.test(respondentEmail)) {
      emailedToSelf = await emailResults(req, completed, respondentEmail);
    }
    res.json({ success: true, emailedToInvite, emailedToSelf });
  } catch (err) {
    console.error('[publicCharacterAssessment] submit error:', err);
    res.status(500).json({ success: false });
  }
});

// Opt-in from the thank-you screen: a link-shared respondent asks for their own
// copy of the results. Only works once the assessment is completed.
router.post('/:token/email-results', async (req, res) => {
  try {
    if (!TOKEN_RE.test(req.params.token)) return res.status(404).json({ success: false });
    const to = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(to)) return res.status(400).json({ success: false, message: 'Невалидна е-пошта.' });
    const doc = await col(req).findOne({ token: req.params.token });
    if (!doc) return res.status(404).json({ success: false });
    if (doc.status !== 'completed') return res.status(409).json({ success: false, message: 'Проценката сè уште не е завршена.' });
    const ok = await emailResults(req, doc, to);
    return res.json({ success: ok });
  } catch (err) {
    console.error('[publicCharacterAssessment] email-results error:', err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
