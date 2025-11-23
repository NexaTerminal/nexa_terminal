// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
require('dotenv').config({ path: envFile });

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const passport = require('passport');
const path = require('path');
const fs = require('fs').promises;

// Settings Manager - Load first to control feature availability
const settings = require('./config/settingsManager');

// Security middleware imports
const { 
  configureSecurityHeaders, 
  generalRateLimit, 
  authRateLimit,
  securityLogger,
  requestSizeLimiter
} = require('./middleware/security');
const { sanitizeRequest } = require('./middleware/validation');

// Conditional middleware imports based on settings
let setCSRFToken, verifyCSRFToken, getCSRFToken, exemptCSRF;
if (settings.isMiddlewareEnabled('csrf')) {
  const csrfModule = require('./middleware/csrf');
  setCSRFToken = csrfModule.setCSRFToken;
  verifyCSRFToken = csrfModule.verifyCSRFToken;
  getCSRFToken = csrfModule.getCSRFToken;
  exemptCSRF = csrfModule.exemptCSRF;
}

const cookieParser = require('cookie-parser');

// Initialize Express app
const app = express();

if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not set in environment variables');
  process.exit(1);
}

// Security Configuration
app.set('trust proxy', 1); // Trust first proxy for rate limiting

// Security Middleware (order matters!)
app.use(configureSecurityHeaders()); // Security headers
app.use(securityLogger); // Log suspicious activities
app.use(requestSizeLimiter('10mb')); // Limit request size

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:3004',
      'https://www.nexa.mk',
      'https://nexa.mk',
      'https://nexa-v1.vercel.app',
      'https://nexa-v1-git-main-martinboshkoskis-projects.vercel.app'
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-XSRF-Token']
}));

// Rate Limiting
app.use('/api/', generalRateLimit); // General API rate limiting
app.use('/api/auth/', authRateLimit); // Stricter rate limiting for auth

// Body parsing with security
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // For CSRF token cookies

// Input sanitization
app.use(sanitizeRequest); // Sanitize all incoming requests

// Mount auto-documents routes BEFORE CSRF middleware (no CSRF for JWT-protected API)
app.use('/api/auto-documents', require('./routes/autoDocuments'));

// Mount LHC (Legal Health Check) routes (JWT-protected API)
app.use('/api/lhc', require('./routes/lhc'));

// Mount provider response routes BEFORE CSRF middleware (public API with token security)
app.use('/api/provider-response', require('./routes/providerResponse'));

// Mount public blog routes BEFORE CSRF middleware (public API for SEO)
app.use('/api/blog', require('./routes/blog'));

// CSRF Protection setup (conditional)
if (settings.isMiddlewareEnabled('csrf') && setCSRFToken) {
  app.use(setCSRFToken); // Set CSRF tokens for all requests
}

app.use(passport.initialize());

// API Routes will be registered after passport strategies are configured
// See registerRoutes() function below

