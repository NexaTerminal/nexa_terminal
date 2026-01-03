/**
 * Document Generation Service
 * Centralized service for all document generation API calls
 */

import { makeAuthenticatedRequest } from './csrfService';

class DocumentService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
  }

  /**
   * Generate and download document
   */
  async generateDocument(endpoint, formData, options = {}) {
    const {
      fileName = 'document',
      onStart = () => {},
      onSuccess = () => {},
      onError = (error) => console.error(error),
      cleanFormData = true
    } = options;

    try {
      onStart();

      // Clean form data if requested
      const dataToSend = cleanFormData ? this.cleanFormData(formData) : formData;
      
      const response = await this.makeRequest(endpoint, dataToSend);
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
        return;
      }

      const blob = await response.blob();

      // Check for warnings in response headers
      const warningsHeader = response.headers.get('X-Generation-Warnings');
      let warnings = [];
      if (warningsHeader) {
        try {
          warnings = JSON.parse(warningsHeader);
          if (warnings.length > 0) {
            this.showWarningMessage(`Документот е генериран со предупредувања: ${warnings.slice(0, 3).join(', ')}${warnings.length > 3 ? '...' : ''}`);
          }
        } catch (e) {
          console.warn('Could not parse warnings from response headers');
        }
      }

      // Extract shareable link data from response headers
      const shareToken = response.headers.get('X-Share-Token');
      const shareUrl = response.headers.get('X-Share-URL');

      // Download the file
      this.downloadFile(blob, `${fileName}.docx`);

      // Call success callback with warnings and share data
      onSuccess({
        warnings,
        shareToken,
        shareUrl,
        fileName: `${fileName}.docx`,
        expiresAt: shareToken ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
      });
    } catch (error) {
      onError(error);
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Make authenticated API request with CSRF protection
   */
  async makeRequest(endpoint, formData) {
    const fullUrl = `${this.baseUrl}/auto-documents/${endpoint}`;
    
    return await makeAuthenticatedRequest(fullUrl, {
      method: 'POST',
      body: JSON.stringify({ formData })
    });
  }

  /**
   * Handle different types of API errors
   */
  async handleErrorResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (response.status === 401) {
      await this.handleAuthError(response);
      return;
    }
    
    let errorMessage;
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || 'Грешка при генерирање на документот';
      } catch (e) {
        errorMessage = 'Грешка при обработка на одговорот од серверот';
      }
    } else {
      const errorText = await response.text();
      console.error('Non-JSON response:', errorText.substring(0, 200));
      errorMessage = `Серверот врати неочекуван одговор (Статус: ${response.status})`;
    }
    
    throw new Error(errorMessage);
  }

  /**
   * Handle authentication errors
   */
  async handleAuthError(response) {
    try {
      const errorData = await response.json();
      console.error('Auth error details:', errorData);
    } catch (e) {
      console.error('Could not parse auth error as JSON');
    }
    
    alert('Вашето влегување е истечено. Ве молиме најавете се повторно.');
    localStorage.removeItem('token');
    window.location.href = '/terminal/login';
  }

  /**
   * Clean form data before sending to API
   */
  cleanFormData(formData) {
    const cleaned = { ...formData };
    
    // Remove empty arrays
    Object.keys(cleaned).forEach(key => {
      if (Array.isArray(cleaned[key])) {
        cleaned[key] = cleaned[key].filter(item => item && item.toString().trim());
        if (cleaned[key].length === 0) {
          delete cleaned[key];
        }
      }
    });
    
    // Remove empty strings
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'string' && !cleaned[key].trim()) {
        delete cleaned[key];
      }
    });
    
    return cleaned;
  }

  /**
   * Download file from blob
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generate filename from form data
   */
  generateFileName(documentType, formData) {
    const nameField = formData.employeeName || formData.clientName || formData.name || 'document';
    const sanitizedName = nameField.replace(/[^a-zA-Z0-9\u0400-\u04FF\s]/g, '').replace(/\s+/g, '-').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    
    return `${documentType}-${sanitizedName}-${timestamp}`;
  }

  /**
   * Show user-friendly error message
   */
  showErrorMessage(message) {
    alert(`Неуспешно генерирање на документот: ${message}`);
  }

  /**
   * Show user-friendly warning message
   */
  showWarningMessage(message) {
    alert(`⚠️ Предупредување: ${message}`);
  }

  /**
   * Validate required fields before submission
   */
  validateRequiredFields(formData, requiredFields) {
    const missing = [];
    
    requiredFields.forEach(field => {
      const value = formData[field];
      
      if (!value) {
        missing.push(field);
        return;
      }
      
      if (typeof value === 'string' && !value.trim()) {
        missing.push(field);
        return;
      }
      
      if (Array.isArray(value) && value.filter(item => item && item.trim()).length === 0) {
        missing.push(field);
        return;
      }
    });
    
    return missing;
  }

  /**
   * Check if user has accepted terms
   */
  validateTermsAcceptance(formData) {
    return Boolean(formData.acceptTerms);
  }
}

// Export singleton instance
export default new DocumentService();

// Export class for testing
export { DocumentService };