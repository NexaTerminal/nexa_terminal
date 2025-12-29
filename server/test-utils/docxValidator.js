/**
 * DOCX Content Validator
 * Extracts and validates content from generated .docx files
 */

const mammoth = require('mammoth');
const JSZip = require('jszip');

/**
 * Extract text content from DOCX buffer
 * @param {Buffer} buffer - The DOCX file buffer
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Validate DOCX file structure
 * @param {Buffer} buffer - The DOCX file buffer
 * @returns {Promise<Object>} Validation result
 */
async function validateDocxStructure(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);

    // Check for required DOCX files
    const hasContentTypes = zip.files['[Content_Types].xml'] !== undefined;
    const hasDocumentXml = zip.files['word/document.xml'] !== undefined;

    return {
      isValid: hasContentTypes && hasDocumentXml,
      hasContentTypes,
      hasDocumentXml,
      fileCount: Object.keys(zip.files).length
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Validate document content
 * @param {Buffer} buffer - The DOCX file buffer
 * @param {Object} expectedData - Expected data to find in document
 * @returns {Promise<Object>} Validation results
 */
async function validateDocumentContent(buffer, expectedData) {
  const results = {
    isValid: true,
    fileSize: buffer.length,
    errors: [],
    warnings: [],
    checks: {}
  };

  try {
    // 1. Check buffer size
    if (buffer.length < 5000) {
      results.warnings.push('Document size is unusually small (< 5KB)');
    }
    results.checks.sizeCheck = buffer.length >= 5000;

    // 2. Validate DOCX structure
    const structureValidation = await validateDocxStructure(buffer);
    results.checks.structureValid = structureValidation.isValid;

    if (!structureValidation.isValid) {
      results.isValid = false;
      results.errors.push('Invalid DOCX structure');
      return results;
    }

    // 3. Extract text content
    const text = await extractTextFromDocx(buffer);
    results.extractedTextLength = text.length;
    results.checks.hasContent = text.length > 100;

    if (text.length < 100) {
      results.isValid = false;
      results.errors.push('Document content is too short');
      return results;
    }

    // 4. Check for company data
    if (expectedData.companyName) {
      const hasCompanyName = text.includes(expectedData.companyName);
      results.checks.hasCompanyName = hasCompanyName;
      if (!hasCompanyName) {
        results.errors.push(`Company name "${expectedData.companyName}" not found in document`);
        results.isValid = false;
      }
    }

    // 5. Check for Macedonian Cyrillic characters
    const hasCyrillic = /[А-Яа-яЁё]/.test(text);
    results.checks.hasCyrillic = hasCyrillic;
    if (!hasCyrillic) {
      results.warnings.push('No Macedonian Cyrillic characters found');
    }

    // 6. Check for placeholder text (indicates incomplete generation)
    const placeholderPatterns = [
      /\[Име на вработен\]/,
      /\[Датум\]/,
      /\[Адреса\]/,
      /\[Име на компанија\]/,
      /\[placeholder\]/i
    ];

    placeholderPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        results.errors.push(`Found placeholder text: ${pattern}`);
        results.isValid = false;
      }
    });

    // 7. Check for specific form data fields
    if (expectedData.formDataFields) {
      const missingFields = [];
      expectedData.formDataFields.forEach(field => {
        if (field.value && typeof field.value === 'string' && field.value.length > 2) {
          // Only check for meaningful string values
          if (!text.includes(field.value)) {
            missingFields.push(field.name);
          }
        }
      });

      if (missingFields.length > 0) {
        results.warnings.push(`Some form fields not found: ${missingFields.join(', ')}`);
        // Don't mark as invalid - some fields might not appear in all documents
      }
    }

    // 8. Content completeness check
    const wordCount = text.split(/\s+/).length;
    results.wordCount = wordCount;
    results.checks.sufficientContent = wordCount >= 50;

    if (wordCount < 50) {
      results.errors.push('Document word count is too low');
      results.isValid = false;
    }

  } catch (error) {
    results.isValid = false;
    results.errors.push(`Validation error: ${error.message}`);
  }

  return results;
}

/**
 * Quick validation - just checks if valid DOCX
 * @param {Buffer} buffer - The DOCX file buffer
 * @returns {Promise<boolean>}
 */
async function isValidDocx(buffer) {
  try {
    const structureValidation = await validateDocxStructure(buffer);
    return structureValidation.isValid && buffer.length >= 5000;
  } catch {
    return false;
  }
}

module.exports = {
  extractTextFromDocx,
  validateDocxStructure,
  validateDocumentContent,
  isValidDocx
};
