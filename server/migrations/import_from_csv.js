/**
 * Excel/CSV Import Script: Import Service Providers from XLSX or CSV
 * Flexible script to import accountants, lawyers, consultants, etc.
 *
 * Usage:
 *   node migrations/import_from_csv.js <file_path> <category> <location>
 *
 * Example:
 *   node migrations/import_from_csv.js "/path/to/accountants.xlsx" "accounting" "Скопје"
 *   node migrations/import_from_csv.js "/path/to/lawyers.csv" "legal" "Битола"
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const XLSX = require('xlsx');
const { OFFICIAL_CITIES, normalizeLocation } = require('./standardize_locations');

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
    // Check exact match or partial match (case insensitive)
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

async function importFromCSV(filePath, serviceCategory, location) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);

  try {
    // Validate location against official cities list
    const normalizedLocation = normalizeLocation(location);
    if (!normalizedLocation) {
      throw new Error(`Invalid location "${location}". Must be one of the official Macedonian cities.`);
    }

    // Detect file type
    const fileExt = filePath.split('.').pop().toLowerCase();
    console.log(`📖 Reading ${fileExt.toUpperCase()} file: ${filePath}`);

    // Read and parse file (XLSX or CSV)
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`📊 Found ${records.length} records in file`);
    console.log(`🏷️  Category: ${serviceCategory}`);
    console.log(`📍 Location: ${normalizedLocation}${normalizedLocation !== location ? ` (normalized from "${location}")` : ''}`);

    // Show column names for reference
    if (records.length > 0) {
      console.log(`\n📋 Columns detected:`);
      Object.keys(records[0]).forEach((col, i) => {
        console.log(`   ${i + 1}. ${col}`);
      });
    }

    // Connect to MongoDB
    await client.connect();
    console.log('\n✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('service_providers');

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('\n🔄 Processing records...\n');

    for (const row of records) {
      try {
        // Extract name (try multiple possible column names)
        const name = extractFromRow(row, [
          'ИМЕ И ПРЕЗИМЕ',
          'име и презиме',
          'IME I PREZIME',
          'NAME',
          'name',
          'Name',
          'ИМЕ',
          'ПРЕЗИМЕ'
        ]);

        if (!name) {
          console.log(`  ⏭️  Skipped: No name found in row`);
          skippedCount++;
          continue;
        }

        // Extract email
        const email = extractFromRow(row, [
          'Е-МАИЛ',
          'е-маил',
          'E-MAIL',
          'EMAIL',
          'email',
          'Email'
        ]);

        // Extract phone
        const phone = extractFromRow(row, [
          'ТЕЛЕФОН',
          'телефон',
          'МОБИЛЕН',
          'мобилен',
          'PHONE',
          'phone',
          'Mobile',
          'MOBILE'
        ]);

        // Extract website
        const website = extractFromRow(row, [
          'веб страна',
          'ВЕБ СТРАНА',
          'website',
          'WEBSITE',
          'Website',
          'web'
        ]);

        // Check if already exists
        const existing = await collection.findOne({
          $or: [
            { email: email },
            { name: name, phone: phone }
          ]
        });

        if (existing) {
          console.log(`  ⏭️  Skipped (exists): ${name}`);
          skippedCount++;
          continue;
        }

        // Skip if no email (can't contact them)
        if (!email) {
          console.log(`  ⏭️  Skipped (no email): ${name}`);
          skippedCount++;
          continue;
        }

        // Prepare document
        const document = {
          name: name,
          email: email,
          phone: phone || '',
          website: website || '',
          serviceCategory: serviceCategory,
          location: normalizedLocation,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Insert
        await collection.insertOne(document);
        addedCount++;
        console.log(`  ✅ Added: ${name} (${email})`);

      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error processing row:`, error.message);
      }
    }

    // Summary
    console.log('\n📈 Import Summary:');
    console.log('─'.repeat(60));
    console.log(`  Total records in file: ${records.length}`);
    console.log(`  Successfully added: ${addedCount}`);
    console.log(`  Skipped (duplicates/no email): ${skippedCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log('─'.repeat(60));

    // Show final count
    const totalCount = await collection.countDocuments({ serviceCategory });
    console.log(`\n📊 Total ${serviceCategory} providers in database: ${totalCount}`);

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
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('❌ Usage: node import_from_csv.js <file_path> <category> <location>');
    console.log('\nSupports: .xlsx, .xls, .csv files');
    console.log('\nExamples:');
    console.log('  node migrations/import_from_csv.js "/path/to/file.xlsx" "accounting" "Скопје"');
    console.log('  node migrations/import_from_csv.js "/path/to/file.csv" "legal" "Битола"');
    console.log('  node migrations/import_from_csv.js "/path/to/file.xls" "consulting" "Охрид"');
    console.log('\nValid categories:');
    console.log('  - legal (lawyers)');
    console.log('  - accounting (accountants)');
    console.log('  - consulting (consultants)');
    console.log('  - hr (HR services)');
    console.log('  - it (IT services)');
    console.log('  - other');
    console.log('\nValid locations (Macedonian cities):');
    console.log('  ' + OFFICIAL_CITIES.join(', '));
    process.exit(1);
  }

  const [csvPath, category, location] = args;

  importFromCSV(csvPath, category, location)
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = importFromCSV;
