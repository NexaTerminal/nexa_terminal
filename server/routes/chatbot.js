const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');
const chatBotService = require('../chatbot/ChatBotService');
const AgentMemoryService = require('../chatbot/services/agentMemoryService');
const UserMemoryService = require('../services/userMemoryService');
const { getAgentName } = require('../chatbot/agentProfiles');

/**
 * Chatbot Routes
 *
 * Endpoints:
 * - POST /api/chatbot/ask - Ask a question to the AI chatbot
 * - GET /api/chatbot/limits - Check user's remaining questions
 * - GET /api/chatbot/health - Check chatbot service health
 *
 * Conversation History Endpoints:
 * - POST /api/chatbot/conversations/new - Create new conversation
 * - GET /api/chatbot/conversations - Get user's conversations list
 * - GET /api/chatbot/conversations/:id - Get single conversation
 * - POST /api/chatbot/conversations/:id/ask - Send message to conversation
 * - PUT /api/chatbot/conversations/:id/archive - Archive conversation
 * - DELETE /api/chatbot/conversations/:id - Delete conversation
 * - PUT /api/chatbot/conversations/:id/title - Update conversation title
 */

/**
 * @route   POST /api/chatbot/ask
 * @desc    Ask a question to the AI chatbot
 * @access  Private (requires authentication)
 * @body    { question: string, conversationId?: string }
 * @returns { answer: string, sources: array, remainingQuestions: number, conversationId?: string }
 */
router.post('/ask', authenticateJWT, checkCredits(1), async (req, res) => {
  try {
    const { question, conversationId, agent, from } = req.body;
    const userId = req.user._id.toString(); // From JWT auth middleware

    // Validate question
    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Прашањето не може да биде празно.',
      });
    }

    // Check question length (max 500 characters to prevent abuse)
    if (question.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Прашањето е премногу долго. Максимум 500 карактери.',
      });
    }

    // Ask the chatbot (with optional conversationId for history tracking)
    const response = await chatBotService.askQuestion(question, userId, conversationId, agent, from);

    // Feature-usage signal (best-effort — never blocks the answer).
    try {
      req.app.locals.activityLogger?.analyticsService?.trackActivity(String(userId), 'ai_query', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        queryType: conversationId ? 'conversation' : 'ask',
      });
    } catch (_) { /* analytics optional */ }

    // Deduct credits after successful question
    const creditService = req.app.locals.creditService;
    if (creditService) {
      try {
        const creditResult = await creditService.deductCredits(
          req.user._id,
          1,
          'AI_QUESTION',
          { conversationId, endpoint: req.originalUrl }
        );

        // Return successful response with credit info
        return res.status(200).json({
          success: true,
          data: {
            answer: response.answer,
            sources: response.sources,
            remainingQuestions: response.remainingQuestions,
            timestamp: response.timestamp,
            conversationId: conversationId || null,
            creditsRemaining: creditResult.newBalance,
          },
        });
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
        // Still return the answer even if credit deduction fails
        return res.status(200).json({
          success: true,
          data: {
            answer: response.answer,
            sources: response.sources,
            remainingQuestions: response.remainingQuestions,
            timestamp: response.timestamp,
            conversationId: conversationId || null,
          },
        });
      }
    }

    // Fallback if credit service not available
    return res.status(200).json({
      success: true,
      data: {
        answer: response.answer,
        sources: response.sources,
        remainingQuestions: response.remainingQuestions,
        timestamp: response.timestamp,
        conversationId: conversationId || null,
      },
    });

  } catch (error) {
    console.error('❌ Error in /api/chatbot/ask:', error);

    // Check if it's a limit exceeded error
    if (error.message.includes('достигнавте')) {
      return res.status(429).json({
        success: false,
        message: error.message,
        limitExceeded: true,
      });
    }

    // General error
    return res.status(500).json({
      success: false,
      message: 'Се случи грешка при обработка на вашето прашање. Ве молиме обидете се повторно.',
    });
  }
});

/**
 * @route   GET /api/chatbot/limits
 * @desc    Get user's remaining questions for the week
 * @access  Private (requires authentication)
 * @returns { remaining: number, total: number, resetDate: Date }
 */
router.get('/limits', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Check weekly limit
    const limitStatus = await chatBotService.checkWeeklyLimit(userId);

    return res.status(200).json({
      success: true,
      data: {
        remaining: limitStatus.remaining,
        total: chatBotService.weeklyLimit,
        questionsAsked: limitStatus.questionsAsked || 0,
        resetDate: limitStatus.resetDate,
      },
    });

  } catch (error) {
    console.error('❌ Error in /api/chatbot/limits:', error);
    return res.status(500).json({
      success: false,
      message: 'Не можевме да ги вчитаме вашите лимити.',
    });
  }
});

