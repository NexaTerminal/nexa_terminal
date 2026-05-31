/**
 * Enums for the Nexa 3.0 Inquiry Board (manual model).
 *
 * Deliberately separate from PRACTICE_AREAS in roles.js — the inquiry
 * taxonomy is profession/service-categories the operator tags on emails
 * from the satellite ecosystem, not legal practice areas.
 */

const INQUIRY_SOURCES = Object.freeze([
  'samodaprasham.mk',
  'immigration.mk',
  'macedoniancitizenship.mk',
  'company.nexa.mk',
  'iplaw.nexa.mk',
  'tax.nexa.mk',
  'other'
]);

const INQUIRY_CATEGORIES = Object.freeze([
  'legal', 'accounting', 'tax', 'insurance',
  'real_estate', 'hr', 'marketing', 'translation', 'other'
]);

const INQUIRY_CITIES = Object.freeze([
  'Skopje', 'Bitola', 'Kumanovo', 'Prilep', 'Tetovo', 'Veles', 'Štip',
  'Ohrid', 'Strumica', 'Gostivar', 'Kavadarci', 'Kočani', 'Other', 'Anywhere'
]);

const INQUIRY_LANGUAGES = Object.freeze(['mk', 'en', 'tr', 'other']);

const INQUIRY_URGENCY = Object.freeze(['standard', 'urgent']);

const PROFESSIONS = Object.freeze([
  'lawyer', 'accountant', 'tax_advisor', 'insurance_broker',
  'real_estate', 'hr_consultant', 'marketing', 'translator', 'other'
]);

const INQUIRY_STATUS = Object.freeze({
  OPEN:               'open',
  INTEREST_RECEIVED:  'interest_received',
  PARTIALLY_CLAIMED:  'partially_claimed',
  CLAIMED:            'claimed',
  CLOSED:             'closed'
});

const SIGNAL_STATUS = Object.freeze({
  PENDING:      'pending',
  APPROVED:     'approved',
  ACKNOWLEDGED: 'acknowledged'
});

// Quotas. B = 1 approved engagement per calendar month; C = 3 approved per day.
const QUOTAS = Object.freeze({
  B: { period: 'month', max: 1 },
  C: { period: 'day',   max: 3 }
});

// First-look window. Type C users see inquiries only after this delay
// since posting, unless urgency = 'urgent'.
const FIRST_LOOK_HOURS = 24;

module.exports = {
  INQUIRY_SOURCES,
  INQUIRY_CATEGORIES,
  INQUIRY_CITIES,
  INQUIRY_LANGUAGES,
  INQUIRY_URGENCY,
  PROFESSIONS,
  INQUIRY_STATUS,
  SIGNAL_STATUS,
  QUOTAS,
  FIRST_LOOK_HOURS
};
