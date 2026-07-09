// Public teaser screening — „Бесплатна проверка" (master-plan Phase 1.1).
//
// Mounted BEFORE CSRF in server.js (no auth — this is the public acquisition
// funnel). The general /api/ rate limiter applies. Evaluation happens strictly
// server-side so correct answers never reach the browser.
//
//   GET  /questions          → question texts only
//   POST /submit             → evaluate + store lead → results (+resultId)
//   POST /result/:id/email   → attach email, send the report (funnel capture)
//   GET  /result/:id         → re-fetch results (LockedWelcome pickup after signup)

const express = require('express');
const { ObjectId } = require('mongodb');
const { questions, gradeConfig } = require('../data/publicTeaserQuestions');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

const router = express.Router();
const COLLECTION = 'teaser_screenings';

const SEVERITY_RANK = { high: 0, medium: 1, advisory: 2 };
const VALID_ANSWERS = new Set(['yes', 'no', 'na']);

function evaluate(answers) {
  let score = 0;
  let maxScore = 0;
  const gaps = [];

  questions.forEach((q) => {
    const answer = answers[q.id];
    if (!answer || answer === 'na') return;
    maxScore += q.weight;
    if (answer === q.correctAnswer) {
      score += q.weight;
    } else {
      gaps.push({
        id: q.id,
        gapTitle: q.gapTitle,
        article: q.article,
        severity: q.severity,
        risk: q.risk,
        fix: q.fix,
        weight: q.weight
      });
    }
  });

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const grade = gradeConfig.find((g) => percentage >= g.min) || gradeConfig[gradeConfig.length - 1];
  gaps.sort((a, b) =>
    (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) || (b.weight - a.weight)
  );

  return {
    percentage,
    grade: grade.label,
    gradeClass: grade.class,
    answeredCount: Object.keys(answers).filter((k) => VALID_ANSWERS.has(answers[k])).length,
    gapCount: gaps.length,
    topGaps: gaps.slice(0, 3).map(({ weight, ...g }) => g)
  };
}

// Public shape — never include answers/email of the stored record.
function publicResult(doc) {
  return {
    id: doc._id.toString(),
    percentage: doc.result.percentage,
    grade: doc.result.grade,
    gradeClass: doc.result.gradeClass,
    gapCount: doc.result.gapCount,
    topGaps: doc.result.topGaps,
    emailCaptured: !!doc.email
  };
}

router.get('/questions', (req, res) => {
  res.json({
    success: true,
    data: questions.map(({ id, text, article }) => ({ id, text, article }))
  });
});

router.post('/submit', async (req, res) => {
  try {
    const { answers, website } = req.body || {};

    // Honeypot: real users never fill the hidden "website" field.
    if (website) return res.status(400).json({ success: false });

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, message: 'Недостасуваат одговори.' });
    }
    const knownIds = new Set(questions.map((q) => q.id));
    const clean = {};
    for (const [k, v] of Object.entries(answers)) {
      if (knownIds.has(k) && VALID_ANSWERS.has(v)) clean[k] = v;
    }
    if (Object.keys(clean).length < 5) {
      return res.status(400).json({ success: false, message: 'Одговорете на најмалку 5 прашања.' });
    }

    const result = evaluate(clean);
    const db = req.app.locals.db;
    const doc = {
      answers: clean,
      result,
      email: null,
      source: (req.query.src || '').toString().slice(0, 60) || null,
      registeredUserId: null,
      createdAt: new Date()
    };
    const inserted = await db.collection(COLLECTION).insertOne(doc);
    doc._id = inserted.insertedId;

    res.json({ success: true, data: publicResult(doc) });
  } catch (err) {
    console.error('Teaser screening submit error:', err);
    res.status(500).json({ success: false, message: 'Грешка при пресметување на резултатот.' });
  }
});

