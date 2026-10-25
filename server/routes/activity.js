const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const UserEventsService = require('../services/userEventsService');

const router = express.Router();

/**
 * POST /api/activity/events — batched client events (page views with active
 * time + scroll depth, clicks, session starts) for the admin activity timeline.
 * Body: { events: [{ kind, at, sessionId, path, title?, label?, target?, activeMs?, scrollPct? }] }
 */
router.post('/events', authenticateJWT, async (req, res) => {
  try {
    const n = await new UserEventsService(req.app.locals.db)
      .addClientEvents(req.user._id, req.body?.events);
    res.json({ success: true, stored: n });
  } catch (err) {
    console.warn('[activity] store failed:', err.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