/**
 * @route   GET /api/chatbot/health
 * @desc    Check chatbot service health status
 * @access  Public (no authentication required)
 * @returns { status: string, model: string, vectorStoreInitialized: boolean }
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = chatBotService.getHealthStatus();

    return res.status(200).json({
      success: true,
      data: healthStatus,
    });

  } catch (error) {
    console.error('❌ Error in /api/chatbot/health:', error);
    return res.status(500).json({
      success: false,
      message: 'Chatbot service is down',
    });
  }
});

// ============================================================================
// CONVERSATION HISTORY ENDPOINTS
// ============================================================================

/**
 * Helper function to get conversation service
 */
function getConversationService(req) {
  const conversationService = req.app.locals.conversationService;
  if (!conversationService) {
    throw new Error('Conversation service not initialized');
  }
  return conversationService;
}

/**
 * @route   POST /api/chatbot/conversations/new
 * @desc    Create a new conversation
 * @access  Private (requires authentication)
 * @body    { firstQuestion?: string }
 * @returns { conversationId: string, title: string, isNew: true }
 */
router.post('/conversations/new', authenticateJWT, async (req, res) => {
  try {
    const { firstQuestion, agent, focusContext } = req.body;
    const userId = req.user._id;
    const conversationService = getConversationService(req);

    const newConversation = await conversationService.createConversation(userId, firstQuestion, { agent, focusContext });

    return res.status(201).json({
      success: true,
      data: newConversation,
    });

  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Не можевме да креираме нова конверзација.',
    });
  }
});

/**
 * @route   GET /api/chatbot/conversations
 * @desc    Get user's conversations list (paginated)
 * @access  Private (requires authentication)
 * @query   limit, offset
 * @returns { conversations: array, total: number, hasMore: boolean }
 */
router.get('/conversations', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const agent = req.query.agent || undefined;
    const conversationService = getConversationService(req);

    const result = await conversationService.getUserConversations(userId, limit, offset, { agent });

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('❌ Error getting conversations:', error);
    return res.status(500).json({
      success: false,
      message: 'Не можевме да ги вчитаме конверзациите.',
    });
  }
});

/**
 * @route   GET /api/chatbot/conversations/latest
 * @desc    Get the most-recent conversation for a character (to resume it).
 *          Must precede '/conversations/:id' so "latest" isn't read as an id.
 * @access  Private (requires authentication)
 * @query   agent
 * @returns { conversation: object | null }
 */
router.get('/conversations/latest', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const agent = req.query.agent;
    const conversationService = getConversationService(req);

    const conversation = agent
      ? await conversationService.getLatestForAgent(userId, agent)
      : null;

    return res.status(200).json({ success: true, data: { conversation: conversation || null } });
  } catch (error) {
    console.error('❌ Error getting latest conversation:', error);
    return res.status(500).json({ success: false, message: 'Не можевме да ја вчитаме конверзацијата.' });
  }
});

/**
 * @route   GET /api/chatbot/conversations/:id
 * @desc    Get single conversation with all messages
 * @access  Private (requires authentication)
 * @returns { conversation: object }
 */
router.get('/conversations/:id', authenticateJWT, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;
    const conversationService = getConversationService(req);

    const conversation = await conversationService.getConversation(conversationId, userId);

    return res.status(200).json({
      success: true,
      data: { conversation },
    });

  } catch (error) {
    console.error('❌ Error getting conversation:', error);

    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({
        success: false,
        message: 'Конверзацијата не е пронајдена.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Не можевме да ја вчитаме конверзацијата.',
    });
  }
});

/**
 * @route   POST /api/chatbot/conversations/:id/ask
 * @desc    Send a message to a specific conversation
 * @access  Private (requires authentication)
 * @body    { question: string }
 * @returns { answer: string, sources: array, remainingQuestions: number }
 */
router.post('/conversations/:id/ask', authenticateJWT, checkCredits(1), async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { question, agent, from } = req.body;
    const userId = req.user._id.toString();
    const conversationService = getConversationService(req);

    // Validate question
    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Прашањето не може да биде празно.',
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Прашањето е премногу долго. Максимум 500 карактери.',
      });
    }

    // Verify conversation belongs to user
    await conversationService.getConversation(conversationId, userId);

    // Ask the chatbot with conversation context
    const response = await chatBotService.askQuestion(question, userId, conversationId, agent, from);

    try {
      req.app.locals.activityLogger?.analyticsService?.trackActivity(String(userId), 'ai_query', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        queryType: 'conversation',
      });
    } catch (_) { /* analytics optional */ }

    // Deduct credits after successful question
    const creditService = req.app.locals.creditService;
    if (creditService) {
      try {
        const creditResult = await creditService.deductCredits(
          req.user._id,
          1,
          'AI_QUESTION',
          { conversationId, endpoint: req.originalUrl }
        );

        return res.status(200).json({
          success: true,
          data: {
            answer: response.answer,
            sources: response.sources,
            remainingQuestions: response.remainingQuestions,
            timestamp: response.timestamp,
            creditsRemaining: creditResult.newBalance,
          },
        });
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
        // Still return the answer even if credit deduction fails
      }
    }

    // Fallback response
    return res.status(200).json({
      success: true,
      data: {
        answer: response.answer,
        sources: response.sources,
        remainingQuestions: response.remainingQuestions,
        timestamp: response.timestamp,
      },
    });

  } catch (error) {
    console.error('❌ Error in conversation ask:', error);

    if (error.message.includes('достигнавте')) {
      return res.status(429).json({
        success: false,
        message: error.message,
        limitExceeded: true,
      });
    }

    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({
        success: false,
        message: 'Конверзацијата не е пронајдена.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Се случи грешка при обработка на вашето прашање.',
    });
  }
});

