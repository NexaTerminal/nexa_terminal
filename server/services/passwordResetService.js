const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class PasswordResetService {
  constructor(userService, emailService) {
    this.userService = userService;
    this.emailService = emailService;
  }

  // Generate cryptographically secure reset token
  generateResetToken() {
    // Generate 32 random bytes
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before storing (never store plain text)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Token expires in 30 minutes for security
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    
    return {
      plainToken: resetToken,     // Send to user via email
      hashedToken: hashedToken,   // Store in database
      expires: expires
    };
  }

  // Validate password against history to prevent reuse
  async validatePasswordHistory(user, newPassword) {
    // TEMPORARILY DISABLED: Password history validation
    // This allows users to reuse their previous passwords during transition period
    
    /*
    const passwordHistory = user.passwordHistory || [];
    
    // Check against last 5 passwords
    const historyLimit = 5;
    const recentPasswords = passwordHistory
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, historyLimit);
    
    for (const historicPassword of recentPasswords) {
      const isReused = await bcrypt.compare(newPassword, historicPassword.hash);
      if (isReused) {
        throw new Error('Не можете да ја користите една од последните 5 лозинки');
      }
    }
    
    // Check against current password too
    if (user.password) {
      const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
      if (isSameAsCurrent) {
        throw new Error('Новата лозинка мора да биде различна од тековната');
      }
    }
    */
  }

  // Enhanced password validation
  validatePassword(password) {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('Лозинката мора да има најмалку 8 карактери');
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
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', '1234567890'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Лозинката е премногу честа и предвидлива');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // Calculate password strength score
  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 2, 20);
    
    // Character variety bonuses
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns
    
    return Math.max(0, Math.min(100, score));
  }

  // Generate secure reset URL with additional validation
  generateResetURL(user, resetToken, ipAddress, baseUrl) {
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&uid=${user._id}`;
    
    // Add IP validation hash for additional security
    const securityHash = crypto
      .createHash('sha256')
      .update(`${resetToken}${user._id}${ipAddress}`)
      .digest('hex')
      .substring(0, 16);
    
    return `${resetUrl}&sec=${securityHash}`;
  }

  // Validate reset token with comprehensive security checks
  async validateResetToken(token, userId, ipAddress, userAgent) {
    try {
      // Hash the provided token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      // Find user with valid reset token
      const user = await this.userService.findByResetToken(hashedToken);
      
      if (!user || user._id.toString() !== userId) {
        throw new Error('Невалиден или истечен токен за ресетирање на лозинка');
      }
      
      // Check if token has expired
      if (new Date() > user.resetToken.expires) {
        throw new Error('Токенот за ресетирање на лозинка е истечен');
      }
      
      // Token is valid - no need to increment attempts on successful validation
      return user;
    } catch (error) {
      // Only increment attempts on actual validation failures
      if (userId) {
        try {
          await this.incrementTokenAttempts(userId);
        } catch (incrementError) {
          // If increment fails, log but don't override the original error
          console.error('Failed to increment token attempts:', incrementError);
        }
      }
      
      // Log security event for monitoring
      await this.logSecurityEvent('RESET_TOKEN_VALIDATION_FAILED', {
        userId,
        ipAddress,
        userAgent,
        error: error.message,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  // Increment token validation attempts to prevent brute force
  async incrementTokenAttempts(userId) {
    const user = await this.userService.findById(userId);
    if (!user || !user.resetToken) {
      return;
    }

    const currentAttempts = user.resetToken.attempts || 0;
    const newAttempts = currentAttempts + 1;

    // Lock token after 5 failed attempts
    if (newAttempts >= 5) {
      await this.userService.markResetTokenUsed(userId);
      throw new Error('Премногу неуспешни обиди. Барајте нов токен за ресетирање.');
    }

    // Update attempts count
    await this.userService.collection.updateOne(
      { _id: user._id },
      { $set: { 'resetToken.attempts': newAttempts } }
    );
  }

  // Log security events for monitoring and analysis
  async logSecurityEvent(eventType, metadata) {
    try {
      // For now, log to console - later implement proper security logging
      const logEntry = {
        eventType,
        timestamp: new Date().toISOString(),
        ...metadata
      };
      
      console.log(`[SECURITY] ${eventType}:`, JSON.stringify(logEntry, null, 2));
      
      // TODO: Store in dedicated security_logs collection
      // await this.db.collection('security_logs').insertOne(logEntry);
      
    } catch (error) {
      console.error('Security logging failed:', error);
    }
  }

  // Generate security notification email content
  generatePasswordChangeNotificationHTML(user, ipAddress, userAgent, timestamp) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Лозинката е успешно променета</h2>
        
        <p>Почитуван корисник,</p>
        
        <p>Ве известуваме дека лозинката за вашиот Nexa Terminal профил беше успешно променета.</p>
        
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #2d3748; margin-top: 0;">Безбедносни информации:</h4>
          <ul style="color: #4a5568;">
            <li><strong>Време:</strong> ${timestamp}</li>
            <li><strong>IP адреса:</strong> ${ipAddress}</li>
            <li><strong>Прелистувач:</strong> ${userAgent.substring(0, 100)}...</li>
          </ul>
        </div>
        
        <div style="background-color: #fed7d7; padding: 15px; border-radius: 8px; border-left: 4px solid #e53e3e;">
          <p style="margin: 0; color: #742a2a;">
            <strong>⚠️ Безбедносно предупредување:</strong><br>
            Ако не сте ја промениле лозинката, вашиот профил може да биде компромитиран. 
            Веднаш контактирајте не на support@nexa.mk
          </p>
        </div>
        
        <p>Со почит,<br>Nexa Terminal тимот</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #718096;">
          Овој е-мејл е автоматски генериран за безбедносни цели.
        </p>
      </div>
    `;
  }

  // Generate password reset email content with security warnings
  generateResetEmailHTML(user, resetUrl, ipAddress, userAgent, expiresAt) {
    const expirationTime = expiresAt.toLocaleString('mk-MK', {
      timeZone: 'Europe/Skopje',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Барање за ресетирање на лозинка</h2>
        
        <p>Почитуван корисник,</p>
        
        <p>Добивме барање за ресетирање на лозинката за вашиот Nexa Terminal профил.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #3182ce; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: bold;">
            Ресетирај лозинка
          </a>
        </div>
        
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #2d3748; margin-top: 0;">Безбедносни информации:</h4>
          <ul style="color: #4a5568;">
            <li><strong>Време на барање:</strong> ${new Date().toLocaleString('mk-MK')}</li>
            <li><strong>IP адреса:</strong> ${ipAddress}</li>
            <li><strong>Прелистувач:</strong> ${userAgent.substring(0, 100)}...</li>
            <li><strong>Истекува:</strong> ${expirationTime}</li>
          </ul>
        </div>
        
        <div style="background-color: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #d69e2e;">
          <p style="margin: 0; color: #744210;">
            <strong>🔒 Безбедносни напомени:</strong>
          </p>
          <ul style="color: #744210; margin: 10px 0;">
            <li>Овој линк истекува за 15 минути</li>
            <li>Користете го само ако сте го барале ресетирањето</li>
            <li>Никогаш не го споделувајте овој линк со други</li>
            <li>Ако не сте го барале ова, игнорирајте го е-мејлот</li>
          </ul>
        </div>
        
        <p>Ако не можете да кликнете на копчето, копирајте го овој линк во вашиот прелистувач:</p>
        <p style="word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${resetUrl}
        </p>
        
        <p>Со почит,<br>Nexa Terminal тимот</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #718096;">
          Ако не сте го барале ресетирањето на лозинката, може безбедно да го игнорирате овој е-мејл.
        </p>
      </div>
    `;
  }
}

module.exports = PasswordResetService;