// Public „Проверен работодавач" badge funnel + verify/asset endpoints.
//
// Mounted BEFORE CSRF in server.js (no auth — public acquisition funnel), same
// posture as publicScreening. Evaluation is strictly server-side. A badge is
// ISSUED only after signup (claim) and only when score ≥ BADGE_MIN_SCORE.
//
//   GET  /questions                 → question texts (shuffled)
//   POST /submit                    → evaluate + store check → result (+resultId, rating teaser)
//   GET  /result/:id                → re-fetch result (pickup after signup)
//   POST /result/:id/claim          → (JWT) issue/refresh the badge, link to user
//   GET  /verify/:token             → public badge data for the verify page
//   GET  /verify/:token/image.svg   → dynamic circular seal
//   GET  /verify/:token/certificate.svg → dynamic certificate

const express = require('express');
const { ObjectId } = require('mongodb');
const { questions } = require('../data/employerBadgeQuestions');
const { authenticateJWT } = require('../middleware/auth');
const badge = require('../services/badgeService');

const router = express.Router();
const CHECKS = 'employer_badge_checks';
const BADGES = 'badges';
const MODULE = 'employment';
const BADGE_TTL_DAYS = 365;

const SEVERITY_RANK = { high: 0, medium: 1, advisory: 2 };
const VALID_ANSWERS = new Set(['yes', 'no', 'na']);

function evaluate(answers) {
  let score = 0, maxScore = 0;
  const gaps = [];
  questions.forEach((q) => {
    const a = answers[q.id];
    if (!a || a === 'na') return;
    maxScore += q.weight;
    if (a === q.correctAnswer) score += q.weight;
    else gaps.push({ id: q.id, gapTitle: q.gapTitle, article: q.article, severity: q.severity, risk: q.risk, fix: q.fix, weight: q.weight });
  });
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  gaps.sort((a, b) => (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) || (b.weight - a.weight));
  const rating = badge.ratingForScore(percentage);
  return {
    percentage,
    eligible: !!rating,
    ratingTier: rating ? rating.tier : null,
    ratingLabel: rating ? rating.label : null,
    answeredCount: Object.keys(answers).filter((k) => VALID_ANSWERS.has(answers[k])).length,
    gapCount: gaps.length,
    topGaps: gaps.slice(0, 3).map(({ weight, ...g }) => g),
  };
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function publicResult(doc) {
  return {
    id: doc._id.toString(),
    percentage: doc.result.percentage,
    eligible: doc.result.eligible,
    ratingTier: doc.result.ratingTier,
    ratingLabel: doc.result.ratingLabel,
    gapCount: doc.result.gapCount,
    topGaps: doc.result.topGaps,
    claimed: !!doc.badgeToken,
    badgeToken: doc.badgeToken || null,
  };
}

router.get('/questions', (req, res) => {
  res.json({ success: true, data: shuffled(questions).map(({ id, text, article, example }) => ({ id, text, article, example })) });
});

router.post('/submit', async (req, res) => {
  try {
    const { answers, companyName, website } = req.body || {};
    if (website) return res.status(400).json({ success: false }); // honeypot
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, message: 'Недостасуваат одговори.' });
    }
    const knownIds = new Set(questions.map((q) => q.id));
    const clean = {};
    for (const [k, v] of Object.entries(answers)) if (knownIds.has(k) && VALID_ANSWERS.has(v)) clean[k] = v;
    if (Object.keys(clean).length < Math.ceil(questions.length * 0.6)) {
      return res.status(400).json({ success: false, message: 'Одговорете на повеќето прашања за веродостоен резултат.' });
    }

    const result = evaluate(clean);
    const db = req.app.locals.db;
    const doc = {
      module: MODULE,
      answers: clean,
      result,
      companyName: (companyName || '').toString().trim().slice(0, 160) || null,
      source: (req.query.src || '').toString().slice(0, 60) || null,
      registeredUserId: null,
      badgeToken: null,
      createdAt: new Date(),
    };
    const inserted = await db.collection(CHECKS).insertOne(doc);
    doc._id = inserted.insertedId;
    res.json({ success: true, data: publicResult(doc) });
  } catch (err) {
    console.error('Employer badge submit error:', err);
    res.status(500).json({ success: false, message: 'Грешка при пресметување на резултатот.' });
  }
});

router.get('/result/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const db = req.app.locals.db;
    const doc = await db.collection(CHECKS).findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ success: false });
    res.json({ success: true, data: publicResult(doc) });
  } catch (err) {
    console.error('Employer badge result error:', err);
    res.status(500).json({ success: false });
  }
});

