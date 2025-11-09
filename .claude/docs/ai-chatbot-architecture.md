# AI Legal Chatbot - System Architecture & Documentation

**Last Updated:** November 9, 2025
**Status:** Production Ready
**Tech Stack:** MERN + LangChain.js + Qdrant Cloud + OpenAI

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works (User Perspective)](#how-it-works-user-perspective)
3. [System Architecture](#system-architecture)
4. [Technical Components](#technical-components)
5. [Data Flow](#data-flow)
6. [Configuration](#configuration)
7. [Costs & Limits](#costs--limits)
8. [Document Management](#document-management)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What Is It?

The AI Legal Chatbot is a **RAG (Retrieval-Augmented Generation)** system that allows users to ask questions about Macedonian legal documents in natural language. The system:

- Answers questions in **Macedonian language**
- Retrieves relevant information from **546+ legal document chunks**
- Provides **source citations** for transparency
- Limits users to **4 questions per week** (free tier)
- Never uses overly confident language (no "сигурно", "дефинитивно")
- Always asks "Имате ли дополнителни прашања?" at the end

### Key Features

✅ **RAG-Powered Answers** - Combines document retrieval with AI generation
✅ **Macedonian Language** - Fully supports Cyrillic text
✅ **Source Citations** - Shows which documents were used
✅ **Cost-Optimized** - Less than $5/month for 500 documents
✅ **Production-Grade Vector Search** - Qdrant Cloud HNSW indexing
✅ **Weekly Limits** - MongoDB-tracked usage quotas

---

## How It Works (User Perspective)

### User Journey

1. **User logs in** to Nexa Terminal
2. **Navigates to** `/terminal/ai-chat`
3. **Sees their question quota** (e.g., "3 / 4 remaining")
4. **Types a question** in Macedonian (max 500 characters):
   - "Кои се основните елементи на работен договор?"
5. **Waits 2-3 seconds** while the system:
   - Converts question to vector embedding
   - Searches 546 chunks in Qdrant
   - Sends top 5 chunks + question to GPT-4o-mini
   - Gets AI response in Macedonian
6. **Receives answer** with:
   - Main response text
   - List of source documents used
   - "Имате ли дополнителни прашања?"
7. **Quota decrements** (3 → 2 remaining)

### What Happens If...

- **User runs out of questions?** → Error message: "Ја достигнавте вашата неделна граница"
- **No relevant documents found?** → System responds based on general knowledge (no hallucination)
- **Server/Qdrant is down?** → Error message: "Се случи грешка при обработка..."

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    (React Frontend)                              │
│                  http://localhost:3000/terminal/ai-chat          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP POST /api/chatbot/ask
                           │ (JWT Token + Question)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER                             │
│                  (Node.js Backend - Port 5002)                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ChatBotService.js                            │  │
│  │  1. Check weekly limits (MongoDB)                        │  │
│  │  2. Embed question (OpenAI API)                          │  │
│  │  3. Search vectors (Qdrant Cloud)                        │  │
│  │  4. Format prompt with top 5 chunks                      │  │
│  │  5. Send to GPT-4o-mini (OpenAI API)                     │  │
│  │  6. Return answer + sources                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────┬─────────────────────────┬──────────────────────────┬──┘
          │                         │                          │
          │                         │                          │
          ▼                         ▼                          ▼
┌──────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐
│   MongoDB Atlas  │  │   Qdrant Cloud      │  │   OpenAI API         │
│   (Free 512MB)   │  │   (Free 1GB)        │  │   (Pay per use)      │
├──────────────────┤  ├─────────────────────┤  ├──────────────────────┤
│ • User profiles  │  │ • 546 vectors       │  │ • Embeddings         │
│ • Weekly limits  │  │ • 1536 dimensions   │  │ • Chat completions   │
│ • Doc tracking   │  │ • Cosine similarity │  │ • GPT-4o-mini        │
└──────────────────┘  └─────────────────────┘  └──────────────────────┘
```

### Tech Stack Breakdown

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + CSS Modules | Chat interface at `/terminal/ai-chat` |
| **Backend** | Express.js + Node.js | API endpoints + business logic |
| **Vector Database** | Qdrant Cloud (1GB free) | HNSW-indexed similarity search |
| **Document Database** | MongoDB Atlas (512MB free) | User data + usage tracking |
| **AI Model** | GPT-4o-mini (OpenAI) | Answer generation (~$0.15/1M tokens) |
| **Embeddings** | text-embedding-3-small (OpenAI) | Vector embeddings (~$0.02/1M tokens) |
| **RAG Framework** | LangChain.js | Prompt templates + chains |

---

## Technical Components

### 1. Frontend: `client/src/pages/terminal/AIChat.jsx`

**Purpose:** User interface for asking questions

**Key Features:**
- Input field with 500 character limit
- Message history (user questions + AI answers)
- Question counter display (e.g., "3 / 4")
- Error handling with Macedonian messages
- Auto-scroll to latest message

**API Calls:**
```javascript
// Fetch user's remaining questions
GET /api/chatbot/limits
→ Returns: { remaining: 3, total: 4, resetDate: "2025-11-11" }

// Ask a question
POST /api/chatbot/ask
Body: { question: "Кои се основните елементи на работен договор?" }
→ Returns: { answer: "...", sources: [...], remainingQuestions: 2 }
```

### 2. Backend: `server/chatbot/ChatBotService.js`

**Purpose:** Core RAG logic

**Main Methods:**

```javascript
class ChatBotService {
  // Called on server startup
  constructor() {
    // Initialize OpenAI chat model (GPT-4o-mini)
    // Initialize OpenAI embeddings (text-embedding-3-small)
    // Initialize Qdrant client
    // Verify Qdrant collection exists
  }

  // Called when user asks a question
  async askQuestion(question, userId) {
    // 1. Check weekly limit (MongoDB)
    // 2. Retrieve top 5 relevant chunks (Qdrant)
    // 3. Format prompt with context
    // 4. Send to GPT-4o-mini
    // 5. Increment usage count (MongoDB)
    // 6. Return answer + sources
  }

  // Searches Qdrant for similar vectors
  async retrieveRelevantDocuments(question) {
    // 1. Embed question using OpenAI (1536 dimensions)
    // 2. Search Qdrant collection (HNSW index)
    // 3. Return top 5 chunks with scores
  }
}
```

**System Prompt Template:**
```
Вие сте помошен асистент за правни информации...

ВАЖНИ ПРАВИЛА ЗА КОМУНИКАЦИЈА:
- СЕКОГАШ одговарајте на македонски јазик
- НИКОГАШ не користете фрази како "сигурно", "дефинитивно"
- На крајот од секој одговор, прашајте: "Имате ли дополнителни прашања?"

Контекст од правни документи:
{context}

Прашање на корисникот: {question}
```

### 3. Document Processing: `server/scripts/process-documents.js`

**Purpose:** Convert PDF/DOCX files into searchable vector embeddings

**Process:**

```javascript
1. Read files from server/legal sources/
   ├─ PDF files (uses pdf-parse library)
   └─ DOCX files (uses mammoth library)

2. Extract text (Cyrillic-compatible)
   → Text content from each document

3. Split into chunks
   ├─ Chunk size: 1000 characters
   ├─ Overlap: 200 characters
   └─ Uses RecursiveCharacterTextSplitter

4. Create embeddings (OpenAI API)
   ├─ Model: text-embedding-3-small
   ├─ Dimensions: 1536
   └─ Cost: ~$0.02 per 1M tokens

5. Upload to Qdrant Cloud
   ├─ Collection: nexa_legal_docs
   ├─ Distance: Cosine similarity
   └─ Index: HNSW (fast approximate search)

6. Track in MongoDB
   └─ Collection: chatbot_documents
       (fileName, fileHash, chunkCount, processedAt)
```

**Run Command:**
```bash
cd server
node scripts/process-documents.js
```

**Output:**
```
✓ Connected to MongoDB
✓ Connected to Qdrant
✓ Processed: 13 documents
✓ Uploaded 546 vectors to Qdrant
Estimated cost: $0.0021
```

### 4. API Routes: `server/routes/chatbot.js`

**Endpoints:**

```javascript
// Ask a question
POST /api/chatbot/ask
Headers: { Authorization: "Bearer <JWT_TOKEN>" }
Body: { question: "..." }
Response: {
  success: true,
  data: {
    answer: "Според документите...",
    sources: [
      { documentName: "Глава III.docx", confidence: 0.87, pageNumber: null }
    ],
    timestamp: "2025-11-09T...",
    userId: "...",
    remainingQuestions: 3
  }
}

// Get user's remaining questions
GET /api/chatbot/limits
Headers: { Authorization: "Bearer <JWT_TOKEN>" }
Response: {
  success: true,
  data: {
    remaining: 3,
    total: 4,
    resetDate: "2025-11-11T00:00:00.000Z"
  }
}

// Health check
GET /api/chatbot/health
Response: {
  status: "operational",
  model: "gpt-4o-mini",
  temperature: 0.2,
  vectorStoreInitialized: true
}
```

---

## Data Flow

### Complete Request Flow (User Asks Question)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: USER SUBMITS QUESTION                                   │
├─────────────────────────────────────────────────────────────────┤
│ User types: "Кои се основните елементи на работен договор?"     │
│ Frontend: POST /api/chatbot/ask                                 │
│ Time: 0ms                                                        │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: CHECK WEEKLY LIMIT (MongoDB)                            │
├─────────────────────────────────────────────────────────────────┤
│ Query: db.chatbot_usage.findOne({ userId, weekStart })          │
│ Check: questionsAsked < 4?                                      │
│ Result: Yes (3 < 4) → Continue                                  │
│ Time: 10-50ms                                                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: CREATE QUERY EMBEDDING (OpenAI API)                     │
├─────────────────────────────────────────────────────────────────┤
│ API: POST https://api.openai.com/v1/embeddings                  │
│ Model: text-embedding-3-small                                   │
│ Input: "Кои се основните елементи на работен договор?"          │
│ Output: [0.123, -0.456, 0.789, ... ] (1536 numbers)            │
│ Cost: ~$0.000002 (negligible)                                   │
│ Time: 100-200ms                                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: SEARCH QDRANT FOR SIMILAR VECTORS                       │
├─────────────────────────────────────────────────────────────────┤
│ API: qdrantClient.search("nexa_legal_docs", {                   │
│   vector: [0.123, -0.456, ...],                                 │
│   limit: 5                                                       │
│ })                                                               │
│                                                                   │
│ Qdrant uses HNSW index to find 5 most similar chunks            │
│                                                                   │
│ Results:                                                         │
│ 1. Chunk #45 (score: 0.87) - "Работен договор содржи..."       │
│ 2. Chunk #123 (score: 0.82) - "Основни елементи се..."         │
│ 3. Chunk #267 (score: 0.79) - "Договорот мора да..."           │
│ 4. Chunk #89 (score: 0.75) - "Работодавачот..."                │
│ 5. Chunk #201 (score: 0.71) - "Вработениот..."                 │
│                                                                   │
│ Time: 10-20ms (HNSW is FAST!)                                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: FORMAT PROMPT WITH CONTEXT                              │
├─────────────────────────────────────────────────────────────────┤
│ Combine:                                                         │
│ • System prompt (rules, tone, language)                         │
│ • Context from 5 chunks                                          │
│ • User's question                                                │
│                                                                   │
│ Final prompt sent to GPT:                                        │
│ "Вие сте помошен асистент...                                    │
│  Контекст: [Source 1] Глава III: Работен договор содржи...     │
│            [Source 2] Глава II: Основни елементи се...          │
│            ...                                                   │
│  Прашање: Кои се основните елементи на работен договор?"       │
│                                                                   │
│ Time: 1-2ms                                                      │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: GENERATE ANSWER (OpenAI GPT-4o-mini)                    │
├─────────────────────────────────────────────────────────────────┤
│ API: POST https://api.openai.com/v1/chat/completions            │
│ Model: gpt-4o-mini                                               │
│ Temperature: 0.2 (less random, more factual)                    │
│                                                                   │
│ GPT reads context + question → Generates answer in Macedonian   │
│                                                                   │
│ Response:                                                        │
│ "Според документите, основните елементи на работен договор      │
│  вклучуваат: име и презиме на вработениот, податоци за          │
│  работодавачот, опис на работното место, висина на платата...   │
│  Имате ли дополнителни прашања?"                                │
│                                                                   │
│ Cost: ~$0.0001 per question                                      │
│ Time: 1-2 seconds                                                │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: INCREMENT USAGE COUNT (MongoDB)                         │
├─────────────────────────────────────────────────────────────────┤
│ Update: db.chatbot_usage.updateOne(                             │
│   { userId, weekStart },                                         │
│   { $inc: { questionsAsked: 1 } }                               │
│ )                                                                │
│                                                                   │
│ questionsAsked: 3 → 4                                            │
│ remaining: 4 - 4 = 0                                             │
│                                                                   │
│ Time: 10-50ms                                                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: RETURN RESPONSE TO USER                                 │
├─────────────────────────────────────────────────────────────────┤
│ JSON Response:                                                   │
│ {                                                                │
│   success: true,                                                 │
│   data: {                                                        │
│     answer: "Според документите...",                            │
│     sources: [                                                   │
│       { documentName: "Глава III.docx", confidence: 0.87 }      │
│     ],                                                           │
│     remainingQuestions: 0                                        │
│   }                                                              │
│ }                                                                │
│                                                                   │
│ Frontend displays answer + updates counter (4/4 → 0/4)          │
│                                                                   │
│ TOTAL TIME: ~2-3 seconds                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

**Required in `.env.development` and production `.env`:**

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# AI Chatbot Settings
CHATBOT_MAX_PROMPTS_PER_WEEK=4
CHATBOT_TEMPERATURE=0.2

# Qdrant Cloud Configuration
QDRANT_URL=https://0e2686c0-8c77-46df-847e-5f7d6012fe3e.europe-west3-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
QDRANT_COLLECTION_NAME=nexa_legal_docs

# MongoDB (for usage tracking)
MONGODB_URI=mongodb+srv://...
```

### Feature Toggle

**In `server/config/settingsManager.js`:**

```javascript
features: {
  aiChatbot: true  // Enable/disable entire chatbot feature
}
```

**In `server/server.js`:**

```javascript
if (settings.isFeatureEnabled('aiChatbot')) {
  const chatBotService = require('./chatbot/ChatBotService');
  await chatBotService.setDatabase(database);
}
```

### MongoDB Collections

The chatbot uses 3 MongoDB collections:

```javascript
// 1. Usage tracking (weekly limits)
chatbot_usage: {
  userId: ObjectId,
  weekStart: Date,           // Monday 00:00:00
  questionsAsked: Number,    // 0-4
  lastAskedAt: Date,
  createdAt: Date
}

// 2. Document processing status
chatbot_documents: {
  fileName: String,
  fileHash: String,          // MD5 hash for change detection
  filePath: String,
  pageCount: Number,
  chunkCount: Number,
  textLength: Number,
  processedAt: Date,
  status: String             // "processed"
}

// 3. Conversation history (future feature - not implemented yet)
chatbot_conversations: {
  userId: ObjectId,
  question: String,
  answer: String,
  sources: Array,
  timestamp: Date
}
```

---

## Costs & Limits

### OpenAI Costs (Pay-per-use)

| Operation | Model | Cost | Usage |
|-----------|-------|------|-------|
| **Embedding** (query) | text-embedding-3-small | $0.02 / 1M tokens | ~$0.000002 per question |
| **Chat Completion** | gpt-4o-mini | $0.15 / 1M input tokens<br>$0.60 / 1M output tokens | ~$0.0001 per question |

**Monthly Cost Estimate:**
- 1000 users × 4 questions/week = 16,000 questions/month
- Cost: ~$1.60/month

### Qdrant Cloud (Free Tier)

- **Free tier:** 1GB cluster
- **Current usage:** 546 vectors × ~6KB = ~3.3MB
- **Capacity:** Can handle ~150,000 vectors (500+ documents)
- **Queries:** Unlimited
- **Cost:** $0/month (free forever)

### MongoDB Atlas (Free Tier)

- **Free tier:** 512MB storage
- **Current usage:** ~2MB (user data + usage tracking)
- **Capacity:** ~200,000 users with 4 questions/week
- **Cost:** $0/month (free forever)

### Total Monthly Cost

| Scenario | Users | Questions/Month | Cost |
|----------|-------|-----------------|------|
| **Current** | 10 | 160 | ~$0.02 |
| **Small scale** | 100 | 1,600 | ~$0.16 |
| **Medium scale** | 1,000 | 16,000 | ~$1.60 |
| **Large scale** | 10,000 | 160,000 | ~$16.00 |

**Note:** All costs are for OpenAI only. Qdrant and MongoDB are free.

---

## Document Management

### Adding New Documents

**Option 1: Add to Existing Collection**

```bash
# 1. Copy new document to legal sources folder
cp "New_Law.docx" server/legal\ sources/

# 2. Reprocess all documents (detects new file)
cd server
node scripts/process-documents.js

# Expected output:
# ✓ Processed: 1 new document (New_Law.docx)
# ✓ Skipped: 13 unchanged documents
# ✓ Uploaded 37 new vectors to Qdrant (total: 583)
```

**Option 2: Replace Existing Document (Law Changed)**

```bash
# 1. Replace file with same name
cp "Updated_Закон_за_работни_односи.docx" "server/legal sources/Закон за работни односи.docx"

# 2. Clear tracking to force reprocessing
node -e "
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env.development' });
(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  await db.collection('chatbot_documents').deleteMany({ fileName: 'Закон за работни односи.docx' });
  console.log('Cleared tracking for updated document');
  await client.close();
})();
"

# 3. Reprocess
node scripts/process-documents.js

# Expected output:
# ✓ Processed: 1 updated document
# 🗑️ Cleared old vectors from Qdrant
# ✓ Created fresh collection
# ✓ Uploaded 546 vectors (replaced all)
```

### Removing Documents

```bash
# 1. Delete file from legal sources
rm "server/legal sources/Old_Law.docx"

# 2. Reprocess (will detect missing file)
node scripts/process-documents.js

# Note: Currently recreates entire collection.
# Future: Granular delete by document name
```

### Checking What's Indexed

```bash
# Query Qdrant Cloud dashboard
# OR use Qdrant API:
curl -X GET "https://your-qdrant-url:6333/collections/nexa_legal_docs" \
  -H "api-key: your-api-key"

# Response:
{
  "result": {
    "points_count": 546,
    "vectors_count": 546,
    "indexed_vectors_count": 546
  }
}
```

---

## Deployment

### Local Development

```bash
# 1. Install dependencies
cd server && npm install
cd client && npm install

# 2. Configure environment
cp server/.env.example server/.env.development
# Add OpenAI, Qdrant, MongoDB credentials

# 3. Process documents (one-time setup)
cd server
node scripts/process-documents.js

# 4. Start servers
npm run dev              # Backend (port 5002)
cd ../client && npm start  # Frontend (port 3000)
```

### Production Deployment

**Backend (Render/Railway):**

```bash
# 1. Set environment variables in Render dashboard:
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
CHATBOT_MAX_PROMPTS_PER_WEEK=4
CHATBOT_TEMPERATURE=0.2
QDRANT_URL=...
QDRANT_API_KEY=...
QDRANT_COLLECTION_NAME=nexa_legal_docs
MONGODB_URI=...
NODE_ENV=production

# 2. Deploy code (auto-deploy from GitHub)
git push origin main

# 3. One-time: Process documents on server
# SSH into server OR add to build command:
node scripts/process-documents.js

# 4. Server starts automatically
npm start
```

**Frontend (Vercel):**

```bash
# 1. Connect GitHub repo to Vercel
# 2. Configure build settings:
Build Command: npm run build
Output Directory: build
Install Command: npm install

# 3. Deploy automatically on git push
```

### Important Deployment Notes

- **Qdrant vectors persist** - No need to reprocess on every deploy
- **MongoDB tracks processed docs** - Incremental updates work
- **Environment variables** must match between local and production
- **First deploy:** Run `process-documents.js` once manually
- **Updates:** Only reprocess when documents change

---

## Troubleshooting

### Issue: "Vector store not initialized"

**Symptoms:**
```
⚠️ Vector store not initialized. Using placeholder context.
```

**Cause:** Qdrant collection doesn't exist or is empty

**Fix:**
```bash
cd server
node scripts/process-documents.js
# Restart server
```

### Issue: "Ја достигнавте вашата неделна граница"

**Symptoms:** User can't ask questions even though week has passed

**Cause:** Week calculation uses Monday 00:00:00 as reset point

**Fix:**
```javascript
// Check current week start
const now = new Date();
const dayOfWeek = now.getDay(); // 0 = Sunday
const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
const weekStart = new Date(now);
weekStart.setDate(now.getDate() - daysToMonday);
weekStart.setHours(0, 0, 0, 0);
console.log('Week starts:', weekStart);

// Manually reset user if needed
db.chatbot_usage.deleteMany({ userId: "user_id_here" });
```

### Issue: Slow responses (>5 seconds)

**Symptoms:** Users complain about long wait times

**Possible Causes:**
1. **Too many chunks** → Reduce `limit: 5` in Qdrant search to `limit: 3`
2. **OpenAI rate limits** → Check OpenAI dashboard for throttling
3. **Qdrant timeout** → Check Qdrant Cloud status
4. **Large documents** → Reduce chunk size from 1000 to 500 chars

**Debug:**
```javascript
// Add timing logs in ChatBotService.js
console.time('embedding');
const questionEmbedding = await this.embeddings.embedQuery(question);
console.timeEnd('embedding');

console.time('qdrant_search');
const searchResult = await this.qdrantClient.search(...);
console.timeEnd('qdrant_search');

console.time('gpt_response');
const response = await chain.invoke(...);
console.timeEnd('gpt_response');
```

### Issue: PDF processing fails

**Symptoms:**
```
❌ Error processing document.pdf: pdf is not a function
```

**Cause:** `pdf-parse` library issue (known bug)

**Current workaround:** Convert PDFs to DOCX using:
- https://pdf2docx.com/
- Adobe Acrobat
- Microsoft Word

**Future fix:** Switch to different PDF library (e.g., `@llama-index/readers`)

### Issue: Macedonian text appears as �����

**Symptoms:** Cyrillic characters corrupted in responses

**Cause:** Encoding issue with document processing

**Fix:**
1. Ensure documents are saved in **UTF-8**
2. Check `mammoth` options:
```javascript
const result = await mammoth.extractRawText({
  path: filePath,
  encoding: 'utf-8'  // Explicitly set UTF-8
});
```

---

## Summary

### What You Have Now

✅ Production-ready RAG chatbot
✅ 546 legal document chunks indexed in Qdrant
✅ Macedonian language support
✅ Weekly usage limits (4 questions/user)
✅ Source citations
✅ Cost: ~$0.0001 per question
✅ Free infrastructure (Qdrant + MongoDB)
✅ Scalable to 500+ documents

### Key Files

```
server/
├── chatbot/
│   └── ChatBotService.js          # Core RAG logic
├── routes/
│   └── chatbot.js                 # API endpoints
├── scripts/
│   └── process-documents.js       # Document → Vectors
└── legal sources/                 # Source documents (PDFs/DOCX)

client/
└── src/
    └── pages/terminal/
        └── AIChat.jsx             # Chat interface
```

### Next Steps (Future Enhancements)

1. **Conversation History** - Store past Q&A in MongoDB
2. **PDF Support** - Fix pdf-parse or switch library
3. **Granular Updates** - Update single document without reprocessing all
4. **Feedback Loop** - "Was this helpful?" ratings
5. **Advanced Search** - Filter by document type, date, etc.
6. **Streaming Responses** - Real-time answer generation (like ChatGPT)

---

**Documentation maintained by:** Claude Code
**Questions?** Check server logs or contact: terminalnexa@gmail.com
