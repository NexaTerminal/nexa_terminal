const { MongoClient } = require('mongodb');

// MongoDB Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://terminalnexa:Dav1dBoshkosk1@nexacluster.ddjqk.mongodb.net/nexa';
    const client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB connected successfully to nexa database');
    return client.db('nexa'); // Explicitly use nexa database
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };
