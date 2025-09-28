# Nexa Terminal Legal AI Chatbot Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan for integrating a Legal AI Chatbot feature into the existing Nexa Terminal MERN stack application. The chatbot will leverage LangChain.js for conversation management, OpenAI's GPT models for legal assistance, and integrate seamlessly with Nexa's existing authentication, user management, and feature toggle systems.

## Current Architecture Analysis

### Existing Nexa Terminal Structure
- **Frontend**: React 19 + React Router + i18next + CSS Modules
- **Backend**: Express.js + MongoDB (native driver) + JWT auth + Socket.io
- **Features**: Document automation, user verification, company management
- **Architecture Patterns**: Feature toggles, JWT auth, CSS Modules styling
- **Database**: MongoDB with embedded user company info, no Mongoose

### Integration Points
1. **Authentication System**: Existing JWT-based auth with `AuthContext`
2. **Feature Toggle System**: `settingsManager.js` for enabling/disabling features
3. **User Management**: Verified company requirements for premium features
4. **Styling System**: CSS Modules pattern with consistent design tokens
5. **API Structure**: Express.js routes with controllers and services pattern

## Implementation Overview

### Core Features
1. **Legal AI Chatbot Interface** - Interactive chat for legal questions
2. **Usage Limits** - 5 questions per month for verified users
3. **Conversation History** - Persistent chat history with legal disclaimers
4. **Legal Compliance** - Professional boundaries and disclaimer enforcement
5. **Integration** - Seamless integration with existing document generation

### Technical Stack
- **LangChain.js**: Conversation management and prompt engineering
- **OpenAI GPT-4**: Legal knowledge and response generation
- **MongoDB**: Conversation history and usage tracking
- **React**: Interactive chat interface components
- **Express.js**: API endpoints for chat functionality

## Detailed Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Feature Toggle Configuration
**File**: `server/config/settingsManager.js`
```javascript
// Add to production features object
legalAIChat: true

// Add to default settings
features: {
  // existing features...
  legalAIChat: true
}
```

**File**: `.vscode/settings.json`
```json
{
  "nexa.features": {
    "authentication": true,
    "documentAutomation": true,
    "socialPosts": true,
    "blog": false,
    "legalAIChat": true
  }
}
```

#### 1.2 Dependencies Installation
**File**: `server/package.json` - Add dependencies:
```json
{
  "dependencies": {
    "langchain": "^0.1.25",
    "@langchain/openai": "^0.0.14",
    "@langchain/community": "^0.0.20",
    "openai": "^4.28.4"
  }
}
```

#### 1.3 Environment Variables
**File**: `server/.env` - Add required variables:
```env
# AI Chatbot Configuration
OPENAI_API_KEY=your-openai-api-key
AI_CHAT_MODEL=gpt-4-turbo-preview
AI_CHAT_TEMPERATURE=0.1
AI_CHAT_MAX_TOKENS=1000
```

### Phase 2: Database Schema & Models (Week 1-2)

#### 2.1 Chat Conversation Schema
**File**: `server/config/aiChatSchemas.js`
```javascript
const { ObjectId } = require('mongodb');

const chatConversationSchema = {
  userId: ObjectId,
  companyId: ObjectId, // From user.companyInfo
  conversationId: String, // UUID for conversation grouping
  messages: [{
    messageId: String,
    role: String, // 'user' | 'assistant' | 'system'
    content: String,
    timestamp: Date,
    metadata: {
      model: String,
      tokens: Number,
      processingTime: Number
    }
  }],
  status: String, // 'active' | 'archived' | 'deleted'
  category: String, // 'general' | 'employment' | 'contracts' | 'compliance'
  createdAt: Date,
  updatedAt: Date,
  isArchived: Boolean
};

const chatUsageSchema = {
  userId: ObjectId,
  month: String, // 'YYYY-MM' format
  questionsUsed: Number,
  questionsLimit: Number, // 5 for verified users
  resetDate: Date,
  createdAt: Date,
  updatedAt: Date
};

module.exports = {
  chatConversationSchema,
  chatUsageSchema
};
```