// Claim: after Google signup, issue (or refresh) the badge and link the check.
router.post('/result/:id/claim', authenticateJWT, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ success: false });
    const db = req.app.locals.db;
    const _id = new ObjectId(req.params.id);
    const check = await db.collection(CHECKS).findOne({ _id });
    if (!check) return res.status(404).json({ success: false });

    if (!check.result.eligible) {
      return res.json({ success: true, eligible: false, message: 'Резултатот е под прагот за значка.' });
    }

    const userId = req.user._id || req.user.id;
    const companyName = req.user.companyInfo?.companyName || check.companyName || 'Вашата компанија';
    const verified = !!req.user.isVerified;

    // One active badge per user+module: reuse its token so the verify URL is stable.
    const existing = await db.collection(BADGES).findOne({ userId, module: MODULE, revoked: { $ne: true } });
    const token = existing?.token || badge.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + BADGE_TTL_DAYS * 864e5);

    const badgeDoc = {
      token, userId, module: MODULE, assessmentCheckId: _id,
      companyName, verified,
      score: check.result.percentage,
      ratingTier: check.result.ratingTier,
      ratingLabel: check.result.ratingLabel,
      issuedAt: existing?.issuedAt || now,
      renewedAt: now,
      expiresAt,
      revoked: false,
      source: check.source || null,
    };
    await db.collection(BADGES).updateOne({ token }, { $set: badgeDoc }, { upsert: true });
    await db.collection(CHECKS).updateOne(
      { _id, registeredUserId: { $in: [null, undefined] } },
      { $set: { registeredUserId: userId, badgeToken: token, claimedAt: now } }
    );

    res.json({ success: true, eligible: true, token, ratingTier: badgeDoc.ratingTier });
  } catch (err) {
    console.error('Employer badge claim error:', err);
    res.status(500).json({ success: false });
  }
});

// The signed-in user's own badge (to re-open / re-share it from the terminal).
router.get('/mine', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id || req.user.id;
    const b = await db.collection(BADGES).findOne({ userId, module: MODULE, revoked: { $ne: true } });
    if (!b) return res.json({ success: true, badge: null });
    res.json({
      success: true,
      badge: {
        token: b.token,
        ratingTier: b.ratingTier,
        ratingLabel: b.ratingLabel,
        companyName: b.companyName,
        verified: !!b.verified,
        issuedAt: b.issuedAt,
        expiresAt: b.expiresAt,
        status: badgeStatus(b),
      },
    });
  } catch (err) {
    console.error('Employer badge /mine error:', err);
    res.status(500).json({ success: false });
  }
});

// ── Public verify + assets ───────────────────────────────────────────────
async function loadBadge(db, token) {
  if (!token || !/^[a-f0-9]{16,64}$/i.test(token)) return null;
  return db.collection(BADGES).findOne({ token });
}
function badgeStatus(b) {
  if (!b) return 'notfound';
  if (b.revoked) return 'revoked';
  if (b.expiresAt && new Date(b.expiresAt) < new Date()) return 'expired';
  return 'valid';
}

router.get('/verify/:token', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const b = await loadBadge(db, req.params.token);
    const status = badgeStatus(b);
    if (status === 'notfound') return res.status(404).json({ success: false, status });
    res.json({
      success: true,
      status, // valid | expired | revoked
      data: {
        companyName: b.companyName,
        module: b.module,
        ratingTier: b.ratingTier,
        ratingLabel: b.ratingLabel,
        verified: !!b.verified,
        issuedAt: b.issuedAt,
        expiresAt: b.expiresAt,
      },
    });
  } catch (err) {
    console.error('Employer badge verify error:', err);
    res.status(500).json({ success: false });
  }
});

router.get('/verify/:token/image.svg', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const b = await loadBadge(db, req.params.token);
    const status = badgeStatus(b);
    const tier = status === 'valid' ? b.ratingTier : '—';
    res.type('image/svg+xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(badge.sealSVG({ tier, verified: status === 'valid' && !!b.verified }));
  } catch (err) {
    res.status(500).type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
  }
});

router.get('/verify/:token/certificate.svg', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const b = await loadBadge(db, req.params.token);
    if (badgeStatus(b) !== 'valid') return res.status(404).send('');
    res.type('image/svg+xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(badge.certificateSVG({
      companyName: b.companyName, tier: b.ratingTier, ratingLabel: b.ratingLabel,
      issuedAt: b.issuedAt, expiresAt: b.expiresAt, token: b.token, verified: !!b.verified,
    }));
  } catch (err) {
    res.status(500).send('');
  }
});

router.get('/verify/:token/certificate.pdf', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const b = await loadBadge(db, req.params.token);
    if (badgeStatus(b) !== 'valid') return res.status(404).send('');
    res.type('application/pdf');
    res.set('Content-Disposition', 'attachment; filename="nexa-proveren-rabotodavac.pdf"');
    badge.certificatePDF(res, {
      companyName: b.companyName, tier: b.ratingTier, ratingLabel: b.ratingLabel,
      issuedAt: b.issuedAt, expiresAt: b.expiresAt, token: b.token, verified: !!b.verified,
    });
  } catch (err) {
    if (!res.headersSent) res.status(500).send('');
  }
});

module.exports = router;
