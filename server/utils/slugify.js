/**
 * Slug Generation Utility
 * Converts titles to SEO-friendly URL slugs
 * Supports Cyrillic (Macedonian) and Latin characters
 */

// Macedonian Cyrillic to Latin transliteration map
const cyrillicToLatin = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'ѓ': 'gj', 'е': 'e', 'ж': 'zh', 'з': 'z', 'ѕ': 'dz',
  'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj',
  'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o', 'п': 'p',
  'р': 'r', 'с': 's', 'т': 't', 'ќ': 'kj', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'џ': 'dz',
  'ш': 'sh',
  // Uppercase
  'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd',
  'Ѓ': 'gj', 'Е': 'e', 'Ж': 'zh', 'З': 'z', 'Ѕ': 'dz',
  'И': 'i', 'Ј': 'j', 'К': 'k', 'Л': 'l', 'Љ': 'lj',
  'М': 'm', 'Н': 'n', 'Њ': 'nj', 'О': 'o', 'П': 'p',
  'Р': 'r', 'С': 's', 'Т': 't', 'Ќ': 'kj', 'У': 'u',
  'Ф': 'f', 'Х': 'h', 'Ц': 'c', 'Ч': 'ch', 'Џ': 'dz',
  'Ш': 'sh'
};

/**
 * Transliterate Cyrillic text to Latin
 * @param {string} text - Text with Cyrillic characters
 * @returns {string} - Transliterated text
 */
function transliterate(text) {
  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The title to convert
 * @returns {string} - SEO-friendly slug
 */
function generateSlug(title) {
  if (!title) return '';

  return transliterate(title)
    .toLowerCase()
    .trim()
    // Remove special characters except alphanumeric and spaces
    .replace(/[^\w\s-]/g, '')
    // Replace spaces and multiple dashes with single dash
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, '')
    // Limit length to 80 characters
    .substring(0, 80)
    // Remove trailing dash if cut mid-word
    .replace(/-+$/g, '');
}

/**
 * Generate a unique slug by checking database for duplicates
 * @param {Object} db - MongoDB database instance
 * @param {string} title - The title to convert
 * @param {string} excludeId - Blog ID to exclude from duplicate check (for updates)
 * @returns {Promise<string>} - Unique SEO-friendly slug
 */
async function generateUniqueSlug(db, title, excludeId = null) {
  const baseSlug = generateSlug(title);

  if (!baseSlug) {
    // Fallback to timestamp if title produces empty slug
    return `post-${Date.now()}`;
  }

  let slug = baseSlug;
  let counter = 1;

  // Check for existing slugs and add counter if needed
  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await db.collection('blogs').findOne(query);

    if (!existing) {
      return slug;
    }

    // Add counter suffix
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety limit
    if (counter > 100) {
      return `${baseSlug}-${Date.now()}`;
    }
  }
}

module.exports = {
  generateSlug,
  generateUniqueSlug,
  transliterate
};
