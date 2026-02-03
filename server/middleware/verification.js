/**
 * Verification Middleware
 * Ensures only users with complete company data can access certain features
 *
 * UPDATED: Email verification disabled - now checks only company data completeness
 * All features accessible once required company fields are filled
 */

/**
 * Check company information completeness and set flag on request
 * Non-blocking: always calls next() so unverified users can still access features
 */
const requireVerification = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Не сте автентифицирани'
      });
    }

    const hasCompleteCompanyInfo = !!(req.user.companyInfo &&
                                   req.user.companyInfo.companyName &&
                                   (req.user.companyInfo.companyAddress || req.user.companyInfo.address) &&
                                   (req.user.companyInfo.companyTaxNumber || req.user.companyInfo.taxNumber) &&
                                   (req.user.companyInfo.companyManager || req.user.companyManager) &&
                                   (req.user.officialEmail || req.user.email));

    // Set flag on request - downstream handlers can check this
    req.companyDataComplete = hasCompleteCompanyInfo;

    next();
  } catch (error) {
    console.error('Verification middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Серверска грешка при проверка на верификацијата'
    });
  }
};

module.exports = {
  requireVerification
};