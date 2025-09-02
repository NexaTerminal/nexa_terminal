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
    return await this.collection.findOne({ email: email.toLowerCase().trim() });
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
}

module.exports = UserService;
