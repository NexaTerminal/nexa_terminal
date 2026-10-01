/**
 * AI Team roster — display catalog (client-side).
 *
 * Names, roles, bios and icons are display copy only; the server-side
 * specialization (systemFlavor) lives in server/chatbot/agentProfiles.js keyed
 * by the same `key`. Mirrors the PERSONA_ICON (client) vs PERSONAS (server) split.
 *
 * `engine` tells the UI how to run the agent:
 *  - 'legal'     → served by AIChat on the legal RAG (ChatBotService); `key` is
 *                  sent as the `agent` param on each /chatbot request.
 *  - 'marketing' → separate page; selecting it navigates to `route`.
 *
 * `accent` tints the agent's silhouette on the Team page.
 */

export const AI_AGENTS = [
  {
    key: 'legal',
    name: 'ЈУРА',
    role: 'Правен советник',
    tagline: 'Секојдневни правни прашања',
    bio: 'ЈУРА дава брзи и јасни одговори на секојдневните правни прашања и оди право на суштината, без непотребни правни фрази.',
    icon: '⚖️',
    photo: '/ai-team/lex.png',
    accent: '#1E4DB7',
    engine: 'legal',
    hasContractReview: false,
    starters: [
      'Дали ми треба писмен договор за соработка?',
      'Кои се роковите за жалба на решение?',
      'Што да направам ако клиент не ми плаќа?',
    ],
  },
  {
    key: 'corporate',
    name: 'НОВА',
    role: 'Корпоративен адвокат',
    tagline: 'Друштва, договори, регистрација',
    bio: 'НОВА се грижи за друштва, договори и регистрација во Централен регистар; прикачи ѝ договор и таа ќе ти го прегледа и ќе ти ги посочи ризиците.',
    icon: '🏢',
    photo: '/ai-team/nova.png',
    accent: '#7C3AED',
    engine: 'legal',
    hasContractReview: true,
    starters: [
      'Како да основам ДОО во Македонија?',
      'Што мора да содржи договор со добавувач?',
      'Кои се обврските и одговорностите на управител?',
    ],
  },
  {
    key: 'hr',
    name: 'АРИА',
    role: 'Советник за работни односи',
    tagline: 'Вработување, отказ, одмори',
    bio: 'АРИА те води низ вработување, отказ, одмори и работни акти, за да ја спроведеш постапката без грешки и без ризик од спорови.',
    icon: '👥',
    photo: '/ai-team/aria.png',
    accent: '#0891B2',
    engine: 'legal',
    hasContractReview: false,
    starters: [
      'Како се пресметува отказниот рок?',
      'Кои се основите за отказ од деловни причини?',
      'Колку дена годишен одмор следуваат по закон?',
    ],
  },
  {
    key: 'marketing',
    name: 'ПУЛС',
    role: 'Маркетинг стратег',
    tagline: 'Содржина, кампањи, раст',
    bio: 'ПУЛС предлага идеи за содржина, кампањи и настап на пазарот што носат резултат и го издвојуваат твојот бизнис.',
    icon: '📣',
    photo: '/ai-team/eho.png',
    accent: '#DB2777',
    engine: 'marketing',
    route: '/terminal/marketing-ai',
    hasContractReview: false,
  },
  {
    key: 'people',
    name: 'ВЕРА',
    role: 'Советник за човечки ресурси',
    tagline: 'HR и управување со луѓе',
    bio: 'ВЕРА ќе помага со вработување, оценување, HR политики и управување со тимови — наскоро дел од твојот AI Тим.',
    icon: '🧑‍💼',
    photo: '/ai-team/vera.png',
    accent: '#B45309',
    hasContractReview: false,
    comingSoon: true,
  },
  {
    key: 'insurance',
    name: 'ГАРД',
    role: 'Осигурителен експерт',
    tagline: 'Осигурување и ризици',
    bio: 'ГАРД ќе ти помага со избор на осигурување, полиси и управување со ризици за твојот бизнис — наскоро дел од твојот AI Тим.',
    icon: '🛡️',
    photo: '/ai-team/egis.png',
    accent: '#047857',
    hasContractReview: false,
    comingSoon: true,
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
 * Keyed by the kebab category segment used in document routes
 * (/terminal/documents/<category>/<doc>) and the RAG prompt categories.
 * Only ACTIVE agents are targets; unknown → the general legal agent.
 */
const CATEGORY_TO_AGENT = {
  employment: 'hr',               // АРИА
  contracts: 'corporate',         // НОВА
  'central-register': 'corporate',
  obligations: 'corporate',
  accounting: 'corporate',
  'personal-data-protection': 'legal', // ЈУРА
  'health-safety': 'legal',
  other: 'legal',
  marketing: 'marketing',         // ПУЛС
};

export function agentForCategory(category) {
  return CATEGORY_TO_AGENT[category] || DEFAULT_AGENT_KEY;
}
