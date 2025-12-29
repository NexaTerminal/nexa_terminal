const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const crypto = require('crypto');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

/**
 * Document Processing Service
 * Handles processing of legal documents for the RAG chatbot system
 *
 * Extracted from process-documents.js script for reusable on-demand processing
 */
class DocumentProcessingService {
  constructor(database, qdrantClient) {
    this.db = database;
    this.qdrantClient = qdrantClient;
    this.collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';
    this.chunkSize = 1000;
    this.chunkOverlap = 200;

    // Initialize embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
    });
  }

  /**
   * Calculate MD5 hash of file content for tracking changes
   */
  async calculateFileHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }

  /**
   * Extract text from PDF file
   */
  async extractTextFromPDF(filePath) {
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
  async extractTextFromDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });

    return {
      text: result.value,
      pageCount: Math.ceil(result.value.length / 2000) // Estimate pages
    };
  }

  /**
   * Split a long article into smaller sub-chunks while preserving context
   */
  splitLongArticle(articleText, articleNumber, fileName, pageCount) {
    const chunks = [];
    const maxChunkSize = 2500;

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
            source: fileName,
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
          source: fileName,
          pageCount: pageCount,
          article: subChunkIndex > 1 ? `${articleNumber} (Part ${subChunkIndex})` : articleNumber,
          processedAt: new Date().toISOString(),
          chunkType: subChunkIndex > 1 ? 'article-split' : 'article'
        }
      });
    }

    return chunks;
  }

  /**
   * Intelligent chunking based on legal article (член) boundaries
   * Falls back to standard chunking if no articles detected
   */
  async createIntelligentChunks(text, fileName, pageCount) {
    // Pattern to detect article boundaries in Macedonian legal documents
    // Matches: "Член 1", "Член 15", "ЧЛЕН 1", etc.
    const articlePattern = /(?:^|\n)(\s*(?:Член|ЧЛЕН|член)\s+\d+[а-в]?)/gm;

    const matches = [...text.matchAll(articlePattern)];

    // If we found articles, split by them
    if (matches.length > 5) { // At least 5 articles to consider it a legal document
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
          const subChunks = this.splitLongArticle(articleText, articleNumber, fileName, pageCount);
          chunks.push(...subChunks);
        } else {
          // Create single chunk for this article
          chunks.push({
            pageContent: articleText,
            metadata: {
              documentName: fileName,
              source: fileName,
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
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.chunkSize,
        chunkOverlap: this.chunkOverlap,
        separators: ['\n\n', '\n', '. ', ' ', '']
      });

      return await textSplitter.createDocuments(
        [text],
        [{
          documentName: fileName,
          source: fileName,
          pageCount: pageCount,
          processedAt: new Date().toISOString(),
          chunkType: 'standard'
        }]
      );
    }
  }

  /**
   * Create embeddings for document chunks
   */
  async createEmbeddings(chunks) {
    const texts = chunks.map(doc => doc.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    return vectors;
  }

  /**
   * Upload chunks and vectors to Qdrant in batches
   */
  async uploadToQdrant(chunks, vectors) {
    // Get current highest ID in collection
    let maxId = 0;
    try {
      const scrollResult = await this.qdrantClient.scroll(this.collectionName, {
        limit: 1,
        with_payload: false,
        with_vector: false
      });

      if (scrollResult.points.length > 0) {
        maxId = Math.max(...scrollResult.points.map(p => parseInt(p.id) || 0));
      }
    } catch (error) {
      // Collection might not exist yet
      console.log('Collection might be empty or not exist yet');
    }

    // Prepare points for Qdrant
    const points = chunks.map((doc, index) => ({
      id: maxId + index + 1,
      vector: vectors[index],
      payload: {
        text: doc.pageContent,
        pageContent: doc.pageContent,
        metadata: {
          documentName: doc.metadata.documentName,
          source: doc.metadata.source,
          pageCount: doc.metadata.pageCount,
          processedAt: doc.metadata.processedAt,
          article: doc.metadata.article || null,
          chunkType: doc.metadata.chunkType || 'standard'
        }
      }
    }));

    // Upload to Qdrant in batches (to avoid request size limits)
    const batchSize = 100;
    const totalBatches = Math.ceil(points.length / batchSize);

    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);

      await this.qdrantClient.upsert(this.collectionName, {
        wait: true,
        points: batch
      });
    }

    return {
      uploaded: points.length,
      batches: totalBatches
    };
  }

  /**
   * Delete all chunks from a document by source name
   */
  async deleteFromQdrant(documentName) {
    let deletedCount = 0;
    let offset = null;

    do {
      const response = await this.qdrantClient.scroll(this.collectionName, {
        limit: 100,
        offset: offset,
        with_payload: true,
        with_vector: false,
        filter: {
          must: [
            {
              key: 'metadata.source',
              match: { value: documentName }
            }
          ]
        }
      });

      if (response.points.length > 0) {
        const pointIds = response.points.map(p => p.id);

        await this.qdrantClient.delete(this.collectionName, {
          points: pointIds
        });

        deletedCount += pointIds.length;
      }

      offset = response.next_page_offset;
    } while (offset !== null && offset !== undefined);

    return deletedCount;
  }

  /**
   * Get all documents from Qdrant
   */
  async getQdrantDocuments() {
    const uniqueDocuments = new Map();
    let offset = null;
    let totalChunks = 0;

    do {
      const response = await this.qdrantClient.scroll(this.collectionName, {
        limit: 100,
        offset: offset,
        with_payload: true,
        with_vector: false
      });

      for (const point of response.points) {
        totalChunks++;
        const payload = point.payload;
        const source = payload.metadata?.source || payload.source || 'Unknown';

        if (!uniqueDocuments.has(source)) {
          uniqueDocuments.set(source, {
            documentName: source,
            chunkCount: 0,
            uploadedAt: payload.metadata?.processedAt || null,
            pageCount: payload.metadata?.pageCount || null
          });
        }

        uniqueDocuments.get(source).chunkCount++;
      }

      offset = response.next_page_offset;
    } while (offset !== null && offset !== undefined);

    return {
      documents: Array.from(uniqueDocuments.values()),
      totalChunks
    };
  }

  /**
   * Process a single document (main entry point for upload)
   */
  async processSingleDocument(filePath) {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).toLowerCase();

    // Calculate file hash
    const fileHash = await this.calculateFileHash(filePath);

    // Check if already processed with same hash
    const existing = await this.db.collection('chatbot_documents').findOne({ fileName });
    if (existing && existing.fileHash === fileHash) {
      throw new Error('Document already processed with same content');
    }

    // Extract text based on file type
    let extractedData;
    if (fileExt === '.pdf') {
      extractedData = await this.extractTextFromPDF(filePath);
    } else if (fileExt === '.docx') {
      extractedData = await this.extractTextFromDOCX(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileExt}`);
    }

    const { text, pageCount } = extractedData;

    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from document');
    }

    // Create intelligent chunks
    const chunks = await this.createIntelligentChunks(text, fileName, pageCount);

    // Create embeddings
    const vectors = await this.createEmbeddings(chunks);

    // Upload to Qdrant
    const uploadResult = await this.uploadToQdrant(chunks, vectors);

    // Store document metadata in MongoDB
    await this.db.collection('chatbot_documents').updateOne(
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

    return {
      fileName,
      pageCount,
      chunkCount: chunks.length,
      textLength: text.length,
      uploaded: uploadResult.uploaded,
      batches: uploadResult.batches
    };
  }
}

module.exports = DocumentProcessingService;
