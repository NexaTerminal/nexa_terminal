/**
 * Database Indexes for Offer Requests and Provider Interests
 * Optimized for quality control queries, category filtering, and admin workflows
 */

/**
 * Offer Requests Collection Indexes
 */
const offerRequestIndexes = [
  // Primary queries by admin for request management
  { userId: 1 }, // Find requests by user
  { status: 1, createdAt: -1 }, // Admin dashboard - requests by status, newest first
  { serviceType: 1, status: 1 }, // Category-based filtering with status
  { verifiedBy: 1, verifiedAt: -1 }, // Admin activity tracking

  // Quality control and spam detection
  { 'qualityIndicators.spamScore': -1 }, // High spam score first for review
  { 'qualityIndicators.qualityScore': 1 }, // Low quality score first for review
  { 'qualityIndicators.duplicateCheck': 1, createdAt: -1 }, // Potential duplicates

  // Provider notification and matching
  { serviceType: 1, status: 1, createdAt: -1 }, // Active requests by category
  { sentTo: 1, status: 1 }, // Track which providers received requests

  // Performance and analytics
  { createdAt: -1 }, // Recent requests first
  { isResolved: 1, connectionsMade: -1 }, // Success tracking
  { interestCount: -1, createdAt: -1 }, // Most interested requests

  // Compound indexes for complex queries
  { status: 1, serviceType: 1, createdAt: -1 }, // Admin filtering by status and category
  { userId: 1, status: 1, createdAt: -1 }, // User's request history
  { verifiedBy: 1, status: 1, verifiedAt: -1 }, // Admin performance tracking

  // Text search index for descriptions
  { projectDescription: 'text', serviceType: 'text' } // Full-text search capability
];

/**
 * Provider Interest Collection Indexes
 */
const providerInterestIndexes = [
  // Primary relationship queries
  { requestId: 1 }, // Find interests for a specific request
  { providerId: 1, createdAt: -1 }, // Provider's interest history
  { interestToken: 1 }, // Unique token lookup for interest expression

  // Admin management queries
  { status: 1, createdAt: -1 }, // Interest management by status
  { requestId: 1, status: 1 }, // Request-specific interest tracking
  { providerId: 1, status: 1 }, // Provider performance tracking

  // Quality and response tracking
  { 'responseQuality.completeness': -1 }, // Best responses first
  { viewedByClient: 1, createdAt: -1 }, // Client engagement tracking
  { clientResponseDate: -1 }, // Recent client responses

  // Token management and security
  { interestToken: 1, tokenExpiry: 1 }, // Token validation with expiry
  { tokenExpiry: 1 }, // Cleanup expired tokens

  // Analytics and performance
  { createdAt: -1 }, // Recent interests first
  { updatedAt: -1 }, // Recently updated interests

  // Compound indexes for complex admin queries
  { requestId: 1, status: 1, createdAt: -1 }, // Request interest management
  { providerId: 1, availability: 1, budgetAlignment: 1 }, // Provider capability matching
  { status: 1, viewedByClient: 1, createdAt: -1 } // Client engagement analysis
];

/**
 * Enhanced Service Providers Collection Indexes
 * (updating existing indexes for dynamic category queries)
 */
const enhancedServiceProviderIndexes = [
  // Existing indexes (keep these)
  { userId: 1 }, // User relationship
  { email: 1 }, // Unique email lookup
  { serviceCategory: 1, isActive: 1 }, // **CRITICAL** Dynamic category filtering
  { isActive: 1, createdAt: -1 }, // Active providers
  { 'location.city': 1, serviceCategory: 1 }, // Location-based matching

  // New indexes for enhanced functionality
  { serviceCategory: 1, isActive: 1, viewCount: -1 }, // Popular providers by category
  { isActive: 1, serviceCategory: 1, updatedAt: -1 }, // Recently updated active providers
  { serviceCategory: 1, isActive: 1, contactCount: -1 }, // Most contacted providers

  // Text search for provider names and descriptions
  { name: 'text', description: 'text', specializations: 'text' },

  // Performance tracking
  { viewCount: -1, serviceCategory: 1 }, // Most viewed in category
  { contactCount: -1, serviceCategory: 1 } // Most contacted in category
];

