const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const DocumentStorageService = require('../services/documentStorageService');

/**
 * Shared Documents Controller
 *
 * Handles all operations related to shareable document links:
 * - Creating shareable links (authenticated)
 * - Listing user's shared documents (authenticated)
 * - Revoking links (authenticated)
 * - Viewing shared documents (public)
 * - Downloading shared documents (public)
 * - Confirming documents (public)
 * - Adding comments (public)
 */
class SharedDocumentsController {
  /**
   * Initialize controller with database connection
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required for SharedDocumentsController');
    }

    this.db = db;
    this.documentStorageService = new DocumentStorageService(db);
    this.collection = db.collection('shared_documents');

    console.log('✅ SharedDocumentsController initialized');
  }

  /**
   * Create MongoDB indexes for shared_documents collection
   * Call this once during server initialization
   */
  async createIndexes() {
    try {
      // Unique index on shareToken for fast lookups
      await this.collection.createIndex({ shareToken: 1 }, { unique: true });

      // Index on userId for listing user's documents
      await this.collection.createIndex({ userId: 1 });

      // Index on createdAt for sorting
      await this.collection.createIndex({ createdAt: -1 });

      // TTL index on expiresAt for automatic cleanup of expired documents
      await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

      console.log('✅ Shared documents indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating shared documents indexes:', error);
      // Don't throw - indexes might already exist
    }
  }

  // ==========================================
  // AUTHENTICATED ENDPOINTS (for document owners)
  // ==========================================

  /**
   * Create a shareable link for a document
   * Note: This endpoint is typically NOT called directly by frontend
   * Instead, baseDocumentController automatically creates share links
   *
   * POST /api/shared-documents/create
   * @param {Request} req
   * @param {Response} res
   */
  createShareableLink = async (req, res) => {
    try {
      const { documentBuffer, documentType, fileName, formData } = req.body;
      const userId = req.user._id;

      // Validate input
      if (!documentBuffer || !documentType || !fileName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: documentBuffer, documentType, fileName'
        });
      }

      // Convert buffer from Base64 if needed
      const buffer = Buffer.isBuffer(documentBuffer)
        ? documentBuffer
        : Buffer.from(documentBuffer, 'base64');

      // Generate unique share token
      const shareToken = uuidv4();

      // Store document in GridFS
      const fileId = await this.documentStorageService.storeDocument(buffer, {
        fileName,
        userId,
        documentType,
        shareToken
      });

      // Create shared document record
      const sharedDoc = {
        shareToken,
        userId: new ObjectId(userId),
        documentType,
        fileName,
        fileId,
        formData: formData || {},
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isRevoked: false,
        viewCount: 0,
        downloadCount: 0,
        isConfirmed: false,
        confirmedAt: null,
        confirmedBy: null,
        comments: []
      };

      await this.collection.insertOne(sharedDoc);

      // Return shareable URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const shareUrl = `${frontendUrl}/shared/${shareToken}`;

      console.log(`✅ Shareable link created: ${shareUrl}`);

