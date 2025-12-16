/**
 * Import Script: Add Skopje Lawyers to Service Providers
 * Imports lawyers from JSON file into service_providers collection
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function importLawyers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('service_providers');

    // Read the JSON file
    const jsonPath = '/Users/martinboshkoski/Desktop/untitled folder/skopje_lawyers_db.json';
    console.log(`📖 Reading lawyers from: ${jsonPath}`);

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const lawyers = JSON.parse(rawData);

    console.log(`📊 Found ${lawyers.length} lawyers to import`);

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const lawyer of lawyers) {
      try {
        // Check if this lawyer already exists (by email or name+phone)
        const existing = await collection.findOne({
          $or: [
            { email: lawyer.email },
            { name: lawyer.name, phone: lawyer.phone }
          ]
        });

        if (existing) {
          console.log(`  ⏭️  Skipped (already exists): ${lawyer.name} (${lawyer.email})`);
          skippedCount++;
          continue;
        }

        // Prepare the document
        const document = {
          name: lawyer.name,
          email: lawyer.email,
          phone: lawyer.phone,
          website: lawyer.website || '',
          serviceCategory: lawyer.serviceCategory || 'legal',
          location: lawyer.location || 'Скопје',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Insert the document
        await collection.insertOne(document);
        addedCount++;
        console.log(`  ✅ Added: ${lawyer.name} (${lawyer.email})`);

      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error adding ${lawyer.name}:`, error.message);
      }
    }

    console.log(`\n📈 Import Summary:`);
    console.log(`  Total lawyers in file: ${lawyers.length}`);
    console.log(`  Successfully added: ${addedCount}`);
    console.log(`  Skipped (duplicates): ${skippedCount}`);
    console.log(`  Errors: ${errorCount}`);

    // Show final count
    const totalCount = await collection.countDocuments();
    console.log(`\n📊 Total service providers in database: ${totalCount}`);

    console.log('\n🎉 Import completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

// Run import if called directly
if (require.main === module) {
  importLawyers()
    .then(() => {
      console.log('\n✅ Import script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Import script failed:', error);
      process.exit(1);
    });
}

module.exports = importLawyers;
