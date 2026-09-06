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
 * 3. Splits text into chunks — by article (Член) for laws, characters otherwise
 * 4. Prefixes every chunk with its law/document name so the embedding carries
 *    the source identity ("Член 76" of ЗРО ≠ "Член 76" of ЗТД)
 * 5. Skips stale institutional brochures (older than BROCHURE_YEAR_CUTOFF)
 * 6. Creates embeddings, rebuilds the Qdrant collection, adds full-text index
 * 7. Tracks processed documents in MongoDB
 *
 * INGESTION MODE (default: MERGE-SAFE):
 *   The collection is NEVER dropped. For each file in `legal sources/` we
 *   delete only THAT document's existing points (matched by `documentName`)
 *   and re-upsert its fresh chunks. Chunk point IDs are deterministic UUIDs
 *   derived from `documentName + chunkIndex`, so re-processing a file replaces
 *   its own chunks in place and cannot collide with points ingested by any
 *   other pipeline.
 *
 *   WHY THIS MATTERS: a large part of the live corpus (recovered case law,
 *   newer laws, commentary) exists ONLY in Qdrant and is NOT in the
 *   `legal sources/` folder. The old behavior deleted the whole collection and
 *   rebuilt only from the folder, silently destroying every chunk that wasn't
 *   on disk. Merge-safe ingestion lets the corpus GROW (add ЗЗЛП, БЗР, tax
 *   laws, etc.) without ever wiping what's already there.
 *
 * HARD REBUILD (opt-in, destructive):
 *   Run with `--hard-rebuild` to drop and recreate the collection from ONLY the
 *   folder contents. Use this only for a deliberate clean slate — it will
 *   delete any chunk not present on disk. You will be warned and must confirm.
 */

// Configuration
const LEGAL_SOURCES_FOLDER = path.join(__dirname, '../legal sources');
const VECTOR_STORE_PATH = path.join(__dirname, '../chatbot/vector_store');
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
// Institutional brochures/flyers older than this year are excluded — they cite
// superseded rates/procedures and pollute retrieval. Laws are never excluded.
const BROCHURE_YEAR_CUTOFF = parseInt(process.env.BROCHURE_YEAR_CUTOFF || '2020', 10);

/**
 * Detect whether a file is an institutional brochure/flyer/prospect (guidance,
 * NOT a law) from its filename.
 */
function isBrochureFile(fileName) {
  return /brosura|flaer|prospekt|informativen|isbn|^\d{2}[-_]\d+/i.test(fileName);
}

/**
 * Extract a publication year from the filename (e.g. "19.10.2021", "_2013").
 * Returns null when no plausible year is found.
 */
function extractYearFromFilename(fileName) {
  const dateMatch = fileName.match(/\d{2}\.\d{2}\.(20\d{2})/);
  if (dateMatch) return parseInt(dateMatch[1], 10);
  const yearMatch = fileName.match(/(?:^|[_\-\s])(20\d{2})(?:[._\-\s]|$)/);
  if (yearMatch) return parseInt(yearMatch[1], 10);
  return null;
}

/**
 * Human-readable source title from a filename: strips extension, date suffixes
 * and archival codes, and de-underscores. Used as the chunk content prefix.
 */
function cleanDocTitle(fileName) {
  return fileName
    .replace(/\.(pdf|docx)$/i, '')
    .replace(/\d{2}\.\d{2}\.\d{4}/g, '')
    .replace(/^[\d\-_.]+/, '')
    .replace(/ISBN[-_][\d\-_]+/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[,\s]+$/, '')
    .trim() || fileName;
}

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
 * Deterministic point ID (UUID string) for a chunk, derived from its source
 * document name and its index within that document. Re-processing the same file
 * yields the SAME ids, so an upsert replaces the file's own chunks in place;
 * different documents (and foreign-pipeline chunks) can never collide.
 */
