const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

class ApiService {
  static csrfToken = null;
  
  /**
   * Get CSRF token from cookie
   */
  static getCSRFTokenFromCookie() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrfToken') {
        return value;
      }
    }
    return null;
  }
  
  /**
   * Fetch CSRF token from server
   */
  static async fetchCSRFToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/csrf-token`, {
        credentials: 'include' // Include cookies
      });
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
        return data.csrfToken;
      }
    } catch (error) {
      // Silently handle CSRF token fetch errors
    }
    return null;
  }
  
  /**
   * Get CSRF token (from cookie or fetch new one)
   */
  static async getCSRFToken() {
    let token = this.getCSRFTokenFromCookie();
    if (!token) {
      token = await this.fetchCSRFToken();
    }
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

}

export default ApiService;
