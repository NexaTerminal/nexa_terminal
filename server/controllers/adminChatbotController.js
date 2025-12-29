const { ObjectId } = require('mongodb');
const UserAnalyticsService = require('../services/userAnalyticsService');

/**
 * Admin Chatbot Controller
 * Handles document management, conversation oversight, and analytics for the chatbot system
 *
 * Features:
 * - Document Management: List, upload, delete documents in Qdrant
 * - Conversation Management: View, flag, delete user conversations
 * - Analytics: Usage stats, popular queries, credit tracking
 */
class AdminChatbotController {
  constructor(database, qdrantClient, chatBotService) {
    this.db = database;
    this.qdrantClient = qdrantClient;
    this.chatBotService = chatBotService;
    this.collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';

    // Bind methods
    this.getDocuments = this.getDocuments.bind(this);
    this.uploadDocument = this.uploadDocument.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
    this.getDocumentStats = this.getDocumentStats.bind(this);
    this.getAllConversations = this.getAllConversations.bind(this);
    this.getConversationDetails = this.getConversationDetails.bind(this);
    this.flagConversation = this.flagConversation.bind(this);
    this.deleteConversation = this.deleteConversation.bind(this);
    this.getConversationStats = this.getConversationStats.bind(this);
    this.getChatbotAnalytics = this.getChatbotAnalytics.bind(this);
    this.getUsageStats = this.getUsageStats.bind(this);
    this.getPopularQueries = this.getPopularQueries.bind(this);
    this.getCreditUsage = this.getCreditUsage.bind(this);
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Get all documents from Qdrant vector database
   * Returns list of unique documents with metadata
   */
  async getDocuments(req, res) {
    try {
      // Log admin action
      const analyticsService = new UserAnalyticsService(this.db);
      analyticsService.trackActivity(req.user.id, 'admin_view_chatbot_documents', {});

      // Scroll through Qdrant to get all points
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

          // Try multiple fields to find document name (handles both old and new formats)
          const documentName = payload.metadata?.documentName ||
                               payload.metadata?.source ||
                               payload.source ||
                               payload.documentName ||
                               'Unknown';

          if (!uniqueDocuments.has(documentName)) {
            uniqueDocuments.set(documentName, {
              documentName: documentName,
              chunkCount: 0,
              firstChunkPreview: payload.text?.substring(0, 200) || payload.pageContent?.substring(0, 200) || '',
              uploadedAt: payload.metadata?.processedAt || payload.processedAt || null,
              pageCount: payload.metadata?.pageCount || payload.pageCount || null,
              articleCount: null
            });
          }

          // Increment chunk count
          const doc = uniqueDocuments.get(documentName);
          doc.chunkCount++;
        }

        offset = response.next_page_offset;
      } while (offset !== null && offset !== undefined);

      // Convert to array
      const documents = Array.from(uniqueDocuments.values());

      return res.json({
        success: true,
        data: {
          documents,
          totalDocuments: documents.length,
          totalChunks
        }
      });
    } catch (error) {
      console.error('Error fetching chatbot documents:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  /**
   * Upload and process a new document (PDF or DOCX)
   * This will be implemented when DocumentProcessingService is ready
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Log admin action
      const analyticsService = new UserAnalyticsService(this.db);
      analyticsService.trackActivity(req.user.id, 'admin_upload_chatbot_document', {
        fileName: req.file.originalname,
        fileSize: req.file.size
      });

      // TODO: Process document using DocumentProcessingService
      // For now, return success with file info
      return res.json({
        success: true,
        message: 'Document uploaded successfully. Processing will be implemented in next step.',
        data: {
          fileName: req.file.originalname,
          filePath: req.file.path,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message
      });
    }
  }

  /**
   * Delete a document from Qdrant by source name
   * Removes all chunks associated with the document
   */
  async deleteDocument(req, res) {
    try {
      const { documentName } = req.params;

      if (!documentName) {
        return res.status(400).json({
          success: false,
          message: 'Document name is required'
        });
      }

      // Log admin action
      const analyticsService = new UserAnalyticsService(this.db);
      analyticsService.trackActivity(req.user.id, 'admin_delete_chatbot_document', {
        documentName
      });

      // Find all points with this document name and delete them
      // Use "should" (OR) to match either old or new document name fields
      let deletedCount = 0;
      let offset = null;

      do {
        const response = await this.qdrantClient.scroll(this.collectionName, {
          limit: 100,
          offset: offset,
          with_payload: true,
          with_vector: false,
          filter: {
            should: [
              {
                key: 'metadata.documentName',
                match: { value: documentName }
              },
              {
                key: 'metadata.source',
                match: { value: documentName }
              },
              {
                key: 'source',
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

      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      return res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} chunks from document`,
        data: {
          documentName,
          chunksDeleted: deletedCount
        }
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  /**
   * Get document statistics (count, total chunks, collection info)
   */
  async getDocumentStats(req, res) {
    try {
      const collectionInfo = await this.qdrantClient.getCollection(this.collectionName);

      // Scroll through all documents to get unique count and last update
      const uniqueDocuments = new Set();
      let lastUpdated = null;
      let offset = null;

      do {
        const response = await this.qdrantClient.scroll(this.collectionName, {
          limit: 100,
          offset: offset,
          with_payload: true,
          with_vector: false
        });

        response.points.forEach(point => {
          const payload = point.payload;
          const documentName = payload.metadata?.documentName ||
                             payload.metadata?.source ||
                             payload.source ||
                             payload.documentName ||
                             'Unknown';

          uniqueDocuments.add(documentName);

          // Track most recent upload
          const processedAt = payload.metadata?.processedAt || payload.processedAt;
          if (processedAt) {
            const uploadDate = new Date(processedAt);
            if (!lastUpdated || uploadDate > lastUpdated) {
              lastUpdated = uploadDate;
            }
          }
        });

        offset = response.next_page_offset;
      } while (offset !== null && offset !== undefined);

      return res.json({
        success: true,
        data: {
          totalDocuments: uniqueDocuments.size,
          totalChunks: collectionInfo.points_count,
          vectorDimension: collectionInfo.config.params.vectors.size,
          distanceMetric: collectionInfo.config.params.vectors.distance,
          collectionName: this.collectionName,
          lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
          averageChunksPerDocument: uniqueDocuments.size > 0
            ? Math.round(collectionInfo.points_count / uniqueDocuments.size)
            : 0
        }
      });
    } catch (error) {
      console.error('Error fetching document stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch document statistics',
        error: error.message
      });
    }
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  /**
   * Get all conversations with pagination and filtering
   */
  async getAllConversations(req, res) {
    try {
      const { page = 1, limit = 20, filter = 'all' } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Log admin action
      const analyticsService = new UserAnalyticsService(this.db);
      analyticsService.trackActivity(req.user.id, 'admin_view_conversations', {});

      // Build filter
      const queryFilter = {};
      if (filter === 'flagged') {
        queryFilter.flagged = true;
      } else if (filter === 'active') {
        queryFilter.isActive = true;
      }

      const conversationsCollection = this.db.collection('chatbot_conversations');

      // Get total count
      const total = await conversationsCollection.countDocuments(queryFilter);

      // Get conversations with user info
      const conversations = await conversationsCollection
        .aggregate([
          { $match: queryFilter },
          {
            $lookup: {
              from: 'users',
              let: { userIdStr: '$userId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', { $toObjectId: '$$userIdStr' }]
                    }
                  }
                }
              ],
              as: 'userDetails'
            }
          },
          { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              title: 1,
              userId: 1,
              userEmail: '$userDetails.email',
              userName: {
                $concat: [
                  { $ifNull: ['$userDetails.firstName', ''] },
                  ' ',
                  { $ifNull: ['$userDetails.lastName', ''] }
                ]
              },
              messageCount: 1,
              createdAt: 1,
              updatedAt: 1,
              isActive: 1,
              flagged: { $ifNull: ['$flagged', false] },
              flaggedReason: 1,
              flaggedBy: 1,
              flaggedAt: 1
            }
          },
          { $sort: { updatedAt: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) }
        ])
        .toArray();

      return res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message
      });
    }
  }

  /**
   * Get conversation details with all messages
   */
  async getConversationDetails(req, res) {
    try {
      const { id } = req.params;

      const conversationsCollection = this.db.collection('chatbot_conversations');
      const conversation = await conversationsCollection.findOne({ _id: new ObjectId(id) });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      // Get user details
      const usersCollection = this.db.collection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(conversation.userId) });

      return res.json({
        success: true,
        data: {
          conversation,
          user: user ? {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          } : null
        }
      });
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation details',
        error: error.message
      });
    }
  }

  /**
   * Flag or unflag a conversation for review
   */
  async flagConversation(req, res) {
    try {
      const { id } = req.params;
      const { flagged, reason } = req.body;

      // Log admin action
      const analyticsService = new UserAnalyticsService(this.db);
      analyticsService.trackActivity(req.user.id, 'admin_flag_conversation', {
        conversationId: id,
        flagged
      });

      const conversationsCollection = this.db.collection('chatbot_conversations');

      const updateData = {
        flagged: flagged === true,
        ...(flagged && {
          flaggedReason: reason || 'No reason provided',
          flaggedBy: req.user.id,
          flaggedAt: new Date()
        })
      };

      const result = await conversationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      return res.json({
        success: true,
        message: flagged ? 'Conversation flagged successfully' : 'Conversation unflagged successfully',
        data: updateData
      });
    } catch (error) {
      console.error('Error flagging conversation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to flag conversation',
        error: error.message
      });
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(req, res) {
    try {
      const { id } = req.params;

      // Log admin action
      const analyticsService = new UserAnalyticsService(this.db);
      analyticsService.trackActivity(req.user.id, 'admin_delete_conversation', {
        conversationId: id
      });

      const conversationsCollection = this.db.collection('chatbot_conversations');
      const result = await conversationsCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      return res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete conversation',
        error: error.message
      });
    }
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(req, res) {
    try {
      const conversationsCollection = this.db.collection('chatbot_conversations');

      const stats = await conversationsCollection.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [{ $match: { isActive: true } }, { $count: 'count' }],
            flagged: [{ $match: { flagged: true } }, { $count: 'count' }]
          }
        }
      ]).toArray();

      const result = stats[0];

      return res.json({
        success: true,
        data: {
          total: result.total[0]?.count || 0,
          active: result.active[0]?.count || 0,
          flagged: result.flagged[0]?.count || 0
        }
      });
    } catch (error) {
      console.error('Error fetching conversation stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation statistics',
        error: error.message
      });
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get overall chatbot analytics dashboard
   */
  async getChatbotAnalytics(req, res) {
    try {
      const usageCollection = this.db.collection('chatbot_usage');
      const conversationsCollection = this.db.collection('chatbot_conversations');

      // Total questions asked
      const usageStats = await usageCollection.aggregate([
        {
          $group: {
            _id: null,
            totalQuestions: { $sum: '$questionsAsked' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        }
      ]).toArray();

      const totalQuestions = usageStats[0]?.totalQuestions || 0;
      const uniqueUsers = usageStats[0]?.uniqueUsers?.length || 0;

      // Total conversations
      const totalConversations = await conversationsCollection.countDocuments({});

      // Average questions per user
      const avgQuestionsPerUser = uniqueUsers > 0 ? (totalQuestions / uniqueUsers).toFixed(2) : 0;

      // Top users
      const topUsers = await usageCollection.aggregate([
        {
          $group: {
            _id: '$userId',
            totalQuestions: { $sum: '$questionsAsked' },
            lastAsked: { $max: '$lastAskedAt' }
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { userIdStr: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$userIdStr' }] }
                }
              }
            ],
            as: 'userDetails'
          }
        },
        { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            userId: '$_id',
            totalQuestions: 1,
            lastAsked: 1,
            email: '$userDetails.email',
            name: {
              $concat: [
                { $ifNull: ['$userDetails.firstName', ''] },
                ' ',
                { $ifNull: ['$userDetails.lastName', ''] }
              ]
            }
          }
        },
        { $sort: { totalQuestions: -1 } },
        { $limit: 10 }
      ]).toArray();

      // Get total credits used (if credit system enabled)
      let totalCreditsUsed = 0;
      try {
        const creditCollection = this.db.collection('credit_transactions');
        const creditStats = await creditCollection.aggregate([
          {
            $match: {
              transactionType: 'deduction',
              featureType: 'AI_QUESTION'
            }
          },
          {
            $group: {
              _id: null,
              totalCredits: { $sum: { $abs: '$amount' } }
            }
          }
        ]).toArray();

        totalCreditsUsed = creditStats[0]?.totalCredits || 0;
      } catch (err) {
        // Credit system may not be enabled
        console.log('Credit system not available');
      }

      return res.json({
        success: true,
        data: {
          totalQuestions,
          uniqueUsers,
          totalConversations,
          avgQuestionsPerUser: parseFloat(avgQuestionsPerUser),
          totalCreditsUsed,
          topUsers
        }
      });
    } catch (error) {
      console.error('Error fetching chatbot analytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  }

  /**
   * Get usage statistics by user and time period
   */
  async getUsageStats(req, res) {
    try {
      const usageCollection = this.db.collection('chatbot_usage');

      const stats = await usageCollection.aggregate([
        {
          $group: {
            _id: {
              userId: '$userId',
              weekStart: '$weekStart'
            },
            questionsAsked: { $sum: '$questionsAsked' },
            lastAsked: { $max: '$lastAskedAt' }
          }
        },
        {
          $group: {
            _id: '$_id.weekStart',
            totalQuestions: { $sum: '$questionsAsked' },
            uniqueUsers: { $addToSet: '$_id.userId' }
          }
        },
        {
          $project: {
            weekStart: '$_id',
            totalQuestions: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { weekStart: -1 } },
        { $limit: 12 } // Last 12 weeks
      ]).toArray();

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch usage statistics',
        error: error.message
      });
    }
  }

  /**
   * Get popular queries from conversations
   */
  async getPopularQueries(req, res) {
    try {
      const conversationsCollection = this.db.collection('chatbot_conversations');

      const popularQueries = await conversationsCollection.aggregate([
        { $unwind: '$messages' },
        { $match: { 'messages.type': 'user' } },
        {
          $group: {
            _id: '$messages.content',
            count: { $sum: 1 },
            lastAsked: { $max: '$messages.timestamp' }
          }
        },
        {
          $project: {
            query: '$_id',
            count: 1,
            lastAsked: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray();

      return res.json({
        success: true,
        data: popularQueries
      });
    } catch (error) {
      console.error('Error fetching popular queries:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch popular queries',
        error: error.message
      });
    }
  }

  /**
   * Get credit usage statistics over time
   */
  async getCreditUsage(req, res) {
    try {
      const creditCollection = this.db.collection('credit_transactions');

      const usage = await creditCollection.aggregate([
        {
          $match: {
            transactionType: 'deduction',
            featureType: 'AI_QUESTION'
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$timestamp' },
              year: { $year: '$timestamp' }
            },
            totalCredits: { $sum: { $abs: '$amount' } },
            totalQuestions: { $sum: 1 }
          }
        },
        {
          $project: {
            month: '$_id.month',
            year: '$_id.year',
            totalCredits: 1,
            totalQuestions: 1,
            _id: 0
          }
        },
        { $sort: { year: -1, month: -1 } },
        { $limit: 12 }
      ]).toArray();

      return res.json({
        success: true,
        data: usage
      });
    } catch (error) {
      console.error('Error fetching credit usage:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch credit usage',
        error: error.message
      });
    }
  }
}

module.exports = AdminChatbotController;
