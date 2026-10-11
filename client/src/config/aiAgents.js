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
 * its own engine/page. Insurance (ГАРД) is reserved for later.
 *
 * `engine` tells the UI how to run the agent:
 *  - 'legal'     → served by AIChat on the legal RAG (ChatBotService); `key` is
 *                  sent as the `agent` param on each /chatbot request.
 *  - 'marketing' → separate page; selecting it navigates to `route`.
 */

export const AI_AGENTS = [
  {
    key: 'legal',
    name: 'ЈУРА',
    role: 'Деловен правен советник',
    tagline: 'Работни односи, друштва, договори, ГДПР, даноци',
    bio: 'ЈУРА е твојот деловен адвокат за сите секојдневни правни прашања — работни односи и отказ, трговски друштва и договори, заштита на лични податоци и даночна усогласеност. Оди право на суштината, лови ги ризиците и те води низ постапката чекор по чекор. Прикачи договор и ќе ти го прегледа клаузула по клаузула.',
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
 * All legal categories map to the single lawyer (ЈУРА); marketing → ПУЛС.
 * Unknown → the lawyer.
 */
const CATEGORY_TO_AGENT = {
  marketing: 'marketing', // ПУЛС
};

export function agentForCategory(category) {
  return CATEGORY_TO_AGENT[category] || DEFAULT_AGENT_KEY;
}
