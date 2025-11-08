# AI Legal Chatbot Implementation Plan

## Overview
Add an AI-powered legal chatbot to the Nexa Terminal platform that provides users with legal guidance and answers questions related to their generated documents. The chatbot will be context-aware, document-specific, and limited to 5 questions per month for users.

## Business Value
- **Enhanced User Experience**: Immediate legal guidance after document generation
- **Reduced Support Load**: AI handles common legal questions automatically
- **Premium Feature**: 5 free questions/month creates upsell opportunity
- **Competitive Advantage**: Unique feature in legal document automation space
- **User Retention**: Users stay engaged with platform longer

## Technical Stack & Architecture

### Backend Technologies
```json
{
  "ai_framework": "@langchain/openai (or @langchain/anthropic)",
  "vector_database": "Pinecone or ChromaDB",
  "embeddings": "@langchain/openai (text-embedding-ada-002)",
  "document_processing": "@langchain/community (PDFLoader, TextLoader)",
  "rate_limiting": "express-rate-limit + custom MongoDB tracking",
  "caching": "Redis (optional for response caching)",
  "real_time": "Socket.io (already implemented)"
}
```

### Database Schema Extensions
```javascript
// New Collections in MongoDB

// 1. ai_chat_sessions
{
  _id: ObjectId,
  userId: ObjectId,
  documentId: ObjectId, // Reference to generated document
  documentType: String, // 'terminationDueToFault', 'employmentAgreement', etc.
  documentContext: {
    generatedFields: Object, // Form data used to generate document
    companyInfo: Object,     // Company information
    articleUsed: String,     // Legal article reference
    timestamp: Date
  },
  messages: [{
    role: String, // 'user', 'assistant', 'system'
    content: String,
    timestamp: Date,
    tokens_used: Number
  }],
  status: String, // 'active', 'completed', 'archived'
  createdAt: Date,
  updatedAt: Date
}

// 2. ai_usage_tracking
{
  _id: ObjectId,
  userId: ObjectId,
  month: String, // 'YYYY-MM' format
  questionsUsed: Number,
  questionLimit: Number, // Default: 5
  subscriptionTier: String, // 'free', 'premium', 'enterprise'
  questionsHistory: [{
    question: String,
    timestamp: Date,
    documentType: String
  }],
  createdAt: Date,
  updatedAt: Date
}

// 3. legal_knowledge_base
{
  _id: ObjectId,
  documentType: String, // 'terminationDueToFault', 'employment', etc.
  category: String, // 'procedures', 'legal_articles', 'court_decisions', 'faqs'
  title: String,
  content: String,
  metadata: {
    lawArticles: [String], // ['член 81', 'член 82']
    keywords: [String],
    lastUpdated: Date,
    source: String, // 'ЗРО', 'court_decision', 'practice'
  },
  vector_embedding: [Number], // Generated embeddings for similarity search
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Implementation Phases

### Phase 1: Foundation & Knowledge Base (Week 1-2)

#### Step 1.1: Install Dependencies
```bash
# Server dependencies
cd server
npm install @langchain/openai @langchain/community @langchain/vectorstores
npm install pinecone-database @pinecone-database/pinecone
npm install pdf-parse mammoth # For document processing
npm install tiktoken # Token counting for OpenAI

# Client dependencies  
cd client
npm install @types/socket.io-client # If using TypeScript
```

#### Step 1.2: Create Knowledge Base Structure
```
server/ai_knowledge/
├── base/
│   ├── macedonian_labor_law.md
│   ├── general_procedures.md
│   └── legal_terminology.md
├── employment/
│   ├── termination_procedures.md
│   ├── termination_due_to_fault.md
│   ├── employment_agreements.md
│   ├── annual_leave_decisions.md
│   └── court_decisions.json
├── contracts/
│   ├── rent_agreements.md
│   └── general_contract_law.md
├── personal_data/
│   ├── gdpr_compliance.md
│   └── consent_procedures.md
└── faqs/
    ├── common_questions.md
    └── procedural_steps.md
```

#### Step 1.3: Create Knowledge Base Content
Content should include:
- **Legal Articles**: Full text of relevant ZRO articles
- **Procedures**: Step-by-step guides for each document type  
- **Court Decisions**: Relevant precedents and interpretations
- **Common Questions**: FAQ format for frequent user queries
- **Timelines**: Legal deadlines and notice periods
- **Required Documents**: Supporting documentation needed

#### Step 1.4: Set up Vector Database
```javascript
// server/services/vectorDatabaseService.js
const { Pinecone } = require('pinecone-database');
const { OpenAIEmbeddings } = require('@langchain/openai');

