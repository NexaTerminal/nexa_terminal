const { MongoClient, ObjectId } = require('mongodb');

class AuditLoggingService {
  constructor() {
    this.client = null;
    this.db = null;
    this.auditLogsCollection = null;
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
      
      this.auditLogsCollection = this.db.collection('audit_logs');
      
      // Create indexes for efficient querying
      await this.auditLogsCollection.createIndex({ timestamp: -1 });
      await this.auditLogsCollection.createIndex({ adminId: 1, timestamp: -1 });
      await this.auditLogsCollection.createIndex({ action: 1, timestamp: -1 });
      await this.auditLogsCollection.createIndex({ targetType: 1, targetId: 1, timestamp: -1 });
      
      this.initialized = true;
      console.log('✅ Audit Logging Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Audit Logging Service:', error);
      throw error;
    }
  }

  // Log admin actions
  async logAdminAction(adminId, action, details = {}) {
    if (!this.initialized) {
      console.error('Audit Logging Service not initialized');
      return;
    }

    try {
      const auditLog = {
        adminId: new ObjectId(adminId),
        action,
        details,
        timestamp: new Date(),
        ipAddress: details.ipAddress || null,
        userAgent: details.userAgent || null,
        sessionId: details.sessionId || null,
        success: details.success !== false, // Default to true unless explicitly false
        errorMessage: details.error || null
      };

      // Add target information if provided
      if (details.targetId) {
        auditLog.targetId = details.targetId;
      }
      if (details.targetType) {
        auditLog.targetType = details.targetType; // 'user', 'system', 'config', etc.
      }

      // Add change tracking
      if (details.before || details.after) {
        auditLog.changes = {
          before: details.before || null,
          after: details.after || null
        };
      }

      await this.auditLogsCollection.insertOne(auditLog);
      
      // Also log to console for debugging
      console.log(`📝 Admin Action: ${action} by ${adminId}`, {
        target: details.targetType ? `${details.targetType}:${details.targetId}` : 'system',
        success: auditLog.success
      });

    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // Log user actions (for admin monitoring)
  async logUserAction(userId, action, details = {}) {
    if (!this.initialized) {
      console.error('Audit Logging Service not initialized');
      return;
    }

    try {
      const auditLog = {
        userId: new ObjectId(userId),
        action,
        details,
        timestamp: new Date(),
        ipAddress: details.ipAddress || null,
        userAgent: details.userAgent || null,
        success: details.success !== false
      };

      await this.auditLogsCollection.insertOne(auditLog);

    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }

  // Get audit logs with filtering
  async getAuditLogs(filters = {}, options = {}) {
    if (!this.initialized) {
      throw new Error('Audit Logging Service not initialized');
    }

    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = -1
    } = options;

    const query = {};

    // Filter by admin
    if (filters.adminId) {
      query.adminId = new ObjectId(filters.adminId);
    }

    // Filter by user (for user-related actions)
    if (filters.userId) {
      query.userId = new ObjectId(filters.userId);
    }

    // Filter by action
    if (filters.action) {
      if (Array.isArray(filters.action)) {
        query.action = { $in: filters.action };
      } else {
        query.action = filters.action;
      }
    }

    // Filter by target type
    if (filters.targetType) {
      query.targetType = filters.targetType;
    }

    // Filter by target ID
    if (filters.targetId) {
      query.targetId = filters.targetId;
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate);
      }
    }

    // Filter by success/failure
    if (filters.success !== undefined) {
      query.success = filters.success;
    }

    try {
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const [logs, totalCount] = await Promise.all([
        this.auditLogsCollection
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.auditLogsCollection.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };

    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  // Get audit statistics
  async getAuditStats(timeframe = 30) {
    if (!this.initialized) {
      throw new Error('Audit Logging Service not initialized');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    try {
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalActions: { $sum: 1 },
            successfulActions: {
              $sum: { $cond: [{ $eq: ["$success", true] }, 1, 0] }
            },
            failedActions: {
              $sum: { $cond: [{ $eq: ["$success", false] }, 1, 0] }
            },
            uniqueAdmins: { $addToSet: "$adminId" },
            uniqueUsers: { $addToSet: "$userId" },
            actionTypes: { $push: "$action" }
          }
        }
      ];

      const [result] = await this.auditLogsCollection.aggregate(pipeline).toArray();

      if (!result) {
        return {
          totalActions: 0,
          successfulActions: 0,
          failedActions: 0,
          uniqueAdmins: 0,
          uniqueUsers: 0,
          topActions: []
        };
      }

      // Count action frequency
      const actionCounts = {};
      result.actionTypes.forEach(action => {
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      });

      const topActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      return {
        totalActions: result.totalActions,
        successfulActions: result.successfulActions,
        failedActions: result.failedActions,
        uniqueAdmins: result.uniqueAdmins.filter(id => id !== null).length,
        uniqueUsers: result.uniqueUsers.filter(id => id !== null).length,
        topActions,
        successRate: result.totalActions ? (result.successfulActions / result.totalActions * 100).toFixed(2) : 0
      };

    } catch (error) {
      console.error('Failed to get audit stats:', error);
      throw error;
    }
  }

  // Get recent critical actions
  async getCriticalActions(limit = 20) {
    if (!this.initialized) {
      throw new Error('Audit Logging Service not initialized');
    }

    const criticalActions = [
      'user_suspended',
      'user_deleted',
      'admin_role_granted',
      'admin_role_revoked',
      'bulk_user_action',
      'system_configuration_changed',
      'security_alert_triggered',
      'force_user_disconnect'
    ];

    try {
      const logs = await this.auditLogsCollection
        .find({
          action: { $in: criticalActions }
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return logs;

    } catch (error) {
      console.error('Failed to get critical actions:', error);
      throw error;
    }
  }

  // Clean up old audit logs (optional retention policy)
  async cleanupOldLogs(retentionDays = 365) {
    if (!this.initialized) {
      throw new Error('Audit Logging Service not initialized');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await this.auditLogsCollection.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old audit logs (older than ${retentionDays} days)`);
      return result.deletedCount;

    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      throw error;
    }
  }

  // Export audit logs (for compliance)
  async exportAuditLogs(filters = {}, format = 'json') {
    if (!this.initialized) {
      throw new Error('Audit Logging Service not initialized');
    }

    try {
      const { logs } = await this.getAuditLogs(filters, { limit: 10000 });

      if (format === 'csv') {
        // Convert to CSV format
        const csv = [
          'Timestamp,Admin ID,User ID,Action,Target Type,Target ID,Success,IP Address,Details'
        ];

        logs.forEach(log => {
          csv.push([
            log.timestamp.toISOString(),
            log.adminId || '',
            log.userId || '',
            log.action,
            log.targetType || '',
            log.targetId || '',
            log.success,
            log.ipAddress || '',
            JSON.stringify(log.details).replace(/"/g, '""')
          ].join(','));
        });

        return csv.join('\n');
      }

      return JSON.stringify(logs, null, 2);

    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw error;
    }
  }
}

module.exports = AuditLoggingService;