/**
 * One-off cleanup: delete every promo code EXCEPT the keeper, so only one
 * founder link stays live. Works against whatever MONGODB_URI points at.
 *
 * Usage (from the server/ dir):
 *   node scripts/keep-only-code.js                 # keeps PROMO-FOUNDER-PRO
 *   node scripts/keep-only-code.js MY-CODE         # keeps MY-CODE
 *   node scripts/keep-only-code.js PROMO-FOUNDER-PRO --dry   # preview only
 *
 * Safety: aborts if the keeper code doesn't exist (guards against a typo that
 * would otherwise wipe every code).
 */
const { MongoClient } = require('mongodb');
require('dotenv').config();

const KEEP = (process.argv[2] || 'PROMO-FOUNDER-PRO').trim().toUpperCase();
const DRY = process.argv.includes('--dry');

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db().collection('promo_codes');

    const all = await col.find({}).project({ code: 1, plan: 1, active: 1 }).toArray();
    console.log(`Found ${all.length} code(s):`);
    all.forEach((c) => console.log(`  - ${c.code}  [${c.plan}${c.active ? '' : ', inactive'}]`));

    const keeper = all.find((c) => String(c.code).toUpperCase() === KEEP);
    if (!keeper) {
      console.error(`\n❌ Keeper "${KEEP}" not found — aborting (nothing deleted).`);
      process.exitCode = 1;
      return;
    }

    const toDelete = all.filter((c) => String(c.code).toUpperCase() !== KEEP).map((c) => c.code);
    if (toDelete.length === 0) {
      console.log(`\n✅ Only "${KEEP}" exists already — nothing to do.`);
      return;
    }

    console.log(`\n${DRY ? '[DRY RUN] would delete' : 'Deleting'} ${toDelete.length} code(s): ${toDelete.join(', ')}`);
    if (DRY) return;

    const res = await col.deleteMany({ code: { $in: toDelete } });
    console.log(`✅ Deleted ${res.deletedCount}. Only "${KEEP}" remains active.`);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
})();
