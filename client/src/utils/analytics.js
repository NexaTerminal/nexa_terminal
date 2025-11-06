/**
 * Google Analytics utility functions
 * Provides helper methods for tracking events, page views, and user interactions
 */

// Check if gtag is available
const isGtagAvailable = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Track a page view
 * @param {string} path - The page path to track
 */
export const trackPageView = (path) => {
  if (isGtagAvailable()) {
    window.gtag('config', 'G-CG6RK125HR', {
      page_path: path
    });
  }
};

/**
 * Track a custom event
 * @param {string} eventName - The name of the event
 * @param {object} eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (isGtagAvailable()) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track user login
 * @param {string} method - The login method used (email, username, oauth, etc.)
 */
export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method
  });
};

/**
 * Track user registration
 * @param {string} method - The registration method used
 */
export const trackSignup = (method = 'email') => {
  trackEvent('sign_up', {
    method: method
  });
};

/**
 * Track document generation
 * @param {string} documentType - The type of document generated
 */
export const trackDocumentGeneration = (documentType) => {
  trackEvent('generate_document', {
    document_type: documentType
  });
};

/**
 * Track feature usage
 * @param {string} featureName - The name of the feature used
 */
export const trackFeatureUsage = (featureName) => {
  trackEvent('feature_usage', {
    feature_name: featureName
  });
};
