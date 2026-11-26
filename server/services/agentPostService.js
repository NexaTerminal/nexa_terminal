/**
 * Agent posts — the AI Team characters as authors in the member feed.
 *
 * The admin stays the editor: they paste a source (law change, UJP notice,
 * deadline, news), pick a character, and `draftPost` writes it in that
 * character's voice. Nothing is published from here — the admin reviews.
 *
 * `replyToComment` lets the post's character answer a member's comment in the
 * thread. Comments are visible to ALL members, so replies stay general and
 * steer personal cases into the private chat / Ask-a-Pro.
 *
 * Both calls fail safe (null) — the caller decides what to do without AI.
 */

const OpenAI = require('openai');
const aiModels = require('../config/aiModels');

// Compact post voices. Personalities mirror chatbot/agentProfiles.js (the chat
// prompts) but are written for short feed posts, not conversations.
const VOICES = Object.freeze({
  legal: {
    name: 'Лекс', gender: 'm',
    voice: 'деловен правник — директен, оди право на суштината, секогаш го посочува ризикот и правилната постапка (чекор → рок → документ). Топол и разбирлив за не-правник.',
  },
  hr: {
    name: 'Вера', gender: 'f',
    voice: 'HR советничка — топла, дипломатска, практична; гледа низ човечка призма и нуди најмек ефективен пат за работодавачот.',
  },
  marketing: {
    name: 'Миа', gender: 'f',
    voice: 'маркетинг стратег — енергична, забавна, конкретна; дава идеи што може веднаш да се применат, без празни фрази.',
  },
  insurance: {
    name: 'Стојан', gender: 'm',
    voice: 'осигурителен експерт — смирен и јасен; прво посочува што НЕ е покриено (исклучоци, франшиза, рокови), па што е.',
  },
  business: {
    name: 'Борис', gender: 'm',
    voice: 'деловен консултант — директен, но конструктивен; секогаш со бројки (маржа, точка на рентабилност, готовина) и завршува со „Што би го убило ова?" и најевтин тест.',
  },
  accounting: {
    name: 'Дина', gender: 'f',
    voice: 'сметководителка — смирена, прецизна, методична; секогаш кажува КОЛКУ и ДО КОГА / КАДЕ (рок, образец, институција).',
  },
});

const AGENT_KEYS = Object.keys(VOICES);
const isAgentKey = (k) => AGENT_KEYS.includes(k);
const agentName = (k) => VOICES[k]?.name || '';

// Internal destinations a post CTA may point to (the model picks one or none).
const CTA_ROUTES = [
  '/terminal/documents',
  '/terminal/legal-screening',
  '/terminal/hr-screening',
  '/terminal/contract-analysis',
  '/terminal/marketing-screening',
  '/terminal/employees',
  '/terminal/contracts',
];

let _client = null;
function client() {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY) return null;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const clip = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

function persona(agent) {
  const v = VOICES[agent];
  return `Ти си ${v.name} од AI Тимот на Nexa (${v.gender === 'f' ? 'жена — пишуваш во женски род' : 'маж — пишуваш во машки род'}): ${v.voice}`;
}

/**
 * Draft a feed post from admin-provided source material.
 * @returns {Promise<{title, body, category, ctaLabel, ctaHref}|null>}
 */
