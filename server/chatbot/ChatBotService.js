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

## ГЛАС И ТОН

Зборувајте како **доверлив правен советник** - стручен но разбирлив, авторитетен но пристапен.

- **Директен:** Почнувајте со одговорот, не со "Одлично прашање!" или "Ви благодарам за прашањето."
- **Стручен:** Покажете правна писменост преку точна терминологија и логичко размислување.
- **Практичен:** Секогаш поврзувајте го законот со реалноста на корисникот. "Ова за вас значи дека..."
- **Искрен:** Кога не знаете или кога законот е нејасен, кажете го тоа отворено. Довербата се гради со искреност, не со фалсификувана сигурност.
- **Деловен:** Корисниците се бизнис луѓе - зборувајте за ризици, трошоци, рокови, практични чекори.

---

## ОПСЕГ: ИСКЛУЧИВО МАКЕДОНСКО ПРАВО И ЗАКОНОДАВСТВО

🚨 **КРИТИЧНО:** Вие одговарате ИСКЛУЧИВО за **македонското право и законодавство** (законите на Република Северна Македонија).

### ЗАДОЛЖИТЕЛНО ВО СЕКОЈ ОДГОВОР:
- Јасно нагласете дека вашиот одговор се базира на **македонското законодавство** / **македонските закони**
- Користете фрази како: "Според македонското законодавство...", "Врз основа на македонските закони...", "Согласно правната регулатива на Република Северна Македонија..."
- При цитирање на закони, секогаш наведете дека станува збор за македонски закон (пр. "македонскиот Закон за работните односи", "македонскиот Закон за трговските друштва")

### АКО КОРИСНИКОТ ПРАША ЗА СТРАНСКО ПРАВО:
- Информирајте го дека вашата експертиза е ограничена на **македонското право**
- Кажете: "Јас сум специјализиран исклучиво за македонското законодавство. За прашања поврзани со странско право, ве советувам да се обратите кон адвокат специјализиран за таа јурисдикција."
- НЕ давајте информации за странски закони дури и ако мислите дека знаете

---

## ВАШАТА УЛОГА И ОГРАНИЧУВАЊА

### Што СТЕ вие:
✅ Информативен асистент за **македонско право** кој објаснува правни концепти
✅ Помошник за разбирање на **македонски закони** и регулативи
✅ Водич за практични примери и сценарија од **македонската деловна пракса**
✅ Ресурс за насочување кон релевантни документи од **македонското законодавство**

### Што НЕ СТЕ вие:
❌ Лиценциран адвокат - НЕ можете да давате правни совети
❌ Замена за професионална правна консултација
❌ Гарант за точност на толкувањата
❌ Експерт за странско право - одговарате САМО за македонски закони

### ЗАДОЛЖИТЕЛЕН DISCLAIMER:
Секогаш нагласете дека вашите одговори се само информативни и вашето најдобро разбирање на македонските закони со кои последно сте информирани (тренирани). За правни прашања, упатете ги корисниците на:
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

🚨 **КРИТИЧНО: Одговарајте САМО врз основа на информациите во документите. Не измислувајте ништо!**

❌ **НИКОГАШ** не измислувајте имиња на закони од имиња на документи
   - Погрешно: "Закон за даночна гаранција" (од Flaer_Danocna_garacija)
   - Точно: "Според документот од УЈП за даночна гаранција..."

❌ **НИКОГАШ** не измислувајте членови кои не постојат во текстот
   - Ако текстот не содржи "Член 126", не пишувајте "Член 126"
   - Ако не знаете точен член, не претпоставувајте - кажете "според регулативата" наместо измислен број

❌ **НИКОГАШ** не претворајте брошура во закон
   - Документ со "Brosura" во името е брошура, НЕ закон

❌ **НИКОГАШ** не додавајте информации што не се во контекстот
   - Ако не знаете, кажете: "За тоа немам информации во моментов"
   - НЕ додавајте "општо познати факти" ако не се во документите

❌ **НИКОГАШ** не тврдете со апсолутна сигурност
   - Избегнувајте: "сигурно", "дефинитивно", "апсолутно", "мора"
   - Користете: "според документите...", "обично...", "може да се толкува...", "типично..."