/**
 * @route   POST /api/chatbot/conversations/:id/ask-stream
 * @desc    Send a message and stream the response via SSE
 * @access  Private (requires authentication)
 * @body    { question: string }
 */
router.post('/conversations/:id/ask-stream', authenticateJWT, checkCredits(1), async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { question, agent, from } = req.body;
    const userId = req.user._id.toString();
    const conversationService = getConversationService(req);

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Прашањето не може да биде празно.' });
    }
    if (question.length > 500) {
      return res.status(400).json({ success: false, message: 'Прашањето е премногу долго. Максимум 500 карактери.' });
    }

    // Verify conversation belongs to user
    await conversationService.getConversation(conversationId, userId);

    // Deduct credits BEFORE streaming starts
    const creditService = req.app.locals.creditService;
    let creditsRemaining = null;
    if (creditService) {
      try {
        const creditResult = await creditService.deductCredits(
          req.user._id, 1, 'AI_QUESTION',
          { conversationId, endpoint: req.originalUrl }
        );
        creditsRemaining = creditResult.newBalance;
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
      }
    }

    try {
      req.app.locals.activityLogger?.analyticsService?.trackActivity(String(userId), 'ai_query', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        queryType: 'conversation_stream',
      });
    } catch (_) { /* analytics optional */ }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Handle client disconnect
    let clientDisconnected = false;
    req.on('close', () => { clientDisconnected = true; });

    // Stream the response
    await chatBotService.askQuestionStream(question, userId, conversationId, (event) => {
      if (clientDisconnected) return;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }, agent, from);

    // Send credits info as final event
    if (!clientDisconnected && creditsRemaining !== null) {
      res.write(`data: ${JSON.stringify({ type: 'credits', data: { creditsRemaining } })}\n\n`);
    }

    if (!clientDisconnected) {
      res.write('data: [DONE]\n\n');
      res.end();
    }

  } catch (error) {
    console.error('❌ Error in conversation ask-stream:', error);

    // If headers already sent, try to send error as SSE event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      if (error.message.includes('достигнавте')) {
        return res.status(429).json({ success: false, message: error.message, limitExceeded: true });
      }
      if (error.message.includes('not found') || error.message.includes('unauthorized')) {
        return res.status(404).json({ success: false, message: 'Конверзацијата не е пронајдена.' });
      }
      return res.status(500).json({ success: false, message: 'Се случи грешка при обработка на вашето прашање.' });
    }
  }
});

/**
 * @route   PUT /api/chatbot/conversations/:id/archive
 * @desc    Archive a conversation (mark as inactive)
 * @access  Private (requires authentication)
 * @returns { success: true }
 */
router.put('/conversations/:id/archive', authenticateJWT, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;
    const conversationService = getConversationService(req);

    await conversationService.archiveConversation(conversationId, userId);

    return res.status(200).json({
      success: true,
      message: 'Конверзацијата е архивирана.',
    });

  } catch (error) {
    console.error('❌ Error archiving conversation:', error);

    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({
        success: false,
        message: 'Конверзацијата не е пронајдена.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Не можевме да ја архивираме конверзацијата.',
    });
  }
});

/**
 * @route   DELETE /api/chatbot/conversations/:id
 * @desc    Delete a conversation
 * @access  Private (requires authentication)
 * @returns { success: true }
 */
router.delete('/conversations/:id', authenticateJWT, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;
    const conversationService = getConversationService(req);

    await conversationService.deleteConversation(conversationId, userId);

    return res.status(200).json({
      success: true,
      message: 'Конверзацијата е избришана.',
    });

  } catch (error) {
    console.error('❌ Error deleting conversation:', error);

    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({
        success: false,
        message: 'Конверзацијата не е пронајдена.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Не можевме да ја избришеме конверзацијата.',
    });
  }
});

/**
 * @route   PUT /api/chatbot/conversations/:id/title
 * @desc    Update conversation title
 * @access  Private (requires authentication)
 * @body    { title: string }
 * @returns { success: true, title: string }
 */
