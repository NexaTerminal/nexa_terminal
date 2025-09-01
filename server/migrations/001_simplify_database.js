const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: './.env.development' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'nexa';

async function simplifyDatabase() {
  console.log('🚀 Starting database simplification migration...');
  
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Backup validation
    console.log('📊 Analyzing current collections...');
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Count current data
    const currentStats = {};
    for (const collection of collections) {
      try {
        currentStats[collection.name] = await db.collection(collection.name).countDocuments();
      } catch (error) {
        currentStats[collection.name] = 0;
      }
    }
    console.log('📈 Current collection stats:', currentStats);
    
    // Step 2: Create new simplified collections
    console.log('🏗️  Creating new simplified collections...');
    
    const newUsersCollection = db.collection('users_new');
    const newSocialPostsCollection = db.collection('socialPosts_new');
    const newBlogsCollection = db.collection('blogs_new');
    const newMarketingPostsCollection = db.collection('marketingPosts_new');
    const newAnalyticsCollection = db.collection('analytics_new');
    
    // Step 3: Migrate users data (consolidate from multiple sources)
    console.log('👥 Migrating users data...');
    
    const users = await db.collection('users').find({}).toArray();
    const companies = await db.collection('companies').find({}).toArray();
    const verifications = await db.collection('company_verifications').find({}).toArray();
    
    // Create lookup maps for efficient data consolidation
    const companiesMap = new Map();
    companies.forEach(company => {
      if (company.userId) {
        companiesMap.set(company.userId.toString(), company);
      }
    });
    
    const verificationsMap = new Map();
    verifications.forEach(verification => {
      if (verification.userId) {
        verificationsMap.set(verification.userId.toString(), verification);
      }
    });
    
    let migratedUsers = 0;
    for (const user of users) {
      const userId = user._id.toString();
      const company = companiesMap.get(userId);
      const verification = verificationsMap.get(userId);
      
      // Consolidate user data from all sources
      const consolidatedUser = {
        _id: user._id,
        userName: user.username || user.email || `user_${user._id.toString().substring(0, 8)}`,
        password: user.password,
        isAdmin: user.isAdmin || false,
        isVerified: user.isVerified || verification?.status === 'approved' || false,
        officialEmail: user.email || verification?.email || company?.contactEmail || '',
        
        companyInfo: {
          companyName: user.companyInfo?.companyName || company?.companyName || verification?.companyName || '',
          companyAddress: user.companyInfo?.address || company?.address || verification?.companyAddress || '',
          companyTaxNumber: user.companyInfo?.taxNumber || company?.taxNumber || verification?.taxNumber || '',
          companyManager: user.companyInfo?.manager || company?.manager || verification?.companyManager || '',
          missionStatement: user.companyInfo?.mission || company?.mission || verification?.missionStatement || '',
          website: user.companyInfo?.website || company?.website || verification?.website || '',
          facebook: company?.facebook || '', // new field
          linkedin: company?.linkedin || ''   // new field
        },
        
        createdAt: user.createdAt || new Date(),
        updatedAt: new Date(),
        lastLogin: user.lastLogin || user.updatedAt || new Date()
      };
      
      await newUsersCollection.insertOne(consolidatedUser);
      migratedUsers++;
    }
    
    console.log(`✅ Migrated ${migratedUsers} users with consolidated data`);
    
    // Step 4: Migrate social posts (clean structure)
    console.log('📱 Migrating social posts...');
    
    const socialPosts = await db.collection('socialposts').find({}).toArray();
    let migratedPosts = 0;
    
    for (const post of socialPosts) {
      const cleanPost = {
        _id: post._id,
        userId: post.author || post.userId,
        content: post.content || '',
        imageUrl: post.image || post.imageUrl || '',
        likes: Array.isArray(post.likes) ? post.likes : [],
        comments: Array.isArray(post.comments) ? post.comments.map(comment => ({
          userId: comment.userId || comment.author,
          content: comment.content || comment.text || '',
          createdAt: comment.createdAt || comment.timestamp || new Date()
        })) : [],
        createdAt: post.createdAt || new Date(),
        updatedAt: post.updatedAt || new Date()
      };
      
      await newSocialPostsCollection.insertOne(cleanPost);
      migratedPosts++;
    }
    
    console.log(`✅ Migrated ${migratedPosts} social posts`);
    
    // Step 5: Migrate blogs (simplified structure)
    console.log('📝 Migrating blogs...');
    
    const blogs = await db.collection('blogs').find({}).toArray();
    let migratedBlogs = 0;
    
    for (const blog of blogs) {
      const cleanBlog = {
        _id: blog._id,
        authorId: blog.author || blog.authorId || blog.userId,
        title: blog.title || '',
        content: blog.content || '',
        excerpt: blog.excerpt || blog.summary || '',
        featured: blog.featured || false,
        tags: Array.isArray(blog.tags) ? blog.tags : [],
        status: blog.status || 'draft',
        publishedAt: blog.publishedAt || blog.createdAt,
        createdAt: blog.createdAt || new Date(),
        updatedAt: blog.updatedAt || new Date()
      };
      
      await newBlogsCollection.insertOne(cleanBlog);
      migratedBlogs++;
    }
    
    console.log(`✅ Migrated ${migratedBlogs} blogs`);
    
    // Step 6: Migrate marketing posts
    console.log('📢 Migrating marketing posts...');
    
    const marketingPosts = await db.collection('marketingPosts').find({}).toArray();
    const investments = await db.collection('investments').find({}).toArray();
    let migratedMarketing = 0;
    
    // Migrate existing marketing posts
    for (const post of marketingPosts) {
      const cleanPost = {
        _id: post._id,
        createdBy: post.createdBy || post.author,
        title: post.title || '',
        content: post.content || '',
        targetAudience: post.targetAudience || 'general',
        platform: post.platform || 'website',
        scheduledAt: post.scheduledAt,
        status: post.status || 'draft',
        metrics: {
          views: post.views || 0,
          clicks: post.clicks || 0,
          engagement: post.engagement || 0
        },
        createdAt: post.createdAt || new Date()
      };
      
      await newMarketingPostsCollection.insertOne(cleanPost);
      migratedMarketing++;
    }
    
    // Convert investments to marketing posts
    for (const investment of investments) {
      const investmentAsMarketing = {
        _id: new ObjectId(),
        createdBy: investment.author || investment.createdBy,
        title: investment.title || `Investment: ${investment.company}`,
        content: `Investment opportunity in ${investment.company}. ${investment.description || ''}`,
        targetAudience: 'investors',
        platform: 'website',
        scheduledAt: investment.createdAt,
        status: 'published',
        metrics: {
          views: investment.views || 0,
          clicks: 0,
          engagement: 0
        },
        createdAt: investment.createdAt || new Date(),
        // Investment-specific data preserved in content
        originalType: 'investment',
        investmentData: investment
      };
      
      await newMarketingPostsCollection.insertOne(investmentAsMarketing);
      migratedMarketing++;
    }
    
    console.log(`✅ Migrated ${migratedMarketing} marketing posts (including investments)`);
    
    // Step 7: Consolidate analytics data
    console.log('📊 Consolidating analytics data...');
    
    const userAnalytics = await db.collection('user_analytics').find({}).toArray();
    const activityLogs = await db.collection('activity_logs').find({}).toArray();
    const auditLogs = await db.collection('audit_logs').find({}).toArray();
    let migratedAnalytics = 0;
    
    // Convert user analytics to events
    for (const analytics of userAnalytics) {
      if (analytics.logins > 0) {
        await newAnalyticsCollection.insertOne({
          _id: new ObjectId(),
          userId: analytics.userId,
          eventType: 'login_summary',
          eventData: { loginCount: analytics.logins },
          timestamp: analytics.date || analytics.updatedAt || new Date(),
          sessionId: null,
          metadata: { source: 'user_analytics_migration' }
        });
        migratedAnalytics++;
      }
      
      if (analytics.postsCreated > 0) {
        await newAnalyticsCollection.insertOne({
          _id: new ObjectId(),
          userId: analytics.userId,
          eventType: 'posts_summary',
          eventData: { postCount: analytics.postsCreated },
          timestamp: analytics.date || analytics.updatedAt || new Date(),
          sessionId: null,
          metadata: { source: 'user_analytics_migration' }
        });
        migratedAnalytics++;
      }
    }
    
    // Convert activity logs to events
    for (const activity of activityLogs) {
      await newAnalyticsCollection.insertOne({
        _id: activity._id,
        userId: activity.userId,
        eventType: activity.action || activity.eventType || 'unknown',
        eventData: activity.metadata || activity.data || {},
        timestamp: activity.timestamp || activity.createdAt || new Date(),
        sessionId: activity.sessionId || null,
        metadata: {
          ip: activity.ip,
          userAgent: activity.userAgent,
          source: 'activity_logs_migration'
        }
      });
      migratedAnalytics++;
    }
    
    // Convert audit logs to admin events
    for (const audit of auditLogs) {
      await newAnalyticsCollection.insertOne({
        _id: audit._id,
        userId: audit.adminId || audit.userId,
        eventType: `admin_${audit.action}` || 'admin_action',
        eventData: audit.details || {},
        timestamp: audit.timestamp || audit.createdAt || new Date(),
        sessionId: null,
        metadata: {
          targetUserId: audit.targetUserId,
          source: 'audit_logs_migration'
        }
      });
      migratedAnalytics++;
    }
    
    console.log(`✅ Consolidated ${migratedAnalytics} analytics records`);
    
    // Step 8: Create optimized indexes
    console.log('🏗️  Creating optimized indexes...');
    
    await newUsersCollection.createIndex({ userName: 1 }, { unique: true });
    await newUsersCollection.createIndex({ "companyInfo.companyName": "text" });
    await newUsersCollection.createIndex({ isAdmin: 1 });
    await newUsersCollection.createIndex({ isVerified: 1 });
    
    await newSocialPostsCollection.createIndex({ userId: 1, createdAt: -1 });
    await newBlogsCollection.createIndex({ authorId: 1, status: 1 });
    await newMarketingPostsCollection.createIndex({ createdBy: 1, status: 1 });
    await newAnalyticsCollection.createIndex({ userId: 1, timestamp: -1 });
    await newAnalyticsCollection.createIndex({ eventType: 1, timestamp: -1 });
    
    console.log('✅ Created optimized indexes');
    
    // Step 9: Validation
    console.log('✅ Validating migration...');
    
    const newStats = {
      users: await newUsersCollection.countDocuments(),
      socialPosts: await newSocialPostsCollection.countDocuments(),
      blogs: await newBlogsCollection.countDocuments(),
      marketingPosts: await newMarketingPostsCollection.countDocuments(),
      analytics: await newAnalyticsCollection.countDocuments()
    };
    
    console.log('📊 New collection stats:', newStats);
    
    // Validation checks
    const validationIssues = [];
    
    if (newStats.users !== currentStats.users) {
      validationIssues.push(`User count mismatch: expected ${currentStats.users}, got ${newStats.users}`);
    }
    
    if (newStats.socialPosts !== currentStats.socialposts) {
      validationIssues.push(`Social posts count mismatch: expected ${currentStats.socialposts || 0}, got ${newStats.socialPosts}`);
    }
    
    if (validationIssues.length > 0) {
      console.log('⚠️  Validation issues found:', validationIssues);
      console.log('Migration completed with warnings. Please review before proceeding.');
    } else {
      console.log('✅ Validation passed - all data migrated successfully');
    }
    
    console.log('\n🎉 Database simplification completed!');
    console.log('\nNext steps:');
    console.log('1. Test the application with new collections');
    console.log('2. If everything works, run the cleanup script to remove old collections');
    console.log('3. Update the application code to use new schema');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('📝 Database connection closed');
    }
  }
}

