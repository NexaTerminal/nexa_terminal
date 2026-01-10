const { createDocumentController } = require('../../utils/baseDocumentController');
const generateLoanAgreementDoc = require('../../document_templates/contracts/loanAgreement');

/**
 * Loan Agreement Controller (Договор за заем)
 * Uses base document controller factory for consistent handling
 * Based on Macedonian Law Articles 545-554 (Loan Agreement)
 */

/**
 * Custom validation for loan agreement
 * Validates loan terms, interest rates, and repayment structure
 */
function validateLoanAgreement(formData) {
  const warnings = [];
  const errors = {};
  const missing = [];

  // Validate loan amount
  const loanAmount = parseFloat(formData.loanAmount) || 0;
  if (loanAmount < 1) {
    missing.push('Износ на заем');
  }

  // Validate interest rate logic
  if (formData.hasInterest === 'yes') {
    const interestRate = parseFloat(formData.interestRate) || 0;

    if (interestRate <= 0) {
      missing.push('Годишна каматна стапка');
    } else if (interestRate > 20) {
      warnings.push('Каматната стапка е многу висока (над 20%). Проверете дали е во согласност со пазарните услови и Законот за заштита на потрошувачите.');
    } else if (interestRate < 1) {
      warnings.push('Каматната стапка е многу ниска (под 1%). Проверете дали е точна.');
    }
  }

  // Validate repayment structure
  if (formData.repaymentType === 'single') {
    if (!formData.repaymentDeadline) {
      missing.push('Рок за враќање на заемот');
    } else {
      // Check if deadline is in the future
      const deadline = new Date(formData.repaymentDeadline);
      const today = new Date();
      const daysDifference = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));

      if (daysDifference < 0) {
        warnings.push('Рокот за враќање е во минатото. Проверете дали датумот е точен.');
      } else if (daysDifference < 30) {
        warnings.push('Рокот за враќање е многу краток (помалку од 30 дена). Проверете дали е реален за примателот.');
      }
    }
  }

  if (formData.repaymentType === 'installments') {
    const numberOfInstallments = parseInt(formData.numberOfInstallments) || 0;

    if (numberOfInstallments < 2) {
      missing.push('Број на рати (минимум 2)');
    } else if (numberOfInstallments > 120) {
      warnings.push('Бројот на рати е многу голем (над 120 месечни рати = 10 години). Проверете дали е реален.');
    }

    if (!formData.firstPaymentDate) {
      missing.push('Датум на прва рата');
    }

    if (!formData.paymentFrequency) {
      missing.push('Фреквенција на плаќање');
    }
  }

  // Validate bank account information
  if (!formData.borrowerBankAccount) {
    missing.push('Трансакциска сметка на примателот');
  }

  if (!formData.borrowerBank) {
    missing.push('Банка на примателот');
  }

  // Validate early repayment notice period
  if (formData.earlyRepayment === 'yes') {
    const noticePeriod = parseInt(formData.earlyRepaymentNotice) || 0;

    if (noticePeriod < 7) {
      warnings.push('Периодот за известување за предвремено враќање е многу краток (помалку од 7 дена). Препорачано е барем 15-30 дена.');
    } else if (noticePeriod > 90) {
      warnings.push('Периодот за известување за предвремено враќање е многу долг (над 90 дена). Проверете дали е разумен.');
    }
  }

  // Validate purpose-specific loan
  if (formData.loanType === 'purpose-specific' && !formData.loanPurpose) {
    warnings.push('За наменски заем според Член 554 од ЗОО, потребно е прецизно да се наведе намената на заемот.');
  }

  // Return validation result - allow generation with warnings
  return {
    isValid: true, // Allow generation even with warnings
    warnings,
    errors,
    missing
  };
}

/**
 * Loan Agreement Controller using factory pattern
 */
const loanAgreementController = createDocumentController({
  templateFunction: generateLoanAgreementDoc,
  documentName: 'LoanAgreement',
  validationFunction: validateLoanAgreement // Custom validation
});

module.exports = loanAgreementController;
