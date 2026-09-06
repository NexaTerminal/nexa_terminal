// Maps a Legal Health Check finding to the Nexa document(s) that remedy it, so a
// compliance gap becomes a one-click "generate the fix" action. Deterministic
// keyword matching over the finding text — routes are never AI-generated, so a
// link can never point somewhere that doesn't exist.
//
// Keep the routes in sync with the automated-documents catalog
// (/terminal/documents/<category>/<form>).

const DOC = (category, form, label) => ({ url: `/terminal/documents/${category}/${form}`, label });

// Ordered rules — first matches win. `re` tests the combined finding text
// (question + finding + remediation + article + category), lowercased.
const RULES = [
  // Employment — contracts & structure
  { re: /систематизациј|организациј(а|ата) на работн|работни места/, doc: DOC('employment', 'organization-act', 'Акт за систематизација') },
  { re: /договор за вработување|писмен договор|нема.*договор|без.*договор/, doc: DOC('employment', 'employment-agreement', 'Договор за вработување') },
  { re: /\bанекс\b|измена на договор/, doc: DOC('employment', 'employment-annex', 'Анекс на договор') },
  { re: /потврда за вработување/, doc: DOC('employment', 'confirmation-of-employment', 'Потврда за вработување') },
  // Employment — discipline & termination
  { re: /опомена|писмено предупредување/, doc: DOC('employment', 'warning-letter', 'Опомена до вработен') },
  { re: /дисциплинск/, doc: DOC('employment', 'disciplinary-action', 'Дисциплинска мерка') },
  { re: /отказ поради вина|отказ.*вина|тешк(а|и) повред/, doc: DOC('employment', 'termination-due-to-fault', 'Отказ поради вина') },
  { re: /отказ.*(лични|деловни) причини|деловни причини/, doc: DOC('employment', 'termination-personal-reasons', 'Отказ од лични/деловни причини') },
  { re: /спогодб(а|ен).*(престанок|раскин)|спогодбен престанок/, doc: DOC('employment', 'termination-agreement', 'Спогодбен престанок') },
  { re: /отказ|престанок на работниот однос/, doc: DOC('employment', 'termination-due-to-fault', 'Одлука за отказ') },
  // Employment — leave
  { re: /годишен одмор/, doc: DOC('employment', 'annual-leave-decision', 'Решение за годишен одмор') },
  { re: /неплатено отсуство/, doc: DOC('employment', 'unpaid-leave-decision', 'Решение за неплатено отсуство') },
  // GDPR / personal data
  { re: /политик(а|ата) за приватност|privacy/, doc: DOC('personal-data-protection', 'privacy-policy', 'Политика за приватност') },
  { re: /согласност.*личн|обработка на лични податоц.*согласн/, doc: DOC('personal-data-protection', 'consent-for-personal-data-processing', 'Согласност за обработка на лични податоци') },
  { re: /офицер за (заштита|лични)|правилник.*лични податоци|gdpr|заштита на лични податоц/, doc: DOC('personal-data-protection', 'gdpr-company-politics', 'Интерни правила за заштита на лични податоци') },
  // Health & safety
  { re: /мобинг|вознемирувањ|малтретир/, doc: DOC('health-safety', 'workplace-harassment-policy', 'Политика против вознемирување') },
  { re: /безбедност и здравје|\bбзр\b|заштита при работа|проценка на ризик/, doc: DOC('health-safety', 'health-safety-policy', 'Политика за БЗР') },
];

/**
 * Suggest up to `max` remediation documents for a finding.
 * @param {Object} finding - has any of: question, finding, remediation/text, article, category
 * @returns {Array<{url:string,label:string}>}
 */
export function suggestDocs(finding, max = 2) {
  if (!finding) return [];
  const hay = [
    finding.question, finding.finding, finding.remediation, finding.text,
    finding.article, finding.legalRef, finding.category, finding.whyItMatters,
  ].filter(Boolean).join(' ').toLowerCase();

  const out = [];
  const seen = new Set();
  for (const rule of RULES) {
    if (rule.re.test(hay)) {
      if (seen.has(rule.doc.url)) continue;
      seen.add(rule.doc.url);
      out.push(rule.doc);
      if (out.length >= max) break;
    }
  }
  return out;
}

export default suggestDocs;
