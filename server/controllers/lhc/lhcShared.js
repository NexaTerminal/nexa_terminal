// Shared constants for all Legal Health Check (LHC) modules.
//
// LHC_DISCLAIMER — the single, canonical "this is not legal advice" statement that
// MUST be included in every LHC report (employment, GDPR, health & safety, archives,
// general). Kept here so the platform has one source of truth for the disclaimer.

const LHC_DISCLAIMER = 'Овој извештај претставува индикативна самопроценка и служи само за информативни цели. Не претставува правен совет ниту официјална оцена на надлежен орган. За конкретни прашања и за обезбедување усогласеност со прописите, секогаш консултирајте адвокат или квалификуван правен застапник.';

// Coverage guard (§4.5): if a business answered fewer than this share of the
// applicable questions, the result is shown as provisional rather than final.
const COVERAGE_THRESHOLD = 60;

// Standard NA tokens across modules.
const NA_TOKENS = ['na', 'not_applicable', 'n/a'];
const isNaAnswer = (v) => v === undefined || v === null || v === '' || NA_TOKENS.includes(v);

/**
 * Compute coverage from answered-applicable vs total-applicable counts.
 * @returns {{coveragePct:number, provisional:boolean}}
 */
function computeCoverage(answeredApplicable, totalApplicable) {
  const coveragePct = totalApplicable > 0
    ? Math.round((answeredApplicable / totalApplicable) * 100)
    : 0;
  return { coveragePct, provisional: coveragePct < COVERAGE_THRESHOLD };
}

/**
 * Coverage from a flat answers map, excluding NA answers from both numerator and
 * denominator. Suitable for modules without applicability gating.
 * @param {Object} answers - { questionId: value }
 * @param {number} totalQuestions - total scored questions in the module
 */
function coverageFromAnswers(answers, totalQuestions) {
  const values = Object.values(answers || {});
  const answeredNonNa = values.filter(v => !isNaAnswer(v)).length;
  const naAnswered = values.filter(v => isNaAnswer(v)).length;
  const totalApplicable = Math.max(1, totalQuestions - naAnswered);
  return computeCoverage(answeredNonNa, totalApplicable);
}

module.exports = { LHC_DISCLAIMER, COVERAGE_THRESHOLD, NA_TOKENS, isNaAnswer, computeCoverage, coverageFromAnswers };
