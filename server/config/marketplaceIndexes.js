/**
 * Simplified database indexes for marketplace collections
 * Only service providers collection with predefined categories
 */

/**
 * Helper function to create index safely (ignore if already exists)
 */
async function createIndexSafely(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
    return true;
  } catch (error) {
    if (error.code === 85 || error.code === 86 || error.codeName === 'IndexOptionsConflict' || error.codeName === 'IndexKeySpecsConflict') {
      // Index already exists with different options - try to recreate
      console.log('  🔄 Dropping and recreating index due to options/spec conflict');
      try {
        await collection.dropIndex(keys);
        await collection.createIndex(keys, options);
        return true;
      } catch (dropError) {
        console.log('  ⚠️ Could not recreate index, continuing...', dropError.message);
        return false;
      }
    }
    // Re-throw other errors
    throw error;
  }
}

async function createMarketplaceIndexes(db) {
  console.log('🔍 Creating simplified marketplace database indexes...');

  try {
    const serviceProviders = db.collection('service_providers');

    // Service Providers indexes (simplified)
    console.log('  📋 Creating service_providers indexes...');
    await createIndexSafely(serviceProviders, { userId: 1 }, { name: 'userId_performance_index' }); // Performance index, allows multiple null values
    await createIndexSafely(serviceProviders, { email: 1 }, { unique: true });
    await createIndexSafely(serviceProviders, { isActive: 1 });
    await createIndexSafely(serviceProviders, { serviceCategory: 1 });
    await createIndexSafely(serviceProviders, { 'location.city': 1, 'location.servesRemote': 1 });
    await createIndexSafely(serviceProviders, { createdAt: -1 });
    await createIndexSafely(serviceProviders, { viewCount: -1 });

    // Compound indexes for search queries
    console.log('  📋 Creating compound indexes...');
    await createIndexSafely(serviceProviders, {
      isActive: 1,
      serviceCategory: 1,
      'location.servesRemote': 1
    });

    await createIndexSafely(serviceProviders, {
      serviceCategory: 1,
      isActive: 1,
      'location.city': 1
    });

    console.log('✅ Simplified marketplace indexes created successfully');
    return true;

  } catch (error) {
    console.error('❌ Error creating marketplace indexes:', error);
    // Don't throw error, just log it - indexes are not critical for basic functionality
    return false;
  }
}

/**
 * No service categories initialization needed
 * Categories are now predefined in the schemas file
 */
async function initializeServiceCategories(db) {
  console.log('🏪 Service categories are now predefined (no database initialization needed)');
  return true;
}

/**
 * Setup TTL (Time To Live) indexes for automatic cleanup
 * Only for service providers lastActiveAt field
 */
async function setupTTLIndexes(db) {
  console.log('⏰ Setting up simplified TTL indexes...');

  try {
    const serviceProviders = db.collection('service_providers');

    // Optional: Auto-expire inactive providers after 2 years
    // (Only if lastActiveAt is set and they haven't been active)
    try {
      await serviceProviders.createIndex(
        { lastActiveAt: 1 },
        {
          expireAfterSeconds: 2 * 365 * 24 * 60 * 60, // 2 years
          partialFilterExpression: {
            isActive: false,
            lastActiveAt: { $exists: true }
          },
          name: 'inactive_providers_ttl'
        }
      );
      console.log('  ✅ Created TTL index for inactive providers');
    } catch (error) {
      if (error.code === 85) { // IndexOptionsConflict
        console.log('  ⏭️  TTL index for inactive providers already exists');
      } else {
        throw error;
      }
    }

    console.log('✅ Simplified TTL indexes configured successfully');
    return true;

  } catch (error) {
    console.error('❌ Error setting up TTL indexes:', error);
    // Don't throw error, just log it - TTL indexes are not critical for basic functionality
    return false;
  }
}

/**
 * Main function to initialize simplified marketplace database structures
 */
async function initializeMarketplaceDatabase(db) {
  console.log('🚀 Initializing simplified marketplace database...');

  try {
    await createMarketplaceIndexes(db);
    await initializeServiceCategories(db);
    await setupTTLIndexes(db);

    console.log('🎉 Simplified marketplace database initialization complete!');
    return true;

  } catch (error) {
    console.error('💥 Failed to initialize marketplace database:', error);
    throw error;
  }
}

module.exports = {
  createMarketplaceIndexes,
  initializeServiceCategories,
  setupTTLIndexes,
  initializeMarketplaceDatabase
};