function pointIdFor(documentName, chunkIndex) {
  const h = crypto.createHash('md5').update(`${documentName}#${chunkIndex}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/**
 * Delete all existing points for a single document (by `documentName` payload),
 * so a re-process replaces the file's chunks without touching any other source.
 * Safe to call for a document that has no points yet.
 */
async function deleteDocumentPoints(collectionName, documentName) {
  await qdrantClient.delete(collectionName, {
    wait: true,
    filter: { must: [{ key: 'documentName', match: { value: documentName } }] },
  });
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

  // Source identity prefix embedded INTO the chunk text. Without it, the
  // vector for "Член 76" of ЗРО is indistinguishable from "Член 76" of ЗТД —
  // the document name lived only in metadata, invisible to the embedder.
  const docTitle = cleanDocTitle(fileName);
  const docYear = extractYearFromFilename(fileName);
  const isBrochure = isBrochureFile(fileName);
  const sourceLabel = isBrochure
    ? `${docTitle}${docYear ? ` (упатство, ${docYear})` : ' (упатство)'}`
    : docTitle;

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
        const subChunks = splitLongArticle(articleText, articleNumber, fileName, pageCount, sourceLabel);
        chunks.push(...subChunks);
      } else {
        // Create single chunk for this article
        chunks.push({
          pageContent: `${sourceLabel} — ${articleText}`,
          metadata: {
            documentName: fileName,
            pageCount: pageCount,
            article: articleNumber,
            docYear,
            isBrochure,
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

    const docs = await textSplitter.createDocuments(
      [text],
      [{
        documentName: fileName,
        pageCount: pageCount,
        docYear,
        isBrochure,
        processedAt: new Date().toISOString(),
        chunkType: 'standard'
      }]
    );
    // Prefix each chunk with the source label (embedded + visible to the LLM).
    for (const doc of docs) {
      doc.pageContent = `${sourceLabel} — ${doc.pageContent}`;
    }
    return docs;
  }
}

/**
 * Split a long article into smaller sub-chunks while preserving context
 */
function splitLongArticle(articleText, articleNumber, fileName, pageCount, sourceLabel) {
  const chunks = [];
  const maxChunkSize = 2500; // Slightly smaller than CHUNK_SIZE to allow for overlap
  const prefix = sourceLabel ? `${sourceLabel} — ` : '';

  // Try to split by paragraphs or numbered items first
  const paragraphs = articleText.split(/\n\n+/);

  let currentChunk = '';
  let subChunkIndex = 1;

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
      // Save current chunk (sub-chunks after the first repeat the article
      // number in the text since the split point loses the "Член X" header)
      const header = subChunkIndex > 1 ? `${articleNumber} (продолжение): ` : '';
      chunks.push({
        pageContent: `${prefix}${header}${currentChunk.trim()}`,
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
    const header = subChunkIndex > 1 ? `${articleNumber} (продолжение): ` : '';
    chunks.push({
      pageContent: `${prefix}${header}${currentChunk.trim()}`,
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

  // Skip stale institutional brochures — outdated rates/procedures presented
  // as current actively harm answer quality. Laws are never skipped.
  if (isBrochureFile(fileName)) {
    const year = extractYearFromFilename(fileName);
    if (year && year < BROCHURE_YEAR_CUTOFF) {
      console.log(`  🗑️  Excluding stale brochure (${year} < ${BROCHURE_YEAR_CUTOFF}): ${fileName}`);
      await db.collection('chatbot_documents').updateOne(
        { fileName },
        { $set: { fileName, status: 'excluded_stale', docYear: year, processedAt: new Date() } },
        { upsert: true }
      );
      // Signal exclusion so the caller can purge any previously-ingested chunks
      // for this file (merge-safe mode). Returning null would hide it.
      return { excluded: true, fileName };
    }
  }

  // Calculate file hash (kept for tracking/telemetry — NOT used to skip:
  // every run is a full rebuild, see header comment)
  const fileHash = await calculateFileHash(filePath);

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
  const excludedFileNames = []; // stale brochures whose old chunks must be purged
  let processedCount = 0;
  let skippedCount = 0;

  for (const file of documentFiles) {
    const filePath = path.join(LEGAL_SOURCES_FOLDER, file);

    try {
      const result = await processDocument(filePath);

      if (result && result.excluded) {
        excludedFileNames.push(result.fileName);
        skippedCount++;
      } else if (Array.isArray(result) && result.length > 0) {
        allChunks.push(...result);
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

  return { allChunks, excludedFileNames };
}

/**
 * Embed all chunk texts, with a cost estimate. Returns the vector array.
 */
async function embedChunks(documents) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  });

  console.log(`  Using model: ${process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'}`);
  console.log(`  Embedding ${documents.length} chunks...`);

  const totalChars = documents.reduce((sum, doc) => sum + doc.pageContent.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4); // ~1 token ≈ 4 chars
  const estimatedCost = (estimatedTokens / 1000000) * 0.02; // $0.02 per 1M tokens
  console.log(`  Estimated tokens: ${estimatedTokens.toLocaleString()}  (~$${estimatedCost.toFixed(4)})`);

  const texts = documents.map(doc => doc.pageContent);
  const vectors = await embeddings.embedDocuments(texts);
  console.log('  ✓ Embeddings created\n');
  return vectors;
}

/**
 * Ensure the collection exists (create if missing — NEVER drop) and that the
 * payload indexes the chatbot relies on are present:
 *   - pageContent (text)     → hybrid keyword search
 *   - documentName (keyword) → per-document delete/replace + filtered retrieval
 * createPayloadIndex is safe to call when the index already exists.
 */
async function ensureCollectionAndIndexes(collectionName, vectorSize) {
  let exists = true;
  try {
    await qdrantClient.getCollection(collectionName);
    console.log(`  ✓ Collection "${collectionName}" exists (merge-safe: not dropping it)`);
  } catch (e) {
    exists = false;
  }

  if (!exists) {
    console.log(`  ℹ️  Collection "${collectionName}" not found — creating it`);
    await qdrantClient.createCollection(collectionName, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });
    console.log(`  ✓ Created collection with vector size ${vectorSize}`);
  }

  const ensureIndex = async (field, schema) => {
    try {
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: field, field_schema: schema, wait: true,
      });
      console.log(`  ✓ Payload index ensured: ${field}`);
    } catch (e) {
      console.log(`  ℹ️  Payload index ${field} already present (${e.message.slice(0, 60)})`);
    }
  };
  await ensureIndex('pageContent', { type: 'text', tokenizer: 'word', lowercase: true });
  await ensureIndex('documentName', 'keyword');
  console.log('');
}

