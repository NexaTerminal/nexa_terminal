#!/usr/bin/env node

// 🎛️ NEXA FEATURE TOGGLE UTILITY
// Easy way to enable/disable features for development

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '../.vscode/settings.json');

function getCurrentSettings() {
  try {
    const content = fs.readFileSync(SETTINGS_PATH, 'utf8');
    // Simple regex to extract feature values (handles comments)
    const lines = content.split('\n');
    const features = {};
    
    let inFeaturesSection = false;
    for (const line of lines) {
      if (line.includes('"nexa.features"')) {
        inFeaturesSection = true;
        continue;
      }
      if (inFeaturesSection && line.includes('}')) {
        break;
      }
      if (inFeaturesSection && line.includes(':')) {
        const match = line.match(/"(\w+)":\s*(true|false)/);
        if (match) {
          features[match[1]] = match[2] === 'true';
        }
      }
    }
    return features;
  } catch (error) {
    console.error('❌ Error reading settings:', error.message);
    return {};
  }
}

function toggleFeature(featureName, newValue = null) {
  try {
    const content = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`"${featureName}":`)) {
        const currentValue = lines[i].includes('true');
        const targetValue = newValue !== null ? newValue : !currentValue;
        
        // Update the line
        lines[i] = lines[i].replace(/(true|false)/, targetValue.toString());
        
        // Update the emoji/status indicator
        if (featureName === 'authentication') {
          lines[i] = lines[i].replace(/✅|❌|🎯/, '✅'); // Always active
        } else if (targetValue) {
          lines[i] = lines[i].replace(/✅|❌|🎯/, '🎯'); // Current focus
        } else {
          lines[i] = lines[i].replace(/✅|❌|🎯/, '❌'); // Disabled
        }
        
        break;
      }
    }
    
    // Update file exclusions based on feature status
    updateFileExclusions(lines, featureName, newValue !== null ? newValue : !getCurrentSettings()[featureName]);
    
    fs.writeFileSync(SETTINGS_PATH, lines.join('\n'));
    return true;
  } catch (error) {
    console.error('❌ Error updating settings:', error.message);
    return false;
  }
}

function updateFileExclusions(lines, featureName, isEnabled) {
  // Feature to file mapping
  const featureFiles = {
    blog: [
      '**/blog',
      '**/server/routes/news.js',
      '**/server/routes/blog.js',
      '**/server/controllers/newsController.js',
      '**/server/controllers/blogController.js'
    ],
    socialPosts: [
      '**/client/src/pages/social',
      '**/server/routes/social.js',
      '**/server/controllers/socialController.js',
      '**/server/services/socialService.js'
    ],
    legalHealthCheck: [
      '**/server/routes/legal.js',
      '**/server/controllers/legalController.js'
    ],
    profileCompletion: [
      '**/client/src/pages/profile-completion'
    ],
    documentAutomation: [
      '**/server/routes/documents.js',
      '**/server/controllers/documentController.js',
      '**/server/document_templates'
    ]
  };

  const filesToToggle = featureFiles[featureName];
  if (!filesToToggle) return;

  // Update files.exclude section
  let inFilesExclude = false;
  let inSearchExclude = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"files.exclude"')) {
      inFilesExclude = true;
      inSearchExclude = false;
      continue;
    }
    if (lines[i].includes('"search.exclude"')) {
      inFilesExclude = false;
      inSearchExclude = true;
      continue;
    }
    if (lines[i].includes('"}') && (inFilesExclude || inSearchExclude)) {
      inFilesExclude = false;
      inSearchExclude = false;
      continue;
    }
    
    // Toggle file exclusions
    if ((inFilesExclude || inSearchExclude) && filesToToggle.some(file => lines[i].includes(file))) {
      if (isEnabled) {
        // Feature enabled - comment out the exclusion (show files)
        if (!lines[i].trim().startsWith('//')) {
          lines[i] = lines[i].replace(/(\s*)(".*")/, '$1// $2 // Auto-hidden: feature disabled');
        }
      } else {
        // Feature disabled - uncomment the exclusion (hide files)
        lines[i] = lines[i].replace(/(\s*)\/\/ (".*") \/\/ Auto-hidden: feature disabled/, '$1$2');
        if (!lines[i].includes(': true')) {
          lines[i] = lines[i].replace(/(".*")/, '$1: true');
        }
      }
    }
  }
}

function showCurrentStatus() {
  const features = getCurrentSettings();
  console.log('\n🎛️  NEXA FEATURE STATUS\n');
  
  Object.entries(features).forEach(([name, enabled]) => {
    const emoji = name === 'authentication' ? '✅' : enabled ? '🎯' : '❌';
    const status = enabled ? 'ON ' : 'OFF';
    console.log(`${emoji} ${name.padEnd(20)} ${status}`);
  });
  console.log('\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const featureName = args[0];
const action = args[1];

// Handle feature toggling
if (featureName && featureName !== 'auth') {
  if (action === 'on' || action === 'off') {
    const newValue = action === 'on';
    toggleFeature(featureName, newValue);
  } else {
    const newValue = toggleFeature(featureName);
  }
} else if (featureName === 'auth') {
  // Authentication cannot be disabled
} else {
  // Show current status
  showCurrentStatus();
  
  console.log('Usage:');
  console.log('  node toggle-features.js                    # Show current status');
  console.log('  node toggle-features.js <feature>          # Toggle a feature');
  console.log('  node toggle-features.js <feature> on|off   # Set feature on/off');
  console.log('\nAvailable features:');
  console.log('  - documentAutomation');
  console.log('  - profileCompletion');
  console.log('  - socialPosts');
  console.log('  - legalHealthCheck');
  console.log('  - blog');
  console.log('\nNote: authentication is always enabled');
}
