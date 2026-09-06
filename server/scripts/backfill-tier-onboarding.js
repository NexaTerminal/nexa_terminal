/**
 * Backfill: ask existing active users to confirm their account type.
 *
 * Accounts created before the identity chooser had their plan guessed from the
 * signup domain. This flips `needsTierOnboarding = true` on active users so the
 * TierOnboardingModal asks them, once, to confirm Basic vs Pro on next login
 * (the modal pre-selects their CURRENT plan, so it's a confirm — and Pro users
 * without a licence on file get prompted to add their Број на лиценца / ЕМБС).
 *
 * Excluded: platform admins and sub-seats (they inherit / don't self-identify),
 * suspended accounts, and anyone already flagged.
 *
 * Usage:
 *   node scripts/backfill-tier-onboarding.js --dry-run   # preview counts only
 *   node scripts/backfill-tier-onboarding.js             # apply
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run(dryRun) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to database');
    const users = client.db().collection('users');

    // Active, self-identifying accounts that aren't already flagged.
    const filter = {
      role: { $nin: ['admin', 'sub_seat'] },
      isActive: { $ne: false },
      needsTierOnboarding: { $ne: true }
    };

    const total = await users.countDocuments(filter);
    const proish = await users.countDocuments({ ...filter, $or: [{ role: 'admin_user' }, { 'subscription.plan': 'pro' }] });
    console.log(`\n📋 Matching active users: ${total}  (currently look like Pro: ${proish}, Basic/other: ${total - proish})`);

    if (dryRun) {
      console.log('\n(dry run — no changes written). Re-run without --dry-run to apply.');
      return;
    }

    const res = await users.updateMany(filter, {
      $set: { needsTierOnboarding: true, updatedAt: new Date() }
    });
    console.log(`\n✅ Flagged ${res.modifiedCount} user(s). They'll confirm their account type on next login.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

run(process.argv.includes('--dry-run'));
