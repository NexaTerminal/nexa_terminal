/**
 * MarketplaceController - HTTP request handlers for marketplace functionality
 */

const MarketplaceService = require('../services/marketplaceService');

class MarketplaceController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.createServiceProvider = this.createServiceProvider.bind(this);
    this.getServiceProviders = this.getServiceProviders.bind(this);
    this.getServiceProviderById = this.getServiceProviderById.bind(this);
    this.updateServiceProvider = this.updateServiceProvider.bind(this);
    this.updateProviderStatus = this.updateProviderStatus.bind(this);
    this.deleteServiceProvider = this.deleteServiceProvider.bind(this);
    this.getServiceCategories = this.getServiceCategories.bind(this);
    this.getServiceCategory = this.getServiceCategory.bind(this);
    this.getMarketplaceAnalytics = this.getMarketplaceAnalytics.bind(this);
    this.getProviderPerformance = this.getProviderPerformance.bind(this);
    this.incrementProviderViews = this.incrementProviderViews.bind(this);
    this.incrementProviderContacts = this.incrementProviderContacts.bind(this);
  }

  // ==================== SERVICE PROVIDERS ====================

  /**
   * Create a new service provider (Admin only - simplified)
   */
  async createServiceProvider(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const adminId = req.user.id;

      const {
        name,
        email,
        phone,
        website,
        serviceCategory,
        specializations,
        description,
        location,
        businessInfo,
        servesRemote
      } = req.body;

      // Validate required fields
      if (!name || !email || !serviceCategory || !location?.city) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, email, serviceCategory, location.city'
        });
      }

      const providerData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim(),
        website: website?.trim(),
        serviceCategory: serviceCategory.trim(),
        specializations: specializations || [],
        description: description?.trim(),
        location: {
          city: location.city?.trim(),
          region: location.region?.trim(),
          country: location.country?.trim() || 'Macedonia',
          servesRemote: servesRemote || false
        },
        businessInfo: {
          registrationNumber: businessInfo?.registrationNumber?.trim(),
          taxNumber: businessInfo?.taxNumber?.trim(),
          languagesSupported: businessInfo?.languagesSupported || ['mk', 'en']
        }
      };

      const newProvider = await marketplaceService.createServiceProvider(providerData, adminId);

      res.status(201).json({
        success: true,
        message: 'Service provider created successfully',
        data: newProvider
      });

    } catch (error) {
      console.error('Error in createServiceProvider:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create service provider'
      });
    }
  }

  /**
   * Get service providers with filters and pagination
   */
  async getServiceProviders(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);

      const filters = {
        isActive: req.query.active !== undefined ? req.query.active === 'true' : undefined,
        serviceCategory: req.query.category,
        location: req.query.location,
        search: req.query.search,
        includeInactive: req.user.isAdmin // Only admins can see inactive providers
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder === 'asc' ? 1 : -1
      };

      const result = await marketplaceService.getServiceProviders(filters, pagination);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error in getServiceProviders:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get service providers'
      });
    }
  }

  /**
   * Get service provider by ID
   */
  async getServiceProviderById(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const { id } = req.params;

      const provider = await marketplaceService.getServiceProviderById(id);

      res.json({
        success: true,
        data: provider
      });

    } catch (error) {
      console.error('Error in getServiceProviderById:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Service provider not found'
      });
    }
  }

  /**
   * Update service provider (Admin only)
   */
  async updateServiceProvider(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const { id } = req.params;
      const adminId = req.user.id;

      // Remove fields that shouldn't be updated directly
      const { _id, createdAt, createdBy, performanceMetrics, ...updateData } = req.body;

      const updatedProvider = await marketplaceService.updateServiceProvider(id, updateData, adminId);

      res.json({
        success: true,
        message: 'Service provider updated successfully',
        data: updatedProvider
      });

    } catch (error) {
      console.error('Error in updateServiceProvider:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update service provider'
      });
    }
  }

  /**
   * Update service provider status (Admin only - simplified enable/disable)
   */
  async updateProviderStatus(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const { id } = req.params;
      const { isActive, notes } = req.body;
      const adminId = req.user.id;

      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isActive status is required'
        });
      }

      const updatedProvider = await marketplaceService.updateProviderStatus(id, isActive, adminId, notes);

      res.json({
        success: true,
        message: `Service provider ${isActive ? 'enabled' : 'disabled'} successfully`,
        data: updatedProvider
      });

    } catch (error) {
      console.error('Error in updateProviderStatus:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update provider status'
      });
    }
  }

  /**
   * Delete service provider (Admin only)
   */
  async deleteServiceProvider(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const { id } = req.params;
      const adminId = req.user.id;

      const result = await marketplaceService.deleteServiceProvider(id, adminId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Error in deleteServiceProvider:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete service provider'
      });
    }
  }

  // ==================== SERVICE CATEGORIES ====================

  /**
   * Get all predefined service categories
   */
  async getServiceCategories(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const language = req.query.lang || 'en';

      const categories = marketplaceService.getServiceCategories(language);

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Error in getServiceCategories:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get service categories'
      });
    }
  }

  /**
   * Get specific service category by name
   */
  async getServiceCategory(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const { name } = req.params;

      const category = marketplaceService.getServiceCategory(name);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Service category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });

    } catch (error) {
      console.error('Error in getServiceCategory:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get service category'
      });
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get marketplace analytics (Admin only)
   */
  async getMarketplaceAnalytics(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);

      const dateRange = {};
      if (req.query.startDate) {
        dateRange.startDate = req.query.startDate;
      }
      if (req.query.endDate) {
        dateRange.endDate = req.query.endDate;
      }

      const analytics = await marketplaceService.getMarketplaceAnalytics(dateRange);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error in getMarketplaceAnalytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get marketplace analytics'
      });
    }
  }

  /**
   * Get provider performance metrics (simplified)
   */
  async getProviderPerformance(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const { id } = req.params;

      const performance = await marketplaceService.getProviderPerformance(id);

      res.json({
        success: true,
        data: performance
      });

    } catch (error) {
      console.error('Error in getProviderPerformance:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Failed to get provider performance'
      });
    }
  }

  /**
   * Increment provider view count
   */
  async incrementProviderViews(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const { id } = req.params;

      await marketplaceService.incrementProviderViews(id);

      res.json({
        success: true,
        message: 'View count incremented'
      });

    } catch (error) {
      console.error('Error in incrementProviderViews:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to increment view count'
      });
    }
  }

  /**
   * Increment provider contact count
   */
  async incrementProviderContacts(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const { id } = req.params;

      await marketplaceService.incrementProviderContacts(id);

      res.json({
        success: true,
        message: 'Contact count incremented'
      });

    } catch (error) {
      console.error('Error in incrementProviderContacts:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to increment contact count'
      });
    }
  }
}

module.exports = new MarketplaceController();