# Database Migration Plan - Nexa Terminal

## **Migration Overview**
Convert 14 complex collections to 5 simplified collections

## **Target Collections Structure**

### **1. users (Consolidated)**
```javascript
{
  _id: ObjectId,
  userName: String, // simplified from 'username'
  password: String, // hashed
  isAdmin: Boolean,
  isVerified: Boolean, // consolidated from verificationStatus
  officialEmail: String, // for verification
  
  companyInfo: {
    companyName: String,
    companyAddress: String, // from address
    companyTaxNumber: String, // from taxNumber
    companyManager: String, // manager name
    missionStatement: String, // from mission
    website: String,
    facebook: String, // new
    linkedin: String // new
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### **2. socialPosts (Cleaned)**
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: users
  content: String,
  imageUrl: String,
  likes: [ObjectId], // user IDs
  comments: [{
    userId: ObjectId,
    content: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### **3. blogs (Simplified)**
```javascript
{
  _id: ObjectId,
  authorId: ObjectId, // ref: users  
  title: String,
  content: String,
  excerpt: String,
  featured: Boolean,
  tags: [String],
  status: String, // draft/published
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **4. marketingPosts (Streamlined)**
```javascript
{
  _id: ObjectId,
  createdBy: ObjectId, // ref: users
  title: String,
  content: String,
  targetAudience: String,
  platform: String, // facebook/linkedin/website
  scheduledAt: Date,
  status: String, // draft/scheduled/published
  metrics: {
    views: Number,
    clicks: Number,
    engagement: Number
  },
  createdAt: Date
}
```

### **5. analytics (Pure Analytics Data)**
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: users
  eventType: String, // login/document_generated/post_created
  eventData: Mixed, // flexible event data
  timestamp: Date,
  sessionId: String,
  metadata: {
    userAgent: String,
    ip: String,
    referrer: String
  }
}
```

## **Collections to DELETE:**
- `company_verifications` → Merged into `users.isVerified`
- `companies` → Merged into `users.companyInfo`
- `user_analytics` → Merged into `analytics`
- `activity_logs` → Merged into `analytics` 
- `documents` → Remove (not needed for analytics)
- `contacts` → Remove (can use simple email)
- `investments` → Remove (can use marketingPosts)
- `audit_logs` → Merge into `analytics`
- `admin_notifications` → Remove (use real-time)
- `admin_notification_preferences` → Remove

## **Data Migration Mapping**

### **users Collection Transformation:**
```javascript
// FROM (current complex structure):
{
  username: "user1",
  email: "user@example.com", 
  companyInfo: {
    companyName: "Company Ltd",
    address: "123 Street",
    taxNumber: "123456789",
    // ... 15+ fields
  },
  isVerified: false,
  verificationStatus: "pending"
}

// TO (simplified structure):  
{
  userName: "user1", // normalized
  officialEmail: "user@example.com",
  companyInfo: {
    companyName: "Company Ltd",
    companyAddress: "123 Street", 
    companyTaxNumber: "123456789",
    companyManager: "", // from profile or empty
    missionStatement: "", // from mission field
    website: "",
    facebook: "", // new field
    linkedin: "" // new field
  },
  isVerified: false // simplified boolean
}
```

### **Analytics Consolidation:**
```javascript
// FROM multiple collections:
user_analytics: { userId, logins: 5, posts: 3 }
activity_logs: { userId, action: "login", timestamp }
audit_logs: { adminId, action: "approve_user" }

// TO single analytics collection:
{
  userId: ObjectId,
  eventType: "login", // standardized
  eventData: { sessionDuration: 1800 },
  timestamp: Date,
  metadata: { ip: "1.1.1.1", userAgent: "..." }
}
```

## **Migration Steps**

### **Step 1: Data Backup**
```javascript
// Backup all collections before migration
mongodump --db nexa --out ./backup_$(date +%Y%m%d)
```

### **Step 2: Create Migration Script**
```javascript
// File: migrations/001_simplify_database.js
async function migrateDatabase() {
  // 1. Create new simplified collections
  // 2. Migrate data with transformations
  // 3. Verify data integrity
  // 4. Drop old collections
  // 5. Create optimized indexes
}
```

### **Step 3: Data Transformation Logic**
```javascript
// User data consolidation
for (user in users) {
  const verification = await company_verifications.findOne({userId: user._id});
  const analytics = await user_analytics.findOne({userId: user._id});
  
  const newUser = {
    userName: user.username,
    password: user.password,
    isAdmin: user.isAdmin || false,
    isVerified: verification?.status === 'approved',
    officialEmail: user.email || verification?.email,
    companyInfo: {
      companyName: user.companyInfo?.companyName || '',
      companyAddress: user.companyInfo?.address || '',
      companyTaxNumber: user.companyInfo?.taxNumber || '',
      companyManager: user.companyInfo?.manager || '',
      missionStatement: user.companyInfo?.mission || '',
      website: user.companyInfo?.website || '',
      facebook: '', // new field
      linkedin: '' // new field
    },
    createdAt: user.createdAt,
    updatedAt: new Date(),
    lastLogin: analytics?.lastLogin || user.updatedAt
  };
  
  await newUsersCollection.insertOne(newUser);
}
```

## **Index Strategy**
```javascript
// Optimized indexes for new structure
await db.users.createIndex({ userName: 1 }, { unique: true });
await db.users.createIndex({ "companyInfo.companyName": "text" });
await db.users.createIndex({ isAdmin: 1 });
await db.users.createIndex({ isVerified: 1 });

await db.socialPosts.createIndex({ userId: 1, createdAt: -1 });
await db.blogs.createIndex({ authorId: 1, status: 1 });
await db.marketingPosts.createIndex({ createdBy: 1, status: 1 });
await db.analytics.createIndex({ userId: 1, timestamp: -1 });
await db.analytics.createIndex({ eventType: 1, timestamp: -1 });
```

## **Validation Checklist**
- [ ] All user accounts migrated successfully
- [ ] Company information preserved
- [ ] Verification status correctly mapped
- [ ] Social posts maintain relationships
- [ ] Analytics data consolidated properly
- [ ] No data loss in migration
- [ ] Performance improved with new indexes
- [ ] Authentication still works
- [ ] Admin panel displays correct data

## **Rollback Plan**
```javascript
// If migration fails:
1. Stop application
2. Restore from backup: mongorestore --db nexa ./backup_YYYYMMDD/nexa
3. Restart application with old codebase
4. Investigate issues
5. Fix migration script
6. Retry migration
```