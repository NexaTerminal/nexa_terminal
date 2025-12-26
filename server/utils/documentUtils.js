const { ObjectId } = require('mongodb');

/**
 * Fetches user and their company information.
 * Throws an error if the user or profile is incomplete.
 * @param {string} userId - The ID of the user.
 * @param {object} db - The database instance.
 * @returns {Promise<{user: object, company: object}>}
 */
async function getUserAndCompanyForDocument(userId, db) {
  if (!userId || !db) {
    throw new Error('User ID and database instance are required.');
  }
  const usersCollection = db.collection('users');
  // Ensure userId is a valid ObjectId if your req.user._id is a string
  const objectIdUserId = typeof userId === 'string' ? new ObjectId(userId) : userId;
  const user = await usersCollection.findOne({ _id: objectIdUserId });

  if (!user) {
    throw new Error('Корисникот не е пронајден.'); // User not found.
  }
  if (!user.profileComplete) {
    throw new Error('Корисничкиот профил е нецелосен. Ве молиме прво комплетирајте го вашиот профил.'); // User profile is incomplete. Please complete your profile first.
  }

  const company = user.companyInfo || {};
  return { user, company };
}

/**
 * Saves a document record to the database.
 * @param {object} db - The database instance.
 * @param {object} recordData - The document data to save.
 * @returns {Promise<object>} The saved document record with its new _id.
 */
async function saveDocumentRecord(db, recordData) {
  const documentsCollection = db.collection('documents');
  const result = await documentsCollection.insertOne(recordData);
  return { ...recordData, _id: result.insertedId };
}

/**
 * Creates a styled paragraph for section headers in a DOCX document.
 * @param {string} text - The header text.
 * @returns {Paragraph} A docx Paragraph object.
 */
function createSectionHeader(text) {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } = require('docx');
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(), // Ensure Macedonian headers are also uppercased if desired
        bold: true,
        size: 28, // 14pt
        underline: { type: UnderlineType.SINGLE },
      }),
    ],
    heading: HeadingLevel.HEADING_2, // Or an appropriate heading level
    alignment: AlignmentType.LEFT, // Or CENTER, as per your design
    spacing: { before: 400, after: 200 }, // In twentieths of a point
  });
}

/**
 * Creates a signature block for a DOCX document.
 * @param {string} signatoryName - The name of the signatory.
 * @param {string} signatoryTitle - The title or role of the signatory (e.g., "Employee", "Employer").
 * @param {string} [printedNameLabel="Print Name:"] - Label for the printed name line.
 * @param {string} [signatureLabel="Signature:"] - Label for the signature line.
 * @param {string} [dateLabel="Date:"] - Label for the date line.
 * @returns {Array<Paragraph>} An array of docx Paragraph objects for the signature block.
 */
function createSignatureBlock(signatoryName, signatoryTitle, printedNameLabel = "Испечатено име:", signatureLabel = "Потпис:", dateLabel = "Датум:") {
  const { Paragraph, TextRun } = require('docx');
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `${signatoryTitle} ${signatureLabel} _________________________    ${dateLabel}: ___________`,
          size: 24, // 12pt
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${printedNameLabel} ${signatoryName || '[Име и Презиме]'}`,
          size: 24, // 12pt
        }),
      ],
      spacing: { after: 300 },
    }),
  ];
}

/**
 * Formats a number as Macedonian currency with proper thousand separators and decimals.
 * Format: 1.000,00 денари (period as thousands separator, comma as decimal separator)
 * @param {number|string} amount - The amount to format.
 * @param {object} options - Formatting options.
 * @param {boolean} options.includeCurrency - Whether to append " денари" (default: true).
 * @param {string} options.fallback - Fallback text if amount is invalid (default: '[Износ]').
 * @param {number} options.decimals - Number of decimal places (default: 2).
 * @returns {string} Formatted amount string.
 */
function formatMKD(amount, options = {}) {
  const {
    includeCurrency = true,
    fallback = '[Износ]',
    decimals = 2
  } = options;

  // Handle null, undefined, or empty string
  if (amount === null || amount === undefined || amount === '') {
    return includeCurrency ? `${fallback} денари` : fallback;
  }

  // Clean the input: remove all non-digit characters except decimal separators
  let cleanAmount = amount.toString().replace(/[^\d.,]/g, '');

  // Replace comma with period for parsing (handle both European and US formats)
  cleanAmount = cleanAmount.replace(',', '.');

  // Parse to number
  const num = parseFloat(cleanAmount);

  // Check if valid number
  if (isNaN(num)) {
    return includeCurrency ? `${fallback} денари` : fallback;
  }

  // Format with Macedonian locale (period for thousands, comma for decimals)
  const formatted = num.toLocaleString('mk-MK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  // Append currency if needed
  return includeCurrency ? `${formatted} денари` : formatted;
}

module.exports = {
  getUserAndCompanyForDocument,
  saveDocumentRecord,
  createSectionHeader,
  createSignatureBlock,
  formatMKD,
};
