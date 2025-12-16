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
        specializations: additionalData.specializations || [],
        location: user.companyInfo.address?.split(',')[0]?.trim() || '',
        createdBy: null, // Auto-created from user verification
        createdAt: now,
        updatedAt: now
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
      // NO VALIDATION for admin creation - admins can add anything

      // Only check if email already exists
      const existingProvider = await this.serviceProviders.findOne({
        email: providerData.email
      });

      if (existingProvider) {
        throw new Error('Service provider with this email already exists');
      }

      const now = new Date();

      // Handle location - extract city string
      let locationData = '';
      if (typeof providerData.location === 'string') {
        locationData = providerData.location.trim();
      } else if (providerData.location?.city) {
        locationData = providerData.location.city.trim();
      }

      const newProvider = {
        userId: null, // Admin-created providers don't link to users
        name: providerData.name || '',
        email: providerData.email || '',
        phone: providerData.phone || '',
        website: providerData.website || '',
        serviceCategory: providerData.serviceCategory || 'other',
        specializations: providerData.specializations || [],
        location: locationData,
        createdBy: adminId,
        createdAt: now,
        updatedAt: now
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
      const { _id, userId, createdAt, createdBy, ...allowedUpdates } = updateData;

      const updateDoc = {
        ...allowedUpdates,
        updatedAt: new Date()
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
   * Get providers by category
   */
  async getProvidersByCategory(category) {
    try {
      const query = { serviceCategory: category };

      const providers = await this.serviceProviders.find(query)
        .sort({ updatedAt: -1 })
        .toArray();

      return providers;

    } catch (error) {
      console.error('Error getting providers by category:', error);
      throw error;
    }
  }

  /**
   * Get service providers with filters and pagination (enhanced)
   */
  async getServiceProviders(filters = {}, pagination = {}) {
    try {
      console.log('📋 MarketplaceService.getServiceProviders called');
      console.log('Input filters:', JSON.stringify(filters, null, 2));
      console.log('Input pagination:', JSON.stringify(pagination, null, 2));

      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = pagination;
      const skip = (page - 1) * limit;

      // Build query from filters
      const query = {};
      console.log('Initial query:', query);

      if (filters.serviceCategory) {
        query.serviceCategory = filters.serviceCategory;
      }

      if (filters.location) {
        query.location = new RegExp(filters.location, 'i');
      }

      if (filters.search) {
        query.$or = [
          { name: new RegExp(filters.search, 'i') },
          { email: new RegExp(filters.search, 'i') },
          { specializations: { $in: [new RegExp(filters.search, 'i')] } }
        ];
      }

      console.log('Final query for database:', JSON.stringify(query, null, 2));
      console.log('Sort:', { [sortBy]: sortOrder });
      console.log('Skip:', skip, 'Limit:', limit);

      // Get providers with pagination
      const providers = await this.serviceProviders
        .find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();

      console.log('Raw providers from DB:', providers.length);
      if (providers.length > 0) {
        console.log('First provider sample:', JSON.stringify(providers[0], null, 2));
      }

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

  // ==================== ENHANCED DYNAMIC CATEGORY MANAGEMENT ====================

  /**
   * Get providers by category (for offer request distribution)
   */
  async getActiveProvidersByCategory(category) {
    try {
      const providers = await this.serviceProviders.find({
        serviceCategory: category
      }).toArray();

      return providers;

    } catch (error) {
      console.error('Error getting providers by category:', error);
      throw error;
    }
  }

  /**
   * Get only categories that have providers (for dynamic dropdown)
   */
  async getActiveCategoriesOnly() {
    try {
      const activeCategories = await this.serviceProviders.distinct('serviceCategory');

      // Map to include both English and Macedonian labels
      const categoriesWithLabels = activeCategories.map(category => {
        const categoryInfo = utils.getServiceCategory(category);
        return {
          value: category,
          label: categoryInfo ? categoryInfo.en : category,
          labelMk: categoryInfo ? categoryInfo.mk : category
        };
      }).filter(cat => cat.label); // Remove any invalid categories

      return categoriesWithLabels;

    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Add provider manually (admin only - enhanced version)
   */
  async addProviderManually(providerData, adminId) {
    try {
      // Validate admin ID
      if (!ObjectId.isValid(adminId)) {
        throw new Error('Неважечки admin ID');
      }

      // Enhanced validation for manual provider creation
      const validationErrors = validators.validateServiceProvider(providerData);
      if (validationErrors.length > 0) {
        throw new Error(`Валидација неуспешна: ${validationErrors.join(', ')}`);
      }

      // Check for duplicate email
      const existingProvider = await this.serviceProviders.findOne({
        email: providerData.email
      });

      if (existingProvider) {
        throw new Error('Провајдер со оваа email адреса веќе постои');
      }

      const now = new Date();

      // Extract city string from location
      let locationString = '';
      if (typeof providerData.location === 'string') {
        locationString = providerData.location;
      } else if (providerData.location?.city) {
        locationString = providerData.location.city;
      }

      const newProvider = {
        name: providerData.name,
        email: providerData.email,
        phone: providerData.phone || '',
        website: providerData.website || '',
        serviceCategory: providerData.serviceCategory,
        specializations: providerData.specializations || [],
        location: locationString,
        createdBy: new ObjectId(adminId),
        createdAt: now,
        updatedAt: now
      };

      const result = await this.serviceProviders.insertOne(newProvider);
      return { ...newProvider, _id: result.insertedId };

    } catch (error) {
      console.error('Error adding provider manually:', error);
      throw error;
    }
  }

  /**
   * Get service categories for offer requests (only show categories with active providers)
   */
  async getServiceCategoriesForOfferRequests() {
    try {
      const activeCategories = await this.getActiveCategoriesOnly();
      return activeCategories;
    } catch (error) {
      console.error('Error getting service categories for offer requests:', error);
      return [];
    }
  }

  // ==================== SERVICE CATEGORIES (LEGACY METHODS) ====================

  /**
   * Get all predefined service categories (legacy method)
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

  /**
   * Check if category has providers
   */
  async isCategoryActive(categoryName) {
    try {
      const count = await this.serviceProviders.countDocuments({
        serviceCategory: categoryName
      });
      return count > 0;
    } catch (error) {
      console.error('Error checking if category has providers:', error);
      return false;
    }
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

      // Most recent providers
      const recentProviders = await this.serviceProviders
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      return {
        providers: {
          total: await this.serviceProviders.countDocuments()
        },
        categories: categoryStats,
        recentProviders: recentProviders.map(p => ({
          _id: p._id,
          name: p.name,
          category: p.serviceCategory,
          createdAt: p.createdAt
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
          joinedDate: provider.createdAt,
          lastUpdated: provider.updatedAt
        }
      };

    } catch (error) {
      console.error('Error getting provider performance:', error);
      throw error;
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