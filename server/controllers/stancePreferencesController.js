/**
 * Controllers for /api/ai/stance.
 *
 * GET → returns the user's preferences (or all-null skeleton).
 * PUT → upserts; validates enums + freeNote length.
 */

const StancePreferencesService = require('../services/stancePreferencesService');

function makeService(req) {
  return new StancePreferencesService(req.app.locals.db);
}

exports.getMine = async (req, res) => {
  try {
    const svc = makeService(req);
    const prefs = await svc.get(req.user._id);
    return res.json({ success: true, preferences: prefs });
  } catch (err) {
    console.error('[stance/get] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.putMine = async (req, res) => {
  try {
    const svc = makeService(req);
    const saved = await svc.upsert(req.user._id, req.body || {});
    return res.json({ success: true, preferences: saved });
  } catch (err) {
    if (err.code === 'INVALID_ENUM' || err.code === 'FREENOTE_TOO_LONG' || err.code === 'INVALID_USER') {
      return res.status(400).json({ success: false, code: err.code, message: err.message });
    }
    console.error('[stance/put] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
