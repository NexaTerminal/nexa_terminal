/**
 * Single source of truth for password strength rules.
 *
 * Used by both registration (authController.validatePassword) and the
 * account credentials update (userController.updateCredentials) so the policy
 * can never drift between the two paths again.
 *
 * Current policy: min 6 chars + at least one digit, one special character,
 * one uppercase and one lowercase letter. (Raise MIN_LENGTH to 8 here to
 * tighten everywhere at once.)
 */
const MIN_LENGTH = 6;

function validatePassword(password) {
  const errors = [];

  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    errors.push(`Лозинката мора да има најмалку ${MIN_LENGTH} карактери`);
  }
  if (!/\d/.test(password)) {
    errors.push('Лозинката мора да содржи најмалку еден број');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Лозинката мора да содржи најмалку еден специјален карактер');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Лозинката мора да содржи најмалку една голема буква');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Лозинката мора да содржи најмалку една мала буква');
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = { validatePassword, MIN_LENGTH };