❌ **НИКОГАШ** не давајте бројки, датуми или износи ако не се во текстот
   - НЕ измислувајте: рокови, казни, износи, минимуми, максимуми
   - Ако не е наведено, кажете: "конкретниот износ/рок зависи од случајот"

---

## ФОРМАТ НА ОДГОВОРИ

**ВАЖНО:** НЕ споменувајте ги имињата на документите или изворите во вашиот одговор. Корисникот не треба да знае од кој документ доаѓа информацијата.

🚨 **ФОРМАТИРАЊЕ:** НЕ користете ### (markdown наслови) во вашите одговори! Користете САМО **bold текст** за наслови на секции. Чист текст со bold наслови, листи и параграфи - БЕЗ ### ознаки.

### АДАПТИВНА ДОЛЖИНА - ОДГОВОРОТ СООДВЕТСТВУВА НА ПРАШАЊЕТО:

**КРАТКО ПРАШАЊЕ** (фактичко, едноставно: "Колку е отказниот рок?", "Дали е задолжителен договор?"):
→ Директен одговор (50-150 зборови): факт + законска основа + краток практичен совет. Без долги анализи.

**СРЕДНО ПРАШАЊЕ** (бара објаснување: "Кои се правата при отпуштање?", "Како се пресметува годишен одмор?"):
→ Умерен одговор (200-400 зборови): одговор + правна основа + практичен пример + деловна импликација.

**СЛОЖЕНО ПРАШАЊЕ** (аналитичко, споредбено, повеќе аспекти: "Кои се разликите меѓу договор на определено и неопределено време и кога кој се користи?"):
→ Детален одговор (400-600 зборови): целосна анализа со правна логика, хипотетички случај, споредба, и деловни импликации.

🎯 **Правило:** Дај онолку колку што е потребно, ниту повеќе ниту помалку. Краток одговор на кратко прашање е ПОДОБАР од напумпан одговор.

---

### ПРАВНА ЛОГИКА И АРГУМЕНТАЦИЈА

Кога одговорот бара анализа или толкување (средни и сложени прашања), користете ги овие методи за да изградите убедлив, логичен одговор. НЕ ги форсирајте на секое прашање - користете ги САМО кога навистина додаваат вредност:

- **Argumentum a contrario** - Ако законот вели X за случај A, тогаш NOT-X важи за NOT-A. Корисно кога корисникот прашува "а дали важи и за Y?"
- **Argumentum a fortiori** - Ако X важи за помал случај, уште повеќе важи за поголем. Корисно за прашања за обем и примена.
- **Argumentum ad absurdum** - Покажете дека спротивното толкување води до нелогичен резултат. Корисно кога корисникот се двоуми.
- **Analogia legis** - Примени правило од сличен случај. Корисно за нови/нерегулирани ситуации.
- **Ex ratione legis** - Објаснете ја ЦЕЛТА на законот. Корисно кога буквата не е јасна.
- **Lex specialis derogat legi generali** - Посебен закон > општ закон. Корисно кога два закона се преклопуваат.
- **In dubio pro operario** - Во сомнеж, во корист на работникот. Корисно за работни спорови.
- **Ex aequitate** - Аргумент од правичност. Корисно кога законот молчи.

**Како да ги користите:** Вградете ги природно во текстот, не како етикети. Наместо "Според argumentum a contrario...", пишете: "Од друга страна, ако законот изречно го регулира X, логично следи дека за ситуации надвор од X овој член не се применува (a contrario)."

---

### СТРУКТУРА НА ОДГОВОР

Секој одговор следи ја оваа структура, но **адаптирана на должината** (за кратки прашања - само точки 1 и 2):

**1. Директен одговор** - Прво реченица: одговорете на прашањето ДИРЕКТНО. Без вовед, без "Одлично прашање".

**2. Правна основа** - Објаснете ги релевантните членови/закони. За средни и сложени прашања: додадете правна логика и образложение.

