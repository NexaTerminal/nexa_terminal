const { ObjectId } = require('mongodb');

/**
 * Feature terms acceptance — audit trail.
 *
 * Records a user's acceptance of the per-feature posting/usage terms (blog,
 * case, topic, fair) with the accepted version + timestamp. Acceptances are
 * append-only on the user document (`termsAcceptances`), giving a queryable log.
 *
 * The terms CONTENT and the current version number live on the client
 * (data/featureTerms.js); the server only records what was accepted and reports
 * the latest accepted version per feature so the client can decide whether to
 * re-prompt (e.g. after a version bump).
 */

const FEATURES = ['blog', 'case', 'topic', 'fair', 'tender'];

function userId(req) {
  const id = req.user && (req.user._id || req.user.id);
  return id instanceof ObjectId ? id : new ObjectId(String(id));
}

// GET /api/terms/status → { accepted: { blog: 2, fair: 1, ... } } (latest version per feature)
exports.getStatus = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await db.collection('users').findOne(
      { _id: userId(req) },
      { projection: { termsAcceptances: 1 } }
    );
    const accepted = {};
    (user?.termsAcceptances || []).forEach((a) => {
      if (!accepted[a.feature] || a.version > accepted[a.feature]) accepted[a.feature] = a.version;
    });
    res.json({ success: true, accepted });
  } catch (err) {
    console.error('[terms] getStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Грешка при вчитување на статусот.' });
  }
};

// POST /api/terms/accept { feature, version } → append acceptance to the audit log
exports.accept = async (req, res) => {
  try {
    const { feature, version } = req.body || {};
    if (!FEATURES.includes(feature)) {
      return res.status(400).json({ success: false, message: 'Невалидна функција.' });
    }
    const v = parseInt(version, 10);
    if (!(v >= 1)) {
      return res.status(400).json({ success: false, message: 'Невалидна верзија.' });
    }
    const db = req.app.locals.db;
    const entry = { feature, version: v, acceptedAt: new Date(), ip: req.ip };
    await db.collection('users').updateOne(
      { _id: userId(req) },
      { $push: { termsAcceptances: entry } }
    );
    res.json({ success: true, accepted: { feature, version: v } });
  } catch (err) {
    console.error('[terms] accept error:', err.message);
    res.status(500).json({ success: false, message: 'Грешка при зачувување на согласноста.' });
  }
};
