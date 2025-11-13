const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { QdrantClient } = require('@qdrant/js-client-rest');

/**
 * ChatBotService - Core RAG chatbot service for legal document Q&A
 *
 * This service handles:
 * - Question answering using RAG (Retrieval-Augmented Generation)
 * - Document context retrieval from vector store
 * - OpenAI integration for chat completions
 * - Legal disclaimers and safety guardrails
 * - Weekly usage limits (4 questions per user per week)
 */
class ChatBotService {
  constructor() {
    // Initialize OpenAI chat model
    this.chatModel = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize OpenAI embeddings (for query embedding)
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
    });

    // Initialize Qdrant client
    this.qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });

    this.collectionName = process.env.QDRANT_COLLECTION_NAME || 'nexa_legal_docs';
    this.vectorStore = null; // Will be set to true when Qdrant is verified

    // MongoDB database reference (will be set via setDatabase method - for usage tracking only)
    this.db = null;

    // Conversation service reference (for conversation history)
    this.conversationService = null;

    // Weekly limit for questions per user
    this.weeklyLimit = parseInt(process.env.CHATBOT_MAX_PROMPTS_PER_WEEK) || 4;

    // Verify Qdrant connection on initialization
    this.verifyQdrantConnection().catch(err => {
      console.error('⚠️  Failed to connect to Qdrant:', err.message);
    });

    // System prompt template for legal Q&A
    this.systemPromptTemplate = `Вие сте помошен асистент за правни информации за Nexa Terminal, македонска платформа за автоматизација на деловни документи.

ВАЖНИ ОДГОВОРНОСТИ:
- Вие НЕ сте лиценциран адвокат и НЕ можете да давате правни совети. Секогаш упатете го корисникот да најде квалификуван правен професионалец на следната веб-страница: https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati
- Вашите одговори се само за информативни цели
- Корисниците треба да се консултираат со квалификуван правен професионалец за специфични правни прашања
- Секогаш наведувајте ги изворните документи кога давате информации

Вашата улога е да:
1. Одговарате на прашања за правни документи и постапки врз основа на обезбедениот контекст
2. Цитирајте специфични документи, членови и ставови кога е применливо
3. Давајте фактички, добро поткрепени информации
4. Охрабрувајте ги корисниците да бараат професионална правна помош за важни одлуки
5. ЗАПОМНУВАЈТЕ ја претходната конверзација и користете ја за следење на прашања

РАБОТА СО КОНВЕРЗАЦИЈА:
- Кога видите "ПРЕТХОДНА КОНВЕРЗАЦИЈА" во контекстот, користете ја за разбирање на следбени прашања
- Ако корисникот кажува "а за тоа?", "и тој случај?", "можеш ли да објасниш повеќе?", однесувајте се на претходните прашања и одговори
- Користете ја конверзацијата за да дадете релевантни следбени одговори
- Не повторувајте целиот претходен одговор, само референцирајте го кога е потребно

ЗАДОЛЖИТЕЛЕН ФОРМАТ ЗА ЦИТИРАЊЕ:
Кога цитирате од правните документи, МОРА да следите го овој формат:

📋 **[Име на законот]** ([Службен весник број])
└─ **[Број на членот]**

   "[Целосен точен текст на членот - копирајте целиот текст од изворот без промени]"

Пример:
📋 **Закон за данок на добивка** (Службен весник 199/2023)
└─ **[Број на членот]**

   "[Целосен точен текст на членот...]"

ЗАДОЛЖИТЕЛНО: ХИПОТЕТИЧКИ ПРИМЕР
Откако ќе го цитирате членот, СЕКОГАШ објаснете го со практичен, хипотетички пример:

💡 **Практичен пример:**
   [Наведете конкретна ситуација од реалниот живот која го илустрира применувањето на членот.
   Користете конкретни бројки, имиња на компании (пр. "Компанија ABC"), и јасни сценарија.]

Пример на целосен одговор:
📋 **Закон за данок на добивка** (Службен весник 199/2023)
└─ **Член 15**

   "Даночната основа на даночниот обврзник се утврдува според разликата помеѓу приходите и расходите остварени во даночниот период, утврдена согласно со одредбите од овој закон."

💡 **Практичен пример:**
   Компанијата "ABC ДООЕЛ" во 2024 година оствари приходи од продажба на стоки во износ од 5,000,000 денари. Истовремено, имала расходи за набавка на стока (3,000,000 денари), плати (800,000 денари), и режиски трошоци (200,000 денари). Според Член 15, даночната основа се пресметува како разлика: 5,000,000 - (3,000,000 + 800,000 + 200,000) = 1,000,000 денари. Врз оваа даночна основа од 1,000,000 денари потоа се применува даночната стапка за данок на добивка.

Но секогаш прашај дали примерот и разбирањето е добро од аспект на законот, примерот во однос на ситуацијата за која корисникот има дилема. 

ВАЖНИ ПРАВИЛА ЗА КОМУНИКАЦИЈА:
- СЕКОГАШ одговарајте на македонски јазик
- ЗАДОЛЖИТЕЛНО цитирајте го целосниот точен текст од членот (не парафразирајте)
- ЗАДОЛЖИТЕЛНО обезбедете хипотетички практичен пример за секој цитиран член
- Практичните примери МОРА да содржат конкретни бројки и реални сценарија
- СЕКОГАШ наведете го точниот број на членот и името на законот
- Ако во името на документот има број на службен весник, вклучете го
- НИКОГАШ не користете фрази како "сигурно", "дефинитивно", "апсолутно" или слични премногу самоуверени изрази
- Користете умерен тон: "според документите...", "може да биде...", "обично..."
- На крајот од секој одговор, прашајте: "Имате ли дополнителни прашања?"

Контекст од правни документи:
{context}

Прашање на корисникот: {question}

Ве молиме дајте корисен, фактички одговор со:
1. Целосни цитати од релевантните членови (точен текст од изворот)
2. Хипотетички практични примери со конкретни бројки за секој член
3. Јасна структура: Цитат → Практичен пример → Објаснување

Ако не сте сигурни или контекстот не содржи релевантни информации, јасно кажете тоа.`;

    this.promptTemplate = PromptTemplate.fromTemplate(this.systemPromptTemplate);
  }

  /**
   * Set database reference (for usage tracking only)
   * @param {Object} database - MongoDB database instance
   */
  async setDatabase(database) {
    this.db = database;
    console.log('✓ Database reference set for ChatBotService');
  }

  /**
   * Set conversation service reference (for conversation history)
   * @param {Object} conversationService - ConversationService instance
   */
  setConversationService(conversationService) {
    this.conversationService = conversationService;
    console.log('✓ ConversationService reference set for ChatBotService');
  }

  /**
   * Verify Qdrant connection and collection existence
   */
  async verifyQdrantConnection() {
    try {
      // Check if collection exists
      const collection = await this.qdrantClient.getCollection(this.collectionName);

      this.vectorStore = true; // Mark as initialized

      console.log(`✅ Qdrant connected: Collection "${this.collectionName}" with ${collection.points_count} vectors`);
    } catch (error) {
      console.warn('⚠️  Qdrant collection not found');
      console.warn('   Run "node scripts/process-documents.js" to process documents');
      this.vectorStore = null;
    }
  }

  /**
   * Check if user has exceeded weekly question limit
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Limit status { allowed: boolean, remaining: number, resetDate: Date }
   */
  async checkWeeklyLimit(userId) {
    if (!this.db) {
      console.warn('⚠️  Database not set, skipping limit check');
      return { allowed: true, remaining: this.weeklyLimit, resetDate: null };
    }

    try {
      const usageCollection = this.db.collection('chatbot_usage');

      // Calculate start of current week (Monday 00:00:00)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      // Calculate next Monday (reset date)
      const nextMonday = new Date(weekStart);
      nextMonday.setDate(weekStart.getDate() + 7);

      // Find usage record for current week
      const usageRecord = await usageCollection.findOne({
        userId: userId,
        weekStart: weekStart,
      });

      const questionsAsked = usageRecord ? usageRecord.questionsAsked : 0;
      const remaining = this.weeklyLimit - questionsAsked;

      return {
        allowed: questionsAsked < this.weeklyLimit,
        remaining: Math.max(0, remaining),
        resetDate: nextMonday,
        questionsAsked: questionsAsked,
      };
    } catch (error) {
      console.error('❌ Error checking weekly limit:', error);
      // On error, allow the request (fail open)
      return { allowed: true, remaining: this.weeklyLimit, resetDate: null };
    }
  }

  /**
   * Increment user's weekly question count
   * @param {string} userId - User ID
   */
  async incrementUsageCount(userId) {
    if (!this.db) {
      console.warn('⚠️  Database not set, skipping usage tracking');
      return;
    }

    try {
      const usageCollection = this.db.collection('chatbot_usage');

      // Calculate start of current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      // Upsert usage record
      await usageCollection.updateOne(
        { userId: userId, weekStart: weekStart },
        {
          $inc: { questionsAsked: 1 },
          $set: { lastAskedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('❌ Error incrementing usage count:', error);
    }
  }

  /**
   * Ask a question and get an AI response with source citations
   * @param {string} question - User's question
   * @param {string} userId - User ID for tracking
   * @param {string} conversationId - Conversation ID (optional, for conversation history)
   * @returns {Promise<Object>} - Response with answer and sources
   */
  async askQuestion(question, userId, conversationId = null) {
    try {
      // Validate inputs
      if (!question || question.trim().length === 0) {
        throw new Error('Question cannot be empty');
      }

      // Check user's weekly prompt limit
      const limitStatus = await this.checkWeeklyLimit(userId);
      if (!limitStatus.allowed) {
        throw new Error(
          `Ја достигнавте вашата неделна граница од ${this.weeklyLimit} прашања. ` +
          `Вашиот лимит ќе се ресетира на ${limitStatus.resetDate.toLocaleDateString('mk-MK')}.`
        );
      }

      // Step 1: Load conversation history if available
      let conversationHistory = '';
      if (this.conversationService && conversationId) {
        try {
          const conversation = await this.conversationService.getConversation(conversationId);
          if (conversation && conversation.messages && conversation.messages.length > 0) {
            conversationHistory = this.formatConversationHistory(conversation.messages);
            console.log(`\n💭 [RAG DEBUG] Loaded ${conversation.messages.length} previous messages from conversation`);
          }
        } catch (error) {
          console.warn('⚠️  Could not load conversation history:', error.message);
        }
      }

      // Step 2: Retrieve relevant documents from vector store
      console.log(`\n🤖 [RAG DEBUG] Processing question for user ${userId}`);
      const relevantDocs = await this.retrieveRelevantDocuments(question);

      // Step 3: Format context from retrieved documents
      const context = this.formatContext(relevantDocs);
      console.log(`\n📝 [RAG DEBUG] Context being sent to LLM (${context.length} characters):`);
      console.log('─'.repeat(70));
      console.log(context.substring(0, 500) + (context.length > 500 ? '...' : ''));
      console.log('─'.repeat(70));

      // Step 4: Create the RAG chain
      const chain = RunnableSequence.from([
        this.promptTemplate,
        this.chatModel,
        new StringOutputParser(),
      ]);

      // Step 5: Build enhanced question with conversation history
      const enhancedQuestion = conversationHistory
        ? `${conversationHistory}\n\nНово прашање: ${question}`
        : question;

      // Step 6: Execute the chain
      console.log('\n💬 [RAG DEBUG] Sending to OpenAI LLM...');
      const llmStartTime = Date.now();
      const response = await chain.invoke({
        context: context,
        question: enhancedQuestion,
      });
      const llmTime = Date.now() - llmStartTime;
      console.log(`✓ [RAG DEBUG] LLM response received in ${llmTime}ms (${response.length} characters)`);
      console.log(`\n📤 [RAG DEBUG] Response preview: "${response.substring(0, 200)}..."`);
      console.log(`\n✅ [RAG DEBUG] Full RAG pipeline completed successfully\n`);

      // Step 5: Track usage (increment question count)
      await this.incrementUsageCount(userId);

      // Step 6: Save conversation messages if conversation service is available
      if (this.conversationService && conversationId) {
        try {
          // Save user message
          await this.conversationService.saveMessage(conversationId, {
            type: 'user',
            content: question,
            timestamp: new Date()
          });

          // Save AI response with sources
          await this.conversationService.saveMessage(conversationId, {
            type: 'ai',
            content: response,
            sources: relevantDocs.map(doc => ({
              documentName: doc.metadata?.documentName || 'Unknown',
              confidence: doc.metadata?.score || 0,
              pageNumber: doc.metadata?.pageNumber || null,
              snippet: doc.pageContent?.substring(0, 200) || ''
            })),
            timestamp: new Date()
          });

          console.log(`✓ [CONVERSATION] Messages saved to conversation ${conversationId}`);
        } catch (convError) {
          console.error('⚠️  Failed to save conversation messages:', convError.message);
          // Continue execution even if saving fails
        }
      }

      // Step 7: Return response with metadata
      const result = {
        answer: response,
        sources: relevantDocs.map(doc => ({
          documentName: doc.metadata?.documentName || 'Unknown',
          confidence: doc.metadata?.score || 0,
          pageNumber: doc.metadata?.pageNumber || null,
          article: doc.metadata?.article || null, // Include article number if available
        })),
        timestamp: new Date(),
        userId: userId,
        remainingQuestions: limitStatus.remaining - 1, // Subtract the one just used
      };

      return result;

    } catch (error) {
      console.error('❌ Error in askQuestion:', error);
      throw new Error(`Failed to process question: ${error.message}`);
    }
  }

  /**
   * Retrieve relevant documents from Qdrant using vector similarity search
   * @param {string} question - User's question
   * @returns {Promise<Array>} - Array of relevant document chunks with similarity scores
   */
  async retrieveRelevantDocuments(question) {
    // If vector store is not initialized, return placeholder
    if (!this.vectorStore) {
      console.warn('⚠️  Vector store not initialized. Using placeholder context.');
      return [{
        pageContent: 'Се случи грешка при обработка на вашето прашање. Ве молиме обидете се повторно.',
        metadata: {
          documentName: 'System Message',
          score: 0,
        }
      }];
    }

    try {
      console.log(`\n🔍 [RAG DEBUG] Starting document retrieval for question: "${question.substring(0, 100)}..."`);

      // Step 1: Create embedding for the user's question
      console.log('📊 [RAG DEBUG] Generating query embedding...');
      const embeddingStartTime = Date.now();
      const questionEmbedding = await this.embeddings.embedQuery(question);
      const embeddingTime = Date.now() - embeddingStartTime;
      console.log(`✓ [RAG DEBUG] Embedding generated in ${embeddingTime}ms (dimensions: ${questionEmbedding.length})`);

      // Step 2: Search Qdrant for similar vectors
      console.log('🔎 [RAG DEBUG] Searching Qdrant vector database...');
      const searchStartTime = Date.now();
      const searchResult = await this.qdrantClient.search(this.collectionName, {
        vector: questionEmbedding,
        limit: 8, // Top 8 most relevant chunks (increased for better context)
        with_payload: true,
        score_threshold: 0.25, // Only return results with similarity > 25% (slightly more permissive)
      });
      const searchTime = Date.now() - searchStartTime;
      console.log(`✓ [RAG DEBUG] Search completed in ${searchTime}ms`);

      // Step 3: Format results
      const topResults = searchResult.map(result => ({
        pageContent: result.payload.pageContent,
        metadata: {
          documentName: result.payload.documentName,
          pageCount: result.payload.pageCount,
          processedAt: result.payload.processedAt,
          score: result.score,
          // Include article information if available
          article: result.payload.article || null,
          chunkType: result.payload.chunkType || 'standard',
        },
      }));

      console.log(`\n📚 [RAG DEBUG] Retrieved ${topResults.length} relevant chunks:`);
      topResults.forEach((result, index) => {
        const scorePercent = (result.metadata.score * 100).toFixed(1);
        const preview = result.pageContent.substring(0, 100).replace(/\n/g, ' ');
        const articleInfo = result.metadata.article ? ` [${result.metadata.article}]` : '';
        console.log(`  [${index + 1}] ${result.metadata.documentName}${articleInfo} - Confidence: ${scorePercent}%`);
        console.log(`      Preview: "${preview}..."`);

        if (result.metadata.score < 0.5) {
          console.log(`      ⚠️ WARNING: Low confidence score - may not be relevant`);
        }
      });

      // Calculate and log average confidence
      if (topResults.length > 0) {
        const avgScore = topResults.reduce((sum, r) => sum + r.metadata.score, 0) / topResults.length;
        console.log(`\n📊 [RAG DEBUG] Average confidence: ${(avgScore * 100).toFixed(1)}%`);

        if (avgScore < 0.5) {
          console.log(`⚠️ [RAG DEBUG] WARNING: Low average confidence! Retrieved documents may not be relevant.`);
          console.log(`   This could explain why answers don't match source documents.`);
        }
      } else {
        console.log(`⚠️ [RAG DEBUG] WARNING: No documents found above confidence threshold (30%)`);
      }

      return topResults;

    } catch (error) {
      console.error('❌ [RAG DEBUG] Error retrieving documents from Qdrant:', error);
      console.error('   Error details:', error.message);
      if (error.stack) {
        console.error('   Stack trace:', error.stack);
      }

      return [{
        pageContent: 'Се случи грешка при обработка на вашето прашање. Ве молиме обидете се повторно.',
        metadata: {
          documentName: 'System Error',
          score: 0,
        }
      }];
    }
  }

  /**
   * Format retrieved documents into context string for the prompt
   * @param {Array} documents - Array of document chunks
   * @returns {string} - Formatted context string
   */
  formatContext(documents) {
    if (documents.length === 0) {
      return 'No relevant documents found.';
    }

    return documents
      .map((doc, index) => {
        const docName = doc.metadata?.documentName || 'Unknown Document';
        const pageNum = doc.metadata?.pageNumber ? ` (Page ${doc.metadata.pageNumber})` : '';
        return `[Source ${index + 1}] ${docName}${pageNum}:\n${doc.pageContent}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Format conversation history for context
   * @param {Array} messages - Array of previous messages
   * @returns {string} - Formatted conversation history
   */
  formatConversationHistory(messages) {
    if (!messages || messages.length === 0) {
      return '';
    }

    // Only include last 6 messages (3 Q&A pairs) to avoid token limits
    const recentMessages = messages.slice(-6);

    const formattedHistory = recentMessages
      .map(msg => {
        if (msg.type === 'user') {
          return `Претходно прашање од корисникот: ${msg.content}`;
        } else if (msg.type === 'ai') {
          return `Мој претходен одговор: ${msg.content}`;
        }
        return '';
      })
      .filter(msg => msg.length > 0)
      .join('\n\n');

    return `ПРЕТХОДНА КОНВЕРЗАЦИЈА (за контекст):\n${formattedHistory}`;
  }

  /**
   * Get chatbot health status
   * @returns {Object} - Service health status
   */
  getHealthStatus() {
    return {
      status: 'operational',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.2,
      vectorStoreInitialized: this.vectorStore !== null,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
module.exports = new ChatBotService();
