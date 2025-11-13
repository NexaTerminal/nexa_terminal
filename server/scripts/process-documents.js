require('dotenv').config({ path: __dirname + '/../.env.development' });
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const { QdrantClient } = require('@qdrant/js-client-rest');

/**
 * Document Processing Script for RAG Chatbot
 *
 * This script:
 * 1. Reads PDF and DOCX files from legal_sources folder
 * 2. Extracts text (supports Macedonian/Cyrillic)
 * 3. Splits text into chunks (1000 chars with 200 overlap)
 * 4. Creates embeddings using OpenAI
 * 5. Saves to local HNSWLib vector store
 * 6. Tracks processed documents in MongoDB
 */

// Configuration
const LEGAL_SOURCES_FOLDER = path.join(__dirname, '../legal sources');
const VECTOR_STORE_PATH = path.join(__dirname, '../chatbot/vector_store');
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// MongoDB connection (for document tracking only)
let db;

async function connectToDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db();
  console.log('✓ Connected to MongoDB');
  return db;
}

// Qdrant connection
let qdrantClient;

async function connectToQdrant() {
  qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });

  console.log('✓ Connected to Qdrant');
  return qdrantClient;
}

/**
 * Calculate MD5 hash of file content for tracking changes
 */
async function calculateFileHash(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  console.log(`  📄 Processing PDF: ${path.basename(filePath)}`);

  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);

  return {
    text: data.text,
    pageCount: data.numpages
  };
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(filePath) {
  console.log(`  📝 Processing DOCX: ${path.basename(filePath)}`);

  const result = await mammoth.extractRawText({ path: filePath });

  return {
    text: result.value,
    pageCount: Math.ceil(result.value.length / 2000) // Estimate pages
  };
}

/**
 * Intelligent chunking based on legal article (член) boundaries
 * Falls back to standard chunking if no articles detected
 */
async function createIntelligentChunks(text, fileName, pageCount) {
  // Pattern to detect article boundaries in Macedonian legal documents
  // Matches: "Член 1", "Член 15", "ЧЛЕН 1", etc.
  const articlePattern = /(?:^|\n)(\s*(?:Член|ЧЛЕН|член)\s+\d+[а-в]?)/gm;

  const matches = [...text.matchAll(articlePattern)];

  // If we found articles, split by them
  if (matches.length > 5) { // At least 5 articles to consider it a legal document
    console.log(`  📑 Detected ${matches.length} articles (using article-based chunking)`);

    const chunks = [];

    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];

      const startIndex = currentMatch.index;
      const endIndex = nextMatch ? nextMatch.index : text.length;

      // Extract the article text
      let articleText = text.substring(startIndex, endIndex).trim();
      const articleNumber = currentMatch[1].trim();

      // If article is too long (>3000 chars), split it into sub-chunks
      if (articleText.length > 3000) {
        const subChunks = splitLongArticle(articleText, articleNumber, fileName, pageCount);
        chunks.push(...subChunks);
      } else {
        // Create single chunk for this article
        chunks.push({
          pageContent: articleText,
          metadata: {
            documentName: fileName,
            pageCount: pageCount,
            article: articleNumber,
            processedAt: new Date().toISOString(),
            chunkType: 'article'
          }
        });
      }
    }

    return chunks;
  } else {
    // No articles detected - use standard chunking
    console.log(`  📄 No articles detected (using standard character-based chunking)`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });

    return await textSplitter.createDocuments(
      [text],
      [{
        documentName: fileName,
        pageCount: pageCount,
        processedAt: new Date().toISOString(),
        chunkType: 'standard'
      }]
    );
  }
}

/**
 * Split a long article into smaller sub-chunks while preserving context
 */
