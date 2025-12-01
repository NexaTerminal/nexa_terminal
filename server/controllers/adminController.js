const { ObjectId } = require('mongodb');
const UserService = require('../services/userService');
const UserAnalyticsService = require('../services/userAnalyticsService');

class AdminController {
  constructor() {
    // Bind methods to preserve context
    this.getUsers = this.getUsers.bind(this);
    this.getUserDetails = this.getUserDetails.bind(this);
    this.suspendUser = this.suspendUser.bind(this);
    this.unsuspendUser = this.unsuspendUser.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
    this.updateUserStatus = this.updateUserStatus.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.getUserActivity = this.getUserActivity.bind(this);
    this.getPlatformAnalytics = this.getPlatformAnalytics.bind(this);
    this.getAdminDashboard = this.getAdminDashboard.bind(this);
    this.exportUserData = this.exportUserData.bind(this);
    this.bulkUserAction = this.bulkUserAction.bind(this);
  }

  /**
   * Get enhanced user list with analytics
   */
  async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        status = 'all', // active, inactive, suspended, all
        verified = 'all', // verified, unverified, all
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      console.log('🔍 ============ Admin getUsers called ============');
      console.log('🔍 Request params:', { page, limit, search, status, verified, sortBy, sortOrder });
      console.log('🔍 Request user:', req.user ? { id: req.user._id, role: req.user.role } : 'NO USER');

      // Try both app.locals.database and app.locals.db for compatibility
      const db = req.app.locals.database || req.app.locals.db;
      console.log('🔍 Database connection:', db ? 'Connected' : 'NOT CONNECTED');
      console.log('🔍 Database source:', req.app.locals.database ? 'app.locals.database' : (req.app.locals.db ? 'app.locals.db' : 'NONE'));

      if (!db) {
        console.error('❌ No database connection available');
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }

      const userService = new UserService(db);
      const analyticsService = new UserAnalyticsService(db);
      const usersCollection = db.collection('users');

      console.log('🔍 Users collection obtained');

