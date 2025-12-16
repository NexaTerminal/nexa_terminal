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
            location: 1
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

  /**
   * Enhanced token validation with security tracking for provider responses
   */
  async validateResponseToken(token, requestData = {}) {
    try {
      // Use the new validation function from schema
      const tokenValidation = validators.validateResponseToken(token, requestData);
      if (!tokenValidation.isValid) {
        throw new Error(`Token validation failed: ${tokenValidation.errors.join(', ')}`);
      }

      const interest = await this.providerInterests.findOne({
        interestToken: token,
        tokenExpiry: { $gt: new Date() } // Token not expired
      });

      if (!interest) {
        throw new Error('Неважечки или истечен токен');
      }

      // Check if token was already used for response (prevent replay)
      if (interest.responseSubmitted && interest.responseType) {
        throw new Error('Овој токен е веќе искористен за одговор');
      }

      // Get full request details for response context
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
            status: 1,
            acceptedLocations: 1,
            clientName: 1,
            clientEmail: 1
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
            phone: 1,
            location: 1
          }
        }
      );

      if (!request || !provider) {
        throw new Error('Поврзаните податоци не се пронајдени');
      }

      // Log token validation for security audit
      await this.logSecurityEvent('token_validation', {
        token: token.substring(0, 8) + '...',
        providerId: interest.providerId,
        requestId: interest.requestId,
        ipAddress: requestData.ipAddress,
        userAgent: requestData.userAgent,
        timestamp: new Date()
      });

      return {
        interest,
        request,
        provider,
        tokenValid: true,
        securityContext: {
          ipAddress: requestData.ipAddress,
          userAgent: requestData.userAgent,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('Error validating response token:', error);
      throw error;
    }
  }

  // ==================== PROVIDER RESPONSE SYSTEM ====================

  /**
   * Submit provider response (accept, decline, or unsubscribe)
   */
  async submitProviderResponse(token, responseData, securityData = {}) {
    try {
      // Validate token with security tracking
      const tokenValidation = await this.validateResponseToken(token, securityData);
      const { interest, request, provider } = tokenValidation;

      // Validate response data using new validator
      const validationResult = validators.validateProviderResponse(responseData);
      if (!validationResult.isValid) {
        throw new Error(`Валидација неуспешна: ${validationResult.errors.join(', ')}`);
      }

      const now = new Date();
      const responseRecord = {
        responseType: responseData.responseType,
        responseSubmitted: true,
        responseTimestamp: now,
        securityData: {
          ipAddress: securityData.ipAddress,
          userAgent: securityData.userAgent,
          submissionTimestamp: now,
          tokenUsed: true,
          responseSource: securityData.responseSource || 'email-link'
        },
        updatedAt: now
      };

      // Add specific fields based on response type
      if (responseData.responseType === 'accept') {
        responseRecord.budgetAccepted = responseData.budgetAccepted;
        responseRecord.priceDetails = responseData.priceDetails || null;
        responseRecord.timelineAcceptable = responseData.timelineAcceptable;
        responseRecord.timelineComment = responseData.timelineComment || null;
        responseRecord.relevantExperience = responseData.relevantExperience;
        responseRecord.experienceDetails = responseData.experienceDetails || null;
        responseRecord.approachComment = responseData.approachComment;
        responseRecord.status = 'заинтересиран';
      } else if (responseData.responseType === 'decline') {
        responseRecord.declineReason = responseData.declineReason;
        responseRecord.declineComment = responseData.declineComment || null;
        responseRecord.status = 'одбиен';
      } else if (responseData.responseType === 'unsubscribe') {
        responseRecord.unsubscribeReason = responseData.unsubscribeReason;
        responseRecord.unsubscribeComment = responseData.unsubscribeComment || null;
        responseRecord.status = 'отпишан';
      }

      // Update provider interest record
      const result = await this.providerInterests.updateOne(
        { interestToken: token },
        { $set: responseRecord }
      );

      if (result.matchedCount === 0) {
        throw new Error('Неуспешно ажурирање на одговорот');
      }

      // Add response to offer request's provider responses array
      await this.addResponseToOfferRequest(request._id, {
        providerId: interest.providerId,
        providerName: provider.name,
        providerEmail: provider.email,
        responseType: responseData.responseType,
        responseData: responseRecord,
        submittedAt: now
      });

      // Handle specific response type workflows
      if (responseData.responseType === 'accept') {
        await this.handleAcceptResponse(request, provider, responseRecord);
      } else if (responseData.responseType === 'decline') {
        await this.handleDeclineResponse(request, provider, responseRecord);
      } else if (responseData.responseType === 'unsubscribe') {
        await this.handleUnsubscribeResponse(provider, responseRecord);
      }

      // Log security event
      await this.logSecurityEvent('provider_response', {
        providerId: interest.providerId,
        requestId: interest.requestId,
        responseType: responseData.responseType,
        ipAddress: securityData.ipAddress,
        userAgent: securityData.userAgent,
        timestamp: now
      });

      return {
        success: true,
        message: this.getResponseMessage(responseData.responseType),
        responseType: responseData.responseType,
        response: responseRecord
      };

    } catch (error) {
      console.error('Error submitting provider response:', error);
      throw error;
    }
  }

  /**
   * Add provider response to offer request's responses array
   */
  async addResponseToOfferRequest(requestId, responseData) {
    try {
      const result = await this.offerRequests.updateOne(
        { _id: requestId },
        {
          $push: { providerResponses: responseData },
          $inc: {
            'responseStats.totalResponses': 1,
            [`responseStats.${responseData.responseType}Count`]: 1
          },
          $set: { updatedAt: new Date() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error adding response to offer request:', error);
      throw error;
    }
  }

  /**
   * Handle accept response workflow
   */
  async handleAcceptResponse(request, provider, responseData) {
    try {
      // Send notification to client about provider acceptance
      const emailService = require('./emailService');
      await emailService.sendProviderAcceptanceToClient(request, provider, responseData);

      // Send confirmation to provider
      await emailService.sendAcceptanceConfirmationToProvider(provider, request);

    } catch (error) {
      console.error('Error handling accept response:', error);
      // Don't throw - response should still be recorded
    }
  }

  /**
   * Handle decline response workflow
   */
  async handleDeclineResponse(request, provider, responseData) {
    try {
      // Optional: Log decline reasons for analytics
      await this.logDeclineReason(request._id, provider._id, responseData.declineReason);

    } catch (error) {
      console.error('Error handling decline response:', error);
    }
  }

  /**
   * Handle unsubscribe response workflow
   */
  async handleUnsubscribeResponse(provider, responseData) {
    try {
      // Mark provider as unsubscribed from future emails
      await this.serviceProviders.updateOne(
        { _id: provider._id },
        {
          $set: {
            emailPreferences: {
              receiveOfferInvitations: false,
              unsubscribedAt: new Date(),
              unsubscribeReason: responseData.unsubscribeReason
            },
            updatedAt: new Date()
          }
        }
      );

      // Send unsubscribe confirmation
      const emailService = require('./emailService');
      await emailService.sendUnsubscribeConfirmation(provider);

    } catch (error) {
      console.error('Error handling unsubscribe response:', error);
    }
  }

  /**
   * Get appropriate response message based on type
   */
  getResponseMessage(responseType) {
    switch (responseType) {
      case 'accept':
        return 'Вашиот интерес е успешно изразен. Клиентот ќе биде известен со деталите од вашиот одговор.';
      case 'decline':
        return 'Вашиот одговор е евидентиран. Ви благодариме за времето.';
      case 'unsubscribe':
        return 'Успешно се отпишавте од иднашни известувања за понуди.';
      default:
        return 'Вашиот одговор е евидентиран.';
    }
  }

  /**
   * Log security events for audit trail
   */
  async logSecurityEvent(eventType, eventData) {
    try {
      const securityLog = this.db.collection('security_logs');
      await securityLog.insertOne({
        eventType,
        eventData,
        timestamp: new Date(),
        source: 'provider_interest_service'
      });
    } catch (error) {
      console.error('Error logging security event:', error);
      // Don't throw - security logging shouldn't break functionality
    }
  }

  /**
   * Log decline reason for analytics
   */
  async logDeclineReason(requestId, providerId, reason) {
    try {
      const analytics = this.db.collection('response_analytics');
      await analytics.insertOne({
        requestId,
        providerId,
        responseType: 'decline',
        reason,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging decline reason:', error);
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
   * Get provider responses for a specific request (admin view) - NEW RESPONSE SYSTEM
   */
  async getResponsesByRequest(requestId) {
    try {
      if (!ObjectId.isValid(requestId)) {
        throw new Error('Неважечки ID на барање');
      }

      const responses = await this.providerInterests.aggregate([
        {
          $match: {
            requestId: new ObjectId(requestId),
            $or: [
              { responseSubmitted: true }, // New response system
              { availability: { $ne: null } } // Legacy interest system
            ]
          }
        },
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
            providerId: 1,
            interestToken: 1,
            tokenExpiry: 1,
            createdAt: 1,
            updatedAt: 1,

            // Legacy interest fields
            availability: 1,
            budgetAlignment: 1,
            proposal: 1,
            portfolio: 1,
            preferredContact: 1,
            nextSteps: 1,
            responseQuality: 1,

            // New response system fields
            responseSubmitted: 1,
            responseType: 1,
            responseTimestamp: 1,
            budgetAccepted: 1,
            priceDetails: 1,
            timelineAcceptable: 1,
            timelineComment: 1,
            relevantExperience: 1,
            experienceDetails: 1,
            approachComment: 1,
            declineReason: 1,
            declineComment: 1,
            unsubscribeReason: 1,
            unsubscribeComment: 1,
            securityData: 1,

            // Provider information
            'provider.name': 1,
            'provider.email': 1,
            'provider.serviceCategory': 1,
            'provider.location': 1,
            'provider.phone': 1,

            // Status
            status: 1
          }
        },
        {
          $sort: {
            responseTimestamp: -1,
            updatedAt: -1,
            createdAt: -1
          }
        }
      ]).toArray();

      // Process responses to categorize them
      const categorizedResponses = {
        accepted: [],
        declined: [],
        unsubscribed: [],
        legacy: [], // Old interest expressions
        pending: [] // Tokens sent but no response yet
      };

      responses.forEach(response => {
        if (response.responseSubmitted && response.responseType) {
          // New response system
          switch (response.responseType) {
            case 'accept':
              categorizedResponses.accepted.push(response);
              break;
            case 'decline':
              categorizedResponses.declined.push(response);
              break;
            case 'unsubscribe':
              categorizedResponses.unsubscribed.push(response);
              break;
          }
        } else if (response.availability) {
          // Legacy interest system
          categorizedResponses.legacy.push(response);
        } else {
          // Pending response (token sent but no response)
          categorizedResponses.pending.push(response);
        }
      });

      // Calculate summary statistics
      const summary = {
        totalInvited: responses.length,
        totalResponded: categorizedResponses.accepted.length +
                       categorizedResponses.declined.length +
                       categorizedResponses.unsubscribed.length +
                       categorizedResponses.legacy.length,
        acceptedCount: categorizedResponses.accepted.length,
        declinedCount: categorizedResponses.declined.length,
        unsubscribedCount: categorizedResponses.unsubscribed.length,
        legacyCount: categorizedResponses.legacy.length,
        pendingCount: categorizedResponses.pending.length,
        responseRate: responses.length > 0 ?
          ((categorizedResponses.accepted.length + categorizedResponses.declined.length +
            categorizedResponses.unsubscribed.length + categorizedResponses.legacy.length) / responses.length * 100) : 0
      };

      return {
        summary,
        responses: categorizedResponses,
        allResponses: responses
      };

    } catch (error) {
      console.error('Error getting responses by request:', error);
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
    console.log('\n📧 ========== SEND INTEREST INVITATIONS STARTED ==========');
    console.log(`   Request ID: ${request._id}`);
    console.log(`   Providers to contact: ${providers.length}`);

    try {
      // Create tokens for all providers
      console.log(`\n🔑 Creating interest tokens for ${providers.length} provider(s)...`);
      const tokens = await this.createInterestTokens(request._id, providers);
      console.log(`   ✅ Created ${tokens.length} tokens`);

      // Send individual emails to each provider
      console.log(`\n📤 Sending emails to providers...`);
      const emailService = require('./emailService');

      const emailPromises = tokens.map((tokenData, index) => {
        console.log(`   [${index + 1}/${tokens.length}] Queueing email to: ${tokenData.provider.email}`);
        return emailService.sendInterestInvitationToProvider(request, tokenData);
      });

      const results = await Promise.allSettled(emailPromises);

      // Log email results
      console.log(`\n📊 EMAIL SENDING RESULTS:`);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`   ❌ [${index + 1}] FAILED to ${tokens[index].provider.email}:`, result.reason);
        } else if (result.status === 'fulfilled') {
          console.log(`   ✅ [${index + 1}] SUCCESS to ${tokens[index].provider.email}:`, result.value);
        }
      });

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = providers.length - successCount;

      console.log(`\n📈 SUMMARY:`);
      console.log(`   Total providers: ${providers.length}`);
      console.log(`   Emails sent: ${successCount}`);
      console.log(`   Emails failed: ${failCount}`);

      if (failCount > 0) {
        console.warn(`⚠️ WARNING: ${failCount} email(s) failed to send!`);
      }

      console.log(`\n✅ ========== SEND INTEREST INVITATIONS COMPLETED ==========\n`);

      return {
        totalProviders: providers.length,
        emailsSent: successCount,
        emailsFailed: failCount,
        tokens,
        results: results.map((r, i) => ({
          email: tokens[i].provider.email,
          status: r.status,
          result: r.status === 'fulfilled' ? r.value : { error: r.reason }
        }))
      };

    } catch (error) {
      console.error('\n❌ ========== SEND INTEREST INVITATIONS FAILED ==========');
      console.error('Error details:', error);
      console.error('Stack:', error.stack);
      console.error('========================================\n');
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

  /**
   * Get provider response statistics (for the new response system)
   */
  async getResponseStatistics() {
    try {
      const responseStats = await this.providerInterests.aggregate([
        {
          $match: {
            responseSubmitted: true,
            responseType: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$responseType',
            count: { $sum: 1 },
            avgResponseTime: {
              $avg: {
                $divide: [
                  { $subtract: ['$responseTimestamp', '$createdAt'] },
                  1000 * 60 * 60 // Convert to hours
                ]
              }
            }
          }
        }
      ]).toArray();

      const totalResponses = await this.providerInterests.countDocuments({
        responseSubmitted: true
      });

      const pendingResponses = await this.providerInterests.countDocuments({
        responseSubmitted: { $ne: true },
        tokenExpiry: { $gt: new Date() }
      });

      const expiredTokens = await this.providerInterests.countDocuments({
        responseSubmitted: { $ne: true },
        tokenExpiry: { $lt: new Date() }
      });

      // Get response rate by time period
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const responsesLast24h = await this.providerInterests.countDocuments({
        responseSubmitted: true,
        responseTimestamp: { $gte: last24Hours }
      });

      const responsesLast7d = await this.providerInterests.countDocuments({
        responseSubmitted: true,
        responseTimestamp: { $gte: last7Days }
      });

      return {
        responseTypeStats: responseStats,
        totalResponses,
        pendingResponses,
        expiredTokens,
        responsesLast24h,
        responsesLast7d,
        responseRate: totalResponses > 0 ? (totalResponses / (totalResponses + pendingResponses + expiredTokens)) * 100 : 0
      };

    } catch (error) {
      console.error('Error getting response statistics:', error);
      throw error;
    }
  }
}

module.exports = ProviderInterestService;