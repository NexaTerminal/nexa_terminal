/**
 * Provider Interest Service - Token Generation and Proposal Management
 * Handles interest expression workflow, unique tokens, and client notifications
 */

const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const { validators } = require('../config/offerRequestSchemas');

class ProviderInterestService {
  constructor(database) {
    this.db = database;
    this.providerInterests = database.collection('provider_interests');
    this.offerRequests = database.collection('offer_requests');
    this.serviceProviders = database.collection('service_providers');
    this.users = database.collection('users');
  }

  // ==================== TOKEN GENERATION & MANAGEMENT ====================

  /**
   * Generate unique interest token
   */
  generateInterestToken() {
    // Generate cryptographically secure token
    const buffer = crypto.randomBytes(32);
    return buffer.toString('hex');
  }

  /**
   * Create interest invitation tokens for providers
   */
  async createInterestTokens(requestId, providers) {
    try {
      const tokens = [];
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days expiry

      for (const provider of providers) {
        const token = this.generateInterestToken();

        const interestRecord = {
          requestId: new ObjectId(requestId),
          providerId: provider._id,
          interestToken: token,
          tokenExpiry: expiryDate,
          availability: null,
          budgetAlignment: null,
          proposal: null,
          portfolio: null,
          preferredContact: 'email',
          nextSteps: null,
          providerEmail: provider.email,
          providerPhone: provider.phone || '',
          providerName: provider.name,
          status: 'изразен', // Token created, waiting for interest
          createdAt: now,
          updatedAt: now,
          viewedByClient: false,
          responseQuality: {
            completeness: 0,
            relevance: 0,
            professionalism: 0
          }
        };

        const result = await this.providerInterests.insertOne(interestRecord);
        tokens.push({
          ...interestRecord,
          _id: result.insertedId,
          provider: {
            _id: provider._id,
            name: provider.name,
            email: provider.email,
            serviceCategory: provider.serviceCategory
          }
        });
      }

      return tokens;

    } catch (error) {
      console.error('Error creating interest tokens:', error);
      throw error;
    }
  }

  /**
   * Validate interest token and get associated data
   */
  async validateInterestToken(token) {
    try {
      const interest = await this.providerInterests.findOne({
        interestToken: token,
        tokenExpiry: { $gt: new Date() } // Token not expired
      });

      if (!interest) {
        throw new Error('Неважечки или истечен токен');
      }

      // Get request and provider details
      const request = await this.offerRequests.findOne(
        { _id: interest.requestId },
        {
          projection: {
            serviceType: 1,
            budgetRange: 1,
            projectDescription: 1,
            projectType: 1,
            timeline: 1,
            serviceSpecificFields: 1,
            createdAt: 1,
            status: 1
          }
        }
      );

      const provider = await this.serviceProviders.findOne(
        { _id: interest.providerId },
        {
          projection: {
            name: 1,
            email: 1,
            serviceCategory: 1,
            description: 1
          }
        }
      );

      if (!request || !provider) {
        throw new Error('Поврзаните податоци не се пронајдени');
      }

      return {
        interest,
        request,
        provider
      };

    } catch (error) {
      console.error('Error validating interest token:', error);
      throw error;
    }
  }

  // ==================== INTEREST EXPRESSION ====================

  /**
   * Submit provider interest expression
   */
  async submitProviderInterest(token, interestData) {
    try {
      // Validate token first
      const tokenValidation = await this.validateInterestToken(token);
      const { interest, request } = tokenValidation;

      // Validate interest data
      const validationErrors = validators.validateProviderInterest(interestData);
      if (validationErrors.length > 0) {
        throw new Error(`Валидација неуспешна: ${validationErrors.join(', ')}`);
      }

      // Calculate response quality score
      const responseQuality = this.calculateResponseQuality(interestData);

      const now = new Date();
      const updateData = {
        availability: interestData.availability,
        budgetAlignment: interestData.budgetAlignment,
        proposal: interestData.proposal.trim(),
        portfolio: interestData.portfolio || null,
        preferredContact: interestData.preferredContact || 'email',
        nextSteps: interestData.nextSteps || null,
        status: 'изразен',
        updatedAt: now,
        responseQuality
      };

      // Update provider interest record
      const result = await this.providerInterests.updateOne(
        { interestToken: token },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Неуспешно ажурирање на интересот');
      }

      // Increment interest count in offer request
      const OfferRequestService = require('./offerRequestService');
      const offerRequestService = new OfferRequestService(this.db);
      await offerRequestService.incrementInterestCount(request._id);

      // Send notification to client
      await this.sendClientNotification(request, interest, interestData);

      // Send confirmation to provider
      await this.sendProviderConfirmation(interest, interestData);

      return {
        success: true,
        message: 'Вашиот интерес е успешно изразен. Клиентот ќе биде известен.',
        interest: updateData
      };

    } catch (error) {
      console.error('Error submitting provider interest:', error);
      throw error;
    }
  }

