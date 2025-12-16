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
    this.deleteServiceProvider = this.deleteServiceProvider.bind(this);
    this.getServiceCategories = this.getServiceCategories.bind(this);
    this.getServiceCategory = this.getServiceCategory.bind(this);
    this.getMarketplaceAnalytics = this.getMarketplaceAnalytics.bind(this);
    this.getProviderPerformance = this.getProviderPerformance.bind(this);
    this.getActiveCategoriesOnly = this.getActiveCategoriesOnly.bind(this);
  }

  // ==================== SERVICE PROVIDERS ====================

  /**
   * Create a new service provider (Admin only - simplified)
   */
  async createServiceProvider(req, res) {
    try {
      console.log('🆕 POST /admin/marketplace/providers - Create provider request');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', { id: req.user?.id, isAdmin: req.user?.isAdmin });

      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const adminId = req.user.id;

      const {
        name,
        email,
        phone,
        website,
        serviceCategory,
        specializations,
        location
      } = req.body;

      // Minimal validation for admin creation
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required'
        });
      }

      // Check if provider already exists with this email
      const serviceProviders = req.app.locals.db.collection('service_providers');
      const existingProvider = await serviceProviders.findOne({ email: email.toLowerCase().trim() });
      if (existingProvider) {
        return res.status(400).json({
          success: false,
          message: `Service provider with email ${email} already exists. Use a different email.`
        });
      }

      const providerData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || '',
        website: website?.trim() || '',
        serviceCategory: serviceCategory?.trim() || 'legal',
        specializations: specializations || [],
        location: typeof location === 'string' ? location.trim() : (location?.city || location?.town || 'Скопје'),
        userId: null,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newProvider = await marketplaceService.createServiceProvider(providerData, adminId);

      res.status(201).json({
        success: true,
        message: 'Service provider created successfully',
        data: newProvider
      });

    } catch (error) {
      console.error('Error in createServiceProvider:', error);

      // Handle duplicate key error (email already exists)
      if (error.code === 11000) {
        const duplicateField = error.message.includes('email') ? 'email' : 'user';
        return res.status(400).json({
          success: false,
          message: `Service provider with this ${duplicateField} already exists`
        });
      }

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
      console.log('🔍 GET /admin/marketplace/providers - Request received');
      console.log('Query params:', req.query);
      console.log('User:', { id: req.user?.id, isAdmin: req.user?.isAdmin });

      const marketplaceService = new MarketplaceService(req.app.locals.db);

      const filters = {
        serviceCategory: req.query.category,
        location: req.query.location,
        search: req.query.search
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder === 'asc' ? 1 : -1
      };

      console.log('Filters being passed:', JSON.stringify(filters, null, 2));
      console.log('Pagination:', JSON.stringify(pagination, null, 2));

      const result = await marketplaceService.getServiceProviders(filters, pagination);

      console.log('Result from service:', JSON.stringify({
        providersCount: result.providers?.length || 0,
        totalCount: result.totalCount,
        hasProviders: result.providers && result.providers.length > 0
      }, null, 2));

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

  // ==================== ENHANCED CATEGORY MANAGEMENT ====================

  /**
   * Get only categories that have active providers (for dynamic dropdown)
   */
  async getActiveCategoriesOnly(req, res) {
    try {
      const marketplaceService = new MarketplaceService(req.app.locals.db);
      const activeCategories = await marketplaceService.getActiveCategoriesOnly();

      res.json(activeCategories);

    } catch (error) {
      console.error('Error in getActiveCategoriesOnly:', error);
      res.status(500).json({
        success: false,
        message: 'Грешка при добивање на активните категории',
        categories: []
      });
    }
  }
}

module.exports = new MarketplaceController();