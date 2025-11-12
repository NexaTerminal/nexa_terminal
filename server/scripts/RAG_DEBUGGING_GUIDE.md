# RAG Chatbot Debugging Guide

## Problem Overview

You're seeing sources displayed ("📚 Извори:") at the bottom of chatbot responses, but the answers don't match what you know is in the source documents. This could be caused by several issues in the RAG (Retrieval-Augmented Generation) pipeline.

## Diagnostic Tools Available

I've created three diagnostic tools to help you identify and fix the issue:

### 1. Quick Validation (5 seconds)
**Purpose**: Check if your API key and embeddings are working correctly.

```bash
cd /Users/martinboshkoski/Desktop/nexa\ temrinal\ \(github\ clone\)/nexa.v1
node server/scripts/validate-embeddings.js
```

**What it checks**:
- ✅ OpenAI API key validity
- ✅ Embedding generation
- ✅ Qdrant connection
- ✅ Vector dimension compatibility
- ✅ Basic search functionality

**Expected output**: "ALL CHECKS PASSED" in green text

---

### 2. Full Diagnostic (2-3 minutes)
**Purpose**: Deep analysis of the entire RAG retrieval pipeline.

```bash
node server/scripts/test-rag-retrieval.js
```

**What it does**:
1. Verifies all environment variables
2. Tests Qdrant connection and collection status
3. Tests OpenAI embeddings API
4. Checks embedding consistency
5. Performs sample searches with Macedonian legal queries
6. Shows retrieved document content and confidence scores
7. Offers interactive mode to test your own queries

**Use this when**: You need to see exactly what documents are being retrieved for specific questions.

---

### 3. Live Server Debugging (Real-time)
**Purpose**: See detailed logs while users interact with the chatbot.

The enhanced `ChatBotService.js` now includes extensive logging:

```bash
# Start your server in development mode
cd /Users/martinboshkoski/Desktop/nexa\ temrinal\ \(github\ clone\)/nexa.v1/server
npm run dev
```

When users ask questions, you'll see in the console:
- 🔍 Query being processed
- 📊 Embedding generation time
- 🔎 Qdrant search results
- 📚 Retrieved documents with confidence scores
- ⚠️ Warnings for low-confidence matches
- 📝 Context being sent to the LLM
- 💬 LLM response time and preview

---

## Common Issues and Solutions

### Issue 1: API Key Rotation Broke Embeddings

**Symptoms**:
- Low confidence scores (<40%) on all queries
- No relevant documents found
- Sources shown but answers are generic

**Diagnosis**:
```bash
node server/scripts/validate-embeddings.js
```

Look for: "DIMENSION MISMATCH" or "Low confidence scores"

**Solution**:
OpenAI's embedding models are deterministic, so rotating API keys SHOULD NOT affect embeddings. However, if you changed the **embedding model** (e.g., from `text-embedding-ada-002` to `text-embedding-3-small`), you must re-process:

```bash
# Check your current model
grep OPENAI_EMBEDDING_MODEL server/.env

# If it's different from when you processed documents, re-process:
node server/scripts/process-documents.js
```

**Time**: ~2-5 minutes for 500 documents
**Cost**: ~$0.50 for 500 documents (one-time)

---

### Issue 2: LLM Not Using Retrieved Context

**Symptoms**:
- Sources are displayed correctly
- Confidence scores are high (>70%)
- But answers don't reference the source material

**Diagnosis**:
Look at server logs when a question is asked. Check the "[RAG DEBUG] Context being sent to LLM" section.

**Solution A - Strengthen Prompt Template**:

Edit `/Users/martinboshkoski/Desktop/nexa temrinal (github clone)/nexa.v1/server/chatbot/ChatBotService.js` line 53-78:

Change the system prompt to be MORE strict:

```javascript
this.systemPromptTemplate = `Вие сте помошен асистент за правни информации за Nexa Terminal, македонска платформа за автоматизација на деловни документи.

ВАЖНИ ОДГОВОРНОСТИ:
- Вие НЕ сте лиценциран адвокат и НЕ можете да давате правни совети
- Вашите одговори МОРААТ да се базираат ИСКЛУЧИВО на обезбедениот контекст подолу
- АКО контекстот не содржи информации за прашањето, одговорете: "Не можам да најдам информација за ова во достапните документи."
- НИКОГАШ не измислувајте информации - само користете го контекстот

