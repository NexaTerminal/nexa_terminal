/**
 * Admin Authorization Middleware
 * Ensures only admin users can access admin-only routes
 */

/**
 * Require admin privileges
 */
const requireAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by authenticateToken middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Не сте автентифицирани'
      });
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Немате админ дозволи за пристап до оваа страница'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Серверска грешка при проверка на админ дозволите'
    });
  }
};

module.exports = {
  requireAdmin
};