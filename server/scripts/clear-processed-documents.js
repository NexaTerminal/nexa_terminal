require('dotenv').config({ path: __dirname + '/../.env.development' });
const { MongoClient } = require('mongodb');

async function clearProcessedDocuments() {
  console.log('🗑️  Clearing processed documents from MongoDB...\n');

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    const result = await db.collection('chatbot_documents').deleteMany({});

    console.log(`✅ Deleted ${result.deletedCount} processed document records`);
    console.log(`\nNow you can run the processing script again to reprocess all documents.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

clearProcessedDocuments();