      // Build search filter
      const filter = {};
      
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { 'companyInfo.companyName': { $regex: search, $options: 'i' } }
        ];
      }

      if (status === 'active') {
        filter.isActive = true;
        filter.suspendedUntil = { $exists: false };
      } else if (status === 'inactive') {
        filter.isActive = false;
      } else if (status === 'suspended') {
        filter.suspendedUntil = { $exists: true, $gte: new Date() };
      }

      if (verified === 'verified') {
        filter.isVerified = true;
        filter.emailVerified = true;
      } else if (verified === 'unverified') {
        filter.$or = [
          { isVerified: { $ne: true } },
          { emailVerified: { $ne: true } }
        ];
      }

      // Count total for pagination
      const total = await usersCollection.countDocuments(filter);
      console.log('🔍 Total users matching filter:', total);
      console.log('🔍 Filter applied:', JSON.stringify(filter, null, 2));

      // Get users with pagination and sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const skip = (page - 1) * limit;
      const users = await usersCollection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      console.log('🔍 Users found after pagination:', users.length);

      // Get analytics for each user (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          try {
            const analytics = await analyticsService.getUserAnalytics(
              user._id.toString(),
              thirtyDaysAgo,
              new Date()
            );

            return {
              _id: user._id,
              username: user.username,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              isVerified: user.isVerified,
              emailVerified: user.emailVerified,
              profileComplete: user.profileComplete,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              lastLoginAt: user.lastLoginAt,
              suspendedUntil: user.suspendedUntil,
              suspensionReason: user.suspensionReason,
              companyInfo: user.companyInfo,
              analytics: {
                logins30d: analytics.summary.totalLogins,
                documents30d: analytics.summary.totalDocuments,
                aiQueries30d: analytics.summary.totalAiQueries,
                socialPosts30d: analytics.summary.totalSocialPosts,
                activeDays30d: analytics.summary.activeDays
              }
            };
          } catch (error) {
            console.error('Error getting user analytics:', error);
            return {
              ...user,
              analytics: {
                logins30d: 0,
                documents30d: 0,
                aiQueries30d: 0,
                socialPosts30d: 0,
                activeDays30d: 0
              }
            };
          }
        })
      );

      res.json({
        success: true,
        data: enhancedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }

  /**
   * Get detailed user information with full analytics
   */
  async getUserDetails(req, res) {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const analyticsService = new UserAnalyticsService(db);
      const usersCollection = db.collection('users');

      // Get user details
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get analytics for specified period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const analytics = await analyticsService.getUserAnalytics(
        id,
        startDate,
        new Date()
      );

      // Get activity logs
      const activityLogs = await analyticsService.getUserActivityLogs(id, 1, 20);

      res.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified,
            emailVerified: user.emailVerified,
            profileComplete: user.profileComplete,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            suspendedUntil: user.suspendedUntil,
            suspensionReason: user.suspensionReason,
            companyInfo: user.companyInfo,
            companyManager: user.companyManager,
            officialEmail: user.officialEmail,
            verificationStatus: user.verificationStatus
          },
          analytics: analytics.summary,
          recentActivity: activityLogs.logs,
          activityPagination: activityLogs.pagination
        }
      });
    } catch (error) {
      console.error('Error getting user details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user details',
        error: error.message
      });
    }
  }

  /**
   * Suspend a user
   */
  async suspendUser(req, res) {
    try {
      const { id } = req.params;
      const { reason, duration } = req.body; // duration in days, 0 for permanent

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const usersCollection = db.collection('users');

      // Calculate suspension end date
      let suspendedUntil = null;
      if (duration && duration > 0) {
        suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(duration));
      }

      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            suspendedUntil,
            suspensionReason: reason || 'No reason provided',
            suspendedAt: new Date(),
            suspendedBy: req.user.id,
            isActive: false,
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Log admin action
      const analyticsService = new UserAnalyticsService(db);
      analyticsService.trackActivity(req.user.id, 'admin_suspend_user', {
        targetUserId: id,
        reason,
        duration
      });

      res.json({
        success: true,
        message: 'User suspended successfully'
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend user',
        error: error.message
      });
    }
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const usersCollection = db.collection('users');

      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $unset: {
            suspendedUntil: '',
            suspensionReason: '',
            suspendedAt: '',
            suspendedBy: ''
          },
          $set: {
            isActive: true,
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Log admin action
      const analyticsService = new UserAnalyticsService(db);
      analyticsService.trackActivity(req.user.id, 'admin_unsuspend_user', {
        targetUserId: id
      });

      res.json({
        success: true,
        message: 'User unsuspended successfully'
      });
    } catch (error) {
      console.error('Error unsuspending user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsuspend user',
        error: error.message
      });
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const usersCollection = db.collection('users');

      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            role,
            isAdmin: role === 'admin',
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Log admin action
      const analyticsService = new UserAnalyticsService(db);
      analyticsService.trackActivity(req.user.id, 'admin_update_user_role', {
        targetUserId: id,
        newRole: role
      });

      res.json({
        success: true,
        message: 'User role updated successfully'
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role',
        error: error.message
      });
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const usersCollection = db.collection('users');

      const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            isActive: Boolean(isActive),
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Log admin action
      const analyticsService = new UserAnalyticsService(db);
      analyticsService.trackActivity(req.user.id, 'admin_update_user_status', {
        targetUserId: id,
        newStatus: isActive ? 'active' : 'inactive'
      });

      res.json({
        success: true,
        message: 'User status updated successfully'
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message
      });
    }
  }

  /**
   * Delete a user permanently (DESTRUCTIVE - USE WITH CAUTION)
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      // Prevent admin from deleting themselves
      if (req.user.id.toString() === id) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const usersCollection = db.collection('users');

      // Get user info before deletion for logging
      const userToDelete = await usersCollection.findOne({ _id: new ObjectId(id) });

      if (!userToDelete) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete the user
      const deleteResult = await usersCollection.deleteOne({ _id: new ObjectId(id) });

      if (deleteResult.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Log admin action
      const analyticsService = new UserAnalyticsService(db);
      await analyticsService.trackActivity(req.user.id, 'admin_delete_user', {
        targetUserId: id,
        targetUserEmail: userToDelete.email,
        targetUserName: userToDelete.username
      });

      console.log(`🗑️ User deleted by admin: ${userToDelete.email} (ID: ${id}) by admin ${req.user.email}`);

      res.json({
        success: true,
        message: 'User deleted permanently'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const analyticsService = new UserAnalyticsService(db);

      const activityLogs = await analyticsService.getUserActivityLogs(
        id,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: activityLogs
      });
    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activity',
        error: error.message
      });
    }
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(req, res) {
    try {
      const { days = 30 } = req.query;

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const analyticsService = new UserAnalyticsService(db);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const analytics = await analyticsService.getPlatformAnalytics(
        startDate,
        new Date()
      );

      // Get additional platform statistics
      const usersCollection = db.collection('users');
      
      const userStats = await usersCollection.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ['$isActive', true] }, 1, 0]
              }
            },
            verifiedUsers: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$isVerified', true] }, { $eq: ['$emailVerified', true] }] },
                  1,
                  0
                ]
              }
            },
            suspendedUsers: {
              $sum: {
                $cond: [
                  { $and: [{ $exists: ['$suspendedUntil', true] }, { $gte: ['$suspendedUntil', new Date()] }] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]).toArray();

      const stats = userStats.length > 0 ? userStats[0] : {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        suspendedUsers: 0
      };

      res.json({
        success: true,
        data: {
          ...analytics,
          userStats: stats
        }
      });
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch platform analytics',
        error: error.message
      });
    }
  }

  /**
   * Get admin dashboard summary
   */
  async getAdminDashboard(req, res) {
    try {
      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const analyticsService = new UserAnalyticsService(db);

      // Get recent activity
      const recentActivity = await analyticsService.getRecentPlatformActivity(10);

      // Get today's analytics
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayAnalytics = await analyticsService.getPlatformAnalytics(today, today);
      const weekAnalytics = await analyticsService.getPlatformAnalytics(
        new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        today
      );

      res.json({
        success: true,
        data: {
          todayStats: todayAnalytics.summary,
          weekStats: weekAnalytics.summary,
          recentActivity,
          dailyTrends: weekAnalytics.dailyTrends
        }
      });
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }

  /**
   * Export user data to CSV
   */
  async exportUserData(req, res) {
    try {
      const { format = 'csv' } = req.query;
      
      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const usersCollection = db.collection('users');

      const users = await usersCollection.find({}).toArray();

      if (format === 'csv') {
        const csvHeader = 'ID,Username,Email,Company,Role,Active,Verified,Created,Last Login\n';
        const csvData = users.map(user => [
          user._id,
          user.username || '',
          user.email,
          user.companyInfo?.companyName || '',
          user.role,
          user.isActive,
          user.isVerified && user.emailVerified,
          user.createdAt || '',
          user.lastLoginAt || ''
        ].join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
        res.send(csvHeader + csvData);
      } else {
        res.json({
          success: true,
          data: users
        });
      }
    } catch (error) {
      console.error('Error exporting user data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export user data',
        error: error.message
      });
    }
  }

  /**
   * Bulk user actions
   */
  async bulkUserAction(req, res) {
    try {
      const { action, userIds, params = {} } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      const validObjectIds = userIds.filter(id => ObjectId.isValid(id));
      if (validObjectIds.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }

      const db = req.app.locals.database || req.app.locals.db;
      if (!db) {
        return res.status(500).json({
          success: false,
          message: 'Database connection not available'
        });
      }
      const usersCollection = db.collection('users');
      const objectIds = validObjectIds.map(id => new ObjectId(id));

      let updateQuery = {};
      let message = '';

      switch (action) {
        case 'activate':
          updateQuery = { $set: { isActive: true, updatedAt: new Date() } };
          message = 'Users activated successfully';
          break;
        case 'deactivate':
          updateQuery = { $set: { isActive: false, updatedAt: new Date() } };
          message = 'Users deactivated successfully';
          break;
        case 'suspend':
          const { reason = 'Bulk suspension', duration = 0 } = params;
          let suspendedUntil = null;
          if (duration > 0) {
            suspendedUntil = new Date();
            suspendedUntil.setDate(suspendedUntil.getDate() + duration);
          }
          updateQuery = {
            $set: {
              suspendedUntil,
              suspensionReason: reason,
              suspendedAt: new Date(),
              suspendedBy: req.user.id,
              isActive: false,
              updatedAt: new Date()
            }
          };
          message = 'Users suspended successfully';
          break;
        case 'unsuspend':
          updateQuery = {
            $unset: {
              suspendedUntil: '',
              suspensionReason: '',
              suspendedAt: '',
              suspendedBy: ''
            },
            $set: {
              isActive: true,
              updatedAt: new Date()
            }
          };
          message = 'Users unsuspended successfully';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid bulk action'
          });
      }

      const result = await usersCollection.updateMany(
        { _id: { $in: objectIds } },
        updateQuery
      );

      // Log admin action
      const analyticsService = new UserAnalyticsService(db);
      analyticsService.trackActivity(req.user.id, 'admin_bulk_action', {
        action,
        affectedUsers: result.modifiedCount,
        params
      });

      res.json({
        success: true,
        message,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Error performing bulk action:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk action',
        error: error.message
      });
    }
  }
}

module.exports = new AdminController();