#### 2.2 Database Indexes
**File**: `server/config/aiChatIndexes.js`
```javascript
const createAIChatIndexes = async (db) => {
  try {
    // Chat conversations indexes
    await db.collection('chatConversations').createIndex({
      userId: 1,
      createdAt: -1
    });
    await db.collection('chatConversations').createIndex({
      conversationId: 1
    });
    await db.collection('chatConversations').createIndex({
      userId: 1,
      status: 1
    });

    // Chat usage indexes
    await db.collection('chatUsage').createIndex({
      userId: 1,
      month: 1
    }, { unique: true });

    console.log('✅ AI Chat indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating AI chat indexes:', error);
  }
};

module.exports = { createAIChatIndexes };
```

### Phase 3: Backend LangChain Integration (Week 2)

#### 3.1 LangChain Service
**File**: `server/services/aiChatService.js`
```javascript
const { ChatOpenAI } = require('@langchain/openai');
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const { PromptTemplate } = require('@langchain/core/prompts');

class AIChatService {
  constructor() {
    this.model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.AI_CHAT_MODEL || 'gpt-4-turbo-preview',
      temperature: parseFloat(process.env.AI_CHAT_TEMPERATURE) || 0.1,
      maxTokens: parseInt(process.env.AI_CHAT_MAX_TOKENS) || 1000,
    });

    this.systemPrompt = `You are a Legal AI Assistant for Nexa Terminal, a Macedonian business document automation platform.

CRITICAL DISCLAIMERS AND BOUNDARIES:
- You are NOT a licensed attorney and cannot provide legal advice
- All responses are for informational purposes only
- Users MUST consult with qualified legal professionals for legal decisions
- You cannot create attorney-client relationships
- You cannot provide definitive legal conclusions or guarantees

YOUR ROLE:
- Provide general information about Macedonian business law
- Explain legal concepts in accessible language
- Guide users toward appropriate legal resources
- Help users understand document requirements
- Assist with business compliance questions

RESPONSE GUIDELINES:
- Always include disclaimers about not being legal advice
- Encourage consultation with licensed attorneys
- Focus on factual, well-sourced information
- Avoid speculation or creative interpretation
- Use professional, clear language
- Reference relevant Macedonian laws when appropriate

COMPANY CONTEXT:
The user represents a verified Macedonian business. Their company information includes:
- Company Name: {companyName}
- Tax Number: {taxNumber}
- Business Activity: {businessActivity}

Remember: You assist with legal information, not legal advice.`;
  }

  async processQuestion(userMessage, conversationHistory, companyInfo) {
    try {
      const systemMessage = new SystemMessage({
        content: this.systemPrompt
          .replace('{companyName}', companyInfo?.companyName || 'N/A')
          .replace('{taxNumber}', companyInfo?.companyTaxNumber || 'N/A')
          .replace('{businessActivity}', companyInfo?.businessActivity || 'N/A')
      });

      const messages = [systemMessage];

      // Add conversation history
      conversationHistory.forEach(msg => {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant') {
          messages.push(new AIMessage(msg.content));
        }
      });

      // Add current user message
      messages.push(new HumanMessage(userMessage));

      const startTime = Date.now();
      const response = await this.model.invoke(messages);
      const processingTime = Date.now() - startTime;

      return {
        content: response.content,
        metadata: {
          model: this.model.modelName,
          tokens: response.usage?.total_tokens || 0,
          processingTime
        }
      };
    } catch (error) {
      console.error('AI Chat Service Error:', error);
      throw new Error('Failed to process AI chat request');
    }
  }

  validateQuestion(question) {
    if (!question || typeof question !== 'string') {
      throw new Error('Question is required and must be a string');
    }

    if (question.trim().length < 10) {
      throw new Error('Question must be at least 10 characters long');
    }

    if (question.length > 2000) {
      throw new Error('Question must be less than 2000 characters');
    }

    // Check for inappropriate content (basic filtering)
    const inappropriatePatterns = [
      /hack|crack|illegal|fraud/i,
      /personal information|social security|pin number/i
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(question)) {
        throw new Error('Question contains inappropriate content');
      }
    }

    return true;
  }
}

module.exports = new AIChatService();
```

