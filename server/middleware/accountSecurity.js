const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { createHash } = require('crypto');

/**
 * Account lockout and attempt tracking
 */
class AccountSecurity {
  constructor(database) {
    this.db = database;
    this.MAX_LOGIN_ATTEMPTS = 5;
    this.LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes
    this.PASSWORD_HISTORY_LENGTH = 5;
  }

  /**
   * Track failed login attempt
   */
  async trackFailedLogin(identifier, ip) {
    const now = new Date();
    const collection = this.db.collection('login_attempts');
    
    // Record the failed attempt
    await collection.insertOne({
      identifier: identifier.toLowerCase(),
      ip,
      success: false,
      timestamp: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Count recent failed attempts
    const recentFailures = await collection.countDocuments({
      identifier: identifier.toLowerCase(),
      success: false,
      timestamp: { $gte: new Date(now.getTime() - this.LOCKOUT_TIME) }
    });

    // Lock account if too many failures
    if (recentFailures >= this.MAX_LOGIN_ATTEMPTS) {
      await this.lockAccount(identifier, ip);
      return {
        locked: true,
        attemptsRemaining: 0,
        lockoutUntil: new Date(now.getTime() + this.LOCKOUT_TIME)
      };
    }

    return {
      locked: false,
      attemptsRemaining: this.MAX_LOGIN_ATTEMPTS - recentFailures,
      lockoutUntil: null
    };
  }

  /**
   * Track successful login
   */
  async trackSuccessfulLogin(identifier, ip, userId) {
    const now = new Date();
    const collection = this.db.collection('login_attempts');
    
    // Record successful login
    await collection.insertOne({
      identifier: identifier.toLowerCase(),
      ip,
      success: true,
      userId,
      timestamp: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    });

    // Clear failed attempts for this identifier
    await collection.deleteMany({
      identifier: identifier.toLowerCase(),
      success: false
    });

    // Update user's last login
    await this.db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          lastLoginAt: now,
          lastLoginIP: ip
        }
      }
    );
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(identifier) {
    const now = new Date();
    const collection = this.db.collection('account_locks');
    
    const lock = await collection.findOne({
      identifier: identifier.toLowerCase(),
      lockedUntil: { $gt: now }
    });

    return lock ? {
      locked: true,
      lockedUntil: lock.lockedUntil,
      reason: lock.reason,
      lockCount: lock.lockCount || 1
    } : { locked: false };
  }

