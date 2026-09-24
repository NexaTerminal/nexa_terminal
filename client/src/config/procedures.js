// Client mirror of server/config/procedureTemplates.js (admin picker only).
// Keys + categories MUST match the server. Suggestion text lives server-side and
// arrives on each board inquiry via the API — it is NOT duplicated here.
export const PROCEDURES = {
  immigration:       { label: 'Имиграција / работна дозвола', primary: 'residence', categories: ['residence', 'property', 'insurance'] },
  company_formation: { label: 'Основање на фирма',           primary: 'company',   categories: ['company', 'tax', 'property'] },
  property_purchase: { label: 'Купување недвижен имот',       primary: 'property',  categories: ['property', 'other_legal', 'insurance'] }
};

// Ordered [{ value, label, primary, categories }] for the picker.
export const PROCEDURE_OPTIONS = Object.entries(PROCEDURES).map(([value, p]) => ({ value, ...p }));
