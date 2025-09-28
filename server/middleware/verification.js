/**
 * Verification Middleware
 * Ensures only verified users can access certain features
 */

/**
 * Require user verification
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

    // Check if user is verified
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Мора да бидете верификуван корисник за да пристапите до оваа функција',
        requiresVerification: true
      });
    }

    // Check if user has company info (required for marketplace features)
    if (!req.user.companyInfo || !req.user.companyInfo.companyName) {
      return res.status(403).json({
        success: false,
        message: 'Потребни се информации за компанијата за да пристапите до оваа функција',
        requiresCompanyInfo: true
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