Контекст од правни документи:
{context}

Прашање на корисникот: {question}

Одговорете САМО врз основа на горниот контекст. Цитирајте ги изворите и користете ги точните формулации од документите.`;
```

**Solution B - Reduce Temperature**:

In your `.env` file:

```bash
# Lower temperature = more factual, less creative
CHATBOT_TEMPERATURE=0.1  # Was: 0.2
```

**Solution C - Try GPT-4 (more accurate but slower/pricier)**:

```bash
OPENAI_MODEL=gpt-4-turbo-preview  # Was: gpt-4o-mini
```

**Cost comparison**:
- gpt-4o-mini: $0.15/1M input tokens, $0.60/1M output tokens
- gpt-4-turbo: $10/1M input tokens, $30/1M output tokens

---

### Issue 3: Wrong Documents Retrieved

**Symptoms**:
- Sources shown are not related to the question
- Low confidence scores (<50%)
- Wrong document names displayed

**Diagnosis**:
```bash
node server/scripts/test-rag-retrieval.js
```

Test with a question where you KNOW which document should be retrieved.

**Solution A - Documents Not Processed**:

Check if your legal documents are in the correct folder:

```bash
ls -la "/Users/martinboshkoski/Desktop/nexa temrinal (github clone)/nexa.v1/server/legal sources/"
```

Expected: `.pdf` and `.docx` files

If files are there but not processed:

```bash
node server/scripts/process-documents.js
```

**Solution B - Increase Retrieved Chunks**:

In `ChatBotService.js` line 293, increase the limit:

```javascript
const searchResult = await this.qdrantClient.search(this.collectionName, {
  vector: questionEmbedding,
  limit: 10, // Was: 5 - Get more documents
  with_payload: true,
  score_threshold: 0.25, // Was: 0.3 - Lower threshold
});
```

**Solution C - Adjust Chunking Strategy**:

If documents are very long and answers span multiple sections, in `process-documents.js` line 27-28:

```javascript
const CHUNK_SIZE = 1500;  // Was: 1000
const CHUNK_OVERLAP = 300; // Was: 200
```

Then re-process: `node server/scripts/process-documents.js`

---

### Issue 4: Qdrant Connection Issues

**Symptoms**:
- "Vector store not initialized" errors
- No sources shown at all
- Server logs show Qdrant connection failures

**Diagnosis**:
```bash
node server/scripts/validate-embeddings.js
```

Look for: "Qdrant connection failed" or "Collection not found"

**Solution**:

Check your Qdrant credentials in `.env`:

```bash
grep QDRANT server/.env
```

Should show:
```
QDRANT_URL=https://...
QDRANT_API_KEY=eyJ...
QDRANT_COLLECTION_NAME=nexa_legal_docs
```

Test connection manually:

```bash
curl -X GET "https://YOUR_QDRANT_URL:6333/collections/nexa_legal_docs" \
  -H "api-key: YOUR_QDRANT_API_KEY"
```

If collection doesn't exist:

```bash
node server/scripts/process-documents.js
```

---

## Step-by-Step Debugging Workflow

### Step 1: Quick Health Check (30 seconds)

```bash
# Check if Qdrant has vectors
node server/scripts/validate-embeddings.js
```

✅ **If PASSED**: Go to Step 2
❌ **If FAILED**: Follow the error message (likely need to re-process documents)

---

### Step 2: Test Retrieval Quality (2 minutes)

```bash
node server/scripts/test-rag-retrieval.js
```

When prompted, test with a question you KNOW the answer to from your documents.

**Example**: If you have a document about "Закон за работни односи", ask:
```
Што е работен договор?
```

**Check the output**:
- Are the right documents retrieved?
- Are confidence scores high (>60%)?
- Does the preview text contain relevant information?

✅ **If YES**: The retrieval is working. Go to Step 3.
❌ **If NO**: The problem is in retrieval. Solutions:
   - Re-process documents
   - Adjust chunk size/overlap
   - Increase number of retrieved chunks

---

### Step 3: Check LLM Context Usage (Live test)

```bash
# Start server
cd server && npm run dev
```

In another terminal, test the chatbot via the frontend or API.

**Watch the server logs** for:

```
📝 [RAG DEBUG] Context being sent to LLM (XXX characters):
──────────────────────────────────────────────────────────────────────
[Source 1] DocumentName.pdf:
<actual document content>
──────────────────────────────────────────────────────────────────────
```

