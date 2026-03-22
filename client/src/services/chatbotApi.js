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
   * Send a message and stream the response via SSE
   * @param {string} conversationId - Conversation ID
   * @param {string} question - User's question
   * @param {Object} callbacks - { onToken, onSources, onSuggestions, onDone, onError }
   * @returns {Promise<void>}
   */
  static async sendMessageStream(conversationId, question, { onToken, onSources, onSuggestions, onDone, onError }) {
    const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
    const token = localStorage.getItem('token');

    // Get CSRF token
    let csrfToken = null;
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrfToken') { csrfToken = value; break; }
      }
      if (!csrfToken) {
        const csrfRes = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
        if (csrfRes.ok) {
          const csrfData = await csrfRes.json();
          csrfToken = csrfData.csrfToken;
        }
      }
    } catch (e) {
      console.warn('Could not get CSRF token for streaming:', e);
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const response = await fetch(`${API_BASE_URL}/chatbot/conversations/${conversationId}/ask-stream`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const event = JSON.parse(data);
          switch (event.type) {
            case 'token': onToken?.(event.data); break;
            case 'sources': onSources?.(event.data); break;
            case 'done': onDone?.(event.data); break;
            case 'suggestions': onSuggestions?.(event.data); break;
            case 'credits': onDone?.({ ...event.data, creditsOnly: true }); break;
            case 'error': onError?.(event.data); break;
            default: break;
          }
        } catch (e) {
          console.warn('Failed to parse SSE event:', data);
        }
      }
    }
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
   * Rate an AI message (thumbs up/down)
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string|null} rating - "up", "down", or null to remove
   * @returns {Promise<Object>}
   */
  static async rateMessage(conversationId, messageId, rating) {
    return ApiService.put(`/chatbot/conversations/${conversationId}/messages/${messageId}/feedback`, { rating });
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
