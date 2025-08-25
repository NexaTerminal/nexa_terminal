import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially unsafe HTML string
 * @param {Object} options - Optional configuration for DOMPurify
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHTML = (dirty, options = {}) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Default configuration for content
  const defaultConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'a', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    USE_PROFILES: { html: true }
  };

  // Merge default config with provided options
  const config = { ...defaultConfig, ...options };

  try {
    return DOMPurify.sanitize(dirty, config);
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    // Return empty string if sanitization fails
    return '';
  }
};

/**
 * Sanitizes HTML content for basic text with minimal formatting
 * Restrictive configuration for user inputs
 * @param {string} text - User input text
 * @returns {string} - Sanitized text
 */
export const sanitizeUserInput = (text) => {
  return sanitizeHTML(text, {
    ALLOWED_TAGS: ['strong', 'em', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Strips all HTML tags and returns plain text
 * @param {string} html - HTML content
 * @returns {string} - Plain text
 */
export const stripHTML = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export default sanitizeHTML;
