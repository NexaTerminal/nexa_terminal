/**
 * Shareable-document registry — the allowlist of documents a Pro user may share via
 * a public link, plus access to each one's generator wiring (template + validation)
 * WITHOUT an HTTP round-trip.
 *
 * Every entry maps an `apiEndpoint` → the already-built controller (created through
 * `createDocumentController`, which attaches `.generatorConfig`). This reuses the exact
 * same template + validation the authenticated flow uses, with zero duplication.
 *
 * Only endpoints listed here can be shared (safety: not every document is suitable for
 * public intake). Grow the list as more documents are enabled for sharing.
 *
 * Phase 1: config-driven documents (rendered publicly via the generic field renderer).
 * Central-register packs (companyChanges/companyIncorporation/capitalReduction) are
 * deferred to Phase 2 (their bespoke multi-step UIs need the public shell).
 */

const SHAREABLE = {
  // Config-driven documents (generic public renderer)
  'confirmation-of-employment': () => require('../controllers/autoDocuments/confirmationOfEmploymentController'),
  'consent-for-personal-data-processing': () => require('../controllers/autoDocuments/consentForPersonalDataProcessingController'),
  'termination-agreement': () => require('../controllers/autoDocuments/terminationAgreementController'),
  // Central-register packs (bespoke public renderer)
  'company-capital-reduction': () => require('../controllers/autoDocuments/capitalReductionController'),
  'company-changes': () => require('../controllers/autoDocuments/companyChangesController'),
  'company-incorporation': () => require('../controllers/autoDocuments/companyIncorporationController')
};

function isShareable(apiEndpoint) {
  return Object.prototype.hasOwnProperty.call(SHAREABLE, apiEndpoint);
}

function listShareable() {
  return Object.keys(SHAREABLE);
}

/**
 * Returns the generator config { templateFunction, documentName, validateFunction,
 * preprocessFunction, requiredFields } for a shareable endpoint, or null.
 */
function getGenerator(apiEndpoint) {
  if (!isShareable(apiEndpoint)) return null;
  const controller = SHAREABLE[apiEndpoint]();
  const cfg = controller && controller.generatorConfig;
  if (!cfg || typeof cfg.templateFunction !== 'function') {
    console.error(`[documentGenerators] "${apiEndpoint}" has no generatorConfig — is it built via createDocumentController?`);
    return null;
  }
  return cfg;
}

module.exports = { isShareable, listShareable, getGenerator };
