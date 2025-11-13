import ApiService from './api';

/**
 * ChatbotApiService
 *
 * Service for all chatbot-related API calls including conversation history
 */
class ChatbotApiService {
  /**
   * Ask a question to the chatbot
   * @param {string} question - User's question
   * @param {string} conversationId - Optional conversation ID for history tracking
   * @returns {Promise<Object>} - Response with answer, sources, and remaining questions
   */
  static async askQuestion(question, conversationId = null) {
    const data = { question };
    if (conversationId) {
      data.conversationId = conversationId;
    }

    return ApiService.post('/chatbot/ask', data);
  }

  /**
   * Get user's weekly usage limits
   * @returns {Promise<Object>} - Remaining questions, total, and reset date
   */
  static async getLimits() {
    return ApiService.get('/chatbot/limits');
  }

  /**
   * Get chatbot health status
   * @returns {Promise<Object>} - Service health information
   */
  static async getHealth() {
    return ApiService.get('/chatbot/health');
  }

  // ============================================================================
  // CONVERSATION HISTORY ENDPOINTS
  // ============================================================================

  /**
   * Create a new conversation
   * @param {string} firstQuestion - Optional first question to set as title
   * @returns {Promise<Object>} - New conversation with conversationId and title
   */
  static async createConversation(firstQuestion = null) {
    const data = firstQuestion ? { firstQuestion } : {};
    return ApiService.post('/chatbot/conversations/new', data);
  }

  /**
   * Get user's conversations list (paginated)
   * @param {number} limit - Number of conversations to fetch (default 20)
   * @param {number} offset - Offset for pagination (default 0)
   * @returns {Promise<Object>} - Conversations list with total and hasMore flag
   */
  static async getConversations(limit = 20, offset = 0) {
    return ApiService.get(`/chatbot/conversations?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get a single conversation with all messages
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Full conversation object with messages
   */
  static async getConversation(conversationId) {
    return ApiService.get(`/chatbot/conversations/${conversationId}`);
  }

  /**
   * Send a message to a specific conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} question - User's question
   * @returns {Promise<Object>} - AI response with answer and sources
   */
  static async sendMessage(conversationId, question) {
    return ApiService.post(`/chatbot/conversations/${conversationId}/ask`, { question });
  }

  /**
   * Archive a conversation (mark as inactive)
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Success response
   */
  static async archiveConversation(conversationId) {
    return ApiService.put(`/chatbot/conversations/${conversationId}/archive`, {});
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Success response
   */
  static async deleteConversation(conversationId) {
    return ApiService.delete(`/chatbot/conversations/${conversationId}`);
  }

  /**
   * Rename a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} title - New conversation title
   * @returns {Promise<Object>} - Updated conversation with new title
   */
  static async renameConversation(conversationId, title) {
    return ApiService.put(`/chatbot/conversations/${conversationId}/title`, { title });
  }
}

export default ChatbotApiService;
