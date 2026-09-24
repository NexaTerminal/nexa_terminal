/**
 * Procedure Templates — for the Inquiry Board (server/services/inquiriesService.js).
 *
 * A "procedure" is a real-world client scenario (immigration, company formation,
 * property purchase, ...) that typically needs MORE THAN ONE kind of provider.
 * When the operator tags an inbound inquiry with a procedure, its `categories`
 * (INQUIRY_CATEGORIES from inquiryEnums.js) are pre-filled, and each member who
 * sees the inquiry on the board gets a category-specific suggestion hint — the
 * nudge that this live procedure may need their service.
 *
 * Categories MUST be valid INQUIRY_CATEGORIES:
 *   labor, property, insurance, company, citizenship, residence, tax, family,
 *   inheritance, ip, administrative, other_legal, legal_questions
 *
 *   primary : the category that owns the procedure (the lead provider)
 *   attach  : secondary categories that can offer services around it
 *   suggestions[category] : the one-liner shown to a member matched on that category
 */

const PROCEDURE_TEMPLATES = {
  immigration: {
    key: 'immigration',
    label: { mk: 'Имиграција / работна дозвола', en: 'Immigration / work permit' },
    primary: 'residence',
    attach: ['property', 'insurance'],
    suggestions: {
      residence: {
        mk: 'Постапка за имиграција/работна дозвола — водечка правна услуга.',
        en: 'Immigration / work permit procedure — lead legal service.'
      },
      property: {
        mk: 'Клиентот што регулира престој може да бара сместување — изразете интерес.',
        en: 'A client regularizing residence may need housing — express interest.'
      },
      insurance: {
        mk: 'Оваа постапка може да бара осигурителна полиса (задолжителен документ) — изразете интерес.',
        en: 'This procedure may require an insurance policy (a required document) — express interest.'
      }
    }
  },

  company_formation: {
    key: 'company_formation',
    label: { mk: 'Основање на фирма', en: 'Company formation' },
    primary: 'company',
    attach: ['tax', 'property'],
    suggestions: {
      company: {
        mk: 'Основање на фирма — водечка правна услуга.',
        en: 'Company formation — lead legal service.'
      },
      tax: {
        mk: 'Оваа постапка може да бара сметководител за новата фирма — изразете интерес.',
        en: 'This procedure may need an accountant for the new company — express interest.'
      },
      property: {
        mk: 'Новата фирма може да бара деловен простор — изразете интерес.',
        en: 'The new company may need office space — express interest.'
      }
    }
  },

  property_purchase: {
    key: 'property_purchase',
    label: { mk: 'Купување недвижен имот', en: 'Property purchase' },
    primary: 'property',
    attach: ['other_legal', 'insurance'],
    suggestions: {
      property: {
        mk: 'Купување недвижен имот — водечка услуга за недвижности.',
        en: 'Property purchase — lead real-estate service.'
      },
      other_legal: {
        mk: 'Оваа постапка може да бара правна проверка на договорот — изразете интерес.',
        en: 'This procedure may need legal review of the contract — express interest.'
      },
      insurance: {
        mk: 'Купениот имот може да бара имотно осигурување — изразете интерес.',
        en: 'The purchased property may need property insurance — express interest.'
      }
    }
  }
};

/** Return template by key, or null. */
function getProcedureTemplate(key) {
  if (!key) return null;
  return PROCEDURE_TEMPLATES[key] || null;
}

/** True if `key` is a known procedure. */
function isValidProcedure(key) {
  return !!key && Object.prototype.hasOwnProperty.call(PROCEDURE_TEMPLATES, key);
}

/** All INQUIRY_CATEGORIES a procedure touches (primary first, no duplicates). */
function categoriesForProcedure(key) {
  const t = getProcedureTemplate(key);
  if (!t) return [];
  return Array.from(new Set([t.primary, ...(t.attach || [])]));
}

/**
 * Suggestion line for a procedure + category, in `lang`.
 * Falls back to a generic nudge when no category-specific text exists.
 */
function suggestionFor(procedureKey, category, lang = 'mk') {
  const t = getProcedureTemplate(procedureKey);
  const generic = {
    mk: 'Активна постапка може да бара услуга од вашата област — изразете интерес.',
    en: 'A live procedure may need a service in your area — express interest.'
  };
  if (!t || !t.suggestions || !t.suggestions[category]) return generic[lang] || generic.mk;
  const s = t.suggestions[category];
  return s[lang] || s.mk;
}

/** Localized procedure label. */
function procedureLabel(procedureKey, lang = 'mk') {
  const t = getProcedureTemplate(procedureKey);
  if (!t) return null;
  return t.label[lang] || t.label.mk;
}

/** Options for the admin tagging UI: [{ value, label, primary, attach, categories }]. */
function getProcedureOptions(lang = 'mk') {
  return Object.values(PROCEDURE_TEMPLATES).map((t) => ({
    value: t.key,
    label: (t.label && (t.label[lang] || t.label.mk)) || t.key,
    primary: t.primary,
    attach: t.attach || [],
    categories: Array.from(new Set([t.primary, ...(t.attach || [])]))
  }));
}

module.exports = {
  PROCEDURE_TEMPLATES,
  getProcedureTemplate,
  isValidProcedure,
  categoriesForProcedure,
  suggestionFor,
  procedureLabel,
  getProcedureOptions
};
