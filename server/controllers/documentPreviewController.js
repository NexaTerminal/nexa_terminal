/**
 * Document Preview Controller
 * Generates HTML preview of documents for sharing before generation
 */

const { Document, Paragraph, TextRun, HeadingLevel } = require('docx');

class DocumentPreviewController {
  constructor() {
    this.documentTemplates = new Map();
    this.loadDocumentTemplates();
  }

  /**
   * Load all document template functions
   */
  loadDocumentTemplates() {
    // Employment documents
    this.registerTemplate('unpaidLeaveDecision', require('../document_templates/employment/unpaidLeaveDecision'));
    this.registerTemplate('annualLeaveDecision', require('../document_templates/employment/annualLeaveDecision'));
    this.registerTemplate('annualLeaveBonusDecision', require('../document_templates/employment/annualLeaveBonusDecision'));
    this.registerTemplate('bonusDecision', require('../document_templates/employment/bonusDecision'));
    this.registerTemplate('bonusPayment', require('../document_templates/employment/bonusPayment'));
    this.registerTemplate('employmentAgreement', require('../document_templates/employment/employmentAgreement'));
    this.registerTemplate('employmentAnnex', require('../document_templates/employment/employmentAnnex'));
    this.registerTemplate('terminationAgreement', require('../document_templates/employment/terminationAgreement'));
    this.registerTemplate('terminationByEmployeeRequest', require('../document_templates/employment/terminationByEmployeeRequest'));
    this.registerTemplate('terminationDecisionDueToDuration', require('../document_templates/employment/terminationDecisionDueToDuration'));
    this.registerTemplate('terminationDueToAgeLimit', require('../document_templates/employment/terminationDueToAgeLimit'));
    this.registerTemplate('terminationDueToFault', require('../document_templates/employment/terminationDueToFault'));
    this.registerTemplate('terminationPersonalReasons', require('../document_templates/employment/terminationPersonalReasons'));
    this.registerTemplate('terminationWarning', require('../document_templates/employment/terminationWarning'));
    this.registerTemplate('confirmationOfEmployment', require('../document_templates/employment/confirmationOfEmployment'));
    this.registerTemplate('warningLetter', require('../document_templates/employment/warningLetter'));
    this.registerTemplate('mandatoryBonus', require('../document_templates/employment/mandatoryBonus'));
    this.registerTemplate('disciplinaryAction', require('../document_templates/employment/disciplinaryAction'));
    this.registerTemplate('employeeDamagesStatement', require('../document_templates/employment/employeeDamagesStatement'));
    this.registerTemplate('organizationAct', require('../document_templates/employment/organizationAct'));
    this.registerTemplate('deathCompensationDecision', require('../document_templates/employment/deathCompensationDecision'));

    // Contracts
    this.registerTemplate('nda', require('../document_templates/contracts/nda'));
    this.registerTemplate('rentAgreement', require('../document_templates/contracts/rentAgreement'));
    this.registerTemplate('mediationAgreement', require('../document_templates/contracts/mediationAgreement'));
    this.registerTemplate('debtAssumptionAgreement', require('../document_templates/contracts/debtAssumptionAgreement'));
    this.registerTemplate('saasAgreement', require('../document_templates/contracts/saasAgreement'));

    // Obligations
    this.registerTemplate('vehicleSalePurchaseAgreement', require('../document_templates/obligations/vehicleSalePurchaseAgreement'));

    // Accounting
    this.registerTemplate('annualAccountsAdoption', require('../document_templates/accounting/annualAccountsAdoption'));
    this.registerTemplate('cashRegisterMaximumDecision', require('../document_templates/accounting/cashRegisterMaximumDecision'));
    this.registerTemplate('dividendPaymentDecision', require('../document_templates/accounting/dividendPaymentDecision'));
    this.registerTemplate('invoiceSigningAuthorization', require('../document_templates/accounting/invoiceSigningAuthorization'));
    this.registerTemplate('writeOffDecision', require('../document_templates/accounting/writeOffDecision'));

    // Personal Data Protection
    this.registerTemplate('consentForPersonalDataProcessing', require('../document_templates/personalDataProtection/consentForPersonalDataProcessing'));
    this.registerTemplate('gdprCompanyPolitics', require('../document_templates/personalDataProtection/gdprCompanyPolitics'));
    this.registerTemplate('politicsForDataProtection', require('../document_templates/personalDataProtection/politicsForDataProtection'));
    this.registerTemplate('procedureForEstimation', require('../document_templates/personalDataProtection/procedureForEstimation'));

    // Rulebooks
    const personalDataRulebookTemplate = require('../document_templates/rulebooks/personalDataRulebook');
    this.registerTemplate('personalDataRulebook', personalDataRulebookTemplate);
    this.registerTemplate('businessSecretRulebook', personalDataRulebookTemplate); // Same template, different name in client config

    // Other
    this.registerTemplate('employeeStockPurchasePlan', require('../document_templates/other/employeeStockPurchasePlan'));
    this.registerTemplate('masterServicesAgreement', require('../document_templates/other/masterServicesAgreement'));
  }