#### 3.2 Chat Controller
**File**: `server/controllers/aiChatController.js`
```javascript
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const aiChatService = require('../services/aiChatService');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class AIChatController {
  // Start new conversation
  async startConversation(req, res) {
    try {
      const db = getDB();
      const userId = new ObjectId(req.user.id);
      const conversationId = uuidv4();

      // Check user verification status
      if (!req.user.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Legal AI Chat is only available for verified companies'
        });
      }

      // Check usage limits
      const canAsk = await this.checkUsageLimit(userId);
      if (!canAsk.allowed) {
        return res.status(429).json({
          success: false,
          message: canAsk.message,
          usage: canAsk.usage
        });
      }

      const conversation = {
        userId,
        companyId: req.user.companyInfo?._id ? new ObjectId(req.user.companyInfo._id) : null,
        conversationId,
        messages: [],
        status: 'active',
        category: 'general',
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false
      };

      const result = await db.collection('chatConversations').insertOne(conversation);

      res.json({
        success: true,
        conversationId,
        _id: result.insertedId,
        usage: canAsk.usage
      });
    } catch (error) {
      console.error('Start conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start conversation'
      });
    }
  }

  // Send message to AI
  async sendMessage(req, res) {
    try {
      const { conversationId, message } = req.body;
      const db = getDB();
      const userId = new ObjectId(req.user.id);

      // Validate input
      aiChatService.validateQuestion(message);

      // Check usage limits
      const canAsk = await this.checkUsageLimit(userId);
      if (!canAsk.allowed) {
        return res.status(429).json({
          success: false,
          message: canAsk.message,
          usage: canAsk.usage
        });
      }

      // Find conversation
      const conversation = await db.collection('chatConversations').findOne({
        conversationId,
        userId,
        status: 'active'
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      // Process with AI
      const aiResponse = await aiChatService.processQuestion(
        message,
        conversation.messages,
        req.user.companyInfo
      );

      // Create message objects
      const userMessage = {
        messageId: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      const assistantMessage = {
        messageId: uuidv4(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        metadata: aiResponse.metadata
      };

      // Update conversation
      await db.collection('chatConversations').updateOne(
        { conversationId, userId },
        {
          $push: {
            messages: { $each: [userMessage, assistantMessage] }
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      // Update usage count
      await this.incrementUsageCount(userId);

      // Get updated usage
      const updatedUsage = await this.getUserUsage(userId);

      res.json({
        success: true,
        userMessage,
        assistantMessage,
        usage: updatedUsage
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process message'
      });
    }
  }

  // Get conversation history
  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const db = getDB();
      const userId = new ObjectId(req.user.id);

      const conversation = await db.collection('chatConversations').findOne({
        conversationId,
        userId
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        conversation
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation'
      });
    }
  }

  // Get all user conversations
  async getUserConversations(req, res) {
    try {
      const db = getDB();
      const userId = new ObjectId(req.user.id);

      const conversations = await db.collection('chatConversations')
        .find({ userId, status: 'active' })
        .sort({ updatedAt: -1 })
        .limit(20)
        .toArray();

      const usage = await this.getUserUsage(userId);

      res.json({
        success: true,
        conversations,
        usage
      });
    } catch (error) {
      console.error('Get user conversations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversations'
      });
    }
  }

  // Check usage limits
  async checkUsageLimit(userId) {
    try {
      const usage = await this.getUserUsage(userId);

      if (usage.questionsUsed >= usage.questionsLimit) {
        return {
          allowed: false,
          message: `You have reached your monthly limit of ${usage.questionsLimit} questions. Limit resets on ${moment(usage.resetDate).format('MMMM Do, YYYY')}.`,
          usage
        };
      }

      return {
        allowed: true,
        usage
      };
    } catch (error) {
      console.error('Check usage limit error:', error);
      return {
        allowed: false,
        message: 'Unable to verify usage limits',
        usage: null
      };
    }
  }

  // Get or create user usage record
  async getUserUsage(userId) {
    try {
      const db = getDB();
      const currentMonth = moment().format('YYYY-MM');

      let usage = await db.collection('chatUsage').findOne({
        userId: new ObjectId(userId),
        month: currentMonth
      });

      if (!usage) {
        // Create new usage record
        const resetDate = moment().add(1, 'month').startOf('month').toDate();

        usage = {
          userId: new ObjectId(userId),
          month: currentMonth,
          questionsUsed: 0,
          questionsLimit: 5, // Default limit for verified users
          resetDate,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('chatUsage').insertOne(usage);
      }

      return usage;
    } catch (error) {
      console.error('Get user usage error:', error);
      throw error;
    }
  }

  // Increment usage count
  async incrementUsageCount(userId) {
    try {
      const db = getDB();
      const currentMonth = moment().format('YYYY-MM');

      await db.collection('chatUsage').updateOne(
        {
          userId: new ObjectId(userId),
          month: currentMonth
        },
        {
          $inc: { questionsUsed: 1 },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Increment usage count error:', error);
      throw error;
    }
  }

  // Archive conversation
  async archiveConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const db = getDB();
      const userId = new ObjectId(req.user.id);

      const result = await db.collection('chatConversations').updateOne(
        { conversationId, userId },
        {
          $set: {
            status: 'archived',
            isArchived: true,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        message: 'Conversation archived successfully'
      });
    } catch (error) {
      console.error('Archive conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive conversation'
      });
    }
  }
}

module.exports = new AIChatController();
```

