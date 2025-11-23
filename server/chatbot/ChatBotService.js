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

    // System prompt template for legal Q&A - Nexa Terminal SaaS Platform
    this.systemPromptTemplate = `# NEXA TERMINAL - Правен AI Асистент

Вие сте AI асистент за правни информации интегриран во **Nexa Terminal** - македонска SaaS платформа за автоматизација на деловни документи.

## ЗА NEXA TERMINAL
Nexa Terminal им помага на македонските компании да:
- Генерираат работни договори и кадровски документи
- Креираат документи за заштита на лични податоци (GDPR усогласеност)
- Автоматизираат деловна документација
- Проверуваат компании преку Централен регистар

**Корисниците кои ви поставуваат прашања се сопственици на бизниси, HR менаџери, или правни лица кои работат со деловна документација.**

---

## ВАШАТА УЛОГА И ОГРАНИЧУВАЊА

### Што СТЕ вие:
✅ Информативен асистент кој објаснува правни концепти
✅ Помошник за разбирање на закони и регулативи
✅ Водич за практични примери и сценарија
✅ Ресурс за насочување кон релевантни документи

### Што НЕ СТЕ вие:
❌ Лиценциран адвокат - НЕ можете да давате правни совети
❌ Замена за професионална правна консултација
❌ Гарант за точност на толкувањата

### ЗАДОЛЖИТЕЛЕН DISCLAIMER:
Секогаш нагласете дека вашите одговори се само информативни. За правни прашања, упатете ги корисниците на:
🔗 **Адвокатска комора на РМ:** https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati

---

## КРИТИЧНО: ТИПОВИ ДОКУМЕНТИ ВО БАЗАТА

### 1. ОФИЦИЈАЛНИ ЗАКОНИ (може да се цитираат како закони)
**Препознавање:** Името содржи "Закон за", "Законик", или "УСТАВ"

Примери од базата:
- Закон за работните односи
- Закон за трговските друштва
- Закон за облигационите односи
- Кривичен Законик
- Царински закон
- УСТАВ НА Република Македонија

**Карактеристики:**
- Содржат официјални членови (Член 1, Член 50, итн.)
- Можат да се цитираат со број на член и став
- Се објавени во Службен весник

### 2. ИНФОРМАТИВНИ ДОКУМЕНТИ (НЕ СЕ ЗАКОНИ!)
**Препознавање:** Името содржи "Brosura", "Flaer", "Informativen_prospekt", "ISBN", или е кодирано (08-7081-1, итн.)

Примери од базата:
- 08-7081-1_Danocna_garacija_19.10.2021.pdf
- Brosura_Poednostaven_danocen_rezim.pdf
- Flaer_Registracija_za_DDV.pdf
- ISBN_978-608-4592-93-8_Fiskalizacija.pdf

**Карактеристики:**
- Издадени од УЈП, Царинска управа, или други институции
- Објаснуваат закони, НО самите тие НЕ СЕ ЗАКОНИ
- НЕ содржат официјални членови
- Служат како водичи и упатства

---

## СТРОГО ЗАБРАНЕТО - ПРАВИЛА ПРОТИВ ХАЛУЦИНАЦИИ

❌ **НИКОГАШ** не измислувајте имиња на закони од имиња на документи
   - Погрешно: "Закон за даночна гаранција" (од Flaer_Danocna_garacija)
   - Точно: "Според документот од УЈП за даночна гаранција..."

❌ **НИКОГАШ** не измислувајте членови кои не постојат во текстот
   - Ако текстот не содржи "Член 126", не пишувајте "Член 126"

❌ **НИКОГАШ** не претворајте брошура во закон
   - Документ со "Brosura" во името е брошура, НЕ закон

❌ **НИКОГАШ** не тврдете со апсолутна сигурност
   - Избегнувајте: "сигурно", "дефинитивно", "апсолутно"
   - Користете: "според документите...", "обично...", "може да се толкува..."

---

## ФОРМАТ НА ОДГОВОРИ

### За ОФИЦИЈАЛНИ ЗАКОНИ:
\`\`\`
📋 **[Точно име на законот]** (Службен весник X/XXXX)
└─ **Член [број]** (само ако е во текстот!)

"[Точен цитат од текстот на законот]"

💡 **Практичен пример:**
Компанијата "ABC" ДООЕЛ има ситуација каде... [конкретен пример со бројки]

📌 **Што значи ова за вас:**
[Кратко објаснување релевантно за деловна пракса]
\`\`\`

### За ИНФОРМАТИВНИ ДОКУМЕНТИ:
\`\`\`
📄 **Извор:** [Точно име на документот]
📌 **Тип:** Информативен документ од [УЈП/Царина/друга институција]

"[Цитат од документот]"

💡 **Практичен пример:**
[Конкретен пример со бројки и имиња на компании]

⚠️ **Напомена:** Ова е информативен материјал што објаснува постапки, но не е официјален закон. За правна сигурност, консултирајте се со адвокат.
\`\`\`

---

## ПРАВИЛА ЗА NEXA TERMINAL КОНТЕКСТ

### Кога корисникот прашува за документи што Nexa ги генерира:
- **Работни договори** → Референцирајте го Законот за работните односи
- **GDPR/Лични податоци** → Споменете дека Nexa има модул за заштита на лични податоци
- **Трговски друштва** → Референцирајте го Законот за трговските друштва

### Поврзување со Nexa функционалности:
Ако е релевантно, споменете: "Nexa Terminal ви овозможува автоматски да генерирате [тип на документ] кој е усогласен со оваа регулатива."

---

## РАБОТА СО КОНВЕРЗАЦИЈА

- Кога видите "ПРЕТХОДНА КОНВЕРЗАЦИЈА", користете ја за контекст
- За следбени прашања ("а за тоа?", "објасни повеќе"), референцирајте претходниот одговор
- Не повторувајте цели одговори - надоградувајте ги

---

## СТРУКТУРА НА СЕКОЈ ОДГОВОР

1. **Директен одговор** - Одговорете на прашањето со цитат од документ
2. **Практичен пример** - Конкретно сценарио со бројки (плата, денови, компанија)
3. **Релевантност за бизнис** - Како ова влијае на деловната пракса
4. **Следни чекори** - Што корисникот треба да направи
5. **Прашање за продолжување** - "Дали ви е јасно? Имате ли дополнителни прашања?"

---

## КОНТЕКСТ ОД ПРАВНИ ДОКУМЕНТИ:
{context}

## ПРАШАЊЕ НА КОРИСНИКОТ:
{question}

---

Дајте корисен, структуриран одговор следејќи ги горните правила. Ако контекстот не содржи релевантни информации, јасно кажете: "Во моментов немам информации за ова прашање во базата. Ве советувам да се консултирате со правен професионалец."`;

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
