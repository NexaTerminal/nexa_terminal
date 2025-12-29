const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

/**
 * List all documents stored in Qdrant vector database
 * Shows metadata about each document including source files
 */
async function listQdrantDocuments() {
  console.log('🔍 Connecting to Qdrant...\n');

  const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });

  const collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';

  try {
    // Get collection info
    console.log(`📊 Collection: ${collectionName}\n`);

    const collectionInfo = await client.getCollection(collectionName);
    console.log(`Total vectors: ${collectionInfo.points_count}`);
    console.log(`Vector dimension: ${collectionInfo.config.params.vectors.size}`);
    console.log(`Distance metric: ${collectionInfo.config.params.vectors.distance}\n`);

    // Scroll through all points to get unique documents
    const uniqueDocuments = new Map();
    let offset = null;
    let totalPoints = 0;

    console.log('📄 Fetching all documents...\n');

    do {
      const response = await client.scroll(collectionName, {
        limit: 100,
        offset: offset,
        with_payload: true,
        with_vector: false
      });

      for (const point of response.points) {
        totalPoints++;
        const payload = point.payload;

        // Extract source file name
        const source = payload.metadata?.source || payload.source || 'Unknown';

        if (!uniqueDocuments.has(source)) {
          uniqueDocuments.set(source, {
            source: source,
            firstChunk: payload.text?.substring(0, 100) + '...' || 'No text',
            metadata: payload.metadata || {},
            pointId: point.id
          });
        }
      }

      offset = response.next_page_offset;
    } while (offset !== null && offset !== undefined);

    // Display results
    console.log('═'.repeat(80));
    console.log(`📚 SUMMARY: Found ${uniqueDocuments.size} unique documents (${totalPoints} total chunks)`);
    console.log('═'.repeat(80));
    console.log();

    console.log('📋 Document List:\n');

    let docNumber = 1;
    for (const [source, info] of uniqueDocuments) {
      console.log(`${docNumber}. ${source}`);

      // Show any useful metadata
      if (info.metadata.title) {
        console.log(`   Title: ${info.metadata.title}`);
      }
      if (info.metadata.category) {
        console.log(`   Category: ${info.metadata.category}`);
      }
      if (info.metadata.uploaded) {
        console.log(`   Uploaded: ${info.metadata.uploaded}`);
      }

      console.log(`   Preview: ${info.firstChunk}`);
      console.log();

      docNumber++;
    }

    console.log('═'.repeat(80));
    console.log(`✅ Total: ${uniqueDocuments.size} documents`);
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('Not found')) {
      console.log(`\n💡 Collection "${collectionName}" doesn't exist yet.`);
      console.log('Run the document processing script first to create it.');
    }
  }
}

// Run the script
listQdrantDocuments()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
