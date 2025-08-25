// Native MongoDB User Service

const { ObjectId } = require('mongodb');

class UserService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('users');
    this.setupIndexes();
  }

  // Setup database indexes for efficient querying
  async setupIndexes() {
    try {
      // Indexes are already created in the database initialization
      // Just create the non-unique indexes that are safe to recreate
      await this.collection.createIndex({ 'companyInfo.companyName': 1 });
      await this.collection.createIndex({ isVerified: 1 });
      await this.collection.createIndex({ isAdmin: 1 });
      
    } catch (error) {
      // Silently handle index creation errors
    }
  }

  // Create a new user
  async createUser(userData) {
    const user = {
      username: userData.username?.trim().toLowerCase() || '', // Ensure username is stored in lowercase
      password: userData.password,
      profileComplete: userData.profileComplete || false,
      isAdmin: userData.isAdmin || false,
      companyInfo: {
        companyName: userData.companyInfo?.companyName?.trim() || '',
        mission: userData.companyInfo?.mission?.trim() || '',
        website: userData.companyInfo?.website?.trim() || '',
        industry: userData.companyInfo?.industry?.trim() || '',
        companySize: userData.companyInfo?.companySize?.trim() || '', // Added
        role: userData.companyInfo?.role?.trim() || '', // Added
        description: userData.companyInfo?.description?.trim() || '',
        crnNumber: userData.companyInfo?.crnNumber?.trim() || '',
        address: userData.companyInfo?.address?.trim() || '', // This can be companyAddress
        phone: userData.companyInfo?.phone?.trim() || '', // This can be contact phone
        companyPIN: userData.companyInfo?.companyPIN?.trim() || '', // Added
        taxNumber: userData.companyInfo?.taxNumber?.trim() || '', // Added
        contactEmail: userData.companyInfo?.contactEmail?.trim() || '' // Added
      },
      isVerified: userData.isVerified || false,
      profileImage: userData.profileImage || '',
      googleId: userData.googleId || null,
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Only add email field if it's provided and not empty
    if (userData.email && userData.email.trim()) {
      user.email = userData.email.toLowerCase().trim();
    }

    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  // Find user by username
  async findByUsername(username) {
    return await this.collection.findOne({ username: username.trim().toLowerCase() }); // Ensure username is queried in lowercase
  }

  // Find user by email
  async findByEmail(email) {
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

  // Get all users (for admin)
  async getAllUsers(limit = 50, skip = 0, filter = {}) {
    const query = {};
    
    if (filter.verified !== undefined) {
      query.isVerified = filter.verified;
    }
    
    if (filter.search) {
      query.$or = [
        { email: { $regex: filter.search, $options: 'i' } },
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

  // Check if user exists
  async userExists(email) {
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
}

module.exports = UserService;
