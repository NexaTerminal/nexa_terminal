// server/migrations/add-credits-to-users.js

/**
 * Migration: Add Credits to Existing Users
 *
 * This migration adds the credit system fields to all existing users who don't have them yet.
 * Each user will receive:
 * - 14 credits (initial balance)
 * - Weekly allocation of 14
 * - Initialized referral system fields
 *
 * Run this migration ONCE after deploying the credit system.
 */

require('dotenv').config({ path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env' });
const { MongoClient } = require('mongodb');
const creditConfig = require('../config/creditConfig');

async function migrateCreditSystem() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa');

  try {
    console.log('🚀 Starting credit system migration...\n');

    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find all users without credits field
    const usersWithoutCredits = await usersCollection.find({
      credits: { $exists: false }
    }).toArray();

    console.log(`📊 Found ${usersWithoutCredits.length} users needing credit initialization\n`);

    if (usersWithoutCredits.length === 0) {
      console.log('✅ All users already have credits initialized!');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const user of usersWithoutCredits) {
      try {
        // Initialize credits for this user
        const result = await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              credits: {
                balance: creditConfig.WEEKLY_ALLOCATION,
                weeklyAllocation: creditConfig.WEEKLY_ALLOCATION,
                lastResetDate: new Date(),
                lifetimeEarned: creditConfig.WEEKLY_ALLOCATION,
                lifetimeSpent: 0
              },
              referralCode: null,
              referredBy: null,
              referrals: [],
              updatedAt: new Date()
            }
          }
        );

        if (result.modifiedCount > 0) {
          successCount++;
          console.log(`✅ Initialized credits for: ${user.username || user.email}`);

          // Create initial transaction record
          await db.collection('credit_transactions').insertOne({
            userId: user._id,
            type: 'INITIAL_CREDIT',
            amount: creditConfig.WEEKLY_ALLOCATION,
            balanceBefore: 0,
            balanceAfter: creditConfig.WEEKLY_ALLOCATION,
            metadata: {
              reason: 'Initial credit allocation during migration',
              migrationDate: new Date()
            },
            createdAt: new Date()
          });
        }

      } catch (error) {
        failCount++;
        console.error(`❌ Failed for ${user.username || user.email}:`, error.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Success: ${successCount} users`);
    console.log(`   ❌ Failed: ${failCount} users`);
    console.log(`   📊 Total: ${usersWithoutCredits.length} users\n`);

    // Create indexes for credit transactions
    console.log('🔧 Creating credit transaction indexes...');

    try {
      await db.collection('credit_transactions').createIndex({ userId: 1, createdAt: -1 });
      await db.collection('credit_transactions').createIndex({ createdAt: -1 });
      await db.collection('credit_transactions').createIndex({ type: 1 });
      console.log('✅ Credit transaction indexes created\n');
    } catch (error) {
      console.error('⚠️  Index creation warning:', error.message);
    }

    // Create index for referral codes
    console.log('🔧 Creating referral code index...');

    try {
      await usersCollection.createIndex(
        { referralCode: 1 },
        { unique: true, sparse: true, name: 'referralCode_unique_sparse' }
      );
      console.log('✅ Referral code index created\n');
    } catch (error) {
      console.error('⚠️  Referral index warning:', error.message);
    }

    console.log('🎉 Credit system migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCreditSystem()
    .then(() => {
      console.log('✅ Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateCreditSystem;
