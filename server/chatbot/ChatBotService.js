const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { QdrantClient } = require('@qdrant/js-client-rest');
const OpenAI = require('openai');
const legalDataHunter = require('./LegalDataHunterService');
const StancePreferencesService = require('../services/stancePreferencesService');

// Macedonian stopwords for keyword extraction (words that carry no legal
// meaning in a search). Short words (<4 chars) are dropped separately.
const MK_STOPWORDS = new Set([
  'дали', 'како', 'кога', 'каде', 'кому', 'зошто', 'што', 'кој', 'која', 'кое', 'кои',
  'треба', 'може', 'мора', 'сака', 'сакам', 'сакаме', 'имам', 'имаме', 'имате', 'нема',
  'бидам', 'биде', 'бидат', 'беше', 'било', 'била', 'биле', 'сум', 'сме', 'сте',
  'мене', 'тебе', 'нему', 'нејзе', 'нами', 'вами', 'ними', 'мојот', 'мојата', 'моето',
  'нашиот', 'нашата', 'нашето', 'вашиот', 'вашата', 'вашето', 'нивни', 'нивниот',
  'овој', 'оваа', 'ова', 'овие', 'тој', 'таа', 'тоа', 'тие', 'оној', 'онаа', 'она',
  'еден', 'една', 'едно', 'некој', 'некоја', 'некое', 'некои', 'нешто', 'ништо',
  'сите', 'секој', 'секоја', 'секое', 'само', 'исто', 'така', 'многу', 'малку',
  'повеќе', 'помалку', 'потоа', 'сега', 'тука', 'таму', 'веќе', 'уште', 'пак',
  'ако', 'или', 'но', 'туку', 'дека', 'бидејќи', 'затоа', 'значи', 'односно',
  'при', 'кај', 'без', 'меѓу', 'преку', 'спрема', 'според', 'освен', 'покрај',
  'прашање', 'случај', 'ситуација', 'пример', 'информации', 'молам', 'кажи', 'кажете',
  'направи', 'направам', 'направиме', 'постои', 'постојат',
]);

/**
 * Extract search keywords from a Macedonian question: strip punctuation and
 * stopwords, keep meaningful words (≥4 chars), dedupe, cap at `max`.
 */
function extractKeywords(question, max = 6) {
  const words = String(question || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/);
  const keywords = words.filter(w => w.length >= 4 && !MK_STOPWORDS.has(w));
  return [...new Set(keywords)].slice(0, max);
}

// Institutional brochures/flyers/prospects are GUIDANCE, not law. They cite
// rates/procedures that go stale and — because keyword hits get a flat score —
// they crowd real statute chunks out of the top results. We detect them by
// document name (same signal as the ingestion pipeline) and, at retrieval time,
// drop stale ones and rank the rest below actual laws/case law.
const BROCHURE_NAME_RE = /brosura|brošura|flaer|flyer|prospekt|informativen|isbn|^\s*\d{2}[-_]\d+/i;
function isBrochureName(name) {
  return BROCHURE_NAME_RE.test(name || '');
}
// Best-effort publication year from a document name (last 20xx found).
function yearFromName(name) {
  const m = String(name || '').match(/20\d{2}/g);
  return m ? parseInt(m[m.length - 1], 10) : null;
}

// Clearly non-legal artifacts that may have been ingested (data dumps, scripts,
// internal exports) — usable as background, never citable.
const NON_LEGAL_ARTIFACT_RE = /\.(json|csv|txt|xlsx?|md)$|script|reprezent|export|dump/i;

/**
 * Is this source an OFFICIAL legal instrument the AI may CITE as authority?
 * Only laws / by-laws / the constitution / official case law qualify.
 * Brochures, flyers, prospects, scripts, JSON/CSV dumps and other unofficial
 * documents are BACKGROUND ONLY — the model may use them to inform an answer
 * but must never present them as a cited source. (User rule, 2026-09-06.)
 */
