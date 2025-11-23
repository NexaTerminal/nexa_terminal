/**
 * Initialize credits for all existing users
 * Run this script once to add credits to users who don't have them yet
 *
 * Usage: node scripts/initialize-credits.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexa';
const DATABASE_NAME = 'nexa';

async function initializeCredits() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');

    // Find all users without credits field
    const usersWithoutCredits = await usersCollection.find({
      $or: [
        { credits: { $exists: false } },
        { credits: null },
        { 'credits.balance': { $exists: false } }
      ]
    }).toArray();

    console.log(`\n📊 Found ${usersWithoutCredits.length} users without credits\n`);

    if (usersWithoutCredits.length === 0) {
      console.log('✅ All users already have credits initialized!');
      return;
    }

    // Calculate next Monday 7am for reset date
    const getNextMonday7am = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // Days until next Monday

      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(7, 0, 0, 0); // Set to 7:00 AM

      return nextMonday;
    };

    const nextResetDate = getNextMonday7am();

    // Update each user
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutCredits) {
      try {
        const updateResult = await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              credits: {
                balance: 14,
                weeklyAllocation: 14,
                lastResetDate: new Date(),
                nextResetDate: nextResetDate,
                lifetimeEarned: 14,
                lifetimeSpent: 0
              }
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(`✅ Initialized credits for user: ${user.username || user.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to initialize credits for user ${user.username || user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully initialized: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📅 Next reset date: ${nextResetDate.toLocaleString('mk-MK')}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
initializeCredits()
  .then(() => {
    console.log('\n✨ Credit initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
