const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const chatBotService = require('../chatbot/ChatBotService');

/**
 * Chatbot Routes
 *
 * Endpoints:
 * - POST /api/chatbot/ask - Ask a question to the AI chatbot
 * - GET /api/chatbot/limits - Check user's remaining questions
 * - GET /api/chatbot/health - Check chatbot service health
 */

/**
 * @route   POST /api/chatbot/ask
 * @desc    Ask a question to the AI chatbot
 * @access  Private (requires authentication)
 * @body    { question: string }
 * @returns { answer: string, sources: array, remainingQuestions: number }
 */
router.post('/ask', authenticateJWT, async (req, res) => {
  try {
    const { question } = req.body;
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

    // Ask the chatbot
    const response = await chatBotService.askQuestion(question, userId);

    // Return successful response
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

module.exports = router;
