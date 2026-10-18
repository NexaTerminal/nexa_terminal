/**
 * Insurer registry + detection for ГАРД (the insurance agent).
 *
 * The insurance corpus (Qdrant `nexa_insurance_docs`) holds the general
 * conditions ("општи услови") of several Macedonian insurers, tagged on each
 * chunk with a `company` slug (lowercase). The slugs below MUST match the
 * `company` payload values exactly, or a filtered query returns zero results.
 * Verified live against the collection: eurolink, halk, insumak, ospol, sava,
 * sigal, triglav. The conditions DIFFER per insurer, so retrieval is filtered to
 * the insurer(s) the user names — otherwise the model blends incompatible terms.
 * See INSURANCE_AI_GUIDE.md.
 *
 * `available: false` = a real Macedonian insurer we DON'T have data for yet
 * (grawe). We still detect it so a filtered query returns nothing and ГАРД says
 * "no data for that insurer" instead of silently answering with another's terms.
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
  eurolink: { name: 'Еуролинк Осигурување', url: 'https://eurolink.com.mk', claimsUrl: 'https://eurolink.com.mk/shteti/', re: /еуролинк|eurolink/i },
  halk: { name: 'Халк Осигурување', url: 'https://www.halkinsurance.com.mk', claimsUrl: 'https://www.halkinsurance.com.mk/steti.html', re: /халк|halk/i },
  // NOTE: JS `\b` is ASCII-only, so it does NOT create a word boundary next to
  // Cyrillic letters. For short Cyrillic tokens (виг, сава) we use Unicode-aware
  // lookarounds (`\p{L}` + `u` flag) instead, or they silently never match.
  insumak: { name: 'Македонија Осигурување (ВИГ)', url: 'https://www.insumak.mk', claimsUrl: 'https://www.insumak.mk/prijava-na-shteti/', re: /македониј[ае]\s+осигур|(?<!\p{L})(?:виг|vig)(?!\p{L})|insumak/iu },
  ospol: { name: 'Осигурителна Полиса', url: 'https://ospol.mk', claimsUrl: 'https://ospol.mk/Steti', re: /осигурителна\s+полиса|(?<!\p{L})ospol(?!\p{L})/iu },
  triglav: { name: 'Триглав Осигурување', url: 'https://www.triglav.mk', claimsUrl: 'https://www.triglav.mk/steti/prijava-na-steti', re: /триглав|triglav/i },
  sava: { name: 'Сава Осигурување', url: 'https://www.sava.mk', re: /(?<!\p{L})(?:сава|sava)(?!\p{L})/iu },
  sigal: { name: 'Сигал Уника Осигурување', url: 'https://sigal.com.mk', re: /сигал|sigal|уника|uniqa/i },
  // Known MK insurer, NOT in our collection yet → detectable but unavailable.
  grawe: { name: 'Граве Осигурување', available: false, re: /граве|grawe|grazer/i },
});

// Slugs we actually have data for (used for prompt lists + resource links).
const AVAILABLE_SLUGS = Object.keys(INSURERS).filter((s) => INSURERS[s].available !== false);

// Агенција за супервизија на осигурување (АСО) — the insurance regulator.
// Authoritative, insurer-neutral resources ГАРД may link to.
const ASO_LINKS = Object.freeze({
  // Rights of the insured + how to complain / dispute a claim.
  consumerProtection: 'https://edukacija.aso.mk/%D0%B7%D0%B0%D1%88%D1%82%D0%B8%D1%82%D0%B0-%D0%BD%D0%B0-%D0%BE%D1%81%D0%B8%D0%B3%D1%83%D1%80%D0%B5%D0%BD%D0%B8%D1%86%D0%B8-2/',
  // Register of licensed insurers — to check a company is authorised.
  registry: 'https://aso.mk/registar/registar-na-drushtva-za-osiguruvane/',
});

/** Display names of the insurers we HAVE data for (for prompts/UI). */
function availableInsurerNames() {
  return AVAILABLE_SLUGS.map((s) => INSURERS[s].name);
}

/** Back-compat export — names of the available insurers. */
const INSURER_NAMES = availableInsurerNames();

/**
 * The static "resources / linking" block injected into ГАРД's base prompt —
 * mirrors the legal agent's platform-feature catalog. The model picks the
 * relevant insurer's site once it knows which insurer, and is told to use ONLY
 * these URLs (never invent one). Only lists insurers that have a URL; the claims
 * link is shown only when we have a verified claims page.
 */
function insuranceResourcesBlock() {
  const insurers = AVAILABLE_SLUGS
    .map((s) => INSURERS[s])
    .filter((i) => i.url)
    .map((i) => {
      const claims = i.claimsUrl ? ` · [пријава на штета](${i.claimsUrl})` : '';
      return `  - ${i.name} — [страница](${i.url})${claims}`;
    })
    .join('\n');
  return (
    '## РЕСУРСИ И УПАТУВАЊЕ (користи ИСКЛУЧИВО овие линкови, ТОЧНО како што се напишани — НЕ измислувај URL и НЕ додавај патеки/сегменти/параметри на нив; макс 1–2 по одговор, вградени природно)\n' +
    '- **Официјална страница / пријава на штета на друштвото** — линкувај ги за друштвото за кое се работи (страницата за детални услови/контакт, „пријава на штета" кога корисникот сака да пријави штета):\n' +
    insurers + '\n' +
    `- **Поплака или спор со осигурителот + правата на осигуреникот** → Агенција за супервизија на осигурување (АСО): [Заштита на осигуреници](${ASO_LINKS.consumerProtection})\n` +
    `- **Проверка дали друштвото е ЛИЦЕНЦИРАНО** → [Регистар на друштва за осигурување (АСО)](${ASO_LINKS.registry})\n\n`
  );
}

/**
 * Slugs of the insurers explicitly named in `text`, in registry order. Includes
 * unavailable insurers (e.g. grawe) so the caller can filter on them → zero
 * results → "no data" rather than blending another insurer's terms. Returns []
 * when none is named (caller then retrieves unfiltered and asks which insurer).
 */
function detectInsurers(text) {
  if (!text) return [];
  return Object.keys(INSURERS).filter((slug) => INSURERS[slug].re.test(text));
}

/** Display name for an insurer slug (or the slug itself if unknown). */
function insurerName(slug) {
  return INSURERS[slug]?.name || slug;
}

/** Is this insurer slug one we have data for? */
function isInsurerAvailable(slug) {
  return !!INSURERS[slug] && INSURERS[slug].available !== false;
}

module.exports = {
  INSURERS,
  ASO_LINKS,
  INSURER_NAMES,
  AVAILABLE_SLUGS,
  availableInsurerNames,
  detectInsurers,
  insurerName,
  isInsurerAvailable,
  insuranceResourcesBlock,
};
