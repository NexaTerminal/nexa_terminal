const { ObjectId } = require('mongodb');

class UserAnalyticsService {
  constructor(db) {
    this.db = db;
    this.userAnalyticsCollection = db.collection('user_analytics');
    this.activityLogsCollection = db.collection('activity_logs');
    
    // Initialize indexes
    this.initializeIndexes();
  }

  async initializeIndexes() {
    try {
      // Create indexes for better performance
      await this.userAnalyticsCollection.createIndex({ userId: 1 });
      await this.userAnalyticsCollection.createIndex({ date: 1 });
      await this.activityLogsCollection.createIndex({ userId: 1 });
      await this.activityLogsCollection.createIndex({ timestamp: -1 });
      await this.activityLogsCollection.createIndex({ action: 1 });
    } catch (error) {
      console.log('Analytics indexes already exist or error creating them:', error.message);
    }
  }

  /**
   * Track user activity
   * @param {string} userId - User ID
   * @param {string} action - Action performed (login, document_generated, ai_query, etc.)
   * @param {object} metadata - Additional data about the action
   */
  async trackActivity(userId, action, metadata = {}) {
    try {
      const activityLog = {
        userId: new ObjectId(userId),
        action,
        metadata,
        timestamp: new Date(),
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null
      };

      await this.activityLogsCollection.insertOne(activityLog);
      
      // Update daily analytics
      await this.updateDailyAnalytics(userId, action);
      
      return { success: true };
    } catch (error) {
      console.error('Error tracking activity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update daily analytics for a user
   */
  async updateDailyAnalytics(userId, action) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filter = {
        userId: new ObjectId(userId),
        date: today
      };

      const incrementField = {};
      
      // Map actions to analytics fields
      switch (action) {
        case 'login':
          incrementField.logins = 1;
          break;
        case 'document_generated':
          incrementField.documentsGenerated = 1;
          break;
        case 'ai_query':
          incrementField.aiQueries = 1;
          break;
        case 'social_post':
          incrementField.socialPosts = 1;
          break;
        case 'compliance_report':
          incrementField.complianceReports = 1;
          break;
        default:
          incrementField.otherActions = 1;
      }

      await this.userAnalyticsCollection.updateOne(
        filter,
        {
          $inc: incrementField,
          $setOnInsert: {
            userId: new ObjectId(userId),
            date: today,
            logins: 0,
            documentsGenerated: 0,
            aiQueries: 0,
            socialPosts: 0,
            complianceReports: 0,
            otherActions: 0
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error updating daily analytics:', error);
    }
  }

  /**
   * Get user analytics summary
   */
  async getUserAnalytics(userId, startDate = null, endDate = null) {
    try {
      const matchFilter = { userId: new ObjectId(userId) };
      
      if (startDate && endDate) {
        matchFilter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const analytics = await this.userAnalyticsCollection.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalLogins: { $sum: '$logins' },
            totalDocuments: { $sum: '$documentsGenerated' },
            totalAiQueries: { $sum: '$aiQueries' },
            totalSocialPosts: { $sum: '$socialPosts' },
            totalComplianceReports: { $sum: '$complianceReports' },
            totalOtherActions: { $sum: '$otherActions' },
            activeDays: { $sum: 1 }
          }
        }
      ]).toArray();

      const result = analytics.length > 0 ? analytics[0] : {
        totalLogins: 0,
        totalDocuments: 0,
        totalAiQueries: 0,
        totalSocialPosts: 0,
        totalComplianceReports: 0,
        totalOtherActions: 0,
        activeDays: 0
      };

      // Get recent activity
      const recentActivity = await this.activityLogsCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      return {
        summary: result,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(startDate = null, endDate = null) {
    try {
      const matchFilter = {};
      
      if (startDate && endDate) {
        matchFilter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const analytics = await this.userAnalyticsCollection.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalUsers: { $addToSet: '$userId' },
            totalLogins: { $sum: '$logins' },
            totalDocuments: { $sum: '$documentsGenerated' },
            totalAiQueries: { $sum: '$aiQueries' },
            totalSocialPosts: { $sum: '$socialPosts' },
            totalComplianceReports: { $sum: '$complianceReports' }
          }
        },
        {
          $project: {
            totalUsers: { $size: '$totalUsers' },
            totalLogins: 1,
            totalDocuments: 1,
            totalAiQueries: 1,
            totalSocialPosts: 1,
            totalComplianceReports: 1
          }
        }
      ]).toArray();

      // Get daily trends for charts
      const dailyTrends = await this.userAnalyticsCollection.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$date',
            dailyUsers: { $addToSet: '$userId' },
            dailyLogins: { $sum: '$logins' },
            dailyDocuments: { $sum: '$documentsGenerated' },
            dailyAiQueries: { $sum: '$aiQueries' }
          }
        },
        {
          $project: {
            date: '$_id',
            dailyUsers: { $size: '$dailyUsers' },
            dailyLogins: 1,
            dailyDocuments: 1,
            dailyAiQueries: 1
          }
        },
        { $sort: { date: 1 } }
      ]).toArray();

      const result = analytics.length > 0 ? analytics[0] : {
        totalUsers: 0,
        totalLogins: 0,
        totalDocuments: 0,
        totalAiQueries: 0,
        totalSocialPosts: 0,
        totalComplianceReports: 0
      };

      return {
        summary: result,
        dailyTrends
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs with pagination
   */
  async getUserActivityLogs(userId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      
      const logs = await this.activityLogsCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.activityLogsCollection.countDocuments({
        userId: new ObjectId(userId)
      });

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user activity logs:', error);
      throw error;
    }
  }

  /**
   * Get recent platform activity
   */
  async getRecentPlatformActivity(limit = 20) {
    try {
      const logs = await this.activityLogsCollection.aggregate([
        { $sort: { timestamp: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            action: 1,
            metadata: 1,
            timestamp: 1,
            'user.email': 1,
            'user.companyInfo.companyName': 1
          }
        }
      ]).toArray();

      return logs;
    } catch (error) {
      console.error('Error getting recent platform activity:', error);
      throw error;
    }
  }
}

module.exports = UserAnalyticsService;