/**
 * AI Team roster — display catalog (client-side).
 *
 * Names, roles, bios and icons are display copy only; the server-side
 * specialization (systemFlavor) lives in server/chatbot/agentProfiles.js keyed
 * by the same `key`.
 *
 * Oct 2026 — collapsed to ONE lawyer. ЈУРА is now the single comprehensive
 * business lawyer (employment, companies, contracts, GDPR, tax). The former
 * НОВА (corporate) and АРИА (hr) are gone; legacy keys resolve to ЈУРА via
 * getAgent()'s fallback, so old links/data still work. ПУЛС (marketing) runs on
 * its own engine/page. ГАРД (insurance) is LIVE — it runs on the same RAG engine
 * as the lawyers but the server routes it to its own Qdrant collection
 * (nexa_insurance_docs); see server/chatbot/agentProfiles.js.
 *
 * `engine` tells the UI how to run the agent:
 *  - 'legal'     → served by AIChat on the RAG engine (ChatBotService); `key` is
 *                  sent as the `agent` param on each /chatbot request. The server
 *                  picks the retrieval collection per agent, so 'legal' here means
 *                  "the in-page RAG chat", not "the legal corpus".
 *  - 'marketing' → separate page; selecting it navigates to `route`.
 */

export const AI_AGENTS = [
  {
    key: 'legal',
    name: 'ЈУРА',
    role: 'Деловен правен советник',
    tagline: 'Работни односи, друштва, договори, ГДПР, даноци',
    tags: ['Работни односи', 'Договори', 'Друштва', 'ГДПР', 'Даноци'],
    bio: 'ЈУРА е твојот деловен правник за сите секојдневни правни прашања — работни односи и отказ, трговски друштва и договори, заштита на лични податоци и даночна усогласеност. Тој оди право на суштината, ги идентификува ризиците и те води низ постапката чекор по чекор. Прикачи договор и ќе ти го прегледа клаузула по клаузула.',
    greeting: 'Кажи ми со две реченици што те мачи — дали е работен однос, договор, друштво или лични податоци — и веднаш одиме на суштината: што те штити, каде е ризикот и кои се следните чекори.',
    icon: '⚖️',
    photo: '/ai-team/lex.png',
    accent: '#1E4DB7',
    engine: 'legal',
    hasContractReview: true,
    starters: [
      'Која е точната постапка за отказ и роковите?',
      'Кои ризици ги носи овој договор за мене?',
      'Што мора да содржи политика за заштита на лични податоци?',
    ],
  },
  {
    key: 'hr',
    name: 'ВЕРА',
    role: 'Советник за човечки ресурси',
    tagline: 'HR пристап: отказ, спорови, тимови, дисциплина',
    tags: ['Отказ', 'Спорови', 'Тимови', 'Дисциплина', 'Задржување'],
    bio: 'ВЕРА го гледа секое прашање за вработени низ човечка и дипломатска призма — како да ја решиш ситуацијата со најмалку конфликт и ризик, по стандардна HR постапка. Ја познава работно-правната регулатива, но дава практично HR решение прво, и секогаш те вовлекува во разговор за да ја разбере ситуацијата.',
    greeting: 'Ајде заедно да најдеме најдобар пат. Опиши ми ја ситуацијата со вработениот — што се случува, што е веќе пробано и што сакаш да постигнеш (да го задржиш, да се подобри, или да се разделите мирно)? Па ќе го средиме дипломатски и без непотребен ризик.',
    icon: '🧑‍💼',
    photo: '/ai-team/vera.png',
    accent: '#B45309',
    engine: 'legal',
    hasContractReview: false,
    starters: [
      'Како да му дадам тешка повратна информација на вработен?',
      'Вработен слабо работи — како да постапам пред отказ?',
      'Како да решам конфликт меѓу двајца вработени?',
    ],
  },
  {
    key: 'marketing',
    name: 'ПУЛС',
    role: 'Маркетинг стратег',
    tagline: 'Содржина, кампањи, раст',
    tags: ['Содржина', 'Кампањи', 'Раст', 'Социјални мрежи'],
    bio: 'ПУЛС предлага идеи за содржина, кампањи и настап на пазарот што носат резултат и го издвојуваат твојот бизнис.',
    icon: '📣',
    photo: '/ai-team/eho.png',
    accent: '#DB2777',
    engine: 'marketing',
    route: '/terminal/marketing-ai',
    hasContractReview: false,
  },
  {
    key: 'insurance',
    name: 'ГАРД',
    role: 'Осигурителен експерт',
    tagline: 'Осигурување, покриеност и ризици',
    tags: ['Покриеност', 'Исклучоци', 'Штети', 'Полиси', 'Франшиза'],
    bio: 'ГАРД ги чита општите услови на водечките осигурителни друштва во Македонија и ти кажува што точно покрива полисата, што е исклучено, кои се лимитите и франшизата и како да пријавиш штета. Условите се разликуваат по друштво — затоа прво ќе те праша за кое друштво станува збор.',
    greeting: 'Кажи ми за кое осигурително друштво прашуваш (на пр. Еуролинк, Халк, Триглав, Сава, Сигал Уника, Македонија Осигурување/ВИГ или Осигурителна Полиса) — и што те интересира. Условите се разликуваат по друштво, па веднаш одиме на суштината: што е покриено, што е ИСКЛУЧЕНО и каде е ризикот.',
    icon: '🛡️',
    photo: '/ai-team/egis.png',
    accent: '#047857',
    engine: 'legal',
    hasContractReview: false,
    starters: [
      'Што покрива осигурувањето на имот од пожар кај Халк?',
      'Кои се исклучоците кај патничкото осигурување на Еуролинк?',
      'Што да внимавам пред да пријавам штета — рокови и обврски?',
    ],
  },
];

export const DEFAULT_AGENT_KEY = 'legal';

/** Agents handled in-page by AIChat (legal RAG engine). */
export const LEGAL_AGENTS = AI_AGENTS.filter((a) => a.engine === 'legal');

export function getAgent(key) {
  return AI_AGENTS.find((a) => a.key === key) || AI_AGENTS[0];
}

/**
 * Route a document/content category to the agent best suited to review it.
 * All legal categories map to the single lawyer (ЈУРА); marketing → ПУЛС.
 * Unknown → the lawyer.
 */
const CATEGORY_TO_AGENT = {
  marketing: 'marketing', // ПУЛС
};

export function agentForCategory(category) {
  return CATEGORY_TO_AGENT[category] || DEFAULT_AGENT_KEY;
}
