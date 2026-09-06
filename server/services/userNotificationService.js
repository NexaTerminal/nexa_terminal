/**
 * User notifications — the in-app bell for terminal users (Basic + Pro).
 *
 * Replaces the old in-memory Map in routes/notifications.js (which lost
 * everything on restart and was never actually populated). Backed by the
 * `user_notifications` Mongo collection via the native driver.
 *
 * Delivery: the frontend bell polls GET /api/notifications every 30s. We also
 * best-effort emit a Socket.io event to room `user_<id>` for future live
 * updates (harmless no-op until a per-user socket room is wired up).
 *
 * Functions take the `db` handle so lifecycle code can call them straight from
 * `req.app.locals.db` without extra wiring:
 *
 *   const notifications = require('../services/userNotificationService');
 *   await notifications.notify(req.app.locals.db, userId, {
 *     type: 'subscription_approved',
 *     title: 'Пристапот е одобрен',
 *     message: 'Вашата претплата е активна.',
 *     actionUrl: '/terminal'
 *   }, req.app.locals.io);
 */

const { ObjectId } = require('mongodb');

let indexesEnsured = false;

function collection(db) {
  return db.collection('user_notifications');
}

async function ensureIndexes(db) {
  if (indexesEnsured) return;
  try {
    await collection(db).createIndex({ userId: 1, createdAt: -1 });
    await collection(db).createIndex({ userId: 1, read: 1 });
    indexesEnsured = true;
  } catch (e) {
    console.error('[userNotifications] ensureIndexes failed:', e.message);
  }
}

function toId(id) {
  return id instanceof ObjectId ? id : new ObjectId(String(id));
}

/**
 * Create a notification for a user. Fire-and-log safe: never throws to the
 * caller (a lifecycle action must not fail because a notification couldn't be
 * written). Returns the inserted doc or null.
 */
async function notify(db, userId, { type, title, message, actionUrl = null, severity = 'info' } = {}, io = null) {
  if (!db || !userId) return null;
  try {
    await ensureIndexes(db);
    const doc = {
      userId: toId(userId),
      type: type || 'update',
      title: title || '',
      message: message || '',
      actionUrl,
      severity,
      read: false,
      createdAt: new Date()
    };
    const { insertedId } = await collection(db).insertOne(doc);
    doc._id = insertedId;

    if (io) {
      try { io.to(`user_${String(userId)}`).emit('notification:new', projectOne(doc)); }
      catch (e) { /* socket best-effort */ }
    }
    return doc;
  } catch (e) {
    console.error('[userNotifications] notify failed:', e.message);
    return null;
  }
}

async function list(db, userId, { limit = 50 } = {}) {
  await ensureIndexes(db);
  const uid = toId(userId);
  const [items, unreadCount] = await Promise.all([
    collection(db).find({ userId: uid }).sort({ createdAt: -1 }).limit(limit).toArray(),
    collection(db).countDocuments({ userId: uid, read: false })
  ]);
  return { notifications: items.map(projectOne), unreadCount };
}

async function markRead(db, userId, notificationId) {
  const r = await collection(db).updateOne(
    { _id: toId(notificationId), userId: toId(userId) },
    { $set: { read: true, readAt: new Date() } }
  );
  return r.matchedCount > 0;
}

async function markAllRead(db, userId) {
  const r = await collection(db).updateMany(
    { userId: toId(userId), read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return r.modifiedCount;
}

// Shape returned to the client — `id` as a string so the frontend can use it
// directly in the mark-as-read calls.
function projectOne(n) {
  return {
    id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message,
    actionUrl: n.actionUrl || null,
    severity: n.severity || 'info',
    read: !!n.read,
    createdAt: n.createdAt
  };
}

module.exports = { notify, list, markRead, markAllRead, ensureIndexes };
