/**
 * Mock Authentication Utilities
 * Provides mock user and company data for testing document generation
 */

/**
 * Generate a mock user object with complete company data
 * Mimics the structure expected by document controllers
 */
function createMockUser() {
  return {
    _id: 'test-user-id-12345',
    email: 'test@nexa.mk',
    companyInfo: {
      companyName: 'Тест ДООЕЛ Скопје',
      companyAddress: 'ул. Македонија 123, Скопје',
      address: 'ул. Македонија 123, Скопје',
      companyTaxNumber: '4080012345678',
      taxNumber: '4080012345678',
      companyManager: 'Марко Петровски',
      manager: 'Марко Петровски',
      officialEmail: 'test@nexa.mk',
      role: 'Марко Петровски'
    },
    isVerified: true,
    credits: 1000,
    companyManager: 'Марко Петровски' // Legacy field for backward compatibility
  };
}

/**
 * Create mock request object
 * @param {Object} formData - Form data to be submitted
 * @param {Object} user - Optional custom user object
 */
function createMockRequest(formData, user = null) {
  return {
    body: {
      formData: formData
    },
    user: user || createMockUser(),
    ip: '127.0.0.1',
    connection: {
      remoteAddress: '127.0.0.1'
    },
    originalUrl: '/api/auto-documents/test-endpoint'
  };
}

/**
 * Create mock response object that captures output
 * Returns a promise that resolves with the response data
 */
function createMockResponse() {
  const responseData = {
    statusCode: 200,
    headers: {},
    body: null
  };

  const res = {
    status: function(code) {
      responseData.statusCode = code;
      return this;
    },
    json: function(data) {
      responseData.body = data;
      return this;
    },
    send: function(data) {
      responseData.body = data;
      return this;
    },
    setHeader: function(name, value) {
      responseData.headers[name] = value;
      return this;
    },
    header: function(name, value) {
      responseData.headers[name] = value;
      return this;
    },
    set: function(field, value) {
      // Express res.set() can accept an object or name/value pair
      if (typeof field === 'object') {
        Object.keys(field).forEach(key => {
          responseData.headers[key] = field[key];
        });
      } else {
        responseData.headers[field] = value;
      }
      return this;
    }
  };

  // Store promise resolver
  res._promise = new Promise((resolve) => {
    res._resolve = resolve;
  });

  // Intercept send/json to auto-resolve
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data) {
    originalSend.call(this, data);
    if (res._resolve) res._resolve(responseData);
    return this;
  };

  res.json = function(data) {
    originalJson.call(this, data);
    if (res._resolve) res._resolve(responseData);
    return this;
  };

  res.getResponseData = () => responseData;
  res.getPromise = () => res._promise;

  return res;
}

/**
 * Test a document controller
 * @param {Function} controller - The document controller function
 * @param {Object} formData - Form data to test with
 * @param {Object} options - Optional test options
 * @returns {Promise<Object>} Response data including buffer or error
 */
async function testDocumentController(controller, formData, options = {}) {
  const { user } = options;

  const req = createMockRequest(formData, user);
  const res = createMockResponse();

  try {
    // Call the controller
    await controller(req, res);

    // Wait for response
    const responseData = await res.getPromise();

    return {
      success: responseData.statusCode < 400,
      statusCode: responseData.statusCode,
      headers: responseData.headers,
      body: responseData.body,
      buffer: Buffer.isBuffer(responseData.body) ? responseData.body : null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

module.exports = {
  createMockUser,
  createMockRequest,
  createMockResponse,
  testDocumentController
};
