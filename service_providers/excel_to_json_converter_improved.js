#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');

// Configuration
const EXCEL_FILE_PATH = './service_providers/legal/CopyZofZSKOPJE.xlsx';
const OUTPUT_JSON_PATH = './service_providers_legal_skopje.json';

console.log('🔄 Converting Excel file to JSON format for service providers...');

try {
  // Read the Excel file
  console.log('📖 Reading Excel file:', EXCEL_FILE_PATH);
  const workbook = XLSX.readFile(EXCEL_FILE_PATH);

  // Get the first sheet name
  const sheetName = workbook.SheetNames[0];
  console.log('📄 Processing sheet:', sheetName);

  // Convert sheet to JSON
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Found ${jsonData.length} rows in Excel file`);

  // Helper function to clean text
  const cleanText = (text) => {
    if (!text) return '';
    return String(text).trim().replace(/\s+/g, ' ');
  };

  // Helper function to clean email
  const cleanEmail = (email) => {
    if (!email) return '';
    const cleaned = cleanText(email).toLowerCase();
    // Check if it's a valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : '';
  };

  // Helper function to clean phone
  const cleanPhone = (phone) => {
    if (!phone) return '';
    const cleaned = cleanText(phone);
    // Remove common phone number formatting and keep numbers/dashes
    return cleaned.replace(/[^\d\/\-\+\(\)\s]/g, '');
  };

  // Map Excel data to service provider format
  const serviceProviders = jsonData.map((row, index) => {
    // Extract data using Macedonian column names
    const name = cleanText(row['ИМЕ И ПРЕЗИМЕ']);
    const city = cleanText(row['ГРАД']);
    const address = cleanText(row['АДРЕСА '] || row['АДРЕСА']);
    const phone = cleanPhone(row['МОБИЛЕН']);
    const email = cleanEmail(row['Е-МАИЛ'] || row['E-MAIL'] || row['EMAIL']);
    const website = cleanText(row['веб страна'] || row['веб-страна'] || row['website']);

    // Skip empty rows
    if (!name || name.length < 2) {
      return null;
    }

    // Generate email if missing
    let finalEmail = email;
    if (!finalEmail && name) {
      // Create email from name
      const emailName = name.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '.')
        .substring(0, 20);
      finalEmail = `${emailName}@legal.mk`;
    }

    return {
      name: name,
      email: finalEmail,
      phone: phone,
      website: website,
      serviceCategory: 'legal',
      specializations: [],
      description: `Адвокат од ${city || 'Скопје'} - Правни услуги`,
      location: city === 'СКОПЈЕ' ? 'Скопје' : (city || 'Скопје'),
      businessInfo: {
        registrationNumber: '',
        taxNumber: '',
        languagesSupported: ['mk', 'en']
      }
      // Note: Removed _originalData and address to keep JSON clean for import
    };
  }).filter(provider => provider !== null); // Remove null entries

  console.log(`\n✅ Successfully processed ${serviceProviders.length} valid service providers`);

  // Save to JSON file
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(serviceProviders, null, 2), 'utf8');
  console.log(`💾 JSON file saved to: ${OUTPUT_JSON_PATH}`);

  // Display summary
  console.log('\n📋 Summary:');
  console.log(`- Total providers: ${serviceProviders.length}`);
  console.log(`- Category: legal`);
  console.log(`- Primary location: Скопје`);

  // Show first few converted entries
  console.log('\n🔍 First 5 converted entries:');
  serviceProviders.slice(0, 5).forEach((provider, index) => {
    console.log(`${index + 1}. ${provider.name}`);
    console.log(`   Email: ${provider.email}`);
    console.log(`   Phone: ${provider.phone || 'N/A'}`);
    console.log(`   Location: ${provider.location}`);
    console.log('---');
  });

  // Also create a smaller sample for testing (first 10 entries)
  const sampleProviders = serviceProviders.slice(0, 10);
  const samplePath = './service_providers_legal_skopje_sample.json';
  fs.writeFileSync(samplePath, JSON.stringify(sampleProviders, null, 2), 'utf8');
  console.log(`\n🧪 Sample file created: ${samplePath} (10 entries for testing)`);

  console.log(`\n🚀 Ready for bulk import!`);
  console.log(`📝 You can use either:`);
  console.log(`   - ${OUTPUT_JSON_PATH} for all ${serviceProviders.length} providers`);
  console.log(`   - ${samplePath} for testing with 10 providers`);

} catch (error) {
  console.error('❌ Error converting Excel file:', error.message);

  if (error.code === 'ENOENT') {
    console.log('\n💡 Make sure the Excel file exists at:', EXCEL_FILE_PATH);
  }

  process.exit(1);
}