/** Build a Qdrant point for a chunk with a deterministic per-document id. */
function toPoint(doc, vector, chunkIndexWithinDoc) {
  return {
    id: pointIdFor(doc.metadata.documentName, chunkIndexWithinDoc),
    vector,
    payload: {
      pageContent: doc.pageContent,
      documentName: doc.metadata.documentName,
      pageCount: doc.metadata.pageCount,
      processedAt: doc.metadata.processedAt,
      article: doc.metadata.article || null,
      chunkType: doc.metadata.chunkType || 'standard',
      docYear: doc.metadata.docYear || null,
      isBrochure: doc.metadata.isBrochure || false,
    },
  };
}

/** Build points for all documents with per-document (stable) chunk indexes. */
function buildPoints(documents, vectors) {
  const perDocIndex = new Map();
  return documents.map((doc, i) => {
    const name = doc.metadata.documentName;
    const idx = perDocIndex.get(name) || 0;
    perDocIndex.set(name, idx + 1);
    return toPoint(doc, vectors[i], idx);
  });
}

/** Upload points to Qdrant in batches. */
async function upsertPoints(collectionName, points) {
  console.log('  💾 Uploading vectors to Qdrant in batches...');
  const batchSize = 100;
  const totalBatches = Math.ceil(points.length / batchSize);
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    console.log(`    Uploading batch ${batchNum}/${totalBatches} (${batch.length} vectors)...`);
    await qdrantClient.upsert(collectionName, { wait: true, points: batch });
  }
  console.log(`  ✓ Uploaded ${points.length} vectors in ${totalBatches} batches\n`);
}

/**
 * MERGE-SAFE ingestion (default). For each source document in the folder:
 * delete only that document's existing points, then upsert its fresh chunks.
 * Never touches points from documents not in the folder (recovered corpus).
 * Also purges chunks of files that are now excluded as stale.
 */
