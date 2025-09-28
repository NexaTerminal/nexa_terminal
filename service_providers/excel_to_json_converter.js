#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

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

  // Display first few rows to understand the structure
  console.log('\n🔍 First 3 rows structure:');
  jsonData.slice(0, 3).forEach((row, index) => {
    console.log(`Row ${index + 1}:`, Object.keys(row));
    console.log('Values:', row);
    console.log('---');
  });

  // Map Excel data to service provider format
  const serviceProviders = jsonData.map((row, index) => {
    // Get all column names to understand the data structure
    const columns = Object.keys(row);
    console.log(`Processing row ${index + 1}, columns:`, columns);

    // Try to map common column patterns
    const name = row['Company Name'] || row['Name'] || row['Име'] || row['Компанија'] || row['КОМПАНИЈА'] ||
                 row['company_name'] || row['name'] || row['назив'] || row['Назив'] || Object.values(row)[0] || '';

    const email = row['Email'] || row['E-mail'] || row['EMAIL'] || row['Е-пошта'] || row['email'] ||
                  row['contact_email'] || row['мејл'] || row['Мејл'] || '';

    const phone = row['Phone'] || row['Telephone'] || row['Tel'] || row['Телефон'] || row['phone'] ||
                  row['телефон'] || row['контакт'] || row['Контакт'] || '';

    const website = row['Website'] || row['Web'] || row['URL'] || row['веб'] || row['Веб'] ||
                    row['website'] || row['веб-страна'] || '';

    const address = row['Address'] || row['Адреса'] || row['address'] || row['адреса'] || '';

    const description = row['Description'] || row['Services'] || row['Услуги'] || row['Опис'] ||
                       row['description'] || row['услуги'] || row['деловност'] || '';

    // If no clear mapping found, try to use first few columns
    if (!name && columns.length > 0) {
      console.log(`⚠️  Could not identify name column for row ${index + 1}. Available columns:`, columns);
    }

    return {
      name: String(name).trim() || `Company ${index + 1}`,
      email: String(email).trim().toLowerCase() || `contact${index + 1}@example.mk`,
      phone: String(phone).trim() || '',
      website: String(website).trim() || '',
      serviceCategory: 'legal',
      specializations: [],
      description: String(description).trim() || 'Правни услуги во Скопје',
      location: 'Скопје',
      businessInfo: {
        registrationNumber: '',
        taxNumber: '',
        languagesSupported: ['mk', 'en']
      },
      // Additional fields from Excel if available
      address: String(address).trim() || '',
      // Store original Excel row for reference
      _originalData: row
    };
  }).filter(provider => {
    // Filter out empty rows or rows without essential data
    return provider.name && provider.name !== 'Company ' && provider.name.length > 2;
  });

  console.log(`\n✅ Successfully processed ${serviceProviders.length} valid service providers`);

  // Save to JSON file
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(serviceProviders, null, 2), 'utf8');
  console.log(`💾 JSON file saved to: ${OUTPUT_JSON_PATH}`);

  // Display summary
  console.log('\n📋 Summary:');
  console.log(`- Total providers: ${serviceProviders.length}`);
  console.log(`- Category: legal`);
  console.log(`- Location: Скопје`);

  // Show first few converted entries
  console.log('\n🔍 First 3 converted entries:');
  serviceProviders.slice(0, 3).forEach((provider, index) => {
    console.log(`${index + 1}. ${provider.name}`);
    console.log(`   Email: ${provider.email}`);
    console.log(`   Phone: ${provider.phone}`);
    console.log(`   Description: ${provider.description}`);
    console.log('---');
  });

  console.log(`\n🚀 Ready for bulk import! Copy the content from ${OUTPUT_JSON_PATH} and paste it into the bulk import textbox.`);

} catch (error) {
  console.error('❌ Error converting Excel file:', error.message);

  if (error.code === 'ENOENT') {
    console.log('\n💡 Make sure the Excel file exists at:', EXCEL_FILE_PATH);
  }

  process.exit(1);
}