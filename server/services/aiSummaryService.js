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

const MODEL = process.env.OPENAI_UTILITY_MODEL || 'gpt-4o-mini';

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
  return parts.join(' — ') || 'Барање за помош од професионалец.';
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
      'Резимирај: (1) ситуацијата на корисникот, (2) што точно бара/сака да му провери професионалец, (3) правната област ако е јасна. Не вклучувај лични контакт податоци.';
    const user =
      `Вид на барање: ${input.type}\n` +
      (input.subject ? `Наслов: ${input.subject}\n` : '') +
      (input.question ? `\nПрашање на корисникот:\n${input.question}\n` : '') +
      (input.transcript ? `\nИзвадок од разговорот со AI:\n${input.transcript}\n` : '');

    const resp = await api.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 320,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    });
    const out = resp?.choices?.[0]?.message?.content?.trim();
    return out || fallbackSummary(input);
  } catch (e) {
    console.warn('[aiSummary] summarize failed, using fallback:', e.message);
    return fallbackSummary(input);
  }
}

module.exports = { summarizeConversation };