async function mergeVectorStore(documents, excludedFileNames) {
  console.log('🔮 Merge-safe ingestion — embedding new/updated chunks...\n');
  const collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';
  console.log(`  Target collection: ${collectionName}\n`);

  const vectors = await embedChunks(documents);
  await ensureCollectionAndIndexes(collectionName, vectors[0].length);

  // Purge stale-excluded files' old chunks (if any were ingested before).
  for (const fileName of excludedFileNames) {
    console.log(`  🧹 Purging stale-excluded document chunks: ${fileName}`);
    await deleteDocumentPoints(collectionName, fileName);
  }
  if (excludedFileNames.length) console.log('');

  const points = buildPoints(documents, vectors);

  // Replace each folder document's chunks: delete-by-documentName, then upsert.
  const docNames = [...new Set(documents.map(d => d.metadata.documentName))];
  console.log(`  ♻️  Replacing chunks for ${docNames.length} folder document(s)...`);
  for (const name of docNames) {
    await deleteDocumentPoints(collectionName, name);
  }
  console.log('');

  await upsertPoints(collectionName, points);
  return { count: points.length, collectionName, mode: 'merge' };
}

/**
 * HARD REBUILD (opt-in, destructive): drop the collection and rebuild from ONLY
 * the folder. Deletes any chunk not present on disk. Requires --hard-rebuild.
 */
async function hardRebuildVectorStore(documents) {
  console.log('💥 HARD REBUILD — dropping and recreating the collection...\n');
  const collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';

  const vectors = await embedChunks(documents);

  try {
    await qdrantClient.deleteCollection(collectionName);
    console.log(`  🗑️  Dropped existing collection "${collectionName}"`);
  } catch (e) {
    console.log(`  ℹ️  Collection "${collectionName}" did not exist`);
  }
  await qdrantClient.createCollection(collectionName, {
    vectors: { size: vectors[0].length, distance: 'Cosine' },
  });
  console.log(`  ✓ Created fresh collection (vector size ${vectors[0].length})`);
  await ensureCollectionAndIndexes(collectionName, vectors[0].length);

  const points = buildPoints(documents, vectors);
  await upsertPoints(collectionName, points);
  return { count: points.length, collectionName, mode: 'hard-rebuild' };
}

/** Prompt the user for a y/N confirmation on stdin. */
function confirm(question) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
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

    const hardRebuild = process.argv.includes('--hard-rebuild');

    // A hard rebuild is destructive: it drops the whole collection and rebuilds
    // ONLY from the folder, deleting any chunk (e.g. recovered case law) that is
    // not on disk. Require an explicit confirmation before doing that.
    if (hardRebuild) {
      const collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';
      let existing = null;
      try {
        const c = await qdrantClient.getCollection(collectionName);
        existing = c.points_count;
      } catch (e) { /* collection may not exist yet */ }
      console.log('⚠️  --hard-rebuild will DROP the entire collection and rebuild');
      console.log('    from ONLY the `legal sources/` folder. Any chunk not on');
      console.log('    disk (recovered case law, laws ingested elsewhere) will be');
      console.log(`    PERMANENTLY DELETED.${existing != null ? ` Current points: ${existing}.` : ''}\n`);
      const ok = process.argv.includes('--yes') || await confirm('    Type "yes" to proceed: ');
      if (!ok) {
        console.log('\n🛑 Aborted. No changes made.\n');
        process.exit(0);
      }
    }

    // Process all documents
    const { allChunks, excludedFileNames } = await processAllDocuments();

    if (allChunks.length === 0 && excludedFileNames.length === 0) {
      console.log('⚠️  No documents to process. Vector store unchanged.\n');
      process.exit(0);
    }

    // Ingest: merge-safe by default, hard rebuild only when explicitly asked.
    const result = hardRebuild
      ? await hardRebuildVectorStore(allChunks)
      : await mergeVectorStore(allChunks, excludedFileNames);

    console.log('═══════════════════════════════════════════════════════');
    console.log(`   ✅ Document processing completed (${result.mode})!`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Next steps:');
    console.log(`1. ${result.count} vectors written to Qdrant (${result.collectionName})`);
    console.log('2. Restart your server to connect to Qdrant');
    console.log('3. Run `node scripts/eval-rag.js` — the hit rate must not drop');
    console.log('4. Ask questions in the chatbot; answers cite your legal documents\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
