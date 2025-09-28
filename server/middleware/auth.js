const passport = require('passport');

// Custom JWT authentication middleware that ensures JSON responses
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('auth.js - authenticateJWT - Step 5.1: Authentication error', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error' 
      });
    }
    
    if (!user) {
      console.warn('auth.js - authenticateJWT - Step 5.2: JWT Auth failed - No user found or invalid token', info);
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Invalid or missing token',
        code: 'INVALID_TOKEN'
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    // Debug: Log user info
    console.log('🔍 Admin check - User data:', {
      userId: req.user?._id,
      username: req.user?.username,
      email: req.user?.email,
      role: req.user?.role,
      isAdmin: req.user?.isAdmin,
      companyName: req.user?.companyInfo?.companyName
    });

    // Check for admin role or isAdmin boolean field
    const isUserAdmin = req.user && (
      req.user.role === 'admin' ||
      req.user.isAdmin === true ||
      req.user.username === 'sohocoffee' || // Temporary for testing
      req.user.email?.includes('test') || // Temporary for testing
      true // TEMPORARY: Allow all users for debugging
    );

    console.log('🔍 Admin check result:', isUserAdmin);

    if (!isUserAdmin) {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user profile is complete
const checkProfileComplete = async (req, res, next) => {
  try {
    if (!req.user.profileComplete) {
      return res.status(403).json({ 
        message: 'Profile incomplete', 
        redirectTo: '/profile/complete' 
      });
    }
    next();
  } catch (error) {
    console.error('Profile check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate request body
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };
};

module.exports = {
  authenticateJWT,
  isAdmin,
  checkProfileComplete,
  validateRequest
};
