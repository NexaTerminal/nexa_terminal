/**
 * Canonical Topics Q&A categories (leads.nexa.mk / Pro).
 *
 * Admins tag each worklist topic with one of these; members browse and filter
 * open questions by category. Keep this list in sync with the admin new-topic
 * dropdown (AdminTopicsWorklistNew) — the value stored on a topic is the label
 * itself (the worklist `category` field is free text).
 */
export const TOPIC_CATEGORIES = [
  'Работни односи',    // Labour Law
  'Даноци',            // Tax Law
  'Сопственост',       // Real Estate / Property Law
  'Облигации',         // Obligations — the general category covering contracts + damages
  'Корпоративно право',// Corporate Law
  'Усогласеност'       // Compliance
];

/**
 * Common practice-area keys used to route open topics to members by their
 * specialization. Free text is still allowed (the field is a datalist, not a
 * closed select) — this list just keeps the common values consistent.
 */
export const PRACTICE_AREAS = [
  'employment_law',
  'tax_law',
  'corporate_law',
  'contract_law',
  'real_estate_law',
  'ip_law',
  'immigration',
  'compliance',
  'litigation'
];

/** Does a worklist topic belong to the selected category ('all' = any). */
export function topicInCategory(topic, category) {
  if (!category || category === 'all') return true;
  const c = category.toLowerCase();
  return (topic.category || '').toLowerCase() === c
      || (topic.practiceArea || '').toLowerCase() === c;
}
