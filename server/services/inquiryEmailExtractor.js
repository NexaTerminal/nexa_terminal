/**
 * Inquiry Email Extractor — the AI assist behind the admin „Внеси ново барање" form.
 *
 * The satellite sites (samodaprasham.mk, immigration.mk, macedoniancitizenship.mk, …)
 * forward client enquiries to info@nexa.mk. An admin used to read each email, strip the
 * personal data by hand, and retype it into the inquiry form. This service does that
 * reading: given the raw email text it returns a STRUCTURED DRAFT —
 *   - contact fields (name/email/phone) extracted verbatim → the private panel, and
 *   - an ANONYMIZED topic + summary + a best-effort classification (city, categories,
 *     procedure, language, urgency) → the board-facing fields.
 *
 * It only drafts; nothing is persisted. The admin reviews/edits and publishes through the
 * existing create endpoint, so validation/board/privacy are untouched.
 *
 * Mirrors aiSummaryService.js: lazy OpenAI client, cheap utility model, JSON mode, and it
 * ALWAYS fails safe — on any error / missing key it returns an empty-ish draft (with the raw
 * text echoed into originalEmailBody) so the admin can still fill the form by hand.
 */

const OpenAI = require('openai');
const { redactPii } = require('../utils/redactPii');
const {
  INQUIRY_SOURCES, INQUIRY_CATEGORIES, INQUIRY_CITIES, INQUIRY_LANGUAGES, INQUIRY_URGENCY,
} = require('../constants/inquiryEnums');
const { isValidProcedure, categoriesForProcedure, PROCEDURE_TEMPLATES } = require('../config/procedureTemplates');

const aiModels = require('../config/aiModels');
const MODEL = aiModels.OPENAI_UTILITY_MODEL;
const PROCEDURE_KEYS = Object.keys(PROCEDURE_TEMPLATES);

let _client = null;
function client() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY) return null;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n);
const oneOf = (v, list, dflt = null) => (list.includes(v) ? v : dflt);

/** Empty-but-valid draft shape (used as the fail-safe and the coercion base). */
function emptyDraft(rawText) {
  return {
    source: null,
    topic: '',
    summary: '',
    city: null,
    language: null,
    urgency: 'standard',
    categories: [],
    procedureType: null,
    inquirerName: '',
    inquirerEmail: '',
    inquirerPhone: '',
    originalEmailBody: clip(rawText, 20000),
  };
}

/**
 * Coerce the model's free-form JSON into a draft with ONLY valid enum tokens. Anything
 * unrecognized becomes null/empty so the admin notices and fills it. topic + summary get
 * the redactPii safety net (contact fields are deliberately left intact for the private
 * panel). A procedure with no categories derives them, matching the form's behavior.
 */
function coerce(raw, rawText) {
  const d = emptyDraft(rawText);

  d.source = oneOf(raw.source, INQUIRY_SOURCES);
  d.city = oneOf(raw.city, INQUIRY_CITIES);
  d.language = oneOf(raw.language, INQUIRY_LANGUAGES);
  d.urgency = oneOf(raw.urgency, INQUIRY_URGENCY, 'standard');
  d.procedureType = isValidProcedure(raw.procedureType) ? raw.procedureType : null;

  d.categories = Array.isArray(raw.categories)
    ? Array.from(new Set(raw.categories.filter((c) => INQUIRY_CATEGORIES.includes(c))))
    : [];
  if (d.procedureType && d.categories.length === 0) {
    d.categories = categoriesForProcedure(d.procedureType).filter((c) => INQUIRY_CATEGORIES.includes(c));
  }

  // Board-facing text — anonymize as a belt over the model's own anonymization.
  d.topic = redactPii(clip(raw.topic, 240));
  d.summary = redactPii(clip(raw.summary, 1200));

  // Private contact fields — kept verbatim (never shown on the board).
  d.inquirerName = clip(raw.inquirerName, 240);
  d.inquirerEmail = clip(raw.inquirerEmail, 240);
  d.inquirerPhone = clip(raw.inquirerPhone, 64);

  return d;
}

const SYSTEM_PROMPT =
  'Ти си асистент што обработува е-пошти со правни барања од клиенти, пристигнати преку сателитски веб-страници на Nexa. ' +
  'Од суровиот текст на е-поштата извлечи структуриран опис за внатрешна табла со барања. Врати ИСКЛУЧИВО валиден JSON објект. ' +
  'Пиши ги „topic" и „summary" на македонски (освен ако барањето е јасно на друг јазик). ' +
  'КЛУЧНО — АНОНИМИЗАЦИЈА: во „topic" и „summary" НЕ смее да има имиња на лица/фирми, адреси, е-пошта, телефони, ЕМБГ/ЕДБ или матични броеви, ниту било каков податок што открива идентитет. Користи неутрални описи („клиентот", „странски државјанин", „фирма"). ' +
  'Личните контакт податоци стави ги ОДВОЕНО во полињата inquirerName/inquirerEmail/inquirerPhone (таму дозволено е вистинско име/е-пошта/телефон; ако нема, остави празно). ' +
  'JSON полиња: ' +
  'topic (краток наслов, до 240 знаци), ' +
  'summary (2–4 реченици, анонимизирано, најмалку 40 знаци), ' +
  `city (еден од: ${INQUIRY_CITIES.join(', ')}; „Anywhere" ако е флексибилно; null ако е непознато), ` +
  `language (еден од: ${INQUIRY_LANGUAGES.join(', ')}), ` +
  `urgency (standard или urgent), ` +
  `categories (низа, подмножество од: ${INQUIRY_CATEGORIES.join(', ')}), ` +
  `procedureType (еден од: ${PROCEDURE_KEYS.join(', ')}; или null ако ниедна не одговара), ` +
  `source (еден од: ${INQUIRY_SOURCES.join(', ')}; погоди од заглавјето/потписот на е-поштата ако е проследена; инаку null), ` +
  'inquirerName, inquirerEmail, inquirerPhone (вистински контакт податоци на клиентот, или празен стринг). ' +
  'Ако нешто не може да се определи, стави null (или празна низа/стринг). Не измислувај факти.';

/**
 * Parse a raw inquiry email into a structured, anonymized draft.
 * @param {string} rawText - the pasted email text
 * @returns {Promise<object>} draft (see emptyDraft shape) — never throws.
 */
async function extractFromEmail(rawText) {
  const text = clip(rawText, 20000);
  if (!text) return emptyDraft(rawText);

  const api = client();
  if (!api) return emptyDraft(rawText);

  try {
    const resp = await api.chat.completions.create(aiModels.completionParams({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Текст на е-поштата:\n\n${text}` },
      ],
    }, { effort: aiModels.EFFORT_UTILITY }));
    const content = resp?.choices?.[0]?.message?.content?.trim();
    if (!content) return emptyDraft(rawText);
    let parsed;
    try { parsed = JSON.parse(content); } catch { return emptyDraft(rawText); }
    return coerce(parsed || {}, rawText);
  } catch (e) {
    console.warn('[inquiryEmailExtractor] extract failed, returning empty draft:', e.message);
    return emptyDraft(rawText);
  }
}

module.exports = { extractFromEmail };