**Then check**:
```
📤 [RAG DEBUG] Response preview: "..."
```

**Does the response use information from the context?**

✅ **If YES**: System is working correctly!
❌ **If NO**: The LLM is ignoring context. Solutions:
   - Strengthen system prompt (see Issue 2, Solution A)
   - Lower temperature to 0.1
   - Try GPT-4 instead of gpt-4o-mini

---

### Step 4: Interactive Testing

```bash
node server/scripts/test-rag-retrieval.js
```

When it asks "Would you like to test more queries interactively?", answer `y`.

Test multiple questions and observe:
- Which documents are retrieved
- Confidence scores
- Content previews

This helps you understand what the RAG system "sees" for each query.

---

## Environment Variables Reference

Critical settings in `server/.env`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...           # Your API key (rotated recently?)
OPENAI_MODEL=gpt-4o-mini             # LLM model
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # MUST match what was used to process docs
CHATBOT_TEMPERATURE=0.2              # Lower = more factual (try 0.1)

# Qdrant Configuration
QDRANT_URL=https://...               # Vector database URL
QDRANT_API_KEY=eyJ...                # Qdrant API key
QDRANT_COLLECTION_NAME=nexa_legal_docs  # Collection name

# Chatbot Settings
CHATBOT_MAX_PROMPTS_PER_WEEK=4       # Usage limit per user
```

---

## Performance Metrics

### Expected Response Times:
- Embedding generation: 200-500ms
- Qdrant search: 50-200ms
- LLM response: 1000-3000ms
- **Total**: 1.5-4 seconds per query

### Expected Confidence Scores:
- Excellent: >0.75 (75%)
- Good: 0.60-0.75 (60-75%)
- Fair: 0.45-0.60 (45-60%)
- Poor: <0.45 (<45%)

If you consistently see scores <0.50, there's a problem with retrieval.

---

## Cost Monitoring

### After API Key Rotation:
Your embeddings storage in Qdrant is **not affected** by API key changes.
You only pay for:
1. **New queries** (embedding generation): $0.02/1M tokens
2. **LLM responses**: $0.15/1M input + $0.60/1M output (gpt-4o-mini)

### When to Re-Process:
You ONLY need to re-process documents if:
- ❌ You changed `OPENAI_EMBEDDING_MODEL` in .env
- ❌ You added/modified documents in `legal sources/` folder
- ❌ Validation script shows "DIMENSION MISMATCH"

You DO NOT need to re-process if:
- ✅ You only rotated the OpenAI API key (same model)
- ✅ Validation script shows "ALL CHECKS PASSED"

---

## Next Steps

1. **Run quick validation** (30 sec):
   ```bash
   node server/scripts/validate-embeddings.js
   ```

2. **If it passes**, run full diagnostics (2 min):
   ```bash
   node server/scripts/test-rag-retrieval.js
   ```

3. **If retrieval looks good**, check live server logs while testing the chatbot

4. **Based on findings**, apply the appropriate solution from the "Common Issues" section above

---

## Getting Help

If issues persist after trying these solutions:

1. **Capture diagnostic output**:
   ```bash
   node server/scripts/test-rag-retrieval.js > rag-diagnostics.txt 2>&1
   ```

2. **Capture server logs** while testing a question:
   ```bash
   # In server directory
   npm run dev > server-logs.txt 2>&1
   ```

3. **Share**:
   - `rag-diagnostics.txt`
   - `server-logs.txt`
   - The specific question that's failing
   - What answer you expected vs. what you got

---

## File Locations

- ChatBot Service: `/Users/martinboshkoski/Desktop/nexa temrinal (github clone)/nexa.v1/server/chatbot/ChatBotService.js`
- Document Processing: `/Users/martinboshkoski/Desktop/nexa temrinal (github clone)/nexa.v1/server/scripts/process-documents.js`
- Legal Documents: `/Users/martinboshkoski/Desktop/nexa temrinal (github clone)/nexa.v1/server/legal sources/`
- Environment Config: `/Users/martinboshkoski/Desktop/nexa temrinal (github clone)/nexa.v1/server/.env`
- Diagnostic Tools: `/Users/martinboshkoski/Desktop/nexa temrinal (github clone)/nexa.v1/server/scripts/`

---

**Good luck! The diagnostic tools will help you pinpoint exactly where the issue is.**
