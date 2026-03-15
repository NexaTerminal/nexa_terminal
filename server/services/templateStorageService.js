const { GridFSBucket, ObjectId } = require('mongodb');

/**
 * Template Storage Service
 *
 * Handles GridFS operations for storing and retrieving custom document templates.
 * Documents are stored in the 'custom_templates' bucket.
 */
class TemplateStorageService {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for TemplateStorageService');
    }

    this.db = db;
    this.bucket = new GridFSBucket(db, {
      bucketName: 'custom_template_files',
      chunkSizeBytes: 261120
    });

    console.log('✅ TemplateStorageService initialized with GridFS bucket: custom_template_files');
  }

  /**
   * Store a template .docx buffer to GridFS
   */
  async storeTemplate(buffer, metadata) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer provided');
    }

    try {
      const userId = metadata.userId instanceof ObjectId
        ? metadata.userId
        : new ObjectId(metadata.userId);

      const uploadStream = this.bucket.openUploadStream(metadata.fileName, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          userId,
          templateType: metadata.templateType || 'original',
          originalSize: buffer.length,
          uploadedAt: new Date()
        }
      });

      await new Promise((resolve, reject) => {
        uploadStream.end(buffer);
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      console.log(`✅ Template stored to GridFS: ${metadata.fileName} (fileId: ${uploadStream.id})`);
      return uploadStream.id;
    } catch (error) {
      console.error('❌ Error storing template to GridFS:', error);
      throw new Error(`Failed to store template: ${error.message}`);
    }
  }

  /**
   * Retrieve a template buffer from GridFS
   */
  async retrieveTemplate(fileId) {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    try {
      const objectId = fileId instanceof ObjectId ? fileId : new ObjectId(fileId);
      const downloadStream = this.bucket.openDownloadStream(objectId);
      const chunks = [];

      for await (const chunk of downloadStream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      return buffer;
    } catch (error) {
      if (error.message && error.message.includes('FileNotFound')) {
        throw new Error('Template file not found in storage');
      }
      throw new Error(`Failed to retrieve template: ${error.message}`);
    }
  }

  /**
   * Delete a template from GridFS
   */
  async deleteTemplate(fileId) {
    if (!fileId) return;

    try {
      const objectId = fileId instanceof ObjectId ? fileId : new ObjectId(fileId);
      await this.bucket.delete(objectId);
    } catch (error) {
      if (error.message && error.message.includes('FileNotFound')) {
        return; // Already deleted, not an error
      }
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }
}

module.exports = TemplateStorageService;
