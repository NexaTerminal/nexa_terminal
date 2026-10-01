/**
 * Agent profiles for the legal RAG engine ("AI Team").
 *
 * The legal chatbot (ChatBotService) is ONE engine. An "agent" is a thin
 * specialization layered on top: a short identity/flavor block that is prepended
 * ABOVE the user's stance prefix and the base system prompt. It steers focus and
 * tone without forking the pipeline.
 *
 * Only legal-engine agents live here (legal / corporate / hr). The marketing
 * agent (Ива) is a separate service/UI and is NOT routed through this file.
 *
 * Display copy (names, bios, icons, routes) lives client-side in
 * client/src/config/aiAgents.js — mirrors the PERSONA_ICON vs PERSONAS split.
 * systemFlavor here is server-only and never shown to the user.
 *
 * retrievalScope is reserved for a later pass (category filter/boost in
 * retrieveRelevantDocuments). Phase 1 is flavor-only; scope is currently unused.
 */

const AGENT_PROFILES = Object.freeze({
  // Марко — generalist legal advisor. The default; no extra steering so the
  // base system prompt (already a practical, protective lawyer) stands as-is.
  legal: {
    systemFlavor: '',
    retrievalScope: null,
  },

  // НОВА — corporate lawyer. Company law, contracts, Central Register.
  corporate: {
    systemFlavor:
      '# АКТИВЕН АГЕНТ: НОВА — Корпоративен адвокат\n' +
      'Фокусирани сте на правото на трговските друштва, договори и регистрација во Централниот регистар (основање, промени, управување, односи меѓу содружници). Гледајте го секое прашање низ корпоративна призма каде што е релевантно — должности на управителот, судир на интереси, важност и ризици на договорните клаузули. Ако корисникот прикачи договор на преглед, посочете ги конкретните ризици и што да измени. Кога прашањето е вон корпоративното право, сепак помогнете корисно.\n\n',
    retrievalScope: ['company', 'contracts'],
  },

  // АРИА — employment / labour relations advisor.
  hr: {
    systemFlavor:
      '# АКТИВЕН АГЕНТ: АРИА — Советник за работни односи\n' +
      'Фокусирани сте на работното право и HR постапки — вработување, договори и анекси, работно време, одмори и отсуства, дисциплина и отказ, акти за систематизација. Нагласувајте ја правилната ПОСТАПКА и роковите за да се избегнат спорови и прекршочна одговорност. Кога прашањето е вон работните односи, сепак помогнете корисно.\n\n',
    retrievalScope: ['employment'],
  },
});

const DEFAULT_AGENT = 'legal';

/** Normalize an incoming agent key to a known profile key (falls back to default). */
function normalizeAgent(agent) {
  return agent && Object.prototype.hasOwnProperty.call(AGENT_PROFILES, agent)
    ? agent
    : DEFAULT_AGENT;
}

/** The system-flavor prefix for an agent ('' for the default/unknown). */
function getAgentFlavor(agent) {
  return AGENT_PROFILES[normalizeAgent(agent)].systemFlavor || '';
}

module.exports = {
  AGENT_PROFILES,
  DEFAULT_AGENT,
  normalizeAgent,
  getAgentFlavor,
};
