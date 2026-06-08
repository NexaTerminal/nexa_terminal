/**
 * Виртуелен саем (Virtual Fair) — collection schema, limits, and validation.
 *
 * Standalone feature: one "booth" per company (keyed by userId), each booth
 * presents up to 3 offers. Each offer is intentionally minimal — a type
 * (product/service) plus one free-text field. Browsing is open to all
 * logged-in users; posting is gated to active paid plans (see
 * middleware/requireBoothPoster.js). Inquiry-only — no payment/checkout.
 */

const { ObjectId } = require('mongodb');

const COLLECTION = 'fair_booths';

// Field length limits — enforced server-side (controller) and mirrored client-side.
const LIMITS = Object.freeze({
  MAX_OFFERS: 3,
  OFFER_TEXT: 600,
  OFFER_WHYUS: 400,
  WEBSITE: 200,
  CONTACT_EMAIL: 120,
  IMAGE_URL: 300
});

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const OFFER_TYPES = Object.freeze(['product', 'service']);
const BOOTH_STATUSES = Object.freeze(['published', 'hidden']);

/**
 * Booth document shape (for reference — native driver, no enforced schema):
 * {
 *   _id, userId,                       // unique per user
 *   companyName, city, logoUrl,        // denormalized from user.companyInfo at save
 *   offers: [{ type, text }],          // 1..3
 *   status: 'published' | 'hidden',
 *   createdAt, updatedAt, publishedAt
 * }
 */

const isValidObjectId = (id) => ObjectId.isValid(id);
const s = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Validate + normalize a single offer. Returns { errors: [], offer }.
 */
function validateOffer(raw, idx) {
  const errors = [];
  const offer = {
    type: OFFER_TYPES.includes(raw?.type) ? raw.type : 'service',
    text: s(raw?.text),
    whyUs: s(raw?.whyUs)
  };
  const where = `Понуда ${idx + 1}`;
  if (!offer.text) errors.push(`${where}: текстот е задолжителен`);
  if (offer.text.length > LIMITS.OFFER_TEXT) errors.push(`${where}: текстот е предолг`);
  if (offer.whyUs.length > LIMITS.OFFER_WHYUS) errors.push(`${where}: „Зошто ние“ е предолго`);
  return { errors, offer };
}

/**
 * Validate + normalize an incoming booth payload (from PUT /api/fair/me).
 * Returns { errors: [], data } where data is the sanitized, persistable subset.
 */
function validateBooth(raw) {
  const errors = [];
  const rawOffers = Array.isArray(raw?.offers) ? raw.offers : [];

  if (rawOffers.length === 0) errors.push('Додадете барем една понуда');
  if (rawOffers.length > LIMITS.MAX_OFFERS) errors.push(`Максимум ${LIMITS.MAX_OFFERS} понуди`);

  const offers = [];
  rawOffers.slice(0, LIMITS.MAX_OFFERS).forEach((o, i) => {
    const { errors: oErr, offer } = validateOffer(o, i);
    errors.push(...oErr);
    offers.push(offer);
  });

  // Optional booth-level decoration fields.
  let website = s(raw?.website);
  if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
  if (website.length > LIMITS.WEBSITE) errors.push('Веб-страницата е предолга');

  const contactEmail = s(raw?.contactEmail);
  if (contactEmail && !isValidEmail(contactEmail)) errors.push('Невалидна контакт е-пошта');
  if (contactEmail.length > LIMITS.CONTACT_EMAIL) errors.push('Контакт е-поштата е предолга');

  const imageUrl = s(raw?.imageUrl);
  if (imageUrl && !/^(\/uploads\/|https?:\/\/)/i.test(imageUrl)) errors.push('Невалидна слика');
  if (imageUrl.length > LIMITS.IMAGE_URL) errors.push('Сликата е невалидна');

  return { errors, data: { offers, website, contactEmail, imageUrl } };
}

module.exports = {
  COLLECTION,
  LIMITS,
  OFFER_TYPES,
  BOOTH_STATUSES,
  isValidObjectId,
  validateOffer,
  validateBooth
};
