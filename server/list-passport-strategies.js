// Script to check which passport strategies are registered
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
require('dotenv').config({ path: envFile });

const passport = require('passport');

// Initialize a mock database connection
const mockDb = {
  collection: () => ({
    findOne: async () => null,
    insertOne: async () => ({ insertedId: '123' })
  })
};

console.log('\n🔍 Initializing passport with mock database...\n');

// Load passport configuration
require('./config/passport')(mockDb);

console.log('\n📋 Registered Passport Strategies:');
console.log('=====================================');

const strategies = Object.keys(passport._strategies || {});
if (strategies.length === 0) {
  console.log('❌ NO STRATEGIES REGISTERED!');
} else {
  strategies.forEach((strategy, index) => {
    console.log(`${index + 1}. ${strategy}`);
  });
}

console.log('=====================================\n');

// Check if 'google' strategy exists
if (passport._strategies && passport._strategies['google']) {
  console.log('✅ Google strategy is registered!');
} else {
  console.log('❌ Google strategy is NOT registered!');
}

console.log('\n');
