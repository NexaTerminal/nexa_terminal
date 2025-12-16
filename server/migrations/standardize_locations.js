/**
 * Migration: Standardize Service Provider Locations
 * Updates all service provider locations to match the official city list
 */

const { MongoClient } = require('mongodb');

// Official Macedonian cities list - MUST MATCH FindLawyer.js
const OFFICIAL_CITIES = [
  'Берово',
  'Битола',
  'Богданци',
  'Валандово',
  'Велес',
  'Виница',
  'Гевгелија',
  'Гостивар',
  'Дебар',
  'Делчево',
  'Демир Хисар',
  'Кавадарци',
  'Кичево',
  'Кочани',
  'Кратово',
  'Крива Паланка',
  'Крушево',
  'Куманово',
  'Македонска Каменица',
  'Македонски Брод',
  'Неготино',
  'Охрид',
  'Прилеп',
  'Пробиштип',
  'Радовиш',
  'Ресен',
  'Свети Николе',
  'Скопје',
  'Струга',
  'Струмица',
  'Тетово',
  'Штип'
];

// Mapping of common variations to official names
const LOCATION_MAPPINGS = {
  // Different capitalizations of Skopje
  'скопје': 'Скопје',
  'СКОПЈЕ': 'Скопје',
  'Skopje': 'Скопје',

  // Different capitalizations of Bitola
  'битола': 'Битола',
  'БИТОЛА': 'Битола',
  'Bitola': 'Битола',

  // Štip variations
  'штип': 'Штип',
  'ШТИП': 'Штип',
  'Stip': 'Штип',
  'Shtip': 'Штип',

  // Struga variations
  'струга': 'Струга',
  'СТРУГА': 'Струга',
  'Struga': 'Струга',

  // Strumica variations
  'струмица': 'Струмица',
  'СТРУМИЦА': 'Струмица',
  'Strumica': 'Струмица',

  // Sveti Nikole variations
  'свети николе': 'Свети Николе',
  'СВЕТИ НИКОЛЕ': 'Свети Николе',
  'Sveti Nikole': 'Свети Николе',

  // Radoviš variations
  'радовиш': 'Радовиш',
  'РАДОВИШ': 'Радовиш',
  'Radovis': 'Радовиш',

  // Prilep variations
  'прилеп': 'Прилеп',
  'ПРИЛЕП': 'Прилеп',
  'Prilep': 'Прилеп',

  // Probištip variations
  'пробиштип': 'Пробиштип',
  'ПРОБИШТИП': 'Пробиштип',
  'Probistip': 'Пробиштип',

  // Ohrid variations
  'охрид': 'Охрид',
  'ОХРИД': 'Охрид',
  'Ohrid': 'Охрид',

  // Negotino variations
  'неготино': 'Неготино',
  'НЕГОТИНО': 'Неготино',
  'Negotino': 'Неготино',

  // Kumanovo variations
  'куманово': 'Куманово',
  'КУМАНОВО': 'Куманово',
  'Kumanovo': 'Куманово',

  // Tetovo variations
  'тетово': 'Тетово',
  'ТЕТОВО': 'Тетово',
  'Tetovo': 'Тетово',

  // Veles variations
  'велес': 'Велес',
  'ВЕЛЕС': 'Велес',
  'Veles': 'Велес',

  // Gostivar variations
  'гостивар': 'Гостивар',
  'ГОСТИВАР': 'Гостивар',
  'Gostivar': 'Гостивар',

  // Add more variations as needed
  'Kavadarci': 'Кавадарци',
  'Kocani': 'Кочани',
  'Kicevo': 'Кичево',
  'Vinica': 'Виница',
  'Delcevo': 'Делчево',
  'Berovo': 'Берово',
  'Gevgelija': 'Гевгелија',
  'Debar': 'Дебар',
  'Krusevo': 'Крушево',
  'Kratovo': 'Кратово',
  'Kriva Palanka': 'Крива Паланка',
  'Resen': 'Ресен',
  'Valandovo': 'Валандово',
  'Bogdanci': 'Богданци',
  'Demir Hisar': 'Демир Хисар',
  'Makedonski Brod': 'Македонски Брод',
  'Makedonska Kamenica': 'Македонска Каменица'
};

function normalizeLocation(location) {
  if (!location) return null;

  const trimmed = location.trim();

  // Check if already in official list
  if (OFFICIAL_CITIES.includes(trimmed)) {
    return trimmed;
  }

  // Check mappings
  if (LOCATION_MAPPINGS[trimmed]) {
    return LOCATION_MAPPINGS[trimmed];
  }

  // Try case-insensitive match
  const lowerLocation = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(LOCATION_MAPPINGS)) {
    if (key.toLowerCase() === lowerLocation) {
      return value;
    }
  }

  // Try to find fuzzy match in official cities
  for (const city of OFFICIAL_CITIES) {
    if (city.toLowerCase() === lowerLocation) {
      return city;
    }
  }

  // No match found - return null to flag for review
  return null;
}

async function standardizeLocations() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('service_providers');

    // Get all service providers
    const providers = await collection.find({}).toArray();
    console.log(`📊 Found ${providers.length} service providers to review\n`);

    let updatedCount = 0;
    let unchangedCount = 0;
    let unmatchedCount = 0;
    const unmatchedLocations = new Set();

    for (const provider of providers) {
      const currentLocation = provider.location;
      const normalizedLocation = normalizeLocation(currentLocation);

      if (!normalizedLocation) {
        unmatchedCount++;
        unmatchedLocations.add(currentLocation);
        console.log(`  ⚠️  No match found: "${currentLocation}" for ${provider.name}`);
        continue;
      }

      if (currentLocation !== normalizedLocation) {
        // Update the location
        await collection.updateOne(
          { _id: provider._id },
          {
            $set: {
              location: normalizedLocation,
              updatedAt: new Date()
            }
          }
        );
        updatedCount++;
        console.log(`  ✅ Updated: "${currentLocation}" → "${normalizedLocation}" for ${provider.name}`);
      } else {
        unchangedCount++;
      }
    }

    console.log('\n📈 Standardization Summary:');
    console.log('─'.repeat(60));
    console.log(`  Total providers: ${providers.length}`);
    console.log(`  Updated: ${updatedCount}`);
    console.log(`  Already correct: ${unchangedCount}`);
    console.log(`  Unmatched: ${unmatchedCount}`);
    console.log('─'.repeat(60));

    if (unmatchedLocations.size > 0) {
      console.log('\n⚠️  Unmatched Locations (need manual review):');
      unmatchedLocations.forEach(loc => console.log(`  - "${loc}"`));
      console.log('\nThese providers will keep their current locations.');
      console.log('Please update the LOCATION_MAPPINGS in this script and run again.');
    }

    // Show location distribution
    console.log('\n📊 Location Distribution:');
    const locationCounts = {};
    const allProviders = await collection.find({}).toArray();
    allProviders.forEach(p => {
      const loc = p.location || 'No location';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([loc, count]) => {
        const isOfficial = OFFICIAL_CITIES.includes(loc) ? '✅' : '⚠️';
        console.log(`  ${isOfficial} ${loc}: ${count}`);
      });

    console.log('\n🎉 Standardization completed!');
    return true;

  } catch (error) {
    console.error('❌ Standardization failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

// Run standardization if called directly
if (require.main === module) {
  standardizeLocations()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { standardizeLocations, OFFICIAL_CITIES, normalizeLocation };
