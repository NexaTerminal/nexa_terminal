const RealtimeMonitoringService = require('../services/realtimeMonitoringService');

class RealtimeAdminController {
  constructor(io, userAnalyticsService) {
    this.monitoringService = new RealtimeMonitoringService(io, userAnalyticsService);
    this.monitoringService.startCleanupInterval();
    this.setupSocketHandlers(io);
  }

  setupSocketHandlers(io) {
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      // Admin joins monitoring room
      socket.on('joinAdminMonitoring', (data) => {
        const { adminId, token } = data;
        // In production, verify the admin token here
        
        socket.join('admin-monitoring');
        this.monitoringService.addAdminConnection(adminId, socket.id);
        
        // Send current system status
        this.monitoringService.getSystemStatus().then(status => {
          socket.emit('systemStatus', status);
        });
      });

      // Admin leaves monitoring
      socket.on('leaveAdminMonitoring', (data) => {
        const { adminId } = data;
        socket.leave('admin-monitoring');
        this.monitoringService.removeAdminConnection(adminId);
      });

      // Request live activity
      socket.on('requestLiveActivity', async () => {
        try {
          const activity = await this.monitoringService.getLiveActivity();
          socket.emit('liveActivity', activity);
        } catch (error) {
          socket.emit('error', { message: 'Failed to fetch live activity' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        // Remove from admin connections if it was an admin
        this.monitoringService.connectedAdmins.forEach((socketId, adminId) => {
          if (socketId === socket.id) {
            this.monitoringService.removeAdminConnection(adminId);
          }
        });
      });
    });
  }

  // Express route handlers for real-time admin features
  
  // Get current system status
  async getSystemStatus(req, res) {
    try {
      const status = await this.monitoringService.getSystemStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting system status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system status'
      });
    }
  }

  // Get live user activity
  async getLiveActivity(req, res) {
    try {
      const { timeframe = 300000 } = req.query;
      const activity = await this.monitoringService.getLiveActivity(parseInt(timeframe));
      
      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error('Error getting live activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get live activity'
      });
    }
  }

  // Get security alerts
  async getSecurityAlerts(req, res) {
    try {
      const { limit = 50, severity } = req.query;
      const alerts = await this.monitoringService.getRecentAlerts(parseInt(limit));
      
      let filteredAlerts = alerts;
      if (severity) {
        filteredAlerts = alerts.filter(alert => alert.severity === severity);
      }
      
      res.json({
        success: true,
        data: filteredAlerts
      });
    } catch (error) {
      console.error('Error getting security alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get security alerts'
      });
    }
  }

  // Manually trigger security check
  async triggerSecurityCheck(req, res) {
    try {
      const { userId, checkType } = req.body;
      
      // Perform security check based on type
      let result;
      switch (checkType) {
        case 'session_audit':
          result = await this.auditUserSession(userId);
          break;
        case 'activity_pattern':
          result = await this.analyzeActivityPattern(userId);
          break;
        case 'permission_check':
          result = await this.checkUserPermissions(userId);
          break;
        default:
          throw new Error('Invalid check type');
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error triggering security check:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to trigger security check'
      });
    }
  }

  // Audit user session
  async auditUserSession(userId) {
    const session = this.monitoringService.userSessions.get(userId);
    if (!session) {
      return { status: 'no_active_session', userId };
    }
    
    const now = Date.now();
    const sessionDuration = now - session.startTime.getTime();
    const activityRate = session.activityCount / (sessionDuration / 60000); // per minute
    
    const flags = [];
    if (activityRate > 10) flags.push('high_activity_rate');
    if (sessionDuration > 8 * 60 * 60 * 1000) flags.push('long_session'); // 8 hours
    if (session.activityCount > 1000) flags.push('excessive_requests');
    
    return {
      userId,
      session: {
        ...session,
        sessionDuration,
        activityRate: Math.round(activityRate * 100) / 100
      },
      flags,
      riskLevel: flags.length > 2 ? 'high' : flags.length > 0 ? 'medium' : 'low'
    };
  }

  // Analyze user activity patterns
  async analyzeActivityPattern(userId) {
    // This would typically analyze historical data
    // For now, return current session analysis
    const session = this.monitoringService.userSessions.get(userId);
    if (!session) {
      return { status: 'no_data', userId };
    }
    
    return {
      userId,
      pattern: 'normal', // In production, this would be ML-based analysis
      confidence: 0.85,
      anomalies: [],
      recommendation: 'continue_monitoring'
    };
  }

  // Check user permissions
  async checkUserPermissions(userId) {
    // This would check against user database
    return {
      userId,
      permissions: ['read', 'write', 'generate_documents'],
      restrictions: [],
      status: 'valid'
    };
  }

  // Force disconnect user
  async forceDisconnectUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason = 'Administrative action' } = req.body;
      
      // Remove user session
      const session = this.monitoringService.userSessions.get(userId);
      if (session) {
        this.monitoringService.userSessions.delete(userId);
        
        // Broadcast force disconnect to user's socket if connected
        this.monitoringService.io.emit('forceDisconnect', {
          userId,
          reason,
          timestamp: new Date()
        });
        
        // Notify admins
        this.monitoringService.broadcastToAdmins('userForceDisconnected', {
          userId,
          reason,
          session
        });
        
        res.json({
          success: true,
          message: 'User disconnected successfully',
          data: { userId, reason }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'User session not found'
        });
      }
    } catch (error) {
      console.error('Error force disconnecting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect user'
      });
    }
  }

  // Get monitoring service instance (for use in other parts of the app)
  getMonitoringService() {
    return this.monitoringService;
  }
}

module.exports = RealtimeAdminController;