      res.json({
        success: true,
        shareToken,
        shareUrl,
        expiresAt: sharedDoc.expiresAt
      });
    } catch (error) {
      console.error('❌ Error creating shareable link:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при креирање на линк за споделување'
      });
    }
  };

  /**
   * List user's shared documents
   *
   * GET /api/shared-documents/my-documents?page=1&limit=20
   * @param {Request} req
   * @param {Response} res
   */
  listMySharedDocuments = async (req, res) => {
    try {
      const userId = new ObjectId(req.user._id);
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Get documents with pagination
      const docs = await this.collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Get total count
      const total = await this.collection.countDocuments({ userId });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Add shareUrl to each document
      const documentsWithUrls = docs.map(doc => ({
        ...doc,
        shareUrl: `${frontendUrl}/shared/${doc.shareToken}`
      }));

      res.json({
        success: true,
        documents: documentsWithUrls,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('❌ Error listing shared documents:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при вчитување на документи'
      });
    }
  };

  /**
   * Revoke a shareable link
   *
   * DELETE /api/shared-documents/:shareToken/revoke
   * @param {Request} req
   * @param {Response} res
   */
  revokeShareableLink = async (req, res) => {
    try {
      const { shareToken } = req.params;
      const userId = new ObjectId(req.user._id);

      // Update document to set isRevoked = true
      const result = await this.collection.updateOne(
        { shareToken, userId },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Документот не е пронајден'
        });
      }

      console.log(`✅ Share link revoked: ${shareToken}`);

      res.json({
        success: true,
        message: 'Линкот е успешно повлечен'
      });
    } catch (error) {
      console.error('❌ Error revoking share link:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при повлекување на линкот'
      });
    }
  };

  // ==========================================
  // PUBLIC ENDPOINTS (no authentication required)
  // ==========================================

  /**
   * Get shared document metadata (public access)
   *
   * GET /api/shared-documents/:shareToken
   * @param {Request} req
   * @param {Response} res
   */
  getSharedDocument = async (req, res) => {
    try {
      const { shareToken } = req.params;

      // Find document by share token
      const doc = await this.collection.findOne({ shareToken });

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Документот не е пронајден'
        });
      }

      // Check if link has expired
      if (new Date() > doc.expiresAt) {
        return res.status(410).json({
          success: false,
          message: 'Линкот истече',
          expired: true
        });
      }

      // Check if link has been revoked
      if (doc.isRevoked) {
        return res.status(403).json({
          success: false,
          message: 'Линкот е повлечен',
          revoked: true
        });
      }

      // Increment view count
      await this.collection.updateOne(
        { shareToken },
        {
          $inc: { viewCount: 1 },
          $set: { lastAccessedAt: new Date() }
        }
      );

      // Return metadata (NOT the file content)
      // Exclude sensitive fields
      res.json({
        success: true,
        document: {
          fileName: doc.fileName,
          documentType: doc.documentType,
          createdAt: doc.createdAt,
          expiresAt: doc.expiresAt,
          viewCount: doc.viewCount + 1,
          downloadCount: doc.downloadCount,
          isConfirmed: doc.isConfirmed,
          confirmedAt: doc.confirmedAt,
          confirmedBy: doc.confirmedBy,
          comments: doc.comments || []
        }
      });
    } catch (error) {
      console.error('❌ Error getting shared document:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при вчитување на документот'
      });
    }
  };

  /**
   * Download shared document (public access)
   *
   * GET /api/shared-documents/:shareToken/download
   * @param {Request} req
   * @param {Response} res
   */
  downloadSharedDocument = async (req, res) => {
    try {
      const { shareToken } = req.params;

      // Find document by share token
      const doc = await this.collection.findOne({ shareToken });

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Документот не е пронајден'
        });
      }

      // Check expiration and revocation
      if (new Date() > doc.expiresAt) {
        return res.status(410).json({
          success: false,
          message: 'Линкот истече'
        });
      }

      if (doc.isRevoked) {
        return res.status(403).json({
          success: false,
          message: 'Линкот е повлечен'
        });
      }

      // Retrieve document from GridFS
      const buffer = await this.documentStorageService.retrieveDocument(doc.fileId);

      // Increment download count
      await this.collection.updateOne(
        { shareToken },
        { $inc: { downloadCount: 1 } }
      );

      // Send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`);
      res.setHeader('Content-Length', buffer.length);

      console.log(`✅ Document downloaded: ${doc.fileName} (shareToken: ${shareToken})`);

      res.send(buffer);
    } catch (error) {
      console.error('❌ Error downloading shared document:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при симнување на документот'
      });
    }
  };

  /**
   * Confirm shared document (public access)
   *
   * POST /api/shared-documents/:shareToken/confirm
   * Body: { confirmedBy: "Name or Email" }
   * @param {Request} req
   * @param {Response} res
   */
  confirmSharedDocument = async (req, res) => {
    try {
      const { shareToken } = req.params;
      const { confirmedBy } = req.body;

      // Validate input
      if (!confirmedBy || typeof confirmedBy !== 'string' || confirmedBy.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Потребно е да внесете име или email'
        });
      }

      // Max length validation
      if (confirmedBy.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Името/email-от е предолг (максимум 200 знаци)'
        });
      }

      // Update document to set confirmed status
      const result = await this.collection.updateOne(
        {
          shareToken,
          expiresAt: { $gt: new Date() },
          isRevoked: false
        },
        {
          $set: {
            isConfirmed: true,
            confirmedAt: new Date(),
            confirmedBy: confirmedBy.trim()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Документот не е пронајден или истече'
        });
      }

      console.log(`✅ Document confirmed by: ${confirmedBy} (shareToken: ${shareToken})`);

      res.json({
        success: true,
        message: 'Документот е успешно потврден'
      });
    } catch (error) {
      console.error('❌ Error confirming shared document:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при потврдување на документот'
      });
    }
  };

  /**
   * Add comment to shared document (public access)
   *
   * POST /api/shared-documents/:shareToken/comment
   * Body: { name: "...", email: "...", comment: "..." }
   * @param {Request} req
   * @param {Response} res
   */
  addCommentToSharedDocument = async (req, res) => {
    try {
      const { shareToken } = req.params;
      const { name, email, comment } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Името е задолжително'
        });
      }

      if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Коментарот е задолжителен'
        });
      }

      // Length validation
      if (name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Името е предолго (максимум 100 знаци)'
        });
      }

      if (email && email.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Email-от е предолг (максимум 200 знаци)'
        });
      }

      if (comment.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Коментарот е предолг (максимум 1000 знаци)'
        });
      }

      // Email validation (basic)
      if (email && email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Невалиден email формат'
          });
        }
      }

      // Create comment object
      const newComment = {
        name: name.trim(),
        email: email ? email.trim() : '',
        comment: comment.trim(),
        createdAt: new Date()
      };

      // Add comment to document
      const result = await this.collection.updateOne(
        {
          shareToken,
          expiresAt: { $gt: new Date() },
          isRevoked: false
        },
        {
          $push: { comments: newComment }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Документот не е пронајден или истече'
        });
      }

      console.log(`✅ Comment added by: ${name} (shareToken: ${shareToken})`);

      res.json({
        success: true,
        message: 'Коментарот е успешно додаден'
      });
    } catch (error) {
      console.error('❌ Error adding comment to shared document:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при додавање на коментар'
      });
    }
  };
}

module.exports = SharedDocumentsController;
