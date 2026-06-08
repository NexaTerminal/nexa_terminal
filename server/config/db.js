const { MongoClient } = require('mongodb');

// MongoDB Connection — credentials live in MONGODB_URI env var ONLY.
// Never commit a connection string with credentials to this file.
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('FATAL: MONGODB_URI is not set');
    process.exit(1);
  }
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB connected successfully to nexa database');
    return client.db('nexa');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };
