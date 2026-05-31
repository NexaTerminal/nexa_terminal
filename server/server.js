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

// Subscription gate (late-bound): pulls SubscriptionService from app.locals at
// request time, so it can be mounted before the service is initialized. Returns
// HTTP 402 with SUBSCRIPTION_* code when a non-admin's status is not
// trial / active / grace.
const subscriptionGuard = require('./middleware/subscriptionGuard');

// Mount auto-documents routes BEFORE CSRF middleware (no CSRF for JWT-protected API)
app.use('/api/auto-documents', subscriptionGuard, require('./routes/autoDocuments'));

// Mount custom templates routes (JWT-protected API)
app.use('/api/custom-templates', subscriptionGuard, require('./routes/customTemplates'));

// Mount marketing documents routes (JWT-protected API)
app.use('/api/marketing-documents', subscriptionGuard, require('./routes/marketingDocuments'));

// Mount LHC (Legal Health Check) routes (JWT-protected API)
app.use('/api/lhc', subscriptionGuard, require('./routes/lhc'));

// Mount MHC (Marketing Health Check) routes (JWT-protected API)
app.use('/api/mhc', subscriptionGuard, require('./routes/mhc'));

// Mount CHC (Cyber Security Health Check) routes (JWT-protected API)
app.use('/api/chc', subscriptionGuard, require('./routes/chc'));

// Mount HHC (HR & Operational Health Check) routes (JWT-protected API)
app.use('/api/hhc', subscriptionGuard, require('./routes/hhc'));

// Mount provider response routes BEFORE CSRF middleware (public API with token security)
app.use('/api/provider-response', require('./routes/providerResponse'));

// Mount public blog routes BEFORE CSRF middleware (public API for SEO)
app.use('/api/blog', require('./routes/blog'));

// Mount SEO routes BEFORE CSRF middleware (sitemap, robots.txt)
app.use('/api/seo', require('./routes/seo'));

// Mount shared documents routes BEFORE CSRF middleware (public + authenticated API)
// Route registration is deferred until after controller initialization
// See registerRoutes() function for actual mounting

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

    try {
      await collection.createIndex(
        { companyCode: 1 },
        { unique: true, sparse: true, name: 'companyCode_unique_sparse' }
      );
    } catch (error) {
      // companyCode index creation failed
    }

  } catch (error) {
    console.error('❌ Database index fix failed:', error.message);
    // Don't exit - continue with normal startup
  }
}