router.post('/result/:id/email', async (req, res) => {
  try {
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Внесете валидна е-пошта.' });
    }
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false });
    }

    const db = req.app.locals.db;
    const _id = new ObjectId(req.params.id);
    const doc = await db.collection(COLLECTION).findOne({ _id });
    if (!doc) return res.status(404).json({ success: false });

    await db.collection(COLLECTION).updateOne(
      { _id },
      { $set: { email, emailCapturedAt: new Date() } }
    );

    // Best-effort report email — capture succeeds even if sending fails.
    try {
      const emailService = req.app.locals.emailService;
      if (emailService) {
        const r = doc.result;
        const gapsHtml = r.topGaps.map((g) => `
          <div style="margin:0 0 14px;padding:12px 14px;border:1px solid #e5e7eb;border-radius:8px;">
            <div style="font-weight:600;color:#111827;">${g.gapTitle}</div>
            <div style="font-size:13px;color:#6b7280;margin:2px 0 6px;">${g.article}</div>
            <div style="font-size:13.5px;color:#374151;">${g.risk}</div>
            <div style="font-size:13.5px;color:#1e4db7;margin-top:6px;">✔ ${g.fix}</div>
          </div>`).join('');
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
            <h2 style="color:#1e4db7;">Вашата бесплатна проверка на усогласеност</h2>
            <p>Резултат: <strong>${r.percentage}%</strong> — ${r.grade}.
               Идентификувани се <strong>${r.gapCount}</strong> недостатоци${r.gapCount > 3 ? ' (топ 3 подолу)' : ''}.</p>
            ${gapsHtml}
            <p style="margin-top:18px;">Nexa Терминал ги решава овие празнини — автоматизирани документи,
               целосни проверки и правен AI помошник, на македонски, според македонското право.</p>
            <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" style="display:inline-block;background:#1e4db7;color:#fff;
               padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;">
               Отворете сметка</a></p>
          </div>`;
        await emailService.sendEmail(email, `Вашиот резултат: ${r.percentage}% усогласеност — Nexa проверка`, html);
      }
    } catch (mailErr) {
      console.error('Teaser report email failed (capture kept):', mailErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Teaser screening email error:', err);
    res.status(500).json({ success: false, message: 'Грешка при зачувување на е-поштата.' });
  }
});

router.get('/result/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false });
    }
    const db = req.app.locals.db;
    const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ success: false });
    res.json({ success: true, data: publicResult(doc) });
  } catch (err) {
    console.error('Teaser screening fetch error:', err);
    res.status(500).json({ success: false });
  }
});

// ── Admin: funnel stats (master-plan Phase 1.4) ──────────────────────────
// completed → email captured → registered (same email exists in users).
router.get('/admin/funnel', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const rows = await db.collection(COLLECTION).aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 500 },
      {
        $lookup: {
          from: 'users',
          let: { em: '$email' },
          pipeline: [
            { $match: { $expr: { $and: [
              { $ne: ['$$em', null] },
              { $eq: [{ $toLower: '$email' }, '$$em'] }
            ] } } },
            { $project: { _id: 1, freeDocUsed: 1, 'subscription.status': 1 } }
          ],
          as: 'registeredUser'
        }
      },
      {
        $project: {
          createdAt: 1,
          email: 1,
          source: 1,
          percentage: '$result.percentage',
          grade: '$result.grade',
          gapCount: '$result.gapCount',
          registered: { $gt: [{ $size: '$registeredUser' }, 0] },
          freeDocUsed: { $eq: [{ $arrayElemAt: ['$registeredUser.freeDocUsed', 0] }, true] },
          subscriptionStatus: { $arrayElemAt: ['$registeredUser.subscription.status', 0] }
        }
      }
    ]).toArray();

    const stats = {
      completed: rows.length,
      emailCaptured: rows.filter((r) => r.email).length,
      registered: rows.filter((r) => r.registered).length,
      freeDocUsed: rows.filter((r) => r.freeDocUsed).length,
      activated: rows.filter((r) => r.subscriptionStatus === 'active').length,
      avgScore: rows.length
        ? Math.round(rows.reduce((s, r) => s + (r.percentage || 0), 0) / rows.length)
        : 0
    };

    res.json({ success: true, data: { stats, rows } });
  } catch (err) {
    console.error('Teaser funnel stats error:', err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
