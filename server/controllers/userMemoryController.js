/**
 * Controllers for /api/ai/memory (Layer 1 — durable user memory).
 *
 * GET    /            → { enabled, facts }
 * PUT    /enabled     → toggle learning + injection ({ enabled })
 * DELETE /:factId     → remove one remembered fact
 * DELETE /            → clear all remembered facts
 */

const UserMemoryService = require('../services/userMemoryService');

function makeService(req) {
  return new UserMemoryService(req.app.locals.db);
}

function shape(mem) {
  return {
    enabled: mem.enabled !== false,
    facts: (mem.facts || []).map((f) => ({
      id: f.id,
      text: f.text,
      domain: f.domain || 'general',
      updatedAt: f.lastSeenAt || f.createdAt || null,
    })),
  };
}

exports.getMine = async (req, res) => {
  try {
    const mem = await makeService(req).get(req.user._id);
    return res.json({ success: true, memory: shape(mem) });
  } catch (err) {
    console.error('[memory/get] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.setEnabled = async (req, res) => {
  try {
    const enabled = !!(req.body && req.body.enabled);
    const mem = await makeService(req).setEnabled(req.user._id, enabled);
    return res.json({ success: true, memory: shape(mem) });
  } catch (err) {
    if (err.code === 'INVALID_USER') {
      return res.status(400).json({ success: false, code: err.code, message: err.message });
    }
    console.error('[memory/enabled] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFact = async (req, res) => {
  try {
    const mem = await makeService(req).deleteFact(req.user._id, req.params.factId);
    return res.json({ success: true, memory: shape(mem) });
  } catch (err) {
    console.error('[memory/delete-fact] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.clear = async (req, res) => {
  try {
    const mem = await makeService(req).clear(req.user._id);
    return res.json({ success: true, memory: shape(mem) });
  } catch (err) {
    console.error('[memory/clear] error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
