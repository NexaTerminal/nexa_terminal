const { GridFSBucket, ObjectId } = require('mongodb');

/**
 * Document Storage Service
 *
 * Handles GridFS operations for storing and retrieving shared documents.
 * Documents are stored in the 'shared_documents' bucket (creates two collections:
 * shared_documents.files and shared_documents.chunks).
 *
 * GridFS is used to:
 * - Store documents larger than 16MB BSON limit
 * - Efficiently serve documents without loading entire file into memory
 * - Support streaming for large file downloads
 * - Maintain metadata about each stored document
 */
class DocumentStorageService {
  /**
   * Initialize the service with a MongoDB database connection
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for DocumentStorageService');
    }

    this.db = db;

    // Create GridFS bucket for shared documents
    this.bucket = new GridFSBucket(db, {
      bucketName: 'shared_documents',
      chunkSizeBytes: 261120 // 255KB chunks (default)
    });

    console.log('✅ DocumentStorageService initialized with GridFS bucket: shared_documents');
  }

  /**
   * Store a document buffer to GridFS
   *
   * @param {Buffer} buffer - The document content as a Buffer
   * @param {Object} metadata - Document metadata
   * @param {string} metadata.fileName - Original filename
   * @param {ObjectId|string} metadata.userId - Document owner's user ID
   * @param {string} metadata.documentType - Type of document (e.g., 'bonus-payment')
   * @param {string} metadata.shareToken - Unique share token (UUID)
   * @returns {Promise<ObjectId>} The GridFS file ID
   * @throws {Error} If storage fails
   */
  async storeDocument(buffer, metadata) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer provided - must be a Buffer instance');
    }

    if (!metadata || !metadata.fileName || !metadata.userId || !metadata.documentType || !metadata.shareToken) {
      throw new Error('Missing required metadata: fileName, userId, documentType, and shareToken are required');
    }

    try {
      // Ensure userId is ObjectId
      const userId = metadata.userId instanceof ObjectId
        ? metadata.userId
        : new ObjectId(metadata.userId);

      // Create upload stream
      const uploadStream = this.bucket.openUploadStream(metadata.fileName, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          userId,
          documentType: metadata.documentType,
          shareToken: metadata.shareToken,
          originalSize: buffer.length,
          uploadedAt: new Date()
        }
      });

      // Write buffer to stream and wait for completion
      await new Promise((resolve, reject) => {
        uploadStream.end(buffer);
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      console.log(`✅ Document stored to GridFS: ${metadata.fileName} (fileId: ${uploadStream.id})`);

      return uploadStream.id; // Returns ObjectId of the GridFS file
    } catch (error) {
      console.error('❌ Error storing document to GridFS:', error);
      throw new Error(`Failed to store document: ${error.message}`);
    }
  }

  /**
   * Retrieve a document from GridFS
   *
   * @param {ObjectId|string} fileId - The GridFS file ID
   * @returns {Promise<Buffer>} The document content as a Buffer
   * @throws {Error} If file not found or retrieval fails
   */
  async retrieveDocument(fileId) {
    if (!fileId) {
      throw new Error('File ID is required to retrieve document');
    }

    try {
      // Ensure fileId is ObjectId
      const objectId = fileId instanceof ObjectId ? fileId : new ObjectId(fileId);

      // Open download stream
      const downloadStream = this.bucket.openDownloadStream(objectId);
      const chunks = [];

      // Read all chunks from stream
      for await (const chunk of downloadStream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      console.log(`✅ Document retrieved from GridFS (fileId: ${objectId}, size: ${buffer.length} bytes)`);

      return buffer;
    } catch (error) {
      console.error('❌ Error retrieving document from GridFS:', error);

      // Check if error is "file not found"
      if (error.message && error.message.includes('FileNotFound')) {
        throw new Error('Document not found in storage');
      }

      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }

  /**
   * Delete a document from GridFS
   *
   * @param {ObjectId|string} fileId - The GridFS file ID
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails
   */
  async deleteDocument(fileId) {
    if (!fileId) {
      throw new Error('File ID is required to delete document');
    }

    try {
      // Ensure fileId is ObjectId
      const objectId = fileId instanceof ObjectId ? fileId : new ObjectId(fileId);

      // Delete the file (automatically deletes all chunks)
      await this.bucket.delete(objectId);

      console.log(`✅ Document deleted from GridFS (fileId: ${objectId})`);
    } catch (error) {
      console.error('❌ Error deleting document from GridFS:', error);

      // Check if error is "file not found"
      if (error.message && error.message.includes('FileNotFound')) {
        throw new Error('Document not found in storage');
      }

      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Get file metadata from GridFS
   *
   * @param {ObjectId|string} fileId - The GridFS file ID
   * @returns {Promise<Object|null>} File metadata or null if not found
   * @throws {Error} If query fails
   */
  async getFileMetadata(fileId) {
    if (!fileId) {
      throw new Error('File ID is required to get metadata');
    }

    try {
      // Ensure fileId is ObjectId
      const objectId = fileId instanceof ObjectId ? fileId : new ObjectId(fileId);

      // Query the files collection
      const files = await this.bucket.find({ _id: objectId }).toArray();

      if (files.length === 0) {
        console.log(`⚠️  File metadata not found (fileId: ${objectId})`);
        return null;
      }

      console.log(`✅ File metadata retrieved (fileId: ${objectId})`);
      return files[0];
    } catch (error) {
      console.error('❌ Error getting file metadata from GridFS:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * List all files for a specific user
   *
   * @param {ObjectId|string} userId - The user's ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of files to return
   * @param {number} options.skip - Number of files to skip
   * @returns {Promise<Array>} Array of file metadata
   * @throws {Error} If query fails
   */
  async listUserDocuments(userId, options = {}) {
    if (!userId) {
      throw new Error('User ID is required to list documents');
    }

    try {
      // Ensure userId is ObjectId
      const objectId = userId instanceof ObjectId ? userId : new ObjectId(userId);

      const { limit = 50, skip = 0 } = options;

      // Query files by userId in metadata
      const files = await this.bucket
        .find({ 'metadata.userId': objectId })
        .limit(limit)
        .skip(skip)
        .sort({ uploadDate: -1 })
        .toArray();

      console.log(`✅ Found ${files.length} documents for user ${objectId}`);
      return files;
    } catch (error) {
      console.error('❌ Error listing user documents:', error);
      throw new Error(`Failed to list user documents: ${error.message}`);
    }
  }

  /**
   * Get storage statistics
   *
   * @returns {Promise<Object>} Storage statistics
   * @throws {Error} If query fails
   */
  async getStats() {
    try {
      const filesCollection = this.db.collection('shared_documents.files');
      const chunksCollection = this.db.collection('shared_documents.chunks');

      const [fileCount, totalSize] = await Promise.all([
        filesCollection.countDocuments(),
        filesCollection.aggregate([
          {
            $group: {
              _id: null,
              totalBytes: { $sum: '$length' }
            }
          }
        ]).toArray()
      ]);

      const chunkCount = await chunksCollection.countDocuments();

      const stats = {
        totalFiles: fileCount,
        totalChunks: chunkCount,
        totalSizeBytes: totalSize.length > 0 ? totalSize[0].totalBytes : 0,
        totalSizeMB: totalSize.length > 0 ? (totalSize[0].totalBytes / (1024 * 1024)).toFixed(2) : 0
      };

      console.log('✅ Storage stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  /**
   * Check if GridFS bucket exists and is properly configured
   *
   * @returns {Promise<boolean>} True if bucket exists and is accessible
   */
  async healthCheck() {
    try {
      const collections = await this.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      const filesExists = collectionNames.includes('shared_documents.files');
      const chunksExists = collectionNames.includes('shared_documents.chunks');

      if (filesExists && chunksExists) {
        console.log('✅ GridFS bucket health check passed');
        return true;
      } else {
        console.log('⚠️  GridFS bucket collections not yet created (will be created on first upload)');
        return true; // Still healthy, collections are created on first write
      }
    } catch (error) {
      console.error('❌ GridFS bucket health check failed:', error);
      return false;
    }
  }
}

module.exports = DocumentStorageService;
