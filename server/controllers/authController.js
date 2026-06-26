const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validatePassword } = require('../utils/passwordPolicy');
const UserService = require('../services/userService');
const PasswordResetService = require('../services/passwordResetService');
const EmailService = require('../services/emailService');
const MarketplaceService = require('../services/marketplaceService');
const settingsManager = require('../config/settingsManager');

class AuthController {
  constructor() {
    // Methods will be bound automatically when defined as arrow functions
    // or bound when accessed through the instance
  }

  // Generate JWT token
  generateToken(user) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set');
    }

    return jwt.sign(
      { 
        id: user._id.toString(), 
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Format user response
  formatUserResponse(user) {
    return {
      id: user._id,
      _id: user._id,
      username: user.username,
      email: user.email || '',
      role: user.role || 'user',
      isAdmin: user.isAdmin || false,
      profileComplete: user.profileComplete,
      companyInfo: user.companyInfo,
      isVerified: user.isVerified,
      // Account-level suspension (set by admin). Missing field = active.
      isActive: user.isActive !== false,
      suspendedUntil: user.suspendedUntil || null,
      suspensionReason: user.suspensionReason || null,
      mustChangePassword: user.mustChangePassword === true,
      parentSuperUserId: user.parentSuperUserId || null,
      intendedPlan: user.intendedPlan || null,
      needsTierOnboarding: user.needsTierOnboarding === true,
      superUser: user.superUser ? {
        // Surface fields the frontend needs without exposing back-office config.
        practiceAreas: user.superUser.practiceAreas || [],
        cities: user.superUser.cities || []
      } : undefined,
      // ⚠️ Tier-resolution dependency: lib/tier.js → effectiveTier(user) reads
      // user.subscription?.plan and user.subscription?.status. Without these
      // fields, paid Admin · 5 / · 10 users get bucketed into Type A and the
      // Blogs / Leads / SubUsers / Topics Q&A sidebar entries stay hidden.
      subscription: user.subscription ? {
        status: user.subscription.status || null,
        plan:   user.subscription.plan   || null,
        cycle:  user.subscription.cycle  || null,
        endsAt: user.subscription.endsAt || null,
        // Grace window — lib/tier.js previewMode() needs this to keep a
        // grace-period user out of preview mode.
        graceEndsAt: user.subscription.gracePeriod?.endsAt || null,
        graceUsed:   user.subscription.gracePeriod?.used === true
      } : null
    };
  }

  // Create admin user
  createAdmin = async (req, res) => {
    try {
      const { email, password, secretKey } = req.body;
      const db = req.app.locals.db;
      const userService = new UserService(db);

      // Gate admin creation on ADMIN_SETUP_KEY only — no hardcoded fallback.
      // If the env key is unset, the endpoint is disabled entirely (fail closed),
      // and the comparison is timing-safe to avoid leaking the key byte-by-byte.
      const setupKey = process.env.ADMIN_SETUP_KEY;
      const provided = typeof secretKey === 'string' ? secretKey : '';
      const keyOk = !!setupKey &&
        provided.length === setupKey.length &&
        crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(setupKey));
      if (!keyOk) {
        return res.status(403).json({ message: 'Invalid secret key' });
      }

      // Check if admin already exists
      const existingAdmin = await userService.findByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin user already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create admin user
      const adminUserData = {
        email,
        password: hashedPassword,
        isAdmin: true,
        role: 'admin',
        profileComplete: true,
        isVerified: true
      };

      const adminUser = await userService.createUser(adminUserData);

      res.status(201).json({
        message: 'Admin user created successfully',
        user: {
          id: adminUser._id,
          email: adminUser.email,
          role: adminUser.role,
          isAdmin: adminUser.isAdmin
        }
      });
    } catch (error) {
      console.error('Admin creation error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Validate password strength (delegates to the shared policy so register
  // and credentials-update stay in lockstep).
  validatePassword(password) {
    return validatePassword(password);
  }

  // Validate username
  validateUsername(username) {
    const errors = [];
    
    if (!username || username.length < 3) {
      errors.push('Корисничкото име мора да има најмалку 3 карактери');
    }
    
    if (username && username.length > 20) {
      errors.push('Корисничкото име не смее да биде подолго од 20 карактери');
    }
    
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Корисничкото име може да содржи само букви, бројки и долна црта (_)');
    }
    
    if (username && /^\d/.test(username)) {
      errors.push('Корисничкото име не може да започнува со број');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Register new user
  register = async (req, res) => {
    try {
      const { username, password, referralCode, intendedPlan, email } = req.body;

      // Basic field validation
      if (!username || !password) {
        return res.status(400).json({
          message: 'Корисничкото име и лозинката се задолжителни',
          field: !username ? 'username' : 'password'
        });
      }

      // Email required at signup so we can verify ownership before the
      // trial clock starts. Without it, abusers can register N times.
      const { normalizeEmail, isValidEmail } = require('../utils/emailNormalize');
      const emailTrimmed = String(email || '').trim().toLowerCase();
      if (!emailTrimmed || !isValidEmail(emailTrimmed)) {
        return res.status(400).json({
          message: 'Внесете валидна е-пошта.',
          field: 'email'
        });
      }
      const normalizedEmail = normalizeEmail(emailTrimmed);

      // Username validation
      const usernameValidation = this.validateUsername(username);
      if (!usernameValidation.isValid) {
        return res.status(400).json({ 
          message: usernameValidation.errors[0],
          field: 'username'
        });
      }

      // Password validation
      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: 'Лозинката не ги исполнува безбедносните барања: ' + passwordValidation.errors.join(', '),
          field: 'password',
          errors: passwordValidation.errors
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);

      // Check if user already exists by username
      const existingUser = await userService.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          message: 'Ова корисничко име е веќе зафатено. Ве молиме изберете друго.',
          field: 'username'
        });
      }

      // Email eligibility: block re-registration when the same email already
      // belongs to a non-sub-seat account (regardless of trial status).
      try {
        await userService.assertEmailEligibleForNewAccount(normalizedEmail);
      } catch (e) {
        if (e.code === 'EMAIL_ALREADY_REGISTERED') {
          return res.status(409).json({ message: e.message, field: 'email' });
        }
        throw e;
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Process referral code if provided
      let referredByCode = null;
      if (referralCode && referralCode.trim().length > 0) {
        try {
          const referralService = req.app.locals.referralService;
          if (referralService) {
            // Validate referral code exists
            const referrer = await userService.findByReferralCode(referralCode.trim());
            if (referrer) {
              referredByCode = referralCode.trim();
              // Track the referral invitation
              await referralService.processInvitation(referredByCode, username);
              console.log(`✅ User ${username} registered with referral code: ${referredByCode}`);
            } else {
              console.log(`⚠️ Invalid referral code provided: ${referralCode}`);
            }
          }
        } catch (referralError) {
          // Log error but don't fail registration
          console.error('Referral processing error:', referralError.message);
        }
      }

      // Determine role from intendedPlan (Step "I'm signing up as a…").
      // Falls back to 'standard_user' if not provided (legacy clients).
      const { roleForPlan, seatsForPlan, isValidPlan } = require('../constants/roles');
      const planChoice = isValidPlan(intendedPlan) ? intendedPlan : 'basic';
      const intendedRole = roleForPlan(planChoice);
      const intendedSeats = seatsForPlan(planChoice);

      // Create new user with minimal required information
      const userData = {
        username: username.trim().toLowerCase(),
        password: hashedPassword,
        email: emailTrimmed,
        emailVerified: false,
        role: intendedRole,
        intendedPlan: planChoice,
        // First-look modal asks the user which tier they want to evaluate during
        // the trial. Set on every new signup; cleared once the modal is dismissed.
        needsTierOnboarding: true,
        referredBy: referredByCode,
        companyInfo: {
          companyName: '',
          companyAddress: '',
          companyTaxNumber: '',
          companyManager: '',
          businessActivity: '',
          website: '',
          industry: '',
          companySize: '',
          role: '',
          description: '',
          crnNumber: '',
          phone: '',
          companyPIN: '',
          contactEmail: '',
          facebook: '',
          linkedin: '',
          missionStatement: '',
          companyLogo: ''
        },
        profileComplete: false,
        emailVerified: false,
        isVerified: false
      };

      // console.log('Creating user with data:', JSON.stringify(userData, null, 2));

      const newUser = await userService.createUser(userData);

      // Seed the admin_user's superUser sub-doc with the plan's seat limit
      // so the Team UI works during trial.
      if (intendedRole === 'admin_user') {
        try {
          await req.app.locals.db.collection('users').updateOne(
            { _id: newUser._id },
            { $set: { superUser: {
                seatLimit: intendedSeats,
                practiceAreas: [],
                cities: [],
                topicsSlotsPerQuarter: 2,
                blogPostsPerMonth: 1,
                lastAssignedAt: null
            } } }
          );
        } catch (e) { console.error('superUser init warning:', e.message); }
      }

      // Email verification step — block the trial / credits / token until the
      // user confirms ownership of the email by entering the 6-digit code.
      try {
        const evs = req.app.locals.emailVerificationService;
        if (evs) await evs.issueCode(newUser);
      } catch (e) {
        console.error('issueCode failed at register:', e.message);
        // Don't surface a hard failure — the user can still request a resend.
      }

      return res.status(202).json({
        requireEmailVerification: true,
        userId: String(newUser._id),
        email: emailTrimmed,
        message: 'Ви испративме 6-цифрен код за верификација на е-поштата.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * POST /api/auth/verify-email  { userId, code }
   * On success: marks emailVerified=true, initializes the account LOCKED (no
   * auto-trial) + credits, and returns { token, user } so the client logs in
   * immediately. Feature access begins only via a redeem code or a paid plan.
   */
  verifyEmail = async (req, res) => {
    try {
      const { userId, code } = req.body || {};
      if (!userId || !code) {
        return res.status(400).json({ message: 'Недостасуваат податоци.' });
      }
      const evs = req.app.locals.emailVerificationService;
      if (!evs) return res.status(500).json({ message: 'Сервисот не е достапен.' });

      const result = await evs.verifyCode(userId, code);
      if (!result.ok) {
        const m = {
          NO_CODE:           'Нема активен код. Побарајте нов.',
          EXPIRED:           'Кодот е истечен. Побарајте нов.',
          TOO_MANY_ATTEMPTS: 'Премногу обиди. Побарајте нов код.',
          MISMATCH:          `Погрешен код. Преостанати обиди: ${result.attemptsLeft ?? 0}.`,
          INVALID_USER:      'Невалиден корисник.'
        };
        return res.status(400).json({ message: m[result.reason] || 'Невалиден код.' });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      await db.collection('users').updateOne(
        { _id: new (require('mongodb').ObjectId)(userId) },
        { $set: { emailVerified: true, emailVerifiedAt: new Date(), updatedAt: new Date() } }
      );

      // Email verified — initialize the account LOCKED (no auto-trial).
      // Access begins only when a code is redeemed or a plan is purchased.
      try {
        const sub = req.app.locals.subscriptionService;
        if (sub) await sub.initLocked(userId);
      } catch (e) { console.error('initLocked after verify warning:', e.message); }

      try {
        const creditService = req.app.locals.creditService;
        if (creditService) await creditService.getUserCredits(userId);
      } catch (e) { console.error('credit init after verify warning:', e.message); }

      const fresh = await userService.findById(userId);
      const token = this.generateToken(fresh);
      return res.json({
        token,
        user: this.formatUserResponse(fresh)
      });
    } catch (err) {
      console.error('verifyEmail error:', err);
      return res.status(500).json({ message: 'Серверска грешка.' });
    }
  };

  /**
   * POST /api/auth/resend-verification  { userId }
   * Rate-limited; uses the same 60s cooldown enforced inside the service.
   */
  resendVerification = async (req, res) => {
    try {
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json({ message: 'Недостасува userId.' });
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const user = await userService.findById(userId);
      if (!user) return res.status(404).json({ message: 'Корисникот не е пронајден.' });
      if (user.emailVerified) return res.status(400).json({ message: 'Е-поштата веќе е потврдена.' });

      const evs = req.app.locals.emailVerificationService;
      if (!evs) return res.status(500).json({ message: 'Сервисот не е достапен.' });
      try {
        await evs.issueCode(user);
        return res.json({ ok: true });
      } catch (e) {
        if (e.code === 'COOLDOWN') {
          return res.status(429).json({ message: e.message, waitSec: e.waitSec });
        }
        throw e;
      }
    } catch (err) {
      console.error('resendVerification error:', err);
      return res.status(500).json({ message: 'Серверска грешка.' });
    }
  };

  // Login with username/password
  loginUsername = async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Корисничкото име/даночен број и лозинката се задолжителни',
          field: !username ? 'username' : 'password'
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      
      // Find user by username or tax number
      const user = await userService.findByUsernameOrTaxNumber(username);
      if (!user) {
        return res.status(401).json({ 
          message: 'Корисничкото име или даночен број не постои. Проверете ги податоците или се регистрирајте.',
          field: 'username'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: 'Неточна лозинка. Ве молиме проверете ја лозинката и обидете се повторно.',
          field: 'password'
        });
      }

      // Update last login
      await userService.updateLastLogin(user._id);

      // Generate JWT token
      const token = this.generateToken(user);

      res.json({
        success: true,
        token,
        user: this.formatUserResponse(user),
        message: 'Успешна најава!'
      });
    } catch (error) {
      console.error('Username login error:', error);
      res.status(500).json({ 
        message: 'Серверска грешка. Ве молиме обидете се повторно.'
      });
    }
  }

  // Login handler for passport authentication
  async login(req, res, next, user) {
    try {
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profileComplete: user.profileComplete,
          companyInfo: user.companyInfo,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Validate token
  validateToken = async (req, res) => {
    try {
      // Get user ID from JWT payload
      const userId = req.user.id || req.user._id;

      // Get database connection
      const db = req.app.locals.db || req.app.locals.database;
      if (!db) {
        return res.status(500).json({ valid: false, message: 'Database connection not available' });
      }

      // Fetch complete user data from database
      const userService = new UserService(db);
      const fullUser = await userService.findById(userId);

      if (!fullUser) {
        return res.status(404).json({ valid: false, message: 'User not found' });
      }

      // Return the complete user object via the shared formatter so this
      // endpoint stays in lockstep with /auth/login, /users/profile, etc.
      // ⚠️ DO NOT INLINE FIELDS HERE. The Sidebar tier predicates depend on
      // `subscription.plan`, `subscription.status`, `intendedPlan`, and
      // `role` — any missing field collapses the user to Type A and hides
      // Blogs / Leads / Topics Q&A / Sub Users on every route except the
      // ones that explicitly call refreshUser().
      res.json({
        valid: true,
        user: {
          ...this.formatUserResponse(fullUser),
          // Legacy fields kept for back-compat with callers that may still
          // read these directly from the validate response.
          companyManager: fullUser.companyManager,
          officialEmail: fullUser.officialEmail,
          verificationStatus: fullUser.verificationStatus
        }
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ valid: false, message: 'Server error' });
    }
  }

  // Update user profile
  updateProfile = async (req, res) => {
    try {
      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;
      
      const {
        email,
        companyInfo,
        marketplaceInfo,
        profileComplete
      } = req.body;

      const db = req.app.locals.db;
      const userService = new UserService(db);

      // Get current user
      const currentUser = await userService.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If email is being updated, check if it's already taken by another user
      if (email && email !== currentUser.email) {
        const existingUser = await userService.findByEmail(email);
        if (existingUser && existingUser._id.toString() !== currentUser._id.toString()) {
          if (email.trim() !== '') {
            return res.status(400).json({ message: 'Email already exists' });
          }
        }
      }

      // Prepare update data
      const updateData = {};

      if (typeof email === 'string') updateData.email = email.trim() === '' ? null : email.trim();

      if (companyInfo) {
        // Tax number immutability check - cannot be changed once profile is complete
        if (currentUser.profileComplete &&
            companyInfo.companyTaxNumber &&
            currentUser.companyInfo.companyTaxNumber &&
            companyInfo.companyTaxNumber !== currentUser.companyInfo.companyTaxNumber) {
          return res.status(400).json({
            message: 'Даночниот број не може да се менува согласно Законот за трговски друштва'
          });
        }

        // Merge existing companyInfo with new data
        updateData.companyInfo = {
          ...currentUser.companyInfo,
          ...companyInfo
        };

        // Trim string fields if they exist
        Object.keys(companyInfo).forEach(key => {
          if (typeof companyInfo[key] === 'string') {
            updateData.companyInfo[key] = companyInfo[key].trim();
          }
        });

        // Check if profile should be marked complete
        const requiredFields = ['companyName', 'companyAddress', 'companyTaxNumber', 'companyManager'];
        const allFieldsComplete = requiredFields.every(field => updateData.companyInfo[field]?.trim());

        if (allFieldsComplete && !currentUser.profileComplete) {
          updateData.profileComplete = true;
        }
      }

      if (typeof profileComplete === 'boolean') updateData.profileComplete = profileComplete;

      // Handle marketplace info if provided
      if (marketplaceInfo && settingsManager.isFeatureEnabled('marketplace')) {
        // Store marketplace info in user profile for later processing
        updateData.marketplaceInfo = {
          serviceCategory: marketplaceInfo.serviceCategory?.trim(),
          serviceDescription: marketplaceInfo.serviceDescription?.trim() || '',
          servesRemote: marketplaceInfo.servesRemote || false
        };
      }

      // Update user
      const updatedUser = await userService.updateUser(currentUser._id, updateData);

      // Auto-create service provider if user is verified and has marketplace info
      let serviceProviderCreated = false;
      if (
        updatedUser.isVerified &&
        updatedUser.marketplaceInfo?.serviceCategory &&
        settingsManager.isFeatureEnabled('marketplace')
      ) {
        try {
          const marketplaceService = new MarketplaceService(db);

          // Check if service provider already exists
          const existingProvider = await marketplaceService.getProviderByUserId(updatedUser._id);

          if (!existingProvider) {
            await marketplaceService.createServiceProviderFromUser(
              updatedUser._id,
              updatedUser.marketplaceInfo.serviceCategory,
              {
                description: updatedUser.marketplaceInfo.serviceDescription,
                servesRemote: updatedUser.marketplaceInfo.servesRemote,
                phone: updatedUser.phone,
                website: updatedUser.website
              }
            );
            serviceProviderCreated = true;
          }
        } catch (marketplaceError) {
          console.error('Error creating service provider:', marketplaceError);
          // Don't fail the profile update if marketplace creation fails
        }
      }

      const response = {
        message: 'Profile updated successfully',
        user: this.formatUserResponse(updatedUser)
      };

      if (serviceProviderCreated) {
        response.message = 'Profile updated successfully and service provider profile created';
        response.serviceProviderCreated = true;
      }

      res.json(response);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Forgot Password - Request password reset
  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || '';

      if (!email) {
        return res.status(400).json({
          message: 'Е-мејл адресата е задолжителна',
          field: 'email'
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const emailService = EmailService; // Already instantiated
      const passwordResetService = new PasswordResetService(userService, emailService);

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Always return success to prevent user enumeration
      // But only send email if user exists
      const user = await userService.findByEmail(normalizedEmail);
      
      if (user) {
        // Generate secure reset token
        const tokenData = passwordResetService.generateResetToken();
        
        // Store hashed token in database
        await userService.createResetToken(
          user._id,
          tokenData.hashedToken,
          tokenData.expires,
          ipAddress
        );

        // Generate reset URL
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetUrl = passwordResetService.generateResetURL(
          user,
          tokenData.plainToken,
          ipAddress,
          baseUrl
        );

        // Generate email content
        const emailHTML = passwordResetService.generateResetEmailHTML(
          user,
          resetUrl,
          ipAddress,
          userAgent,
          tokenData.expires
        );

        // Send reset email
        try {
          await emailService.sendEmail(
            normalizedEmail,
            'Ресетирање на лозинка - Nexa Terminal',
            emailHTML
          );

          // Log security event
          await passwordResetService.logSecurityEvent('PASSWORD_RESET_REQUESTED', {
            userId: user._id,
            email: normalizedEmail,
            ipAddress,
            userAgent,
            success: true
          });
        } catch (emailError) {
          console.error('Failed to send reset email:', emailError);
          
          // Don't expose email sending failures to prevent enumeration
          // But log the error for internal monitoring
          await passwordResetService.logSecurityEvent('PASSWORD_RESET_EMAIL_FAILED', {
            userId: user._id,
            email: normalizedEmail,
            ipAddress,
            error: emailError.message
          });
        }
      }

      // Always return success to prevent user enumeration
      res.json({
        success: true,
        message: 'Ако е-мејл адресата постои, ќе добиете инструкции за ресетирање на лозинката.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        message: 'Серверска грешка. Ве молиме обидете се повторно.'
      });
    }
  }

  // Validate Reset Token - Check if reset token is valid
  validateResetToken = async (req, res) => {
    try {
      const { token, uid } = req.query;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || '';

      if (!token || !uid) {
        return res.status(400).json({
          message: 'Токенот и корисничкиот ID се задолжителни',
          valid: false
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const emailService = EmailService; // Already instantiated
      const passwordResetService = new PasswordResetService(userService, emailService);

      // Validate the reset token
      const user = await passwordResetService.validateResetToken(
        token,
        uid,
        ipAddress,
        userAgent
      );

      res.json({
        valid: true,
        message: 'Токенот е валиден',
        email: (user.email || user.officialEmail) ? (user.email || user.officialEmail).replace(/(.{2}).*(@.*)/, '$1***$2') : 'Скриена'
      });

    } catch (error) {
      console.error('Token validation error:', error);
      res.status(400).json({
        valid: false,
        message: error.message || 'Невалиден или истечен токен'
      });
    }
  }

  // Reset Password - Complete password reset with new password
  resetPassword = async (req, res) => {
    try {
      const { token, uid, newPassword, confirmPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || '';

      // Input validation
      if (!token || !uid || !newPassword || !confirmPassword) {
        return res.status(400).json({
          message: 'Сите полиња се задолжителни',
          field: 'required'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          message: 'Лозинките не се совпаѓаат',
          field: 'confirmPassword'
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const emailService = EmailService; // Already instantiated
      const passwordResetService = new PasswordResetService(userService, emailService);

      // Validate the reset token
      const user = await passwordResetService.validateResetToken(
        token,
        uid,
        ipAddress,
        userAgent
      );

      // Validate new password
      const passwordValidation = passwordResetService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: 'Лозинката не ги исполнува безбедносните барања',
          errors: passwordValidation.errors,
          field: 'newPassword'
        });
      }

      // Check password history to prevent reuse
      await passwordResetService.validatePasswordHistory(user, newPassword);

      // Hash new password with increased salt rounds
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      await userService.updatePassword(user._id, hashedPassword);
      
      // Try to mark reset token as used, but don't fail the whole operation if it fails
      try {
        await userService.markResetTokenUsed(user._id);
      } catch (tokenError) {
        console.error('Failed to mark reset token as used:', tokenError);
        // Continue with success response since password was changed
      }

      // Send security notification email
      const userEmail = user.email || user.officialEmail;
      if (userEmail) {
        try {
          const notificationHTML = passwordResetService.generatePasswordChangeNotificationHTML(
            user,
            ipAddress,
            userAgent,
            new Date().toLocaleString('mk-MK')
          );

          await emailService.sendEmail(
            userEmail,
            'Лозинката е успешно променета - Nexa Terminal',
            notificationHTML
          );
        } catch (emailError) {
          console.error('Failed to send password change notification:', emailError);
        }
      }

      // Log successful password reset
      await passwordResetService.logSecurityEvent('PASSWORD_RESET_COMPLETED', {
        userId: user._id,
        email: userEmail,
        ipAddress,
        userAgent
      });

      res.json({
        success: true,
        message: 'Лозинката е успешно променета. Сега можете да се најавите со новата лозинка.'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      
      const errorMessage = error.message.includes('лозинк') ? 
        error.message : 
        'Серверска грешка. Ве молиме обидете се повторно.';
      
      res.status(400).json({
        message: errorMessage
      });
    }
  }

  // Change Password - For authenticated users
  changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user.id || req.user._id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || '';

      // Input validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          message: 'Сите полиња се задолжителни',
          field: 'required'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          message: 'Новите лозинки не се совпаѓаат',
          field: 'confirmPassword'
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const emailService = EmailService; // Already instantiated
      const passwordResetService = new PasswordResetService(userService, emailService);

      // Get current user
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'Корисникот не е пронајден'
        });
      }

      // Check if account is locked
      const isLocked = await userService.isAccountLocked(userId);
      if (isLocked) {
        return res.status(423).json({
          message: 'Профилот е привремено заклучен поради безбедносни причини'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        // Increment failed attempts
        await userService.incrementFailedAttempts(userId, ipAddress);
        
        // Log failed attempt
        await passwordResetService.logSecurityEvent('PASSWORD_CHANGE_FAILED_CURRENT', {
          userId,
          ipAddress,
          userAgent
        });

        return res.status(401).json({
          message: 'Тековната лозинка е неточна',
          field: 'currentPassword'
        });
      }

      // Validate new password
      const passwordValidation = passwordResetService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          message: 'Новата лозинка не ги исполнува безбедносните барања',
          errors: passwordValidation.errors,
          field: 'newPassword'
        });
      }

      // Check password history to prevent reuse
      await passwordResetService.validatePasswordHistory(user, newPassword);

      // Hash new password with increased salt rounds
      const salt = await bcrypt.genSalt(12);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await userService.updatePassword(userId, hashedNewPassword);

      // Clear the "must change on first login" flag if it was set.
      try {
        const { ObjectId } = require('mongodb');
        await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $set: { mustChangePassword: false, updatedAt: new Date() } }
        );
      } catch (e) { /* non-critical */ }

      // Reset any failed login attempts
      await userService.resetFailedAttempts(userId);

      // Send security notification email
      if (user.email) {
        try {
          const notificationHTML = passwordResetService.generatePasswordChangeNotificationHTML(
            user,
            ipAddress,
            userAgent,
            new Date().toLocaleString('mk-MK')
          );

          await emailService.sendEmail(
            userEmail,
            'Лозинката е успешно променета - Nexa Terminal',
            notificationHTML
          );
        } catch (emailError) {
          console.error('Failed to send password change notification:', emailError);
        }
      }

      // Log successful password change
      await passwordResetService.logSecurityEvent('PASSWORD_CHANGED', {
        userId,
        email: user.email,
        ipAddress,
        userAgent
      });

      res.json({
        success: true,
        message: 'Лозинката е успешно променета'
      });

    } catch (error) {
      console.error('Password change error:', error);
      
      const errorMessage = error.message.includes('лозинк') ? 
        error.message : 
        'Серверска грешка. Ве молиме обидете се повторно.';
      
      res.status(400).json({
        message: errorMessage
      });
    }
  }

  // Logout
  logout = (req, res) => {
    try {
      // Since we're using JWTs, we don't need to do any server-side cleanup
      // The client will remove the token
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Error during logout' });
    }
  }
}

module.exports = new AuthController();
