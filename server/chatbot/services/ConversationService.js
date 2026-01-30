/**
 * ConversationService
 *
 * Handles all CRUD operations for chatbot conversation history
 */

const { ObjectId } = require('mongodb');
const crypto = require('crypto');

class ConversationService {
  constructor(database) {
    this.db = database;
    this.collection = database.collection('chatbot_conversations');
  }

  /**
   * Generate a conversation title from the first question
   * @param {string} question - User's first question
   * @returns {string} - Truncated title (max 60 chars)
   */
  generateTitle(question) {
    if (!question || typeof question !== 'string') {
      return 'Нова конверзација';
    }

    // Clean up the question
    const cleaned = question.trim();

    // If short enough, return as-is
    if (cleaned.length <= 60) {
      return cleaned;
    }

    // Truncate intelligently at word boundary
    const truncated = cleaned.substring(0, 57);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 30) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Create a new conversation
   * @param {string} userId - User ID
   * @param {string} firstQuestion - First question (optional)
   * @param {Object} options - Optional settings { botType: 'legal' | 'marketing' }
   * @returns {Object} - { conversationId, title, isNew: true }
   */
  async createConversation(userId, firstQuestion = null, options = {}) {
    try {
      const conversationId = new ObjectId();
      const title = this.generateTitle(firstQuestion || 'Нова конверзација');
      const now = new Date();
      const botType = options.botType || 'legal';

      const conversation = {
        _id: conversationId,
        userId: userId.toString(),
        title,
        messages: [],
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
        isActive: true,
        botType: botType
      };

      // Mark any existing active conversations as inactive (only for same botType)
      await this.collection.updateMany(
        { userId: userId.toString(), isActive: true, botType: botType },
        { $set: { isActive: false } }
      );

      await this.collection.insertOne(conversation);

      return {
        conversationId: conversationId.toString(),
        title,
        isNew: true,
        botType: botType
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Save a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} messageData - { type, content, sources?, timestamp }
   * @returns {Object} - { success: true, messageId }
   */
  async saveMessage(conversationId, messageData) {
    try {
      const messageId = crypto.randomUUID();
      const message = {
        messageId,
        type: messageData.type, // 'user' or 'ai'
        content: messageData.content,
        timestamp: messageData.timestamp || new Date()
      };

      // Add sources if it's an AI message
      if (messageData.type === 'ai' && messageData.sources) {
        message.sources = messageData.sources;
      }

      const result = await this.collection.updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $push: { messages: message },
          $inc: { messageCount: 1 },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Conversation not found');
      }

      return { success: true, messageId };
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Failed to save message');
    }
  }

  /**
   * Get a single conversation with all messages
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} - Conversation document
   */
  async getConversation(conversationId, userId) {
    try {
      const conversation = await this.collection.findOne({
        _id: new ObjectId(conversationId),
        userId: userId.toString()
      });

      if (!conversation) {
        throw new Error('Conversation not found or unauthorized');
      }

      return conversation;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations list (paginated)
   * @param {string} userId - User ID
   * @param {number} limit - Max conversations to return (default 20)
   * @param {number} offset - Skip count for pagination (default 0)
   * @param {Object} options - Optional filters { botType: 'legal' | 'marketing' }
   * @returns {Object} - { conversations: [], total, hasMore }
   */
  async getUserConversations(userId, limit = 20, offset = 0, options = {}) {
    try {
      const query = { userId: userId.toString() };

      // Add botType filter if specified
      if (options.botType) {
        query.botType = options.botType;
      }

      // Get total count
      const total = await this.collection.countDocuments(query);

      // Get conversations (newest first)
      const conversations = await this.collection
        .find(query)
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .project({
          _id: 1,
          title: 1,
          updatedAt: 1,
          createdAt: 1,
          messageCount: 1,
          isActive: 1,
          botType: 1
        })
        .toArray();

      return {
        conversations,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new Error('Failed to retrieve conversations');
    }
  }

  /**
   * Get or create active conversation for user
   * @param {string} userId - User ID
   * @returns {Object} - { conversationId, isNew }
   */
  async getOrCreateActiveConversation(userId) {
    try {
      // Look for active conversation
      const activeConversation = await this.collection.findOne({
        userId: userId.toString(),
        isActive: true
      });

      if (activeConversation) {
        return {
          conversationId: activeConversation._id.toString(),
          isNew: false
        };
      }

      // Create new conversation
      const newConversation = await this.createConversation(userId);
      return {
        conversationId: newConversation.conversationId,
        isNew: true
      };
    } catch (error) {
      console.error('Error getting/creating active conversation:', error);
      throw new Error('Failed to get or create conversation');
    }
  }

  /**
   * Archive conversation (mark as inactive)
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} - { success: true }
   */
  async archiveConversation(conversationId, userId) {
    try {
      const result = await this.collection.updateOne(
        {
          _id: new ObjectId(conversationId),
          userId: userId.toString()
        },
        { $set: { isActive: false } }
      );

      if (result.matchedCount === 0) {
        throw new Error('Conversation not found or unauthorized');
      }

      return { success: true };
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} - { success: true }
   */
  async deleteConversation(conversationId, userId) {
    try {
      const result = await this.collection.deleteOne({
        _id: new ObjectId(conversationId),
        userId: userId.toString()
      });

      if (result.deletedCount === 0) {
        throw new Error('Conversation not found or unauthorized');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Rename conversation (alias for updateConversationTitle)
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} newTitle - New title
   * @returns {Object} - Updated conversation with new title
   */
  async renameConversation(conversationId, userId, newTitle) {
    return this.updateConversationTitle(conversationId, userId, newTitle);
  }

  /**
   * Update conversation title
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} newTitle - New title
   * @returns {Object} - { _id, title, success: true }
   */
  async updateConversationTitle(conversationId, userId, newTitle) {
    try {
      // Validate and clean title
      const cleanTitle = newTitle.trim();
      if (!cleanTitle || cleanTitle.length === 0) {
        throw new Error('Title cannot be empty');
      }

      const truncatedTitle = cleanTitle.length > 100
        ? cleanTitle.substring(0, 97) + '...'
        : cleanTitle;

      const result = await this.collection.updateOne(
        {
          _id: new ObjectId(conversationId),
          userId: userId.toString()
        },
        {
          $set: {
            title: truncatedTitle,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Conversation not found or unauthorized');
      }

      return { _id: conversationId, title: truncatedTitle, success: true };
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw error;
    }
  }

  /**
   * Get recent messages for RAG context
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Number of recent messages (default 10)
   * @returns {Array} - Array of recent messages
   */
  async getRecentMessages(conversationId, limit = 10) {
    try {
      const conversation = await this.collection.findOne(
        { _id: new ObjectId(conversationId) },
        { projection: { messages: { $slice: -limit } } }
      );

      if (!conversation) {
        return [];
      }

      return conversation.messages || [];
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }
}

module.exports = ConversationService;
