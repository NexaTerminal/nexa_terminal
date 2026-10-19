/**
 * One-time reset to the free-Basic / invite-only-Pro model.
 *
 * All existing users are demo/dummy, so we can clean-slate them:
 *   1. Clear the removed tier-selection modal flag on EVERYONE
 *      (needsTierOnboarding → false). The TierOnboardingModal no longer exists.
 *   2. Put every Basic-side account on perpetual free Basic (active, endsAt=null)
 *      — mirrors subscriptionService.initFreeBasic.
 *
 * LEFT UNTOUCHED: platform admins (role 'admin'), Pro lawyers (role
 * 'admin_user'), and sub-seats (role 'sub_seat'). Pro pilots keep their 180-day
 * subscription; sub-seats inherit from their parent.
 *
 * Usage:
 *   node scripts/reset-users-free-basic.js --dry-run   # preview counts only
 *   node scripts/reset-users-free-basic.js             # apply
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const FREE_BASIC_SUB = {
  plan: 'basic',
  cycle: null,
  status: 'active',
  endsAt: null,            // perpetual — free forever
  durationDays: null,
  autoRenew: false,
  amountEur: 0,
  paidVia: null,
  invoiceNumber: null,
  approvedBy: null,
  approvedAt: null,
  remindersSent: [],
  notes: 'free-basic (reset script)',
  requestedAt: null,
  requestedPlan: null,
  requestedCycle: null,
  gracePeriod: { used: false, startedAt: null, endsAt: null, triggeredBy: null },
  trial: false
};

// Basic side = everyone who is NOT a platform admin, Pro lawyer, or sub-seat.
const BASIC_FILTER = { role: { $nin: ['admin', 'admin_user', 'sub_seat'] } };

async function run(dryRun) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to database');
    const users = client.db().collection('users');

    const totalUsers = await users.countDocuments({});
    const flagged = await users.countDocuments({ needsTierOnboarding: true });
    const basicCount = await users.countDocuments(BASIC_FILTER);
    const proCount = await users.countDocuments({ role: 'admin_user' });

    console.log(`\n📋 Users total: ${totalUsers}`);
    console.log(`   needsTierOnboarding=true to clear: ${flagged}`);
    console.log(`   Basic-side accounts → free-forever Basic: ${basicCount}`);
    console.log(`   Pro (admin_user) left untouched: ${proCount}`);

    if (dryRun) {
      console.log('\n(dry run — no changes written). Re-run without --dry-run to apply.');
      return;
    }

    const now = new Date();

    const clearFlag = await users.updateMany(
      { needsTierOnboarding: { $ne: false } },
      { $set: { needsTierOnboarding: false, updatedAt: now } }
    );
    console.log(`\n✅ Cleared needsTierOnboarding on ${clearFlag.modifiedCount} user(s).`);

    const resetBasic = await users.updateMany(
      BASIC_FILTER,
      { $set: { subscription: { ...FREE_BASIC_SUB, startedAt: now }, updatedAt: now } }
    );
    console.log(`✅ Reset ${resetBasic.modifiedCount} Basic account(s) to perpetual free Basic.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

run(process.argv.includes('--dry-run'));
