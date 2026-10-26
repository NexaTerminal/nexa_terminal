const express = require('express');
const rateLimit = require('express-rate-limit');
const { ObjectId } = require('mongodb');
const { authenticateJWT } = require('../middleware/auth');

/**
 * „Мои податоци" — the user's own view of what Nexa keeps about them:
 *   GET    /api/my-data/summary   counts per category
 *   GET    /api/my-data/export    everything below as one JSON file
 *   DELETE /api/my-data/ai        AI conversations (incl. Корпа), AI memory, citation log — permanent
 *   DELETE /api/my-data/activity  activity log (pages, clicks, actions) — permanent
 *
 * Pro conversations (pro_requests) are shared with the professional, so they are
 * exported but not erased here — that goes through info@nexa.mk.
 */

const router = express.Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Премногу барања во кратко време. Обидете се повторно.' },
});

// Collections key the user differently (string id vs ObjectId) — match both.
const ids = (user) => {
  const s = String(user._id);
  return { s, oid: new ObjectId(s), any: { $in: [s, new ObjectId(s)] } };
};

// Never exported: credentials and internal security fields.
const PROFILE_OMIT = ['password', 'passwordHash', 'resetPasswordToken', 'resetPasswordExpires',
  'verificationToken', 'emailVerificationToken', 'refreshToken', 'tokens', 'twoFactorSecret',
  'resetToken', 'companyCode', 'companyCodeAttempts'];

router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const u = ids(req.user);
    const [conversations, trashed, memory, agentMemory, events, proRequests] = await Promise.all([
      db.collection('chatbot_conversations').countDocuments({ userId: u.s, deletedAt: null }),
      db.collection('chatbot_conversations').countDocuments({ userId: u.s, deletedAt: { $ne: null } }),
      db.collection('user_ai_memory').findOne({ userId: u.any }, { projection: { facts: 1 } }),
      db.collection('user_agent_memory').countDocuments({ userId: u.any }),
      db.collection('user_events').countDocuments({ userId: u.any }),
      db.collection('pro_requests').countDocuments({ userId: u.any }),
    ]);
    res.json({
      success: true,
      summary: {
        conversations,
        trashed,
        memoryFacts: Array.isArray(memory?.facts) ? memory.facts.length : 0,
        agentMemories: agentMemory,
        activityEvents: events,
        proRequests,
        activityRetentionDays: 90,
      },
    });
  } catch (err) {
    console.error('[my-data] summary failed:', err.message);
    res.status(500).json({ success: false, message: 'Не успеавме да ги вчитаме податоците.' });
  }
});

router.get('/export', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const u = ids(req.user);
    const profile = await db.collection('users').findOne({ _id: u.oid });
    for (const k of PROFILE_OMIT) if (profile) delete profile[k];
    const [conversations, memory, agentMemory, proRequests, activity] = await Promise.all([
      db.collection('chatbot_conversations').find({ userId: u.s }).sort({ createdAt: -1 }).toArray(),
      db.collection('user_ai_memory').findOne({ userId: u.any }),
      db.collection('user_agent_memory').find({ userId: u.any }).toArray(),
      db.collection('pro_requests').find({ userId: u.any }).sort({ createdAt: -1 }).toArray(),
      db.collection('user_events').find({ userId: u.any }, { projection: { userId: 0 } }).sort({ at: -1 }).limit(20000).toArray(),
    ]);
    const body = {
      exportedAt: new Date(),
      note: 'Извоз на вашите податоци од Nexa (nexa.mk). Прашања: info@nexa.mk',
      profile,
      aiConversations: conversations,
      aiMemory: memory,
      aiAgentMemory: agentMemory,
      proConversations: proRequests,
      activityLog: activity,
    };
    const day = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nexa-moi-podatoci-${day}.json"`);
    res.send(JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('[my-data] export failed:', err.message);
    res.status(500).json({ success: false, message: 'Извозот не успеа.' });
  }
});

router.delete('/ai', authenticateJWT, writeLimiter, async (req, res) => {
  if (req.query.confirm !== '1') return res.status(400).json({ success: false, message: 'Потребна е потврда.' });
  try {
    const db = req.app.locals.db;
    const u = ids(req.user);
    const [c, m, a, k] = await Promise.all([
      db.collection('chatbot_conversations').deleteMany({ userId: u.s }),
      db.collection('user_ai_memory').deleteMany({ userId: u.any }),
      db.collection('user_agent_memory').deleteMany({ userId: u.any }),
      db.collection('ai_citation_checks').deleteMany({ userId: u.s }),
    ]);
    res.json({ success: true, deleted: { conversations: c.deletedCount, memory: m.deletedCount, agentMemory: a.deletedCount, citationChecks: k.deletedCount } });
  } catch (err) {
    console.error('[my-data] AI erase failed:', err.message);
    res.status(500).json({ success: false, message: 'Бришењето не успеа.' });
  }
});

router.delete('/activity', authenticateJWT, writeLimiter, async (req, res) => {
  if (req.query.confirm !== '1') return res.status(400).json({ success: false, message: 'Потребна е потврда.' });
  try {
    const db = req.app.locals.db;
    const u = ids(req.user);
    const r = await db.collection('user_events').deleteMany({ userId: u.any });
    res.json({ success: true, deleted: { activityEvents: r.deletedCount } });
  } catch (err) {
    console.error('[my-data] activity erase failed:', err.message);
    res.status(500).json({ success: false, message: 'Бришењето не успеа.' });
  }
});

module.exports = router;
