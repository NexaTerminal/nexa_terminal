/**
 * Migration: 2026-05-admin-user-fields
 *
 * Adds `parentSuperUserId: null` to user docs that lack the field.
 * Does NOT initialize the `superUser` (admin-user metadata) sub-document —
 * that is created lazily when a user is promoted to admin_user in Slice 1.
 * Existing roles remain untouched.
 *
 * Idempotent: running twice prints `{ modified: 0 }` on the second pass.
 *
 * Usage:
 *   node migrations/2026-05-admin-user-fields.js
 */

const { MongoClient } = require('mongodb');
const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'nexa';

async function run() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set. Aborting.');
    process.exit(1);
  }

  console.log('🚀 [admin-user-fields] starting');
  const client = new MongoClient(MONGODB_URI);
  let modified = 0;
  let scanned = 0;

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection('users');

    scanned = await users.countDocuments();
    console.log(`📊 [admin-user-fields] scanning ${scanned} user docs`);

    // Only touch docs that do not already carry the field.
    const result = await users.updateMany(
      { parentSuperUserId: { $exists: false } },
      { $set: { parentSuperUserId: null } }
    );
    modified = result.modifiedCount || 0;

    console.log(`✅ [admin-user-fields] done — { scanned: ${scanned}, modified: ${modified} }`);
  } catch (err) {
    console.error('❌ [admin-user-fields] error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }

  return { scanned, modified };
}

if (require.main === module) {
  run();
} else {
  module.exports = run;
}
