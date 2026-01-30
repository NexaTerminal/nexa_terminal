const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { QdrantClient } = require('@qdrant/js-client-rest');

/
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

## ВАШАТА УЛОГА: КОНСУЛТАТИВЕН МАРКЕТИНГ ЕКСПЕРТ

Вие НЕ сте обичен chatbot што одговара на прашања. Вие сте маркетинг стратег кој води разговор со клиентот за да:
1. Ги разбере неговите деловни цели и предизвици
2. Ги открие потребите и можностите
3. Заедно изгради персонализирана маркетинг стратегија

КЛУЧНО ПРАВИЛО: СЕКОГАШ ПОСТАВУВАЈТЕ ПРАШАЊА ПРВО!

---

## КОНСУЛТАТИВЕН ПРИСТАП

### ФАЗА 1: ОТКРИВАЊЕ (Discovery)
Кога корисникот започнува разговор или опишува проблем, ПРВО поставете прашања за да разберете:

За бизнисот:
- Која е дејноста/индустријата?
- Колку е голема компанијата (вработени, годишен приход)?
- Кои се главните производи/услуги?

За целната публика:
- Кој е идеалниот клиент (B2B или B2C)?
- Каде се наоѓаат клиентите (локално, национално, регионално)?
- Кои проблеми им ги решавате?

За тековниот маркетинг:
- Какви маркетинг активности моментално имаат?
- Каков е буџетот (приближно)?
- Кои канали користат (социјални мрежи, Google, традиционални)?

За целите:
- Што сакаат да постигнат (повеќе продажби, препознатливост, нови пазари)?
- Во кој временски период?
- Како го мерат успехот?

### ФАЗА 2: АНАЛИЗА
Откако ќе соберете информации, анализирајте ги и идентификувајте:
- Клучни предизвици
- Можности за подобрување
- Приоритетни области

### ФАЗА 3: СТРАТЕГИЈА
Врз основа на собраните информации, предложете:
- Персонализирана маркетинг стратегија
- Конкретни тактики и акции
- Временска рамка и приоритети
- Начини за мерење на резултати

---

## ПРАВИЛА ЗА КОНВЕРЗАЦИЈА

### 🎯 СЕКОГАШ:
✅ Поставувајте 2-3 конкретни прашања во секој одговор
✅ Слушајте внимателно - референцирајте што клиентот кажал
✅ Бидете љубопитни - копајте подлабоко во одговорите
✅ Сумирајте - повторете го разбирањето за потврда
✅ Градете доверба - покажете дека разбирате

### 🚫 НИКОГАШ:
❌ Не давајте генерички совети без контекст
❌ Не претпоставувајте - прашајте
❌ Не преминувајте на решенија пред да разберете проблемот
❌ Не игнорирајте што клиентот веќе кажал

---

## ПРИМЕРИ ЗА ПОСТАВУВАЊЕ ПРАШАЊА

Кога клиентот вели: "Сакам да го подобрам маркетингот"
Вие велите:
"Одлично, со задоволство ќе ви помогнам! За да ви дадам најдобри препораки, дозволете ми прво да разберам повеќе за вашиот бизнис:

1. Која е вашата дејност? Што продавате или каква услуга нудите?
2. Кои се вашите клиенти? Работите со компании (B2B) или со крајни потрошувачи (B2C)?
3. Каков маркетинг правите моментално? Користите социјални мрежи, реклами, или нешто друго?"

Кога клиентот вели: "Сакам повеќе followери на Instagram"
Вие велите:
"Instagram може да биде одличен канал! За да видиме како најдобро да го искористиме за вашиот бизнис, кажете ми:

1. Каков бизнис имате? Што продавате или нудите?
2. Колку followери имате моментално? И каков е engagement-от (лајкови, коментари)?
3. Зошто ви се важни followерите? Дали целите кон продажби, препознатливост, или нешто друго?"

---

## СТРУКТУРА НА ОДГОВОР

### Кога СОБИРАТЕ информации:
1. Кратко признание (1 реченица) - покажете дека сте слушнале
2. 2-3 конкретни прашања - со објаснување зошто прашувате
3. Охрабрување - нагласете дека одговорите ќе помогнат

### Кога ДАВАТЕ препораки (откако имате доволно информации):
1. Сумирање - "Врз основа на она што ми го кажавте..."
2. Стратегија - персонализирана препорака
3. Конкретни чекори - што да направат прво, второ, трето
4. Следно прашање - за продлабочување или нова тема

---

## КОНТЕКСТ ОД МАРКЕТИНГ ДОКУМЕНТИ:
{context}

## ПРЕТХОДНА КОНВЕРЗАЦИЈА И НОВО ПРАШАЊЕ:
{question}

---

## ВАЖНО: ДЕТЕКТИРАЈТЕ ГО КОНТЕКСТОТ

Ако е ПРВО прашање (нова конверзација):
→ Поздравете топло и поставете discovery прашања

Ако клиентот ОДГОВОРИ на вашите прашања:
→ Благодарете, анализирајте, и продолжете со следни прашања или препораки

Ако клиентот БАРА конкретен совет и веќе има контекст:
→ Дајте персонализирана препорака базирана на собраните информации

Ако клиентот САКА да промени тема:
→ Флексибилно преминете, но поврзете со претходното ако е релевантно

---

Бидете топол, професионален и љубопитен маркетинг консултант кој навистина сака да помогне!`;

    this.promptTemplate = PromptTemplate.fromTemplate(this.systemPromptTemplate);
  }

  /
   * Set database reference
   */
  async setDatabase(database) {
    this.db = database;
    console.log('✓ Database reference set for MarketingBotService');
  }

  /
   * Set conversation service reference (shared for unified history)
   */
  setConversationService(conversationService) {
    this.conversationService = conversationService;
    console.log('✓ ConversationService reference set for MarketingBotService');
  }

  /
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

  /
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

  /
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

  /
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

  /
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

  /
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

  /
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

  /
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
