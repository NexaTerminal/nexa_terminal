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
   * Normalize a client-supplied focus context into { kind, label, text }. `data`
   * (object or string) is serialized and size-capped so a big form can't bloat the
   * doc or the prompt. Returns null when there's nothing usable.
   */
  static normalizeFocusContext(fc) {
    if (!fc || typeof fc !== 'object') return null;
    const clamp = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
    const kind = clamp(fc.kind, 40) || 'артефакт';
    const label = clamp(fc.label, 200);
    let text = '';
    if (typeof fc.data === 'string') {
      text = fc.data;
    } else if (fc.data && typeof fc.data === 'object') {
      const slim = {};
      for (const [k, v] of Object.entries(fc.data)) {
        if (v == null || v === '') continue;
        if (typeof v === 'object') continue; // skip nested blobs
        slim[k] = v;
      }
      try { text = JSON.stringify(slim); } catch { text = ''; }
    }
    text = clamp(text, 3000);
    if (!label && !text) return null;
    return { kind, label, text };
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
   * @param {Object} options - Optional settings { botType, agent, focusContext }
   * @returns {Object} - { conversationId, title, isNew: true }
   */
  async createConversation(userId, firstQuestion = null, options = {}) {
    try {
      const conversationId = new ObjectId();
      const title = this.generateTitle(firstQuestion || 'Нова конверзација');
      const now = new Date();
      const botType = options.botType || 'legal';
      // The AI Team character this thread belongs to (e.g. legal/corporate/hr).
      // null for legacy / marketing threads. Each character keeps its own thread.
      const agent = options.agent || null;
      // Optional artifact this thread is about (a document / LHC report / case),
      // injected into every prompt so the character answers about THIS thing.
      const focusContext = ConversationService.normalizeFocusContext(options.focusContext);

      const conversation = {
        _id: conversationId,
        userId: userId.toString(),
        title,
        messages: [],
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
        isActive: true,
        botType: botType,
        agent: agent,
        focusContext: focusContext
      };

      // Mark the previous active conversation inactive — scoped to this character
      // (or botType when no agent) so switching characters doesn't deactivate
      // another character's in-progress thread.
      const activeScope = { userId: userId.toString(), isActive: true };
      if (agent) activeScope.agent = agent; else activeScope.botType = botType;
      await this.collection.updateMany(activeScope, { $set: { isActive: false } });

      await this.collection.insertOne(conversation);

      return {
        conversationId: conversationId.toString(),
        title,
        isNew: true,
        botType: botType,
        agent: agent
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

      // Add sources + authoring character if it's an AI message
      if (messageData.type === 'ai') {
        if (messageData.sources) message.sources = messageData.sources;
        if (messageData.agent) message.agent = messageData.agent;
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
      // userId is optional: routes pass it for ownership checks; internal callers
      // (already-authorized RAG path) may omit it. Only filter when provided.
      const query = { _id: new ObjectId(conversationId) };
      if (userId !== undefined && userId !== null) {
        query.userId = userId.toString();
      }
      const conversation = await this.collection.findOne(query);

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

      // Add agent filter if specified — each AI Team character shows only its own
      // threads (so ЈУРА, НОВА, АРИА don't share one list).
      if (options.agent) {
        query.agent = options.agent;
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
          botType: 1,
          agent: 1
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
   * Persist the rolling summary of older turns + how many messages it covers.
   * Best-effort — never throws (summary is an optimization, not correctness).
   * @param {string} conversationId
   * @param {string} summary - Cumulative summary of messages[0..summarizedCount)
   * @param {number} summarizedCount - How many leading messages the summary covers
   */
  async updateSummary(conversationId, summary, summarizedCount) {
    try {
      await this.collection.updateOne(
        { _id: new ObjectId(conversationId) },
        { $set: { summary: String(summary || '').slice(0, 2000), summarizedCount: summarizedCount | 0 } }
      );
      return { success: true };
    } catch (error) {
      console.warn('[conversation] updateSummary failed:', error.message);
      return { success: false };
    }
  }

  /**
   * Get the most-recent conversation for a given character (full, with messages),
   * so the UI can resume where the user left off. Returns null when the character
   * has no prior thread.
   * @param {string} userId - User ID
   * @param {string} agent - AI Team character key (legal/corporate/hr/…)
   * @returns {Object|null} - Conversation document or null
   */
  async getLatestForAgent(userId, agent) {
    try {
      if (!agent) return null;
      return await this.collection.findOne(
        { userId: userId.toString(), agent },
        { sort: { updatedAt: -1 } }
      );
    } catch (error) {
      console.error('Error getting latest conversation for agent:', error);
      return null;
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
   * Rate an AI message (thumbs up/down)
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID (for authorization)
   * @param {string|null} rating - "up", "down", or null to remove
   * @returns {Object} - { success: true }
   */
  async rateMessage(conversationId, messageId, userId, rating) {
    try {
      if (rating !== null && rating !== 'up' && rating !== 'down') {
        throw new Error('Rating must be "up", "down", or null');
      }

      // Verify conversation belongs to user
      const conversation = await this.collection.findOne({
        _id: new ObjectId(conversationId),
        userId: userId.toString(),
      });

      if (!conversation) {
        throw new Error('Conversation not found or unauthorized');
      }

      // Verify the message exists and is an AI message
      const message = conversation.messages?.find(m => m.messageId === messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      if (message.type !== 'ai') {
        throw new Error('Can only rate AI messages');
      }

      // Update the feedback on the specific message
      const feedback = rating ? { rating, ratedAt: new Date() } : null;

      await this.collection.updateOne(
        {
          _id: new ObjectId(conversationId),
          'messages.messageId': messageId,
        },
        {
          $set: { 'messages.$.feedback': feedback },
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error rating message:', error);
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