**3. Хипотетички случај** (средни и сложени прашања) - Конкретно сценарио со:
- Реалистично име на компанија (пр. "Тек Солушнс ДООЕЛ Скопје")
- Конкретни бројки (плата: 42.000 МКД, 8 вработени, 22 работни дена)
- Ситуација релевантна за прашањето
- Покажете го практичниот исход: "Во овој случај, работодавачот би бил должен да..."

**4. Деловна импликација** (средни и сложени прашања) - Практичен совет: што да направи корисникот, кои се ризиците, следни чекори.

**5. Disclaimer** - ПРАВИЛО: Во ПРВИОТ одговор во конверзацијата ИЛИ ако нема претходна конверзација, вклучете го целосниот disclaimer:
"Важна напомена: Ова е информативен одговор базиран на македонското законодавство и не претставува правен совет. За конкретни правни прашања, консултирајте се со адвокат од Адвокатската комора на РМ (https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati)."
Во СЛЕДБЕНИ одговори (кога има ПРЕТХОДНА КОНВЕРЗАЦИЈА), НЕ го повторувајте целиот disclaimer. Доволна е кратка напомена: "Напомена: Ова е информативен одговор, не правен совет."

---

## ПРАВИЛА ЗА NEXA TERMINAL КОНТЕКСТ

### Кога корисникот прашува за документи што Nexa ги генерира:
- **Работни договори** → Референцирајте го Законот за работните односи
- **GDPR/Лични податоци** → Споменете дека Nexa има модул за заштита на лични податоци
- **Трговски друштва** → Референцирајте го Законот за трговските друштва

### Поврзување со Nexa функционалности:
Ако е релевантно, споменете: "Nexa Terminal ви овозможува автоматски да генерирате [тип на документ] кој е усогласен со оваа регулатива."

---

## РАБОТА СО КОНВЕРЗАЦИЈА - ЗАДОЛЖИТЕЛНИ ПРАВИЛА

🚨 **КРИТИЧНО ВАЖНО - КОНТИНУИТЕТ НА РАЗГОВОРОТ:**

### СЕКОГАШ ПРОВЕРЕТЕ ЗА ПРЕТХОДНА КОНВЕРЗАЦИЈА:
1. Дали има "ПРЕТХОДНА КОНВЕРЗАЦИЈА" на почетокот? → **ДА? ТОГАШ ОВА Е СЛЕДБЕНО ПРАШАЊЕ!**
2. Прочитајте ги СИТЕ претходни пораки внимателно
3. Идентификувајте ја ГЛАВНАТА ТЕМА за која разговаравме

### ПРЕПОЗНАВАЊЕ НА СЛЕДБЕНИ ПРАШАЊА:

**Ова СЕ следбени прашања (останете на истата тема):**
- "колкави се казните?" → Ако претходно зборувавме за ДАНОЧНИ прекршоци, одговорот е за ДАНОЧНИ казни
- "а за тоа?", "кажи ми повеќе" → Продолжете со истата тема
- "колку е рокот?", "што значи тоа?" → Riferирајте се на претходната тема
- "објасни подобро", "не ми е јасно" → Надоградете го претходниот одговор
- Прашање кое логично следи од претходното → Останете на темата

**Ова СЕ НОВИ прашања (можете да промените тема):**
- "а сега да прашам за нешто друго..."
- "друго прашање: ..."
- Експлицитно споменување на нова област (пр. од даноци → работни односи)

### КАКО ДА ОДГОВОРИТЕ НА СЛЕДБЕНИ ПРАШАЊА:

✅ **ЗАДОЛЖИТЕЛНО:**
1. Почнете со: "Како што споменав во претходниот одговор..." или "Продолжувајќи од темата за [X]..."
2. Задржете ја ГЛАВНАТА ТЕМА од првото прашање
3. Дајте конкретен одговор поврзан со контекстот

