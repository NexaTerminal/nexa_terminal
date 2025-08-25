// CSRF Token Service
// Handles CSRF token retrieval and management

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Cache for CSRF token to avoid repeated fetches
let cachedCSRFToken = null;
let tokenFetchPromise = null;

/**
 * Get CSRF token from cookie
 */
export const getCSRFTokenFromCookie = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrfToken') {
      return value;
    }
  }
  return null;
};

/**
 * Get CSRF token from server endpoint
 */
export const fetchCSRFToken = async () => {
  try {
    // Ensure correct CSRF endpoint by handling cases where API_BASE_URL may include '/api'
    const baseUrl = API_BASE_URL.endsWith('/api')
      ? API_BASE_URL.replace(/\/api$/, '')
      : API_BASE_URL;
    const response = await fetch(`${baseUrl}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the token
    cachedCSRFToken = data.csrfToken;
    return data.csrfToken;
  } catch (error) {
    cachedCSRFToken = null;
    return null;
  }
};

/**
 * Get CSRF token with smart caching
 */
export const getCSRFToken = async () => {
  // If we have a cached token, use it
  if (cachedCSRFToken) {
    return cachedCSRFToken;
  }
  
  // If there's already a fetch in progress, wait for it
  if (tokenFetchPromise) {
    return await tokenFetchPromise;
  }
  
  // Start a new fetch
  tokenFetchPromise = fetchCSRFToken();
  const token = await tokenFetchPromise;
  tokenFetchPromise = null;
  
  return token;
};

/**
 * Clear cached CSRF token (call this on auth state changes)
 */
export const clearCSRFTokenCache = () => {
  cachedCSRFToken = null;
  tokenFetchPromise = null;
};

/**
 * Make authenticated API request with CSRF token
 */
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const authToken = localStorage.getItem('token');
  const csrfToken = await getCSRFToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
  };

  const requestOptions = {
    credentials: 'include', // Include cookies
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    },
    ...options
  };

  const response = await fetch(url, requestOptions);

  // If we get a CSRF error, clear cache and retry once
  if (response.status === 403) {
    const errorText = await response.clone().text();
    if (errorText.includes('CSRF') || errorText.includes('csrf')) {
      clearCSRFTokenCache();
      
      // Retry with fresh token
      const freshCsrfToken = await getCSRFToken();
      if (freshCsrfToken && freshCsrfToken !== csrfToken) {
        const retryHeaders = {
          ...defaultHeaders,
          'X-CSRF-Token': freshCsrfToken
        };
        
        const retryOptions = {
          ...requestOptions,
          headers: {
            ...retryHeaders,
            ...(options.headers || {})
          }
        };
        
        return await fetch(url, retryOptions);
      }
    }
  }

  return response;
};