router.put('/conversations/:id/title', authenticateJWT, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { title } = req.body;
    const userId = req.user._id;
    const conversationService = getConversationService(req);

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Насловот не може да биде празен.',
      });
    }

    const result = await conversationService.updateConversationTitle(conversationId, userId, title);

    return res.status(200).json({
      success: true,
      data: { title: result.title },
      message: 'Насловот е ажуриран.',
    });

  } catch (error) {
    console.error('❌ Error updating conversation title:', error);

    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({
        success: false,
        message: 'Конверзацијата не е пронајдена.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Не можевме да го ажурираме насловот.',
    });
  }
});

/**
 * @route   PUT /api/chatbot/conversations/:conversationId/messages/:messageId/feedback
 * @desc    Rate an AI message (thumbs up/down)
 * @access  Private (requires authentication)
 * @body    { rating: "up" | "down" | null }
 */
router.put('/conversations/:conversationId/messages/:messageId/feedback', authenticateJWT, async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;
    const conversationService = getConversationService(req);

    await conversationService.rateMessage(conversationId, messageId, userId, rating);

    return res.status(200).json({
      success: true,
      message: 'Оценката е зачувана.',
    });
  } catch (error) {
    console.error('❌ Error rating message:', error);

    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: 'Не можевме да ја зачуваме оценката.',
    });
  }
});

/**
 * @route   GET /api/chatbot/agent-memory
 * @desc    The per-character relationship note (for a referential greeting).
 *          Honors the user's global memory opt-out.
 * @access  Private (requires authentication)
 * @query   agent
 * @returns { note: string, hasMemory: boolean }
 */
router.get('/agent-memory', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const agent = req.query.agent;
    const db = req.app.locals.db;
    if (!agent || !db) {
      return res.status(200).json({ success: true, data: { note: '', hasMemory: false } });
    }
    const enabled = (await new UserMemoryService(db).get(userId)).enabled;
    if (!enabled) {
      return res.status(200).json({ success: true, data: { note: '', hasMemory: false } });
    }
    const { note } = await new AgentMemoryService(db).get(userId, agent);
    return res.status(200).json({ success: true, data: { note: note || '', hasMemory: !!note } });
  } catch (error) {
    console.error('❌ Error getting agent memory:', error);
    return res.status(200).json({ success: true, data: { note: '', hasMemory: false } });
  }
});

/**
 * @route   GET /api/chatbot/nudges
 * @desc    Proactive suggestions for the dashboard: resume threads with the AI Team
 *          members the user has worked with (driven by per-character memory +
 *          conversation recency), or an onboarding nudge for new users. Honors the
 *          global memory opt-out. Extension point: data-driven nudges (LHC/HR) can
 *          be appended here later without any client change.
 * @access  Private (requires authentication)
 * @returns { nudges: [{ id, agent, title, body, seed }] }
 */
router.get('/nudges', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const db = req.app.locals.db;
    const convService = req.app.locals.conversationService;
    if (!db || !convService) {
      return res.status(200).json({ success: true, data: { nudges: [] } });
    }

    const memEnabled = (await new UserMemoryService(db).get(userId)).enabled;
    const agentMem = new AgentMemoryService(db);
    const nudges = [];

    // Resume nudges — characters the user has an in-progress relationship with.
    // Ordered hr → corporate → legal (most specialized first).
    for (const key of ['hr', 'corporate', 'legal']) {
      const note = memEnabled ? (await agentMem.get(userId, key)).note : '';
      const latest = await convService.getLatestForAgent(userId, key);
      if (note) {
        nudges.push({
          id: `resume-${key}`,
          agent: key,
          title: `Продолжи со ${getAgentName(key)}`,
          body: `Последен пат работевте на: ${note}`,
          seed: `Да продолжиме каде што застанавме (${note}). Кои се следните чекори?`,
        });
      } else if (latest && latest.title) {
        nudges.push({
          id: `resume-${key}`,
          agent: key,
          title: `Продолжи со ${getAgentName(key)}`,
          body: `Отворен разговор: „${latest.title}".`,
          seed: '',
        });
      }
    }

    // New user → a warm onboarding nudge to meet the team.
    if (nudges.length === 0) {
      nudges.push({
        id: 'start-legal',
        agent: 'legal',
        title: `Запознај го ${getAgentName('legal')}`,
        body: 'Постави прашање и твојот правен AI тим ќе те насочи — бесплатно, веднаш.',
        seed: '',
      });
    }

    return res.status(200).json({ success: true, data: { nudges: nudges.slice(0, 3) } });
  } catch (error) {
    console.error('❌ Error getting nudges:', error);
    return res.status(200).json({ success: true, data: { nudges: [] } });
  }
});

module.exports = router;
