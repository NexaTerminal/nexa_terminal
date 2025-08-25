const { ObjectId } = require('mongodb');

// MarketingPost model for MongoDB native driver
class MarketingPost {
  constructor(db) {
    this.collection = db.collection('marketingPosts');
  }

  async create({ imageUrl, quote, websiteLink }) {
    const doc = {
      imageUrl,
      quote,
      websiteLink,
      createdAt: new Date(),
    };
    const result = await this.collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async getLatest(limit = 3) {
    return await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
}

module.exports = MarketingPost; 