function splitLongArticle(articleText, articleNumber, fileName, pageCount) {
  const chunks = [];
  const maxChunkSize = 2500; // Slightly smaller than CHUNK_SIZE to allow for overlap

  // Try to split by paragraphs or numbered items first
  const paragraphs = articleText.split(/\n\n+/);

  let currentChunk = '';
  let subChunkIndex = 1;

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        pageContent: currentChunk.trim(),
        metadata: {
          documentName: fileName,
          pageCount: pageCount,
          article: `${articleNumber} (Part ${subChunkIndex})`,
          processedAt: new Date().toISOString(),
          chunkType: 'article-split'
        }
      });

      currentChunk = paragraph + '\n\n';
      subChunkIndex++;
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      pageContent: currentChunk.trim(),
      metadata: {
        documentName: fileName,
        pageCount: pageCount,
        article: subChunkIndex > 1 ? `${articleNumber} (Part ${subChunkIndex})` : articleNumber,
        processedAt: new Date().toISOString(),
        chunkType: subChunkIndex > 1 ? 'article-split' : 'article'
      }
    });
  }

  console.log(`    ↳ Article too long (${articleText.length} chars) - split into ${chunks.length} parts`);

  return chunks;
}

/**
 * Process a single document file
 */
async function processDocument(filePath) {
  const fileName = path.basename(filePath);
  const fileExt = path.extname(filePath).toLowerCase();

  // Calculate file hash
  const fileHash = await calculateFileHash(filePath);

  // Check if already processed with same hash
  const existing = await db.collection('chatbot_documents').findOne({ fileName });
  if (existing && existing.fileHash === fileHash) {
    console.log(`  ⏭️  Skipping ${fileName} (already processed, unchanged)`);
    return null;
  }

  // Extract text based on file type
  let extractedData;
  if (fileExt === '.pdf') {
    extractedData = await extractTextFromPDF(filePath);
  } else if (fileExt === '.docx') {
    extractedData = await extractTextFromDOCX(filePath);
  } else {
    console.log(`  ⚠️  Skipping unsupported file type: ${fileName}`);
    return null;
  }

  const { text, pageCount } = extractedData;

  if (!text || text.trim().length === 0) {
    console.log(`  ⚠️  No text extracted from ${fileName}`);
    return null;
  }

  console.log(`  ✓ Extracted ${text.length} characters from ${fileName} (${pageCount} pages)`);

  // Split text into chunks based on articles (член) for legal documents
  const chunks = await createIntelligentChunks(text, fileName, pageCount);

  console.log(`  ✓ Split into ${chunks.length} chunks`);

  // Store document metadata in MongoDB
  await db.collection('chatbot_documents').updateOne(
    { fileName },
    {
      $set: {
        fileName,
        fileHash,
        filePath,
        pageCount,
        chunkCount: chunks.length,
        textLength: text.length,
        processedAt: new Date(),
        status: 'processed'
      }
    },
    { upsert: true }
  );

  return chunks;
}

/**
 * Process all documents in the legal_sources folder
 */
