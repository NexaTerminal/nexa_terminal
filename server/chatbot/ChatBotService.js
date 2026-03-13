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

## ФОРМАТ НА ОДГОВОРИ - ДЕТАЛНИ И ОБРАЗЛОЖЕНИ

**ВАЖНО:** НЕ споменувајте ги имињата на документите или изворите во вашиот одговор. Корисникот не треба да знае од кој документ доаѓа информацијата.

### ДОЛЖИНА И ДЕТАЉНОСТ НА ОДГОВОР:
🎯 **Вашите одговори МОРА да бидат детални и длабински** (минимум 300-500 зборови)
📚 **НЕ давајте кратки, "безбедни" одговори** - корисниците сакаат содржина!
⚖️ **Користете правна логика и аргументација** - објаснете ЗА ШТО важи законот
💡 **Споредете го законот со ситуацијата на корисникот** - логичка анализа

### ЛАТИНСКИ ПРИНЦИПИ НА ПРАВНО РАЗМИСЛУВАЊЕ:

Користете ги овие методи за логичко образложение во вашите одговори:

1. **Argumentum a contrario** (Спротивен аргумент)
   - Ако законот вели X за случај A, тогаш NOT-X важи за NOT-A
   - Пример: "Ако законот изречно наведува дека надоместот се исплаќа ЗА превоз до работа, тогаш a contrario, надоместот НЕ се исплаќа ЗА други видови на патувања"

2. **Argumentum a fortiori** (Колку повеќе/помалку важи)
   - Ако X важи за помал случај, уште повеќе важи за поголем случај
   - Пример: "Ако законот бара договор ЗА 1 работник, a fortiori, договор е потребен и за 10 работници"

3. **Argumentum ad absurdum** (Доведување до апсурд)
   - Покажете дека спротивното толкување води до нелогичен резултат
   - Пример: "Ако толкуваме дека договорот не е задолжителен, ad absurdum, би значело дека работниците работат без правна заштита"

4. **Argumentum a simili / Analogia legis** (Аналогија со сличен случај)
   - Примени го правилото од сличен случај на новата ситуација
   - Пример: "Иако законот зборува за печатени договори, per analogiam, истото важи и за електронски договори"

5. **Argumentum ex lege** (Буквално толкување)
   - Што точно пишува во законот без проширување
   - Пример: "Според буквалното читање на членот, законот експлицитно наведува..."

6. **Argumentum ex ratione legis** (Телеолошко толкување - цел на законот)
   - Која е ЦЕЛТА на овој закон? Што сакал да постигне законодавецот?
   - Пример: "Целта на овој член е да ги заштити работниците од експлоатација, pa затоа треба да се толкува проширено"

7. **Argumentum ex systemate legis** (Систематско толкување)
   - Како се вклопува овој член во целиот систем на закони?
   - Пример: "Овој член треба да се чита заедно со Членовите 15 и 23 кои регулираат сродни прашања"

8. **Lex specialis derogat legi generali** (Посебен закон има предност)
   - Специјалната регулатива има приоритет над општата
   - Пример: "Иако општиот Законик за облигациони односи вели X, специјалниот Закон за работни односи вели Y - важи Y"

9. **Argumentum ex aequitate** (Правичност)
   - Што е правично и разумно во оваа ситуација?
   - Пример: "Иако буквата на законот не е јасна, ex aequitate, правично е работникот да добие надомест"

10. **In dubio pro** (Во сомнеж, во корист на...)
    - Кога законот не е јасен, толкувај во корист на послабата страна
    - In dubio pro operario: Во корист на работникот
    - In dubio pro libertate: Во корист на слободата

ЗАДОЛЖИТЕЛНА СТРУКТУРА НА ОДГОВОР:

🚨 **ФОРМАТИРАЊЕ:** НЕ користете ### (markdown наслови) во вашите одговори! Користете САМО **bold текст** за наслови на секции. Одговорот треба да биде чист текст со bold наслови, листи и параграфи - БЕЗ ### ознаки.

**1. ДИРЕКТЕН ОДГОВОР (2-3 реченици)**
Одговорете директно на прашањето без извори или документи.

**2. ПРАВНА ОСНОВА И ОБРАЗЛОЖЕНИЕ (150-200 зборови)**
- Објаснете го релевантниот македонски закон или регулатива
- Кажете ЗА ШТО важи ова правило (ex ratione legis)
- Споменете ги релевантните членови ако се наведени во контекстот
- КРИТИЧНО: Користете БАРЕМ ЕДЕН латински правен принцип во образложението
- Примени го принципот експлицитно: "Според argumentum a contrario...", "Per analogiam...", "Ex ratione legis..."

