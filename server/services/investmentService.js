// Native MongoDB Investment Service
// Replaces Mongoose Investment model with native MongoDB operations

const { ObjectId } = require('mongodb');
const { InvestmentIndexes, validateInvestment, sanitizeInvestment } = require('../models/Investment');

class InvestmentService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('investments');
    this.setupIndexes();
  }

  // Setup database indexes for efficient querying
  async setupIndexes() {
    try {
      // Create indexes based on Investment model definition
      for (const index of InvestmentIndexes) {
        await this.collection.createIndex(index.key, { name: index.name });
      }
      
    } catch (error) {
      // Index creation error handled silently
    }
  }

  // Create a new investment opportunity
  async createInvestment(investmentData) {
    // Validate investment data
    const validation = validateInvestment(investmentData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize and prepare investment data
    const sanitizedInvestment = sanitizeInvestment(investmentData);

    const result = await this.collection.insertOne(sanitizedInvestment);
    return { ...sanitizedInvestment, _id: result.insertedId };
  }

  // Find investment by ID
  async findById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  // Get all investments with filtering and pagination
  async getAllInvestments(options = {}) {
    const {
      page = 1,
      limit = 20,
      filter = {},
      sort = { createdAt: -1 },
      populateAuthor = false
    } = options;

    const skip = (page - 1) * limit;
    const query = { ...filter };

    let investments;
    if (populateAuthor) {
      investments = await this.collection.aggregate([
        { $match: query },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [
              {
                $project: {
                  email: 1,
                  companyInfo: 1,
                  isVerified: 1
                }
              }
            ]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
      ]).toArray();
    } else {
      investments = await this.collection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
    }

    const total = await this.collection.countDocuments(query);
    return { investments, total, page: parseInt(page), limit: parseInt(limit) };
  }

  // Get investments by type
  async getInvestmentsByType(type, options = {}) {
    return await this.getAllInvestments({
      ...options,
      filter: { type }
    });
  }

  // Get investments by status
  async getInvestmentsByStatus(status, options = {}) {
    return await this.getAllInvestments({
      ...options,
      filter: { status }
    });
  }

  // Get investments by author
  async getInvestmentsByAuthor(authorId, options = {}) {
    return await this.getAllInvestments({
      ...options,
      filter: { author: new ObjectId(authorId) }
    });
  }

  // Get investments by location
  async getInvestmentsByLocation(location, options = {}) {
    return await this.getAllInvestments({
      ...options,
      filter: { location: { $regex: location, $options: 'i' } }
    });
  }

  // Update investment
  async updateInvestment(id, updateData) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid investment ID');
    }

    // Sanitize update data
    const sanitizedUpdate = sanitizeInvestment(updateData);
    delete sanitizedUpdate._id; // Remove _id from update data

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: sanitizedUpdate },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Delete investment
  async deleteInvestment(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid investment ID');
    }

    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Search investments
  async searchInvestments(searchTerm, options = {}) {
    const searchQuery = {
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await this.getAllInvestments({
      ...options,
      filter: searchQuery
    });
  }

  // Get investment statistics
  async getInvestmentStats(authorId = null) {
    const matchStage = authorId ? { author: new ObjectId(authorId) } : {};

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalInvestments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          openInvestments: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          closedInvestments: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          pendingInvestments: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result[0] || {
      totalInvestments: 0,
      totalAmount: 0,
      avgAmount: 0,
      openInvestments: 0,
      closedInvestments: 0,
      pendingInvestments: 0
    };
  }

  // Count documents (for compatibility)
  async countDocuments(filter = {}) {
    return await this.collection.countDocuments(filter);
  }

  // Get distinct values (for compatibility)
  async distinct(field, filter = {}) {
    return await this.collection.distinct(field, filter);
  }

  // Aggregate (for compatibility)
  async aggregate(pipeline) {
    return await this.collection.aggregate(pipeline).toArray();
  }
}

module.exports = InvestmentService;