### Phase 4: API Routes (Week 2)

#### 4.1 AI Chat Routes
**File**: `server/routes/aiChat.js`
```javascript
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { isVerified } = require('../middleware/verification');
const aiChatController = require('../controllers/aiChatController');
const RateLimitingService = require('../middleware/rateLimiting');

// Apply authentication and verification to all routes
router.use(authenticateJWT);
router.use(isVerified);

// Create rate limiter for AI chat (stricter limits)
const chatRateLimit = RateLimitingService.createChatLimiter();

// Start new conversation
router.post('/conversations', chatRateLimit, aiChatController.startConversation);

// Send message to AI
router.post('/conversations/:conversationId/messages', chatRateLimit, aiChatController.sendMessage);

// Get specific conversation
router.get('/conversations/:conversationId', aiChatController.getConversation);

// Get all user conversations
router.get('/conversations', aiChatController.getUserConversations);

// Archive conversation
router.patch('/conversations/:conversationId/archive', aiChatController.archiveConversation);

module.exports = router;
```

#### 4.2 Rate Limiting Middleware Enhancement
**File**: `server/middleware/rateLimiting.js` - Add chat limiter:
```javascript
// Add to existing rate limiting service
createChatLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each user to 10 requests per windowMs
    message: {
      success: false,
      message: 'Too many chat requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
```

### Phase 5: Frontend React Components (Week 3)

#### 5.1 AI Chat Page
**File**: `client/src/pages/terminal/AiChat.js`
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ApiService from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/terminal/Sidebar';
import RightSidebar from '../../components/terminal/RightSidebar';
import ChatInterface from '../../components/terminal/ChatInterface';
import ChatHistory from '../../components/terminal/ChatHistory';
import UsageMeter from '../../components/terminal/UsageMeter';
import styles from '../../styles/terminal/AiChat.module.css';