  /**
   * Lock account due to suspicious activity
   */
  async lockAccount(identifier, ip, reason = 'Too many failed login attempts') {
    const now = new Date();
    const lockDuration = this.LOCKOUT_TIME;
    const collection = this.db.collection('account_locks');

    // Check existing locks to increase duration for repeat offenders
    const existingLock = await collection.findOne({
      identifier: identifier.toLowerCase()
    });

    const lockCount = existingLock ? (existingLock.lockCount || 0) + 1 : 1;
    const adjustedDuration = lockDuration * Math.min(lockCount, 5); // Max 5x multiplier

    await collection.replaceOne(
      { identifier: identifier.toLowerCase() },
      {
        identifier: identifier.toLowerCase(),
        ip,
        reason,
        lockedAt: now,
        lockedUntil: new Date(now.getTime() + adjustedDuration),
        lockCount,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      { upsert: true }
    );

    // Log security event
    console.warn(`🔒 Account locked: ${identifier}, IP: ${ip}, Count: ${lockCount}, Reason: ${reason}`);
    
    return {
      lockedUntil: new Date(now.getTime() + adjustedDuration),
      lockCount
    };
  }

  /**
   * Unlock account (admin action)
   */
  async unlockAccount(identifier, adminUserId) {
    await this.db.collection('account_locks').deleteMany({
      identifier: identifier.toLowerCase()
    });

    await this.db.collection('login_attempts').deleteMany({
      identifier: identifier.toLowerCase(),
      success: false
    });

    console.info(`🔓 Account unlocked by admin: ${identifier}, Admin: ${adminUserId}`);
  }

  /**
   * Enhanced password validation
   */
  validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    // Check for common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /test/i
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password))) {
      errors.push('Password contains common patterns that are not allowed');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Calculate password strength score
   */
  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 2, 20);
    
    // Character variety
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[@$!%*?&]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 5;
    
    // Complexity bonus
    if (password.length >= 12) score += 10;
    if (!/(.)\1{2,}/.test(password)) score += 5; // No repeated characters
    
    // Penalty for dictionary words (basic check)
    const commonWords = ['password', 'admin', 'user', 'test', 'login'];
    if (commonWords.some(word => password.toLowerCase().includes(word))) {
      score -= 20;
    }
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      level: score >= 80 ? 'strong' : score >= 60 ? 'medium' : 'weak'
    };
  }

  /**
   * Check password history to prevent reuse
   */
  async checkPasswordHistory(userId, newPassword) {
    const user = await this.db.collection('users').findOne(
      { _id: userId },
      { projection: { passwordHistory: 1 } }
    );

    if (!user || !user.passwordHistory) {
      return { canUse: true };
    }

    // Check if new password matches any in history
    for (const historicalHash of user.passwordHistory) {
      if (await bcrypt.compare(newPassword, historicalHash)) {
        return { 
          canUse: false, 
          message: 'Cannot reuse previous passwords' 
        };
      }
    }

    return { canUse: true };
  }

  /**
   * Update password with history tracking
   */
  async updatePassword(userId, newPassword) {
    const validation = this.validatePassword(newPassword);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const historyCheck = await this.checkPasswordHistory(userId, newPassword);
    if (!historyCheck.canUse) {
      return { success: false, errors: [historyCheck.message] };
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Get current password to add to history
    const user = await this.db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 1, passwordHistory: 1 } }
    );

    const passwordHistory = user.passwordHistory || [];
    if (user.password) {
      passwordHistory.unshift(user.password);
    }

    // Keep only recent passwords
    const trimmedHistory = passwordHistory.slice(0, this.PASSWORD_HISTORY_LENGTH - 1);

    await this.db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          password: hashedPassword,
          passwordHistory: trimmedHistory,
          passwordUpdatedAt: new Date()
        }
      }
    );

    return { success: true };
  }

  /**
   * Setup Two-Factor Authentication
   */
  async setupTwoFA(userId, appName = 'Nexa Terminal') {
    const user = await this.db.collection('users').findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `${appName} (${user.email || user.username})`,
      issuer: appName
    });

    // Store the secret temporarily (not confirmed until verified)
    await this.db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false,
          twoFactorBackupCodes: this.generateBackupCodes()
        }
      }
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryCode: secret.base32,
      backupCodes: await this.getBackupCodes(userId)
    };
  }

  /**
   * Verify and enable Two-Factor Authentication
   */
  async verifyTwoFA(userId, token) {
    const user = await this.db.collection('users').findOne({ _id: userId });
    if (!user || !user.twoFactorSecret) {
      return { success: false, message: '2FA not set up' };
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps of variance
    });

    if (verified) {
      await this.db.collection('users').updateOne(
        { _id: userId },
        { $set: { twoFactorEnabled: true } }
      );

      return { success: true };
    }

    return { success: false, message: 'Invalid verification code' };
  }

  /**
   * Verify 2FA token during login
   */
  async verifyTwoFALogin(userId, token) {
    const user = await this.db.collection('users').findOne({ _id: userId });
    if (!user || !user.twoFactorEnabled) {
      return { success: false, message: '2FA not enabled' };
    }

    // Check if it's a backup code
    if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.includes(token)) {
      // Remove used backup code
      await this.db.collection('users').updateOne(
        { _id: userId },
        { $pull: { twoFactorBackupCodes: token } }
      );

      return { success: true, usedBackupCode: true };
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    return { success: verified };
  }

  /**
   * Generate backup codes for 2FA
   */
  generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Get backup codes for user
   */
  async getBackupCodes(userId) {
    const user = await this.db.collection('users').findOne(
      { _id: userId },
      { projection: { twoFactorBackupCodes: 1 } }
    );

    return user?.twoFactorBackupCodes || [];
  }

  /**
   * Disable Two-Factor Authentication
   */
  async disableTwoFA(userId) {
    await this.db.collection('users').updateOne(
      { _id: userId },
      {
        $unset: {
          twoFactorSecret: '',
          twoFactorEnabled: '',
          twoFactorBackupCodes: ''
        }
      }
    );

    return { success: true };
  }
}

/**
 * Account security middleware factory
 */
const createAccountSecurityMiddleware = (database) => {
  const accountSecurity = new AccountSecurity(database);

  return {
    // Check if account is locked before login
    checkAccountLock: async (req, res, next) => {
      const identifier = req.body.username || req.body.email;
      if (!identifier) return next();

      try {
        const lockStatus = await accountSecurity.isAccountLocked(identifier);
        if (lockStatus.locked) {
          return res.status(423).json({
            success: false,
            message: 'Account is temporarily locked',
            lockedUntil: lockStatus.lockedUntil,
            reason: lockStatus.reason
          });
        }
        next();
      } catch (error) {
        console.error('Account lock check failed:', error);
        next(); // Continue on error
      }
    },

    // Track login attempts
    trackLogin: (success = false) => async (req, res, next) => {
      const identifier = req.body.username || req.body.email;
      const ip = req.ip;

      try {
        if (success && req.user) {
          await accountSecurity.trackSuccessfulLogin(identifier, ip, req.user._id);
        } else if (!success && identifier) {
          const result = await accountSecurity.trackFailedLogin(identifier, ip);
          if (result.locked) {
            return res.status(423).json({
              success: false,
              message: 'Account locked due to too many failed attempts',
              lockedUntil: result.lockoutUntil
            });
          }
          
          // Add attempt info to response
          res.locals.attemptsRemaining = result.attemptsRemaining;
        }
      } catch (error) {
        console.error('Login tracking failed:', error);
      }
      
      next();
    },

    // Password validation
    validatePassword: (req, res, next) => {
      const password = req.body.password || req.body.newPassword;
      if (!password) return next();

      const validation = accountSecurity.validatePassword(password);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: validation.errors,
          strength: validation.strength
        });
      }

      req.passwordStrength = validation.strength;
      next();
    },

    accountSecurity
  };
};

module.exports = {
  AccountSecurity,
  createAccountSecurityMiddleware
};