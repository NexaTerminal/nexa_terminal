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

const router = express.Router();
const COLLECTION = 'character_assessments';
const col = (req) => req.app.locals.db.collection(COLLECTION);
const TOKEN_RE = /^[a-f0-9]{32}$/i;

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
    res.json({ success: true });
  } catch (err) {
    console.error('[publicCharacterAssessment] submit error:', err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
