const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// In-memory notification store (in production, use Redis or database)
const notifications = new Map();

// Add notification
const addNotification = (userId, notification) => {
  if (!notifications.has(userId)) {
    notifications.set(userId, []);
  }
  
  const userNotifications = notifications.get(userId);
  userNotifications.unshift({
    id: Date.now().toString(),
    ...notification,
    createdAt: new Date().toISOString(),
    read: false
  });
  
  // Keep only last 50 notifications per user
  if (userNotifications.length > 50) {
    userNotifications.splice(50);
  }
};

// Get user notifications
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userNotifications = notifications.get(userId) || [];
    
    res.json({
      notifications: userNotifications,
      unreadCount: userNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const notificationId = req.params.id;
    
    const userNotifications = notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      res.json({ success: true });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userNotifications = notifications.get(userId) || [];
    
    userNotifications.forEach(notification => {
      notification.read = true;
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Helper function to create different types of notifications
const createNotification = {
  newPost: (postId, authorName) => ({
    type: 'new_post',
    message: `${authorName} shared a new post`,
    actionUrl: `/social/posts/${postId}`,
    icon: 'post'
  }),
  
  postLiked: (postId, likerName) => ({
    type: 'post_liked',
    message: `${likerName} liked your post`,
    actionUrl: `/social/posts/${postId}`,
    icon: 'heart'
  }),
  
  newComment: (postId, commenterName) => ({
    type: 'new_comment',
    message: `${commenterName} commented on your post`,
    actionUrl: `/social/posts/${postId}`,
    icon: 'comment'
  }),
  
  verificationApproved: (companyName) => ({
    type: 'verification_approved',
    message: `Your company "${companyName}" has been verified!`,
    actionUrl: '/terminal/verification',
    icon: 'check'
  }),
  
  verificationRejected: (companyName, reason) => ({
    type: 'verification_rejected',
    message: `Your company verification was rejected. Reason: ${reason}`,
    actionUrl: '/terminal/verification',
    icon: 'x'
  }),
  
  newInvestmentOpportunity: (title) => ({
    type: 'investment',
    message: `New investment opportunity: ${title}`,
    actionUrl: '/investments',
    icon: 'trending-up'
  })
};

module.exports = router;

// Export additional functions for use in other modules
module.exports.addNotification = addNotification;
module.exports.createNotification = createNotification;
