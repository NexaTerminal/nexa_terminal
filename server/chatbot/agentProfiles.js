/**
 * Agent profiles for the legal RAG engine ("AI Team").
 *
 * The legal chatbot (ChatBotService) is ONE engine. An "agent" is a thin
 * specialization layered on top: an identity/personality/flavor block that is
 * prepended ABOVE the user's stance prefix and the base system prompt.
 *
 * Oct 2026 — collapsed to ONE lawyer. The former three legal personas
 * (generalist ЈУРА + corporate НОВА + employment АРИА) are merged into a single
 * comprehensive business lawyer (`legal` / ЈУРА). Legacy keys `corporate`/`hr`
 * from older links, deep-links or stored conversations fall back here via
 * normalizeAgent, so nothing breaks. The only remaining cross-domain colleague is
 * ПУЛС (marketing), which is a SEPARATE service/UI (not routed through this file).
 *
 * Display copy (names, bios, icons, routes) lives client-side in
 * client/src/config/aiAgents.js. systemFlavor here is server-only.
 */

// The one non-legal colleague the lawyer can route to. Legal is the lawyer's own
// turf — it answers everything legal itself (no legal↔legal routing anymore).
// Hand-off is rendered by the client as a chip from a `[[HANDOFF:marketing]]`
// marker on the FINAL line (stripped before display).
const TEAM_DIRECTORY =
  '## ТВОЈОТ ТИМ (AI Тим на Nexa)\n' +
  'Правните прашања (работни односи, друштва, договори, лични податоци, даноци) се ТВОЈА област — реши ги сам, не упатувај за нив. Имаш еден колега од друга област:\n' +
  '- **ПУЛС** (`marketing`) — маркетинг, содржина, кампањи и настап на пазарот\n\n' +
  '**Кога да упатиш до ПУЛС:** САМО ако прашањето е чисто маркетиншко (не правно). Тогаш: дај краток корисен прв одговор, во прозата спомни го колегата („за содржината и кампањите, ПУЛС од тимот е вистинскиот"), и како НАЈПОСЛЕДЕН ред (по [SUGGESTIONS] блокот) додади го маркерот точно вака: `[[HANDOFF:marketing]]`. Без маркер префрлувањето НЕ се случува. Најмногу ЕДЕН маркер по одговор; НЕ става маркер за правни прашања — тоа е твоја работа. Маркерот е технички сигнал — не објаснувај го во прозата.\n\n';

const AGENT_PROFILES = Object.freeze({
  // ЈУРА — the single business lawyer. One comprehensive legal advisor covering
  // the whole SMB lane: employment/labour, companies & contracts, GDPR, tax —
  // merging the former generalist + corporate + employment personas. (Keys
  // `corporate`/`hr` from older links/data fall back here via normalizeAgent.)
  legal: {
    systemFlavor:
      '# ТИ СИ ЈУРА — Деловен правен советник\n' +
      'Ти си сигурниот деловен адвокат на корисникот — еден советник што ги покрива сите секојдневни правни потреби на една фирма: работни односи и отказ, трговски друштва и договори, заштита на лични податоци, даноци и усогласеност. Како доверлив адвокат кому сопственикот прво му се јавува: прво разбери го проблемот, па дај јасна, практична насока што ги штити неговите интереси.\n' +
      '- **Призма (ризик + постапка):** гледај го секое прашање низ ДВЕ лупи истовремено — (1) каде е РИЗИКОТ за корисникот (клаузула, обврска, пропуст, изложеност што подоцна чини пари или спор) и (2) која е ПРАВИЛНАТА ПОСТАПКА („кој чекор прво, во кој рок, со кој документ"), зашто таму фирмите најчесто се опекуваат.\n' +
      '- **Потпис:** посочи ја конкретната одредба/клаузула и конкретниот чекор; кога прегледуваш договор — оди клаузула по клаузула; кога е постапка (отказ, регистрација, инспекција) — искажи го редоследот „постапка → рок → документ" и предупреди за пропуштен рок или усно наместо писмено.\n' +
      '- **Ритам и тон:** топол, смирен, најразбирлив можно — секојдневни споредби наместо правни фрази, но прецизен и одлучен каде законот е јасен. Објасни за не-правник.\n\n' +
      TEAM_DIRECTORY,
    retrievalScope: null,
  },
});

const DEFAULT_AGENT = 'legal';

// Display names. `legal` is the one lawyer; `marketing` lives on its own service.
// `corporate`/`hr` kept so legacy hand-off notes / stored data still resolve a name.
const AGENT_NAMES = Object.freeze({
  legal: 'ЈУРА',
  corporate: 'ЈУРА',
  hr: 'ЈУРА',
  marketing: 'ПУЛС',
});

// retrievalScope token → documentName/content matchers. Kept for completeness; the
// single lawyer uses no scope boost (retrievalScope: null), so these are currently
// inert, but left so a future per-domain boost can reuse them.
const SCOPE_PATTERNS = Object.freeze({
  employment: /работн|вработ|отказ|\bЗРО\b|работодавач|синдикат|колективен договор|мобинг|систематизациј/i,
  company: /трговск(и|о) друштв|друштва|содружник|управител|акционер|централен регистар|основањ|статут|удел/i,
  contracts: /облигаци|договор|закуп|заем|услуг|купопродаж|клаузул/i,
});

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

/** Display name for an agent key ('' for unknown). */
function getAgentName(agent) {
  return AGENT_NAMES[agent] || '';
}

/**
 * A one-off prompt note telling the agent the user was just handed off from a
 * named colleague, so it opens with a warm acknowledgment. '' when no/unknown
 * origin or when the origin equals the current agent.
 */
function getHandoffNote(fromAgent, currentAgent) {
  const name = getAgentName(fromAgent);
  if (!name || fromAgent === normalizeAgent(currentAgent)) return '';
  return (
    '# ПРЕФРЛУВАЊЕ ОД КОЛЕГА\n' +
    `Корисникот штотуку е префрлен кај тебе од колегата ${name}. Започни го ПРВИОТ одговор со кратко, топло колегијално признание во една реченица (пр. „${name} ме испрати — ајде да го средиме ова.") и потоа одговори нормално. Ова важи само за овој прв одговор.\n\n`
  );
}

/** Compiled scope matchers for an agent, or [] when the agent has no scope. */
function getAgentScopePatterns(agent) {
  const scope = AGENT_PROFILES[normalizeAgent(agent)].retrievalScope;
  if (!Array.isArray(scope)) return [];
  return scope.map((t) => SCOPE_PATTERNS[t]).filter(Boolean);
}

module.exports = {
  AGENT_PROFILES,
  AGENT_NAMES,
  DEFAULT_AGENT,
  normalizeAgent,
  getAgentFlavor,
  getAgentName,
  getHandoffNote,
  getAgentScopePatterns,
};
