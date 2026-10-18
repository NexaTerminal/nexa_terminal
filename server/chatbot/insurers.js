/**
 * Insurer registry + detection for ГАРД (the insurance agent).
 *
 * The insurance corpus (Qdrant `nexa_insurance_docs`) holds the general
 * conditions ("општи услови") of FOUR Macedonian insurers, tagged on each chunk
 * with a `company` slug. The conditions DIFFER per insurer, so retrieval must be
 * filtered to the insurer(s) the user actually means — otherwise the model
 * blends incompatible terms. See INSURANCE_AI_GUIDE.md.
 *
 * Detection is deterministic keyword matching on the (condensed) query, which
 * already folds in conversation history — so once the user names an insurer it
 * persists across follow-ups. We match ONLY unambiguous brand tokens:
 *   - bare "полиса" is the generic word for "policy" → NOT a match for Ospol;
 *     only the full brand "Осигурителна Полиса" / "Ospol" counts.
 *   - bare "Македонија" is the country → only "Македонија Осигурување" / "ВИГ" /
 *     "VIG" / "Insumak" count.
 */

const INSURERS = Object.freeze({
  eurolink: { name: 'Еуролинк Осигурување', url: 'https://eurolink.com.mk', re: /еуролинк|eurolink/i },
  halk: { name: 'Халк Осигурување', url: 'https://www.halkinsurance.com.mk', re: /халк|halk/i },
  insumak: { name: 'Македонија Осигурување (ВИГ)', url: 'https://www.insumak.mk', re: /македониј[ае]\s+осигур|\bвиг\b|\bvig\b|insumak/i },
  ospol: { name: 'Осигурителна Полиса', url: 'https://ospol.mk', re: /осигурителна\s+полиса|\bospol\b/i },
});

// Агенција за супервизија на осигурување (АСО) — the insurance regulator.
// Authoritative, insurer-neutral resources ГАРД may link to.
const ASO_LINKS = Object.freeze({
  // Rights of the insured + how to complain / dispute a claim.
  consumerProtection: 'https://edukacija.aso.mk/%D0%B7%D0%B0%D1%88%D1%82%D0%B8%D1%82%D0%B0-%D0%BD%D0%B0-%D0%BE%D1%81%D0%B8%D0%B3%D1%83%D1%80%D0%B5%D0%BD%D0%B8%D1%86%D0%B8-2/',
  // Register of licensed insurers — to check a company is authorised.
  registry: 'https://aso.mk/registar/registar-na-drushtva-za-osiguruvane/',
});

/** Human-readable list of the four insurers (for prompts/UI). */
const INSURER_NAMES = Object.values(INSURERS).map((i) => i.name);

/**
 * The static "resources / linking" block injected into ГАРД's base prompt —
 * mirrors the legal agent's platform-feature catalog. The model picks the
 * relevant insurer's site once it knows which insurer, and is told to use ONLY
 * these URLs (never invent one).
 */
function insuranceResourcesBlock() {
  const insurers = Object.values(INSURERS)
    .map((i) => `  - ${i.name}: ${i.url}`)
    .join('\n');
  return (
    '## РЕСУРСИ И УПАТУВАЊЕ (користи ИСКЛУЧИВО овие линкови — НИКОГАШ не измислувај URL; макс 1–2 по одговор, вградени природно)\n' +
    '- **Официјална страница на друштвото** (за детални услови, контакт, онлајн купување и пријава на штета) — линкувај ја страницата на друштвото за кое се работи:\n' +
    insurers + '\n' +
    `- **Пријава на штета, поплака или спор со осигурителот + правата на осигуреникот** → Агенција за супервизија на осигурување (АСО): [Заштита на осигуреници](${ASO_LINKS.consumerProtection})\n` +
    `- **Проверка дали друштвото е ЛИЦЕНЦИРАНО** → [Регистар на друштва за осигурување (АСО)](${ASO_LINKS.registry})\n\n`
  );
}

/**
 * Slugs of the insurers explicitly named in `text`, in registry order.
 * Returns [] when none is named (caller should then retrieve unfiltered and
 * ask the user which insurer they mean).
 */
function detectInsurers(text) {
  if (!text) return [];
  return Object.keys(INSURERS).filter((slug) => INSURERS[slug].re.test(text));
}

/** Display name for an insurer slug (or the slug itself if unknown). */
function insurerName(slug) {
  return INSURERS[slug]?.name || slug;
}

module.exports = { INSURERS, ASO_LINKS, INSURER_NAMES, detectInsurers, insurerName, insuranceResourcesBlock };
