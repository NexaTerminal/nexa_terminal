/**
 * Set Admin User Script
 * Usage: node scripts/set-admin.js email@example.com
 *
 * This script sets a user as admin by email address.
 * Works with both local and production (Atlas) databases.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function setAdmin(email) {
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/set-admin.js email@example.com');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('\n📋 Available users:');
      const allUsers = await usersCollection.find({}, { email: 1, role: 1 }).toArray();
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (role: ${u.role || 'user'})`);
      });
      process.exit(1);
    }

    // Update user to admin
    const result = await usersCollection.updateOne(
      { email },
      {
        $set: {
          role: 'admin',
          isAdmin: true,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Successfully set ${email} as admin`);
    } else {
      console.log(`ℹ️  User ${email} was already an admin`);
    }

    // Verify the change
    const updatedUser = await usersCollection.findOne(
      { email },
      { email: 1, role: 1, isAdmin: 1 }
    );
    console.log('\n📋 Updated user info:');
    console.log(updatedUser);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Get email from command line argument
const email = process.argv[2];
setAdmin(email);
