/**
 * User notification bell API.
 *
 *   GET    /api/notifications          → { notifications, unreadCount }
 *   PUT    /api/notifications/:id/read → mark one read
 *   PUT    /api/notifications/read-all → mark all read
 *
 * Backed by services/userNotificationService (Mongo `user_notifications`).
 * Lifecycle code (subscription approve/reject, verification, …) creates
 * notifications via userNotificationService.notify().
 */

const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const notifications = require('../services/userNotificationService');

// GET all notifications for the current user
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await notifications.list(db, req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark all as read — registered BEFORE /:id/read so 'read-all' isn't captured
// as an :id.
router.put('/read-all', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const modified = await notifications.markAllRead(db, req.user._id);
    res.json({ success: true, modified });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Mark one notification as read
router.put('/:id/read', authenticateJWT, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const ok = await notifications.markRead(db, req.user._id, req.params.id);
    if (!ok) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

module.exports = router;