function isCitableSource(meta) {
  if (!meta) return false;
  // Authoritative tag from ingestion (source_class + citable on every point).
  // Prefer it over any name heuristic when present.
  if (typeof meta.citable === 'boolean') return meta.citable;
  if (meta.external) return true;                      // LDH case law / EU with URL
  if (meta.isBrochure) return false;                   // UJP guidance → background only
  const name = (meta.documentName || '').toLowerCase();
  if (NON_LEGAL_ARTIFACT_RE.test(name)) return false;  // danok.json, scripts, exports
  if (meta.article) return true;                       // has „Член N" → statutory text (even if filename is messy)
  if (/суд|судск|пресуда|врховен|апелационен|уставен|билтен/.test(name)) return true; // case law
  if (/закон|законик|устав|правилник|кодекс|уредба|одлука|колективен договор/.test(name)) return true;
  return false;                                        // unidentifiable / unofficial → not citable
}

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
      modelName: process.env.OPENAI_MODEL || 'gpt-5.1',
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.2,
      // Cap output so the longer structured legal answers complete without
      // truncation. MK Cyrillic ≈ 2.5-3 tokens/word, so a 1000-word structured
      // answer needs ~3000 tokens. This is a CAP, not a spend — short answers
      // bill only what they generate.
      maxTokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 4096,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Cheap utility model for auxiliary calls (query condensation for
    // follow-ups, query decomposition). Never used for user-facing answers.
    // ~$0.0002 per question — keeps the token budget intact.
    this.utilityModel = new ChatOpenAI({
      modelName: process.env.OPENAI_UTILITY_MODEL || 'gpt-4o-mini',
      temperature: 0,
      maxTokens: 250,
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

    // Raw OpenAI client for the Responses API (native web_search tool) — used
    // ONLY for the gap-triggered web fallback, not for normal answers.
    this.openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // System prompt template for legal Q&A - Nexa Terminal SaaS Platform.
    // {stancePrefix} renders the user's Stance Preferences (or "" if unset).
    // Kept deliberately compact — it is re-sent on EVERY question (input cost)
    // and shorter prompts are followed more reliably.
    this.systemPromptTemplate = `{stancePrefix}# NEXA TERMINAL — Правен AI Асистент

Вие сте правен AI асистент во Nexa Terminal — македонска платформа за деловна документација. Корисниците се сопственици на бизниси, HR менаџери и луѓе што работат со деловни документи — НЕ се правници.

## ЈАЗИК (АПСОЛУТНО ПРАВИЛО)
СЕКОГАШ одговарајте на МАКЕДОНСКИ јазик (кирилица), без оглед на јазикот на прашањето. Странски термини (GDPR, CJEU) може да останат во оригинал.

## ГЛАС И ТОН
Зборувајте како доверлив правен советник — практичен адвокат што ЗАСТАПУВА и ГИ ШТИТИ интересите на корисникот што прашува (не сте неутрален предавач). Вашата цел е корисникот навистина да ЈА РАЗБЕРЕ својата ситуација и да заштити свои права:
- **На страната на корисникот:** гледајте го проблемот низ неговиот интерес — што го штити, што може да го изложи на ризик, што да побара, а што да избегне. Кога има повеќе опции, препорачајте ја најбезбедната за него и кажете зошто.
- **Директен:** почнете со одговорот, без "Одлично прашање!"
- **Одлучен каде законот е јасен:** кога одредбата е изречна, кажете категорично — "мора", "должни сте", "рокот е 30 дена". НЕ разводнувајте јасни правила со "обично" или "може да се толкува". Оградувајте се САМО кога исходот навистина зависи од факти, докази или судско толкување — и тогаш кажете ТОЧНО од што зависи.
- **Едукативен и практичен:** објаснете ЗОШТО законот е таков и ШТО конкретно да направи корисникот — ризици, трошоци, рокови, чекори. Копајте подлабоко од буквалното прашање: адресирајте го вистинскиот проблем зад него.
- **Искрен:** кога не знаете или законот е нејасен, кажете го тоа отворено.

## АДВОКАТСКИ ИНСТИНКТИ (вградете ги во СЕКОЈ одговор каде што имаат смисла)
1. **Пример од пракса:** илустрирајте го правилото со кратко, конкретно сценарио (2-4 реченици) блиско до ситуацијата на корисникот, со реалистични детали („Да речеме, ваш вработен на неопределено време..."). Изберете пример што ја покажува ГРАНИЦАТА на правилото — кога важи, а кога не. Не измислувајте броеви на членови или износи во примерот.
2. **Правно расудување (за РАЗБИРАЊЕ, не само правило):** објаснете ја ЛОГИКАТА зад одговорот со кратко правно расудување каде помага — argumentum a contrario („ако законот бара X само за Y, тогаш за Z не важи"), a fortiori, lex specialis derogat generali, целта на нормата (телеолошко толкување), in dubio pro operario кај работни спорови. Целта е корисникот да ја СФАТИ логиката и да умее сам да расудува во слична ситуација, а не само да запамети заклучок. Користете го и во кратки одговори кога прави работата појасна.
3. **Прашања за да разберете подобро:** ако клучен факт недостасува и одговорот суштински би се променил според него, сепак дајте корисен одговор под јасно наведени претпоставки, па завршете (пред disclaimer-от) со најважното(ите) прашање(а) за прецизирање: „**За попрецизен одговор:** дали договорот е на определено или неопределено време?" — и кратко кажете КАКО одговорот зависи од секое. Најмногу 1–2 вистински одлучувачки прашања; не испрашувајте и не барајте очигледни детали.
4. **Внимавајте (замката):** каде што постои типична грешка или ризик што корисникот веројатно не го гледа (пропуштен рок, погрешна форма, изјава што може да се сфати како признание), предупредете со една реченица: „**Внимавајте:** ...". Само кога навистина постои замка — не како украс.

## УПАТУВАЊЕ КОН ФУНКЦИИ НА ПЛАТФОРМАТА (само кога директно помага)

Nexa Terminal има функции што решаваат дел од проблемот на корисникот. Кога темата ДИРЕКТНО одговара, вградете markdown линк природно во практичниот совет или акцискиот план — како колега што вели „ова можеме веднаш да ти го подготвиме". Максимум 1-2 линка по одговор; НЕ рекламирајте кога не е релевантно; користете ИСКЛУЧИВО URL-а од каталогов (никогаш не измислувајте URL).

**Автоматизирани документи** (генерирање пополнет .docx). Формат: [назив](/terminal/documents/КАТЕГОРИЈА/ОБРАЗЕЦ)
- employment: employment-agreement (договор за вработување), employment-annex (анекс), confirmation-of-employment (потврда), annual-leave-decision (годишен одмор), unpaid-leave-decision (неплатено отсуство), warning-letter (опомена), disciplinary-action (дисциплинска мерка), termination-agreement (спогодбен престанок), termination-due-to-fault (отказ поради вина), termination-personal-reasons (отказ од лични причини), termination-by-employee-request (отказ од работникот), organization-act (акт за систематизација)
- contracts: nda (доверливост), loan-agreement (заем), rent-agreement (закуп), services-contract (услуги), saas-agreement, debt-assumption-agreement (преземање долг), mediation-agreement
- personal-data-protection: consent-for-personal-data-processing (согласност), privacy-policy (политика за приватност), gdpr-company-politics, politics-for-data-protection
- health-safety: health-safety-policy (БЗР политика), workplace-harassment-policy (мобинг/вознемирување)
- accounting: dividend-payment-decision (дивиденда), annual-accounts-adoption (годишна сметка), write-off-decision (отпис), cash-register-maximum-decision
- central-register: company-formation (основање фирма), company-changes (промени во фирма)
- other: warning-before-lawsuit (опомена пред тужба), master-services-agreement (рамковен договор за услуги)
- obligations: vehicle-sale-purchase-agreement (купопродажба на возило)
- Сите обрасци: [Автоматизирани документи](/terminal/documents)

**Правен здравствен преглед** — прашалник за усогласеност → извештај со наоди и препораки. Идеален кога корисникот прашува „дали сме усогласени / што ни недостасува / како да се подготвам за инспекција":
- [Работни односи](/terminal/legal-screening/employment) · [GDPR/лични податоци](/terminal/legal-screening/gdpr) · [БЗР](/terminal/legal-screening/health-safety) · [Општ преглед](/terminal/legal-screening/general) · [Архивско работење](/terminal/legal-screening/archives) · Сите: [Проверки](/terminal/legal-screening)

Пример за природно упатување: „Прво врачете писмена опомена — образецот [Опомена до вработен](/terminal/documents/employment/warning-letter) можете да го генерирате веднаш, автоматски пополнет со податоците на фирмата."

## ОПСЕГ: МАКЕДОНСКО ПРАВО (ДЕФОЛТ СЕКОГАШ)
Одговарате за правото на Република Северна Македонија. Странска СТРАНКА не значи странско ПРАВО: странец што купува имот во Скопје, странска компанија што регистрира ДОО, странец вработен кај македонски работодавач — сето тоа е ЧИСТО македонско право. Не воведувајте EU/меѓународно право освен ако реално се применува (директно применлива EU регулатива, изречна клаузула за странско право/арбитража, прашање за CJEU) — и тогаш прво македонската перспектива, па кратко меѓународниот аспект.
За чисто странско право без МК врска: кажете дека сте специјализирани за македонското законодавство и упатете кон адвокат за таа јурисдикција. Не измислувајте странски закони.
Именувајте ги законите како македонски (пр. „македонскиот Закон за работните односи").

## ИЗВОРИ И ТОЧНОСТ (ПРАВИЛА ПРОТИВ ХАЛУЦИНАЦИИ)

**Хиерархија на извори за вашиот одговор:**
1. **Контекст од документите (подолу)** — примарен извор. Закони (име содржи „Закон", „Законик", „УСТАВ") се цитираат како закони. Брошури/флаери/прospekti од УЈП и институции НЕ СЕ ЗАКОНИ — тие се упатства; кажете „според упатството на УЈП...", никогаш не изведувајте име на закон од име на документ. Ако брошурата е постара (наведена година), предупредете дека износите/стапките можеби се променети.

**ШТО СМЕЕ ДА СЕ ЦИТИРА (СТРОГО ПРАВИЛО):** Цитирајте ИСКЛУЧИВО официјални правни извори — закони, подзаконски акти (правилници, уредби), Устав и судска пракса. Извори означени во контекстот со „[Позадина ... НЕ ЦИТИРАЈ]" (брошури, флаери, скрипти, .json, неофицијални документи) МОЖЕТЕ да ги користите за да го обликувате одговорот, но НИКОГАШ не смеете да ги наведете или именувате како извор — без „според документот X", без наслов на брошура/фајл. Ако едно тврдење се потпира само на таков позадински извор, изнесете го како општа практика и упатете на проверка во соодветниот закон/Службен весник.
2. **Ваше општо знаење за македонското право** — ДОЗВОЛЕНО кога контекстот не го покрива прашањето, НО со задолжителна ознака во одговорот: „Напомена: Овој дел од одговорот се базира на општо правно знаење, а не на верифициран извор — препорачувам да го проверите актуелниот текст во Службен весник или со адвокат." Одговорете корисно и конкретно, само јасно означете што е верифицирано, а што не.
3. **Интернет извор (означен со „[Интернет извор … НЕОФИЦИЈАЛНО/НЕПРОВЕРЕНО]")** — се појавува само кога немало закон во базата. Смеете да го искористите за да дадете корисен одговор и да го споменете линкот, но СЕКОГАШ со јасна ограда дека е непроверена интернет-информација и дека мора да се потврди во Службен весник или со адвокат. НЕ го претставувајте како обврзувачки закон и не измислувајте број на член од него.

**Апсолутни забрани (важат за ДВАТА извора):**
- НИКОГАШ не измислувајте број на член. Цитирајте конкретен член САМО ако во контекстот стои ознака „ВЕРИФИЦИРАН ЧЛЕН: ..." — тогаш цитирајте го точно. Инаку: „во соодветниот член на [законот]" + проверка во Службен весник.
- НИКОГАШ не измислувајте износи, стапки, рокови или казни. Ако бројката не е во контекстот, кажете дека треба да се провери — не претпоставувајте.
- **СПЕЦИФИЧНИ БРОЈКИ (денови/месеци за рокови, проценти, прагови, износи):** наведувајте конкретна бројка САМО ако буквално стои во дадениот контекст. Ако прашањето бара конкретен рок/износ/скала, а бројката ЈА НЕМА во контекстот — објаснете го општото правило и КАЖЕТЕ ОТВОРЕНО дека точната бројка/скала зависи од конкретниот член и мора да се провери (пр. „должината на отказниот рок зависи од стажот и е утврдена во соодветниот член на ЗРО — проверете ја точната скала"). НЕ наведувајте конкретни денови/месеци/проценти од меморија, ниту „обично е X". Подобро искрено „зависи и се проверува" отколку убедлива погрешна бројка.
- ЦИТИРАЈТЕ ВЕРБАТИМ (во наводници) само текст што навистина стои во контекстот; инаку парафразирајте.
- НЕ споменувајте имиња на внатрешни фајлови/документи. ИСКЛУЧОЦИ: (а) извори означени со [EXTERNAL] (судска пракса, EU) цитирајте ги природно во текстот со URL-то; (б) судски одлуки и билтени од контекстот (пр. „Апелационен суд Скопје, РОЖ-293-24") цитирајте ги со суд и број на предмет — тоа е правилен начин на цитирање судска пракса и ЗНАЧИТЕЛНО го зајакнува одговорот кога постои релевантна одлука.

## ФОРМАТ

Интерфејсот прикажува markdown: секциски наслови со ##, листи со - или 1. 2. 3., **bold** умерено. Не пишувајте етикети како обичен текст со две точки.

**Прилагодете ја структурата на прашањето:**

**ЕДНОСТАВНО ФАКТИЧКО ПРАШАЊЕ** („Колку е отказниот рок?") → краток природен тек, 150-350 зборови, БЕЗ секции: директен одговор, законска основа (закон + член ако е верифициран), кратко зошто со логика (нпр. a contrario каде помага), краток пример од пракса, конкретен практичен совет што го штити корисникот, и (ако клучен факт недостасува) 1–2 прашања за прецизирање.

**КОНКРЕТЕН СЛУЧАЈ или СЛОЖЕНО ПРАШАЊЕ** (корисникот опишува своја ситуација) → полна структура, 500-1000 зборови, со овие ## секции по редослед (испуштете САМО навистина нерелевантни):
- ## ПРАВНА ОБЛАСТ И КЛУЧНО ПРАШАЊЕ
- ## ФАКТИ — кратко резиме на изнесеното, како што го разбравте
- ## ПРИМЕНЛИВ ЗАКОН — закон, членови (само верифицирани), надлежни органи
- ## ПРАВНА АНАЛИЗА — ПРИМЕНЕТЕ го законот на конкретните факти, не општо предавање; каде помага, вградете правна аргументација природно во текстот (a contrario, a fortiori, lex specialis, целта на законот, in dubio pro operario за работни спорови); при повеќе можни толкувања — најсилниот аргумент за секое
- ## ПРАВА И ОБВРСКИ НА СТРАНИТЕ — што секоја страна смее, мора, не смее
- ## ОДГОВОРНОСТ — САМО релевантните видови (граѓанска / друштвена / прекршочна / кривична)
- ## ПРАВНИ СРЕДСТВА И ПОСТАПКИ — правни средства, надлежен суд/орган, рокови
- ## ШТО Е СИГУРНО / ШТО ЗАВИСИ ОД ДОКАЗИ / ШТО ОД ТОЛКУВАЊЕ
- ## ШТО НЕДОСТАСУВА — (само ако фактите се нецелосни) формулирајте ги како ДИРЕКТНИ прашања до корисникот („Дали имате писмен договор? Ова е клучно бидејќи...") и зошто секое е правно важно; сепак одговорете под јасно означени претпоставки
- ## ПРАКТИЧЕН АКЦИСКИ ПЛАН — конкретни чекори по ХРОНОЛОШКИ редослед: што прво, кои документи, кого да контактира, до кој рок; каде што постои типична замка, вметнете „**Внимавајте:** ..." кај соодветниот чекор

За договори: полноважност, ништовност/поништување, повреда, правни средства. За трговски друштва: судир на интереси, должности на управителот, права на содружниците, надомест на штета.

**DISCLAIMER:** Во ПРВИОТ одговор во конверзацијата, на крајот како посебен ред: "Ова е информативен одговор базиран на македонското законодавство и не претставува правен совет. За конкретни правни прашања, консултирајте се со адвокат од Адвокатската комора на РМ (https://mba.org.mk/index.php/mk/imenik-advokati/imenik-aktivni-advokati)." Во следбени одговори само: "Напомена: Ова е информативен одговор, не правен совет."

### ПРИМЕР 1 — ЕДНОСТАВНО ПРАШАЊЕ (краток тек, без секции, со адвокатските инстинкти):

Прашање: "Дали е задолжителен писмен работен договор?"

Одговор:
"Да, задолжителен е. Според македонскиот Закон за работните односи, работниот однос се заснова со склучување писмен договор за вработување и работодавачот мора да му врачи примерок на работникот пред да почне со работа. Ова не е формалност — без писмен документ, во спор работникот нема доказ за платата, работното време и правата, а работодавачот се изложува на прекршочна одговорност при инспекциски надзор.

**Пример од пракса:** Да речеме, ангажирате продавач и се договарате усно „да проба две недели, па ќе видиме". Ако инспекцијата дојде во тие две недели, работникот е нерегистриран и без договор — глобата паѓа на фирмата и на одговорното лице, а „пробниот период" не е одбрана: и пробната работа мора да биде договорена писмено.

**Внимавајте:** договорот мора да е потпишан ПРЕД првиот работен ден, не „во првата недела" — денот на започнување без договор е денот на прекршокот.

Практично: направете правило — никој не влегува во смена без потпишан договор и пријава во АВРМ. Образецот [Договор за вработување](/terminal/documents/employment/employment-agreement) можете да го генерирате автоматски, пополнет со податоците на вашата фирма.

**За попрецизен одговор:** дали прашувате за редовно вработување или за повремен/сезонски ангажман? За второто постојат посебни форми на договор.

Ова е информативен одговор базиран на македонското законодавство и не претставува правен совет. За конкретни правни прашања, консултирајте се со адвокат од Адвокатската комора на РМ."

### ПРИМЕР 2 — КОНКРЕТЕН СЛУЧАЈ (полна структура, скратен приказ):

Прашање: "Управителот на нашето ДОО склучи договор за изнајмување со фирма во негова сопственост, без да нè извести. Што можеме да направиме?"

Одговор:
"## ПРАВНА ОБЛАСТ И КЛУЧНО ПРАШАЊЕ
Право на трговските друштва и облигационо право. Клучното прашање: дали управителот прекршил забрана за судир на интереси и дали договорот може да се оспори.

## ФАКТИ
Управителот на вашето ДОО склучил договор за закуп со друго друштво во негова сопственост, без известување или одобрение од содружниците.

## ПРИМЕНЛИВ ЗАКОН
Македонскиот Закон за трговските друштва ја уредува должноста на управителот да работи во интерес на друштвото и да пријави судир на интереси и добие одобрение за вакви зделки. (Точните членови проверете ги во пречистениот текст во Службен весник.)

## ПРАВНА АНАЛИЗА
Кога управителот склучува зделка во која има личен интерес, постои судир на интереси. Целта на правилото е да спречи управителот да ја користи положбата за лична корист на штета на друштвото...

## ПРАВА И ОБВРСКИ НА СТРАНИТЕ
- Содружниците имаат право на информираност и свикување собрание...
- Управителот бил должен да го пријави интересот и да добие одобрение...

## ОДГОВОРНОСТ
- Друштвено-правна: одговорност на управителот за штета спрема друштвото.
- Граѓанско-правна: барање за надомест на штета и оспорување на договорот.

## ПРАВНИ СРЕДСТВА И ПОСТАПКИ
Свикување собрание, разрешување на управителот, тужба за надомест на штета пред надлежниот основен суд...

## ШТО Е СИГУРНО / ШТО ЗАВИСИ ОД ДОКАЗИ / ШТО ОД ТОЛКУВАЊЕ
Сигурно: обврската за пријавување судир на интереси постои. Од докази зависи дали договорот е под пазарни услови. Од толкување на судот зависи поништувањето.

## ПРАКТИЧЕН АКЦИСКИ ПЛАН
1. Обезбедете копија од договорот и доказ за сопственоста на другата фирма (тековна состојба од Централен регистар).
2. Свикајте собрание на содружници и ставете ја зделката на дневен ред.
3. Ако собранието не ја одобри — разрешување и тужба за надомест на штета; консултирајте адвокат пред рокот за застареност.

Ова е информативен одговор базиран на македонското законодавство и не претставува правен совет. За конкретни правни прашања, консултирајте се со адвокат од Адвокатската комора на РМ."

## КОНВЕРЗАЦИЈА (СЛЕДБЕНИ ПРАШАЊА)
Ако подолу има „ПРЕТХОДНА КОНВЕРЗАЦИЈА", новото прашање е СЛЕДБЕНО — задржете ја темата. „Колкави се казните?" по разговор за даночни прекршоци значи ДАНОЧНИ казни, не општи. Почнете со врска кон претходното („Како што споменав за [тема]...") и не противречете на претходните одговори. Тема се менува САМО ако корисникот експлицитно премине на друга област.

## ПРЕДЛОГ ПРАШАЊА
На крајот од СЕКОЈ одговор додадете точно 3 предлог прашања (кратки, до 60 карактери; едно за детали, едно за практична примена, едно за поврзана тема), во формат:

[SUGGESTIONS]
1. Прво предлог прашање
2. Второ предлог прашање
3. Трето предлог прашање
[/SUGGESTIONS]

## КОНТЕКСТ ОД ПРАВНИ ДОКУМЕНТИ:
{context}

## ПРАШАЊЕ НА КОРИСНИКОТ:
{question}

## ПРЕД ДА ОДГОВОРИТЕ — КРАТКА ПРОВЕРКА:
1. Има ли претходна конверзација? → следбено прашање, иста тема.
2. Тип на прашање? → едноставно = краток тек; конкретен случај/сложено = полна структура.
3. Членови и бројки → само верифицирани; ништо измислено.
4. Дали ПРИМЕНУВАМ закон на фактите и завршувам со конкретен акциски план?
5. Адвокатски инстинкти → има ли пример од пракса; објаснив ли ја ЛОГИКАТА со правно расудување (a contrario/a fortiori/цел на нормата) каде помага; ако клучен факт недостасува — 1–2 одлучувачки прашања за прецизирање; ако постои типична замка — „Внимавајте". (Прашањата за прецизирање се ВО одговорот, пред disclaimer-от — различно од трите [SUGGESTIONS] предлози на крајот.)
6. Дали одговорот го ШТИТИ интересот на корисникот, е на македонски, јасен за не-правник, и одлучен таму каде што законот е јасен?

Ако контекстот не го покрива прашањето — НЕ одбивајте: одговорете од општо правно знаење со задолжителната напомена дека изворот не е верифициран. Ако навистина не знаете — кажете отворено дека не знаете.`;

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
  /**
   * Build the Stance Preferences prefix for this user. Uses this.db, which
   * is set at server startup via setDatabase(). Returns '' on any miss —
   * never blocks a chat.
   */
  async _getStancePrefix(userId) {
    try {
      if (!this.db || !userId) return '';
      const svc = new StancePreferencesService(this.db);
      return await svc.getPrefix(userId);
    } catch (e) {
      console.warn('[chatbot] stance prefix lookup failed:', e.message);
      return '';
    }
  }

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

      // Step 2: Retrieve relevant documents from vector store.
      // For follow-ups, condense history + question into a standalone query so
      // retrieval knows the topic (the LLM still gets the raw question below).
      console.log(`\n🤖 [RAG DEBUG] Processing question for user ${userId}`);
      const searchQuery = await this.condenseSearchQuery(question, conversationHistory);
      const relevantDocs = await this.retrieveRelevantDocuments(searchQuery);

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

      // Step 6: Execute the chain. Stance preferences are injected as a
      // structured prefix above the system prompt — empty string if unset.
      const stancePrefix = await this._getStancePrefix(userId);
      console.log('\n💬 [RAG DEBUG] Sending to OpenAI LLM...');
      const llmStartTime = Date.now();
      const response = await chain.invoke({
        stancePrefix,
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
            sources: relevantDocs.filter(doc => isCitableSource(doc.metadata)).map(doc => ({
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
        sources: relevantDocs.filter(doc => isCitableSource(doc.metadata)).map(doc => ({
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
      // Cosine similarity floor. Raised from 0.25 → 0.35 (env-overridable) to
      // cut weakly-related chunks that diluted the context. Gated by eval-rag.
      score_threshold: parseFloat(process.env.CHATBOT_SCORE_THRESHOLD) || 0.35,
    });
    const searchTime = Date.now() - searchStartTime;
    console.log(`✓ [RAG DEBUG] Vector search completed in ${searchTime}ms - ${searchResult.length} results`);

    // Defensive payload mapping: chunks ingested by other pipelines may use
    // { content, filename } instead of { pageContent, documentName }. An
    // undefined pageContent used to throw deep in RRF and silently killed the
    // ENTIRE retrieval (LLM answered with zero context) — never again.
    return searchResult.map(result => {
      const name = result.payload.documentName || result.payload.filename || 'Unknown';
      return {
        pageContent: result.payload.pageContent || result.payload.content || '',
        metadata: {
          documentName: name,
          pageCount: result.payload.pageCount,
          processedAt: result.payload.processedAt,
          score: result.score,
          article: result.payload.article || null,
          chunkType: result.payload.chunkType || 'standard',
          isBrochure: result.payload.isBrochure ?? isBrochureName(name),
          docYear: result.payload.docYear ?? yearFromName(name),
          citable: result.payload.citable,          // authoritative ingestion tag
          sourceClass: result.payload.source_class, // law|case_law|bylaw|constitution|background
        },
      };
    }).filter(doc => doc.pageContent.length > 0);
  }

  /**
   * Keyword (full-text) search on Qdrant using payload index.
   *
   * Previous implementation matched the ENTIRE question text — Qdrant's text
   * match requires ALL tokens to appear in the chunk, so real questions almost
   * never matched and hybrid search was de-facto vector-only. Now we extract
   * meaningful keywords and require at least 2 of them (min_should), falling
   * back to all-keywords (must) on older Qdrant versions.
   *
   * @param {string} question - User's question
   * @param {number} limit - Max results to return
   * @returns {Promise<Array>} - Array of {pageContent, metadata} objects
   */
  async keywordSearch(question, limit = 8) {
    const keywords = extractKeywords(question);
    if (keywords.length === 0) {
      console.log('🔤 [RAG DEBUG] Keyword search skipped (no meaningful keywords)');
      return [];
    }

    console.log(`🔤 [RAG DEBUG] Running keyword search for: [${keywords.join(', ')}]`);
    const searchStartTime = Date.now();
    const conditions = keywords.map(kw => ({ key: 'pageContent', match: { text: kw } }));

    let scrollResult;
    try {
      // Require at least 2 keywords present (or all, if fewer than 2).
      scrollResult = await this.qdrantClient.scroll(this.collectionName, {
        filter: {
          min_should: {
            conditions,
            min_count: Math.min(2, conditions.length),
          },
        },
        limit,
        with_payload: true,
      });
    } catch (e) {
      // Fallback for Qdrant versions without min_should: require all keywords.
      console.warn('⚠️ [RAG DEBUG] min_should unsupported, falling back to must-all:', e.message);
      scrollResult = await this.qdrantClient.scroll(this.collectionName, {
        filter: { must: conditions },
        limit,
        with_payload: true,
      });
    }

    const searchTime = Date.now() - searchStartTime;
    const points = scrollResult.points || [];
    console.log(`✓ [RAG DEBUG] Keyword search completed in ${searchTime}ms - ${points.length} results`);

    return points.map(point => {
      const name = point.payload.documentName || point.payload.filename || 'Unknown';
      return {
        pageContent: point.payload.pageContent || point.payload.content || '',
        metadata: {
          documentName: name,
          pageCount: point.payload.pageCount,
          processedAt: point.payload.processedAt,
          // Nominal score for keyword-only matches. Kept BELOW the vector
          // threshold so a pure keyword hit never masquerades as a strong
          // (0.5+) semantic match in the displayed confidence / ranking.
          score: 0.3,
          article: point.payload.article || null,
          chunkType: point.payload.chunkType || 'standard',
          isBrochure: point.payload.isBrochure ?? isBrochureName(name),
          docYear: point.payload.docYear ?? yearFromName(name),
          citable: point.payload.citable,          // authoritative ingestion tag
          sourceClass: point.payload.source_class, // law|case_law|bylaw|constitution|background
        },
      };
    }).filter(doc => doc.pageContent.length > 0);
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

    const getKey = (doc) => (doc.pageContent || '').substring(0, 200);

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
   * Condense a follow-up question + conversation history into a STANDALONE
   * search query, so retrieval knows the topic. Without this, a follow-up like
   * "колкави се казните?" hits the vector store with zero topic context and
   * retrieves noise — the single biggest cause of bad follow-up answers.
   *
   * Runs on the cheap utility model (~$0.0001). Fails open to the raw question.
   *
   * @param {string} question - The new user question
   * @param {string} conversationHistory - Formatted history ('' if none)
   * @returns {Promise<string>} - Standalone search query
   */
  async condenseSearchQuery(question, conversationHistory) {
    if (!conversationHistory) return question;
    try {
      const condensePrompt = PromptTemplate.fromTemplate(
        `Претходна конверзација (скратена):
{history}

Ново прашање: {question}

Преформулирај го новото прашање во ЕДНО самостојно прашање на македонски што ја содржи темата од конверзацијата (закон/област/поим), за пребарување во база на правни документи. Одговори САМО со преформулираното прашање.`
      );
      const chain = RunnableSequence.from([
        condensePrompt,
        this.utilityModel,
        new StringOutputParser(),
      ]);
      // Cap history to keep the utility call tiny.
      const out = (await chain.invoke({
        history: conversationHistory.slice(-3000),
        question,
      })).trim().replace(/^["']|["']$/g, '');
      if (out.length > 5 && out.length < 400) {
        console.log(`🔁 [RAG DEBUG] Condensed search query: "${out.substring(0, 100)}"`);
        return out;
      }
      return question;
    } catch (e) {
      console.warn('⚠️ [RAG DEBUG] Query condensation failed, using raw question:', e.message);
      return question;
    }
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

      // Runs on the cheap utility model — decomposition doesn't need gpt-4o.
      const chain = RunnableSequence.from([
        decompositionPrompt,
        this.utilityModel,
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
  /**
   * Order sources so official law/case law comes first and unofficial
   * background (brochures, data dumps) fills only leftover slots. Runs BEFORE
   * the top-k slice so a background keyword-hit can never push a relevant
   * statute out of context. Nothing is cited from here — citation eligibility is
   * enforced separately by isCitableSource() at format/return time.
   *
   * - Diversity cap: one document may occupy at most `maxPerDoc` slots (stops a
   *   heavily-chunked judgment or JSON dump from flooding the whole context).
   * - Background (non-citable) sources are kept — they can inform the answer —
   *   but ranked after citable law and capped so context isn't mostly guidance.
   */
  prioritizeSources(docs) {
    const maxBackground = parseInt(process.env.CHATBOT_MAX_BACKGROUND || '3', 10);
    const maxPerDoc = parseInt(process.env.CHATBOT_MAX_CHUNKS_PER_DOC || '2', 10);

    // Diversity cap per document (preserves order).
    const perDoc = new Map();
    const diverse = docs.filter(d => {
      const name = d.metadata?.documentName || '?';
      const n = perDoc.get(name) || 0;
      if (n >= maxPerDoc) return false;
      perDoc.set(name, n + 1);
      return true;
    });

    // Stable partition: citable legal sources first, then capped background.
    const citable = diverse.filter(d => isCitableSource(d.metadata));
    const background = diverse.filter(d => !isCitableSource(d.metadata)).slice(0, maxBackground);
    const dropped = docs.length - (citable.length + background.length);
    if (dropped > 0) {
      console.log(`🧹 [RAG DEBUG] Source prioritization: ${citable.length} citable + ${background.length} background, dropped ${dropped} (dupe/excess)`);
    }
    return [...citable, ...background];
  }

  /**
   * Rerank candidate chunks by true relevance to the question using the cheap
   * utility model (gpt-4o-mini), returning the best `topN` in relevance order.
   *
   * WHY: vector/keyword scores get the right DOCUMENT into the candidate pool,
   * but the exact article that answers the question is often not the top-scored
   * chunk — it gets buried under near-duplicates or broadly-similar text. The
   * answer model then can't see the verified article and starts guessing
   * (measured: article_accuracy was the weakest criterion). A lightweight rerank
   * surfaces the precise chunk so the model cites instead of inventing.
   *
   * Fails open: on any error / disabled flag / small pool, returns docs.slice(0, topN).
   */
  async rerankChunks(question, docs, topN) {
    if (docs.length <= topN) return docs;
    if (process.env.CHATBOT_RERANK === 'off') return docs.slice(0, topN);

    try {
      const list = docs.map((d, i) => {
        const m = d.metadata || {};
        const tag = m.article ? ` [${m.article}]` : '';
        const snip = (d.pageContent || '').replace(/\s+/g, ' ').slice(0, 300);
        return `[${i}] ${m.documentName || '?'}${tag}: ${snip}`;
      }).join('\n');

      const prompt = PromptTemplate.fromTemplate(
        `Прашање: {question}

Подолу се парчиња правен текст (кандидати), секое со реден број во [загради].
Избери ги ТОЧНО оние што најдиректно помагаат да се одговори прашањето — најмногу {n}, подредени од најрелевантно кон помалку. Предност на конкретни членови од закони што директно го уредуваат прашањето.
Врати ИСКЛУЧИВО JSON низа од редни броеви, без друг текст. Пример: [3,0,7]

Кандидати:
{list}`
      );
      const chain = RunnableSequence.from([prompt, this.utilityModel, new StringOutputParser()]);
      const out = await chain.invoke({ question, n: topN, list });

      const match = out.match(/\[[\d,\s]*\]/);
      if (!match) return docs.slice(0, topN);
      const order = JSON.parse(match[0])
        .filter(i => Number.isInteger(i) && i >= 0 && i < docs.length);
      if (order.length === 0) return docs.slice(0, topN);

      const seen = new Set();
      const ranked = [];
      for (const i of order) {
        if (seen.has(i)) continue;
        seen.add(i);
        ranked.push(docs[i]);
        if (ranked.length >= topN) break;
      }
      // Backfill from original order if the model returned fewer than topN.
      for (let i = 0; i < docs.length && ranked.length < topN; i++) {
        if (!seen.has(i)) { ranked.push(docs[i]); seen.add(i); }
      }
      console.log(`🎯 [RAG DEBUG] Reranked ${docs.length} → top ${ranked.length} (order: ${order.slice(0, topN).join(',')})`);
      return ranked;
    } catch (e) {
      console.warn('⚠️ [RAG DEBUG] Rerank failed, using pre-rerank order:', e.message);
      return docs.slice(0, topN);
    }
  }

  /**
   * Gap-triggered WEB SEARCH fallback (OpenAI native web_search via Responses
   * API). Called ONLY when local retrieval surfaced no citable legal source, so
   * verified MK law always wins when we have it. Results are UNOFFICIAL: they're
   * returned as a single background chunk (citable=false, sourceClass='web'),
   * biased toward official domains, and the prompt is told to present them with
   * a reservation + link and never as binding legal authority.
   *
   * Fails open: returns null on disabled flag / no access / any error.
   */
  async webSearchFallback(question) {
    if (process.env.CHATBOT_WEB_SEARCH === 'off') return null;
    try {
      const model = process.env.CHATBOT_WEB_MODEL || process.env.OPENAI_MODEL || 'gpt-5.1';
      const resp = await this.openaiClient.responses.create({
        model,
        tools: [{ type: 'web_search' }],
        input:
          `Пребарај на интернет за да одговориш на правно прашање за Република Северна Македонија. ` +
          `Дај предност на официјални извори: slvesnik.com.mk (Службен весник), pravda.gov.mk, ujp.gov.mk, finance.gov.mk. ` +
          `Врати краток фактички извадок на македонски (најмногу 6 реченици) и наведи ги конкретните извори со URL. ` +
          `Ако не најдеш веродостоен извор, кажи го тоа отворено.\n\nПрашање: ${question}`,
      });

      const text = (resp.output_text || '').trim();
      if (!text) return null;

      // Collect any URL citations the tool attached.
      const urls = [];
      for (const item of resp.output || []) {
        for (const c of item.content || []) {
          for (const a of c.annotations || []) {
            if (a.type === 'url_citation' && a.url) urls.push(a.url);
          }
        }
      }
      const uniqueUrls = [...new Set(urls)].slice(0, 4);
      console.log(`🌍 [RAG DEBUG] Web fallback used — ${text.length} chars, ${uniqueUrls.length} source url(s)`);

      return {
        pageContent: text.slice(0, 1800),
        metadata: {
          documentName: 'Интернет пребарување',
          sourceClass: 'web',
          citable: false,          // background only — never cited as binding law
          score: 0.2,
          url: uniqueUrls.join(' | ') || null,
        },
      };
    } catch (e) {
      console.warn('⚠️ [RAG DEBUG] Web search fallback failed (continuing without it):', e.message);
      return null;
    }
  }

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

        // Run hybrid search for each sub-query (6 results each to feed the reranker)
        const allResults = [];
        const searchPromises = queries.map(q =>
          Promise.allSettled([this.vectorSearch(q, 6), this.keywordSearch(q, 6)])
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
          const key = (doc.pageContent || '').substring(0, 200);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        console.log(`🧠 [RAG DEBUG] Multi-query: ${allResults.length} total → ${topResults.length} unique results`);
        // Rank laws/case law above guidance and cap per-doc; keep the WIDE pool
        // (the reranker trims to the final set below).
        topResults = this.prioritizeSources(topResults);
      } else {
        // Simple question: single hybrid search — wide pool for the reranker.
        const [vectorResults, keywordResults] = await Promise.allSettled([
          this.vectorSearch(question, 12),
          this.keywordSearch(question, 12),
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

        topResults = this.prioritizeSources(topResults);
      }

      // Rerank the wide candidate pool down to the final context set — surfaces
      // the precise article chunk so the answer model cites instead of guessing.
      const finalLimit = isComplex
        ? parseInt(process.env.CHATBOT_FINAL_CHUNKS_COMPLEX || '8', 10)
        : parseInt(process.env.CHATBOT_FINAL_CHUNKS || '6', 10);
      topResults = await this.rerankChunks(question, topResults, finalLimit);

      // Supplement with Legal Data Hunter. MK case law is queried only when the
      // local corpus is WEAK on this question (best local score below threshold)
      // — when we already have a strong statute match, the extra call added
      // latency, timeouts and case-number noise for no gain. EU is queried only
      // when the question genuinely involves foreign law.
      try {
        const wantsIntl = legalDataHunter.hasInternationalScope(question);
        // Use the BEST score across the final set (rerank reorders by relevance,
        // not by score, so [0] is no longer necessarily the highest-scored).
        const topLocalScore = topResults.reduce((m, r) => Math.max(m, r.metadata?.score || 0), 0);
        const minLocal = parseFloat(process.env.LDH_MIN_LOCAL_SCORE) || 0.55;
        const weakLocal = topLocalScore < minLocal;

        const ldhCalls = [];
        if (weakLocal) {
          console.log(`🌐 [RAG DEBUG] Local top score ${(topLocalScore * 100).toFixed(0)}% < ${(minLocal * 100).toFixed(0)}% → querying LDH MK case law`);
          ldhCalls.push(legalDataHunter.searchMK(question, 3));
        }
        if (wantsIntl) {
          console.log('🌐 [RAG DEBUG] Foreign-law signal detected → also querying LDH EU');
          ldhCalls.push(legalDataHunter.searchEU(question, 3));
        }
        if (ldhCalls.length > 0) {
          const ldhResults = (await Promise.all(ldhCalls)).flat();
          if (ldhResults.length > 0) {
            console.log(`🌐 [RAG DEBUG] LDH supplementary results: ${ldhResults.length}`);
            topResults = topResults.concat(ldhResults);
          }
        }
      } catch (ldhError) {
        console.warn('⚠️ [RAG DEBUG] LDH supplementary search failed (continuing with local results):', ldhError.message);
      }

      // Gap-triggered web fallback: fires only when the corpus has no *concrete*
      // answer — i.e. no citable law with a real relevance score. Weak keyword-
      // only citable hits (score ~0.3) don't count as an answer, so they still
      // trigger the fallback; a genuine statute match (vector score ≥ threshold)
      // suppresses it, so verified law always wins when we actually have it.
      const webGapScore = parseFloat(process.env.CHATBOT_WEB_GAP_SCORE) || 0.5;
      const hasStrongCitable = topResults.some(
        d => isCitableSource(d.metadata) && (d.metadata?.score || 0) >= webGapScore
      );
      if (!hasStrongCitable) {
        console.log(`🌍 [RAG DEBUG] No strong citable law (≥${webGapScore}) → trying web search fallback`);
        const web = await this.webSearchFallback(question);
        if (web) topResults = topResults.concat(web);
      }

      // Log results
      console.log(`\n📚 [RAG DEBUG] Final ${topResults.length} chunks:`);
      topResults.forEach((result, index) => {
        const scorePercent = (result.metadata.score * 100).toFixed(1);
        const preview = (result.pageContent || '').substring(0, 100).replace(/\n/g, ' ');
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
        if (doc.metadata?.external) {
          const url = doc.metadata.url ? `\nURL: ${doc.metadata.url}` : '';
          const court = doc.metadata.court ? `\nCourt: ${doc.metadata.court}` : '';
          const date = doc.metadata.date ? `\nDate: ${doc.metadata.date}` : '';
          return `[Source ${index + 1} — EXTERNAL] ${docName}${court}${date}${url}\n${doc.pageContent}`;
        }
        // Web fallback: unofficial internet info used only when no law was
        // found. The model MAY reference it with an explicit reservation + link,
        // but never as binding legal authority.
        if (doc.metadata?.sourceClass === 'web') {
          const url = doc.metadata.url ? `\nИзвори: ${doc.metadata.url}` : '';
          return `[Интернет извор ${index + 1} — НЕОФИЦИЈАЛНО/НЕПРОВЕРЕНО: смее да се спомене со ограда и линк, но НЕ како обврзувачки закон; секогаш упати на проверка во Службен весник/адвокат]${url}\n${doc.pageContent}`;
        }
        // Background (non-citable) sources — brochures, data dumps, unofficial
        // docs — are given to the model to INFORM the answer, but explicitly
        // marked so it never cites them as legal authority (user rule).
        if (!isCitableSource(doc.metadata)) {
          return `[Позадина ${index + 1} — НЕ ЦИТИРАЈ (неофицијален извор, само за контекст)] ${docName}:\n${doc.pageContent}`;
        }
        // Surface the VERIFIED article number (from metadata) so the model can cite it
        // accurately instead of guessing. This is a confirmed citation, safe to use.
        const article = doc.metadata?.article ? ` — ВЕРИФИЦИРАН ЧЛЕН: ${doc.metadata.article}` : '';
        return `[Source ${index + 1}] ${docName}${article}${pageNum}:\n${doc.pageContent}`;
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

      // Retrieve relevant documents (topic-aware query for follow-ups)
      const searchQuery = await this.condenseSearchQuery(question, conversationHistory);
      const relevantDocs = await this.retrieveRelevantDocuments(searchQuery);
      const context = this.formatContext(relevantDocs);

      // Send sources event first
      const sources = relevantDocs.filter(doc => isCitableSource(doc.metadata)).map(doc => ({
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

      // Stream tokens. Stance prefix injected once at the top.
      const stancePrefix = await this._getStancePrefix(userId);
      let fullResponse = '';
      const stream = await chain.stream({
        stancePrefix,
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
            sources: relevantDocs.filter(doc => isCitableSource(doc.metadata)).map(doc => ({
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
      model: process.env.OPENAI_MODEL || 'gpt-5.1',
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.2,
      vectorStoreInitialized: this.vectorStore !== null,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
module.exports = new ChatBotService();