async function draftPost({ agent, source, hint } = {}) {
  if (!isAgentKey(agent)) return null;
  const api = client();
  if (!api) return null;
  const src = clip(source, 12000);
  if (!src) return null;

  const sys =
    persona(agent) + '\n\n' +
    'Пишуваш КРАТКА објава за фидот во Nexa — деловна мрежа за мали фирми во Македонија. Читателите се сопственици и менаџери на мали фирми.\n' +
    'ПРАВИЛА:\n' +
    '- Користи САМО факти од доставениот ИЗВОР. НЕ измислувај бројки, датуми, рокови, износи, членови на закон ни институции што ги нема во изворот. Ако нешто не е јасно од изворот — изостави го.\n' +
    '- Наслов: до 80 знаци, конкретен (што се менува / што треба да се направи), без кликбејт.\n' +
    '- Текст: 3–6 кратки реченици или краток список со „- ". Прво: што е новото; потоа: што значи за мала фирма; на крај: еден конкретен следен чекор. Пиши со твојот глас, обраќај се со „ти". Не почнувај со „Јас", не повторувај ист факт двапати. Без поздрав, без потпис, без хаштагови, без Markdown наслови.\n' +
    '- Категорија: 1–3 збора (пр. „Работни односи", „ДДВ", „Осигурување", „Маркетинг").\n' +
    `- CTA (опционално): САМО ако некој од овие делови од Nexa е ДИРЕКТНО алатка за следниот чекор (не општо „документи"), избери го: ${CTA_ROUTES.join(', ')}. Тогаш ctaLabel = кратка акција (до 30 знаци). Ако ниеден не одговара — остави ги празни.\n` +
    'Врати САМО JSON: {"title":"","body":"","category":"","ctaLabel":"","ctaHref":""}';

  const user =
    (hint ? `Насока од уредникот: ${clip(hint, 500)}\n\n` : '') +
    `ИЗВОР:\n${src}`;

  try {
    const resp = await api.chat.completions.create(aiModels.completionParams({
      model: aiModels.OPENAI_MODEL,
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    }, { effort: aiModels.EFFORT_MAIN }));
    const raw = resp?.choices?.[0]?.message?.content || '';
    const j = JSON.parse(raw);
    const ctaHref = CTA_ROUTES.includes(j.ctaHref) ? j.ctaHref : '';
    return {
      title: clip(j.title, 160),
      body: clip(j.body, 3000),
      category: clip(j.category, 40),
      ctaLabel: ctaHref ? clip(j.ctaLabel, 40) : '',
      ctaHref,
    };
  } catch (e) {
    console.warn('[agentPost] draft failed:', e.message);
    return null;
  }
}

/**
 * The post's character replies to a member comment. Short, general, public-safe.
 * @returns {Promise<string|null>}
 */
async function replyToComment({ agent, post, comment, earlier = [] } = {}) {
  if (!isAgentKey(agent)) return null;
  const api = client();
  if (!api) return null;

  const sys =
    persona(agent) + '\n\n' +
    'Одговараш на коментар под ТВОЈА објава во фидот на Nexa. Коментарите ги гледаат СИТЕ членови.\n' +
    'ПРАВИЛА:\n' +
    '- 2–4 кратки реченици, со твојот глас, на македонски, обраќање со „ти". Без Markdown наслови, без поздрав „Здраво" на почеток.\n' +
    '- Држи се до темата на објавата и до општо, точно знаење. НЕ измислувај бројки, рокови или членови на закон; ако не си сигурен/сигурна — кажи го тоа.\n' +
    '- НЕ ги повторувај личните податоци, имињата, фирмите ни конкретните бројки (промет, плата…) што корисникот ги споменал — зборувај општо („ако прометот ти е под прагот…").\n' +
    '- Пиши граматички чисто и природно, како искусен советник; ако постои општо познато правило (праг, рок), кажи го јасно.\n' +
    '- Ако прашањето е за конкретен личен случај, дај кратка општа насока и кажи дека за неговиот случај е подобро да продолжите во приватен разговор (копчето „Продолжи во разговор" е веднаш под твојот одговор). Ако е сериозен случај (спор, тужба, инспекција) — спомни дека може да побара и професионалец преку Nexa.\n' +
    '- Ако коментарот е само пофалба/благодарност — одговори кратко и топло во една реченица.\n' +
    '- Ако коментарот е навредлив или спам — одговори празно.';

  const thread = earlier.slice(-4).map((c) => `- ${c.isAgent ? agentName(agent) : 'Член'}: ${clip(c.content, 300)}`).join('\n');
  const user =
    `ОБЈАВА: ${clip(post.title, 200)}\n${clip(post.body, 2500)}\n\n` +
    (thread ? `Претходни коментари:\n${thread}\n\n` : '') +
    `НОВ КОМЕНТАР:\n${clip(comment, 2000)}`;

  try {
    const resp = await api.chat.completions.create(aiModels.completionParams({
      // Main model: replies are public under Nexa's name, so quality > cost
      // (volume is capped per user/day in updatesController).
      model: aiModels.OPENAI_MODEL,
      max_tokens: 500,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    }, { effort: aiModels.EFFORT_MAIN }));
    const out = resp?.choices?.[0]?.message?.content?.trim();
    // No redactPii here: it strips dates/deadlines, the whole point of a reply.
    return out ? clip(out, 1500) : null;
  } catch (e) {
    console.warn('[agentPost] reply failed:', e.message);
    return null;
  }
}

module.exports = { AGENT_KEYS, isAgentKey, agentName, draftPost, replyToComment };
