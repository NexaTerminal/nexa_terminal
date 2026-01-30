import ApiService from './api';

/**
 * MarketingBotApiService
 *
 * Service for all marketing chatbot-related API calls
 */
class MarketingBotApiService {
  /**
   * Ask a marketing question
   * @param {string} question - User's question
   * @param {string} conversationId - Optional conversation ID for history tracking
   * @returns {Promise<Object>} - Response with answer, sources, and remaining questions
   */
  static async askQuestion(question, conversationId = null) {
    const data = { question };
    if (conversationId) {
      data.conversationId = conversationId;
    }

    return ApiService.post('/marketing-bot/ask', data);
  }

  /**
   * Get user's weekly usage limits for marketing questions
   * @returns {Promise<Object>} - Remaining questions, total, and reset date
   */
  static async getLimits() {
    return ApiService.get('/marketing-bot/limits');
  }

  /**
   * Get marketing chatbot health status
   * @returns {Promise<Object>} - Service health information
   */
  static async getHealth() {
    return ApiService.get('/marketing-bot/health');
  }

  // ============================================================================
  // CONVERSATION HISTORY ENDPOINTS
  // ============================================================================

  /**
   * Create a new marketing conversation
   * @param {string} firstQuestion - Optional first question to set as title
   * @returns {Promise<Object>} - New conversation with conversationId and title
   */
  static async createConversation(firstQuestion = null) {
    const data = firstQuestion ? { firstQuestion } : {};
    return ApiService.post('/marketing-bot/conversations/new', data);
  }

  /**
   * Get a single conversation with all messages
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Full conversation object with messages
   */
  static async getConversation(conversationId) {
    return ApiService.get(`/marketing-bot/conversations/${conversationId}`);
  }

  /**
   * Send a message to a specific marketing conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} question - User's question
   * @returns {Promise<Object>} - AI response with answer and sources
   */
  static async sendMessage(conversationId, question) {
    return ApiService.post(`/marketing-bot/conversations/${conversationId}/ask`, { question });
  }
}

export default MarketingBotApiService;