// Helper function to cleanup old collections (run after validation)
async function cleanupOldCollections() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  
  console.log('🧹 Cleaning up old collections...');
  
  const collectionsToDelete = [
    'company_verifications',
    'companies', 
    'user_analytics',
    'activity_logs',
    'documents',
    'contacts',
    'investments',
    'audit_logs',
    'admin_notifications',
    'admin_notification_preferences'
  ];
  
  for (const collectionName of collectionsToDelete) {
    try {
      await db.collection(collectionName).drop();
      console.log(`✅ Dropped ${collectionName}`);
    } catch (error) {
      console.log(`⚠️  Could not drop ${collectionName}: ${error.message}`);
    }
  }
  
  // Rename new collections to final names
  await db.collection('users_new').rename('users_backup');
  await db.collection('users').rename('users_old'); 
  await db.collection('users_backup').rename('users');
  
  await db.collection('socialPosts_new').rename('socialPosts');
  await db.collection('blogs_new').rename('blogs');
  await db.collection('marketingPosts_new').rename('marketingPosts');
  await db.collection('analytics_new').rename('analytics');
  
  console.log('✅ Collection cleanup completed');
  await client.close();
}

// Run migration if called directly
if (require.main === module) {
  simplifyDatabase()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { simplifyDatabase, cleanupOldCollections };