async function processAllDocuments() {
  console.log('🚀 Starting document processing...\n');

  // Get list of files
  const files = await fs.readdir(LEGAL_SOURCES_FOLDER);
  const documentFiles = files.filter(file =>
    file.endsWith('.pdf') || file.endsWith('.docx')
  );

  console.log(`Found ${documentFiles.length} documents to process:\n`);

  const allChunks = [];
  let processedCount = 0;
  let skippedCount = 0;

  for (const file of documentFiles) {
    const filePath = path.join(LEGAL_SOURCES_FOLDER, file);

    try {
      const chunks = await processDocument(filePath);

      if (chunks) {
        allChunks.push(...chunks);
        processedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
      skippedCount++;
    }

    console.log(''); // Empty line for readability
  }

  console.log(`\n📊 Processing Summary:`);
  console.log(`   ✓ Processed: ${processedCount} documents`);
  console.log(`   ⏭️  Skipped: ${skippedCount} documents`);
  console.log(`   📄 Total chunks: ${allChunks.length}\n`);

  return allChunks;
}

/**
 * Create embeddings and save to Qdrant
 */
async function createVectorStore(documents) {
  console.log('🔮 Creating embeddings and saving to Qdrant...\n');

  // Initialize OpenAI embeddings
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  });

  const collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';

  console.log(`  Using model: ${process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'}`);
  console.log(`  Processing ${documents.length} chunks...`);
  console.log(`  Target collection: ${collectionName}\n`);

  // Estimate cost
  const totalChars = documents.reduce((sum, doc) => sum + doc.pageContent.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4); // Rough estimate: 1 token ≈ 4 chars
  const estimatedCost = (estimatedTokens / 1000000) * 0.02; // $0.02 per 1M tokens

  console.log(`  Estimated tokens: ${estimatedTokens.toLocaleString()}`);
  console.log(`  Estimated cost: $${estimatedCost.toFixed(4)}\n`);

  // Create embeddings for all document chunks
  console.log('  Creating embeddings... (this may take a minute)');
  const texts = documents.map(doc => doc.pageContent);
  const vectors = await embeddings.embedDocuments(texts);

  console.log('  ✓ Embeddings created\n');

  // Check if collection exists, if not create it
  console.log('  📦 Setting up Qdrant collection...');
  try {
    await qdrantClient.getCollection(collectionName);
    console.log(`  ✓ Collection "${collectionName}" exists`);

    // Delete all existing points
    console.log('  🗑️  Clearing old vectors from Qdrant...');
    await qdrantClient.deleteCollection(collectionName);
    console.log('  ✓ Deleted old collection');
  } catch (error) {
    console.log(`  ℹ️  Collection "${collectionName}" doesn't exist yet (will create)`);
  }

  // Create fresh collection
  await qdrantClient.createCollection(collectionName, {
    vectors: {
      size: vectors[0].length, // 1536 for text-embedding-3-small
      distance: 'Cosine',
    },
  });
  console.log(`  ✓ Created collection with vector size ${vectors[0].length}\n`);

  // Prepare points for Qdrant
  const points = documents.map((doc, index) => ({
    id: index + 1,
    vector: vectors[index],
    payload: {
      pageContent: doc.pageContent,
      documentName: doc.metadata.documentName,
      pageCount: doc.metadata.pageCount,
      processedAt: doc.metadata.processedAt,
      // Include article metadata if available (for legal documents)
      article: doc.metadata.article || null,
      chunkType: doc.metadata.chunkType || 'standard',
    },
  }));

  // Upload to Qdrant in batches (to avoid request size limits)
  console.log('  💾 Uploading vectors to Qdrant in batches...');
  const batchSize = 100; // Upload 100 vectors at a time
  const totalBatches = Math.ceil(points.length / batchSize);

  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`    Uploading batch ${batchNum}/${totalBatches} (${batch.length} vectors)...`);

    await qdrantClient.upsert(collectionName, {
      wait: true,
      points: batch,
    });
  }

  console.log(`  ✓ Uploaded ${points.length} vectors to Qdrant in ${totalBatches} batches\n`);

  return { count: points.length, collectionName };
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   📚 Legal Documents Processing for RAG Chatbot');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    // Connect to MongoDB (for document tracking)
    await connectToDatabase();

    // Connect to Qdrant (for vector storage)
    await connectToQdrant();

    // Process all documents
    const chunks = await processAllDocuments();

    if (chunks.length === 0) {
      console.log('⚠️  No new documents to process. Vector store unchanged.\n');
      process.exit(0);
    }

    // Create vector store
    await createVectorStore(chunks);

    console.log('═══════════════════════════════════════════════════════');
    console.log('   ✅ Document processing completed successfully!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Vectors are now stored in Qdrant Cloud (nexa_legal_docs collection)');
    console.log('2. Restart your server to connect to Qdrant');
    console.log('3. Ask questions in the chatbot');
    console.log('4. Answers will now include citations from your legal documents!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