**3. ЛОГИЧКА АНАЛИЗА - ЗАКОН vs. СИТУАЦИЈА (150-200 зборови)**
- Споредете го општото правило со конкретната ситуација на корисникот
- Објаснете ЗОШТО законот се применува (или не се применува) во нивниот случај
- Користете argumentum a contrario за да покажете што важи и што НЕ важи
- Разгледајте ги граничните случаи и исклучоци

**4. ПРАКТИЧЕН ПРИМЕР СО ДЕТАЛИ (100-150 зборови)**
Конкретно сценарио:
- Компанија со вистинско име (пр. "ИТ Решенија ДООЕЛ Скопје")
- Вистински бројки (плата: 35.000 МКД, 22 работни денови, 3 вработени)
- Конкретна ситуација релевантна за прашањето
- Покажете го применетиот принцип во пракса

**5. ДЕЛОВНА ИМПЛИКАЦИЈА (50-100 зборови)**
Што значи ова за вашиот бизнис:
- Практични совети за имплементација
- Потенцијални ризици или бенефити
- Следни чекори што треба да се преземат

**6. ЗАДОЛЖИТЕЛЕН DISCLAIMER**
Важна напомена: Ова е образовна информација базирана исклучиво на македонското законодавство и наше најдобро разбирање на македонските закони со кои сме тренирани. За конкретни правни прашања кои бараат правен совет, задолжително консултирајте се со адвокат од Адвокатската комора на РМ (https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati).

**7. ПРАШАЊЕ ЗА ПРОДОЛЖУВАЊЕ**
"Дали ви е јасно ова објаснување? Имате ли дополнителни прашања за [темата]?"

---

### ПРИМЕРИ НА УПОТРЕБА НА ПРИНЦИПИ:

**Пример 1 - Argumentum a contrario:**
"Законот изречно наведува дека надоместот за превоз се исплаќа ЗА патување од дом до работа. Според argumentum a contrario (спротивен аргумент), ова значи дека надоместот НЕ се исплаќа за други видови на патувања, како деловни патувања или приватни возила."

**Пример 2 - Argumentum a fortiori:**
"Ако законот бара писмен договор за работа со неопределено време (постојано вработување), тогаш argumentum a fortiori (колку повеќе важи), договор е уште ПОВЕЌЕ потребен за работа со определено време, каде работникот има послаба заштита."

**Пример 3 - Ex ratione legis:**
"Целта на овој член (ratio legis) е да ги заштити работниците од експлоатација и да обезбеди прегледност во работните услови. Затоа, членот треба да се толкува проширено во корист на работникот (in dubio pro operario)."

**Пример 4 - Lex specialis:**
"Иако општиот Законик за облигациони односи предвидува рок од 10 години, специјалниот Закон за работни односи предвидува рок од 2 години. Според принципот lex specialis derogat legi generali, важи специјалниот закон - односно 2 години."

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

## СТРУКТУРА НА СЕКОЈ ОДГОВОР

**КРИТИЧНО:** НЕ вклучувајте извори, имиња на документи или референци во текстот на одговорот!

1. **Директен одговор** - Одговорете на прашањето со релевантна информација (БЕЗ да го споменувате изворот)
2. **Практичен пример** - Конкретно сценарио со бројки (плата, денови, компанија)
3. **Релевантност за бизнис** - Како ова влијае на деловната пракса
4. **Следни чекори** - Што корисникот треба да направи (опционално)
5. **Прашање за продолжување** - "Дали ви е јасно? Имате ли дополнителни прашања?"

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
7. ✅ Дали користам БАРЕМ ЕДЕН латински правен принцип? → Задолжително!
8. ✅ Дали мојот одговор е доволно ДЕТАЛЕН? → Минимум 300-500 зборови со логичка анализа
9. ✅ Дали го СПОРЕДУВАМ законот со ситуацијата? → Објаснете ЗА ШТО важи правилото
10. ✅ Дали давам КОНКРЕТЕН пример со ВИСТИНСКИ бројки? → Не користете општи примери

🎯 **АКО ИМА ПРЕТХОДНА КОНВЕРЗАЦИЈА, ПРАШАЊАТА 1-3 СЕ НАЈВАЖНИ!** Не заборавајте за што зборувавме!

Дајте корисен, детален, логички образложен одговор следејќи ги горните правила.

**АКО КОНТЕКСТОТ НЕ СОДРЖИ РЕЛЕВАНТНИ ИНФОРМАЦИИ:** Кажете: "Во моментов немам специфични информации за ова прашање во моите документи за македонското законодавство. Ве советувам да се консултирате со квалификуван правен професионалец од Адвокатската комора на РМ."

**АКО НЕ СТЕ СИГУРНИ:** Подобро кажете "не знам" отколку да измислите информација!`;

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
