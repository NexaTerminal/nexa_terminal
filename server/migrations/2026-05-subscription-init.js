/**
 * Migration: 2026-05-subscription-init
 *
 * Initializes subscription state for the new billing model.
 *
 * Rules:
 *   - role === 'verified'      → role = 'standard_user',  status = 'active' (30-day grace).
 *   - role === 'regular'       → status = 'trial' starting now (8 days), if no subscription yet.
 *   - role === 'admin'         → no subscription block; admin is always active.
 *   - role === 'admin_user'    → status = 'active' (30-day grace) if no subscription.
 *   - subscription already set → no change.
 *
 * Idempotent: re-running prints `{ modified: 0 }`.
 *
 * Usage:
 *   cd server && node migrations/2026-05-subscription-init.js
 */

const { MongoClient } = require('mongodb');
const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'nexa';

const GRACE_DAYS = 30;
const TRIAL_DAYS = 8;

const addDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

async function run() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set. Aborting.');
    process.exit(1);
  }

  console.log('🚀 [subscription-init] starting');
  const client = new MongoClient(MONGODB_URI);
  const stats = { scanned: 0, verifiedMigrated: 0, regularTrialed: 0, adminUserGraced: 0, untouched: 0 };

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection('users');
    stats.scanned = await users.countDocuments();
    console.log(`📊 [subscription-init] scanning ${stats.scanned} users`);

    const now = new Date();
    const cursor = users.find({});
    while (await cursor.hasNext()) {
      const u = await cursor.next();
      if (u.subscription && u.subscription.status) {
        stats.untouched++;
        continue;
      }
      const role = u.role;

      // Platform admin is always active; no subscription gating.
      if (role === 'admin' || u.isAdmin === true) {
        stats.untouched++;
        continue;
      }

      // verified → standard_user with 30-day grace
      if (role === 'verified') {
        await users.updateOne(
          { _id: u._id },
          { $set: {
              role: 'standard_user',
              subscription: {
                plan: 'standard',
                cycle: 'monthly',
                status: 'active',
                startedAt: now,
                endsAt: addDays(now, GRACE_DAYS),
                durationDays: GRACE_DAYS,
                autoRenew: false,
                amountEur: 0,
                invoiceNumber: 'GRACE-MIGRATE-2026-05',
                approvedBy: null,
                approvedAt: now,
                remindersSent: [],
                notes: 'Auto-migrated from verified role. 30-day grace.',
                requestedAt: null,
                requestedPlan: null,
                requestedCycle: null
              },
              updatedAt: now
          } }
        );
        stats.verifiedMigrated++;
        continue;
      }

      // admin_user (already set by a previous slice) — give 30-day grace if no subscription.
      if (role === 'admin_user') {
        await users.updateOne(
          { _id: u._id },
          { $set: {
              subscription: {
                plan: 'admin',
                cycle: 'monthly',
                status: 'active',
                startedAt: now,
                endsAt: addDays(now, GRACE_DAYS),
                durationDays: GRACE_DAYS,
                autoRenew: false,
                amountEur: 0,
                invoiceNumber: 'GRACE-MIGRATE-2026-05',
                approvedBy: null,
                approvedAt: now,
                remindersSent: [],
                notes: 'Auto-migrated. 30-day grace.',
                requestedAt: null,
                requestedPlan: null,
                requestedCycle: null
              },
              updatedAt: now
          } }
        );
        stats.adminUserGraced++;
        continue;
      }

      // sub_seat — no own subscription; gated via parent.
      if (role === 'sub_seat') {
        stats.untouched++;
        continue;
      }

      // regular (default) → start 8-day trial
      await users.updateOne(
        { _id: u._id },
        { $set: {
            subscription: {
              plan: null,
              cycle: 'trial',
              status: 'trial',
              startedAt: now,
              endsAt: addDays(now, TRIAL_DAYS),
              durationDays: TRIAL_DAYS,
              autoRenew: false,
              amountEur: 0,
              invoiceNumber: null,
              approvedBy: null,
              approvedAt: null,
              remindersSent: [],
              notes: 'Auto-trial granted by 2026-05 migration.',
              requestedAt: null,
              requestedPlan: null,
              requestedCycle: null
            },
            updatedAt: now
        } }
      );
      stats.regularTrialed++;
    }

    const totalModified = stats.verifiedMigrated + stats.regularTrialed + stats.adminUserGraced;
    console.log(`✅ [subscription-init] done — ${JSON.stringify({ ...stats, totalModified })}`);
  } catch (err) {
    console.error('❌ [subscription-init] error:', err.message);
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
