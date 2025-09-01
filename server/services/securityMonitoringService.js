/**
 * Real-time Security Monitoring Service
 * Tracks and alerts on security events
 */

class SecurityMonitoringService {
  constructor(database, io = null) {
    this.db = database;
    this.io = io; // Socket.io instance for real-time alerts
    this.alertThresholds = {
      failedLoginsPerMinute: 10,
      rateLimitHitsPerMinute: 20,
      suspiciousRequestsPerMinute: 5,
      adminActionsPerMinute: 10,
      documentGenerationsPerMinute: 15
    };
  }

  /**
   * Log security events
   */
  async logSecurityEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date(),
      data,
      severity: this.calculateSeverity(eventType, data),
      processed: false
    };

    // Store in database
    await this.db.collection('security_events').insertOne(event);

    // Check for alert conditions
    await this.checkAlertConditions(eventType, data);

    // Emit real-time event if socket available
    if (this.io) {
      this.io.to('admin-room').emit('security-event', {
        type: eventType,
        severity: event.severity,
        timestamp: event.timestamp,
        summary: this.generateEventSummary(eventType, data)
      });
    }

    return event;
  }

  /**
   * Calculate event severity
   */
  calculateSeverity(eventType, data) {
    const severityMap = {
      'failed_login': 'medium',
      'account_locked': 'high',
      'rate_limit_exceeded': 'medium',
      'suspicious_request': 'high',
      'admin_action': 'low',
      'brute_force_detected': 'critical',
      'sql_injection_attempt': 'critical',
      'xss_attempt': 'high',
      'unauthorized_access': 'critical',
      'data_breach_attempt': 'critical'
    };

    let baseSeverity = severityMap[eventType] || 'low';

    // Escalate based on frequency
    if (data.frequency && data.frequency > 5) {
      const severityLevels = ['low', 'medium', 'high', 'critical'];
      const currentIndex = severityLevels.indexOf(baseSeverity);
      baseSeverity = severityLevels[Math.min(currentIndex + 1, 3)];
    }

    return baseSeverity;
  }

  /**
   * Check for alert conditions
   */
  async checkAlertConditions(eventType, data) {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Count recent events of this type
    const recentCount = await this.db.collection('security_events').countDocuments({
      type: eventType,
      timestamp: { $gte: oneMinuteAgo }
    });

    const threshold = this.alertThresholds[`${eventType}PerMinute`] || 
                     this.alertThresholds.suspiciousRequestsPerMinute;

    if (recentCount >= threshold) {
      await this.triggerAlert(eventType, {
        count: recentCount,
        threshold,
        timeWindow: '1 minute',
        latestEvent: data
      });
    }

    // Check for coordinated attacks (multiple IPs, same pattern)
    await this.detectCoordinatedAttacks(eventType, data);
  }

  /**
   * Detect coordinated attacks
   */
  async detectCoordinatedAttacks(eventType, data) {
    if (!data.ip) return;

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // Find similar events from different IPs
    const similarEvents = await this.db.collection('security_events').aggregate([
      {
        $match: {
          type: eventType,
          timestamp: { $gte: tenMinutesAgo },
          'data.ip': { $ne: data.ip }
        }
      },
      {
        $group: {
          _id: '$data.ip',
          count: { $sum: 1 },
          events: { $push: '$data' }
        }
      },
      {
        $match: {
          count: { $gte: 3 } // At least 3 events from each IP
        }
      }
    ]).toArray();

    if (similarEvents.length >= 3) { // At least 3 different IPs
      await this.triggerAlert('coordinated_attack_detected', {
        attackType: eventType,
        involvedIPs: similarEvents.map(e => e._id),
        totalEvents: similarEvents.reduce((sum, e) => sum + e.count, 0),
        timeWindow: '10 minutes'
      });
    }
  }

  /**
   * Trigger security alert
   */
  async triggerAlert(alertType, data) {
    const alert = {
      type: alertType,
      timestamp: new Date(),
      data,
      status: 'open',
      severity: this.calculateSeverity(alertType, data)
    };

    // Store alert
    await this.db.collection('security_alerts').insertOne(alert);

    // Log critical alerts
    console.error(`🚨 SECURITY ALERT [${alert.severity.toUpperCase()}]: ${alertType}`, data);

    // Send real-time notification
    if (this.io) {
      this.io.to('admin-room').emit('security-alert', {
        type: alertType,
        severity: alert.severity,
        timestamp: alert.timestamp,
        message: this.generateAlertMessage(alertType, data)
      });
    }

    // For critical alerts, consider additional actions
    if (alert.severity === 'critical') {
      await this.handleCriticalAlert(alertType, data);
    }

    return alert;
  }

  /**
   * Handle critical security alerts
   */
  async handleCriticalAlert(alertType, data) {
    // Auto-block IPs for certain attack types
    if (['brute_force_detected', 'sql_injection_attempt', 'coordinated_attack_detected'].includes(alertType)) {
      if (data.ip || data.involvedIPs) {
        const ipsToBlock = data.involvedIPs || [data.ip];
        await this.autoBlockIPs(ipsToBlock, alertType);
      }
    }

    // Send email notification to admins (if configured)
    await this.sendAdminNotification(alertType, data);
  }

  /**
   * Auto-block malicious IPs
   */
  async autoBlockIPs(ips, reason) {
    const blockDuration = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = new Date(Date.now() + blockDuration);

    for (const ip of ips) {
      await this.db.collection('blocked_ips').replaceOne(
        { ip },
        {
          ip,
          reason,
          blockedAt: new Date(),
          expiresAt,
          autoBlocked: true
        },
        { upsert: true }
      );

      console.warn(`🚫 Auto-blocked IP: ${ip} for ${reason}`);
    }
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Recent events summary
    const eventsSummary = await this.db.collection('security_events').aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          latestEvent: { $last: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Open alerts
    const openAlerts = await this.db.collection('security_alerts').find({
      status: 'open',
      timestamp: { $gte: since }
    }).sort({ timestamp: -1 }).limit(20).toArray();

    // Top attacking IPs
    const topAttackingIPs = await this.db.collection('security_events').aggregate([
      { 
        $match: { 
          timestamp: { $gte: since },
          'data.ip': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$data.ip',
          eventCount: { $sum: 1 },
          eventTypes: { $addToSet: '$type' },
          lastSeen: { $max: '$timestamp' }
        }
      },
      { $sort: { eventCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Blocked IPs
    const blockedIPs = await this.db.collection('blocked_ips').find({
      expiresAt: { $gt: new Date() }
    }).toArray();

    // Hourly trend
    const hourlyTrend = await this.db.collection('security_events').aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          events: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ]).toArray();

    return {
      summary: {
        totalEvents: eventsSummary.reduce((sum, e) => sum + e.count, 0),
        openAlerts: openAlerts.length,
        blockedIPs: blockedIPs.length,
        topThreat: eventsSummary[0]?.type || 'none'
      },
      eventsSummary,
      openAlerts: openAlerts.map(alert => ({
        ...alert,
        message: this.generateAlertMessage(alert.type, alert.data)
      })),
      topAttackingIPs,
      blockedIPs,
      hourlyTrend
    };
  }

  /**
   * Generate human-readable alert messages
   */
  generateAlertMessage(alertType, data) {
    const messages = {
      'brute_force_detected': `Brute force attack detected from ${data.ip || 'multiple IPs'}`,
      'coordinated_attack_detected': `Coordinated attack involving ${data.involvedIPs?.length || 0} IPs`,
      'rate_limit_exceeded': `Rate limit exceeded: ${data.count} requests in ${data.timeWindow}`,
      'suspicious_request': `Suspicious request pattern detected`,
      'sql_injection_attempt': `SQL injection attempt blocked`,
      'xss_attempt': `XSS attack attempt blocked`,
      'unauthorized_access': `Unauthorized access attempt to protected resource`
    };

    return messages[alertType] || `Security event: ${alertType}`;
  }

  /**
   * Generate event summary
   */
  generateEventSummary(eventType, data) {
    return {
      type: eventType,
      ip: data.ip,
      user: data.userId,
      endpoint: data.endpoint,
      timestamp: new Date()
    };
  }

  /**
   * Send admin notification (email, Slack, etc.)
   */
  async sendAdminNotification(alertType, data) {
    // Implementation depends on notification system
    // This is a placeholder for email/Slack integration
    console.warn(`📧 Admin notification should be sent for: ${alertType}`, data);
  }

  /**
   * Close alert (admin action)
   */
  async closeAlert(alertId, adminUserId, reason) {
    await this.db.collection('security_alerts').updateOne(
      { _id: alertId },
      {
        $set: {
          status: 'closed',
          closedBy: adminUserId,
          closedAt: new Date(),
          closeReason: reason
        }
      }
    );
  }

  /**
   * Clean up old events and alerts
   */
  async cleanup() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Clean old events
    await this.db.collection('security_events').deleteMany({
      timestamp: { $lt: thirtyDaysAgo }
    });

    // Clean old closed alerts
    await this.db.collection('security_alerts').deleteMany({
      status: 'closed',
      closedAt: { $lt: thirtyDaysAgo }
    });

    // Clean expired IP blocks
    await this.db.collection('blocked_ips').deleteMany({
      expiresAt: { $lt: new Date() }
    });

    console.info('🧹 Security monitoring cleanup completed');
  }
}

module.exports = SecurityMonitoringService;