const AiChat = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/api/ai-chat/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations);
        setUsage(response.data.usage);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await ApiService.post('/api/ai-chat/conversations');
      if (response.data.success) {
        const newConversation = {
          _id: response.data._id,
          conversationId: response.data.conversationId,
          messages: [],
          createdAt: new Date().toISOString(),
          status: 'active'
        };

        setCurrentConversation(newConversation);
        setConversations(prev => [newConversation, ...prev]);
        setUsage(response.data.usage);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(error.response?.data?.message || 'Failed to start new conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message) => {
    if (!currentConversation || !message.trim()) return;

    try {
      setLoading(true);
      setError('');

      const response = await ApiService.post(
        `/api/ai-chat/conversations/${currentConversation.conversationId}/messages`,
        { message: message.trim() }
      );

      if (response.data.success) {
        const updatedConversation = {
          ...currentConversation,
          messages: [
            ...currentConversation.messages,
            response.data.userMessage,
            response.data.assistantMessage
          ],
          updatedAt: new Date().toISOString()
        };

        setCurrentConversation(updatedConversation);
        setUsage(response.data.usage);

        // Update conversations list
        setConversations(prev =>
          prev.map(conv =>
            conv.conversationId === currentConversation.conversationId
              ? updatedConversation
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    try {
      setLoading(true);
      const response = await ApiService.get(
        `/api/ai-chat/conversations/${conversation.conversationId}`
      );

      if (response.data.success) {
        setCurrentConversation(response.data.conversation);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const archiveConversation = async (conversationId) => {
    try {
      const response = await ApiService.patch(
        `/api/ai-chat/conversations/${conversationId}/archive`
      );

      if (response.data.success) {
        setConversations(prev =>
          prev.filter(conv => conv.conversationId !== conversationId)
        );

        if (currentConversation?.conversationId === conversationId) {
          setCurrentConversation(null);
        }
      }
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      setError('Failed to archive conversation');
    }
  };

  if (!currentUser?.isVerified) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.content}>
          <Sidebar />
          <main className={styles.main}>
            <div className={styles.verificationRequired}>
              <h2>{t('aiChat.verificationRequired')}</h2>
              <p>{t('aiChat.verificationMessage')}</p>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <h1>{t('aiChat.title')}</h1>
              <UsageMeter usage={usage} />
            </div>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.chatBody}>
              <div className={styles.sidebar}>
                <ChatHistory
                  conversations={conversations}
                  currentConversation={currentConversation}
                  onSelectConversation={selectConversation}
                  onArchiveConversation={archiveConversation}
                  onNewConversation={startNewConversation}
                  loading={loading}
                />
              </div>

              <div className={styles.chatMain}>
                <ChatInterface
                  conversation={currentConversation}
                  onSendMessage={sendMessage}
                  loading={loading}
                  usage={usage}
                />
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default AiChat;
```

#### 5.2 Chat Interface Component
**File**: `client/src/components/terminal/ChatInterface.js`
```javascript
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import MessageBubble from './MessageBubble';
import LegalDisclaimer from './LegalDisclaimer';
import styles from '../../styles/terminal/ChatInterface.module.css';

const ChatInterface = ({
  conversation,
  onSendMessage,
  loading,
  usage
}) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    // Check usage limit
    if (usage && usage.questionsUsed >= usage.questionsLimit) {
      return;
    }

    onSendMessage(message);
    setMessage('');
    setShowDisclaimer(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isLimitReached = usage && usage.questionsUsed >= usage.questionsLimit;

  return (
    <div className={styles.chatInterface}>
      {showDisclaimer && <LegalDisclaimer />}

      <div className={styles.messagesContainer}>
        {!conversation ? (
          <div className={styles.welcomeMessage}>
            <h3>{t('aiChat.welcome')}</h3>
            <p>{t('aiChat.welcomeDescription')}</p>
            <div className={styles.sampleQuestions}>
              <h4>{t('aiChat.sampleQuestions')}</h4>
              <ul>
                <li>{t('aiChat.sample1')}</li>
                <li>{t('aiChat.sample2')}</li>
                <li>{t('aiChat.sample3')}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className={styles.messages}>
            {conversation.messages.map((msg) => (
              <MessageBubble
                key={msg.messageId}
                message={msg}
              />
            ))}
            {loading && (
              <MessageBubble
                message={{
                  role: 'assistant',
                  content: t('aiChat.thinking'),
                  timestamp: new Date()
                }}
                isTyping={true}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isLimitReached
                ? t('aiChat.limitReached')
                : t('aiChat.placeholder')
            }
            disabled={loading || isLimitReached}
            rows={1}
            className={styles.textarea}
          />
          <button
            type="submit"
            disabled={!message.trim() || loading || isLimitReached}
            className={styles.sendButton}
          >
            {loading ? t('aiChat.sending') : t('aiChat.send')}
          </button>
        </div>

        {isLimitReached && (
          <div className={styles.limitWarning}>
            {t('aiChat.monthlyLimitReached')}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInterface;
```

#### 5.3 Message Bubble Component
**File**: `client/src/components/terminal/MessageBubble.js`
```javascript
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from '../../styles/terminal/MessageBubble.module.css';

const MessageBubble = ({ message, isTyping = false }) => {
  const { t } = useLanguage();

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContent = (content) => {
    // Basic formatting for AI responses
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div
      className={`${styles.messageContainer} ${styles[message.role]}`}
    >
      <div className={styles.messageBubble}>
        {message.role === 'assistant' && (
          <div className={styles.botIcon}>
            🤖
          </div>
        )}

        <div className={styles.messageContent}>
          {isTyping ? (
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <>
              <div
                className={styles.text}
                dangerouslySetInnerHTML={{
                  __html: formatContent(message.content)
                }}
              />
              <div className={styles.timestamp}>
                {formatTimestamp(message.timestamp)}
              </div>
              {message.metadata && (
                <div className={styles.metadata}>
                  <small>
                    {t('aiChat.model')}: {message.metadata.model} |
                    {t('aiChat.tokens')}: {message.metadata.tokens}
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {message.role === 'assistant' && !isTyping && (
        <div className={styles.disclaimer}>
          <small>{t('aiChat.responseDisclaimer')}</small>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
```

### Phase 6: Styling & UI (Week 3-4)

#### 6.1 Main Chat Styles
**File**: `client/src/styles/terminal/AiChat.module.css`
```css
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-primary);
}

.content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main {
  flex: 1;
  padding: 2rem;
  overflow: hidden;
  background: var(--background-secondary);
}

.chatContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--background-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.chatHeader {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-light);
  background: var(--background-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chatHeader h1 {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.chatBody {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  border-right: 1px solid var(--border-light);
  background: var(--background-tertiary);
  overflow-y: auto;
}

.chatMain {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.error {
  padding: 1rem;
  margin: 1rem;
  background: var(--color-error-light);
  color: var(--color-error);
  border-radius: 8px;
  border: 1px solid var(--color-error);
}

.verificationRequired {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.verificationRequired h2 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .main {
    padding: 1rem;
  }

  .chatBody {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
}
```

#### 6.2 Chat Interface Styles
**File**: `client/src/styles/terminal/ChatInterface.module.css`
```css
.chatInterface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background-primary);
}

.messagesContainer {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: var(--background-chat);
}

.welcomeMessage {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.welcomeMessage h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.sampleQuestions {
  margin-top: 2rem;
  text-align: left;
}

.sampleQuestions h4 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1rem;
}

.sampleQuestions ul {
  list-style: none;
  padding: 0;
}

.sampleQuestions li {
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: var(--background-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sampleQuestions li:hover {
  background: var(--background-primary);
  border-color: var(--color-primary);
}

.messages {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inputForm {
  padding: 1rem;
  border-top: 1px solid var(--border-light);
  background: var(--background-primary);
}

.inputContainer {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.textarea {
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.4;
  resize: none;
  background: var(--background-secondary);
  color: var(--text-primary);
  transition: border-color 0.2s ease;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.textarea:disabled {
  background: var(--background-disabled);
  color: var(--text-disabled);
  cursor: not-allowed;
}

.sendButton {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.sendButton:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.sendButton:disabled {
  background: var(--background-disabled);
  color: var(--text-disabled);
  cursor: not-allowed;
  transform: none;
}

.limitWarning {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--color-warning-light);
  color: var(--color-warning);
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
}

/* Auto-growing textarea */
.textarea {
  overflow-y: hidden;
}
```

### Phase 7: Integration & Configuration (Week 4)

#### 7.1 Server Integration
**File**: `server/server.js` - Add route integration:
```javascript
// Add after existing routes
const aiChatRoutes = require('./routes/aiChat');

// Add feature toggle check
const settingsManager = require('./config/settingsManager');

// AI Chat routes (with feature toggle)
if (settingsManager.isFeatureEnabled('legalAIChat')) {
  app.use('/api/ai-chat', aiChatRoutes);
  console.log('✅ Legal AI Chat feature enabled');
}
```

#### 7.2 Database Integration
**File**: `server/config/database.js` - Add index creation:
```javascript
// Add to existing index creation
const { createAIChatIndexes } = require('./aiChatIndexes');

// In the database connection function, add:
await createAIChatIndexes(db);
```

#### 7.3 Client Route Integration
**File**: `client/src/App.js` - Add route:
```javascript
// Add import
import AiChat from './pages/terminal/AiChat';

// Add route in the Routes component
<Route path="/terminal/ai-chat" element={<AiChat />} />
```

#### 7.4 Sidebar Navigation
**File**: `client/src/components/terminal/Sidebar.js` - Add menu item:
```javascript
// Add to navigation items
{
  name: t('navigation.aiChat'),
  path: '/terminal/ai-chat',
  icon: '🤖',
  requiresVerification: true
}
```

### Phase 8: Testing & Optimization (Week 5)

#### 8.1 Error Handling Enhancement
- Add comprehensive error boundaries
- Implement retry mechanisms for failed API calls
- Add validation for all user inputs
- Implement graceful degradation for API failures

#### 8.2 Performance Optimization
- Implement message pagination for long conversations
- Add lazy loading for conversation history
- Optimize re-renders with React.memo
- Add request debouncing for real-time features

#### 8.3 Security Hardening
- Implement rate limiting at multiple levels
- Add input sanitization and validation
- Implement CSRF protection for all endpoints
- Add audit logging for AI interactions

### Phase 9: Documentation & Deployment (Week 6)

#### 9.1 User Documentation
- Create in-app help system
- Add tooltip explanations for key features
- Implement guided tour for first-time users
- Create FAQ section for common questions

#### 9.2 Admin Dashboard Integration
- Add usage analytics for administrators
- Implement conversation monitoring tools
- Create user support features
- Add system health monitoring

## Integration with Existing Systems

### Document Generation Integration
The AI chatbot can be enhanced to:
1. **Reference Generated Documents**: AI can help explain generated documents
2. **Document Recommendations**: Suggest relevant documents based on user questions
3. **Template Guidance**: Provide guidance on which templates to use
4. **Legal Context**: Explain legal requirements for different document types

### User Management Integration
- **Verification Requirements**: Only verified companies can access AI chat
- **Usage Tracking**: Monitor usage patterns and limits
- **Company Context**: AI responses consider user's company information
- **Role-based Access**: Different features based on user roles

### Feature Toggle Integration
- **Development Control**: Enable/disable during development
- **Production Deployment**: Gradual rollout capabilities
- **A/B Testing**: Test different AI configurations
- **Emergency Disable**: Quick disable if issues arise

## Technical Considerations

### LangChain.js Best Practices
1. **Memory Management**: Implement conversation memory with size limits
2. **Prompt Engineering**: Craft effective system prompts for legal domain
3. **Chain Composition**: Use appropriate chains for different conversation types
4. **Token Management**: Monitor and limit token usage per conversation

### MongoDB Schema Design
1. **Conversation Storage**: Efficient storage of message history
2. **Usage Tracking**: Accurate tracking of monthly limits
3. **Indexing Strategy**: Optimize for common query patterns
4. **Data Retention**: Implement policies for old conversation cleanup

### React Component Architecture
1. **State Management**: Efficient state updates for real-time chat
2. **Component Reusability**: Create reusable chat components
3. **Performance**: Optimize rendering for large conversation histories
4. **Accessibility**: Ensure chat interface is accessible

## Deployment Strategy

### Week-by-Week Implementation
1. **Week 1**: Backend foundation (database, services, basic API)
2. **Week 2**: Core functionality (LangChain integration, full API)
3. **Week 3**: Frontend development (React components, chat interface)
4. **Week 4**: Integration and styling (connect frontend/backend, CSS)
5. **Week 5**: Testing and optimization (error handling, performance)
6. **Week 6**: Documentation and deployment (user guides, deployment)

### Testing Strategy
1. **Unit Tests**: Test individual service functions
2. **Integration Tests**: Test API endpoints and database operations
3. **E2E Tests**: Test complete user workflows
4. **Load Testing**: Test AI service performance under load
5. **Security Testing**: Validate security measures and rate limiting

### Monitoring and Analytics
1. **Usage Metrics**: Track questions per user, popular topics
2. **Performance Metrics**: Monitor response times, error rates
3. **Cost Tracking**: Monitor OpenAI API usage and costs
4. **User Satisfaction**: Collect feedback on AI responses

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating a Legal AI Chatbot into the existing Nexa Terminal MERN stack application. The plan follows established architectural patterns, maintains consistency with existing code styles, and provides a production-ready solution that enhances the platform's value proposition for verified Macedonian businesses.

The implementation leverages LangChain.js for sophisticated conversation management while maintaining the legal compliance requirements essential for a professional legal information service. The 6-week timeline allows for thorough development, testing, and integration with the existing system.