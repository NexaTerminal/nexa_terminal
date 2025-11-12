require('dotenv').config({ path: __dirname + '/../.env.development' });
const { OpenAIEmbeddings } = require('@langchain/openai');
const { QdrantClient } = require('@qdrant/js-client-rest');

/**
 * Quick Embeddings Validation Script
 *
 * This script checks if your current OpenAI API key produces embeddings
 * that are compatible with the vectors stored in Qdrant.
 *
 * After rotating API keys, embeddings SHOULD still work because OpenAI's
 * embedding models are deterministic. However, this script verifies that.
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function validateEmbeddings() {
  console.log('\n' + '='.repeat(70));
  log('  EMBEDDINGS VALIDATION - API KEY CHECK', colors.bright);
  console.log('='.repeat(70) + '\n');

  try {
    // Initialize OpenAI embeddings with current API key
    log('Step 1: Testing current OpenAI API key...', colors.cyan);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    });

    const testQuery = 'Работен договор во Македонија';
    log(`\nGenerating test embedding for: "${testQuery}"`, colors.cyan);

    try {
      const embedding = await embeddings.embedQuery(testQuery);
      log(`✅ API key is VALID and working!`, colors.green);
      log(`   Vector dimensions: ${embedding.length}`, colors.green);
      log(`   Model: ${process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'}`, colors.green);
    } catch (apiError) {
      log(`\n❌ API KEY VALIDATION FAILED!`, colors.red);
      log(`Error: ${apiError.message}`, colors.red);

      if (apiError.message.includes('Incorrect API key')) {
        log(`\n🔑 Your OpenAI API key appears to be invalid or expired.`, colors.yellow);
        log(`   Please check: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`, colors.yellow);
      } else if (apiError.message.includes('insufficient_quota')) {
        log(`\n💰 Your OpenAI account has insufficient credits.`, colors.yellow);
        log(`   Add credits at: https://platform.openai.com/account/billing`, colors.yellow);
      }

      return false;
    }

    // Check Qdrant compatibility
    log(`\nStep 2: Checking compatibility with stored vectors...`, colors.cyan);

    const qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });

    const collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';

    try {
      const collection = await qdrantClient.getCollection(collectionName);

      log(`✅ Qdrant collection found: ${collectionName}`, colors.green);
      log(`   Vectors stored: ${collection.points_count}`, colors.green);
      log(`   Vector dimensions: ${collection.config.params.vectors.size}`, colors.green);

      // Generate embedding and search
      const queryEmbedding = await embeddings.embedQuery(testQuery);

      // Check if dimensions match
      if (queryEmbedding.length !== collection.config.params.vectors.size) {
        log(`\n❌ DIMENSION MISMATCH!`, colors.red);
        log(`   Current API produces: ${queryEmbedding.length} dimensions`, colors.red);
        log(`   Stored vectors have: ${collection.config.params.vectors.size} dimensions`, colors.red);
        log(`\n⚠️  You MUST re-process documents with the new embedding model!`, colors.yellow);
        log(`   Run: node server/scripts/process-documents.js`, colors.yellow);
        return false;
      }

      // Try a test search
      log(`\nStep 3: Testing vector search...`, colors.cyan);

      const searchResults = await qdrantClient.search(collectionName, {
        vector: queryEmbedding,
        limit: 3,
        with_payload: true,
      });

      if (searchResults.length === 0) {
        log(`⚠️  No search results found!`, colors.yellow);
        log(`   This could mean:`, colors.yellow);
        log(`   1. No documents match the query (unlikely)`, colors.yellow);
        log(`   2. Embeddings are incompatible (possible after model change)`, colors.yellow);
        log(`   3. Vector database is empty`, colors.yellow);
        return false;
      }

      log(`✅ Search successful! Found ${searchResults.length} results:`, colors.green);

      searchResults.forEach((result, index) => {
        log(`\n  [${index + 1}] ${result.payload.documentName}`, colors.cyan);
        log(`      Confidence: ${(result.score * 100).toFixed(1)}%`, colors.cyan);
        log(`      Preview: "${result.payload.pageContent.substring(0, 80)}..."`, colors.cyan);
      });

      // Check if results are reasonable
      const topScore = searchResults[0].score;

      if (topScore < 0.4) {
        log(`\n⚠️  WARNING: Low confidence scores!`, colors.yellow);
        log(`   Top result: ${(topScore * 100).toFixed(1)}%`, colors.yellow);
        log(`\n   This suggests embeddings might be incompatible.`, colors.yellow);
        log(`   Consider re-processing documents with current API key:`, colors.yellow);
        log(`   Run: node server/scripts/process-documents.js`, colors.yellow);
        return false;
      }

      log(`\n${'='.repeat(70)}`, colors.green);
      log(`✅ ALL CHECKS PASSED!`, colors.green);
      log(`${'='.repeat(70)}`, colors.green);

      log(`\nYour RAG system is properly configured:`, colors.bright);
      log(`  ✓ OpenAI API key is valid`, colors.green);
      log(`  ✓ Embeddings are being generated correctly`, colors.green);
      log(`  ✓ Vector database is accessible`, colors.green);
      log(`  ✓ Embeddings are compatible with stored vectors`, colors.green);
      log(`  ✓ Search is returning relevant results`, colors.green);

      log(`\n💡 If answers still don't match documents, the issue is likely:`, colors.cyan);
      log(`   1. The LLM is not following the context strictly enough`, colors.cyan);
      log(`   2. The retrieved documents don't contain the expected information`, colors.cyan);
      log(`   3. The prompt template needs adjustment`, colors.cyan);

      log(`\nRun the full diagnostic tool for more details:`, colors.bright);
      log(`   node server/scripts/test-rag-retrieval.js\n`, colors.cyan);

      return true;

    } catch (qdrantError) {
      log(`\n❌ Qdrant connection failed!`, colors.red);
      log(`Error: ${qdrantError.message}`, colors.red);

      if (qdrantError.message.includes('Collection not found')) {
        log(`\n📦 Collection "${collectionName}" doesn't exist yet.`, colors.yellow);
        log(`   Process documents first: node server/scripts/process-documents.js`, colors.yellow);
      }

      return false;
    }

  } catch (error) {
    log(`\n❌ VALIDATION FAILED!`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    console.error(error.stack);
    return false;
  }
}

// Run validation
validateEmbeddings()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