  /**
   * Calculate response quality score based on completeness and content
   */
  calculateResponseQuality(interestData) {
    let completeness = 0;
    let relevance = 50; // Base relevance score
    let professionalism = 50; // Base professionalism score

    // Completeness scoring (0-100)
    if (interestData.availability) completeness += 20;
    if (interestData.budgetAlignment) completeness += 20;
    if (interestData.proposal && interestData.proposal.length > 50) completeness += 30;
    if (interestData.portfolio) completeness += 15;
    if (interestData.nextSteps) completeness += 15;

    // Relevance scoring based on proposal content
    if (interestData.proposal) {
      const proposalLength = interestData.proposal.length;
      if (proposalLength > 100) relevance += 20;
      if (proposalLength > 200) relevance += 10;

      // Check for specific action words
      const actionWords = ['ќе', 'можам', 'предлагам', 'искуство', 'решение', 'пристап'];
      const actionWordsFound = actionWords.filter(word =>
        interestData.proposal.toLowerCase().includes(word)
      ).length;
      relevance += Math.min(actionWordsFound * 5, 20);
    }

    // Professionalism scoring
    if (interestData.proposal) {
      // Check for proper sentence structure
      if (interestData.proposal.includes('.') || interestData.proposal.includes('!')) {
        professionalism += 10;
      }

      // Check capitalization
      if (interestData.proposal.charAt(0) === interestData.proposal.charAt(0).toUpperCase()) {
        professionalism += 10;
      }

      // Avoid all caps (unprofessional)
      if (interestData.proposal === interestData.proposal.toUpperCase()) {
        professionalism -= 20;
      }
    }

    return {
      completeness: Math.min(100, completeness),
      relevance: Math.min(100, Math.max(0, relevance)),
      professionalism: Math.min(100, Math.max(0, professionalism))
    };
  }

  // ==================== INTEREST MANAGEMENT ====================

  /**
   * Get interests for a specific request (admin view)
   */
  async getInterestsByRequest(requestId) {
    try {
      if (!ObjectId.isValid(requestId)) {
        throw new Error('Неважечки ID на барање');
      }

      const interests = await this.providerInterests.find({
        requestId: new ObjectId(requestId),
        availability: { $ne: null } // Only interests that have been submitted
      })
        .sort({ 'responseQuality.completeness': -1, createdAt: -1 })
        .toArray();

      return interests;

    } catch (error) {
      console.error('Error getting interests by request:', error);
      throw error;
    }
  }

  /**
   * Get all interests for admin management
   */
  async getAllInterests(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const query = { availability: { $ne: null } }; // Only submitted interests

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.providerId) {
        query.providerId = new ObjectId(filters.providerId);
      }

      if (filters.viewedByClient !== undefined) {
        query.viewedByClient = filters.viewedByClient;
      }

