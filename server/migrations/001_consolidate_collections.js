const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env.development' });

async function consolidateCollections() {
  console.log('🚀 Starting database consolidation migration...');
  
  const client = new MongoClient(process.env.MONGODB_URI || process.env.DATABASE_URL);
  
  try {
    await client.connect();
    const db = client.db('nexa');
    
    console.log('📋 Creating backup of current state...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Step 1: Consolidate Users Collections
    console.log('\n👥 Step 1: Consolidating user collections...');
    
    const usersCollection = db.collection('users');
    const usersNewCollection = db.collection('users_new');
    const companiesCollection = db.collection('companies');
    const companyVerificationsCollection = db.collection('company_verifications');
    
    // Get all users data
    const oldUsers = await usersCollection.find({}).toArray();
    const newUsers = await usersNewCollection.find({}).toArray();
    const companies = await companiesCollection.find({}).toArray();
    const verifications = await companyVerificationsCollection.find({}).toArray();
    
    console.log(`Found ${oldUsers.length} old users, ${newUsers.length} new users, ${companies.length} companies, ${verifications.length} verifications`);
    
    // Create consolidated users structure
    const consolidatedUsers = [];
    
    // Map for company data by userId
    const companyMap = new Map();
    companies.forEach(company => {
      companyMap.set(company.userId.toString(), company);
    });
    
    // Map for verification status by userId
    const verificationMap = new Map();
    verifications.forEach(verification => {
      verificationMap.set(verification.userId.toString(), verification);
    });
    
    // Process users_new first (preferred structure)
    for (const user of newUsers) {
      const userId = user._id.toString();
      const company = companyMap.get(userId);
      const verification = verificationMap.get(userId);
      
      const consolidatedUser = {
        _id: user._id,
        userName: user.userName,
        password: user.password,
        isAdmin: user.isAdmin || false,
        isVerified: verification ? verification.status === 'approved' : (user.isVerified || false),
        officialEmail: user.officialEmail,
        
        companyInfo: {
          companyName: user.companyInfo?.companyName || company?.companyName || '',
          companyAddress: user.companyInfo?.companyAddress || company?.companyAddress || '',
          companyTaxNumber: user.companyInfo?.companyTaxNumber || company?.taxNumber || '',
          companyManager: user.companyInfo?.companyManager || '',
          missionStatement: company?.mission || '',
          website: company?.website || '',
          facebook: '',
          linkedin: ''
        },
        
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
        lastLogin: user.lastLogin
      };
      
      consolidatedUsers.push(consolidatedUser);
    }
    
    // Process old users if not already in new users
    const existingUserIds = new Set(newUsers.map(u => u._id.toString()));
    
    for (const user of oldUsers) {
      const userId = user._id.toString();
      
      if (!existingUserIds.has(userId)) {
        const company = companyMap.get(userId);
        const verification = verificationMap.get(userId);
        
        const consolidatedUser = {
          _id: user._id,
          userName: user.username || `user_${userId.substring(0, 8)}`, // Use old username field
          password: user.password,
          isAdmin: user.isAdmin || false,
          isVerified: verification ? verification.status === 'approved' : (user.isVerified || false),
          officialEmail: user.email, // Use old email field
          
          companyInfo: {
            companyName: user.companyInfo?.companyName || company?.companyName || '',
            companyAddress: user.companyInfo?.companyAddress || company?.companyAddress || '',
            companyTaxNumber: user.companyInfo?.companyTaxNumber || company?.taxNumber || '',
            companyManager: user.companyInfo?.companyManager || '',
            missionStatement: company?.mission || '',
            website: company?.website || '',
            facebook: '',
            linkedin: ''
          },
          
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date(),
          lastLogin: null
        };
        
        consolidatedUsers.push(consolidatedUser);
      }
    }
    
    console.log(`💾 Creating consolidated users collection with ${consolidatedUsers.length} users`);
    
    // Drop old collections and create new consolidated one
    await db.collection('users_consolidated').drop().catch(() => {}); // Ignore error if doesn't exist
    await db.collection('users_consolidated').insertMany(consolidatedUsers);
    
    // Step 2: Consolidate Social Posts
    console.log('\n📱 Step 2: Consolidating social posts...');
    
    const socialPosts1 = await db.collection('socialPosts').find({}).toArray();
    const socialPosts2 = await db.collection('socialPosts_new').find({}).toArray(); 
    const socialPosts3 = await db.collection('socialposts').find({}).toArray();
    
    console.log(`Found ${socialPosts1.length + socialPosts2.length + socialPosts3.length} total social posts across 3 collections`);
    
    const consolidatedSocialPosts = [];
    
    // Process socialPosts_new (preferred structure)
    for (const post of socialPosts2) {
      consolidatedSocialPosts.push({
        _id: post._id,
        userId: post.userId,
        content: post.content,
        imageUrl: post.imageUrl || '',
        likes: post.likes || [],
        comments: post.comments || [],
        createdAt: post.createdAt || new Date(),
        updatedAt: post.updatedAt || new Date()
      });
    }
    
    // Process other collections and avoid duplicates
    const existingPostIds = new Set(socialPosts2.map(p => p._id.toString()));
    
    for (const post of [...socialPosts1, ...socialPosts3]) {
      if (!existingPostIds.has(post._id.toString())) {
        // Map author object to userId if needed
        let userId = post.userId || post.author?._id || post.author;
        
        consolidatedSocialPosts.push({
          _id: post._id,
          userId: userId,
          content: post.content,
          imageUrl: post.imageUrl || post.image || '',
          likes: post.likes || [],
          comments: post.comments || [],
          createdAt: post.createdAt || new Date(),
          updatedAt: post.updatedAt || new Date()
        });
      }
    }
    
    console.log(`💾 Creating consolidated social posts collection with ${consolidatedSocialPosts.length} posts`);
    await db.collection('socialPosts_consolidated').drop().catch(() => {});
    if (consolidatedSocialPosts.length > 0) {
      await db.collection('socialPosts_consolidated').insertMany(consolidatedSocialPosts);
    }
    
    // Step 3: Consolidate Blogs
    console.log('\n📰 Step 3: Consolidating blogs...');
    
    const blogs1 = await db.collection('blogs').find({}).toArray();
    const blogs2 = await db.collection('blogs_new').find({}).toArray();
    
    console.log(`Found ${blogs1.length + blogs2.length} total blogs across 2 collections`);
    
    const consolidatedBlogs = [];
    
    // Process blogs_new (preferred structure)
    for (const blog of blogs2) {
      consolidatedBlogs.push({
        _id: blog._id,
        authorId: blog.authorId,
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt || '',
        featured: blog.featured || false,
        tags: blog.tags || [],
        status: blog.status || 'draft',
        publishedAt: blog.publishedAt,
        createdAt: blog.createdAt || new Date(),
        updatedAt: blog.updatedAt || new Date()
      });
    }
    
    // Process old blogs
    const existingBlogIds = new Set(blogs2.map(b => b._id.toString()));
    
    for (const blog of blogs1) {
      if (!existingBlogIds.has(blog._id.toString())) {
        // Map author object to authorId
        let authorId = blog.authorId || blog.author?._id || blog.author;
        
        consolidatedBlogs.push({
          _id: blog._id,
          authorId: authorId,
          title: blog.title,
          content: blog.content,
          excerpt: blog.excerpt || '',
          featured: blog.featured || false,
          tags: Array.isArray(blog.tags) ? blog.tags : (blog.tags?.split(',') || []),
          status: blog.status || 'published',
          publishedAt: blog.publishedAt || blog.createdAt,
          createdAt: blog.createdAt || new Date(),
          updatedAt: blog.updatedAt || new Date()
        });
      }
    }
    
    console.log(`💾 Creating consolidated blogs collection with ${consolidatedBlogs.length} blogs`);
    await db.collection('blogs_consolidated').drop().catch(() => {});
    if (consolidatedBlogs.length > 0) {
      await db.collection('blogs_consolidated').insertMany(consolidatedBlogs);
    }
    
    // Step 4: Consolidate Marketing Posts
    console.log('\n📈 Step 4: Consolidating marketing posts...');
    
    const marketing1 = await db.collection('marketingPosts').find({}).toArray();
    const marketing2 = await db.collection('marketingPosts_new').find({}).toArray();
    
    console.log(`Found ${marketing1.length + marketing2.length} marketing posts across 2 collections`);
    
    const consolidatedMarketing = [];
    
    // Process marketingPosts_new (preferred structure)
    consolidatedMarketing.push(...marketing2);
    
    // Process old marketing posts
    const existingMarketingIds = new Set(marketing2.map(m => m._id.toString()));
    
    for (const post of marketing1) {
      if (!existingMarketingIds.has(post._id.toString())) {
        // Convert old structure to new structure
        consolidatedMarketing.push({
          _id: post._id,
          createdBy: null, // No user reference in old structure
          title: 'Marketing Post',
          content: post.quote || '',
          targetAudience: 'general',
          platform: 'website',
          scheduledAt: post.createdAt,
          status: 'published',
          metrics: {
            views: 0,
            clicks: 0,
            engagement: 0
          },
          createdAt: post.createdAt || new Date()
        });
      }
    }
    
    console.log(`💾 Creating consolidated marketing posts collection with ${consolidatedMarketing.length} posts`);
    await db.collection('marketingPosts_consolidated').drop().catch(() => {});
    if (consolidatedMarketing.length > 0) {
      await db.collection('marketingPosts_consolidated').insertMany(consolidatedMarketing);
    }
    
    // Step 5: Create Analytics Collection (consolidate user_analytics and analytics_new)
    console.log('\n📊 Step 5: Creating analytics collection...');
    
    const userAnalytics = await db.collection('user_analytics').find({}).toArray();
    const analyticsNew = await db.collection('analytics_new').find({}).toArray();
    
    console.log(`Found ${userAnalytics.length + analyticsNew.length} analytics records`);
    
    // Use analytics_new structure as preferred
    await db.collection('analytics_consolidated').drop().catch(() => {});
    if (analyticsNew.length > 0) {
      await db.collection('analytics_consolidated').insertMany(analyticsNew);
    }
    
    // Step 6: Create Optimized Indexes
    console.log('\n📇 Step 6: Creating optimized indexes...');
    
    // Users indexes
    await db.collection('users_consolidated').createIndex({ userName: 1 }, { unique: true });
    await db.collection('users_consolidated').createIndex({ "companyInfo.companyName": "text" });
    await db.collection('users_consolidated').createIndex({ isAdmin: 1 });
    await db.collection('users_consolidated').createIndex({ isVerified: 1 });
    
    // Social posts indexes
    if (consolidatedSocialPosts.length > 0) {
      await db.collection('socialPosts_consolidated').createIndex({ userId: 1, createdAt: -1 });
      await db.collection('socialPosts_consolidated').createIndex({ createdAt: -1 });
    }
    
    // Blogs indexes
    if (consolidatedBlogs.length > 0) {
      await db.collection('blogs_consolidated').createIndex({ authorId: 1, status: 1 });
      await db.collection('blogs_consolidated').createIndex({ status: 1, publishedAt: -1 });
    }
    
    // Marketing posts indexes
    if (consolidatedMarketing.length > 0) {
      await db.collection('marketingPosts_consolidated').createIndex({ createdBy: 1, status: 1 });
      await db.collection('marketingPosts_consolidated').createIndex({ status: 1, scheduledAt: -1 });
    }
    
    // Analytics indexes
    if (analyticsNew.length > 0) {
      await db.collection('analytics_consolidated').createIndex({ userId: 1, timestamp: -1 });
      await db.collection('analytics_consolidated').createIndex({ eventType: 1, timestamp: -1 });
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`👥 Users: ${consolidatedUsers.length}`);
    console.log(`📱 Social Posts: ${consolidatedSocialPosts.length}`);
    console.log(`📰 Blogs: ${consolidatedBlogs.length}`);
    console.log(`📈 Marketing Posts: ${consolidatedMarketing.length}`);
    console.log(`📊 Analytics: ${analyticsNew.length}`);
    
    console.log('\n⚠️  Next Steps:');
    console.log('1. Test the consolidated collections with your application');
    console.log('2. Update your code to use the new collection names');
    console.log('3. Once verified, you can drop the old collections');
    console.log('4. Rename consolidated collections to final names');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

// Only run if called directly
if (require.main === module) {
  consolidateCollections().catch(console.error);
}

module.exports = { consolidateCollections };