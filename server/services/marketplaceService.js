/**
 * Simplified MarketplaceService - Service for managing service providers only
 * Auto-creates providers for verified users, simplified admin management
 */

const { ObjectId } = require('mongodb');
const { validators, utils, PREDEFINED_SERVICE_CATEGORIES } = require('../config/marketplaceSchemas');

class MarketplaceService {
  constructor(database) {
    this.db = database;
    this.serviceProviders = database.collection('service_providers');
    this.users = database.collection('users');
  }

  // ==================== SERVICE PROVIDERS ====================

  /**
   * Auto-create service provider from verified user
   */
  async createServiceProviderFromUser(userId, serviceCategory, additionalData = {}) {
    try {
      // Get user data
      const user = await this.users.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isVerified || !user.companyInfo) {
        throw new Error('User must be verified with company info');
      }

      // Check if provider already exists for this user
      const existingProvider = await this.serviceProviders.findOne({ userId: new ObjectId(userId) });
      if (existingProvider) {
        throw new Error('Service provider already exists for this user');
      }

      // Validate service category
      if (!validators.isValidServiceCategory(serviceCategory)) {
        throw new Error('Invalid service category');
      }

      const now = new Date();
      const newProvider = {
        userId: new ObjectId(userId),
        name: user.companyInfo.companyName,
        email: user.email,
        phone: additionalData.phone || user.phone || '',
        website: additionalData.website || '',
        serviceCategory,
        description: additionalData.description || '',
        specializations: additionalData.specializations || [],
        location: {
          city: user.companyInfo.address?.split(',')[0]?.trim() || '',
          region: additionalData.region || '',
          country: 'Macedonia',
          servesRemote: additionalData.servesRemote || false
        },
        businessInfo: {
          taxNumber: user.companyInfo.taxNumber,
          registrationNumber: additionalData.registrationNumber || '',
          languagesSupported: additionalData.languagesSupported || ['mk', 'en']
        },
        isActive: true,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        viewCount: 0,
        contactCount: 0
      };

      const result = await this.serviceProviders.insertOne(newProvider);
      return { ...newProvider, _id: result.insertedId };

    } catch (error) {
      console.error('Error creating service provider from user:', error);
      throw error;
    }
  }

  /**
   * Create service provider (admin only - for manual creation)
   */
  async createServiceProvider(providerData, adminId) {
    try {
      // Validate input data
      const validationErrors = validators.validateServiceProvider(providerData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Check if email already exists
      const existingProvider = await this.serviceProviders.findOne({
        email: providerData.email
      });

      if (existingProvider) {
        throw new Error('Service provider with this email already exists');
      }

      const now = new Date();
      const newProvider = {
        ...providerData,
        isActive: true,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        viewCount: 0,
        contactCount: 0
      };

      const result = await this.serviceProviders.insertOne(newProvider);
      return { ...newProvider, _id: result.insertedId };

    } catch (error) {
      console.error('Error creating service provider:', error);
      throw error;
    }
  }

  /**
   * Update service provider
   */
  async updateServiceProvider(providerId, updateData, adminId = null) {
    try {
      if (!ObjectId.isValid(providerId)) {
        throw new Error('Invalid provider ID');
      }

      // Filter out fields that shouldn't be updated directly
      const { _id, userId, createdAt, viewCount, contactCount, ...allowedUpdates } = updateData;

      const updateDoc = {
        ...allowedUpdates,
        updatedAt: new Date(),
        lastActiveAt: new Date()
      };

      const result = await this.serviceProviders.updateOne(
        { _id: new ObjectId(providerId) },
        { $set: updateDoc }
      );

      if (result.matchedCount === 0) {
        throw new Error('Service provider not found');
      }

      return await this.getServiceProviderById(providerId);

    } catch (error) {
      console.error('Error updating service provider:', error);
      throw error;
    }
  }

  /**
   * Get service providers with filters and pagination
   */
  async getServiceProviders(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = pagination;
      const skip = (page - 1) * limit;

      // Build query from filters - only show active providers by default
      const query = { isActive: true };

      // Admin can see all providers including inactive
      if (filters.includeInactive === true) {
        delete query.isActive;
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.serviceCategory) {
        query.serviceCategory = filters.serviceCategory;
      }

      if (filters.location) {
        query['location.city'] = new RegExp(filters.location, 'i');
      }

      if (filters.search) {
        query.$or = [
          { name: new RegExp(filters.search, 'i') },
          { email: new RegExp(filters.search, 'i') },
          { description: new RegExp(filters.search, 'i') },
          { specializations: { $in: [new RegExp(filters.search, 'i')] } }
        ];
      }

      // Get providers with pagination
      const providers = await this.serviceProviders
        .find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Get total count for pagination
      const total = await this.serviceProviders.countDocuments(query);

      return {
        providers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error('Error getting service providers:', error);
      throw error;
    }
  }

  /**
   * Get service provider by ID
   */
  async getServiceProviderById(providerId) {
    try {
      if (!ObjectId.isValid(providerId)) {
        throw new Error('Invalid provider ID');
      }

      const provider = await this.serviceProviders.findOne({
        _id: new ObjectId(providerId)
      });

      if (!provider) {
        throw new Error('Service provider not found');
      }

      return provider;

    } catch (error) {
      console.error('Error getting service provider:', error);
      throw error;
    }
  }

  /**
   * Update service provider status (enable/disable)
   */
  async updateProviderStatus(providerId, isActive, adminId, notes = '') {
    try {
      if (!ObjectId.isValid(providerId)) {
        throw new Error('Invalid provider ID');
      }

      const now = new Date();
      const updateDoc = {
        isActive: isActive === true || isActive === 'true',
        updatedAt: now,
        lastActiveAt: now
      };

      const result = await this.serviceProviders.updateOne(
        { _id: new ObjectId(providerId) },
        { $set: updateDoc }
      );

      if (result.matchedCount === 0) {
        throw new Error('Service provider not found');
      }

      return await this.getServiceProviderById(providerId);

    } catch (error) {
      console.error('Error updating provider status:', error);
      throw error;
    }
  }

  /**
   * Delete service provider (admin only)
   */
  async deleteServiceProvider(providerId, adminId) {
    try {
      if (!ObjectId.isValid(providerId)) {
        throw new Error('Invalid provider ID');
      }

      const result = await this.serviceProviders.deleteOne({
        _id: new ObjectId(providerId)
      });

      if (result.deletedCount === 0) {
        throw new Error('Service provider not found');
      }

      return { success: true, message: 'Service provider deleted successfully' };

    } catch (error) {
      console.error('Error deleting service provider:', error);
      throw error;
    }
  }

  // ==================== SERVICE CATEGORIES ====================

  /**
   * Get all predefined service categories
   */
  getServiceCategories(language = 'en') {
    return utils.getCategoryOptions(language);
  }

  /**
   * Get service category by name
   */
  getServiceCategory(categoryName) {
    return utils.getServiceCategory(categoryName);
  }

  // ==================== ANALYTICS ====================

  /**
   * Get simplified marketplace analytics for admin dashboard
   */
  async getMarketplaceAnalytics(dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      const dateFilter = {};

      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Provider statistics
      const providerStats = await this.serviceProviders.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$isActive',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      // Category distribution
      const categoryStats = await this.serviceProviders.aggregate([
        {
          $group: {
            _id: '$serviceCategory',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();

      // Most viewed providers
      const topProviders = await this.serviceProviders
        .find({ isActive: true })
        .sort({ viewCount: -1 })
        .limit(10)
        .toArray();

      return {
        providers: {
          total: await this.serviceProviders.countDocuments(),
          active: await this.serviceProviders.countDocuments({ isActive: true }),
          inactive: await this.serviceProviders.countDocuments({ isActive: false }),
          byStatus: providerStats
        },
        categories: categoryStats,
        topProviders: topProviders.map(p => ({
          _id: p._id,
          name: p.name,
          category: p.serviceCategory,
          viewCount: p.viewCount,
          contactCount: p.contactCount
        }))
      };

    } catch (error) {
      console.error('Error getting marketplace analytics:', error);
      throw error;
    }
  }

  /**
   * Get simplified provider performance metrics
   */
  async getProviderPerformance(providerId) {
    try {
      if (!ObjectId.isValid(providerId)) {
        throw new Error('Invalid provider ID');
      }

      const provider = await this.getServiceProviderById(providerId);

      return {
        provider,
        metrics: {
          viewCount: provider.viewCount || 0,
          contactCount: provider.contactCount || 0,
          joinedDate: provider.createdAt,
          lastActiveAt: provider.lastActiveAt,
          isActive: provider.isActive
        }
      };

    } catch (error) {
      console.error('Error getting provider performance:', error);
      throw error;
    }
  }

  /**
   * Increment view count for a provider
   */
  async incrementProviderViews(providerId) {
    try {
      if (!ObjectId.isValid(providerId)) {
        throw new Error('Invalid provider ID');
      }

      await this.serviceProviders.updateOne(
        { _id: new ObjectId(providerId) },
        {
          $inc: { viewCount: 1 },
          $set: { lastActiveAt: new Date() }
        }
      );

      return true;

    } catch (error) {
      console.error('Error incrementing provider views:', error);
      return false;
    }
  }

  /**
   * Increment contact count for a provider
   */
  async incrementProviderContacts(providerId) {
    try {
      if (!ObjectId.isValid(providerId)) {
        throw new Error('Invalid provider ID');
      }

      await this.serviceProviders.updateOne(
        { _id: new ObjectId(providerId) },
        {
          $inc: { contactCount: 1 },
          $set: { lastActiveAt: new Date() }
        }
      );

      return true;

    } catch (error) {
      console.error('Error incrementing provider contacts:', error);
      return false;
    }
  }

  /**
   * Get provider by user ID
   */
  async getProviderByUserId(userId) {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      const provider = await this.serviceProviders.findOne({
        userId: new ObjectId(userId)
      });

      return provider;

    } catch (error) {
      console.error('Error getting provider by user ID:', error);
      throw error;
    }
  }
}

module.exports = MarketplaceService;