/**
 * Verification Middleware
 * Ensures only users with complete company data can access certain features
 *
 * UPDATED: Email verification disabled - now checks only company data completeness
 * All features accessible once required company fields are filled
 */

/**
 * Require complete company information (email verification disabled)
 */
const requireVerification = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by authenticateToken middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Не сте автентифицирани'
      });
    }

    // ============================================
    // EMAIL VERIFICATION DISABLED (2025-11-29)
    // ============================================
    // Access now granted based on company data completeness only
    // No email verification click required

    /*
    // COMMENTED OUT: Email verification check
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Мора да бидете верификуван корисник за да пристапите до оваа функција',
        requiresVerification: true
      });
    }
    */

    // Check if user has complete company info (all required fields)
    // Accept fields from either companyInfo or root level for backward compatibility
    const hasCompleteCompanyInfo = req.user.companyInfo &&
                                   req.user.companyInfo.companyName &&
                                   (req.user.companyInfo.companyAddress || req.user.companyInfo.address) &&
                                   (req.user.companyInfo.companyTaxNumber || req.user.companyInfo.taxNumber) &&
                                   (req.user.companyInfo.companyManager || req.user.companyManager) &&
                                   (req.user.officialEmail || req.user.email);

    if (!hasCompleteCompanyInfo) {
      return res.status(403).json({
        success: false,
        message: 'Пополнете ги сите задолжителни податоци за компанијата (име, адреса, даночен број, менаџер и email) за да пристапите до оваа функција',
        requiresCompanyInfo: true,
        missingFields: {
          companyName: !req.user.companyInfo?.companyName,
          address: !(req.user.companyInfo?.companyAddress || req.user.companyInfo?.address),
          taxNumber: !(req.user.companyInfo?.companyTaxNumber || req.user.companyInfo?.taxNumber),
          companyManager: !(req.user.companyInfo?.companyManager || req.user.companyManager),
          officialEmail: !(req.user.officialEmail || req.user.email)
        }
      });
    }

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