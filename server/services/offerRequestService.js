/**
 * Offer Request Service - Quality Control and Macedonian Marketplace Management
 * Handles request creation, validation, quality assessment, and admin workflow
 */

const { ObjectId } = require('mongodb');
const { validators, utils, BUDGET_RANGES, TIMELINE_OPTIONS, PROJECT_TYPES } = require('../config/offerRequestSchemas');

class OfferRequestService {
  constructor(database) {
    this.db = database;
    this.offerRequests = database.collection('offer_requests');
    this.users = database.collection('users');
    this.serviceProviders = database.collection('service_providers');
  }

  // ==================== OFFER REQUEST CREATION ====================

  /**
   * Create new offer request with quality validation
   */
  async createOfferRequest(userId, requestData) {
    try {
      // Get user information
      const user = await this.users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new Error('Корисникот не е пронајден');
      }

      if (!user.isVerified) {
        throw new Error('Само верификувани корисници можат да поднесуваат барања');
      }

      // Validate request data
      const validationErrors = validators.validateOfferRequest(requestData);
      if (validationErrors.length > 0) {
        throw new Error(`Валидација неуспешна: ${validationErrors.join(', ')}`);
      }

      // Check for recent duplicate requests
      await this.checkForDuplicates(userId, requestData);

      // Generate quality indicators
      const qualityIndicators = utils.generateQualityIndicators(requestData);

      // Prepare offer request document
      const now = new Date();

      // Defensive check: Ensure preferredLocations is always an array
      let preferredLocations = requestData.preferredLocations || [];
      if (!Array.isArray(preferredLocations)) {
        console.warn(`⚠️ preferredLocations in request data is not an array, converting: ${typeof preferredLocations}`, preferredLocations);
        preferredLocations = preferredLocations ? [preferredLocations] : [];
      }

      const offerRequest = {
        userId: new ObjectId(userId),
        requestCategory: requestData.requestCategory, // Add requestCategory field
        serviceType: requestData.serviceType,
        budgetRange: requestData.budgetRange,
        projectDescription: requestData.projectDescription.trim(),
        projectType: requestData.projectType,
        timeline: requestData.timeline,
        preferredLocations: preferredLocations, // Ensured to be array
        serviceSpecificFields: requestData.serviceSpecificFields || {},
        qualityIndicators,
        status: 'неверифицирано',
        isAnonymous: true,
        createdAt: now,
        updatedAt: now,
        sentTo: [],
        interestCount: 0,
        connectionsMade: 0,
        isResolved: false
      };

      // Insert into database
      const result = await this.offerRequests.insertOne(offerRequest);
      const createdRequest = { ...offerRequest, _id: result.insertedId };

      // Send notification to admin if quality score is acceptable
      if (qualityIndicators.qualityScore > 30) {
        await this.sendAdminNotification(createdRequest, user);
      }

      return createdRequest;

    } catch (error) {
      console.error('Error creating offer request:', error);
      throw error;
    }
  }

  /**
   * Check for duplicate requests from same user
   */
  async checkForDuplicates(userId, requestData) {
    const recentTimeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const duplicateRequest = await this.offerRequests.findOne({
      userId: new ObjectId(userId),
      serviceType: requestData.serviceType,
      projectDescription: requestData.projectDescription,
      createdAt: { $gte: recentTimeLimit },
      status: { $ne: 'одбиено' }
    });

    if (duplicateRequest) {
      // Update quality indicators
      await this.offerRequests.updateOne(
        { _id: duplicateRequest._id },
        {
          $set: {
            'qualityIndicators.duplicateCheck': true,
            updatedAt: new Date()
          }
        }
      );

      throw new Error('Веќе имате слично барање поднесено во последните 24 часа');
    }
  }

  // ==================== ADMIN MANAGEMENT ====================

  /**
   * Get requests for admin with filtering and quality indicators
   */
  async getRequestsForAdmin(filters = {}, pagination = {}) {
    console.log('🔍 [SERVICE] getRequestsForAdmin called');
    console.log('🔍 [SERVICE] Filters received:', filters);
    console.log('🔍 [SERVICE] Pagination received:', pagination);

    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = pagination;
      const skip = (page - 1) * limit;

      // Build query with filters
      const query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.serviceType) {
        query.serviceType = filters.serviceType;
      }

      if (filters.requestCategory) {
        query.requestCategory = filters.requestCategory;
      }

      if (filters.qualityFilter) {
        switch (filters.qualityFilter) {
          case 'low-quality':
            query.$or = [
              { 'qualityIndicators.spamScore': { $gt: 30 } },
              { 'qualityIndicators.qualityScore': { $lt: 50 } }
            ];
            break;
          case 'potential-duplicates':
            query['qualityIndicators.duplicateCheck'] = true;
            break;
          case 'high-quality':
            query['qualityIndicators.qualityScore'] = { $gte: 70 };
            query['qualityIndicators.spamScore'] = { $lt: 20 };
            break;
        }
      }

      if (filters.dateRange) {
        query.createdAt = {
          $gte: new Date(filters.dateRange.start),
          $lte: new Date(filters.dateRange.end)
        };
      }

      console.log('🔍 [SERVICE] Final query:', query);
      console.log('🔍 [SERVICE] Sort, skip, limit:', { [sortBy]: sortOrder }, skip, limit);

      // Get requests with user information
      const requests = await this.offerRequests.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'users',
            localField: 'verifiedBy',
            foreignField: '_id',
            as: 'verifiedByUser'
          }
        },
        {
          $project: {
            _id: 1,
            serviceType: 1,
            budgetRange: 1,
            projectDescription: 1,
            projectType: 1,
            timeline: 1,
            serviceSpecificFields: 1,
            qualityIndicators: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            verifiedAt: 1,
            adminNotes: 1,
            interestCount: 1,
            connectionsMade: 1,
            isResolved: 1,
            'user.companyInfo.companyName': 1,
            'user.email': 1,
            'verifiedByUser.username': 1
          }
        },
        { $sort: { [sortBy]: sortOrder } },
        { $skip: skip },
        { $limit: limit }
      ]).toArray();

      console.log('🔍 [SERVICE] Raw requests from aggregation:', requests.length);
      if (requests.length > 0) {
        console.log('🔍 [SERVICE] First request sample:', {
          _id: requests[0]._id,
          serviceType: requests[0].serviceType,
          status: requests[0].status,
          createdAt: requests[0].createdAt
        });
      }

      // Get total count
      const total = await this.offerRequests.countDocuments(query);
      console.log('🔍 [SERVICE] Total count from query:', total);

      const result = {
        requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      };

      console.log('🔍 [SERVICE] Returning result with', result.requests.length, 'requests');
      return result;

    } catch (error) {
      console.error('Error getting requests for admin:', error);
      throw error;
    }
  }

  /**
   * Verify offer request (admin action)
   */
  async verifyOfferRequest(requestId, adminId, notes = '') {
    console.log('\n🔐 ========== VERIFY OFFER REQUEST STARTED ==========');
    console.log('📋 Verification Request:', {
      requestId,
      adminId,
      notes: notes || 'No notes provided'
    });

    try {
      if (!ObjectId.isValid(requestId) || !ObjectId.isValid(adminId)) {
        throw new Error('Неважечки ID параметри');
      }

      console.log('✅ IDs validated successfully');

      const now = new Date();
      console.log(`\n📝 Updating request ${requestId} to verified status...`);

      const result = await this.offerRequests.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: 'верифицирано',
            verifiedBy: new ObjectId(adminId),
            verifiedAt: now,
            updatedAt: now,
            adminNotes: notes
          }
        }
      );

      console.log('   Update result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged
      });

      if (result.matchedCount === 0) {
        throw new Error('Барањето не е пронајдено');
      }

      if (result.modifiedCount === 0) {
        console.warn('⚠️ WARNING: Request was matched but not modified. It may already be verified.');
      }

      // Get the verified request
      console.log(`\n📥 Fetching verified request data...`);
      const verifiedRequest = await this.getOfferRequestById(requestId);
      console.log('   Verified request fetched:', {
        id: verifiedRequest._id,
        status: verifiedRequest.status,
        serviceType: verifiedRequest.serviceType,
        hasRequestCategory: !!verifiedRequest.requestCategory,
        hasPreferredLocations: !!verifiedRequest.preferredLocations
      });

      // Send to relevant providers
      console.log(`\n📤 Calling sendToProviders()...`);
      const providerResult = await this.sendToProviders(verifiedRequest);
      console.log('   Provider result:', providerResult);

      console.log(`\n✅ ========== VERIFY OFFER REQUEST COMPLETED ==========\n`);
      return verifiedRequest;

    } catch (error) {
      console.error('\n❌ ========== VERIFY OFFER REQUEST FAILED ==========');
      console.error('Error details:', error);
      console.error('Stack:', error.stack);
      console.error('========================================\n');
      throw error;
    }
  }

  /**
   * Reject offer request (admin action)
   */
  async rejectOfferRequest(requestId, adminId, reason = '') {
    try {
      if (!ObjectId.isValid(requestId) || !ObjectId.isValid(adminId)) {
        throw new Error('Неважечки ID параметри');
      }

      const now = new Date();
      const result = await this.offerRequests.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: 'одбиено',
            verifiedBy: new ObjectId(adminId),
            verifiedAt: now,
            updatedAt: now,
            adminNotes: reason
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Барањето не е пронајдено');
      }

      const rejectedRequest = await this.getOfferRequestById(requestId);

      // Notify user about rejection
      await this.sendRejectionNotification(rejectedRequest, reason);

      return rejectedRequest;

    } catch (error) {
      console.error('Error rejecting offer request:', error);
      throw error;
    }
  }

  // ==================== PROVIDER MATCHING ====================

  /**
   * Send verified request to relevant providers
   */
  async sendToProviders(request) {
    console.log('\n🚀 ========== SEND TO PROVIDERS STARTED ==========');
    console.log('📋 Request Details:', {
      id: request._id,
      serviceType: request.serviceType,
      requestCategory: request.requestCategory || 'MISSING',
      preferredLocations: request.preferredLocations || 'MISSING',
      budgetRange: request.budgetRange,
      status: request.status
    });

    try {
      // Defensive check: Ensure preferredLocations is always an array
      let locationsList = request.preferredLocations || [];

      // Handle legacy data where preferredLocations might be a string or other non-array value
      if (!Array.isArray(locationsList)) {
        console.warn(`⚠️ preferredLocations is not an array, converting: ${typeof locationsList}`, locationsList);
        locationsList = locationsList ? [locationsList] : [];
      }

      console.log(`🔍 Finding providers for: ${request.serviceType} (category: ${request.requestCategory || 'NOT SET'}) in locations: ${locationsList.length > 0 ? locationsList.join(', ') : 'any location'}`);

      // Build query to filter by request category and service type
      const query = {};

      // CRITICAL FIX: Handle missing requestCategory
      if (!request.requestCategory) {
        console.warn('⚠️ WARNING: requestCategory is missing! Using serviceType as fallback');
        // If requestCategory is missing, use serviceType directly
        if (request.serviceType === 'legal') {
          query.serviceCategory = 'legal';
        } else {
          query.serviceCategory = request.serviceType;
        }
      } else if (request.requestCategory === 'legal') {
        // For legal requests, only send to legal service providers
        query.serviceCategory = 'legal';
      } else {
        // For other requests, send to non-legal service providers matching the service type
        query.serviceCategory = { $ne: 'legal' };
        if (request.serviceType) {
          query.serviceCategory = request.serviceType;
        }
      }

      // CRITICAL FIX: Only add location filtering if locations exist AND providers have location data
      if (locationsList.length > 0 && !locationsList.includes('целосно-далечински')) {
        // First check if ANY providers have location data
        const providersWithLocation = await this.serviceProviders.countDocuments({
          location: { $exists: true, $ne: null, $ne: '' }
        });

        console.log(`📍 Providers with location data: ${providersWithLocation}`);

        if (providersWithLocation > 0) {
          // Only filter by location if providers have location data
          query.$or = [
            { location: { $in: locationsList } }, // Match any of the selected cities (string match)
            { location: { $exists: false } }, // Include providers without location data
            { location: '' } // Include providers with empty location
          ];
        } else {
          console.warn('⚠️ No providers have location data. Skipping location filter.');
        }
      }

      console.log('🔍 Provider query:', JSON.stringify(query, null, 2));

      const allMatchingProviders = await this.serviceProviders.find(query).toArray();

      console.log(`\n📊 PROVIDER MATCHING RESULTS:`);
      console.log(`   Total providers matching criteria: ${allMatchingProviders.length}`);

      if (allMatchingProviders.length === 0) {
        console.error(`\n❌ NO PROVIDERS MATCHED!`);
        console.error(`   Query was: ${JSON.stringify(query, null, 2)}`);
        console.error(`   Request category: ${request.requestCategory || 'MISSING'}`);
        console.error(`   Request serviceType: ${request.serviceType}`);
        console.error(`   Locations requested: ${locationsList.join(', ') || 'none'}`);

        // Return early with warning but don't throw error
        return {
          providerCount: 0,
          totalMatched: 0,
          warning: 'No matching providers found',
          query: query
        };
      }

      // RANDOM SELECTION: Select maximum 10 providers randomly
      const MAX_PROVIDERS_PER_REQUEST = 10;
      let selectedProviders = [];

      if (allMatchingProviders.length <= MAX_PROVIDERS_PER_REQUEST) {
        // If we have 10 or fewer, send to all
        selectedProviders = allMatchingProviders;
        console.log(`   ✅ Sending to all ${selectedProviders.length} matching providers`);
      } else {
        // Randomly select 10 providers from the pool
        const shuffled = [...allMatchingProviders].sort(() => Math.random() - 0.5);
        selectedProviders = shuffled.slice(0, MAX_PROVIDERS_PER_REQUEST);
        console.log(`   🎲 Randomly selected ${selectedProviders.length} providers from ${allMatchingProviders.length} matches`);
      }

      console.log(`\n✅ SELECTED PROVIDERS (${selectedProviders.length}):`);
      selectedProviders.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name} (${p.email}) - ${p.location || 'No location'}`);
      });

      // Update request with selected provider list
      console.log(`\n📝 Updating request ${request._id}...`);
      const providerIds = selectedProviders.map(p => p._id);
      const updateResult = await this.offerRequests.updateOne(
        { _id: request._id },
        {
          $set: {
            sentTo: providerIds,
            totalMatched: allMatchingProviders.length, // Store total matches for reference
            status: 'испратено',
            updatedAt: new Date()
          }
        }
      );
      console.log(`   Update result: ${updateResult.modifiedCount} document(s) modified`);

      // Generate interest tokens and send emails
      console.log(`\n📧 Sending interest invitations to ${selectedProviders.length} provider(s)...`);
      const ProviderInterestService = require('./providerInterestService');
      const providerInterestService = new ProviderInterestService(this.db);

      const emailResult = await providerInterestService.sendInterestInvitations(request, selectedProviders);
      console.log(`   Email result:`, emailResult);

      console.log(`\n✅ ========== SEND TO PROVIDERS COMPLETED ==========\n`);
      return {
        providerCount: selectedProviders.length,
        totalMatched: allMatchingProviders.length,
        providers: selectedProviders,
        emailResult
      };

    } catch (error) {
      console.error('\n❌ ========== SEND TO PROVIDERS FAILED ==========');
      console.error('Error details:', error);
      console.error('Stack:', error.stack);
      console.error('========================================\n');
      throw error;
    }
  }

  // ==================== REQUEST QUERIES ====================

  /**
   * Get offer request by ID
   */
  async getOfferRequestById(requestId) {
    try {
      if (!ObjectId.isValid(requestId)) {
        throw new Error('Неважечки ID на барање');
      }

      const request = await this.offerRequests.findOne({
        _id: new ObjectId(requestId)
      });

      if (!request) {
        throw new Error('Барањето не е пронајдено');
      }

      return request;

    } catch (error) {
      console.error('Error getting offer request by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's offer requests
   */
  async getUserOfferRequests(userId, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      if (!ObjectId.isValid(userId)) {
        throw new Error('Неважечки ID на корисник');
      }

      const requests = await this.offerRequests.find(
        { userId: new ObjectId(userId) },
        {
          projection: {
            serviceType: 1,
            budgetRange: 1,
            projectDescription: 1,
            projectType: 1,
            timeline: 1,
            status: 1,
            createdAt: 1,
            interestCount: 1,
            connectionsMade: 1,
            isResolved: 1
          }
        }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.offerRequests.countDocuments({
        userId: new ObjectId(userId)
      });

      return {
        requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      };

    } catch (error) {
      console.error('Error getting user offer requests:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & STATISTICS ====================

  /**
   * Get quality statistics for admin dashboard
   */
  async getQualityStatistics() {
    try {
      const stats = await this.offerRequests.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgQualityScore: { $avg: '$qualityIndicators.qualityScore' },
            avgSpamScore: { $avg: '$qualityIndicators.spamScore' },
            duplicateCount: {
              $sum: {
                $cond: ['$qualityIndicators.duplicateCheck', 1, 0]
              }
            }
          }
        }
      ]).toArray();

      // Get category distribution
      const categoryStats = await this.offerRequests.aggregate([
        {
          $group: {
            _id: '$serviceType',
            count: { $sum: 1 },
            avgInterestCount: { $avg: '$interestCount' }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();

      return { statusStats: stats, categoryStats };

    } catch (error) {
      console.error('Error getting quality statistics:', error);
      throw error;
    }
  }

  /**
   * Update interest count when provider expresses interest
   */
  async incrementInterestCount(requestId) {
    try {
      const result = await this.offerRequests.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $inc: { interestCount: 1 },
          $set: { updatedAt: new Date() }
        }
      );

      return result.modifiedCount > 0;

    } catch (error) {
      console.error('Error incrementing interest count:', error);
      return false;
    }
  }

  /**
   * Mark request as resolved when connection is made
   */
  async markAsResolved(requestId, connectionCount = 1) {
    try {
      const result = await this.offerRequests.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            isResolved: true,
            connectionsMade: connectionCount,
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;

    } catch (error) {
      console.error('Error marking request as resolved:', error);
      return false;
    }
  }

  // ==================== NOTIFICATION HELPERS ====================

  /**
   * Send admin notification about new request
   */
  async sendAdminNotification(request, user) {
    try {
      const emailService = require('./emailService');
      await emailService.sendOfferRequestToAdmin(request, user);
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't throw error - request creation should succeed even if email fails
    }
  }

  /**
   * Send rejection notification to user
   */
  async sendRejectionNotification(request, reason) {
    try {
      const user = await this.users.findOne({ _id: request.userId });
      if (user) {
        const emailService = require('./emailService');
        await emailService.sendRequestRejectionNotification(request, user, reason);
      }
    } catch (error) {
      console.error('Error sending rejection notification:', error);
      // Don't throw error
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get available service types (only categories with active providers)
   */
  async getAvailableServiceTypes() {
    try {
      const activeCategories = await this.serviceProviders.distinct('serviceCategory', {
        isActive: true
      });

      return activeCategories;

    } catch (error) {
      console.error('Error getting available service types:', error);
      return [];
    }
  }

  /**
   * Get form configuration for service type
   */
  getServiceFormConfig(serviceType) {
    const serviceFields = utils.getServiceSpecificFields(serviceType);
    return {
      budgetRanges: BUDGET_RANGES,
      timelineOptions: TIMELINE_OPTIONS,
      projectTypes: PROJECT_TYPES,
      serviceSpecificFields: serviceFields
    };
  }
}

module.exports = OfferRequestService;