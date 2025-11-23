// server/models/CreditTransaction.js

// This file defines the conceptual structure of a CreditTransaction document.
// It's not a Mongoose schema, as the project uses the native MongoDB driver.
// creditService.js is responsible for actual database interactions and schema enforcement.

const creditTransactionSchemaDefinition = {
  userId: { type: 'ObjectId', required: true, indexed: true },
  type: {
    type: 'String',
    required: true,
    enum: [
      'WEEKLY_RESET',           // Weekly credit refresh
      'DOCUMENT_GENERATION',    // Document created
      'AI_QUESTION',            // Chatbot question asked
      'LHC_REPORT',             // Legal Health Check report
      'REFERRAL_BONUS',         // Bonus from referrals
      'ADMIN_ADJUSTMENT',       // Manual admin modification
      'REFUND',                 // Credit refunded after failed operation
      'INITIAL_CREDIT'          // Initial credits on signup
    ]
  },
  amount: { type: 'Number', required: true }, // Positive for credit, negative for debit
  balanceBefore: { type: 'Number', required: true },
  balanceAfter: { type: 'Number', required: true },
  metadata: {
    documentType: { type: 'String', default: null },            // e.g., 'employment-agreement'
    conversationId: { type: 'ObjectId', default: null },        // For AI questions
    assessmentId: { type: 'ObjectId', default: null },          // For LHC reports
    referralEmail: { type: 'String', default: null },           // For referral bonuses
    referralCount: { type: 'Number', default: null },           // Number of active referrals
    adminNote: { type: 'String', default: null },               // Admin adjustment reason
    failureReason: { type: 'String', default: null },           // For refunds
    endpoint: { type: 'String', default: null },                // API endpoint that triggered transaction
    ipAddress: { type: 'String', default: null }                // User IP for audit trail
  },
  createdAt: { type: 'Date', default: Date.now, indexed: true },
  createdBy: { type: 'ObjectId', default: null } // Admin user ID for manual adjustments
};

// Validation function for credit transactions
function validateCreditTransaction(transactionData) {
  const errors = [];

  if (!transactionData.userId) {
    errors.push('User ID is required.');
  }

  if (!transactionData.type) {
    errors.push('Transaction type is required.');
  }

  const validTypes = [
    'WEEKLY_RESET',
    'DOCUMENT_GENERATION',
    'AI_QUESTION',
    'LHC_REPORT',
    'REFERRAL_BONUS',
    'ADMIN_ADJUSTMENT',
    'REFUND',
    'INITIAL_CREDIT'
  ];

  if (transactionData.type && !validTypes.includes(transactionData.type)) {
    errors.push(`Invalid transaction type. Must be one of: ${validTypes.join(', ')}`);
  }

  if (typeof transactionData.amount !== 'number') {
    errors.push('Amount must be a number.');
  }

  if (typeof transactionData.balanceBefore !== 'number') {
    errors.push('Balance before must be a number.');
  }

  if (typeof transactionData.balanceAfter !== 'number') {
    errors.push('Balance after must be a number.');
  }

  // Validate balance calculation
  if (transactionData.balanceBefore + transactionData.amount !== transactionData.balanceAfter) {
    errors.push('Balance calculation error: balanceBefore + amount must equal balanceAfter.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  creditTransactionSchemaDefinition,
  validateCreditTransaction,
};
