/**
 * Canonical Topics Q&A categories (leads.nexa.mk / Pro).
 *
 * Admins tag each worklist topic with one of these; members browse and filter
 * open questions by category. Keep this list in sync with the admin new-topic
 * dropdown (AdminTopicsWorklistNew) — the value stored on a topic is the label
 * itself (the worklist `category` field is free text).
 */
export const TOPIC_CATEGORIES = [
  'Корпоративно право',
  'Работни односи',
  'Договори',
  'Штета',
  'Сопственост',
  'Усогласеност'
];

/** Does a worklist topic belong to the selected category ('all' = any). */
export function topicInCategory(topic, category) {
  if (!category || category === 'all') return true;
  const c = category.toLowerCase();
  return (topic.category || '').toLowerCase() === c
      || (topic.practiceArea || '').toLowerCase() === c;
}