class VectorDatabaseService {
  constructor() {
    this.pinecone = new Pinecone({
      environment: process.env.PINECONE_ENVIRONMENT,
      apiKey: process.env.PINECONE_API_KEY
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  }

  async initializeIndex() {
    // Create index if doesn't exist
    // Index name: 'nexa-legal-knowledge'
  }

  async addDocument(content, metadata) {
    // Generate embeddings and store in Pinecone
  }

  async searchSimilar(query, documentType, limit = 5) {
    // Perform similarity search with filters
  }
}
```

### Phase 2: AI Service Implementation (Week 2-3)

#### Step 2.1: Create AI Chat Service
```javascript
// server/services/aiChatService.js
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');

class AIChatService {
  constructor() {
    this.llm = new ChatOpenAI({
      temperature: 0.1,
      modelName: 'gpt-4',
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateContextualResponse(userQuestion, documentContext, knowledgeContext) {
    const prompt = PromptTemplate.fromTemplate(`
      Ти си експерт правник за македонско трудово право. Корисникот штотуку генерираше документ и има прашање.

      КОНТЕКСТ НА ДОКУМЕНТ:
      - Тип документ: {documentType}
      - Компанија: {companyName}
      - Користен правен член: {legalArticle}
      - Детали: {documentDetails}

      РЕЛЕВАНТНО ЗНАЕЊЕ:
      {knowledgeContext}

      ПРАШАЊЕ НА КОРИСНИК: {userQuestion}

      Одговори професионално на македонски јазик. Биди конкретен и практичен. Вклучи:
      1. Директен одговор на прашањето
      2. Релевантни правни членови  
      3. Практични чекори (ако е применливо)
      4. Потенцијални ризици или внимавања
      
      Одговор:
    `);

    // Generate and return response
  }
}
```

#### Step 2.2: Create Usage Tracking Service
```javascript
// server/services/usageTrackingService.js
class UsageTrackingService {
  async checkUserQuestionLimit(userId) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const usage = await db.collection('ai_usage_tracking')
      .findOne({ userId, month: currentMonth });
    
    if (!usage) {
      await this.createMonthlyUsage(userId);
      return { canAsk: true, questionsLeft: 5 };
    }
    
    return {
      canAsk: usage.questionsUsed < usage.questionLimit,
      questionsLeft: usage.questionLimit - usage.questionsUsed,
      questionsUsed: usage.questionsUsed
    };
  }

  async recordQuestionUsage(userId, question, documentType) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    await db.collection('ai_usage_tracking').updateOne(
      { userId, month: currentMonth },
      { 
        $inc: { questionsUsed: 1 },
        $push: { 
          questionsHistory: {
            question,
            timestamp: new Date(),
            documentType
          }
        }
      }
    );
  }
}
```

### Phase 3: API Endpoints (Week 3)

#### Step 3.1: Chat API Routes
```javascript
// server/routes/aiChat.js
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const AIChatService = require('../services/aiChatService');
const UsageTrackingService = require('../services/usageTrackingService');

// Start new chat session
router.post('/start-session', authenticateJWT, async (req, res) => {
  // Create new chat session with document context
});

// Send message to AI
router.post('/message', authenticateJWT, async (req, res) => {
  // 1. Check usage limits
  // 2. Get relevant knowledge from vector DB
  // 3. Generate AI response
  // 4. Record usage
  // 5. Save to chat session
});

// Get chat history
router.get('/session/:sessionId', authenticateJWT, async (req, res) => {
  // Return chat session messages
});

// Get usage stats
router.get('/usage', authenticateJWT, async (req, res) => {
  // Return current month usage
});
```

### Phase 4: Frontend Implementation (Week 4)

#### Step 4.1: Chat UI Components
```javascript
// client/src/components/ai/AIChatModal.js
const AIChatModal = ({ isOpen, onClose, documentContext }) => {
  // Chat interface with:
  // - Message history
  // - Input field
  // - Usage counter
  // - Loading states
  // - Error handling
};

// client/src/components/ai/AIChatButton.js  
const AIChatButton = ({ documentContext }) => {
  // Button that appears after document generation
  // Shows usage count (e.g., "AI Chat (3/5 questions left)")
};
```

#### Step 4.2: Integration with Document Pages
```javascript
// Add to BaseDocumentPage.js after successful generation
const handleDocumentGenerated = (generatedDocument) => {
  // Existing success logic...
  
  // Enable AI chat button with document context
  setDocumentContext({
    documentType: config.documentType,
    generatedFields: formData,
    companyInfo: user.companyInfo,
    timestamp: new Date()
  });
  setShowAIChat(true);
};
```

### Phase 5: Knowledge Base Population (Week 4-5)

#### Step 5.1: Content Creation Scripts
```javascript
// server/scripts/populateKnowledgeBase.js
// Script to:
// 1. Parse markdown files
// 2. Generate embeddings
// 3. Store in vector database
// 4. Update MongoDB records
```

#### Step 5.2: Legal Content Structure

**Employment Termination Knowledge Base:**
```markdown
# Termination Due to Fault Procedures

## Legal Basis
- Article 81: Standard violations (30-day notice)
- Article 82: Serious violations (immediate termination)

## Required Steps
1. Document the violation with evidence
2. Issue formal written decision
3. Deliver to employee (personal or registered mail)
4. Respect notice period (if applicable)
5. Process final payments
6. Handle potential appeals

## Common Questions
Q: Can employee appeal the decision?
A: Yes, within 60 days to competent court...

## Required Evidence
- Internal company rules
- Documentation of violation
- Previous warnings (if any)
- Witness statements
```

### Phase 6: Security & Rate Limiting (Week 5)

#### Step 6.1: Security Measures
```javascript
// Implement:
// - Input sanitization
// - Response content filtering
// - API rate limiting
// - User authentication checks
// - Audit logging
```

#### Step 6.2: Error Handling & Monitoring
```javascript
// Add comprehensive error handling:
// - AI service failures
// - Vector database issues  
// - Usage limit exceeded
// - Invalid questions
// - System monitoring
```

## Deployment Considerations

### Environment Variables
```env
# AI Services
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key  
PINECONE_ENVIRONMENT=your_pinecone_env
PINECONE_INDEX_NAME=nexa-legal-knowledge

# Features
AI_CHAT_ENABLED=true
MONTHLY_QUESTION_LIMIT=5
```

### Performance Optimization
- **Response Caching**: Cache common question-answer pairs
- **Embedding Optimization**: Pre-compute embeddings for knowledge base
- **Rate Limiting**: Prevent abuse and manage costs
- **Token Management**: Track and optimize AI usage costs

## Future Enhancements

### Premium Tiers
- **Free**: 5 questions/month
- **Basic**: 25 questions/month + priority support
- **Premium**: Unlimited questions + phone consultations
- **Enterprise**: Custom limits + dedicated legal advisor

### Advanced Features
- **Document Analysis**: Upload and analyze existing legal documents
- **Multi-language Support**: English and Macedonian responses
- **Legal Updates**: Automatic notifications about law changes
- **Case Law Integration**: Real-time court decision updates

## Success Metrics

### Key Performance Indicators
- **Usage Rate**: % of users who use AI chat after document generation
- **Question Quality**: Relevance and complexity of user questions
- **Response Accuracy**: User feedback on AI response quality
- **Conversion Rate**: Free to paid tier conversion
- **Cost Efficiency**: AI costs vs. traditional support costs

### Monitoring & Analytics
- Track most common questions by document type
- Monitor AI response times and accuracy
- User satisfaction surveys
- Cost per question analysis

## Risk Mitigation

### Legal Compliance
- **Disclaimer**: Clear statements about AI limitations
- **Professional Review**: Regular legal expert validation
- **Liability Limits**: Terms of service protections
- **Data Privacy**: GDPR compliance for chat data

### Technical Risks
- **AI Hallucination**: Validation and fact-checking processes
- **Cost Control**: Usage limits and monitoring
- **Uptime**: Redundancy and failover systems
- **Security**: Regular security audits and updates

## Budget Estimation

### Development Costs (5-6 weeks)
- **Backend Development**: ~40 hours
- **Frontend Development**: ~25 hours  
- **Knowledge Base Creation**: ~30 hours
- **Testing & QA**: ~15 hours
- **Total**: ~110 hours

### Monthly Operating Costs
- **OpenAI API**: ~$100-300 (depends on usage)
- **Pinecone**: ~$70-200 (for vector database)
- **Additional Infrastructure**: ~$50
- **Total Monthly**: ~$220-550

## Implementation Timeline

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 1 | Dependencies, Knowledge structure | Knowledge base framework |
| 2 | Vector DB setup, AI service | Core AI functionality |
| 3 | API endpoints, Usage tracking | Backend API complete |
| 4 | Frontend components, Integration | UI implementation |
| 5 | Content population, Testing | Knowledge base populated |
| 6 | Security, Polish, Launch | Production ready system |

This AI chatbot feature will significantly enhance the Nexa Terminal platform's value proposition and create multiple revenue opportunities while providing genuine value to users navigating complex legal procedures.