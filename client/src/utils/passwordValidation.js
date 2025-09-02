/**
 * Password validation utility for Nexa Terminal
 * Enforces strong password requirements with user-friendly feedback
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  requireNumbers: true,
  requireSpecialChars: true,
  requireUppercase: true,
  requireLowercase: true
};

/**
 * Validates password against security requirements
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid boolean and detailed feedback
 */
export const validatePassword = (password) => {
  const errors = [];
  const checks = {
    length: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasUppercase: false,
    hasLowercase: false
  };

  // Check minimum length
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
    checks.length = true;
  } else {
    errors.push(`Лозинката мора да има најмалку ${PASSWORD_REQUIREMENTS.minLength} карактери`);
  }

  // Check for numbers
  if (/\d/.test(password)) {
    checks.hasNumber = true;
  } else {
    errors.push('Лозинката мора да содржи најмалку еден број');
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    checks.hasSpecialChar = true;
  } else {
    errors.push('Лозинката мора да содржи најмалку еден специјален карактер (!@#$%^&*...)');
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    checks.hasUppercase = true;
  } else {
    errors.push('Лозинката мора да содржи најмалку една голема буква');
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    checks.hasLowercase = true;
  } else {
    errors.push('Лозинката мора да содржи најмалку една мала буква');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    checks,
    strength: calculatePasswordStrength(checks)
  };
};

/**
 * Calculate password strength based on criteria met
 * @param {object} checks - Object containing boolean checks for each requirement
 * @returns {string} - Strength level: weak, fair, good, strong
 */
const calculatePasswordStrength = (checks) => {
  const criteriaCount = Object.values(checks).filter(Boolean).length;
  
  if (criteriaCount <= 2) return 'weak';
  if (criteriaCount === 3) return 'fair';
  if (criteriaCount === 4) return 'good';
  return 'strong';
};

/**
 * Validates that two passwords match
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {object} - Match result with isValid boolean and error message
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  const isMatch = password === confirmPassword;
  
  return {
    isValid: isMatch,
    error: isMatch ? null : 'Лозинките не се совпаѓаат'
  };
};

/**
 * Validates username requirements
 * @param {string} username - Username to validate
 * @returns {object} - Validation result with isValid boolean and error message
 */
export const validateUsername = (username) => {
  const errors = [];

  // Check minimum length
  if (!username || username.length < 3) {
    errors.push('Корисничкото име мора да има најмалку 3 карактери');
  }

  // Check maximum length
  if (username && username.length > 20) {
    errors.push('Корисничкото име не смее да биде подолго од 20 карактери');
  }

  // Check for valid characters (alphanumeric and underscore only)
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Корисничкото име може да содржи само букви, бројки и долна црта (_)');
  }

  // Check that it doesn't start with a number
  if (username && /^\d/.test(username)) {
    errors.push('Корисничкото име не може да започнува со број');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};