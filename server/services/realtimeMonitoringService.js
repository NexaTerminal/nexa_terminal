const { EventEmitter } = require('events');

class RealtimeMonitoringService extends EventEmitter {
  constructor(io, userAnalyticsService) {
    super();
    this.io = io;
    this.analyticsService = userAnalyticsService;
    this.connectedAdmins = new Map();
    this.userSessions = new Map();
    this.alertThresholds = {
      failedLoginAttempts: 5,
      suspiciousActivity: 10,
      bulkDocumentGeneration: 20,
      rapidApiCalls: 100
    };
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.on('userLogin', this.handleUserLogin.bind(this));
    this.on('userLogout', this.handleUserLogout.bind(this));
    this.on('suspiciousActivity', this.handleSuspiciousActivity.bind(this));
    this.on('failedLogin', this.handleFailedLogin.bind(this));
    this.on('bulkActivity', this.handleBulkActivity.bind(this));
  }

  // Track admin connections
  addAdminConnection(adminId, socketId) {
    this.connectedAdmins.set(adminId, socketId);
    console.log(`Admin ${adminId} connected for real-time monitoring`);
  }

  removeAdminConnection(adminId) {
    this.connectedAdmins.delete(adminId);
    console.log(`Admin ${adminId} disconnected from real-time monitoring`);
  }

  // Track user sessions
  trackUserSession(userId, sessionData) {
    const existingSession = this.userSessions.get(userId);
    const newSession = {
      ...sessionData,
      startTime: existingSession?.startTime || new Date(),
      lastActivity: new Date(),
      activityCount: (existingSession?.activityCount || 0) + 1
    };
    
    this.userSessions.set(userId, newSession);
    this.broadcastToAdmins('userSessionUpdate', { userId, session: newSession });
    
    // Check for suspicious activity
    if (newSession.activityCount > this.alertThresholds.rapidApiCalls) {
      this.emit('suspiciousActivity', {
        userId,
        type: 'rapid_api_calls',
        count: newSession.activityCount,
        timeframe: Date.now() - newSession.startTime.getTime()
      });
    }
  }

  // Handle user login
  handleUserLogin(data) {
    const { userId, userInfo, loginData } = data;
    
    this.trackUserSession(userId, {
      ...loginData,
      status: 'active',
      userInfo
    });

    this.broadcastToAdmins('userLogin', {
      userId,
      userInfo,
      timestamp: new Date(),
      ...loginData
    });
  }

  // Handle user logout
  handleUserLogout(data) {
    const { userId } = data;
    const session = this.userSessions.get(userId);
    
    if (session) {
      const sessionDuration = Date.now() - session.startTime.getTime();
      this.userSessions.delete(userId);
      
      this.broadcastToAdmins('userLogout', {
        userId,
        sessionDuration,
        activityCount: session.activityCount,
        timestamp: new Date()
      });
    }
  }

  // Handle failed login attempts
  handleFailedLogin(data) {
    const { email, ipAddress, userAgent } = data;
    
    // Track failed attempts per IP
    const key = `failed_login_${ipAddress}`;
    const attempts = this.getRecentAttempts(key);
    
    if (attempts >= this.alertThresholds.failedLoginAttempts) {
      this.broadcastToAdmins('securityAlert', {
        type: 'multiple_failed_logins',
        email,
        ipAddress,
        userAgent,
        attemptCount: attempts,
        timestamp: new Date()
      });
    }
  }

  // Handle suspicious activity
  handleSuspiciousActivity(data) {
    const { userId, type, details } = data;
    const session = this.userSessions.get(userId);
    
    const alert = {
      userId,
      type,
      details,
      userSession: session,
      timestamp: new Date(),
      severity: this.calculateSeverity(type, details)
    };

    this.broadcastToAdmins('suspiciousActivity', alert);
    
    // Auto-suspend for high severity
    if (alert.severity === 'high') {
      this.emit('autoSuspend', { userId, reason: `Suspicious activity: ${type}`, alert });
    }
  }

