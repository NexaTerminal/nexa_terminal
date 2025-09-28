/**
 * Script to grant admin privileges to a user
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';

async function makeUserAdmin() {
  console.log('🔧 Making user admin...\n');

  let client;
  try {
    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const users = db.collection('users');

    // List all users
    console.log('\n2️⃣ Finding users...');
    const allUsers = await users.find({}, {
      projection: {
        username: 1,
        email: 1,
        isAdmin: 1,
        role: 1,
        'companyInfo.companyName': 1
      }
    }).toArray();

    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.username || 'No username'} - ${user.email} - ${user.companyInfo?.companyName || 'No company'} - Admin: ${user.isAdmin || user.role === 'admin' ? 'YES' : 'NO'}`);
    });

    if (allUsers.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // Find the most recently created user (likely the test user)
    const latestUser = allUsers.sort((a, b) => new Date(b._id.getTimestamp()) - new Date(a._id.getTimestamp()))[0];

    console.log(`\n3️⃣ Making latest user admin: ${latestUser.email}`);

    // Update user to have admin privileges
    const result = await users.updateOne(
      { _id: latestUser._id },
      {
        $set: {
          isAdmin: true,
          role: 'admin',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ User successfully granted admin privileges!');
      console.log(`Admin user: ${latestUser.email}`);
    } else {
      console.log('⚠️ User was not updated (maybe already admin?)');
    }

    // Verify the change
    console.log('\n4️⃣ Verifying admin status...');
    const updatedUser = await users.findOne({ _id: latestUser._id });
    console.log(`User ${updatedUser.email} - isAdmin: ${updatedUser.isAdmin}, role: ${updatedUser.role}`);

  } catch (error) {
    console.error('❌ Error making user admin:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
makeUserAdmin().then(() => {
  console.log('\n🏁 Admin setup completed!');
  console.log('💡 Now try accessing the admin panel again');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});