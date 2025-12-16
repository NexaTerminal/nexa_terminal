/**
 * Migration: Simplify Service Provider Data Structure
 * Removes: description, location object → string, businessInfo,
 *          isActive, isVerified, viewCount, contactCount, lastActiveAt
 */

const { MongoClient } = require('mongodb');

async function simplifyServiceProviders() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('service_providers');

    // Get all service providers
    const providers = await collection.find({}).toArray();
    console.log(`📊 Found ${providers.length} service providers to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const provider of providers) {
      try {
        // Extract city from location object if it exists
        let cityString = '';
        if (typeof provider.location === 'string') {
          cityString = provider.location;
        } else if (provider.location && provider.location.city) {
          cityString = provider.location.city;
        } else if (provider.location && provider.location.town) {
          cityString = provider.location.town;
        }

        // Update document: set location as string, unset removed fields
        const result = await collection.updateOne(
          { _id: provider._id },
          {
            $set: {
              location: cityString,
              updatedAt: new Date()
            },
            $unset: {
              description: '',
              'location.region': '',
              'location.country': '',
              'location.servesRemote': '',
              businessInfo: '',
              isActive: '',
              isVerified: '',
              lastActiveAt: '',
              viewCount: '',
              contactCount: ''
            }
          }
        );

        if (result.modifiedCount > 0) {
          migratedCount++;
          console.log(`  ✅ Migrated: ${provider.name} (${provider.email})`);
        } else {
          console.log(`  ⏭️  Skipped (no changes needed): ${provider.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error migrating ${provider.name}:`, error.message);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`  Total providers: ${providers.length}`);
    console.log(`  Successfully migrated: ${migratedCount}`);
    console.log(`  Errors: ${errorCount}`);

    // Update indexes
    console.log(`\n🔍 Updating indexes...`);

    // Drop old indexes
    try {
      await collection.dropIndex('isActive_1');
      console.log('  ✅ Dropped isActive index');
    } catch (e) {
      console.log('  ⏭️  isActive index already removed or doesn\'t exist');
    }

    try {
      await collection.dropIndex('viewCount_-1');
      console.log('  ✅ Dropped viewCount index');
    } catch (e) {
      console.log('  ⏭️  viewCount index already removed or doesn\'t exist');
    }

    try {
      await collection.dropIndex('location.city_1_location.servesRemote_1');
      console.log('  ✅ Dropped old location compound index');
    } catch (e) {
      console.log('  ⏭️  Old location index already removed or doesn\'t exist');
    }

    try {
      // Drop compound indexes with isActive
      const indexes = await collection.indexes();
      for (const index of indexes) {
        if (index.name.includes('isActive') || index.name.includes('location.city')) {
          try {
            await collection.dropIndex(index.name);
            console.log(`  ✅ Dropped index: ${index.name}`);
          } catch (e) {
            console.log(`  ⏭️  Could not drop index ${index.name}: ${e.message}`);
          }
        }
      }
    } catch (e) {
      console.log('  ⏭️  Could not enumerate indexes for cleanup');
    }

    // Create new indexes
    await collection.createIndex({ location: 1 });
    console.log('  ✅ Created new location string index');

    await collection.createIndex({ serviceCategory: 1, location: 1 });
    console.log('  ✅ Created new compound index');

    console.log('\n🎉 Migration completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  simplifyServiceProviders()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = simplifyServiceProviders;
