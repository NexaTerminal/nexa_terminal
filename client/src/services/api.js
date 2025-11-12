const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiService {
  static csrfToken = null;
  
  /**
   * Get CSRF token from cookie
   */
  static getCSRFTokenFromCookie() {
    console.log('🍪 Checking cookies for CSRF token...');
    console.log('🍪 All cookies:', document.cookie);
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrfToken') {
        console.log('✅ Found CSRF token in cookie:', value.substring(0, 10) + '...');
        return value;
      }
    }
    console.log('⚠️ No CSRF token found in cookies');
    return null;
  }

  /**
   * Fetch CSRF token from server
   */
  static async fetchCSRFToken() {
    console.log('🌐 Fetching CSRF token from server...');
    try {
      const response = await fetch(`${API_BASE_URL}/csrf-token`, {
        credentials: 'include' // Include cookies
      });
      console.log('🌐 CSRF token endpoint response:', response.status);
      if (response.ok) {
        const data = await response.json();
        // The server sets the token in a cookie AND returns it in JSON
        // We'll use the JSON value (which matches the cookie value)
        this.csrfToken = data.csrfToken;
        console.log('✅ CSRF token fetched from server:', data.csrfToken ? data.csrfToken.substring(0, 10) + '...' : 'null');
        console.log('🍪 Cookies after fetch:', document.cookie);
        return data.csrfToken;
      } else {
        console.error('❌ Failed to fetch CSRF token, status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching CSRF token:', error);
    }
    return null;
  }

  /**
   * Get CSRF token (from cookie or fetch new one)
   */
  static async getCSRFToken() {
    console.log('🛡️ getCSRFToken called');

    // First, try to get token from cookie
    let token = this.getCSRFTokenFromCookie();

    if (token) {
      console.log('✅ Using existing CSRF token from cookie');
      return token;
    }

    // No cookie found, fetch new token from server
    console.log('⚠️ No token in cookie, fetching from server...');
    token = await this.fetchCSRFToken();

    if (!token) {
      console.error('❌ Failed to obtain CSRF token from server!');
      // Last resort: try reading cookie again in case it was set
      token = this.getCSRFTokenFromCookie();
    }

    console.log('🛡️ Final CSRF token:', token ? `${token.substring(0, 10)}... (length: ${token.length})` : 'null');
    return token;
  }

  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
      const csrfToken = await this.getCSRFToken();
      if (csrfToken) {
        defaultHeaders['X-CSRF-Token'] = csrfToken;
      }
    }

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const config = {
      ...options,
      credentials: 'include', // Include cookies for CSRF
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      // Handle authentication errors specifically
      if (response.status === 401) {
        // Don't automatically clear token here - let the component handle it
        const authError = new Error('Authentication failed. Please login again.');
        authError.isAuthError = true;
        throw authError;
      }

      // Handle permission errors specifically
      if (response.status === 403) {
        let errorMessage = 'Access denied.';
        try {
          const errorData = await response.clone().json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Use default message if can't parse response
        }

        const permissionError = new Error(errorMessage);
        permissionError.isPermissionError = true;
        permissionError.status = 403;
        throw permissionError;
      }

      if (!response.ok) {
        // Clone the response to allow reading the body multiple times if necessary
        const clonedResponse = response.clone();
        let errorData = null;
        let errorMessageToShow = `Server error: ${response.status}`;

        try {
          errorData = await response.json();
          if (errorData && typeof errorData.message === 'string' && errorData.message.trim() !== '') {
            errorMessageToShow = errorData.message;
          } else if (errorData) {
            errorMessageToShow = `Server error: ${JSON.stringify(errorData)}`;
          }
        } catch (jsonError) {
          try {
            const errorText = await clonedResponse.text(); // Use the cloned response for text fallback
            errorMessageToShow = `Server error: ${response.status} - ${errorText || 'Could not read error response body.'}`;
          } catch (textReadError) {
            errorMessageToShow = `Server error: ${response.status} - Unable to read error body.`;
          }
        }
        throw new Error(errorMessageToShow);
      }

      // If response is OK, try to parse JSON.
      // Handle cases where response might be OK but not have a JSON body (e.g. 204 No Content)
      if (response.status === 204) {
        return null;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Convenience methods
  static async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  static async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Download blob (for PDFs, images, etc.) with CSRF token support
   */
  static async downloadBlob(endpoint, method = 'GET', data = null, options = {}) {
    console.log('🔍 downloadBlob called:', { endpoint, method, data });

    const token = localStorage.getItem('token');
    console.log('🔑 Auth token exists:', !!token);

    const defaultHeaders = {
      'Authorization': `Bearer ${token}`
    };

    // Add CSRF token for POST requests
    if (method === 'POST') {
      console.log('🛡️ Fetching CSRF token for POST request...');
      const csrfToken = await this.getCSRFToken();
      console.log('🛡️ CSRF token received:', csrfToken ? csrfToken.substring(0, 10) + '...' : 'null');

      if (csrfToken) {
        defaultHeaders['X-CSRF-Token'] = csrfToken;
        console.log('✅ CSRF token added to headers');
      } else {
        console.error('❌ Failed to get CSRF token!');
      }
      defaultHeaders['Content-Type'] = 'application/json';
    }

    console.log('📦 Request headers:', Object.keys(defaultHeaders));

    const config = {
      method,
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (data && method === 'POST') {
      config.body = JSON.stringify(data);
      console.log('📤 Request body prepared');
    }

    try {
      console.log('🚀 Sending request to:', `${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Request failed:', errorData);
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      console.log('✅ Request successful, returning blob');
      return await response.blob();
    } catch (error) {
      console.error('💥 downloadBlob error:', error);
      throw error;
    }
  }

}

export default ApiService;
