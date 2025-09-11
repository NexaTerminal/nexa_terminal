const { MongoClient } = require('mongodb');

// Migration script to move companyManager from root level to companyInfo
async function moveCompanyManagerToCompanyInfo() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for migration');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find all users who have companyManager at root level
    const usersWithRootCompanyManager = await usersCollection.find({
      companyManager: { $exists: true },
      $or: [
        { 'companyInfo.companyManager': { $exists: false } },
        { 'companyInfo.companyManager': '' }
      ]
    }).toArray();
    
    console.log(`Found ${usersWithRootCompanyManager.length} users with companyManager to migrate`);
    
    for (const user of usersWithRootCompanyManager) {
      console.log(`Migrating user ${user.username} (${user._id})`);
      
      // Prepare the update - move companyManager to companyInfo
      const updateDoc = {
        $set: {
          'companyInfo.companyManager': user.companyManager,
          'companyInfo.companyLogo': user.companyLogo || '' // Add empty companyLogo if doesn't exist
        },
        $unset: {
          companyManager: 1 // Remove from root level
        }
      };
      
      // If companyLogo exists at root level, move it and remove from root
      if (user.companyLogo) {
        updateDoc.$set['companyInfo.companyLogo'] = user.companyLogo;
        updateDoc.$unset.companyLogo = 1;
      }
      
      await usersCollection.updateOne(
        { _id: user._id },
        updateDoc
      );
      
      console.log(`✅ Migrated user ${user.username}`);
    }
    
    // Also ensure all users have companyLogo field in companyInfo
    const usersWithoutCompanyLogo = await usersCollection.find({
      'companyInfo.companyLogo': { $exists: false }
    }).toArray();
    
    console.log(`Adding companyLogo field to ${usersWithoutCompanyLogo.length} users`);
    
    for (const user of usersWithoutCompanyLogo) {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            'companyInfo.companyLogo': ''
          }
        }
      );
    }
    
    console.log('✅ Migration completed successfully');
    
    // Verify the migration
    const verificationCount = await usersCollection.countDocuments({
      'companyInfo.companyManager': { $exists: true }
    });
    
    const rootManagerCount = await usersCollection.countDocuments({
      companyManager: { $exists: true }
    });
    
    console.log(`Verification: ${verificationCount} users have companyManager in companyInfo`);
    console.log(`Verification: ${rootManagerCount} users still have companyManager at root level`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  require('dotenv').config();
  moveCompanyManagerToCompanyInfo()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = moveCompanyManagerToCompanyInfo;