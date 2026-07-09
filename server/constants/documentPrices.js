// Market lawyer prices per document type (master-plan Phase 5 — savings meter).
//
// ⚠️ DRAFT VALUES — Martin to review (decision D-5). These are conservative
// estimates of what a Macedonian law office charges to draft each document,
// in EUR. Adjust freely: this file is the single source of truth; nothing
// else needs to change. Framing everywhere is „просечна пазарна цена" —
// an estimate, never a legal-fee claim.
//
// Keys = endpoint slugs from routes/autoDocuments.js.

const DOCUMENT_PRICES_EUR = {
  // Employment
  'employment-agreement': 80,
  'employment-annex': 50,
  'confirmation-of-employment': 20,
  'annual-leave-decision': 30,
  'annual-leave-bonus': 30,
  'unpaid-leave-decision': 30,
  'organization-act': 150,
  'disciplinary-action': 60,
  'warning-letter': 40,
  'termination-warning': 60,
  'termination-agreement': 80,
  'termination-by-employee-request': 50,
  'termination-decision-due-to-duration': 60,
  'termination-due-to-age-limit': 60,
  'termination-due-to-fault': 100,
  'termination-personal-reasons': 100,
  'employee-damages-statement': 40,
  'mandatory-bonus': 30,
  'bonus-decision': 30,
  'bonus-payment': 30,
  'death-compensation-decision': 40,

  // Personal data / GDPR
  'consent-for-personal-data-processing': 40,
  'personal-data-rulebook': 150,
  'politics-for-data-protection': 120,
  'gdpr-company-politics': 120,
  'procedure-for-estimation': 100,

  // Contracts
  'nda': 60,
  'rent-agreement': 100,
  'loan-agreement': 100,
  'services-contract': 120,
  'saas-agreement': 200,
  'master-services-agreement': 250,
  'mediation-agreement': 80,
  'debt-assumption-agreement': 100,
  'vehicle-sale-purchase-agreement': 60,
  'warning-before-lawsuit': 60,

  // Corporate / accounting
  'annual-accounts-adoption': 50,
  'dividend-payment-decision': 50,
  'cash-register-maximum-decision': 30,
  'invoice-signing-authorization': 30,
  'write-off-decision': 40,
  'business-secret-rulebook': 120,
  'employee-stock-purchase-plan': 250,

  // Packages
  'company-incorporation': 300,
  'company-changes': 150
};

// Fallback for unlisted types (incl. My-Templates custom generations).
const DEFAULT_PRICE_EUR = 50;

/** Price for one document type (endpoint slug or documentType). */
function priceFor(documentType) {
  if (!documentType) return DEFAULT_PRICE_EUR;
  const key = String(documentType).toLowerCase();
  return DOCUMENT_PRICES_EUR[key] ?? DEFAULT_PRICE_EUR;
}

/**
 * Derive the document slug from a credit-transaction metadata record
 * ({ documentType?, endpoint? }) — the middleware often has no body
 * documentType, but the endpoint always ends with the slug.
 */
function slugFromTransaction(metadata = {}) {
  if (metadata.documentType) return String(metadata.documentType).toLowerCase();
  const endpoint = String(metadata.endpoint || '');
  const m = endpoint.match(/\/api\/auto-documents\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : null;
}

module.exports = { DOCUMENT_PRICES_EUR, DEFAULT_PRICE_EUR, priceFor, slugFromTransaction };