      const interests = await this.providerInterests.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'offer_requests',
            localField: 'requestId',
            foreignField: '_id',
            as: 'request'
          }
        },
        { $unwind: '$request' },
        {
          $lookup: {
            from: 'service_providers',
            localField: 'providerId',
            foreignField: '_id',
            as: 'provider'
          }
        },
        { $unwind: '$provider' },
        {
          $project: {
            _id: 1,
            requestId: 1,
            providerId: 1,
            availability: 1,
            budgetAlignment: 1,
            proposal: 1,
            portfolio: 1,
            preferredContact: 1,
            nextSteps: 1,
            status: 1,
            createdAt: 1,
            viewedByClient: 1,
            responseQuality: 1,
            'request.serviceType': 1,
            'request.budgetRange': 1,
            'request.projectType': 1,
            'provider.name': 1,
            'provider.email': 1,
            'provider.serviceCategory': 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]).toArray();

      const total = await this.providerInterests.countDocuments(query);

      return {
        interests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      };

    } catch (error) {
      console.error('Error getting all interests:', error);
      throw error;
    }
  }

  /**
   * Mark interest as viewed by client
   */
  async markAsViewedByClient(interestId) {
    try {
      if (!ObjectId.isValid(interestId)) {
        throw new Error('Неважечки ID на интерес');
      }

      const result = await this.providerInterests.updateOne(
        { _id: new ObjectId(interestId) },
        {
          $set: {
            viewedByClient: true,
            clientResponseDate: new Date(),
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;

    } catch (error) {
      console.error('Error marking interest as viewed:', error);
      return false;
    }
  }

  // ==================== EMAIL WORKFLOW ====================

  /**
   * Send interest invitations to providers
   */
  async sendInterestInvitations(request, providers) {
    try {
      // Create tokens for all providers
      const tokens = await this.createInterestTokens(request._id, providers);

      // Send individual emails to each provider
      const emailService = require('./emailService');
      const emailPromises = tokens.map(tokenData =>
        emailService.sendInterestInvitationToProvider(request, tokenData)
      );

      const results = await Promise.allSettled(emailPromises);

      // Log any email failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to send email to provider ${tokens[index].provider.email}:`, result.reason);
        }
      });

      const successCount = results.filter(r => r.status === 'fulfilled').length;

      return {
        totalProviders: providers.length,
        emailsSent: successCount,
        emailsFailed: providers.length - successCount,
        tokens
      };

    } catch (error) {
      console.error('Error sending interest invitations:', error);
      throw error;
    }
  }

  /**
   * Send client notification about provider interest
   */
  async sendClientNotification(request, interest, interestData) {
    try {
      // Get client user information
      const client = await this.users.findOne({ _id: request.userId });
      if (!client) {
        console.error('Client user not found for request:', request._id);
        return;
      }

      // Get provider information
      const provider = await this.serviceProviders.findOne({ _id: interest.providerId });
      if (!provider) {
        console.error('Provider not found for interest:', interest._id);
        return;
      }

      const emailService = require('./emailService');
      await emailService.sendProviderInterestToClient(client, request, provider, interestData);

    } catch (error) {
      console.error('Error sending client notification:', error);
      // Don't throw error - interest submission should succeed even if email fails
    }
  }

  /**
   * Send confirmation to provider
   */
  async sendProviderConfirmation(interest, interestData) {
    try {
      const provider = await this.serviceProviders.findOne({ _id: interest.providerId });
      if (!provider) {
        console.error('Provider not found for confirmation:', interest._id);
        return;
      }

      const emailService = require('./emailService');
      await emailService.sendInterestConfirmationToProvider(provider, interestData);

    } catch (error) {
      console.error('Error sending provider confirmation:', error);
      // Don't throw error
    }
  }

  // ==================== CLEANUP & MAINTENANCE ====================

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    try {
      const result = await this.providerInterests.deleteMany({
        tokenExpiry: { $lt: new Date() },
        availability: null // Only delete unused tokens
      });

      console.log(`Cleaned up ${result.deletedCount} expired interest tokens`);
      return result.deletedCount;

    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Get interest statistics
   */
  async getInterestStatistics() {
    try {
      const stats = await this.providerInterests.aggregate([
        {
          $match: { availability: { $ne: null } } // Only submitted interests
        },
        {
          $group: {
            _id: '$availability',
            count: { $sum: 1 },
            avgCompleteness: { $avg: '$responseQuality.completeness' },
            avgRelevance: { $avg: '$responseQuality.relevance' }
          }
        }
      ]).toArray();

      const budgetAlignmentStats = await this.providerInterests.aggregate([
        {
          $match: { budgetAlignment: { $ne: null } }
        },
        {
          $group: {
            _id: '$budgetAlignment',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      return {
        availabilityStats: stats,
        budgetAlignmentStats,
        totalInterests: await this.providerInterests.countDocuments({
          availability: { $ne: null }
        })
      };

    } catch (error) {
      console.error('Error getting interest statistics:', error);
      throw error;
    }
  }
}

module.exports = ProviderInterestService;