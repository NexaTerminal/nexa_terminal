/**
 * Auto-Verify Complete Profiles Migration Script
 *
 * This script automatically verifies users who have complete company data
 * but are currently marked as isVerified: false
 *
 * Run this script ONCE after deploying the email verification removal changes
 *
 * Usage:
 *   node server/scripts/auto-verify-complete-profiles.js
 *
 * Date: 2025-11-29
 * Purpose: Transition from email verification to company data completion only
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection URL from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';

/**
 * Check if user has all required company fields
 */
function hasCompleteCompanyInfo(user) {
  return !!(
    user.companyInfo &&
    user.companyInfo.companyName &&
    (user.companyInfo.companyAddress || user.companyInfo.address) &&
    (user.companyInfo.companyTaxNumber || user.companyInfo.taxNumber) &&
    (user.companyInfo.companyManager || user.companyManager) &&
    user.officialEmail
  );
}

/**
 * Main migration function
 */
async function migrateUsers() {
  let client;

  try {
    console.log('🚀 Starting auto-verification migration...\n');

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find all users who are NOT verified
    const unverifiedUsers = await usersCollection.find({
      $or: [
        { isVerified: false },
        { isVerified: { $exists: false } }
      ]
    }).toArray();

    console.log(`📊 Found ${unverifiedUsers.length} unverified users\n`);

    // Stats counters
    let autoVerifiedCount = 0;
    let incompleteCount = 0;
    const autoVerifiedUsers = [];
    const incompleteUsers = [];

    // Process each unverified user
    for (const user of unverifiedUsers) {
      const hasComplete = hasCompleteCompanyInfo(user);

      if (hasComplete) {
        // Auto-verify this user
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              isVerified: true,
              verificationStatus: 'approved',
              updatedAt: new Date()
            }
          }
        );

        autoVerifiedCount++;
        autoVerifiedUsers.push({
          username: user.username,
          email: user.email || user.officialEmail,
          companyName: user.companyInfo?.companyName
        });

        console.log(`✅ Auto-verified: ${user.username} (${user.companyInfo?.companyName})`);
      } else {
        incompleteCount++;
        incompleteUsers.push({
          username: user.username,
          email: user.email || user.officialEmail,
          missingFields: {
            companyName: !user.companyInfo?.companyName,
            address: !(user.companyInfo?.companyAddress || user.companyInfo?.address),
            taxNumber: !(user.companyInfo?.companyTaxNumber || user.companyInfo?.taxNumber),
            companyManager: !(user.companyInfo?.companyManager || user.companyManager),
            officialEmail: !user.officialEmail
          }
        });

        console.log(`⚠️  Incomplete: ${user.username} - missing required fields`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Auto-verified: ${autoVerifiedCount} users`);
    console.log(`⚠️  Incomplete profiles: ${incompleteCount} users`);
    console.log(`📝 Total processed: ${unverifiedUsers.length} users`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show details of incomplete users
    if (incompleteUsers.length > 0) {
      console.log('ℹ️  Users with incomplete profiles:');
      incompleteUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.email})`);
        const missing = Object.entries(user.missingFields)
          .filter(([_, isMissing]) => isMissing)
          .map(([field]) => field);
        console.log(`     Missing: ${missing.join(', ')}`);
      });
      console.log('\n');
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Users with complete company data now have access to all features');
    console.log('2. Users with incomplete profiles will be auto-verified when they complete their data');
    console.log('3. No email verification required anymore\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsers, hasCompleteCompanyInfo };
