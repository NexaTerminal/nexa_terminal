const { MongoClient, ObjectId } = require('mongodb');
const { EventEmitter } = require('events');

class AdminNotificationService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.db = null;
    this.notificationsCollection = null;
    this.adminPreferencesCollection = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const uri = process.env.DATABASE_URL;
      if (!uri) {
        throw new Error('DATABASE_URL not found in environment variables');
      }

      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db('nexa');
      
      this.notificationsCollection = this.db.collection('admin_notifications');
      this.adminPreferencesCollection = this.db.collection('admin_notification_preferences');
      
      // Create indexes
      await this.notificationsCollection.createIndex({ adminId: 1, timestamp: -1 });
      await this.notificationsCollection.createIndex({ type: 1, severity: 1 });
      await this.notificationsCollection.createIndex({ read: 1, timestamp: -1 });
      await this.adminPreferencesCollection.createIndex({ adminId: 1 }, { unique: true });
      
      this.initialized = true;
      console.log('✅ Admin Notification Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Admin Notification Service:', error);
      throw error;
    }
  }

  // Send notification to specific admin
  async sendNotification(adminId, notification) {
    if (!this.initialized) {
      console.error('Admin Notification Service not initialized');
      return;
    }

    try {
      const notificationDoc = {
        adminId: new ObjectId(adminId),
        ...notification,
        timestamp: new Date(),
        read: false,
        id: new ObjectId()
      };

      await this.notificationsCollection.insertOne(notificationDoc);
      
      // Emit real-time notification
      this.emit('newNotification', {
        adminId,
        notification: notificationDoc
      });

      return notificationDoc;

    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send notification to all admins
  async broadcastNotification(notification, excludeAdminId = null) {
    if (!this.initialized) {
      console.error('Admin Notification Service not initialized');
      return;
    }

    try {
      // Get all admin user IDs (you'll need to implement this based on your user schema)
      const adminIds = await this.getAdminIds(excludeAdminId);
      
      const notifications = [];
      for (const adminId of adminIds) {
        const notificationDoc = await this.sendNotification(adminId, notification);
        notifications.push(notificationDoc);
      }

      return notifications;

    } catch (error) {
      console.error('Failed to broadcast notification:', error);
      throw error;
    }
  }

  // Get admin user IDs from the database
  async getAdminIds(excludeAdminId = null) {
    try {
      const usersCollection = this.db.collection('users');
      const query = { role: 'admin' };
      
      if (excludeAdminId) {
        query._id = { $ne: new ObjectId(excludeAdminId) };
      }

      const admins = await usersCollection.find(query, { projection: { _id: 1 } }).toArray();
      return admins.map(admin => admin._id.toString());

    } catch (error) {
      console.error('Failed to get admin IDs:', error);
      return [];
    }
  }

  // Get notifications for an admin
  async getNotifications(adminId, options = {}) {
    if (!this.initialized) {
      throw new Error('Admin Notification Service not initialized');
    }

    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null,
      severity = null
    } = options;

    const query = { adminId: new ObjectId(adminId) };

    if (unreadOnly) {
      query.read = false;
    }

    if (type) {
      query.type = type;
    }

    if (severity) {
      query.severity = severity;
    }

    try {
      const skip = (page - 1) * limit;

      const [notifications, totalCount, unreadCount] = await Promise.all([
        this.notificationsCollection
          .find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.notificationsCollection.countDocuments(query),
        this.notificationsCollection.countDocuments({
          adminId: new ObjectId(adminId),
          read: false
        })
      ]);

      return {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };

    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(adminId, notificationIds) {
    if (!this.initialized) {
      throw new Error('Admin Notification Service not initialized');
    }

    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      const result = await this.notificationsCollection.updateMany({
        adminId: new ObjectId(adminId),
        _id: { $in: ids.map(id => new ObjectId(id)) }
      }, {
        $set: { read: true, readAt: new Date() }
      });

      return result.modifiedCount;

    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for an admin
  async markAllAsRead(adminId) {
    if (!this.initialized) {
      throw new Error('Admin Notification Service not initialized');
    }

    try {
      const result = await this.notificationsCollection.updateMany({
        adminId: new ObjectId(adminId),
        read: false
      }, {
        $set: { read: true, readAt: new Date() }
      });

      return result.modifiedCount;

    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(adminId, notificationId) {
    if (!this.initialized) {
      throw new Error('Admin Notification Service not initialized');
    }

    try {
      const result = await this.notificationsCollection.deleteOne({
        _id: new ObjectId(notificationId),
        adminId: new ObjectId(adminId)
      });

      return result.deletedCount > 0;

    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // Predefined notification types and their templates
  createSecurityAlertNotification(details) {
    return {
      type: 'security_alert',
      severity: 'high',
      title: 'Security Alert',
      message: details.message || 'Suspicious activity detected',
      data: details,
      actionRequired: true,
      category: 'security'
    };
  }

  createUserSuspensionNotification(details) {
    return {
      type: 'user_suspended',
      severity: 'medium',
      title: 'User Suspended',
      message: `User ${details.userEmail} has been suspended`,
      data: details,
      actionRequired: false,
      category: 'user_management'
    };
  }

  createBulkActionNotification(details) {
    return {
      type: 'bulk_action',
      severity: 'medium',
      title: 'Bulk Action Performed',
      message: `${details.action} performed on ${details.userCount} users`,
      data: details,
      actionRequired: false,
      category: 'user_management'
    };
  }

  createSystemAlertNotification(details) {
    return {
      type: 'system_alert',
      severity: details.severity || 'medium',
      title: 'System Alert',
      message: details.message || 'System event occurred',
      data: details,
      actionRequired: details.actionRequired || false,
      category: 'system'
    };
  }

  createLoginFailureNotification(details) {
    return {
      type: 'login_failure',
      severity: 'medium',
      title: 'Multiple Login Failures',
      message: `${details.attempts} failed login attempts detected`,
      data: details,
      actionRequired: true,
      category: 'security'
    };
  }

  // Get/Set notification preferences for admin
  async getNotificationPreferences(adminId) {
    if (!this.initialized) {
      throw new Error('Admin Notification Service not initialized');
    }

    try {
      const preferences = await this.adminPreferencesCollection.findOne({
        adminId: new ObjectId(adminId)
      });

      // Default preferences
      const defaultPreferences = {
        emailNotifications: true,
        browserNotifications: true,
        securityAlerts: true,
        userManagementAlerts: true,
        systemAlerts: true,
        severityThreshold: 'medium' // low, medium, high
      };

      return preferences ? { ...defaultPreferences, ...preferences } : defaultPreferences;

    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(adminId, preferences) {
    if (!this.initialized) {
      throw new Error('Admin Notification Service not initialized');
    }

    try {
      const result = await this.adminPreferencesCollection.findOneAndUpdate(
        { adminId: new ObjectId(adminId) },
        {
          $set: {
            ...preferences,
            updatedAt: new Date()
          }
        },
        { upsert: true, returnDocument: 'after' }
      );

      return result.value;

    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  // Cleanup old notifications
  async cleanupOldNotifications(retentionDays = 90) {
    if (!this.initialized) {
      throw new Error('Admin Notification Service not initialized');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await this.notificationsCollection.deleteMany({
        timestamp: { $lt: cutoffDate },
        read: true
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications (older than ${retentionDays} days)`);
      return result.deletedCount;

    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(adminId, timeframe = 7) {
    if (!this.initialized) {
      throw new Error('Admin Notification Service not initialized');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    try {
      const pipeline = [
        {
          $match: {
            adminId: new ObjectId(adminId),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalNotifications: { $sum: 1 },
            unreadNotifications: {
              $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] }
            },
            highSeverity: {
              $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] }
            },
            mediumSeverity: {
              $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] }
            },
            lowSeverity: {
              $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] }
            },
            categories: { $push: "$category" },
            types: { $push: "$type" }
          }
        }
      ];

      const [result] = await this.notificationsCollection.aggregate(pipeline).toArray();

      if (!result) {
        return {
          totalNotifications: 0,
          unreadNotifications: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          lowSeverity: 0,
          topCategories: [],
          topTypes: []
        };
      }

      // Count category and type frequency
      const categoryCounts = {};
      result.categories.forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      const typeCounts = {};
      result.types.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      const topTypes = Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }));

      return {
        ...result,
        topCategories,
        topTypes
      };

    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  }
}

module.exports = AdminNotificationService;