/**
 * Database Fix Script: Revoke Verification for Users with Incomplete Company Info
 *
 * This script identifies users who have isVerified: true but are missing required
 * company information, and sets their verification status back to false.
 *
 * Required fields for verification:
 * - companyInfo.companyName
 * - companyInfo.companyAddress (or companyInfo.address)
 * - companyInfo.companyTaxNumber (or companyInfo.taxNumber)
 * - companyManager (or companyInfo.companyManager)
 * - officialEmail
 *
 * Run this script with: node server/scripts/fix-incomplete-verified-users.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function fixIncompleteVerifiedUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find all verified users
    const verifiedUsers = await usersCollection.find({
      isVerified: true
    }).toArray();

    console.log(`\nFound ${verifiedUsers.length} verified users`);

    let fixedCount = 0;
    const incompleteUsers = [];

    for (const user of verifiedUsers) {
      // Check if all required fields are present and not empty
      const requiredFields = {
        companyName: user.companyInfo?.companyName,
        companyAddress: user.companyInfo?.companyAddress || user.companyInfo?.address,
        companyTaxNumber: user.companyInfo?.companyTaxNumber || user.companyInfo?.taxNumber,
        companyManager: user.companyInfo?.companyManager || user.companyManager,
        officialEmail: user.officialEmail
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || !value.trim())
        .map(([key]) => key);

      if (missingFields.length > 0) {
        incompleteUsers.push({
          userId: user._id,
          username: user.username,
          email: user.email || user.officialEmail,
          missingFields
        });

        // Revoke verification status
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              isVerified: false,
              verificationStatus: 'incomplete',
              emailVerified: user.emailVerified || false, // Keep email verification if it exists
              updatedAt: new Date()
            }
          }
        );

        fixedCount++;
        console.log(`\n❌ Revoked verification for user: ${user.username || user._id}`);
        console.log(`   Missing fields: ${missingFields.join(', ')}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`   Total verified users: ${verifiedUsers.length}`);
    console.log(`   Users with incomplete info: ${fixedCount}`);
    console.log(`   Users with complete info: ${verifiedUsers.length - fixedCount}`);
    console.log(`${'='.repeat(60)}\n`);

    if (fixedCount > 0) {
      console.log('✅ Verification status revoked for users with incomplete company information');
      console.log('\nAffected users:');
      incompleteUsers.forEach((u, index) => {
        console.log(`\n${index + 1}. ${u.username} (${u.email})`);
        console.log(`   Missing: ${u.missingFields.join(', ')}`);
      });
      console.log('\nThese users will need to:');
      console.log('1. Complete all required company information');
      console.log('2. Go through the email verification process again');
    } else {
      console.log('✅ All verified users have complete company information');
    }

  } catch (error) {
    console.error('❌ Error fixing incomplete verified users:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
fixIncompleteVerifiedUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
