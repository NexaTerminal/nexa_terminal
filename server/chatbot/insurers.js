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
  eurolink: { name: 'Еуролинк Осигурување', re: /еуролинк|eurolink/i },
  halk: { name: 'Халк Осигурување', re: /халк|halk/i },
  insumak: { name: 'Македонија Осигурување (ВИГ)', re: /македониј[ае]\s+осигур|\bвиг\b|\bvig\b|insumak/i },
  ospol: { name: 'Осигурителна Полиса', re: /осигурителна\s+полиса|\bospol\b/i },
});

/** Human-readable list of the four insurers (for prompts/UI). */
const INSURER_NAMES = Object.values(INSURERS).map((i) => i.name);

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

module.exports = { INSURERS, INSURER_NAMES, detectInsurers, insurerName };
