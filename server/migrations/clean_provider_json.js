/**
 * Script to clean provider JSON for bulk import
 * Removes description and converts location objects to strings
 */

const fs = require('fs');
const path = require('path');

// Usage: node clean_provider_json.js input.json output.json

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.log('Usage: node clean_provider_json.js input.json output.json');
  process.exit(1);
}

try {
  // Read input file
  const data = fs.readFileSync(inputFile, 'utf8');
  const providers = JSON.parse(data);

  console.log(`📊 Found ${providers.length} providers to clean`);

  // Clean each provider
  const cleanedProviders = providers.map((provider, index) => {
    const cleaned = {
      name: provider.name || '',
      email: provider.email || '',
      phone: provider.phone || '',
      website: provider.website || '',
      serviceCategory: provider.serviceCategory || 'other',
      specializations: provider.specializations || []
    };

    // Handle location - convert to string
    if (typeof provider.location === 'string') {
      cleaned.location = provider.location;
    } else if (provider.location && provider.location.city) {
      cleaned.location = provider.location.city;
    } else if (provider.location && provider.location.town) {
      cleaned.location = provider.location.town;
    } else {
      cleaned.location = '';
    }

    // Log progress every 100 providers
    if ((index + 1) % 100 === 0) {
      console.log(`  Processed ${index + 1}/${providers.length}...`);
    }

    return cleaned;
  });

  // Write output file
  fs.writeFileSync(outputFile, JSON.stringify(cleanedProviders, null, 2), 'utf8');

  console.log(`✅ Successfully cleaned ${cleanedProviders.length} providers`);
  console.log(`📝 Output saved to: ${outputFile}`);
  console.log(`\nRemoved fields: description, businessInfo, location object → string`);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
