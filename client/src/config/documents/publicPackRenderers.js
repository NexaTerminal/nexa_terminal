/**
 * Bespoke public renderers for the central-register packs — maps `apiEndpoint` →
 * the pack page's exported step/preview renderers, so the public share flow reuses
 * the exact same multi-step UI as the authenticated pages.
 *
 * Imported ONLY by PublicDocumentPage (not by ShareLinkButton) to avoid an import
 * cycle (the pack pages import BaseDocumentPage → ShareLinkButton → shareableDocuments).
 */

import { renderStepContent as capRender, renderPreview as capPreview } from '../../pages/terminal/documents/centralRegister/CapitalReductionPage';
import { renderStepContent as chgRender, renderPreview as chgPreview } from '../../pages/terminal/documents/centralRegister/CompanyChangesPage';
import { renderStepContent as incRender, renderPreview as incPreview } from '../../pages/terminal/documents/centralRegister/CompanyFormationPage';

export const PACK_RENDERERS = {
  'company-capital-reduction': { renderStepContent: capRender, renderPreview: capPreview },
  'company-changes': { renderStepContent: chgRender, renderPreview: chgPreview },
  'company-incorporation': { renderStepContent: incRender, renderPreview: incPreview }
};

export const getPackRenderer = (apiEndpoint) => PACK_RENDERERS[apiEndpoint] || null;
