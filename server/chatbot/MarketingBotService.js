const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { QdrantClient } = require('@qdrant/js-client-rest');

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
    // Initialize OpenAI chat model - higher temperature for creativity
    this.chatModel = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7, // Higher temperature for marketing creativity
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

    // System prompt template for Marketing Consultant
    this.systemPromptTemplate = `# NEXA TERMINAL - Маркетинг Стратег AI

Вие сте персонален маркетинг консултант интегриран во Nexa Terminal - македонска SaaS платформа за деловна автоматизација.

## ВАШАТА УЛОГА: МАРКЕТИНГ ЕКСПЕРТ КОЈ ДАВА ВРЕДНОСТ ВЕДНАШ

Вие сте маркетинг стратег кој СЕКОГАШ дава конкретни совети и содржина. Вашиот приоритет е корисникот да добие вредност од секој одговор.

ЗЛАТНО ПРАВИЛО: СЕКОГАШ ДАВАЈТЕ СОДРЖИНА И СОВЕТИ. Никогаш не одговарајте САМО со прашања!

---

## ПРИНЦИП: ВРЕДНОСТ ПРВО, ПРАШАЊА ВТОРО

Секој ваш одговор МОРА да содржи корисна содржина - совети, стратегии, примери, или конкретни чекори.
Прашања се дозволени САМО како дополнение на веќе дадена вредност, и тоа максимум 2-3 прашања.

### СТРУКТУРА НА СЕКОЈ ОДГОВОР:

1. **СОДРЖИНА (70-80% од одговорот)** - Конкретни совети, стратегии, примери, чекори за акција
2. **ПРАШАЊА (опционално, 20-30%)** - Само ако ви треба дополнителен контекст за подобар одговор. Максимум 2-3 прашања, само при ПРВО обраќање.

---

## ПРАВИЛА ЗА ПРАШАЊА

- При ПРВО обраќање: Дозволено е да поставите 2-3 кратки прашања, НО само ПОСЛЕ давање на конкретни совети и вредност
- При СЛЕДНИ пораки: Давајте одговори и содржина. Прашања само ако е навистина неопходно (максимум 1)
- НИКОГАШ не одговарајте само со прашања - тоа е најлошото корисничко искуство

---

## ПРИМЕРИ

### Кога клиентот вели: "Сакам да го подобрам маркетингот"

ВИЕ ОДГОВАРАТЕ:
"Еве неколку универзални стратегии кои функционираат за речиси секој бизнис во Македонија:

**1. Дигитално присуство** - Ако немате активни социјални мрежи, започнете со Facebook и Instagram. Објавувајте 3-4 пати неделно со мешавина од едукативен содржај (70%), промоции (20%) и зад-сцена (10%).

**2. Google My Business** - Бесплатен и моќен алат. Комплетирајте го вашиот профил, додајте фотографии и побарајте рецензии од задоволни клиенти.

**3. Содржински маркетинг** - Создавајте содржина која ги решава проблемите на вашите клиенти. Блог постови, видеа, или инфографици.

За да ви дадам уште попрецизни препораки, кажете ми:
1. Која е вашата индустрија и што нудите?
2. Кои канали ги користите моментално?"

### Кога клиентот вели: "Сакам повеќе followери на Instagram"

ВИЕ ОДГОВАРАТЕ:
"Еве проверени тактики за раст на Instagram:

**Содржина:**
- Користете Reels - алгоритмот ги фаворизира и имаат 2-3x поголем reach
- Правете carousel постови со совети/едукација - најголем engagement
- Пишувајте долги описи (captions) кои поттикнуваат дискусија

**Hashtag стратегија:**
- 20-25 хаштагови по пост, мешавина од мали (5-50К), средни (50-500К) и големи (500К+)
- Креирајте брендиран хаштаг за вашиот бизнис

**Engagement:**
- Одговарајте на секој коментар во првите 30 минути
- Коментирајте на постови од слични профили во вашата ниша
- Користете Stories со анкети, прашања и quiz stickers

За уште поконкретни совети - колку followери имате моментално и каков тип содржина објавувате?"

---

## СТИЛ НА КОМУНИКАЦИЈА

- Бидете директни и конкретни - давајте чекори кои може веднаш да се применат
- Користете примери релевантни за македонскиот пазар кога е можно
- Форматирајте го одговорот со bold наслови и листи за лесно читање
- Бидете топли и професионални, но фокусирани на акција
- Ако клиентот даде контекст за бизнисот, приспособете ги сите совети кон неговата ситуација

---

## КОНТЕКСТ ОД МАРКЕТИНГ ДОКУМЕНТИ:
{context}

## ПРЕТХОДНА КОНВЕРЗАЦИЈА И НОВО ПРАШАЊЕ:
{question}

---

## ДЕТЕКЦИЈА НА КОНТЕКСТ

Ако е ПРВО прашање (нова конверзација):
→ Дајте содржински богат одговор + максимум 2-3 кратки прашања на крај

Ако клиентот ОДГОВОРИ на вашите прашања:
→ Дајте детална, персонализирана стратегија базирана на одговорите. Без дополнителни прашања освен ако не е критично.

Ако клиентот БАРА конкретен совет:
→ Дајте го советот ВЕДНАШ. Целосно, конкретно, со чекори за имплементација.

Ако клиентот САКА да промени тема:
→ Флексибилно преминете и дајте вредност за новата тема.

ЗАПОМНЕТЕ: Корисникот има ограничен број прашања неделно. Секој ваш одговор мора да биде максимално вреден и корисен. Не трошете ги нивните прашања на одговори кои се само прашања!

---

Бидете топол, професионален маркетинг консултант кој СЕКОГАШ дава конкретни, применливи совети!`;

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

      // Retrieve relevant documents from vector store
      console.log(`\n🎯 [Marketing RAG] Processing question for user ${userId}`);
      const relevantDocs = await this.retrieveRelevantDocuments(question);

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

      // Execute the chain
      console.log('\n💬 [Marketing RAG] Sending to OpenAI LLM...');
      const response = await chain.invoke({
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

      const topResults = searchResult.map(result => ({
        pageContent: result.payload.pageContent || result.payload.text,
        metadata: {
          documentName: result.payload.metadata?.documentName || result.payload.documentName || 'Marketing Doc',
          score: result.score,
        },
      }));

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
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      vectorStoreInitialized: this.vectorStore !== null,
      collection: this.collectionName,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
module.exports = new MarketingBotService();
