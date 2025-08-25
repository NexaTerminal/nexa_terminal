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
    if (!req.user || !req.user.isAdmin) { // Changed to check req.user.isAdmin (boolean)
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