  /**
   * Register a document template
   */
  registerTemplate(name, templateFunction) {
    this.documentTemplates.set(name, templateFunction);
  }

  /**
   * Generate HTML preview of document
   */
  async generatePreview(req, res) {
    try {
      const { documentType } = req.params;
      const { formData } = req.body;

      console.log(`[Preview] Generating preview for: ${documentType}`);
      console.log(`[Preview] Form data keys:`, Object.keys(formData));
      console.log(`[Preview] Company data in formData:`, {
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        companyTaxNumber: formData.companyTaxNumber,
        companyRepresentative: formData.companyRepresentative,
        companyManager: formData.companyManager
      });

      // Get template function
      const templateFunction = this.documentTemplates.get(documentType);
      if (!templateFunction) {
        console.log(`[Preview] Template not found. Available templates:`, Array.from(this.documentTemplates.keys()));
        return res.status(404).json({
          success: false,
          message: `Template not found for document type: ${documentType}`,
          availableTemplates: Array.from(this.documentTemplates.keys())
        });
      }

      console.log(`[Preview] Template found for ${documentType}`);

      // Extract company data from formData (passed from frontend with user's company info)
      const mockUser = {
        companyInfo: {
          companyName: formData.companyName || '[Име на компанија]',
          address: formData.companyAddress || '[Адреса на компанија]',
          companyAddress: formData.companyAddress || '[Адреса на компанија]',
          taxNumber: formData.companyTaxNumber || '[Даночен број]',
          companyTaxNumber: formData.companyTaxNumber || '[Даночен број]',
          role: formData.companyRepresentative || '[Застапник]',
          manager: formData.companyRepresentative || formData.companyManager || '[Застапник]',
          companyManager: formData.companyRepresentative || formData.companyManager || '[Застапник]'
        }
      };

      const mockCompany = mockUser.companyInfo;

      console.log('[Preview] Company data extracted from formData:', {
        companyName: mockCompany.companyName,
        companyAddress: mockCompany.companyAddress,
        address: mockCompany.address,
        companyManager: mockCompany.companyManager,
        manager: mockCompany.manager,
        formDataKeys: Object.keys(formData)
      });

      console.log('[Preview] Calling template with:', {
        formDataHasCompanyAddress: !!formData.companyAddress,
        formDataHasCompanyManager: !!formData.companyManager,
        mockUserCompanyInfoAddress: mockUser.companyInfo.address,
        mockUserCompanyInfoCompanyAddress: mockUser.companyInfo.companyAddress,
        mockUserCompanyInfoManager: mockUser.companyInfo.manager,
        mockUserCompanyInfoCompanyManager: mockUser.companyInfo.companyManager,
        mockCompanyAddress: mockCompany.address,
        mockCompanyCompanyAddress: mockCompany.companyAddress
      });

      // Generate document using template
      const result = templateFunction(formData, mockUser, mockCompany);

      // Templates can return { doc, sections } or { doc }
      // If sections not provided, extract from doc
      let sections = result.sections;

      if (!sections) {
        console.log(`[Preview] Template returned doc without sections, attempting to extract...`);
        // Extract sections from the Document object
        if (result.doc && result.doc._document && result.doc._document.sections) {
          sections = result.doc._document.sections;
          console.log(`[Preview] Extracted ${sections.length} sections from doc`);
        }
      }

      if (!sections || sections.length === 0) {
        console.log(`[Preview] WARNING: No sections found in template result`);
        return res.status(500).json({
          success: false,
          message: 'Template did not return sections for preview'
        });
      }

      console.log(`[Preview] Found ${sections.length} sections with ${sections[0]?.children?.length || 0} children`);

      // Convert sections to HTML preview
      const htmlPreview = this.convertSectionsToHTML(sections);

      console.log(`[Preview] HTML preview generated, length:`, htmlPreview.length);

      res.json({
        success: true,
        html: htmlPreview,
        documentType,
        formDataKeys: Object.keys(formData)
      });

    } catch (error) {
      console.error('[Preview] Error generating preview:', error);
      console.error('[Preview] Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Грешка при генерирање на преглед',
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Convert raw sections array to HTML
   * Works with sections array returned from templates before Document construction
   */
  convertSectionsToHTML(sections) {
    console.log('[Preview] Converting sections to HTML...');
    let html = '<div class="document-preview">';

    try {
      sections.forEach((section, sectionIndex) => {
        // Children are direct properties in raw sections
        const children = section.children || [];
        console.log(`[Preview] Section ${sectionIndex} has ${children.length} children`);

        children.forEach((child, childIndex) => {
          try {
            // Each child is a Paragraph or Table object
            html += this.convertParagraphToHTML(child);
          } catch (err) {
            console.error(`[Preview] Error converting child ${childIndex}:`, err.message);
          }
        });
      });
    } catch (error) {
      console.error('[Preview] Error converting sections:', error);
      html += '<p>Грешка при генерирање на преглед.</p>';
    }

    html += '</div>';
    console.log(`[Preview] Generated HTML length: ${html.length}`);
    return html;
  }

  /**
   * Detect if text content is an article heading (Член pattern)
   */
  isArticleHeading(text) {
    if (!text) return false;
    // Matches "Член 1", "Член 2", etc.
    return /^Член\s+\d+$/i.test(text.trim());
  }

  /**
   * Detect if paragraph is a document title
   */
  isDocumentTitle(fontSize, isBold, text) {
    // Check for large font size (28 or larger) and bold
    return fontSize >= 28 && isBold && text.length < 100;
  }

  /**
   * Detect if paragraph is a document subtitle
   */
  isDocumentSubtitle(fontSize, isBold, text) {
    // Check for medium font size (24) and bold
    return fontSize >= 24 && isBold && text.length < 100;
  }

  /**
   * Convert Paragraph to HTML
   * Extracts text and formatting from paragraph children (TextRun objects)
   */
  convertParagraphToHTML(paragraph) {
    let text = '';
    let alignment = 'justify';
    let isBold = false;
    let isItalic = false;
    let fontSize = null;

    // Filter for text runs only
    const allChildren = paragraph.root || [];
    const children = allChildren.filter(child => child.rootKey === 'w:r');

    // Extract text and formatting
    children.forEach(child => {
      if (child.root && Array.isArray(child.root)) {
        child.root.forEach(element => {
          // Extract text from w:t elements
          if (element && element.rootKey === 'w:t' && element.root && Array.isArray(element.root)) {
            element.root.forEach(item => {
              if (typeof item === 'string') {
                text += item;
              }
            });
          }

          // Extract formatting from w:rPr elements
          if (element && element.rootKey === 'w:rPr' && element.root) {
            element.root.forEach(prop => {
              if (prop.rootKey === 'w:b') isBold = true;
              if (prop.rootKey === 'w:i') isItalic = true;
              if (prop.rootKey === 'w:sz' && prop.root && prop.root[0] && prop.root[0].root) {
                fontSize = prop.root[0].root.val;
              }
            });
          }
        });
      }
    });

    // Detect alignment from paragraph properties
    if (paragraph.properties && paragraph.properties.root) {
      const jcProp = paragraph.properties.root.find(prop => prop.rootKey === 'w:jc');
      if (jcProp && jcProp.root && jcProp.root[0] && jcProp.root[0].root) {
        const alignValue = jcProp.root[0].root.val;
        if (alignValue === 'center') alignment = 'center';
        else if (alignValue === 'both') alignment = 'justify';
        else if (alignValue === 'left') alignment = 'left';
        else if (alignValue === 'right') alignment = 'right';
      }
    }

    // Return empty line if no text
    if (text.trim() === '') {
      return '<br />\n';
    }

    // Escape HTML
    let escapedText = this.escapeHtml(text);

    // Determine paragraph type and apply semantic CSS classes
    let cssClass = '';
    let allowBold = false; // Only allow bold for specific elements

    // Check if it's an article heading (Член 1, Член 2, etc.)
    if (this.isArticleHeading(text)) {
      cssClass = 'article-heading';
      allowBold = true; // CSS makes it bold and centered
    }
    // Check if it's a document title (large font + bold)
    else if (fontSize >= 28 && isBold) {
      cssClass = 'doc-title';
      allowBold = true;
    }
    // Check if it's a document subtitle (medium font + bold)
    else if (fontSize >= 24 && isBold) {
      cssClass = 'doc-subtitle';
      allowBold = true;
    }
    // Check if it's centered bold text (like О Д Л У К А)
    else if (alignment === 'center' && isBold) {
      cssClass = 'centered-bold';
      allowBold = true;
    }
    // Check if it's a signature line (starts with underscores or dashes)
    else if (text.match(/^[_\-]{10,}/)) {
      if (alignment === 'right') {
        cssClass = 'signature-right';
      } else if (alignment === 'left') {
        cssClass = 'signature-left';
      }
      allowBold = false; // Signatures should NOT be bold
    }
    // Check if it's right-aligned (likely signature/company info)
    else if (alignment === 'right') {
      cssClass = 'align-right';
      allowBold = false; // Company info should NOT be bold
    }
    // Check if it's left-aligned signature
    else if (alignment === 'left' && text.match(/^[_\-]{10,}/)) {
      cssClass = 'signature-left';
      allowBold = false;
    }

    // IMPORTANT: Only apply bold if explicitly allowed
    // This ensures only titles, subtitles, and Član headings are bold
    if (isItalic) {
      escapedText = `<em>${escapedText}</em>`;
    }

    // Build HTML with semantic class
    if (cssClass) {
      return `<p class="${cssClass}">${escapedText}</p>\n`;
    } else {
      return `<p>${escapedText}</p>\n`;
    }
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Convert Table to HTML
   */
  convertTableToHTML(table) {
    let html = '<table class="preview-table">\n';

    if (table.rows && table.rows.length > 0) {
      table.rows.forEach(row => {
        html += '  <tr>\n';

        if (row.cells && row.cells.length > 0) {
          row.cells.forEach(cell => {
            let cellText = '';

            if (cell.children && cell.children.length > 0) {
              cell.children.forEach(child => {
                if (child.constructor.name === 'Paragraph') {
                  // Extract text from paragraph without HTML tags
                  if (child.children && child.children.length > 0) {
                    child.children.forEach(run => {
                      if (run.text) {
                        cellText += run.text;
                      }
                    });
                  }
                }
              });
            }

            html += `    <td>${cellText}</td>\n`;
          });
        }

        html += '  </tr>\n';
      });
    }

    html += '</table>\n';
    return html;
  }
}

module.exports = DocumentPreviewController;
