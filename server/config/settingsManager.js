const path = require('path');
const fs = require('fs');

class SettingsManager {
  constructor() {
    this.settings = null;
    this.environment = process.env.NODE_ENV || 'development';
    this.loadSettings();
  }

  loadSettings() {
    try {
      // Check for production override
      if (process.env.NODE_ENV === 'production' || process.env.NEXA_ALL_FEATURES === 'true') {
        this.settings = this.getDefaultSettings();
        // Enable all features in production
        this.settings.features = {
          authentication: true,
          documentAutomation: true,
          profileCompletion: true,
          socialPosts: true,
          legalHealthCheck: true,
          blog: true
        };
        return;
      }

      // Load from VS Code settings (development mode)
      const vscodeSettingsPath = path.join(__dirname, '../../.vscode/settings.json');
      if (fs.existsSync(vscodeSettingsPath)) {
        const vscodeContent = fs.readFileSync(vscodeSettingsPath, 'utf8');
        // Remove comments from JSON (simple regex for // comments)
        const cleanJson = vscodeContent.replace(/\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
        const vscodeSettings = JSON.parse(cleanJson);
        this.settings = this.extractNexaSettings(vscodeSettings);
      } else {
        // Fallback to production settings if no local settings
        this.settings = this.getDefaultSettings();
      }
      
    } catch (error) {
      console.error('❌ Failed to load settings:', error.message);
      // Fallback to production settings for safety
      this.settings = this.getDefaultSettings();
    }
  }

  extractNexaSettings(vscodeSettings) {
    // Convert simple boolean structure to expected format
    const features = vscodeSettings['nexa.features'] || {};
    const middleware = vscodeSettings['nexa.middleware'] || {};
    
    return {
      environment: this.environment,
      features: features,
      // Map features to routes automatically
      routes: {
        auth: true, // Always enabled
        profile: features.profileCompletion || features.authentication,
        documents: features.documentAutomation,
        social: features.socialPosts,
        blog: features.blog,
        legal: features.legalHealthCheck
      },
      // Map features to collections automatically  
      database: {
        collections: {
          users: true, // Always needed
          sessions: true, // Always needed for auth
          documents: features.documentAutomation,
          templates: features.documentAutomation,
          social_posts: features.socialPosts,
          blogs: features.blog,
          legal_checks: features.legalHealthCheck
        }
      },
      // Use middleware settings from VS Code
      middleware: {
        authentication: middleware.authentication !== false, // Default true
        validation: middleware.validation !== false, // Default true
        security: middleware.security !== false, // Default true
        cors: middleware.cors !== false, // Default true
        csrf: middleware.csrf !== false, // Default true for security
        rateLimit: middleware.rateLimit !== false, // Default true
        fileUpload: middleware.fileUpload === true, // Default false
        analytics: middleware.analytics === true // Default false
      }
    };
  }

  getDefaultSettings() {
    return {
      features: {
        authentication: true,
        documentAutomation: true,
        profileCompletion: true,
        socialPosts: true,
        legalHealthCheck: true,
        blog: true  // Enable blogs for online version
      },
      database: {
        collections: {
          users: true,
          sessions: true,
          documents: true,
          templates: true,
          social_posts: true,
          blogs: true,  // Enable blogs collection
          legal_checks: true
        }
      },
      routes: {
        auth: true,
        profile: true,
        documents: true,
        social: true,
        blog: true,  // Enable blog routes
        legal: true
      },
      middleware: {
        authentication: true,
        validation: true,
        security: true,
        cors: true,
        csrf: true,
        rateLimit: true,
        fileUpload: true,  // Enable for document/social features
        analytics: false
      }
    };
  }

  // Check if a feature is enabled (now works with simple boolean values)
  isFeatureEnabled(featureName) {
    return this.settings?.features?.[featureName] === true;
  }

  // Check if a route should be loaded
  isRouteEnabled(routeName) {
    return this.settings?.routes?.[routeName] || false;
  }

  // Check if middleware should be loaded
  isMiddlewareEnabled(middlewareName) {
    return this.settings?.middleware?.[middlewareName] || false;
  }

  // Check if database collection should be initialized
  isCollectionEnabled(collectionName) {
    return this.settings?.database?.collections?.[collectionName] || false;
  }

  // Get all enabled features (updated for simple boolean structure)
  getEnabledFeatures() {
    if (!this.settings?.features) return [];
    
    return Object.entries(this.settings.features)
      .filter(([, enabled]) => enabled === true)
      .map(([name]) => ({ name, enabled: true }));
  }

  // Get all enabled routes
  getEnabledRoutes() {
    if (!this.settings?.routes) return [];
    
    return Object.entries(this.settings.routes)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
  }

  // Update feature status (updated for simple boolean structure)
  toggleFeature(featureName, enabled = null) {
    if (!this.settings?.features?.hasOwnProperty(featureName)) {
      console.warn(`⚠️  Feature '${featureName}' not found in settings`);
      return false;
    }

    if (enabled === null) {
      // Toggle current state
      this.settings.features[featureName] = !this.settings.features[featureName];
    } else {
      this.settings.features[featureName] = enabled;
    }

    return this.settings.features[featureName];
  }

  // Get current environment
  getEnvironment() {
    return this.settings.environment;
  }

  // Get all settings
  getAllSettings() {
    return this.settings;
  }
}

// Create singleton instance
const settingsManager = new SettingsManager();

module.exports = settingsManager;
