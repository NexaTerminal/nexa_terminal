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
      // Indexes are already created in the migration script
      // These match the new simplified schema
      await this.collection.createIndex({ userName: 1 }, { unique: true });
      await this.collection.createIndex({ "companyInfo.companyName": "text" });
      await this.collection.createIndex({ isAdmin: 1 });
      await this.collection.createIndex({ isVerified: 1 });
    } catch (error) {
      // Silently handle index creation errors
    }
  }

  // Create a new user (updated for simplified schema)
  async createUser(userData) {
    const user = {
      userName: userData.userName?.trim() || userData.username?.trim() || userData.email?.trim() || '',
      password: userData.password,
      isAdmin: userData.isAdmin || false,
      isVerified: userData.isVerified || false,
      officialEmail: userData.officialEmail?.trim() || userData.email?.trim() || '',
      companyInfo: {
        companyName: userData.companyInfo?.companyName?.trim() || '',
        companyAddress: userData.companyInfo?.companyAddress?.trim() || userData.companyInfo?.address?.trim() || '',
        companyTaxNumber: userData.companyInfo?.companyTaxNumber?.trim() || userData.companyInfo?.taxNumber?.trim() || '',
        companyManager: userData.companyInfo?.companyManager?.trim() || userData.companyInfo?.manager?.trim() || '',
        missionStatement: userData.companyInfo?.missionStatement?.trim() || userData.companyInfo?.mission?.trim() || '',
        website: userData.companyInfo?.website?.trim() || '',
        facebook: userData.companyInfo?.facebook?.trim() || '',
        linkedin: userData.companyInfo?.linkedin?.trim() || ''
      },
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
      lastLogin: userData.lastLogin || new Date()
    };

    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  // Find user by username (updated for simplified schema)
  async findByUsername(username) {
    return await this.collection.findOne({ userName: username.trim() });
  }

  // Find user by email (updated for simplified schema)
  async findByEmail(email) {
    return await this.collection.findOne({ officialEmail: email.toLowerCase().trim() });
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

  // Get all users (for admin) - updated for simplified schema
  async getAllUsers(limit = 50, skip = 0, filter = {}) {
    const query = {};
    
    if (filter.verified !== undefined) {
      query.isVerified = filter.verified;
    }
    
    if (filter.search) {
      query.$or = [
        { officialEmail: { $regex: filter.search, $options: 'i' } },
        { userName: { $regex: filter.search, $options: 'i' } },
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
    const count = await this.collection.countDocuments({ officialEmail: email.toLowerCase().trim() });
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
