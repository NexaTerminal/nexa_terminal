const MarketingPost = require('../models/MarketingPost');

class MarketingController {
  async create(req, res) {
    try {
      // Only allow admin users
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const { imageUrl, quote, websiteLink } = req.body;
      if (!imageUrl || !quote || !websiteLink) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      const db = req.app.locals.db;
      const marketingModel = new MarketingPost(db);
      const post = await marketingModel.create({ imageUrl, quote, websiteLink });
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  async getLatest(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 3;
      const db = req.app.locals.db;
      const marketingModel = new MarketingPost(db);
      const posts = await marketingModel.getLatest(limit);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = new MarketingController(); 