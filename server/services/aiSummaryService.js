/**
 * AI Summary service — a tiny, standalone summarizer for the Pro request board.
 *
 * When an admin approves a request onto the open board, we email eligible Pros a
 * SHORT summary of the AI↔user conversation plus what the user is asking for, so
 * a Pro can decide whether to claim it without opening the platform.
 *
 * Deliberately decoupled from ChatBotService (the RAG engine): this only needs a
 * cheap chat completion. It lazily instantiates the OpenAI client and ALWAYS
 * fails safe — if the model/key is unavailable it returns a trimmed fallback so
 * the approval flow is never blocked.
 */

const OpenAI = require('openai');
const { redactPii, redactPiiKeepLines } = require('../utils/redactPii');
const aiModels = require('../config/aiModels');

const MODEL = aiModels.OPENAI_UTILITY_MODEL;

let _client = null;
function client() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY) return null;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

/** Deterministic, no-LLM fallback summary (used on any error / missing key). */
function fallbackSummary({ subject, question, transcript }) {
  const parts = [];
  if (subject) parts.push(subject);
  if (question) parts.push(clip(question, 600));
  else if (transcript) parts.push(clip(transcript, 600));
  return redactPii(parts.join(' — ')) || 'Барање за помош од професионалец.';
}

/**
 * Produce a short Macedonian summary (3–5 sentences) of the conversation and the
 * concrete ask, phrased for a Pro deciding whether to take the case.
 * @returns {Promise<string>}
 */
async function summarizeConversation({ subject, question, transcript, type } = {}) {
  const input = {
    subject: clip(subject, 240),
    question: clip(question, 4000),
    transcript: clip(transcript, 6000),
    type: type === 'contract_review' ? 'преглед на документ' : 'правно прашање',
  };
  const api = client();
  if (!api) return fallbackSummary(input);

  try {
    const sys =
      'Ти си асистент што подготвува кратко резиме на разговор меѓу правен AI и корисник (сопственик на бизнис), за да му помогне на адвокат да одлучи дали да го преземе случајот. ' +
      'Пиши на македонски, неутрално и конкретно. 3–5 реченици. Без поздрав, без правни совети, без измислување факти. ' +
      'Резимирај: (1) ситуацијата на корисникот, (2) што точно бара/сака да му провери професионалец, (3) правната област ако е јасна. ' +
      'АНОНИМИЗИРАЈ целосно: НЕ вклучувај имиња на лица или фирми, адреси, е-пошта, телефони, ЕМБГ/ЕДБ или матични броеви, ниту било каков податок што може да ја открие идентитетот на корисникот или трети лица. ' +
      'Наместо конкретни имиња користи неутрални описи (на пр. „корисникот", „фирмата", „вработен", „друга страна").';
    const user =
      `Вид на барање: ${input.type}\n` +
      (input.subject ? `Наслов: ${input.subject}\n` : '') +
      (input.question ? `\nПрашање на корисникот:\n${input.question}\n` : '') +
      (input.transcript ? `\nИзвадок од разговорот со AI:\n${input.transcript}\n` : '');

    const resp = await api.chat.completions.create(aiModels.completionParams({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 320,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    }, { effort: aiModels.EFFORT_UTILITY }));
    const out = resp?.choices?.[0]?.message?.content?.trim();
    return out ? redactPii(out) : fallbackSummary(input);
  } catch (e) {
    console.warn('[aiSummary] summarize failed, using fallback:', e.message);
    return fallbackSummary(input);
  }
}

/**
 * Anonymize user-authored text before a Pro sees it. Takes a map of fields
 * ({ question, transcript, ... }) and returns the same keys with personal data
 * replaced by neutral descriptors — names of people/companies, addresses,
 * contacts, IDs. The legal substance is kept verbatim so the Pro can still help.
 * redactPii always runs on top (catches contacts/IDs even if the LLM misses one);
 * on any failure / missing key the deterministic redaction alone is returned.
 * @param {Object<string,string>} fields
 * @returns {Promise<Object<string,string>>}
 */
async function anonymizeForPro(fields = {}) {
  const input = {};
  for (const [k, v] of Object.entries(fields)) {
    const t = clip(v, 6000);
    if (t) input[k] = t;
  }
  const out = {};
  for (const k of Object.keys(fields)) out[k] = input[k] ? redactPiiKeepLines(input[k]) : (fields[k] ?? null);
  const api = client();
  if (!api || !Object.keys(input).length) return out;

  try {
    const sys =
      'Ти си алатка за анонимизација. Добиваш JSON објект со текстови што корисник (сопственик на бизнис) ги напишал или ги добил од правен AI. ' +
      'Врати JSON објект со ИСТИТЕ клучеви, каде секој текст е анонимизиран: замени ги имињата на лица и фирми, адресите, е-поштата, телефоните, ' +
      'ЕМБГ/ЕДБ/матични броеви, броеви на сметки, регистарски таблички и секој друг податок што може да го открие идентитетот на корисникот или трети лица ' +
      'со неутрални описи во загради (на пр. [корисникот], [фирмата], [вработен], [друга страна], [адреса]). ' +
      'Ова важи и за САМО лично име или презиме, прекар или кратенка (на пр. „Марија доцни“ → „[вработен] доцни“), во СЕКОЈ клуч, вклучително и транскриптот. ' +
      'Износите, роковите, датумите и броевите на членови од закони задржи ги. Задржи ги новите редови. ' +
      'Сè друго (правната суштина, прашањата, фактите, AI одговорите) задржи го ДОСЛОВНО — не скратувај, не резимирај, не додавај ништо.';
    const resp = await api.chat.completions.create(aiModels.completionParams({
      model: MODEL,
      temperature: 0,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }, { effort: aiModels.EFFORT_UTILITY }));
    const parsed = JSON.parse(resp?.choices?.[0]?.message?.content || '{}');
    for (const k of Object.keys(input)) {
      if (typeof parsed[k] === 'string' && parsed[k].trim()) out[k] = redactPiiKeepLines(parsed[k]);
    }
  } catch (e) {
    console.warn('[aiSummary] anonymizeForPro failed, using pattern redaction:', e.message);
  }
  return out;
}

module.exports = { summarizeConversation, anonymizeForPro };
