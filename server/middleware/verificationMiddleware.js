/**
 * Verification Middleware
 * Ensures users have proper verification status for accessing protected features
 */

// Check if user's company is fully verified for restricted actions
const requireVerifiedCompany = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user is verified
    const isFullyVerified = req.user.isVerified;
    const hasRequiredFields = req.user.companyInfo && 
                              req.user.companyInfo.companyName &&
                              (req.user.companyInfo.address || req.user.companyInfo.companyAddress) &&
                              (req.user.companyInfo.taxNumber || req.user.companyInfo.companyTaxNumber) &&
                              req.user.companyManager &&
                              req.user.officialEmail;

    if (!isFullyVerified || !hasRequiredFields) {
      return res.status(403).json({
        success: false,
        message: 'Company verification required to access this feature',
        code: 'VERIFICATION_REQUIRED',
        details: {
          isVerified: req.user.isVerified || false,
          hasRequiredFields: hasRequiredFields || false,
          verificationStatus: req.user.verificationStatus || 'pending'
        },
        requiredFields: {
          companyName: !!req.user.companyInfo?.companyName,
          address: !!(req.user.companyInfo?.address || req.user.companyInfo?.companyAddress),
          taxNumber: !!(req.user.companyInfo?.taxNumber || req.user.companyInfo?.companyTaxNumber),
          companyManager: !!req.user.companyManager,
          officialEmail: !!req.user.officialEmail
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

// Check if user has verified their email (but not necessarily approved by admin)
const requireEmailVerification = async (req, res, next) => {
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
const addVerificationStatus = async (req, res, next) => {
  try {
    if (req.user) {
      req.verificationInfo = {
        isVerified: req.user.isVerified || false,
        verificationStatus: req.user.verificationStatus || 'pending',
        hasRequiredFields: !!(req.user.companyInfo?.companyName && 
                             (req.user.companyInfo?.address || req.user.companyInfo?.companyAddress) && 
                             (req.user.companyInfo?.taxNumber || req.user.companyInfo?.companyTaxNumber) && 
                             req.user.companyManager && 
                             req.user.officialEmail),
        canGenerateDocuments: req.user.isVerified,
        canUseAI: req.user.isVerified,
        canPost: req.user.isVerified
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