// Create uploads directories if they don't exist
async function createUploadDirs() {
  const dirs = [
    'public/uploads',
    'public/uploads/investments',
    'public/uploads/verification'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Simple health check endpoint (no DB required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to check CORS configuration
app.get('/api/debug/cors', (req, res) => {
  res.status(200).json({
    corsOrigins: corsOrigins,
    envCorsOrigins: process.env.CORS_ORIGINS || 'NOT SET',
    origin: req.headers.origin || 'NO ORIGIN HEADER'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Nexa Terminal API',
    status: 'Running',
    version: '1.0.0'
  });
});

// MongoDB Connection
let db;

// Database index cleanup function to fix authentication issues
async function fixDatabaseIndexes(database) {
  try {
    const collection = database.collection('users');
    
    // Step 1: Drop problematic indexes (keep only _id)
    const indexes = await collection.indexes();
    const indexesToDrop = indexes.filter(index => 
      index.name !== '_id_' && 
      (index.name.includes('email') || index.name.includes('username'))
    );
    
    for (const index of indexesToDrop) {
      try {
        await collection.dropIndex(index.name);
      } catch (error) {
        // Could not drop index
      }
    }
    
    // Step 2: DISABLED - Remove duplicate documents (this was deleting users)
    console.log('⚠️ Duplicate cleanup DISABLED to prevent user deletion');
    
    // COMMENTED OUT: Remove duplicate usernames (keep first)
    /*
    const duplicateUsernames = await collection.aggregate([
      { $group: { _id: "$username", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    for (const duplicate of duplicateUsernames) {
      const idsToRemove = duplicate.ids.slice(1);
      await collection.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`✅ Removed ${idsToRemove.length} duplicate username(s): ${duplicate._id}`);
    }
    
    // Remove duplicate emails (keep first)
    const duplicateEmails = await collection.aggregate([
      { $match: { email: { $ne: null, $ne: "" } } },
      { $group: { _id: "$email", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    for (const duplicate of duplicateEmails) {
      const idsToRemove = duplicate.ids.slice(1);
      await collection.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`✅ Removed ${idsToRemove.length} duplicate email(s): ${duplicate._id}`);
    }
    */
    
    // Step 3: Create proper sparse unique indexes
    try {
      await collection.createIndex(
        { email: 1 }, 
        { unique: true, sparse: true, name: 'email_unique_sparse' }
      );
    } catch (error) {
      // Email index creation failed
    }
    
    try {
      await collection.createIndex(
        { username: 1 }, 
        { unique: true, sparse: true, name: 'username_unique_sparse' }
      );
    } catch (error) {
      // Username index creation failed
    }
    
  } catch (error) {
    console.error('❌ Database index fix failed:', error.message);
    // Don't exit - continue with normal startup
  }
}

// Service initialization function
async function initializeServices(database) {
  try {
    // Import and initialize services
    const UserService = require('./services/userService');
    const SocialPostService = require('./services/socialPostService');
    const InvestmentService = require('./services/investmentService');
    const UserAnalyticsService = require('./services/userAnalyticsService');
    const activityLogger = require('./middleware/activityLogger');

    const userService = new UserService(database);
    new SocialPostService(database);
    new InvestmentService(database);
    new UserAnalyticsService(database);

    // Make userService available globally
    app.locals.userService = userService;

    // Initialize marketplace database if feature is enabled
    if (settings.isFeatureEnabled('marketplace')) {
      console.log('🏪 Initializing marketplace database...');
      const { initializeMarketplaceDatabase } = require('./config/marketplaceIndexes');
      await initializeMarketplaceDatabase(database);
    }

    // Initialize AI Chatbot service if feature is enabled
    if (settings.isFeatureEnabled('aiChatbot')) {
      console.log('🤖 Initializing AI Chatbot service...');

      // Initialize chatbot database (collections and indexes)
      const { initializeChatbotDatabase } = require('./config/chatbotIndexes');
      await initializeChatbotDatabase(database);

      // Initialize ChatBotService
      const chatBotService = require('./chatbot/ChatBotService');
      await chatBotService.setDatabase(database);

      // Initialize ConversationService
      const ConversationService = require('./chatbot/services/ConversationService');
      const conversationService = new ConversationService(database);

      // Connect conversation service to chatbot service
      chatBotService.setConversationService(conversationService);

      // Make conversation service available to routes via app.locals
      app.locals.conversationService = conversationService;

      console.log('✅ AI Chatbot with conversation history initialized');
    }

    // Initialize Credit System
    console.log('💳 Initializing Credit System...');
    const CreditService = require('./services/creditService');
    const ReferralService = require('./services/referralService');
    const CreditScheduler = require('./services/creditScheduler');
    const emailService = require('./services/emailService');

    // Create credit service instance
    const creditService = new CreditService(database, userService);
    app.locals.creditService = creditService;

    // Create referral service instance
    const referralService = new ReferralService(database, userService, creditService);
    app.locals.referralService = referralService;

    // Create and start credit scheduler
    const creditScheduler = new CreditScheduler(creditService, referralService, emailService);
    app.locals.creditScheduler = creditScheduler;

    // Check for missed resets on startup
    await creditService.checkAndPerformMissedResets();

    // Start scheduler (if enabled)
    creditScheduler.startAll();

    console.log('✅ Credit System initialized successfully');

    // Initialize activity logger
    activityLogger.initialize(database);
    app.locals.activityLogger = activityLogger;

  } catch (error) {
    console.error('Error initializing services:', error);
    // Don't exit, just log the error as services might still work
  }
}

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
    // Debug log (hide password for security)
    const safeUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    app.locals.db = db;
    
    // Fix database indexes FIRST to resolve authentication issues
    await fixDatabaseIndexes(db);
    
    // Initialize all services and create indexes
    await initializeServices(db);
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // In development with nodemon, don't exit immediately - allow for fixes
    if (process.env.NODE_ENV === 'development' && process.env.npm_lifecycle_event === 'dev') {
      console.log('💡 Development mode: Server will wait for file changes instead of exiting');
      console.log('💡 Fix the MongoDB connection issue and save a file to restart');
      return null; // Return null instead of exiting
    } else {
      process.exit(1);
    }
  }
}

// API Routes (registered after passport config)
function registerRoutes() {
  // Social Media Preview Middleware - MUST be first to intercept crawler requests
  const { socialPreviewMiddleware } = require('./middleware/socialPreview');
  app.use(socialPreviewMiddleware(app.locals.db));

  // CSRF token endpoint (only if CSRF is enabled)
  if (settings.isMiddlewareEnabled('csrf') && getCSRFToken) {
    app.get('/api/csrf-token', getCSRFToken);
  }
  
  // Apply CSRF protection to all routes except exempted ones
  const csrfExemptRoutes = [
    '/csrf-token',              // CSRF token endpoint
    '/auth/register',           // User registration
    '/auth/login',              // Email/password login
    '/auth/login-username',     // Username/password login
    '/auth/direct-login',       // Direct login for testing
    '/auth/validate',           // Token validation
    '/auth/create-admin',       // Admin creation
    '/auth/logout',             // User logout
    /^\/contact\/public$/,      // Allow public contact form
    /^\/uploads\//,             // Static file uploads
    '/users/company',           // Exempt company profile update
    '/users/profile',           // Exempt user profile update (mark complete)
    '/social/posts',            // Social media posts
    '/social/newsfeed',         // Social media newsfeed
    /^\/social\/posts\/[^\/]+\/like$/,      // Like/unlike posts
    /^\/social\/posts\/[^\/]+\/comments$/,    // Comment on posts
    /^\/social\/posts\/[^\/]+$/,             // Individual post operations
    '/blogs',                   // Blog posts (JWT protected)
    '/verification',            // Company verification (JWT protected)
    '/verification/status',     // Verification status (JWT protected)
    '/verification/upload',     // Document upload (JWT protected)
    '/verification/send-verification-email', // Send verification email (JWT protected)
    '/verification/resend-verification',    // Resend verification email (JWT protected)
    /^\/verification\/[^\/]+\/approve$/,    // Admin approve verification (JWT protected)
    /^\/verification\/[^\/]+\/reject$/,     // Admin reject verification (JWT protected)
    '/verification/pending',               // Get pending verifications (JWT protected)
    '/marketplace',                        // Marketplace endpoints (JWT protected)
    /^\/marketplace\/.*$/,                 // All marketplace sub-routes (JWT protected)
    /^\/courses\/.*$/,                     // All course routes (JWT protected)
    /^\/certificates\/.*$/,                // All certificate routes (JWT protected)
    '/chatbot',                            // AI Chatbot endpoints (JWT protected)
    /^\/chatbot\/.*$/,                     // All chatbot sub-routes (JWT protected)
    '/credits',                            // Credit system endpoints (JWT protected)
    /^\/credits\/.*$/,                     // All credit sub-routes (JWT protected)
    '/referrals',                          // Referral system endpoints (JWT protected)
    /^\/referrals\/.*$/,                   // All referral sub-routes (JWT protected)
  ];
  
  // Apply CSRF exemptions only if CSRF is enabled
  if (settings.isMiddlewareEnabled('csrf') && exemptCSRF) {
    app.use('/api/', exemptCSRF(csrfExemptRoutes));
  }
  
  // Core authentication routes (always enabled)
  if (settings.isRouteEnabled('auth')) {
    app.use('/api/auth', require('./routes/auth'));
  }
  
  if (settings.isRouteEnabled('profile')) {
    app.use('/api/users', require('./routes/users'));
  }
  
  // Document automation routes (current focus)
  if (settings.isRouteEnabled('documents')) {
    app.use('/api/documents', require('./routes/documents'));
  }
  
  // Contact/verification routes
  if (settings.isRouteEnabled('contact')) {
    app.use('/api/contact', require('./routes/contact'));
  }
  
  if (settings.isRouteEnabled('verification')) {
    app.use('/api/verification', require('./routes/verification'));
  }

  // Marketplace routes
  if (settings.isRouteEnabled('marketplace')) {
    try {
      app.use('/api/marketplace', require('./routes/marketplace'));
    } catch (error) {
      console.log('⚠️  Marketplace routes not found - will be created in next phase');
    }

    // Offer Request routes (part of marketplace feature)
    try {
      const { router: offerRequestRouter, initializeController: initOfferRequestController } = require('./routes/offerRequests');
      initOfferRequestController(db);
      app.use('/api/offer-requests', offerRequestRouter);
      console.log('✅ Offer request routes loaded successfully');
    } catch (error) {
      console.log('⚠️  Offer request routes not found - marketplace feature incomplete');
      console.error('Offer request routes error:', error.message);
    }

    // Provider Interest routes (part of marketplace feature)
    try {
      const { router: providerInterestRouter, initializeController: initProviderInterestController } = require('./routes/providerInterest');
      initProviderInterestController(db);
      app.use('/api/provider-interest', providerInterestRouter);
    } catch (error) {
      console.log('⚠️  Provider interest routes not found - marketplace feature incomplete');
    }
  }

  // AI Chatbot routes
  if (settings.isRouteEnabled('chatbot')) {
    try {
      app.use('/api/chatbot', require('./routes/chatbot'));
      console.log('✅ AI Chatbot routes loaded successfully');
    } catch (error) {
      console.log('⚠️  AI Chatbot routes not found - feature not available');
      console.error('Chatbot routes error:', error.message);
    }
  }

  // Credit System routes (always enabled)
  try {
    app.use('/api/credits', require('./routes/credits'));
    app.use('/api/referrals', require('./routes/referrals'));
    console.log('✅ Credit and Referral routes loaded successfully');
  } catch (error) {
    console.error('❌ Credit routes error:', error.message);
  }

  // Conditional feature routes (disabled by default in current settings)
  if (settings.isRouteEnabled('blog')) {
    try {
      app.use('/api/blogs', require('./routes/blogs'));
    } catch (error) {
      // Blog routes file not found - skipping
    }
  }
  
  if (settings.isRouteEnabled('investments')) {
    try {
      app.use('/api/investments', require('./routes/investments'));
    } catch (error) {
      // Investment routes file not found - skipping
    }
  }
  
  if (settings.isRouteEnabled('social')) {
    try {
      app.use('/api/social', require('./routes/social'));
    } catch (error) {
      // Social routes file not found - skipping
    }
  }
  
  if (settings.isRouteEnabled('notifications')) {
    try {
      app.use('/api/notifications', require('./routes/notifications'));
    } catch (error) {
      // Notification routes file not found - skipping
    }
  }
  
  if (settings.isRouteEnabled('analytics')) {
    try {
      app.use('/api/analytics', require('./routes/analytics'));
    } catch (error) {
      // Analytics routes file not found - skipping
    }
  }
  
  // Courses routes (education feature)
  try {
    app.use('/api/courses', require('./routes/courses'));
    console.log('✅ Courses routes loaded successfully');
  } catch (error) {
    console.log('⚠️  Courses routes not found - education feature not available');
    console.error('Courses routes error:', error.message);
  }

  // Certificate routes (education feature)
  try {
    const { router: certificateRouter, initializeController: initCertificateController } = require('./routes/certificates');
    initCertificateController(db);
    app.use('/api/certificates', certificateRouter);
    console.log('✅ Certificate routes loaded successfully');
  } catch (error) {
    console.log('⚠️  Certificate routes not found - certificate feature not available');
    console.error('Certificate routes error:', error.message);
  }

  // Admin routes
  if (settings.isRouteEnabled('admin')) {
    try {
      const { router: adminRouter, initializeOfferRequestController } = require('./routes/admin');

      // Initialize admin offer request controller
      if (initializeOfferRequestController) {
        initializeOfferRequestController(db);
      }

      app.use('/api/admin', adminRouter);

      // Real-time admin routes
      const { router: realtimeAdminRouter } = require('./routes/realtimeAdmin');
      app.use('/api/realtime-admin', realtimeAdminRouter);
    } catch (error) {
      console.error('Admin routes error:', error);
      // Admin routes file not found - skipping
    }
  }
  
  // Error handling for multer file upload errors
  app.use((err, req, res, next) => {
    if (err.name === 'MulterError') {
      return res.status(400).json({
        message: err.message || 'File upload error'
      });
    }
    next(err);
  });

  // General error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
  });
}

