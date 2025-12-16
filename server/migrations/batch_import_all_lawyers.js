/**
 * Batch Import Script: Import All Lawyers from 31 Excel Files
 * Processes all lawyer files in the service_providers directory
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { OFFICIAL_CITIES, normalizeLocation } = require('./standardize_locations');

// Directory containing all lawyer Excel files
const LAWYERS_DIR = path.join(__dirname, '../../service_providers/service providers (lawyers)');

// Helper function to clean and combine values
function cleanValue(value) {
  if (!value || value === 'nan' || value === 'NaN' || value === 'null') {
    return '';
  }
  return String(value).trim();
}

function extractFromRow(row, possibleKeys) {
  const values = [];
  for (const key of possibleKeys) {
    const matchingKey = Object.keys(row).find(k =>
      k.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(k.toLowerCase())
    );

    if (matchingKey) {
      const val = cleanValue(row[matchingKey]);
      if (val) values.push(val);
    }
  }
  return values.join(', ');
}

async function batchImportAllLawyers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);

  try {
    console.log('🚀 BATCH IMPORT: All Lawyers from 31 Cities');
    console.log('═'.repeat(80));

    // Verify directory exists
    if (!fs.existsSync(LAWYERS_DIR)) {
      throw new Error(`Directory not found: ${LAWYERS_DIR}`);
    }

    // Get all Excel files
    const files = fs.readdirSync(LAWYERS_DIR).filter(f => f.endsWith('.xlsx'));
    console.log(`📁 Found ${files.length} Excel files to process\n`);

    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const collection = db.collection('service_providers');

    // Track overall statistics
    const overallStats = {
      filesProcessed: 0,
      filesSkipped: 0,
      totalAdded: 0,
      totalSkipped: 0,
      totalErrors: 0,
      cityStats: {}
    };

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filepath = path.join(LAWYERS_DIR, filename);

      console.log(`\n[${ i + 1}/${files.length}] Processing: ${filename}`);
      console.log('─'.repeat(80));

      try {
        // Read Excel file
        const workbook = XLSX.readFile(filepath);
        const sheetName = workbook.SheetNames[0];
        const records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (records.length === 0) {
          console.log('  ⚠️  Empty file, skipping');
          overallStats.filesSkipped++;
          continue;
        }

        // Extract city from first row
        const cityFromFile = records[0]['ГРАД'];
        if (!cityFromFile) {
          console.log('  ❌ No ГРАД column found, skipping');
          overallStats.filesSkipped++;
          continue;
        }

        // Normalize city name
        const normalizedCity = normalizeLocation(cityFromFile);
        if (!normalizedCity) {
          console.log(`  ❌ Invalid city "${cityFromFile}", skipping`);
          overallStats.filesSkipped++;
          continue;
        }

        console.log(`  📍 City: ${normalizedCity} (${records.length} records)`);

        // Initialize city stats
        if (!overallStats.cityStats[normalizedCity]) {
          overallStats.cityStats[normalizedCity] = {
            added: 0,
            skipped: 0,
            errors: 0
          };
        }

        // Process each lawyer in the file
        let fileAdded = 0;
        let fileSkipped = 0;
        let fileErrors = 0;

        for (const row of records) {
          try {
            // Extract name
            const name = extractFromRow(row, [
              'ИМЕ И ПРЕЗИМЕ',
              'име и презиме',
              'NAME',
              'name'
            ]);

            if (!name) {
              fileSkipped++;
              continue;
            }

            // Extract email
            const email = extractFromRow(row, [
              'Е-МАИЛ',
              'е-маил',
              'E-MAIL',
              'EMAIL',
              'email'
            ]);

            // Extract phone
            const phone = extractFromRow(row, [
              'ТЕЛЕФОН',
              'телефон',
              'МОБИЛЕН',
              'мобилен',
              'PHONE',
              'phone'
            ]);

            // Skip if no email (can't contact them)
            if (!email) {
              fileSkipped++;
              continue;
            }

            // Check if already exists
            const existing = await collection.findOne({
              $or: [
                { email: email },
                { name: name, phone: phone }
              ]
            });

            if (existing) {
              fileSkipped++;
              continue;
            }

            // Prepare document
            const document = {
              name: name,
              email: email,
              phone: phone || '',
              website: '',
              serviceCategory: 'legal',
              location: normalizedCity,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            // Insert
            await collection.insertOne(document);
            fileAdded++;

          } catch (error) {
            fileErrors++;
            console.log(`    ⚠️  Error processing row: ${error.message}`);
          }
        }

        // Update statistics
        overallStats.filesProcessed++;
        overallStats.totalAdded += fileAdded;
        overallStats.totalSkipped += fileSkipped;
        overallStats.totalErrors += fileErrors;
        overallStats.cityStats[normalizedCity].added += fileAdded;
        overallStats.cityStats[normalizedCity].skipped += fileSkipped;
        overallStats.cityStats[normalizedCity].errors += fileErrors;

        console.log(`  ✅ Added: ${fileAdded} | ⏭️  Skipped: ${fileSkipped} | ❌ Errors: ${fileErrors}`);

      } catch (error) {
        console.log(`  ❌ File error: ${error.message}`);
        overallStats.filesSkipped++;
      }
    }

    // Final report
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('📊 BATCH IMPORT COMPLETE - FINAL REPORT');
    console.log('═'.repeat(80));
    console.log(`\n📁 Files Summary:`);
    console.log(`  Total files: ${files.length}`);
    console.log(`  Successfully processed: ${overallStats.filesProcessed}`);
    console.log(`  Skipped/Errors: ${overallStats.filesSkipped}`);

    console.log(`\n👥 Lawyers Summary:`);
    console.log(`  Total added: ${overallStats.totalAdded}`);
    console.log(`  Total skipped (duplicates/no email): ${overallStats.totalSkipped}`);
    console.log(`  Total errors: ${overallStats.totalErrors}`);

    console.log(`\n🏙️  Distribution by City:`);
    const sortedCities = Object.entries(overallStats.cityStats)
      .sort((a, b) => b[1].added - a[1].added);

    sortedCities.forEach(([city, stats]) => {
      console.log(`  ${city.padEnd(25)} → Added: ${String(stats.added).padStart(3)} | Skipped: ${String(stats.skipped).padStart(3)}`);
    });

    // Final database count
    const totalInDb = await collection.countDocuments({ serviceCategory: 'legal' });
    console.log(`\n📊 Total lawyers in database: ${totalInDb}`);

    console.log('\n🎉 Batch import completed successfully!');
    console.log('═'.repeat(80));

    return overallStats;

  } catch (error) {
    console.error('❌ Batch import failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run batch import if called directly
if (require.main === module) {
  batchImportAllLawyers()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = batchImportAllLawyers;
