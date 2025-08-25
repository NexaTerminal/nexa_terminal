const NodeCache = require('node-cache');

// Create cache instance with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300 });

// Cache middleware for API responses
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Skip caching for POST, PUT, DELETE requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache_${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original json function
    const originalJson = res.json;

    // Override json function to cache response
    res.json = function(data) {
      cache.set(key, data, duration);
      return originalJson.call(this, data);
    };

    next();
  };
};

// Clear cache by pattern
const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  cache.del(matchingKeys);
};

module.exports = {
  cacheMiddleware,
  clearCache,
  cache
};