// Initialize server function for Vercel serverless
async function initializeServer() {
  // Only initialize if not already done
  if (!app.locals.initialized) {
    await createUploadDirs();
    const database = await connectToDatabase();

    // Only proceed if database connection was successful
    if (database) {
      app.locals.database = database; // Store database connection
      require('./config/passport')(database); // Register passport strategies with db
      registerRoutes();
      app.locals.initialized = true;
    } else {
      console.log('❌ Server initialization failed - no database connection');
      return null;
    }
  }
  return app;
}

// Traditional server environment
async function startServer() {
  try {
    await initializeServer();

    // Only start the server if initialization was successful
    if (app.locals.initialized) {
      const PORT = process.env.PORT || 5002;
      const http = require('http');
      const { Server } = require('socket.io');

      const server = http.createServer(app);
      const io = new Server(server, {
        cors: {
          origin: process.env.CLIENT_URL || "http://localhost:3000",
          methods: ["GET", "POST"]
        }
      });

      // Initialize real-time monitoring
      const UserAnalyticsService = require('./services/userAnalyticsService');
      const RealtimeAdminController = require('./controllers/realtimeAdminController');
      const { setRealtimeController } = require('./routes/realtimeAdmin');

      // Get database connection (available in app.locals)
      const database = app.locals.database;
      if (database) {
        const userAnalyticsService = new UserAnalyticsService(database);
        const realtimeController = new RealtimeAdminController(io, userAnalyticsService);
        setRealtimeController(realtimeController);
      } else {
        console.warn('⚠️ Real-time monitoring disabled - no database connection');
      }

      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} with Socket.io enabled`);
      });
    }
  } catch (error) {
    console.error('❌ Server startup error:', error);
  }
}

startServer();
module.exports = app;