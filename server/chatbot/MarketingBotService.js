const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { QdrantClient } = require('@qdrant/js-client-rest');
const StancePreferencesService = require('../services/stancePreferencesService');

/**
 * MarketingBotService - Core RAG chatbot service for marketing Q&A
 *
 * This service handles:
 * - Question answering using RAG (Retrieval-Augmented Generation)
 * - Document context retrieval from marketing vector store
 * - OpenAI integration for chat completions
 * - Marketing expertise and creative responses
 * - Weekly usage limits (4 questions per user per week)
 */
class MarketingBotService {
  constructor() {
    // Initialize OpenAI chat model - higher temperature for creativity.
    // Own env var (NOT the shared OPENAI_MODEL) so the marketing bot stays on
    // the budget model even when the legal bot runs gpt-4o.
    this.chatModel = new ChatOpenAI({
      modelName: process.env.OPENAI_MARKETING_MODEL || 'gpt-4o-mini',
      temperature: 0.7, // Higher temperature for marketing creativity
      maxTokens: parseInt(process.env.MARKETING_MAX_TOKENS) || 3072, // cap, not spend
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Cheap utility model for query condensation (follow-up retrieval).
    this.utilityModel = new ChatOpenAI({
      modelName: process.env.OPENAI_UTILITY_MODEL || 'gpt-4o-mini',
      temperature: 0,
      maxTokens: 200,
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

    // Marketing-specific collection
    this.collectionName = 'nexa_marketing_docs';
    this.vectorStore = null;

    // MongoDB database reference
    this.db = null;

    // Conversation service reference (shared with legal chatbot for unified history)
    this.conversationService = null;

    // Weekly limit for questions per user (separate from legal)
    this.weeklyLimit = 4;

    // Verify Qdrant connection on initialization
    this.verifyQdrantConnection().catch(err => {
      console.error('⚠️  Failed to connect to Qdrant (Marketing):', err.message);
    });

    // System prompt template for Marketing Consultant.
    // {stancePrefix} renders the user's Stance Preferences (or "" if unset).
    this.systemPromptTemplate = `{stancePrefix}# NEXA TERMINAL — Маркетинг Стратег AI

Вие сте сениор маркетинг консултант за македонски мали и средни бизниси, интегриран во Nexa Terminal. Корисниците се сопственици и менаџери — луѓе со малку време и ограничен буџет, на кои им требаат резултати, не теорија.

## ЈАЗИК (АПСОЛУТНО ПРАВИЛО)
СЕКОГАШ одговарајте на МАКЕДОНСКИ (кирилица), без оглед на јазикот на прашањето или на изворите. Стручни термини (reach, engagement, CTR, funnel) може да останат во оригинал.

## ЗЛАТНО ПРАВИЛО: ВРЕДНОСТ ПРВО
Секој одговор МОРА да даде конкретна, применлива содржина — стратегии, примери, чекори. НИКОГАШ не одговарајте само со прашања. Максимум 1-2 прашања за прецизирање, и тоа САМО на крајот, откако сте дале вредност. Корисникот има ограничен број прашања неделно — секој одговор мора да биде максимално корисен.

## КОНСУЛТАНТСКИ ИНСТИНКТИ (вградете ги каде што имаат смисла)
1. **Конкретни бројки, не општости:** фреквенција на објави, буџети во денари/евра, реални benchmark-ови („за МК пазарот, added budget од 5-10 EUR/ден на Facebook е сосема доволен старт"), временски рамки.
2. **Мерливост:** за секоја препорака кажете КАКО се мери успехот (KPI) и кога да се очекува резултат — „по 2 недели споредете reach и профилни посети".
3. **Акциски план:** за стратешки прашања завршете со краток план „Оваа недела / Овој месец" — 3-5 чекори по редослед.
4. **Прилагодено на МК пазарот:** Facebook и Instagram доминираат; TikTok расте кај помladата публика; LinkedIn за B2B; Google My Business е бесплатна победа; локални портали и групи имаат реална тежина. Буџети и очекувања реални за мал пазар — не преведени американски совети.
5. **Едно прашање за прецизирање:** ако клучен податок недостасува (индустрија, буџет, публика), завршете со НАЈВАЖНОТО едно прашање и кажете зошто е важно.

## ИЗВОРИ
Контекстот подолу содржи маркетинг знаење (можеби на англиски). Користете ги увидите од него природно, преведени и прилагодени на МК пазарот — НЕ цитирајте имиња на документи и не спомнувајте „изворите". Кога контекстот не е релевантен, одговорете од вашата општа маркетинг експертиза — слободно и уверено.

## УПАТУВАЊЕ КОН ФУНКЦИИ НА ПЛАТФОРМАТА (само кога директно помага)
Максимум 1 линк по одговор, вграден природно во советот; користете ИСКЛУЧИВО овие URL-а:
- [Маркетинг проверка](/terminal/marketing-screening) — прашалник што открива што недостасува во маркетингот; идеален кога корисникот прашува „од каде да почнам / што ми недостасува / колку сум добар".
- [Маркетинг документи](/terminal/marketing) — генерирање маркетинг материјали и планови.
- [Извештај за маркетинг перформанси](/terminal/marketing/performance-report) — структуриран преглед на резултатите.

## ФОРМАТ
Markdown: **bold** наслови, кратки листи, лесно скенирање. Директно на поента — без „Одлично прашање!". Тон: топол, професионален, акциски.

### ПРИМЕР — стил и длабочина што се очекува:

Прашање: "Сакам повеќе followери на Instagram"

Одговор:
"Еве што реално работи за раст на Instagram на македонскиот пазар:

**Содржина (најголемо влијание):**
- Reels 3-4 пати неделно — алгоритмот им дава 2-3x поголем reach од обични постови
- Carousel постови со едукација/совети — најголем engagement и зачувувања
- 70% едукација и вредност / 20% промоција / 10% зад-сцена

**Engagement (потценето, бесплатно):**
- Одговорете на секој коментар во првите 30 минути
- 15 минути дневно коментирајте кај профили од вашата ниша и кај локални страници
- Stories со анкети и прашања — секој ден по едно

**Мерење:** следете reach, профилни посети и зачувувања (не само followers) — по 3 недели споредете; ако Reels не носат 2x reach, сменете формат на кука во првите 2 секунди.

**Оваа недела:** 1) снимете 2 кратки Reels на најчестото прашање од клиентите; 2) поставете дневен потсетник за 15 мин engagement; 3) наместете Story-анкета за да видите што публиката сака.

За поконкретна стратегија — во која индустрија сте и кому му продавате (B2C или B2B)? Од тоа зависи дали Instagram воопшто е вашиот главен канал."

## КОНВЕРЗАЦИЈА
Ако има „ПРЕТХОДНА КОНВЕРЗАЦИЈА", ова е следбено прашање — задржете ја темата и контекстот за бизнисот на корисникот; не повторувајте веќе дадени совети, надградете ги. Ако клиентот одговорил на ваши прашања → детална персонализирана стратегија, без нови прашања.

## КОНТЕКСТ ОД МАРКЕТИНГ ДОКУМЕНТИ:
{context}

## ПРЕТХОДНА КОНВЕРЗАЦИЈА И НОВО ПРАШАЊЕ:
{question}`;

    this.promptTemplate = PromptTemplate.fromTemplate(this.systemPromptTemplate);
  }

  /**
   * Set database reference
   */
  async setDatabase(database) {
    this.db = database;
    console.log('✓ Database reference set for MarketingBotService');
  }

  /**
   * Set conversation service reference (shared for unified history)
   */
  setConversationService(conversationService) {
    this.conversationService = conversationService;
    console.log('✓ ConversationService reference set for MarketingBotService');
  }

  /**
   * Verify Qdrant connection and collection existence
   */
  async verifyQdrantConnection() {
    try {
      const collection = await this.qdrantClient.getCollection(this.collectionName);
      this.vectorStore = true;
      console.log(`✅ Qdrant connected (Marketing): Collection "${this.collectionName}" with ${collection.points_count} vectors`);
    } catch (error) {
      console.warn('⚠️  Qdrant collection not found (Marketing)');
      console.warn('   Run "node scripts/create-marketing-collection.js" to create collection');
      this.vectorStore = null;
    }
  }

  /**
   * Check if user has exceeded weekly question limit (separate from legal)
   */
  async checkWeeklyLimit(userId) {
    if (!this.db) {
      console.warn('⚠️  Database not set, skipping limit check');
      return { allowed: true, remaining: this.weeklyLimit, resetDate: null };
    }

    try {
      const usageCollection = this.db.collection('marketing_chatbot_usage');

      // Calculate start of current week (Monday 00:00:00)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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
      console.error('❌ Error checking weekly limit (Marketing):', error);
      return { allowed: true, remaining: this.weeklyLimit, resetDate: null };
    }
  }

  /**
   * Increment user's weekly question count
   */
  async incrementUsageCount(userId) {
    if (!this.db) {
      console.warn('⚠️  Database not set, skipping usage tracking');
      return;
    }

    try {
      const usageCollection = this.db.collection('marketing_chatbot_usage');

      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

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
      console.error('❌ Error incrementing usage count (Marketing):', error);
    }
  }

  /**
   * Ask a marketing question and get an AI response
   */
  /** Build the Stance Preferences prefix for this user. Returns '' on any miss. */
  async _getStancePrefix(userId) {
    try {
      if (!this.db || !userId) return '';
      const svc = new StancePreferencesService(this.db);
      return await svc.getPrefix(userId);
    } catch (e) {
      console.warn('[marketing-bot] stance prefix lookup failed:', e.message);
      return '';
    }
  }

  /**
   * Condense a follow-up + history into a STANDALONE search query so retrieval
   * knows the topic (e.g. "а колку буџет?" after an Instagram-ads conversation
   * should search for Instagram ad budgets, not two bare words). Fails open.
   */
  async condenseSearchQuery(question, conversationHistory) {
    if (!conversationHistory) return question;
    try {
      const condensePrompt = PromptTemplate.fromTemplate(
        `Претходна конверзација (скратена):
{history}

Ново прашање: {question}

Преформулирај го новото прашање во ЕДНО самостојно прашање што ја содржи темата од конверзацијата (канал/тактика/индустрија), за пребарување во база на маркетинг знаење. Одговори САМО со преформулираното прашање.`
      );
      const chain = RunnableSequence.from([
        condensePrompt,
        this.utilityModel,
        new StringOutputParser(),
      ]);
      const out = (await chain.invoke({
        history: conversationHistory.slice(-3000),
        question,
      })).trim().replace(/^["']|["']$/g, '');
      if (out.length > 5 && out.length < 400) {
        console.log(`🔁 [Marketing RAG] Condensed search query: "${out.substring(0, 100)}"`);
        return out;
      }
      return question;
    } catch (e) {
      console.warn('⚠️ [Marketing RAG] Query condensation failed, using raw question:', e.message);
      return question;
    }
  }

  async askQuestion(question, userId, conversationId = null) {
    try {
      if (!question || question.trim().length === 0) {
        throw new Error('Question cannot be empty');
      }

      // Check user's weekly prompt limit
      const limitStatus = await this.checkWeeklyLimit(userId);
      if (!limitStatus.allowed) {
        throw new Error(
          `Ја достигнавте вашата неделна граница од ${this.weeklyLimit} маркетинг прашања. ` +
          `Вашиот лимит ќе се ресетира на ${limitStatus.resetDate.toLocaleDateString('mk-MK')}.`
        );
      }

      // Load conversation history if available
      let conversationHistory = '';
      if (this.conversationService && conversationId) {
        try {
          const conversation = await this.conversationService.getConversation(conversationId);
          if (conversation && conversation.messages && conversation.messages.length > 0) {
            conversationHistory = this.formatConversationHistory(conversation.messages);
            console.log(`\n💭 [Marketing RAG] Loaded ${conversation.messages.length} previous messages`);
          }
        } catch (error) {
          console.warn('⚠️  Could not load conversation history:', error.message);
        }
      }

      // Retrieve relevant documents from vector store (topic-aware for follow-ups)
      console.log(`\n🎯 [Marketing RAG] Processing question for user ${userId}`);
      const searchQuery = await this.condenseSearchQuery(question, conversationHistory);
      const relevantDocs = await this.retrieveRelevantDocuments(searchQuery);

      // Format context
      const context = this.formatContext(relevantDocs);

      // Create the RAG chain
      const chain = RunnableSequence.from([
        this.promptTemplate,
        this.chatModel,
        new StringOutputParser(),
      ]);

      // Build enhanced question with conversation history
      const enhancedQuestion = conversationHistory
        ? `${conversationHistory}\n\nНово прашање: ${question}`
        : question;

      // Execute the chain. Stance preferences injected as a structured prefix.
      const stancePrefix = await this._getStancePrefix(userId);
      console.log('\n💬 [Marketing RAG] Sending to OpenAI LLM...');
      const response = await chain.invoke({
        stancePrefix,
        context: context,
        question: enhancedQuestion,
      });

      // Track usage
      await this.incrementUsageCount(userId);

      // Save conversation messages if conversation service is available
      if (this.conversationService && conversationId) {
        try {
          await this.conversationService.saveMessage(conversationId, {
            type: 'user',
            content: question,
            timestamp: new Date(),
            botType: 'marketing' // Tag as marketing conversation
          });

          await this.conversationService.saveMessage(conversationId, {
            type: 'ai',
            content: response,
            sources: relevantDocs.map(doc => ({
              documentName: doc.metadata?.documentName || 'Marketing Doc',
              confidence: doc.metadata?.score || 0,
              snippet: doc.pageContent?.substring(0, 200) || ''
            })),
            timestamp: new Date(),
            botType: 'marketing'
          });
        } catch (convError) {
          console.error('⚠️  Failed to save conversation messages:', convError.message);
        }
      }

      return {
        answer: response,
        sources: relevantDocs.map(doc => ({
          documentName: doc.metadata?.documentName || 'Marketing Doc',
          confidence: doc.metadata?.score || 0,
        })),
        timestamp: new Date(),
        userId: userId,
        remainingQuestions: limitStatus.remaining - 1,
      };

    } catch (error) {
      console.error('❌ Error in askQuestion (Marketing):', error);
      throw new Error(`Failed to process marketing question: ${error.message}`);
    }
  }

  /**
   * Retrieve relevant documents from Qdrant
   */
  async retrieveRelevantDocuments(question) {
    if (!this.vectorStore) {
      console.warn('⚠️  Marketing vector store not initialized.');
      return [{
        pageContent: 'Маркетинг базата на знаење не е достапна во моментов.',
        metadata: { documentName: 'System Message', score: 0 }
      }];
    }

    try {
      // Create embedding for the question
      const questionEmbedding = await this.embeddings.embedQuery(question);

      // Search Qdrant
      const searchResult = await this.qdrantClient.search(this.collectionName, {
        vector: questionEmbedding,
        limit: 6, // Top 6 most relevant chunks
        with_payload: true,
        score_threshold: 0.25,
      });

      // Defensive payload mapping: the marketing collection was migrated from
      // a pipeline that stores text under `content` (not pageContent/text) —
      // the old mapping resolved to undefined for EVERY chunk, so the bot ran
      // with a dead RAG layer (literal "undefined" in the prompt context).
      const topResults = searchResult.map(result => ({
        pageContent: result.payload.pageContent || result.payload.content || result.payload.text || '',
        metadata: {
          documentName: result.payload.metadata?.documentName || result.payload.documentName || result.payload.filename || 'Marketing Doc',
          score: result.score,
        },
      })).filter(doc => doc.pageContent.length > 0);

      console.log(`📚 [Marketing RAG] Retrieved ${topResults.length} relevant chunks`);
      return topResults;

    } catch (error) {
      console.error('❌ Error retrieving marketing documents:', error);
      return [{
        pageContent: 'Се случи грешка при пребарување на маркетинг базата.',
        metadata: { documentName: 'System Error', score: 0 }
      }];
    }
  }

  /**
   * Format retrieved documents into context string
   */
  formatContext(documents) {
    if (documents.length === 0) {
      return 'No relevant marketing documents found.';
    }

    return documents
      .map((doc, index) => {
        return `[Source ${index + 1}]:\n${doc.pageContent}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Format conversation history
   */
  formatConversationHistory(messages) {
    if (!messages || messages.length === 0) {
      return '';
    }

    const recentMessages = messages.slice(-6);

    const formattedHistory = recentMessages
      .map(msg => {
        if (msg.type === 'user') {
          return `Претходно прашање: ${msg.content}`;
        } else if (msg.type === 'ai') {
          return `Мој претходен одговор: ${msg.content}`;
        }
        return '';
      })
      .filter(msg => msg.length > 0)
      .join('\n\n');

    return `ПРЕТХОДНА КОНВЕРЗАЦИЈА:\n${formattedHistory}`;
  }

  /**
   * Get chatbot health status
   */
  getHealthStatus() {
    return {
      status: 'operational',
      model: process.env.OPENAI_MARKETING_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      vectorStoreInitialized: this.vectorStore !== null,
      collection: this.collectionName,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
module.exports = new MarketingBotService();
