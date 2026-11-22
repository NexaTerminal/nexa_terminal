// Company one-pager („/f/:slug") extras: uploaded images, visitor messages and
// simple monthly stats. Kept separate from profileService (profile fields).
//
// Images live in MongoDB (`profile_images`), not on local disk — the Railway
// filesystem is wiped on redeploy. The client resizes before upload, so each
// image is ~100–300 KB and far below the 16 MB document limit.

const { ObjectId, Binary } = require('mongodb');

const KINDS = ['avatar', 'cover'];
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const TYPES = { 'image/jpeg': [0xff, 0xd8], 'image/png': [0x89, 0x50], 'image/webp': [0x52, 0x49] };

const oid = (id) => new ObjectId(String(id));
const monthKey = (d = new Date()) => d.toISOString().slice(0, 7); // YYYY-MM

/** data:image/...;base64,… → { contentType, buffer } or { error }. */
function parseDataUrl(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) return { error: 'Дозволени се само JPG, PNG или WebP слики.' };
  const buffer = Buffer.from(m[2], 'base64');
  if (!buffer.length) return { error: 'Сликата е празна.' };
  if (buffer.length > MAX_IMAGE_BYTES) return { error: 'Сликата е преголема (најмногу 1,5 MB).' };
  const magic = TYPES[m[1]];
  if (buffer[0] !== magic[0] || buffer[1] !== magic[1]) return { error: 'Датотеката не е валидна слика.' };
  return { contentType: m[1], buffer };
}

const imagePath = (userId, kind, version = Date.now()) => `/api/public/profile/img/${userId}/${kind}?v=${version}`;

async function saveImage(db, userId, kind, { contentType, buffer }) {
  const now = new Date();
  await db.collection('profile_images').updateOne(
    { _id: `${userId}:${kind}` },
    { $set: { userId: oid(userId), kind, contentType, data: new Binary(buffer), size: buffer.length, updatedAt: now } },
    { upsert: true }
  );
  const url = imagePath(userId, kind, now.getTime());
  // Go live immediately if the profile already exists.
  const field = kind === 'avatar' ? 'publicProfile.avatarUrl' : 'publicProfile.coverUrl';
  await db.collection('users').updateOne(
    { _id: oid(userId), 'publicProfile.slug': { $type: 'string' } },
    { $set: { [field]: url, 'publicProfile.updatedAt': now } }
  );
  return url;
}

async function deleteImage(db, userId, kind) {
  await db.collection('profile_images').deleteOne({ _id: `${userId}:${kind}` });
  const field = kind === 'avatar' ? 'publicProfile.avatarUrl' : 'publicProfile.coverUrl';
  // Only clear the field if it pointed at our stored image (not a pasted link).
  await db.collection('users').updateOne(
    { _id: oid(userId), [field]: { $regex: `^/api/public/profile/img/${userId}/${kind}` } },
    { $set: { [field]: '' } }
  );
}

async function getImage(db, userId, kind) {
  if (!ObjectId.isValid(userId) || !KINDS.includes(kind)) return null;
  const doc = await db.collection('profile_images').findOne({ _id: `${userId}:${kind}` });
  if (!doc) return null;
  const data = doc.data?.buffer ? Buffer.from(doc.data.buffer) : Buffer.from(doc.data);
  return { contentType: doc.contentType, data, updatedAt: doc.updatedAt };
}

async function bump(db, userId, field) {
  await db.collection('profile_stats').updateOne(
    { userId: oid(userId), month: monthKey() },
    { $inc: { [field]: 1 }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
}

async function saveMessage(db, userId, msg) {
  await db.collection('profile_messages').insertOne({ userId: oid(userId), ...msg, createdAt: new Date() });
  await bump(db, userId, 'contacts');
}

/** Owner dashboard: this month + all-time counters and the latest messages. */
async function insights(db, userId) {
  const _id = oid(userId);
  const rows = await db.collection('profile_stats').find({ userId: _id }).toArray();
  const cur = rows.find((r) => r.month === monthKey()) || {};
  const sum = (k) => rows.reduce((n, r) => n + (r[k] || 0), 0);
  const messages = await db.collection('profile_messages')
    .find({ userId: _id }, { projection: { userId: 0 } })
    .sort({ createdAt: -1 }).limit(20).toArray();
  return {
    month: { views: cur.views || 0, contacts: cur.contacts || 0 },
    total: { views: sum('views'), contacts: sum('contacts') },
    messages,
  };
}

module.exports = { KINDS, parseDataUrl, saveImage, deleteImage, getImage, bump, saveMessage, insights, imagePath };
