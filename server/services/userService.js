// Native MongoDB User Service

const { ObjectId } = require('mongodb');

class UserService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('users');
    // this.setupIndexes(); // Indexes managed in server.js
  }

  // Debug method to check indexes and fix userName_1 issue
  async debugIndexes() {
    try {
      const indexes = await this.collection.indexes();
      console.log('UserService sees indexes:', JSON.stringify(indexes, null, 2));
      
      // Force drop the problematic userName_1 index if it exists
      const hasUserNameIndex = indexes.some(idx => idx.name === 'userName_1');
      if (hasUserNameIndex) {
        console.log('🔧 Force dropping userName_1 index...');
        try {
          await this.collection.dropIndex('userName_1');
          console.log('✅ Successfully dropped userName_1 index');
        } catch (error) {
          console.log('❌ Failed to drop userName_1:', error.message);
        }
      }
    } catch (error) {
      console.log('Error checking indexes:', error.message);
    }
  }

  // Setup database indexes for efficient querying
  async setupIndexes() {
    try {
      // Skip index creation - indexes are managed manually
      console.log('Index creation skipped - managed manually');
    } catch (error) {
      // Silently handle index creation errors
    }
  }

  // Create a new user (updated for simplified schema)
  async createUser(userData) {
    const user = {
      username: userData.username?.trim() || '',
      password: userData.password,
      isAdmin: userData.isAdmin || false,
      isVerified: userData.isVerified || false,
      role: userData.role || 'user',
      profileComplete: userData.profileComplete || false,
      companyInfo: userData.companyInfo || {
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
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
      lastLogin: userData.lastLogin || new Date()
    };

    // Only add email field if it exists and is not empty
    const email = userData.email?.trim();
    if (email && email.length > 0) {
      user.email = email;
    }

    // console.log('UserService creating user:', JSON.stringify(user, null, 2));

    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  // Find user by username (updated for simplified schema)
  async findByUsername(username) {
    return await this.collection.findOne({ username: username.trim() });
  }

  // Find user by email (updated for simplified schema)  
  async findByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    // Check both email and officialEmail fields
    return await this.collection.findOne({ 
      $or: [
        { email: normalizedEmail },
        { officialEmail: normalizedEmail }
      ]
    });
  }

  // Find user by tax number
  async findByTaxNumber(taxNumber) {
    if (!taxNumber) return null;
    // Look in companyInfo.companyTaxNumber or legacy companyInfo.taxNumber
    return await this.collection.findOne({ 
      $or: [
        { 'companyInfo.companyTaxNumber': taxNumber.toString().trim() },
        { 'companyInfo.taxNumber': taxNumber.toString().trim() }
      ]
    });
  }

  // Find user by username or tax number
  async findByUsernameOrTaxNumber(identifier) {
    if (!identifier) return null;
    
    const trimmedIdentifier = identifier.toString().trim();
    
    // Check if identifier looks like a tax number (digits only)
    const isNumericOnly = /^\d+$/.test(trimmedIdentifier);
    
    if (isNumericOnly) {
      // Try tax number first if it's numeric
      const userByTax = await this.findByTaxNumber(trimmedIdentifier);
      if (userByTax) return userByTax;
      
      // Still check username in case user has numeric username
      const userByUsername = await this.findByUsername(trimmedIdentifier);
      if (userByUsername) return userByUsername;
    } else {
      // For non-numeric identifiers, only check username
      return await this.findByUsername(trimmedIdentifier);
    }
    
    return null;
  }

  // Find user by ID
  async findById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  // Find user by Google ID
  async findByGoogleId(googleId) {
    return await this.collection.findOne({ googleId });
  }

  // Find user by LinkedIn ID
  async findByLinkedInId(linkedinId) {
    return await this.collection.findOne({ linkedinId });
  }

  // Update user (single method for all profile updates)
  async updateUser(id, updateData) {
    if (!ObjectId.isValid(id)) throw new Error('Invalid user ID');
    const updateDoc = { updatedAt: new Date() };

    // Merge companyInfo if present
    if (updateData.companyInfo) {
      const currentUser = await this.findById(id);
      updateDoc.companyInfo = {
        ...currentUser.companyInfo,
        ...updateData.companyInfo
      };
    }

    // Other fields (email, profileComplete, etc.)
    Object.keys(updateData).forEach(key => {
      if (key !== 'companyInfo') {
        updateDoc[key] = updateData[key];
      }
    });

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Update user's last login time
  async updateLastLogin(userId) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLogin: new Date(), updatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }

  // Get all users (for admin) - updated for simplified schema
  async getAllUsers(limit = 50, skip = 0, filter = {}) {
    const query = {};
    
    if (filter.verified !== undefined) {
      query.isVerified = filter.verified;
    }
    
    if (filter.search) {
      query.$or = [
        { email: { $regex: filter.search, $options: 'i' } },
        { username: { $regex: filter.search, $options: 'i' } },
        { 'companyInfo.companyName': { $regex: filter.search, $options: 'i' } }
      ];
    }

    const users = await this.collection
      .find(query)
      .project({ password: 0 }) // Exclude password from results
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return { users, total };
  }

  // Get unverified users
  async getPendingVerificationUsers() {
    return await this.collection
      .find({ isVerified: false })
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Delete user
  async deleteUser(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid user ID');
    }

    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Check if user exists - updated for simplified schema
  async userExists(email) {
    if (!email) return false;
    const count = await this.collection.countDocuments({ email: email.toLowerCase().trim() });
    return count > 0;
  }

  // Get user stats
  async getUserStats() {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
          pendingVerification: { $sum: { $cond: [{ $not: '$isVerified' }, 1, 0] } },
          adminUsers: { $sum: { $cond: ['$isAdmin', 1, 0] } }
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result[0] || {
      totalUsers: 0,
      verifiedUsers: 0,
      pendingVerification: 0,
      adminUsers: 0
    };
  }

  // Sanitize user data for API responses (remove sensitive fields)
  sanitizeUser(user) {
    if (!user) return null;
    
    const sanitized = { ...user };
    delete sanitized.password;
    return sanitized;
  }

  // Sanitize user data for public responses (remove more sensitive fields)
  sanitizeUserPublic(user) {
    if (!user) return null;
    
    return {
      _id: user._id,
      companyInfo: {
        companyName: user.companyInfo?.companyName || '',
        website: user.companyInfo?.website || '',
        industry: user.companyInfo?.industry || ''
      },
      profileImage: user.profileImage || '',
      isVerified: user.isVerified || false,
      createdAt: user.createdAt
    };
  }

  // Update user verification status
  async updateVerificationStatus(userId, status, isVerified = true) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const updateData = {
      isVerified: status === 'approved' ? isVerified : false,
      verificationStatus: status,
      updatedAt: new Date()
    };

    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    return result.modifiedCount > 0;
  }

  // Password reset token management
  async createResetToken(userId, hashedToken, expiresAt, ipAddress) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const resetToken = {
      token: hashedToken,
      expires: expiresAt,
      used: false,
      createdAt: new Date(),
      ipAddress: ipAddress,
      attempts: 0
    };

    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          resetToken: resetToken,
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  // Find user with valid reset token
  async findByResetToken(hashedToken) {
    return await this.collection.findOne({
      'resetToken.token': hashedToken,
      'resetToken.expires': { $gt: new Date() },
      'resetToken.used': { $ne: true }
    });
  }

  // Mark reset token as used
  async markResetTokenUsed(userId) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Instead of trying to modify a potentially null resetToken field,
    // we'll remove it entirely once used
    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $unset: { 
          resetToken: ""
        },
        $set: {
          updatedAt: new Date(),
          lastPasswordResetUsed: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  // Update password with history tracking
  async updatePassword(userId, hashedPassword) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Add current password to history
    const passwordHistory = user.passwordHistory || [];
    if (user.password) {
      passwordHistory.push({
        hash: user.password,
        createdAt: new Date()
      });
    }

    // Keep only last 5 passwords
    const recentHistory = passwordHistory
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    const updateData = {
      password: hashedPassword,
      passwordHistory: recentHistory,
      updatedAt: new Date(),
      lastPasswordChange: new Date()
    };

    // Clear reset token if exists
    if (user.resetToken) {
      updateData['resetToken'] = null;
    }

    // Clear account lockout if exists
    if (user.accountLockout) {
      updateData['accountLockout'] = {
        isLocked: false,
        failedAttempts: 0,
        lockoutExpires: null,
        lastFailedAttempt: null
      };
    }

    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    return result.modifiedCount > 0;
  }

  // Account lockout management
  async incrementFailedAttempts(userId, ipAddress) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentAttempts = user.accountLockout?.failedAttempts || 0;
    const newAttempts = currentAttempts + 1;
    
    let lockoutDuration = 0;
    let isLocked = false;

    // Progressive lockout durations
    if (newAttempts >= 10) {
      lockoutDuration = 24 * 60 * 60 * 1000; // 24 hours
      isLocked = true;
    } else if (newAttempts >= 5) {
      lockoutDuration = 60 * 60 * 1000; // 1 hour
      isLocked = true;
    } else if (newAttempts >= 3) {
      lockoutDuration = 15 * 60 * 1000; // 15 minutes
      isLocked = true;
    }

    const updateData = {
      'accountLockout.failedAttempts': newAttempts,
      'accountLockout.lastFailedAttempt': new Date(),
      'accountLockout.lastFailedIP': ipAddress,
      updatedAt: new Date()
    };

    if (isLocked) {
      updateData['accountLockout.isLocked'] = true;
      updateData['accountLockout.lockoutExpires'] = new Date(Date.now() + lockoutDuration);
    }

    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    return {
      success: result.modifiedCount > 0,
      isLocked,
      lockoutExpires: isLocked ? new Date(Date.now() + lockoutDuration) : null,
      failedAttempts: newAttempts
    };
  }

  // Reset failed attempts on successful login
  async resetFailedAttempts(userId) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          'accountLockout.failedAttempts': 0,
          'accountLockout.isLocked': false,
          'accountLockout.lockoutExpires': null,
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  // Check if account is locked
  async isAccountLocked(userId) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await this.findById(userId);
    if (!user || !user.accountLockout) {
      return false;
    }

    const { isLocked, lockoutExpires } = user.accountLockout;
    
    if (!isLocked) {
      return false;
    }

    // Check if lockout has expired
    if (lockoutExpires && new Date() > lockoutExpires) {
      // Auto-unlock expired accounts
      await this.resetFailedAttempts(userId);
      return false;
    }

    return true;
  }

  // Get password history for validation
  async getPasswordHistory(userId, limit = 5) {
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const history = user.passwordHistory || [];
    return history
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}

module.exports = UserService;
