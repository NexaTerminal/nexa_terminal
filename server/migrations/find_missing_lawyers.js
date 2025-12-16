/**
 * Comparison Script: Find Missing Lawyers
 * Compares JSON file with database to identify missing entries
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');

async function findMissingLawyers() {
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

    console.log(`📊 Analyzing ${lawyers.length} lawyers from JSON file...\n`);

    const missing = [];
    const found = [];
    const duplicates = [];
    let emptyEmailCount = 0;

    for (const lawyer of lawyers) {
      // Check if email is empty
      if (!lawyer.email || lawyer.email.trim() === '') {
        emptyEmailCount++;
        missing.push({
          ...lawyer,
          reason: 'No email address'
        });
        continue;
      }

      // Try to find by email
      let existing = await collection.findOne({ email: lawyer.email });

      if (existing) {
        found.push(lawyer);
        continue;
      }

      // Try to find by name + phone (in case email is different)
      existing = await collection.findOne({
        name: lawyer.name,
        phone: lawyer.phone
      });

      if (existing) {
        // Found by name+phone but different email
        duplicates.push({
          json: lawyer,
          db: existing,
          reason: 'Same name+phone, different email'
        });
        found.push(lawyer);
        continue;
      }

      // Not found at all
      missing.push({
        ...lawyer,
        reason: 'Not in database'
      });
    }

    // Print results
    console.log('📈 Analysis Results:');
    console.log('─'.repeat(60));
    console.log(`✅ Found in database: ${found.length}`);
    console.log(`❌ Missing from database: ${missing.length}`);
    console.log(`⚠️  Entries with no email: ${emptyEmailCount}`);
    console.log(`🔄 Potential duplicates (different emails): ${duplicates.length}`);
    console.log('─'.repeat(60));

    // Show missing lawyers
    if (missing.length > 0) {
      console.log('\n❌ Missing Lawyers:');
      console.log('─'.repeat(60));
      missing.forEach((lawyer, index) => {
        console.log(`${index + 1}. ${lawyer.name}`);
        console.log(`   Email: ${lawyer.email || '(empty)'}`);
        console.log(`   Phone: ${lawyer.phone}`);
        console.log(`   Reason: ${lawyer.reason}`);
        console.log('');
      });
    }

    // Show potential duplicates
    if (duplicates.length > 0) {
      console.log('\n🔄 Potential Duplicates (same lawyer, different email):');
      console.log('─'.repeat(60));
      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. ${dup.json.name}`);
        console.log(`   JSON file email: ${dup.json.email}`);
        console.log(`   Database email: ${dup.db.email}`);
        console.log(`   Phone: ${dup.json.phone}`);
        console.log('');
      });
    }

    // Save missing lawyers to a file
    if (missing.length > 0) {
      const outputPath = './migrations/missing_lawyers.json';
      fs.writeFileSync(outputPath, JSON.stringify(missing, null, 2));
      console.log(`\n💾 Missing lawyers saved to: ${outputPath}`);
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('─'.repeat(60));
    console.log(`Total in JSON file: ${lawyers.length}`);
    console.log(`Already in database: ${found.length}`);
    console.log(`Missing from database: ${missing.length}`);
    console.log(`  - With empty email: ${emptyEmailCount}`);
    console.log(`  - Actually missing: ${missing.length - emptyEmailCount}`);
    console.log('─'.repeat(60));

    return { missing, found, duplicates };

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run analysis if called directly
if (require.main === module) {
  findMissingLawyers()
    .then(() => {
      console.log('\n✅ Analysis completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = findMissingLawyers;
