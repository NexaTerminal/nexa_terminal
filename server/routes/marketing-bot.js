const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { checkCredits } = require('../middleware/creditMiddleware');
const marketingBotService = require('../chatbot/MarketingBotService');

/**
 * Marketing Chatbot Routes
 *
 * Endpoints:
 * - POST /api/marketing-bot/ask - Ask a marketing question
 * - GET /api/marketing-bot/limits - Check user's remaining questions
 * - GET /api/marketing-bot/health - Check service health
 *
 * Conversation endpoints (shared with legal chatbot):
 * - POST /api/marketing-bot/conversations/new - Create new conversation
 * - GET /api/marketing-bot/conversations/:id - Get conversation
 * - POST /api/marketing-bot/conversations/:id/ask - Send message to conversation
 */

/**
 * @route   POST /api/marketing-bot/ask
 * @desc    Ask a marketing question
 * @access  Private (requires authentication)
 */
router.post('/ask', authenticateJWT, checkCredits(1), async (req, res) => {
  try {
    const { question, conversationId } = req.body;
    const userId = req.user._id.toString();

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

    const response = await marketingBotService.askQuestion(question, userId, conversationId);

    // Deduct credits
    const creditService = req.app.locals.creditService;
    if (creditService) {
      try {
        const creditResult = await creditService.deductCredits(
          req.user._id,
          1,
          'AI_QUESTION',
          { conversationId, endpoint: req.originalUrl, botType: 'marketing' }
        );

        return res.status(200).json({
          success: true,
          data: {
            answer: response.answer,
            sources: response.sources,
            remainingQuestions: response.remainingQuestions,
            timestamp: response.timestamp,
            conversationId: conversationId || null,
            creditsRemaining: creditResult.newBalance,
            botType: 'marketing'
          },
        });
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        answer: response.answer,
        sources: response.sources,
        remainingQuestions: response.remainingQuestions,
        timestamp: response.timestamp,
        conversationId: conversationId || null,
        botType: 'marketing'
      },
    });

  } catch (error) {
    console.error('❌ Error in /api/marketing-bot/ask:', error);

    if (error.message.includes('достигнавте')) {
      return res.status(429).json({
        success: false,
        message: error.message,
        limitExceeded: true,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Се случи грешка при обработка на вашето маркетинг прашање.',
    });
  }
});

/**
 * @route   GET /api/marketing-bot/limits
 * @desc    Get user's remaining marketing questions
 * @access  Private
 */
router.get('/limits', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const limitStatus = await marketingBotService.checkWeeklyLimit(userId);

    return res.status(200).json({
      success: true,
      data: {
        remaining: limitStatus.remaining,
        total: marketingBotService.weeklyLimit,
        questionsAsked: limitStatus.questionsAsked || 0,
        resetDate: limitStatus.resetDate,
        botType: 'marketing'
      },
    });

  } catch (error) {
    console.error('❌ Error in /api/marketing-bot/limits:', error);
    return res.status(500).json({
      success: false,
      message: 'Не можевме да ги вчитаме вашите лимити.',
    });
  }
});

/**
 * @route   GET /api/marketing-bot/health
 * @desc    Check marketing chatbot health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = marketingBotService.getHealthStatus();

    return res.status(200).json({
      success: true,
      data: healthStatus,
    });

  } catch (error) {
    console.error('❌ Error in /api/marketing-bot/health:', error);
    return res.status(500).json({
      success: false,
      message: 'Marketing chatbot service is down',
    });
  }
});

// ============================================================================
// CONVERSATION ENDPOINTS (shared conversation service)
// ============================================================================

function getConversationService(req) {
  const conversationService = req.app.locals.conversationService;
  if (!conversationService) {
    throw new Error('Conversation service not initialized');
  }
  return conversationService;
}

/**
 * @route   POST /api/marketing-bot/conversations/new
 * @desc    Create a new marketing conversation
 * @access  Private
 */
router.post('/conversations/new', authenticateJWT, async (req, res) => {
  try {
    const { firstQuestion } = req.body;
    const userId = req.user._id;
    const conversationService = getConversationService(req);

    // Create conversation with marketing tag
    const newConversation = await conversationService.createConversation(
      userId,
      firstQuestion,
      { botType: 'marketing' }
    );

    return res.status(201).json({
      success: true,
      data: newConversation,
    });

  } catch (error) {
    console.error('❌ Error creating marketing conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Не можевме да креираме нова конверзација.',
    });
  }
});

/**
 * @route   GET /api/marketing-bot/conversations/:id
 * @desc    Get marketing conversation
 * @access  Private
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
 * @route   POST /api/marketing-bot/conversations/:id/ask
 * @desc    Send message to marketing conversation
 * @access  Private
 */
router.post('/conversations/:id/ask', authenticateJWT, checkCredits(1), async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { question } = req.body;
    const userId = req.user._id.toString();
    const conversationService = getConversationService(req);

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

    // Ask the marketing chatbot
    const response = await marketingBotService.askQuestion(question, userId, conversationId);

    // Deduct credits
    const creditService = req.app.locals.creditService;
    if (creditService) {
      try {
        const creditResult = await creditService.deductCredits(
          req.user._id,
          1,
          'AI_QUESTION',
          { conversationId, endpoint: req.originalUrl, botType: 'marketing' }
        );

        return res.status(200).json({
          success: true,
          data: {
            answer: response.answer,
            sources: response.sources,
            remainingQuestions: response.remainingQuestions,
            timestamp: response.timestamp,
            creditsRemaining: creditResult.newBalance,
            botType: 'marketing'
          },
        });
      } catch (creditError) {
        console.error('Credit deduction error:', creditError);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        answer: response.answer,
        sources: response.sources,
        remainingQuestions: response.remainingQuestions,
        timestamp: response.timestamp,
        botType: 'marketing'
      },
    });

  } catch (error) {
    console.error('❌ Error in marketing conversation ask:', error);

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

module.exports = router;