/**
 * Function to create indexes in database
 */
async function createIndexes(db) {
  try {
    console.log('Creating offer request indexes...');

    // Create offer_requests collection indexes
    const offerRequestsCollection = db.collection('offer_requests');
    for (const index of offerRequestIndexes) {
      await offerRequestsCollection.createIndex(index);
    }

    // Create provider_interests collection indexes
    const providerInterestsCollection = db.collection('provider_interests');
    for (const index of providerInterestIndexes) {
      await providerInterestsCollection.createIndex(index);
    }

    // Update service_providers collection indexes
    const serviceProvidersCollection = db.collection('service_providers');

    // Drop existing indexes that might conflict (except _id)
    const existingIndexes = await serviceProvidersCollection.indexes();
    for (const index of existingIndexes) {
      if (index.name !== '_id_') {
        try {
          await serviceProvidersCollection.dropIndex(index.name);
        } catch (err) {
          // Index might not exist, continue
          console.log(`Could not drop index ${index.name}:`, err.message);
        }
      }
    }

    // Create enhanced service provider indexes
    for (const index of enhancedServiceProviderIndexes) {
      await serviceProvidersCollection.createIndex(index);
    }

    console.log('All marketplace indexes created successfully');
    return { success: true };

  } catch (error) {
    console.error('Error creating marketplace indexes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Function to get index information
 */
function getIndexInfo() {
  return {
    offerRequests: {
      collectionName: 'offer_requests',
      indexCount: offerRequestIndexes.length,
      keyIndexes: [
        'status + createdAt (admin dashboard)',
        'serviceType + status (category filtering)',
        'qualityIndicators.spamScore (spam detection)',
        'interestToken (unique token lookup)'
      ]
    },
    providerInterests: {
      collectionName: 'provider_interests',
      indexCount: providerInterestIndexes.length,
      keyIndexes: [
        'requestId (relationship lookup)',
        'providerId + createdAt (provider history)',
        'interestToken (token validation)',
        'status + createdAt (admin management)'
      ]
    },
    serviceProviders: {
      collectionName: 'service_providers',
      indexCount: enhancedServiceProviderIndexes.length,
      keyIndexes: [
        'serviceCategory + isActive (**CRITICAL** for dynamic categories)',
        'isActive + serviceCategory + viewCount (popular providers)',
        'name + description text search'
      ]
    }
  };
}

/**
 * Query optimization helpers
 */
const queryOptimizers = {
  /**
   * Optimized query for active providers by category
   */
  getActiveProvidersByCategory: {
    filter: { serviceCategory: '$category', isActive: true },
    sort: { viewCount: -1, updatedAt: -1 },
    hint: { serviceCategory: 1, isActive: 1, viewCount: -1 }
  },

  /**
   * Optimized query for admin request dashboard
   */
  getRequestsForAdmin: {
    filter: { status: '$status' },
    sort: { createdAt: -1 },
    hint: { status: 1, createdAt: -1 }
  },

  /**
   * Optimized query for quality control
   */
  getLowQualityRequests: {
    filter: {
      $or: [
        { 'qualityIndicators.spamScore': { $gt: 30 } },
        { 'qualityIndicators.qualityScore': { $lt: 50 } }
      ],
      status: 'неверифицирано'
    },
    sort: { 'qualityIndicators.spamScore': -1, createdAt: -1 },
    hint: { 'qualityIndicators.spamScore': -1 }
  },

  /**
   * Optimized query for provider interests by request
   */
  getInterestsByRequest: {
    filter: { requestId: '$requestId' },
    sort: { 'responseQuality.completeness': -1, createdAt: -1 },
    hint: { requestId: 1, createdAt: -1 }
  }
};

module.exports = {
  offerRequestIndexes,
  providerInterestIndexes,
  enhancedServiceProviderIndexes,
  createIndexes,
  getIndexInfo,
  queryOptimizers
};