const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');

// This will be initialized in server.js with the RealtimeAdminController instance
let realtimeController = null;

const setRealtimeController = (controller) => {
  realtimeController = controller;
};

// Middleware to ensure controller is initialized
const ensureController = (req, res, next) => {
  if (!realtimeController) {
    return res.status(500).json({
      success: false,
      message: 'Real-time monitoring not initialized'
    });
  }
  next();
};

// Get current system status
router.get('/system-status', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  await realtimeController.getSystemStatus(req, res);
});

// Get live user activity
router.get('/live-activity', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  await realtimeController.getLiveActivity(req, res);
});

// Get security alerts
router.get('/security-alerts', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  await realtimeController.getSecurityAlerts(req, res);
});

// Trigger manual security check
router.post('/security-check', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  await realtimeController.triggerSecurityCheck(req, res);
});

// Force disconnect a user
router.post('/users/:userId/disconnect', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  await realtimeController.forceDisconnectUser(req, res);
});

// Get detailed session info
router.get('/users/:userId/session', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  try {
    const { userId } = req.params;
    const monitoringService = realtimeController.getMonitoringService();
    const session = monitoringService.userSessions.get(userId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found for this user'
      });
    }
    
    const now = Date.now();
    const sessionData = {
      ...session,
      sessionDuration: now - session.startTime.getTime(),
      activityRate: session.activityCount / ((now - session.startTime.getTime()) / 60000), // per minute
      isActive: now - session.lastActivity.getTime() < 300000 // active in last 5 minutes
    };
    
    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error getting user session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user session'
    });
  }
});

// Get system performance metrics
router.get('/metrics', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  try {
    const monitoringService = realtimeController.getMonitoringService();
    const metrics = await monitoringService.getSystemMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system metrics'
    });
  }
});

// Get active sessions summary
router.get('/sessions', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  try {
    const monitoringService = realtimeController.getMonitoringService();
    const sessions = Array.from(monitoringService.userSessions.entries()).map(([userId, session]) => {
      const now = Date.now();
      return {
        userId,
        userInfo: session.userInfo,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        sessionDuration: now - session.startTime.getTime(),
        activityCount: session.activityCount,
        isActive: now - session.lastActivity.getTime() < 300000,
        status: session.status
      };
    });
    
    const summary = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isActive).length,
      inactiveSessions: sessions.filter(s => !s.isActive).length,
      avgSessionDuration: sessions.reduce((acc, s) => acc + s.sessionDuration, 0) / sessions.length || 0,
      totalActivities: sessions.reduce((acc, s) => acc + s.activityCount, 0),
      sessions: sessions.sort((a, b) => b.lastActivity - a.lastActivity)
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions'
    });
  }
});

// Broadcast message to all users
router.post('/broadcast', authenticateJWT, isAdmin, ensureController, async (req, res) => {
  try {
    const { message, type = 'info', targetUsers } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    const monitoringService = realtimeController.getMonitoringService();
    const broadcastData = {
      message,
      type,
      from: 'admin',
      timestamp: new Date()
    };
    
    if (targetUsers && Array.isArray(targetUsers)) {
      // Send to specific users
      targetUsers.forEach(userId => {
        monitoringService.io.emit(`user_${userId}`, broadcastData);
      });
    } else {
      // Send to all connected users
      monitoringService.io.emit('adminBroadcast', broadcastData);
    }
    
    res.json({
      success: true,
      message: 'Message broadcasted successfully',
      data: { 
        message, 
        type, 
        targetUsers: targetUsers || 'all',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast message'
    });
  }
});

module.exports = { router, setRealtimeController };