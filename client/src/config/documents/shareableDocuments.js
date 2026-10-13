/**
 * Shareable-document registry (client) — the allowlist of documents a Pro user can
 * share via a public link, mapping `apiEndpoint` → the document config. Must stay in
 * sync with the server allowlist (`server/utils/documentGenerators.js`).
 *
 * Config-only on purpose (no page imports) so this stays importable by ShareLinkButton
 * without an import cycle. Bespoke step renderers for the central-register packs live
 * in `publicPackRenderers.js` (imported only by the public page).
 */

import confirmationOfEmployment from './confirmationOfEmployment';
import consentForPersonalDataProcessing from './consentForPersonalDataProcessing';
import terminationAgreement from './terminationAgreement';
import capitalReduction from './capitalReduction';
import companyChanges from './companyChanges';
import companyIncorporation from './companyIncorporation';

export const SHAREABLE_CONFIGS = {
  // Config-driven (generic public renderer)
  'confirmation-of-employment': confirmationOfEmployment,
  'consent-for-personal-data-processing': consentForPersonalDataProcessing,
  'termination-agreement': terminationAgreement,
  // Central-register packs (bespoke public renderer — see publicPackRenderers.js)
  'company-capital-reduction': capitalReduction,
  'company-changes': companyChanges,
  'company-incorporation': companyIncorporation
};

export const isShareable = (apiEndpoint) => Boolean(SHAREABLE_CONFIGS[apiEndpoint]);
export const getShareableConfig = (apiEndpoint) => SHAREABLE_CONFIGS[apiEndpoint] || null;

/**
 * Resolve the field list for a step across both generic config shapes:
 *  - shape B: `step.fields` is an array (self-contained),
 *  - shape A: top-level `config.fields` keyed object, optionally tagged with `step`,
 *             else all fields on the single step.
 * (Packs don't use this — they render via their own step renderer.)
 */
export const fieldsForStep = (config, step) => {
  if (Array.isArray(step.fields)) return step.fields;
  const all = Object.values(config.fields || {});
  const tagged = all.filter((f) => f && f.step != null);
  if (tagged.length) return tagged.filter((f) => f.step === step.id);
  return all;
};
