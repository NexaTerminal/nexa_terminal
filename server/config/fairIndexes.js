/**
 * Database indexes for the Виртуелен саем (Virtual Fair) collection.
 * One booth per user (unique userId), plus list/search support.
 */

const { COLLECTION } = require('./fairSchemas');

async function createIndexSafely(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
    return true;
  } catch (error) {
    if (error.code === 85 || error.code === 86 || error.codeName === 'IndexOptionsConflict' || error.codeName === 'IndexKeySpecsConflict') {
      try {
        await collection.dropIndex(keys);
        await collection.createIndex(keys, options);
        return true;
      } catch (dropError) {
        console.log('  ⚠️ Could not recreate fair index, continuing...', dropError.message);
        return false;
      }
    }
    throw error;
  }
}

async function initializeFairDatabase(db) {
  console.log('🎪 Initializing virtual fair database...');
  try {
    const booths = db.collection(COLLECTION);
    await createIndexSafely(booths, { userId: 1 }, { unique: true, name: 'fair_userId_unique' });
    await createIndexSafely(booths, { status: 1, 'offers.type': 1 });
    await createIndexSafely(booths, { status: 1, publishedAt: -1 });
    // Stale text index from an earlier schema (companyName+tagline) — drop if present.
    // Search uses case-insensitive regex over companyName/offers.text, no $text index needed.
    try { await booths.dropIndex('fair_text_search'); } catch (_) { /* not present */ }
    console.log('✅ Virtual fair indexes created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating fair indexes (continuing):', error.message);
    return false;
  }
}

module.exports = { initializeFairDatabase };
