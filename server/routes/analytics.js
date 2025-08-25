const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const SocialPost = require('../models/SocialPost');
const UserService = require('../services/userService');
const CompanyVerification = require('../models/CompanyVerification');

// Get analytics dashboard data
router.get('/dashboard', authenticateJWT, cacheMiddleware(300), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userService = new UserService(db);
    const isAdmin = req.user.role === 'admin';
    const userId = req.user._id.toString();
    
    if (isAdmin) {
      // Admin analytics
      const analytics = await getAdminAnalytics(db, userService);
      res.json(analytics);
    } else {
      // User analytics
      const analytics = await getUserAnalytics(userId, db);
      res.json(analytics);
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// Admin analytics function
async function getAdminAnalytics(db, userService) {
  try {
    const socialpostsCollection = db.collection('socialposts');
    const verificationCollection = db.collection('companyVerifications');
    
    const [
      userStats,
      totalPosts,
      pendingVerifications,
      approvedVerifications,
      recentActivity,
      userGrowth,
      topCompanies
    ] = await Promise.all([
      userService.getUserStats(),
      socialpostsCollection.countDocuments(),
      verificationCollection.countDocuments({ status: 'pending' }),
      verificationCollection.countDocuments({ status: 'approved' }),
      getRecentActivity(db),
      getUserGrowthData(db),
      getTopCompanies(db)
    ]);

    return {
      overview: {
        totalUsers: userStats.totalUsers,
        totalPosts,
        pendingVerifications,
        approvedVerifications,
        activeUsers: await getActiveUsersCount(db),
        verificationRate: userStats.totalUsers > 0 ? ((approvedVerifications / userStats.totalUsers) * 100).toFixed(1) : 0
      },
      growth: userGrowth,
      activity: recentActivity,
      topCompanies,
      generated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting admin analytics:', error);
    throw error;
  }
}

// User analytics function
async function getUserAnalytics(userId, db) {
  try {
    const socialpostsCollection = db.collection('socialposts');
    
    const [
      userPosts,
      totalLikes,
      totalComments,
      engagement,
      recentActivity
    ] = await Promise.all([
      socialpostsCollection.countDocuments({ author: userId }),
      getTotalLikesForUser(userId, db),
      getTotalCommentsForUser(userId, db),
      getEngagementRate(userId, db),
      getUserRecentActivity(userId, db)
    ]);

    return {
      overview: {
        totalPosts: userPosts,
        totalLikes,
        totalComments,
        engagementRate: engagement,
        averageLikesPerPost: userPosts > 0 ? (totalLikes / userPosts).toFixed(1) : 0
      },
      activity: recentActivity,
      generated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
}

// Helper functions
async function getRecentActivity(db) {
  const socialpostsCollection = db.collection('socialposts');
  const usersCollection = db.collection('users');
  
  const recentPosts = await socialpostsCollection
    .find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const activities = [];
  for (const post of recentPosts) {
    const author = await usersCollection.findOne({ _id: post.author });
    activities.push({
      type: 'post',
      message: `${author?.email || 'Unknown'} created a new post`,
      timestamp: post.createdAt,
      details: {
        content: post.content.substring(0, 100) + '...',
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0
      }
    });
  }

  return activities;
}

async function getUserGrowthData(db) {
  const usersCollection = db.collection('users');
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const growth = await usersCollection.aggregate([
    {
      $match: {
        createdAt: { $gte: last30Days }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]).toArray();

  return growth;
}

async function getTopCompanies(db) {
  const socialpostsCollection = db.collection('socialposts');
  
  const topCompanies = await socialpostsCollection.aggregate([
    {
      $match: {
        postType: 'user_post',
        isApproved: true
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    { $unwind: '$author' },
    {
      $group: {
        _id: '$author.companyInfo.companyName',
        postCount: { $sum: 1 },
        totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
        totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
      }
    },
    {
      $match: {
        _id: { $ne: null, $ne: '' }
      }
    },
    {
      $sort: { totalLikes: -1 }
    },
    { $limit: 10 }
  ]).toArray();

  return topCompanies;
}

async function getActiveUsersCount(db) {
  const socialpostsCollection = db.collection('socialposts');
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const activeUsers = await socialpostsCollection.distinct('author', {
    createdAt: { $gte: last7Days }
  });

  return activeUsers.length;
}

async function getTotalLikesForUser(userId, db) {
  const socialpostsCollection = db.collection('socialposts');
  const { ObjectId } = require('mongodb');
  
  const result = await socialpostsCollection.aggregate([
    { $match: { author: new ObjectId(userId) } },
    { $group: { _id: null, totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } } } }
  ]).toArray();

  return result[0]?.totalLikes || 0;
}

async function getTotalCommentsForUser(userId, db) {
  const socialpostsCollection = db.collection('socialposts');
  const { ObjectId } = require('mongodb');
  
  const result = await socialpostsCollection.aggregate([
    { $match: { author: new ObjectId(userId) } },
    { $group: { _id: null, totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } } } }
  ]).toArray();

  return result[0]?.totalComments || 0;
}

async function getEngagementRate(userId, db) {
  const socialpostsCollection = db.collection('socialposts');
  const { ObjectId } = require('mongodb');
  
  const posts = await socialpostsCollection.find({ author: new ObjectId(userId) }).toArray();
  
  if (posts.length === 0) return 0;

  const totalEngagement = posts.reduce((sum, post) => {
    return sum + (post.likes?.length || 0) + (post.comments?.length || 0);
  }, 0);

  return ((totalEngagement / posts.length)).toFixed(2);
}

async function getUserRecentActivity(userId, db) {
  const socialpostsCollection = db.collection('socialposts');
  const { ObjectId } = require('mongodb');
  
  const activities = [];

  // Recent posts
  const recentPosts = await socialpostsCollection
    .find({ author: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  recentPosts.forEach(post => {
    activities.push({
      type: 'post_created',
      message: 'You created a new post',
      timestamp: post.createdAt,
      details: {
        content: post.content.substring(0, 100) + '...',
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0
      }
    });
  });

  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = router;
