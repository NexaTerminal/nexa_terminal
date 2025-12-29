const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Global controller instances (will be initialized by server.js)
let offerRequestController;
let adminChatbotController;

// Multer configuration for chatbot document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'legal sources');
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Test route (no auth required for debugging)
router.get('/test', (req, res) => {
  console.log('🔍 Admin test route called');
  res.json({ message: 'Admin routes are working', offerControllerExists: !!offerRequestController });
});

// Test offer requests route - direct database access
router.get('/test-offer-requests', async (req, res) => {
  console.log('🔍 Test offer requests route called');
  try {
    // Direct database access to verify data exists
    const { MongoClient } = require('mongodb');
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db();
    const collection = db.collection('offer_requests');

    const requests = await collection.find({}).toArray();
    console.log(`Found ${requests.length} offer requests in database`);

    await client.close();

    res.json({
      success: true,
      count: requests.length,
      requests: requests.map(r => ({
        _id: r._id,
        serviceType: r.serviceType,
        status: r.status,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test users route - direct database access
router.get('/test-users', async (req, res) => {
  console.log('🔍 Test users route called');
  try {
    // Direct database access to verify users exist
    const { MongoClient } = require('mongodb');
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    const totalUsers = await usersCollection.countDocuments({});
    const users = await usersCollection.find({}).limit(5).toArray();

    console.log(`Found ${totalUsers} total users in database`);

    await client.close();

    res.json({
      success: true,
      totalUsers,
      sampleUsers: users.map(u => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        isVerified: u.isVerified,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('Test users route error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// All admin routes require authentication and admin privileges
router.use(authenticateJWT, isAdmin);

// User Management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.post('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/unsuspend', adminController.unsuspendUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/activity', adminController.getUserActivity);

// Platform Analytics
router.get('/analytics', adminController.getPlatformAnalytics);
router.get('/dashboard', adminController.getAdminDashboard);

// Data Export
router.get('/export/users', adminController.exportUserData);

// Bulk Operations
router.post('/bulk-action', adminController.bulkUserAction);

// Marketplace Management (Service Providers)
router.get('/marketplace/providers', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').getServiceProviders(req, res, next);
});

router.post('/marketplace/providers', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').createServiceProvider(req, res, next);
});

router.get('/marketplace/providers/:id', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').getServiceProviderById(req, res, next);
});

router.put('/marketplace/providers/:id', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').updateServiceProvider(req, res, next);
});

router.patch('/marketplace/providers/:id/status', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').updateProviderStatus(req, res, next);
});

router.delete('/marketplace/providers/:id', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').deleteServiceProvider(req, res, next);
});

router.get('/marketplace/categories', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').getServiceCategories(req, res, next);
});

router.post('/marketplace/categories', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').createServiceCategory(req, res, next);
});

router.get('/marketplace/analytics', (req, res, next) => {
  // Delegate to marketplace controller
  require('../controllers/marketplaceController').getMarketplaceAnalytics(req, res, next);
});

// Offer Request Management
router.get('/offer-requests', async (req, res, next) => {
  console.log('🔍 GET /admin/offer-requests - Admin route called');
  console.log('User:', { id: req.user?._id, isAdmin: req.user?.isAdmin });
  console.log('Query params:', req.query);
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.getRequestsForAdmin(req, res);
  } catch (error) {
    console.error('Admin offer requests route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/offer-requests/statistics', async (req, res, next) => {
  console.log('🔍 GET /admin/offer-requests/statistics - Admin route called');
  console.log('User:', { id: req.user?._id, isAdmin: req.user?.isAdmin });
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.getQualityStatistics(req, res);
  } catch (error) {
    console.error('Admin statistics route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/offer-requests/:id', async (req, res, next) => {
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.getOfferRequestDetails(req, res);
  } catch (error) {
    console.error('Admin request details route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get provider responses for a specific offer request
router.get('/offer-requests/:id/responses', async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /admin/offer-requests/${id}/responses - Admin route called`);

    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }

    // Use the provider interest service to get responses
    const ProviderInterestService = require('../services/providerInterestService');
    const providerInterestService = new ProviderInterestService(req.app.locals.db);

    // Get all provider interests for this request (including responses)
    const responses = await providerInterestService.getResponsesByRequest(id);

    res.json({
      success: true,
      responses
    });

  } catch (error) {
    console.error('Admin get provider responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/offer-requests/:id/verify', async (req, res, next) => {
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.verifyOfferRequest(req, res);
  } catch (error) {
    console.error('Admin verify request route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.put('/offer-requests/:id/reject', async (req, res, next) => {
  try {
    if (!offerRequestController) {
      return res.status(500).json({
        success: false,
        message: 'Offer request controller not initialized'
      });
    }
    await offerRequestController.rejectOfferRequest(req, res);
  } catch (error) {
    console.error('Admin reject request route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ========================================
// Chatbot Management Routes
// ========================================

// Document Management
router.get('/chatbot/documents', async (req, res, next) => {
  console.log('🔍 GET /admin/chatbot/documents - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.getDocuments(req, res);
  } catch (error) {
    console.error('Admin get documents route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/chatbot/documents/upload', upload.single('document'), async (req, res, next) => {
  console.log('🔍 POST /admin/chatbot/documents/upload - Admin route called');
  console.log('File:', req.file ? req.file.originalname : 'No file');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.uploadDocument(req, res);
  } catch (error) {
    console.error('Admin upload document route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

router.delete('/chatbot/documents/:documentName', async (req, res, next) => {
  console.log('🔍 DELETE /admin/chatbot/documents/:documentName - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.deleteDocument(req, res);
  } catch (error) {
    console.error('Admin delete document route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/chatbot/documents/stats', async (req, res, next) => {
  console.log('🔍 GET /admin/chatbot/documents/stats - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.getDocumentStats(req, res);
  } catch (error) {
    console.error('Admin document stats route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Conversation Management
router.get('/chatbot/conversations', async (req, res, next) => {
  console.log('🔍 GET /admin/chatbot/conversations - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.getAllConversations(req, res);
  } catch (error) {
    console.error('Admin get conversations route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/chatbot/conversations/:id', async (req, res, next) => {
  console.log('🔍 GET /admin/chatbot/conversations/:id - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.getConversationDetails(req, res);
  } catch (error) {
    console.error('Admin conversation details route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.patch('/chatbot/conversations/:id/flag', async (req, res, next) => {
  console.log('🔍 PATCH /admin/chatbot/conversations/:id/flag - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.flagConversation(req, res);
  } catch (error) {
    console.error('Admin flag conversation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.delete('/chatbot/conversations/:id', async (req, res, next) => {
  console.log('🔍 DELETE /admin/chatbot/conversations/:id - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.deleteConversation(req, res);
  } catch (error) {
    console.error('Admin delete conversation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Analytics
router.get('/chatbot/analytics', async (req, res, next) => {
  console.log('🔍 GET /admin/chatbot/analytics - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.getChatbotAnalytics(req, res);
  } catch (error) {
    console.error('Admin chatbot analytics route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/chatbot/analytics/usage', async (req, res, next) => {
  console.log('🔍 GET /admin/chatbot/analytics/usage - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.getUsageStats(req, res);
  } catch (error) {
    console.error('Admin usage stats route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/chatbot/analytics/queries', async (req, res, next) => {
  console.log('🔍 GET /admin/chatbot/analytics/queries - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.getPopularQueries(req, res);
  } catch (error) {
    console.error('Admin popular queries route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.get('/chatbot/analytics/credits', async (req, res, next) => {
  console.log('🔍 GET /admin/chatbot/analytics/credits - Admin route called');
  try {
    if (!adminChatbotController) {
      return res.status(500).json({
        success: false,
        message: 'Chatbot controller not initialized'
      });
    }
    await adminChatbotController.getCreditUsage(req, res);
  } catch (error) {
    console.error('Admin credit usage route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Initialize controllers (to be called by server.js)
const initializeOfferRequestController = (database) => {
  const OfferRequestController = require('../controllers/offerRequestController');
  offerRequestController = new OfferRequestController(database);
};

const initializeAdminChatbotController = (database, qdrantClient, chatBotService) => {
  const AdminChatbotController = require('../controllers/adminChatbotController');
  adminChatbotController = new AdminChatbotController(database, qdrantClient, chatBotService);
  console.log('✅ Admin Chatbot Controller initialized');
};

module.exports = {
  router,
  initializeOfferRequestController,
  initializeAdminChatbotController
};