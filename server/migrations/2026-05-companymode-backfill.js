/**
 * Migration: 2026-05-companymode-backfill
 *
 * Backfills `companyMode` on existing sub-seat users. Every sub-seat
 * created before this field existed inherited the parent's companyName at
 * invite time, so 'shared' is the closest interpretation.
 *
 * Idempotent: skips docs that already have companyMode set.
 *
 * Usage:
 *   cd server && node migrations/2026-05-companymode-backfill.js
 */

const { MongoClient } = require('mongodb');
const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'nexa';

async function run() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set.');
    process.exit(1);
  }
  console.log('🚀 [companymode-backfill] starting');
  const client = new MongoClient(MONGODB_URI);
  let modified = 0;
  let total = 0;

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection('users');

    total = await users.countDocuments({ role: 'sub_seat' });
    const result = await users.updateMany(
      { role: 'sub_seat', companyMode: { $exists: false } },
      { $set: { companyMode: 'shared', updatedAt: new Date() } }
    );
    modified = result.modifiedCount || 0;

    console.log(`✅ [companymode-backfill] done — { totalSubSeats: ${total}, modified: ${modified} }`);
  } catch (err) {
    console.error('❌ [companymode-backfill] error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
  return { totalSubSeats: total, modified };
}

if (require.main === module) { run(); }
else { module.exports = run; }