// Service initialization function
// Each init step is isolated so a failure in one (e.g. Qdrant unreachable
// for the chatbot) does NOT prevent later, unrelated services (credits,
// document gen) from initializing.
async function initializeServices(database) {
  const activityLogger = require('./middleware/activityLogger');

  // --- Core services (synchronous, cannot fail) ---
  const UserService = require('./services/userService');
  const SocialPostService = require('./services/socialPostService');
  const InvestmentService = require('./services/investmentService');
  const UserAnalyticsService = require('./services/userAnalyticsService');

  const userService = new UserService(database);
  new SocialPostService(database);
  new InvestmentService(database);
  new UserAnalyticsService(database);
  app.locals.userService = userService;

  // --- Credit System (initialized FIRST after userService because it
  //     is a core dependency for almost every premium route) ---
  try {
    console.log('💳 Initializing Credit System...');
    const CreditService = require('./services/creditService');
    const ReferralService = require('./services/referralService');
    const CreditScheduler = require('./services/creditScheduler');
    const emailService = require('./services/emailService');

    const creditService = new CreditService(database, userService);
    app.locals.creditService = creditService;

    const referralService = new ReferralService(database, userService, creditService);
    app.locals.referralService = referralService;

    const creditScheduler = new CreditScheduler(creditService, referralService, emailService);
    app.locals.creditScheduler = creditScheduler;

    // Best-effort: catch up any missed resets. Failures here must not
    // unset app.locals.creditService — log and continue.
    creditService.checkAndPerformMissedResets()
      .then(count => count > 0 && console.log(`💳 Backfilled ${count} missed credit resets`))
      .catch(err => console.error('⚠️  checkAndPerformMissedResets failed (continuing):', err.message));

    creditScheduler.startAll();
    console.log('✅ Credit System initialized');
  } catch (error) {
    console.error('❌ Credit System init FAILED:', error.message);
    console.error(error.stack);
  }

  // --- Subscription System (Admin-user plan machinery) ---
  //     Always instantiates the service (so role/status reads work even
  //     when the feature flag is off). Routes + cron only when the flag
  //     `adminUserPlan` is on.
  try {
    const SubscriptionService = require('./services/subscriptionService');
    const subscriptionService = new SubscriptionService(database);
    app.locals.subscriptionService = subscriptionService;
    await subscriptionService.ensureIndexes();

    // ROUTES ALWAYS MOUNT — feature flags only kill the daily cron.
    // (Previously the routes were gated behind flags, which caused 404s when
    // the flags weren't toggled. Killing that footgun.)
    const SubscriptionController = require('./controllers/subscriptionController');
    const SubscriptionScheduler  = require('./services/subscriptionScheduler');
    const subscriptionRoutes     = require('./routes/subscriptions');
    const emailService           = require('./services/emailService');
    const auditLoggingService    = (() => {
      try { return require('./services/auditLoggingService'); } catch { return null; }
    })();

    const subscriptionController = new SubscriptionController({
      subscriptionService, emailService, auditLoggingService
    });

    app.use('/api/subscription',        subscriptionRoutes.userRoutes(subscriptionController));
    app.use('/api/admin/subscriptions', subscriptionRoutes.adminRoutes(subscriptionController));
    console.log('✅ /api/subscription + /api/admin/subscriptions mounted');

    // Invoices (Сметководство) — user reads own, admin (Martin) does CRUD.
    const InvoicesService    = require('./services/invoicesService');
    const InvoicesController = require('./controllers/invoicesController');
    const invoicesRoutes     = require('./routes/invoices');
    const invoicesService    = new InvoicesService(database);
    await invoicesService.ensureIndexes();
    const invoicesController = new InvoicesController({ invoicesService });
    app.use('/api/invoices',       invoicesRoutes.userRoutes(invoicesController));
    app.use('/api/admin/invoices', invoicesRoutes.adminRoutes(invoicesController));
    console.log('✅ /api/invoices + /api/admin/invoices mounted');

    // Leads pipeline — always mount.
    const LeadsService        = require('./services/leadsService');
    const LeadsController     = require('./controllers/leadsController');
    const LeadRoutingService  = require('./services/leadRoutingService');
    const buildLeadRoutes     = require('./routes/leads');

    const leadsService = new LeadsService(database);
    await leadsService.ensureIndexes();
    app.locals.leadsService = leadsService;

    const leadRoutingService = new LeadRoutingService({
      leadsService, usersCollection: database.collection('users'),
      emailService, io: app.locals.io
    });
    app.locals.leadRoutingService = leadRoutingService;

    const leadsController = new LeadsController({
      leadsService, usersCollection: database.collection('users'),
      io: app.locals.io, emailService, leadRoutingService
    });
    app.locals.leadsController = leadsController;

    app.use('/api/leads',            buildLeadRoutes.publicRoutes(leadsController));
    app.use('/api/admin/leads',      buildLeadRoutes.adminRoutes(leadsController));
    app.use('/api/admin-user/leads', buildLeadRoutes.adminUserRoutes(leadsController));
    console.log('✅ /api/leads + /api/admin/leads + /api/admin-user/leads mounted');

    // Sub-seat (team) management — always mount.
    const SubSeatService = require('./services/subSeatService');
    const AdminUserController = require('./controllers/adminUserController');
    const buildAdminUserRoutes = require('./routes/adminUser');

    const subSeatService = new SubSeatService(database);
    const adminUserController = new AdminUserController({
      subSeatService, emailService, auditLoggingService,
      leadsService: app.locals.leadsService || null,
      usersCollection: database.collection('users')
    });
    app.locals.subSeatService = subSeatService;
    app.use('/api/admin-user', buildAdminUserRoutes(adminUserController));
    console.log('✅ /api/admin-user mounted (team + dashboard)');

    // Daily stale-leads cron — only when leadRouting flag is on.
    if (settings.isFeatureEnabled('leadRouting')) {
      try {
        const cron = require('node-cron');
        cron.schedule('15 2 * * *', async () => {
          try {
            const n = await leadRoutingService.markStaleLeads();
            if (n) console.log(`[leadRouting] marked ${n} stale leads`);
          } catch (e) { console.error('[leadRouting] stale-cron failed:', e.message); }
        });
        console.log('⏰ Stale-leads cron started');
      } catch (e) { /* node-cron missing — non-critical */ }
    }

    // Subscription daily cron — only when adminUserPlan flag is on.
    if (settings.isFeatureEnabled('adminUserPlan')) {
      const subscriptionScheduler = new SubscriptionScheduler(subscriptionService, emailService);
      app.locals.subscriptionScheduler = subscriptionScheduler;
      subscriptionScheduler.startAll();
      console.log('⏰ Subscription scheduler started (trial reminders + suspension cron)');
    }

    console.log('✅ Admin-user / subscription / leads endpoints ready');
  } catch (error) {
    console.error('❌ Subscription System init FAILED:', error.message);
    console.error(error.stack);
  }

  // --- Marketplace (optional feature) ---
  if (settings.isFeatureEnabled('marketplace')) {
    try {
      console.log('🏪 Initializing marketplace database...');
      const { initializeMarketplaceDatabase } = require('./config/marketplaceIndexes');
      await initializeMarketplaceDatabase(database);
    } catch (error) {
      console.error('⚠️  Marketplace init failed (continuing):', error.message);
    }
  }

  // --- AI Chatbot (optional feature, can fail if Qdrant/OpenAI down) ---
  if (settings.isFeatureEnabled('aiChatbot')) {
    try {
      console.log('🤖 Initializing AI Chatbot service...');
      const { initializeChatbotDatabase } = require('./config/chatbotIndexes');
      await initializeChatbotDatabase(database);

      const chatBotService = require('./chatbot/ChatBotService');
      await chatBotService.setDatabase(database);

      const ConversationService = require('./chatbot/services/ConversationService');
      const conversationService = new ConversationService(database);
      chatBotService.setConversationService(conversationService);

      app.locals.conversationService = conversationService;
      app.locals.chatBotService = chatBotService;
      console.log('✅ AI Chatbot with conversation history initialized');

      try {
        const marketingBotService = require('./chatbot/MarketingBotService');
        await marketingBotService.setDatabase(database);
        marketingBotService.setConversationService(conversationService);
        app.locals.marketingBotService = marketingBotService;
        console.log('✅ Marketing AI Chatbot initialized');
      } catch (mbErr) {
        console.error('⚠️  Marketing chatbot init failed (continuing):', mbErr.message);
      }
    } catch (error) {
      console.error('⚠️  AI Chatbot init failed (continuing):', error.message);
    }
  }

  // --- Shared Documents ---
  try {
    console.log('📄 Initializing Shared Documents Service...');
    const SharedDocumentsController = require('./controllers/sharedDocumentsController');
    const sharedDocumentsController = new SharedDocumentsController(database);
    await sharedDocumentsController.createIndexes();
    app.locals.sharedDocumentsController = sharedDocumentsController;
    console.log('✅ Shared Documents Service initialized');
  } catch (error) {
    console.error('⚠️  Shared Documents init failed (continuing):', error.message);
  }

  // --- Document Preview ---
  try {
    console.log('👁️  Initializing Document Preview Service...');
    const DocumentPreviewController = require('./controllers/documentPreviewController');
    app.locals.documentPreviewController = new DocumentPreviewController();
    console.log('✅ Document Preview Service initialized');
  } catch (error) {
    console.error('⚠️  Document Preview init failed (continuing):', error.message);
  }

  // --- Activity logger ---
  try {
    activityLogger.initialize(database);
    app.locals.activityLogger = activityLogger;
  } catch (error) {
    console.error('⚠️  Activity logger init failed (continuing):', error.message);
  }

  // --- Final status report ---
  console.log('📋 Service initialization status:');
  console.log('   - userService:', app.locals.userService ? '✅' : '❌');
  console.log('   - creditService:', app.locals.creditService ? '✅' : '❌');
  console.log('   - referralService:', app.locals.referralService ? '✅' : '❌');
  console.log('   - conversationService:', app.locals.conversationService ? '✅' : '❌');
  console.log('   - chatBotService:', app.locals.chatBotService ? '✅' : '❌');
  console.log('   - marketingBotService:', app.locals.marketingBotService ? '✅' : '❌');
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
    /^\/blogs\/[^\/]+\/like$/,  // Like/unlike blog posts (JWT protected)
    /^\/blogs\/[^\/]+\/dislike$/, // Dislike/un-dislike blog posts (JWT protected)
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
    '/contract-analysis',                  // AI Contract Analysis (JWT protected)
    /^\/contract-analysis\/.*$/,           // All contract-analysis sub-routes (JWT protected)
    '/marketing-bot',                      // Marketing AI Chatbot endpoints (JWT protected)
    /^\/marketing-bot\/.*$/,               // All marketing-bot sub-routes (JWT protected)
    '/credits',                            // Credit system endpoints (JWT protected)
    /^\/credits\/.*$/,                     // All credit sub-routes (JWT protected)
    '/referrals',                          // Referral system endpoints (JWT protected)
    /^\/referrals\/.*$/,                   // All referral sub-routes (JWT protected)
    '/shared-documents/create',            // Create shareable link (JWT protected)
    '/shared-documents/my-documents',      // List user's shared documents (JWT protected)
    /^\/shared-documents\/[^\/]+\/revoke$/, // Revoke link (JWT protected)
    /^\/shared-documents\/[^\/]+$/,        // Get shared document metadata (PUBLIC)
    /^\/shared-documents\/[^\/]+\/download$/, // Download shared document (PUBLIC)
    /^\/shared-documents\/[^\/]+\/confirm$/,  // Confirm document (PUBLIC)
    /^\/shared-documents\/[^\/]+\/comment$/,  // Add comment (PUBLIC)
    /^\/document-preview\/[^\/]+$/,           // Generate document preview (PUBLIC)
    // Admin-user plan + subscription + lead pipeline (JWT protected, no CSRF needed)
    '/subscription',
    /^\/subscription\/.*$/,
    '/admin/subscriptions',
    /^\/admin\/subscriptions\/.*$/,
    '/invoices',
    /^\/invoices\/.*$/,
    '/admin/invoices',
    /^\/admin\/invoices\/.*$/,
    '/admin/leads',
    /^\/admin\/leads\/.*$/,
    '/admin-user',
    /^\/admin-user\/.*$/,
    '/leads/inbound',
    '/auth/change-password',
    '/admin/all-users',
    /^\/admin\/all-users\/.*$/,
    // Nexa 3.0 — AI stance preferences
    '/ai/stance',
    /^\/ai\/stance\/.*$/,
    // Nexa 3.0 — Blog submissions (member + admin queue)
    '/blogs/submissions',
    /^\/blogs\/submissions\/.*$/,
    '/admin/blogs/submissions',
    /^\/admin\/blogs\/submissions\/.*$/,
    // Nexa 3.0 — Inquiry Board (manual model)
    '/inquiries',
    /^\/inquiries\/.*$/,
    '/admin/inquiries',
    /^\/admin\/inquiries\/.*$/,
    '/my-claims',
    '/my-engagements',
    // Nexa 3.0 — Topics Q&A authoring (Type C)
    '/topics',
    /^\/topics\/.*$/,
    '/admin/topics',
    /^\/admin\/topics\/.*$/,
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
    // Sub-seat guard runs first — sub_seat users (team members of an admin_user)
    // are blocked from the entire marketplace surface and the offer-request flow.
    // Guard is soft: if no JWT is attached yet, it passes through and the
    // route module's own authenticateJWT does its job.
    const subSeatGuard = (settings.isFeatureEnabled('subSeats'))
      ? require('./middleware/subSeatGuard')
      : (req, _res, next) => next();

    try {
      app.use('/api/marketplace', subSeatGuard, require('./routes/marketplace'));
    } catch (error) {
      console.log('⚠️  Marketplace routes not found - will be created in next phase');
    }

    // Offer Request routes (part of marketplace feature)
    try {
      const { router: offerRequestRouter, initializeController: initOfferRequestController } = require('./routes/offerRequests');
      initOfferRequestController(db);
      app.use('/api/offer-requests', subSeatGuard, offerRequestRouter);
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
      app.use('/api/chatbot', subscriptionGuard, require('./routes/chatbot'));
      console.log('✅ AI Chatbot routes loaded successfully');
    } catch (error) {
      console.log('⚠️  AI Chatbot routes not found - feature not available');
      console.error('Chatbot routes error:', error.message);
    }

    // Marketing AI Chatbot routes
    try {
      app.use('/api/marketing-bot', subscriptionGuard, require('./routes/marketing-bot'));
      console.log('✅ Marketing AI Chatbot routes loaded successfully');
    } catch (error) {
      console.log('⚠️  Marketing AI Chatbot routes not found');
      console.error('Marketing bot routes error:', error.message);
    }
  }

  // AI Contract Analysis routes
  if (settings.isRouteEnabled('contractAnalysis')) {
    try {
      const contractAnalysisService = require('./contractAnalysis/ContractAnalysisService');
      // Use app.locals.db — `database` is not in scope inside registerRoutes()
      contractAnalysisService.setDatabase(app.locals.db);
      app.use('/api/contract-analysis', subscriptionGuard, require('./routes/contractAnalysis'));
      console.log('✅ AI Contract Analysis routes loaded successfully');
    } catch (error) {
      console.log('⚠️  AI Contract Analysis routes not found - feature not available');
      console.error('Contract analysis routes error:', error.message);
    }
  }

  // Nexa 3.0 — AI Stance Preferences (no CSRF, JWT-protected)
  try {
    app.use('/api/ai/stance', require('./routes/stance'));
    console.log('✅ AI Stance Preferences routes loaded successfully');
  } catch (error) {
    console.error('❌ Stance preferences routes error:', error.message);
  }

  // Nexa 3.0 — Blog Submissions (member workflow + admin queue)
  try {
    app.use('/api/blogs/submissions',       require('./routes/blogSubmissions'));
    app.use('/api/admin/blogs/submissions', require('./routes/adminBlogSubmissions'));
    console.log('✅ Blog Submissions routes loaded successfully');
  } catch (error) {
    console.error('❌ Blog submissions routes error:', error.message);
  }

  // Nexa 3.0 — Inquiry Board (manual model — operator-curated, no auto-routing)
  try {
    const mine = require('./routes/inquiriesMine');
    app.use('/api/inquiries',        require('./routes/inquiries'));
    app.use('/api/admin/inquiries',  require('./routes/adminInquiries'));
    app.use('/api/my-claims',        mine.claims);
    app.use('/api/my-engagements',   mine.engagements);
    console.log('✅ Inquiry Board routes loaded successfully');
  } catch (error) {
    console.error('❌ Inquiry Board routes error:', error.message);
  }

  // Nexa 3.0 — Topics Q&A Authoring (Studio-only).
  // Mount the public-page reader FIRST so its sub-path wins over the
  // JWT-protected /api/topics router for /api/topics/pages/:slug.
  try {
    app.use('/api/topics/pages',   require('./routes/topicsPublic'));
    app.use('/api/topics',         require('./routes/topics'));
    app.use('/api/admin/topics',   require('./routes/adminTopics'));
    console.log('✅ Topics Q&A routes loaded successfully');
  } catch (error) {
    console.error('❌ Topics Q&A routes error:', error.message);
  }

  // Credit System routes (always enabled)
  try {
    app.use('/api/credits', require('./routes/credits'));
    app.use('/api/referrals', require('./routes/referrals'));
    console.log('✅ Credit and Referral routes loaded successfully');
  } catch (error) {
    console.error('❌ Credit routes error:', error.message);
  }

  // Shared Documents routes (always enabled)
  try {
    const initializeSharedDocumentsRoutes = require('./routes/sharedDocuments');
    const sharedDocumentsRouter = initializeSharedDocumentsRoutes(app.locals.sharedDocumentsController);
    app.use('/api/shared-documents', sharedDocumentsRouter);
    console.log('✅ Shared Documents routes loaded successfully');
  } catch (error) {
    console.error('❌ Shared Documents routes error:', error.message);
  }

  // Document Preview routes (public - always enabled)
  try {
    const initializeDocumentPreviewRoutes = require('./routes/documentPreview');
    const documentPreviewRouter = initializeDocumentPreviewRoutes(app.locals.documentPreviewController);
    app.use('/api/document-preview', documentPreviewRouter);
    console.log('✅ Document Preview routes loaded successfully');
  } catch (error) {
    console.error('❌ Document Preview routes error:', error.message);
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
      const socialSubSeatGuard = (settings.isFeatureEnabled('subSeats'))
        ? require('./middleware/subSeatGuard')
        : (req, _res, next) => next();
      app.use('/api/social', socialSubSeatGuard, require('./routes/social'));
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
      const { router: adminRouter, initializeOfferRequestController, initializeAdminChatbotController } = require('./routes/admin');

      // Initialize admin offer request controller
      if (initializeOfferRequestController) {
        initializeOfferRequestController(db);
      }

      // Initialize admin chatbot controller (if chatbot feature is enabled)
      console.log('🔍 Checking admin chatbot controller initialization...');
      console.log('   initializeAdminChatbotController exists:', !!initializeAdminChatbotController);
      console.log('   app.locals.chatBotService exists:', !!app.locals.chatBotService);

      if (initializeAdminChatbotController && app.locals.chatBotService) {
        console.log('🤖 Initializing Admin Chatbot Controller...');
        initializeAdminChatbotController(
          db,
          app.locals.chatBotService.qdrantClient,
          app.locals.chatBotService
        );
      } else {
        console.log('⚠️ Skipping admin chatbot controller initialization');
        if (!initializeAdminChatbotController) console.log('   Reason: initializeAdminChatbotController not found');
        if (!app.locals.chatBotService) console.log('   Reason: chatBotService not available');
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
    // Expose io to controllers via app.locals so the leads pipeline can
    // emit "lead:new" / "lead:assigned" to the admin dashboard.
    app.locals.io = io;

    // Start listening immediately so health checks pass during initialization
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT} (initializing services...)`);
    });

    // Run full initialization after server is already listening
    await initializeServer();

    if (app.locals.initialized) {
      // Initialize real-time monitoring (requires database from initializeServer)
      const UserAnalyticsService = require('./services/userAnalyticsService');
      const RealtimeAdminController = require('./controllers/realtimeAdminController');
      const { setRealtimeController } = require('./routes/realtimeAdmin');

      const database = app.locals.database;
      if (database) {
        const userAnalyticsService = new UserAnalyticsService(database);
        const realtimeController = new RealtimeAdminController(io, userAnalyticsService);
        setRealtimeController(realtimeController);
      } else {
        console.warn('⚠️ Real-time monitoring disabled - no database connection');
      }

      console.log(`✅ Server fully initialized on port ${PORT}`);
    }
  } catch (error) {
    console.error('❌ Server startup error:', error);
  }
}

startServer();
module.exports = app;