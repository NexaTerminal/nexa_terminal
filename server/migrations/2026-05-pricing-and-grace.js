/**
 * Migration: 2026-05-pricing-and-grace
 *
 * Two things, both idempotent:
 *   1. Rename legacy plan 'admin' → 'admin_5' in users.subscription
 *      and in subscription_history.
 *   2. Initialize gracePeriod sub-document on every user.subscription doc
 *      that lacks it: { used: false, startedAt: null, endsAt: null, triggeredBy: null }.
 *
 * Existing 'admin_user' role with seatLimit already set stays unchanged.
 * Standard / regular / sub_seat docs only get the gracePeriod field.
 *
 * Usage:  cd server && node migrations/2026-05-pricing-and-grace.js
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

  console.log('🚀 [pricing-and-grace] starting');
  const client = new MongoClient(MONGODB_URI);
  const stats = { scanned: 0, planRenamed: 0, graceAdded: 0, historyRenamed: 0 };

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection('users');
    const history = db.collection('subscription_history');

    stats.scanned = await users.countDocuments();

    // 1. Rename legacy admin → admin_5 (on the live subscription field).
    const renameResult = await users.updateMany(
      { 'subscription.plan': 'admin' },
      { $set: { 'subscription.plan': 'admin_5' } }
    );
    stats.planRenamed = renameResult.modifiedCount;

    // 1b. Also rename requestedPlan if any.
    await users.updateMany(
      { 'subscription.requestedPlan': 'admin' },
      { $set: { 'subscription.requestedPlan': 'admin_5' } }
    );

    // 1c. Rename in history collection too.
    const histResult = await history.updateMany(
      { plan: 'admin' },
      { $set: { plan: 'admin_5' } }
    );
    stats.historyRenamed = histResult.modifiedCount;

    // 2. Add gracePeriod to any subscription doc that doesn't have it.
    const graceResult = await users.updateMany(
      {
        subscription: { $exists: true, $ne: null },
        'subscription.gracePeriod': { $exists: false }
      },
      {
        $set: {
          'subscription.gracePeriod': {
            used: false,
            startedAt: null,
            endsAt: null,
            triggeredBy: null
          }
        }
      }
    );
    stats.graceAdded = graceResult.modifiedCount;

    console.log(`✅ [pricing-and-grace] done — ${JSON.stringify(stats)}`);
  } catch (err) {
    console.error('❌ [pricing-and-grace] error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }

  return stats;
}

if (require.main === module) {
  run();
} else {
  module.exports = run;
}
