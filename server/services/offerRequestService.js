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
      const offerRequest = {
        userId: new ObjectId(userId),
        serviceType: requestData.serviceType,
        budgetRange: requestData.budgetRange,
        projectDescription: requestData.projectDescription.trim(),
        projectType: requestData.projectType,
        timeline: requestData.timeline,
        preferredLocations: requestData.preferredLocations || [], // Changed to array
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
    try {
      if (!ObjectId.isValid(requestId) || !ObjectId.isValid(adminId)) {
        throw new Error('Неважечки ID параметри');
      }

      const now = new Date();
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

      if (result.matchedCount === 0) {
        throw new Error('Барањето не е пронајдено');
      }

      // Get the verified request
      const verifiedRequest = await this.getOfferRequestById(requestId);

      // Send to relevant providers
      await this.sendToProviders(verifiedRequest);

      return verifiedRequest;

    } catch (error) {
      console.error('Error verifying offer request:', error);
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
    try {
      const locationsList = request.preferredLocations || [];
      console.log(`🔍 Finding providers for: ${request.serviceType} in locations: ${locationsList.join(', ') || 'any location'}`);

      // Build query to filter by both service category AND location
      const query = {
        serviceCategory: request.serviceType,
        isActive: true
      };

      // Add location filtering if specified
      if (locationsList.length > 0 && !locationsList.includes('целосно-далечински')) {
        query.$or = [
          { 'location.city': { $in: locationsList } }, // Match any of the selected cities
          { 'location.servesRemote': true }
        ];
      }

      console.log('🔍 Provider query:', JSON.stringify(query, null, 2));

      const providers = await this.serviceProviders.find(query).toArray();

      console.log(`📊 Found ${providers.length} matching providers`);
      providers.forEach(p => {
        console.log(`  - ${p.name} in ${p.location?.city || 'Unknown'} (remote: ${p.location?.servesRemote || false})`);
      });

      if (providers.length === 0) {
        console.log(`❌ No active providers found for category: ${request.serviceType} in locations: ${locationsList.join(', ')}`);
        return { providerCount: 0 };
      }

      // Update request with provider list
      const providerIds = providers.map(p => p._id);
      await this.offerRequests.updateOne(
        { _id: request._id },
        {
          $set: {
            sentTo: providerIds,
            status: 'испратено',
            updatedAt: new Date()
          }
        }
      );

      // Generate interest tokens and send emails
      const ProviderInterestService = require('./providerInterestService');
      const providerInterestService = new ProviderInterestService(this.db);

      await providerInterestService.sendInterestInvitations(request, providers);

      return { providerCount: providers.length, providers };

    } catch (error) {
      console.error('Error sending request to providers:', error);
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