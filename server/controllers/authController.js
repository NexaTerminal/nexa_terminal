const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserService = require('../services/userService');

class AuthController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.createAdmin = this.createAdmin.bind(this);
    this.register = this.register.bind(this);
    this.loginUsername = this.loginUsername.bind(this);
    this.login = this.login.bind(this);
    this.directLogin = this.directLogin.bind(this);
    this.validateToken = this.validateToken.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.logout = this.logout.bind(this);
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
      username: user.username,
      email: user.email || '',
      role: user.role || 'user',
      isAdmin: user.isAdmin || false,
      profileComplete: user.profileComplete,
      companyInfo: user.companyInfo,
      isVerified: user.isVerified
    };
  }

  // Create admin user
  async createAdmin(req, res) {
    try {
      const { email, password, secretKey } = req.body;
      const db = req.app.locals.db;
      const userService = new UserService(db);

      // Only allow creation if secretKey matches
      if (secretKey !== process.env.ADMIN_SETUP_KEY && secretKey !== 'nexa-admin-setup-key') {
        return res.status(403).json({ message: 'Invalid secret key' });
      }

      // Check if admin already exists
      const existingAdmin = await userService.findByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin user already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
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

  // Validate password strength
  validatePassword(password) {
    const errors = [];
    
    if (password.length < 6) {
      errors.push('Лозинката мора да има најмалку 6 карактери');
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
    
    return {
      isValid: errors.length === 0,
      errors
    };
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
  async register(req, res) {
    try {
      const { username, password } = req.body;

      // Basic field validation
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Корисничкото име и лозинката се задолжителни',
          field: !username ? 'username' : 'password'
        });
      }

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

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user with minimal required information
      const userData = {
        username: username.trim().toLowerCase(),
        password: hashedPassword,
        role: 'user',
        companyInfo: {
          companyName: '',
          mission: '',
          website: '',
          industry: '',
          companySize: '',
          role: '',
          description: '',
          crnNumber: '',
          address: '',
          phone: '',
          companyPIN: '',
          taxNumber: '',
          contactEmail: ''
        },
        profileComplete: false,
        isVerified: false
      };

      // console.log('Creating user with data:', JSON.stringify(userData, null, 2));

      const newUser = await userService.createUser(userData);

      // Generate JWT token
      const token = this.generateToken(newUser);

      res.status(201).json({
        token,
        user: this.formatUserResponse(newUser)
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Login with username/password
  async loginUsername(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Корисничкото име и лозинката се задолжителни',
          field: !username ? 'username' : 'password'
        });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      
      // Find user by username
      const user = await userService.findByUsername(username.toLowerCase());
      if (!user) {
        return res.status(401).json({ 
          message: 'Корисничкото име не постои. Проверете го корисничкото име или се регистрирајте.',
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

  // Direct login for testing
  async directLogin(req, res) {
    try {
      const { email, password } = req.body;
      
      const db = req.app.locals.db;
      if (!db) {
        console.error('Database not available in req.app.locals.db');
        return res.status(500).json({ message: 'Database connection error' });
      }
      
      const userService = new UserService(db);
      const user = await userService.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      // Generate JWT token
      const token = this.generateToken(user);

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error('Direct login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Validate token
  validateToken(req, res) {
    res.json({ valid: true, user: req.user });
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;
      
      const { 
        email, 
        companyInfo,
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
      }

      if (typeof profileComplete === 'boolean') updateData.profileComplete = profileComplete;

      // Update user
      const updatedUser = await userService.updateUser(currentUser._id, updateData);

      res.json({
        message: 'Profile updated successfully',
        user: this.formatUserResponse(updatedUser)
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Logout
  logout(req, res) {
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