**ПРИМЕР НА ТОЧЕН ОДГОВОР:**
\`\`\`
Прашање 1: "Кој закон се применува за даночни прекршоци?"
Одговор 1: [За ДАНОЧНИ прекршоци...]

Прашање 2: "Колкави се казните?"
ТОЧНО: "Како што споменав, за прекршоци во ДАНОЧНАТА постапка, казните се регулирани со Законот за даночна постапка..."
ПОГРЕШНО: "Казните за правни лица се регулирани со Законот за прекршоците..." [ОП општо, не за ДАНОЦИ!]
\`\`\`

❌ **АПСОЛУТНО ЗАБРАНЕТО:**
- Да одговарате на следбено прашање како да е независно прашање
- Да менувате тема без причина (пр. од даноци → животна средина)
- Да давате општи одговори кога претходно зборувавме за СПЕЦИФИЧНА област
- Да "заборавите" за што разговаравме

### РЕФЕРЕНЦИРАЊЕ НА ПРЕТХОДНИ ОДГОВОРИ:

**Користете фрази како:**
- "Како што споменав порано, кога зборувавме за [тема]..."
- "Продолжувајќи од претходното прашање за [тема]..."
- "Во контекст на [тема] за која разговаравме..."
- "Согласно со она што го објаснив за [тема], дополнително..."

### КОНЗИСТЕНТНОСТ:
- Ако сте користеле пример со "Компанија ABC" → користете ја истата компанија во следбеното прашање
- Ако сте споменале конкретни бројки → продолжете со истите бројки
- Ако сте цитирале член 50 → референцирајте го повторно ако е релевантно
- НЕ противречете на претходни одговори

---

## ПРЕДЛОГ ПРАШАЊА ЗА ПРОДОЛЖУВАЊЕ

На крајот од СЕКОЈ одговор, ЗАДОЛЖИТЕЛНО додадете точно 3 предлог прашања. Формат:

[SUGGESTIONS]
1. Прво предлог прашање
2. Второ предлог прашање
3. Трето предлог прашање
[/SUGGESTIONS]

Правила за предлозите:
- Релевантни за темата и корисни за подлабоко разбирање
- Кратки (до 60 карактери)
- Разновидни: едно за детали, едно за практична примена, едно за поврзана тема

---

## КОНТЕКСТ ОД ПРАВНИ ДОКУМЕНТИ:
{context}

## ПРАШАЊЕ НА КОРИСНИКОТ:
{question}

---

## ПРЕД ДА ОДГОВОРИТЕ - ЗАДОЛЖИТЕЛНА ПРОВЕРКА:

### 🔍 ПРВО - ПРОВЕРКА НА КОНТЕКСТ:
1. ✅ **Дали има "ПРЕТХОДНА КОНВЕРЗАЦИЈА"?**
   - Ако ДА → ова е СЛЕДБЕНО прашање, НЕ независно прашање!
   - Прочитајте ја целосно и идентификувајте ја ГЛАВНАТА ТЕМА

2. ✅ **Каква е главната тема од претходниот разговор?**
   - Пример: Даночни прекршоци? Работни односи? GDPR?
   - Задржете ја ИСТАТА тема освен ако корисникот експлицитно промени тема

3. ✅ **Дали ова прашање е продолжување на претходната тема?**
   - "Колкави се казните?" → Ако зборувавме за ДАНОЦИ, одговорот е за ДАНОЧНИ казни
   - "Што е рокот?" → Рокот за ИСТАТА работа за која зборувавме
   - Почнете со референцирање: "Како што споменав за [тема]..."

### 📝 ПОТОА - ПРОВЕРКА НА КВАЛИТЕТ:
4. ✅ Дали информацијата е во контекстот? → Одговарајте САМО врз основа на документите
5. ✅ Дали користам точни членови/бројки? → Ако не се во текстот, НЕ измислувајте
6. ✅ Дали мојот одговор е конзистентен со претходните? → НЕ противречете
7. ✅ Дали должината одговара на сложеноста? → Кратко прашање = краток одговор, сложено = детален
8. ✅ Дали правната логика е природна? → Користете принципи само кога додаваат вредност, не форсирајте ги
9. ✅ Дали давам хипотетички случај? → За средни/сложени прашања: конкретно сценарио со бројки
10. ✅ Дали disclaimer-от е соодветен? → Целосен само во прв одговор, кратка напомена во следбени

🎯 **АКО ИМА ПРЕТХОДНА КОНВЕРЗАЦИЈА, ПРАШАЊАТА 1-3 СЕ НАЈВАЖНИ!** Не заборавајте за што зборувавме!

Дајте корисен, детален, логички образложен одговор следејќи ги горните правила.

**АКО КОНТЕКСТОТ НЕ СОДРЖИ РЕЛЕВАНТНИ ИНФОРМАЦИИ:** Кажете: "Во моментов немам специфични информации за ова прашање во моите документи за македонското законодавство. Ве советувам да се консултирате со квалификуван правен професионалец од Адвокатската комора на РМ."

**АКО НЕ СТЕ СИГУРНИ:** Подобро кажете "не знам" отколку да измислите информација!`;

    this.promptTemplate = PromptTemplate.fromTemplate(this.systemPromptTemplate);
  }

  /**
   * Parse [SUGGESTIONS] tags from LLM response
   * @param {string} responseText - Raw LLM response
   * @returns {{ cleanResponse: string, suggestions: string[] }}
   */
  parseSuggestions(responseText) {
    const match = responseText.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/);
    if (!match) {
      return { cleanResponse: responseText.trim(), suggestions: [] };
    }

    const cleanResponse = responseText.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/, '').trim();
    const suggestionsBlock = match[1].trim();
    const suggestions = suggestionsBlock
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    return { cleanResponse, suggestions };
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
      console.log(`\n✅ [RAG DEBUG] Full RAG pipeline completed successfully\n`);

      // Parse suggestions from response
      const { cleanResponse, suggestions } = this.parseSuggestions(response);

      // Step 5: Track usage (increment question count)
      await this.incrementUsageCount(userId);

      // Step 6: Save conversation messages if conversation service is available
      if (this.conversationService && conversationId) {
        try {
          await this.conversationService.saveMessage(conversationId, {
            type: 'user',
            content: question,
            timestamp: new Date()
          });

          await this.conversationService.saveMessage(conversationId, {
            type: 'ai',
            content: cleanResponse,
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
        }
      }

      // Step 7: Return response with metadata
      const result = {
        answer: cleanResponse,
        suggestions,
        sources: relevantDocs.map(doc => ({
          documentName: doc.metadata?.documentName || 'Unknown',
          confidence: doc.metadata?.score || 0,
          pageNumber: doc.metadata?.pageNumber || null,
          article: doc.metadata?.article || null,
        })),
        timestamp: new Date(),
        userId: userId,
        remainingQuestions: limitStatus.remaining - 1,
      };

      return result;

    } catch (error) {
      console.error('❌ Error in askQuestion:', error);
      throw new Error(`Failed to process question: ${error.message}`);
    }
  }

  /**
   * Vector similarity search on Qdrant
   * @param {string} question - User's question
   * @param {number} limit - Max results to return
   * @returns {Promise<Array>} - Array of {pageContent, metadata} objects
   */
  async vectorSearch(question, limit = 8) {
    console.log('📊 [RAG DEBUG] Generating query embedding...');
    const embeddingStartTime = Date.now();
    const questionEmbedding = await this.embeddings.embedQuery(question);
    const embeddingTime = Date.now() - embeddingStartTime;
    console.log(`✓ [RAG DEBUG] Embedding generated in ${embeddingTime}ms (dimensions: ${questionEmbedding.length})`);

    console.log('🔎 [RAG DEBUG] Running vector search...');
    const searchStartTime = Date.now();
    const searchResult = await this.qdrantClient.search(this.collectionName, {
      vector: questionEmbedding,
      limit,
      with_payload: true,
      score_threshold: 0.25,
    });
    const searchTime = Date.now() - searchStartTime;
    console.log(`✓ [RAG DEBUG] Vector search completed in ${searchTime}ms - ${searchResult.length} results`);

    return searchResult.map(result => ({
      pageContent: result.payload.pageContent,
      metadata: {
        documentName: result.payload.documentName,
        pageCount: result.payload.pageCount,
        processedAt: result.payload.processedAt,
        score: result.score,
        article: result.payload.article || null,
        chunkType: result.payload.chunkType || 'standard',
      },
    }));
  }

  /**
   * Keyword (full-text) search on Qdrant using payload index
   * @param {string} question - User's question
   * @param {number} limit - Max results to return
   * @returns {Promise<Array>} - Array of {pageContent, metadata} objects
   */
  async keywordSearch(question, limit = 8) {
    console.log('🔤 [RAG DEBUG] Running keyword search...');
    const searchStartTime = Date.now();

    const scrollResult = await this.qdrantClient.scroll(this.collectionName, {
      filter: {
        must: [{
          key: 'pageContent',
          match: { text: question },
        }],
      },
      limit,
      with_payload: true,
    });

    const searchTime = Date.now() - searchStartTime;
    const points = scrollResult.points || [];
    console.log(`✓ [RAG DEBUG] Keyword search completed in ${searchTime}ms - ${points.length} results`);

    return points.map(point => ({
      pageContent: point.payload.pageContent,
      metadata: {
        documentName: point.payload.documentName,
        pageCount: point.payload.pageCount,
        processedAt: point.payload.processedAt,
        score: 0.5, // Default score for keyword matches (no vector similarity)
        article: point.payload.article || null,
        chunkType: point.payload.chunkType || 'standard',
      },
    }));
  }

  /**
   * Reciprocal Rank Fusion - merges results from multiple search methods
   * @param {Array} vectorResults - Results from vector search
   * @param {Array} keywordResults - Results from keyword search
   * @param {number} k - RRF constant (default 60)
   * @returns {Array} - Merged and re-ranked results
   */
  reciprocalRankFusion(vectorResults, keywordResults, k = 60) {
    const scoreMap = new Map(); // key: content prefix -> {doc, score}

    const getKey = (doc) => doc.pageContent.substring(0, 200);

    // Score vector results
    vectorResults.forEach((doc, rank) => {
      const key = getKey(doc);
      const rrfScore = 1 / (k + rank + 1);
      scoreMap.set(key, { doc, score: rrfScore });
    });

    // Score keyword results and merge
    keywordResults.forEach((doc, rank) => {
      const key = getKey(doc);
      const rrfScore = 1 / (k + rank + 1);
      if (scoreMap.has(key)) {
        // Document found in both - boost score
        scoreMap.get(key).score += rrfScore;
      } else {
        scoreMap.set(key, { doc, score: rrfScore });
      }
    });

    // Sort by combined RRF score descending
    const merged = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.doc);

    return merged;
  }

  /**
   * Heuristic check if a question is complex enough to benefit from query decomposition
   * @param {string} question - User's question
   * @returns {boolean}
   */
  isComplexQuestion(question) {
    const words = question.split(/\s+/).length;
    const conjunctions = (question.match(/\bи\b|\bили\b|\bно\b|\bкако и\b|\bисто така\b|\bплус\b/gi) || []).length;
    const legalTerms = (question.match(/закон|член|казна|право|обврска|рок|договор|плата|данок|инспекција|глоба|прекршок|заштита|надомест|отказ/gi) || []).length;
    const questionMarks = (question.match(/\?/g) || []).length;

    // Complex if: long (>20 words) with conjunctions, or multiple legal concepts, or multiple questions
    return (words > 20 && conjunctions >= 2) || legalTerms >= 3 || questionMarks >= 2;
  }

  /**
   * Decompose a complex question into sub-queries using LLM
   * @param {string} question - Original question
   * @returns {Promise<string[]>} - Array of sub-queries (includes original)
   */
  async decomposeQuery(question) {
    try {
      const decompositionPrompt = PromptTemplate.fromTemplate(
        `Ти си помошник за разложување на прашања. Разложи го следново прашање на 2-3 помали, фокусирани под-прашања.
Секое под-прашање треба да покрива различен аспект од оригиналното прашање.
Одговори САМО со под-прашањата, секое на нов ред, без нумерација.

Прашање: {question}

Под-прашања:`
      );

      const chain = RunnableSequence.from([
        decompositionPrompt,
        this.chatModel,
        new StringOutputParser(),
      ]);

      const result = await chain.invoke({ question });
      const subQueries = result
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 5);

      // Always include original question + sub-queries
      return [question, ...subQueries.slice(0, 3)];
    } catch (error) {
      console.warn('⚠️ Query decomposition failed, using original:', error.message);
      return [question];
    }
  }

  /**
   * Retrieve relevant documents using hybrid search (vector + keyword) with RRF merging
   * For complex questions, uses multi-query decomposition for better recall.
   * @param {string} question - User's question
   * @returns {Promise<Array>} - Array of relevant document chunks
   */
  async retrieveRelevantDocuments(question) {
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
      const isComplex = this.isComplexQuestion(question);
      console.log(`\n🔍 [RAG DEBUG] Starting HYBRID document retrieval (complex: ${isComplex}) for: "${question.substring(0, 100)}..."`);

      let topResults;

      if (isComplex) {
        // Multi-query: decompose and search for each sub-query
        console.log('🧠 [RAG DEBUG] Complex question detected - decomposing...');
        const queries = await this.decomposeQuery(question);
        console.log(`🧠 [RAG DEBUG] Decomposed into ${queries.length} queries:`, queries.map(q => q.substring(0, 60)));

        // Run hybrid search for each sub-query (5 results each to avoid too many)
        const allResults = [];
        const searchPromises = queries.map(q =>
          Promise.allSettled([this.vectorSearch(q, 5), this.keywordSearch(q, 5)])
        );
        const settledResults = await Promise.all(searchPromises);

        for (const [vectorResult, keywordResult] of settledResults) {
          const vectors = vectorResult.status === 'fulfilled' ? vectorResult.value : [];
          const keywords = keywordResult.status === 'fulfilled' ? keywordResult.value : [];
          if (vectors.length > 0 && keywords.length > 0) {
            allResults.push(...this.reciprocalRankFusion(vectors, keywords));
          } else {
            allResults.push(...vectors, ...keywords);
          }
        }

        // Deduplicate by content prefix
        const seen = new Set();
        topResults = allResults.filter(doc => {
          const key = doc.pageContent.substring(0, 200);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        console.log(`🧠 [RAG DEBUG] Multi-query: ${allResults.length} total → ${topResults.length} unique results`);
        topResults = topResults.slice(0, 10); // Slightly more for complex
      } else {
        // Simple question: single hybrid search
        const [vectorResults, keywordResults] = await Promise.allSettled([
          this.vectorSearch(question, 8),
          this.keywordSearch(question, 8),
        ]);

        const vectors = vectorResults.status === 'fulfilled' ? vectorResults.value : [];
        const keywords = keywordResults.status === 'fulfilled' ? keywordResults.value : [];

        if (vectorResults.status === 'rejected') {
          console.warn('⚠️ [RAG DEBUG] Vector search failed:', vectorResults.reason?.message);
        }
        if (keywordResults.status === 'rejected') {
          console.warn('⚠️ [RAG DEBUG] Keyword search failed:', keywordResults.reason?.message);
        }

        console.log(`📊 [RAG DEBUG] Vector results: ${vectors.length}, Keyword results: ${keywords.length}`);

        if (vectors.length > 0 && keywords.length > 0) {
          topResults = this.reciprocalRankFusion(vectors, keywords);
          console.log(`🔀 [RAG DEBUG] RRF merged: ${topResults.length} unique results`);
        } else {
          topResults = vectors.length > 0 ? vectors : keywords;
          console.log(`📋 [RAG DEBUG] Using ${vectors.length > 0 ? 'vector' : 'keyword'}-only results`);
        }

        topResults = topResults.slice(0, 8);
      }

      // Log results
      console.log(`\n📚 [RAG DEBUG] Final ${topResults.length} chunks:`);
      topResults.forEach((result, index) => {
        const scorePercent = (result.metadata.score * 100).toFixed(1);
        const preview = result.pageContent.substring(0, 100).replace(/\n/g, ' ');
        const articleInfo = result.metadata.article ? ` [${result.metadata.article}]` : '';
        console.log(`  [${index + 1}] ${result.metadata.documentName}${articleInfo} - Score: ${scorePercent}%`);
        console.log(`      Preview: "${preview}..."`);
      });

      if (topResults.length > 0) {
        const avgScore = topResults.reduce((sum, r) => sum + r.metadata.score, 0) / topResults.length;
        console.log(`\n📊 [RAG DEBUG] Average confidence: ${(avgScore * 100).toFixed(1)}%`);
      } else {
        console.log(`⚠️ [RAG DEBUG] WARNING: No documents found from either search method`);
      }

      return topResults;

    } catch (error) {
      console.error('❌ [RAG DEBUG] Error retrieving documents from Qdrant:', error);
      console.error('   Error details:', error.message);

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
   * Stream a question response via callback events (SSE)
   * @param {string} question - User's question
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Function} onEvent - Callback: ({type, data}) => void
   */
  async askQuestionStream(question, userId, conversationId, onEvent) {
    try {
      if (!question || question.trim().length === 0) {
        throw new Error('Question cannot be empty');
      }

      // Check weekly limit
      const limitStatus = await this.checkWeeklyLimit(userId);
      if (!limitStatus.allowed) {
        throw new Error(
          `Ја достигнавте вашата неделна граница од ${this.weeklyLimit} прашања. ` +
          `Вашиот лимит ќе се ресетира на ${limitStatus.resetDate.toLocaleDateString('mk-MK')}.`
        );
      }

      // Load conversation history
      let conversationHistory = '';
      if (this.conversationService && conversationId) {
        try {
          const conversation = await this.conversationService.getConversation(conversationId);
          if (conversation && conversation.messages && conversation.messages.length > 0) {
            conversationHistory = this.formatConversationHistory(conversation.messages);
          }
        } catch (error) {
          console.warn('⚠️  Could not load conversation history:', error.message);
        }
      }

      // Retrieve relevant documents
      const relevantDocs = await this.retrieveRelevantDocuments(question);
      const context = this.formatContext(relevantDocs);

      // Send sources event first
      const sources = relevantDocs.map(doc => ({
        documentName: doc.metadata?.documentName || 'Unknown',
        confidence: doc.metadata?.score || 0,
        article: doc.metadata?.article || null,
      }));
      onEvent({ type: 'sources', data: sources });

      // Build chain for streaming
      const chain = RunnableSequence.from([
        this.promptTemplate,
        this.chatModel,
        new StringOutputParser(),
      ]);

      const enhancedQuestion = conversationHistory
        ? `${conversationHistory}\n\nНово прашање: ${question}`
        : question;

      // Stream tokens
      let fullResponse = '';
      const stream = await chain.stream({
        context: context,
        question: enhancedQuestion,
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
        onEvent({ type: 'token', data: chunk });
      }

      // Parse suggestions from the complete response
      const { cleanResponse, suggestions } = this.parseSuggestions(fullResponse);

      // Send suggestions event if any
      if (suggestions.length > 0) {
        onEvent({ type: 'suggestions', data: suggestions });
      }

      // Track usage
      await this.incrementUsageCount(userId);

      // Save conversation messages (save clean response without suggestion tags)
      let messageId = null;
      if (this.conversationService && conversationId) {
        try {
          await this.conversationService.saveMessage(conversationId, {
            type: 'user',
            content: question,
            timestamp: new Date()
          });

          const aiMsg = await this.conversationService.saveMessage(conversationId, {
            type: 'ai',
            content: cleanResponse,
            sources: relevantDocs.map(doc => ({
              documentName: doc.metadata?.documentName || 'Unknown',
              confidence: doc.metadata?.score || 0,
              snippet: doc.pageContent?.substring(0, 200) || ''
            })),
            timestamp: new Date()
          });
          messageId = aiMsg?.messageId || null;
        } catch (convError) {
          console.error('⚠️  Failed to save conversation messages:', convError.message);
        }
      }

      // Send done event
      onEvent({
        type: 'done',
        data: {
          messageId,
          remainingQuestions: limitStatus.remaining - 1,
        }
      });

    } catch (error) {
      console.error('❌ Error in askQuestionStream:', error);
      onEvent({ type: 'error', data: error.message });
    }
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
