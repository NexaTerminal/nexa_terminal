/**
 * Verification Middleware
 * Ensures users have complete company data for accessing protected features
 *
 * UPDATED: Email verification disabled - now checks only company data completeness
 * All features accessible once required company fields are filled
 */

// Check if user's company data is complete for restricted actions
const requireVerifiedCompany = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // ============================================
    // EMAIL VERIFICATION DISABLED (2025-11-29)
    // ============================================
    // Check only if user has complete company data
    // const isFullyVerified = req.user.isVerified; // COMMENTED OUT

    const hasRequiredFields = req.user.companyInfo &&
                              req.user.companyInfo.companyName &&
                              (req.user.companyInfo.address || req.user.companyInfo.companyAddress) &&
                              (req.user.companyInfo.taxNumber || req.user.companyInfo.companyTaxNumber) &&
                              (req.user.companyInfo.companyManager || req.user.companyManager) &&
                              (req.user.officialEmail || req.user.email);

    // Only check hasRequiredFields (isVerified check removed)
    if (!hasRequiredFields) {
      return res.status(403).json({
        success: false,
        message: 'Complete company data required to access this feature',
        code: 'COMPANY_DATA_REQUIRED',
        details: {
          // isVerified: req.user.isVerified || false, // COMMENTED OUT
          hasRequiredFields: hasRequiredFields || false
        },
        requiredFields: {
          companyName: !!req.user.companyInfo?.companyName,
          address: !!(req.user.companyInfo?.address || req.user.companyInfo?.companyAddress),
          taxNumber: !!(req.user.companyInfo?.taxNumber || req.user.companyInfo?.companyTaxNumber),
          companyManager: !!(req.user.companyInfo?.companyManager || req.user.companyManager),
          officialEmail: !!(req.user.officialEmail || req.user.email)
        }
      });
    }

    next();
  } catch (error) {
    console.error('Verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification check'
    });
  }
};

// ============================================
// EMAIL VERIFICATION DISABLED (2025-11-29)
// ============================================
// This middleware is no longer active
// Email verification has been replaced with company data completeness check
const requireEmailVerification = async (req, res, next) => {
  /*
  // COMMENTED OUT: Email verification check
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'User verification required',
        code: 'VERIFICATION_REQUIRED',
        details: {
          isVerified: false,
          verificationStatus: req.user.verificationStatus || 'pending'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification check'
    });
  }
  */

  // Email verification disabled - proceed without checking
  console.warn('⚠️ requireEmailVerification middleware is disabled. Email verification no longer required.');
  next();
};

// Middleware that allows read access for unverified users but blocks write operations
const allowReadOnlyForUnverified = (req, res, next) => {
  try {
    // For GET requests, allow unverified users to read content
    if (req.method === 'GET') {
      return next();
    }
    
    // For POST, PUT, DELETE operations, require full verification
    return requireVerifiedCompany(req, res, next);
  } catch (error) {
    console.error('Read-only middleware error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during access check' 
    });
  }
};

// Check verification status and add to response (for informational purposes)
// UPDATED: Now checks company data completeness instead of isVerified
const addVerificationStatus = async (req, res, next) => {
  try {
    if (req.user) {
      const hasRequiredFields = !!(req.user.companyInfo?.companyName &&
                                   (req.user.companyInfo?.address || req.user.companyInfo?.companyAddress) &&
                                   (req.user.companyInfo?.taxNumber || req.user.companyInfo?.companyTaxNumber) &&
                                   (req.user.companyInfo?.companyManager || req.user.companyManager) &&
                                   (req.user.officialEmail || req.user.email));

      req.verificationInfo = {
        // isVerified: req.user.isVerified || false, // COMMENTED OUT - no longer primary check
        // verificationStatus: req.user.verificationStatus || 'pending', // COMMENTED OUT
        hasRequiredFields: hasRequiredFields,
        // Access now based on company data completeness, not email verification
        canGenerateDocuments: hasRequiredFields,
        canUseAI: hasRequiredFields,
        canPost: hasRequiredFields
      };
    }
    next();
  } catch (error) {
    console.error('Verification status middleware error:', error);
    next(); // Don't block the request for this informational middleware
  }
};

module.exports = {
  requireVerifiedCompany,
  requireEmailVerification,
  allowReadOnlyForUnverified,
  addVerificationStatus
};