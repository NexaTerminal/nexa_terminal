const { QdrantClient } = require('@qdrant/js-client-rest');
const { OpenAIEmbeddings } = require('@langchain/openai');
require('dotenv').config();

/**
 * Create Marketing Documents Collection
 *
 * This script creates a new Qdrant collection for marketing documents
 * and migrates marketing-related content from the legal_docs collection.
 */

const LEGAL_COLLECTION = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';
const MARKETING_COLLECTION = 'nexa_marketing_docs';

// Marketing-related document patterns (sources to migrate)
const MARKETING_SOURCES = [
  'marketing.ai.training.JSON',
  'newData/marketing.ai.training.JSON'
];

async function createMarketingCollection() {
  console.log('🚀 Creating Marketing Documents Collection...\n');

  const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });

  try {
    // Step 1: Check if marketing collection already exists
    console.log(`📊 Checking if collection "${MARKETING_COLLECTION}" exists...`);

    try {
      const existingCollection = await client.getCollection(MARKETING_COLLECTION);
      console.log(`⚠️  Collection already exists with ${existingCollection.points_count} vectors`);
      console.log('   Delete it first if you want to recreate.');

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('   Delete and recreate? (y/n): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('   Aborting.');
        return;
      }

      // Delete existing collection
      await client.deleteCollection(MARKETING_COLLECTION);
      console.log('   ✓ Deleted existing collection');
    } catch (e) {
      // Collection doesn't exist, which is fine
      console.log('   Collection does not exist, will create new one');
    }

    // Step 2: Create the new collection with same vector dimensions
    console.log(`\n📦 Creating collection "${MARKETING_COLLECTION}"...`);

    await client.createCollection(MARKETING_COLLECTION, {
      vectors: {
        size: 1536, // text-embedding-3-small dimensions
        distance: 'Cosine'
      }
    });
    console.log('   ✓ Collection created');

    // Step 3: Find and migrate marketing documents from legal collection
    console.log(`\n🔍 Searching for marketing documents in "${LEGAL_COLLECTION}"...`);

    let marketingPoints = [];
    let offset = null;

    do {
      const response = await client.scroll(LEGAL_COLLECTION, {
        limit: 100,
        offset: offset,
        with_payload: true,
        with_vector: true
      });

      for (const point of response.points) {
        const source = point.payload.metadata?.source || point.payload.source || '';

        // Check if this is a marketing document
        const isMarketing = MARKETING_SOURCES.some(pattern =>
          source.toLowerCase().includes(pattern.toLowerCase()) ||
          source.toLowerCase().includes('marketing')
        );

        if (isMarketing) {
          marketingPoints.push({
            id: marketingPoints.length + 1, // New sequential IDs
            vector: point.vector,
            payload: {
              ...point.payload,
              metadata: {
                ...point.payload.metadata,
                migratedFrom: LEGAL_COLLECTION,
                migratedAt: new Date().toISOString()
              }
            }
          });
        }
      }

      offset = response.next_page_offset;
    } while (offset !== null && offset !== undefined);

    console.log(`   Found ${marketingPoints.length} marketing document chunks`);

    // Step 4: Upload to new collection
    if (marketingPoints.length > 0) {
      console.log(`\n📤 Uploading ${marketingPoints.length} chunks to "${MARKETING_COLLECTION}"...`);

      const batchSize = 100;
      for (let i = 0; i < marketingPoints.length; i += batchSize) {
        const batch = marketingPoints.slice(i, i + batchSize);

        await client.upsert(MARKETING_COLLECTION, {
          wait: true,
          points: batch
        });

        console.log(`   ✓ Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(marketingPoints.length / batchSize)}`);
      }

      console.log('\n✅ Migration complete!');
    } else {
      console.log('\n⚠️  No marketing documents found to migrate.');
      console.log('   You may need to upload marketing training data first.');
    }

    // Step 5: Verify final state
    const finalState = await client.getCollection(MARKETING_COLLECTION);
    console.log(`\n📊 Final state:`);
    console.log(`   Collection: ${MARKETING_COLLECTION}`);
    console.log(`   Vectors: ${finalState.points_count}`);
    console.log(`   Status: ${finalState.status}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// Run the script
createMarketingCollection()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
