/**
 * Set a user's plan (remediation for accounts mis-stamped at signup).
 *
 * Before the identity chooser landed, the plan was inferred from the signup
 * domain — so a lawyer who signed up on nexa.mk was recorded as Basic and could
 * never see Случаи/Предмети. This flips such an account to the correct plan:
 * updates plan + role + seatLimit and (for Pro) seeds the superUser sub-doc,
 * while PRESERVING the current subscription window (endsAt) — we don't restart
 * their trial.
 *
 * Usage:
 *   node scripts/set-user-plan.js <email|username> <basic|pro>
 *   node scripts/set-user-plan.js --audit        # list Basic accounts that look like providers
 *
 * Works against whatever MONGODB_URI points at (local or Atlas).
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const { roleForPlan, seatsForPlan, canonicalPlan, isValidPlan } = require('../constants/roles');

// Heuristics for spotting provider-type accounts wrongly sitting on Basic.
const PROVIDER_HINTS = /advokat|adwokat|адвокат|lawyer|law|notar|нотар|smetkovod|сметковод|accountant|pravnik|правник|konsalting|консалтинг/i;

async function withDb(fn) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to database');
    await fn(client.db().collection('users'));
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

async function audit() {
  await withDb(async (users) => {
    const candidates = await users.find({
      role: { $in: ['standard_user', 'user'] },
      $or: [
        { email: { $regex: PROVIDER_HINTS } },
        { username: { $regex: PROVIDER_HINTS } },
        { 'companyInfo.companyName': { $regex: PROVIDER_HINTS } },
        { 'companyInfo.businessActivity': { $regex: PROVIDER_HINTS } },
        { 'companyInfo.industry': { $regex: PROVIDER_HINTS } }
      ]
    }, {
      projection: { email: 1, username: 1, role: 1, 'companyInfo.companyName': 1, 'subscription.plan': 1 }
    }).toArray();

    if (!candidates.length) {
      console.log('\n📋 No provider-looking Basic accounts found.');
      return;
    }
    console.log(`\n📋 ${candidates.length} Basic account(s) that look like providers — review and re-classify with:\n   node scripts/set-user-plan.js <email> pro\n`);
    candidates.forEach(u => {
      console.log(`  - ${u.email || u.username}  |  ${u.companyInfo?.companyName || '—'}  |  plan=${u.subscription?.plan || '—'}`);
    });
  });
}

async function setPlan(identifier, planArg) {
  const plan = canonicalPlan(planArg);
  if (!isValidPlan(plan)) {
    console.error(`❌ Invalid plan "${planArg}". Use "basic" or "pro".`);
    process.exit(1);
  }
  await withDb(async (users) => {
    const idLower = String(identifier).trim().toLowerCase();
    const user = await users.findOne({ $or: [{ email: idLower }, { username: idLower }] });
    if (!user) {
      console.error(`❌ User not found: ${identifier}`);
      process.exit(1);
    }

    const newRole = roleForPlan(plan);
    const newSeats = seatsForPlan(plan);

    const set = {
      role: newRole,
      intendedPlan: plan,
      updatedAt: new Date()
    };
    // Only touch the plan label if a subscription already exists — preserve its
    // status + endsAt (don't restart the trial / paid window).
    if (user.subscription) set['subscription.plan'] = plan;

    // Seed superUser seat limit for Pro so the Team / leads surfaces work.
    if (newRole === 'admin_user') {
      set.superUser = {
        seatLimit: newSeats,
        practiceAreas: user.superUser?.practiceAreas || [],
        cities: user.superUser?.cities || [],
        topicsSlotsPerQuarter: user.superUser?.topicsSlotsPerQuarter ?? 2,
        blogPostsPerMonth: user.superUser?.blogPostsPerMonth ?? 1,
        lastAssignedAt: user.superUser?.lastAssignedAt ?? null
      };
    }

    await users.updateOne({ _id: user._id }, { $set: set });
    const after = await users.findOne({ _id: user._id }, {
      projection: { email: 1, username: 1, role: 1, intendedPlan: 1, 'subscription.plan': 1, 'subscription.status': 1, 'subscription.endsAt': 1 }
    });
    console.log(`\n✅ ${user.email || user.username} → ${plan.toUpperCase()} (role ${newRole})`);
    console.log('📋 After:', after);
  });
}

const [arg1, arg2] = process.argv.slice(2);
if (arg1 === '--audit') {
  audit();
} else if (arg1 && arg2) {
  setPlan(arg1, arg2);
} else {
  console.log('Usage:');
  console.log('  node scripts/set-user-plan.js <email|username> <basic|pro>');
  console.log('  node scripts/set-user-plan.js --audit');
  process.exit(1);
}