  // Handle bulk activity detection
  handleBulkActivity(data) {
    const { userId, action, count, timeframe } = data;
    
    if (count > this.alertThresholds.bulkDocumentGeneration) {
      this.broadcastToAdmins('bulkActivityAlert', {
        userId,
        action,
        count,
        timeframe,
        timestamp: new Date()
      });
    }
  }

  // Get current system status
  async getSystemStatus() {
    const activeSessions = Array.from(this.userSessions.entries()).map(([userId, session]) => ({
      userId,
      ...session,
      sessionDuration: Date.now() - session.startTime.getTime()
    }));

    const systemMetrics = await this.getSystemMetrics();
    
    return {
      activeSessions,
      totalActiveSessions: activeSessions.length,
      connectedAdmins: this.connectedAdmins.size,
      systemMetrics,
      alerts: await this.getRecentAlerts(),
      timestamp: new Date()
    };
  }

  // Get system performance metrics
  async getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Get database metrics if available
    let dbMetrics = {};
    if (this.analyticsService.db) {
      try {
        const stats = await this.analyticsService.db.stats();
        dbMetrics = {
          collections: stats.collections,
          dataSize: stats.dataSize,
          indexSize: stats.indexSize
        };
      } catch (error) {
        console.error('Failed to get DB metrics:', error);
      }
    }

    return {
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      },
      uptime: Math.round(uptime),
      database: dbMetrics,
      activeSessions: this.userSessions.size,
      timestamp: new Date()
    };
  }

  // Get recent alerts
  async getRecentAlerts(limit = 50) {
    // In a real implementation, this would query a database
    // For now, return empty array as alerts would be stored separately
    return [];
  }

  // Calculate severity based on activity type
  calculateSeverity(type, details) {
    const severityMap = {
      rapid_api_calls: 'medium',
      multiple_failed_logins: 'high',
      suspicious_document_generation: 'medium',
      unauthorized_access_attempt: 'high',
      data_export_attempt: 'high',
      bulk_user_creation: 'high'
    };
    
    const baseSeverity = severityMap[type] || 'low';
    
    // Increase severity based on details
    if (details?.count > 100) return 'high';
    if (details?.timeframe < 60000) return 'high'; // Less than 1 minute
    
    return baseSeverity;
  }

  // Track recent attempts (simple in-memory cache)
  getRecentAttempts(key) {
    // In production, use Redis or similar
    if (!this.attemptCache) this.attemptCache = new Map();
    
    const now = Date.now();
    const attempts = this.attemptCache.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < 300000); // 5 minutes
    
    recentAttempts.push(now);
    this.attemptCache.set(key, recentAttempts);
    
    return recentAttempts.length;
  }

  // Broadcast to all connected admins
  broadcastToAdmins(event, data) {
    this.connectedAdmins.forEach((socketId, adminId) => {
      if (this.io) {
        this.io.to(socketId).emit(event, {
          ...data,
          adminId,
          timestamp: new Date()
        });
      }
    });
  }

  // Get live user activity
  async getLiveActivity(timeframe = 300000) { // 5 minutes default
    const now = Date.now();
    const recentActivity = [];
    
    this.userSessions.forEach((session, userId) => {
      if (now - session.lastActivity.getTime() < timeframe) {
        recentActivity.push({
          userId,
          userInfo: session.userInfo,
          lastActivity: session.lastActivity,
          activityCount: session.activityCount,
          sessionDuration: now - session.startTime.getTime()
        });
      }
    });

    return recentActivity.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  // Clean up old sessions
  cleanupOldSessions() {
    const now = Date.now();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
    
    this.userSessions.forEach((session, userId) => {
      if (now - session.lastActivity.getTime() > maxInactiveTime) {
        this.userSessions.delete(userId);
        this.broadcastToAdmins('userSessionTimeout', { userId, session });
      }
    });
  }

  // Start cleanup interval
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldSessions();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

module.exports = RealtimeMonitoringService;