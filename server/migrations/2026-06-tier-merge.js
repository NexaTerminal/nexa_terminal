/**
 * Migration — collapse the 3-plan model into two tiers (Basic + Pro).
 *
 *   standard            → basic   (role stays standard_user)
 *   admin_5 / admin_10  → pro      (role admin_user, superUser.seatLimit = 25)
 *   intendedPlan: same remap (so trial sidebar intent resolves correctly)
 *   sub_seat docs       → seatType: 'coworker'  (today's sub-seats are co-workers)
 *
 * Active 8-day trials are LEFT UNTOUCHED — they ride out to their endsAt.
 *
 * SAFE BY DEFAULT: dry-run (read-only) unless `--apply` is passed.
 *
 *   node server/migrations/2026-06-tier-merge.js            # dry-run report
 *   node server/migrations/2026-06-tier-merge.js --apply    # write changes
 *
 * Idempotent: re-running after apply reports 0 changes.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');
const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || null;

const steps = [
  {
    label: "standard → basic (plan)",
    filter: { 'subscription.plan': 'standard' },
    update: { $set: { 'subscription.plan': 'basic' } }
  },
  {
    label: "admin_5 / admin_10 → pro (plan + role + 25 seats)",
    filter: { 'subscription.plan': { $in: ['admin_5', 'admin_10'] } },
    update: { $set: { 'subscription.plan': 'pro', role: 'admin_user', 'superUser.seatLimit': 25 } }
  },
  {
    label: "intendedPlan: standard → basic",
    filter: { intendedPlan: 'standard' },
    update: { $set: { intendedPlan: 'basic' } }
  },
  {
    label: "intendedPlan: admin_5 / admin_10 → pro",
    filter: { intendedPlan: { $in: ['admin_5', 'admin_10'] } },
    update: { $set: { intendedPlan: 'pro' } }
  },
  {
    label: "sub_seat → seatType: 'coworker'",
    filter: { role: 'sub_seat', seatType: { $exists: false } },
    update: { $set: { seatType: 'coworker' } }
  }
];

async function main() {
  if (!URI) { console.error('✗ MONGODB_URI not set in server/.env'); process.exit(1); }

  const client = new MongoClient(URI);
  await client.connect();
  const db = DB_NAME ? client.db(DB_NAME) : client.db();
  const users = db.collection('users');

  console.log(`\nDB: ${db.databaseName}`);
  console.log(APPLY ? '⚠️  APPLY MODE — writing changes\n' : '🔍 DRY RUN — no writes (pass --apply to write)\n');

  // Snapshot current plan distribution for context.
  const dist = await users.aggregate([
    { $group: { _id: '$subscription.plan', n: { $sum: 1 } } },
    { $sort: { n: -1 } }
  ]).toArray();
  console.log('Current subscription.plan distribution:');
  dist.forEach(d => console.log(`  ${String(d._id)}: ${d.n}`));
  console.log('');

  let total = 0;
  for (const step of steps) {
    const matched = await users.countDocuments(step.filter);
    total += matched;
    if (APPLY && matched > 0) {
      const r = await users.updateMany(step.filter, step.update);
      console.log(`  ✓ ${step.label} — matched ${matched}, modified ${r.modifiedCount}`);
    } else {
      console.log(`  ${matched > 0 ? '•' : ' '} ${step.label} — ${matched} doc(s) ${APPLY ? 'modified' : 'would change'}`);
    }
  }

  console.log(`\n${APPLY ? 'Applied' : 'Would touch'} ${total} change(s) across ${steps.length} steps.`);
  if (!APPLY && total > 0) console.log('Re-run with --apply to write.');

  await client.close();
}

main().catch(e => { console.error('Migration failed:', e); process.exit(2); });
