const { ObjectId } = require('mongodb');

class InvestmentController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getAllInvestments = this.getAllInvestments.bind(this);
    this.getInvestmentById = this.getInvestmentById.bind(this);
    this.createInvestment = this.createInvestment.bind(this);
    this.updateInvestment = this.updateInvestment.bind(this);
    this.deleteInvestment = this.deleteInvestment.bind(this);
    this.getSectors = this.getSectors.bind(this);
    this.getLocations = this.getLocations.bind(this);
  }

  // Get all investments with filtering and pagination
  async getAllInvestments(req, res) {
    try {
      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');
      
      // Query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sector = req.query.sector;
      const location = req.query.location;
      const riskLevel = req.query.riskLevel;
      const minAmount = parseInt(req.query.minAmount);
      const maxAmount = parseInt(req.query.maxAmount);
      const search = req.query.search;
      
      // Build query
      const query = {};
      if (sector) query.sector = sector;
      if (location) query.location = location;
      if (riskLevel) query.riskLevel = riskLevel;
      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = minAmount;
        if (maxAmount) query.amount.$lte = maxAmount;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get total count for pagination
      const totalInvestments = await investmentsCollection.countDocuments(query);
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalInvestments / limit);
      
      // Fetch investments
      const investments = await investmentsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      res.json({
        investments,
        pagination: {
          currentPage: page,
          totalPages,
          totalInvestments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching investments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get single investment by ID
  async getInvestmentById(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid investment ID' });
      }
      
      // Increment views and get the investment
      const result = await investmentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { views: 1 } },
        { returnDocument: 'after' }
      );
      
      if (!result.value) {
        return res.status(404).json({ message: 'Investment not found' });
      }
      
      res.json(result.value);
    } catch (error) {
      console.error('Error fetching investment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new investment (admin only)
  async createInvestment(req, res) {
    try {
      const {
        title,
        description,
        amount,
        duration,
        returnRate,
        riskLevel,
        sector,
        location,
        requirements,
        status = 'active'
      } = req.body;

      // Validation
      if (!title || !description || !amount || !sector) {
        return res.status(400).json({ 
          message: 'Title, description, amount, and sector are required' 
        });
      }

      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const newInvestment = {
        title: title.trim(),
        description: description.trim(),
        summary: description.trim().substring(0, 200) + '...', // For social feed display
        amount: parseFloat(amount),
        minInvestment: parseFloat(amount), // For display purposes
        duration: duration || '',
        returnRate: returnRate || '',
        riskLevel: riskLevel || 'medium',
        sector: sector.trim(),
        location: location || '',
        requirements: requirements || '',
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        author: req.user._id // Add the admin user as author
      };

      const result = await investmentsCollection.insertOne(newInvestment);
      const createdInvestment = await investmentsCollection.findOne({ _id: result.insertedId });

      // Create a social post for the new investment
      try {
        const socialPostsCollection = db.collection('socialPosts');
        const socialPost = {
          content: `Нова инвестициона можност: ${title}`,
          type: 'admin_investment',
          author: req.user._id,
          investmentId: result.insertedId,
          createdAt: new Date(),
          updatedAt: new Date(),
          likes: [],
          comments: [],
          shares: 0
        };
        await socialPostsCollection.insertOne(socialPost);
      } catch (socialError) {
        console.error('Error creating social post for investment:', socialError);
        // Don't fail the investment creation if social post fails
      }

      res.status(201).json({
        message: 'Investment created successfully',
        investment: createdInvestment
      });
    } catch (error) {
      console.error('Error creating investment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update investment (admin only)
  async updateInvestment(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid investment ID' });
      }

      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.views;
      
      // Add updated timestamp
      updateData.updatedAt = new Date();

      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const result = await investmentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Investment not found' });
      }

      res.json({
        message: 'Investment updated successfully',
        investment: result.value
      });
    } catch (error) {
      console.error('Error updating investment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete investment (admin only)
  async deleteInvestment(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid investment ID' });
      }

      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const result = await investmentsCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Investment not found' });
      }

      res.json({ message: 'Investment deleted successfully' });
    } catch (error) {
      console.error('Error deleting investment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all sectors
  async getSectors(req, res) {
    try {
      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const sectors = await investmentsCollection.distinct('sector');
      res.json(sectors);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all locations
  async getLocations(req, res) {
    try {
      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const locations = await investmentsCollection.distinct('location');
      res.json(locations.filter(location => location && location.trim() !== ''));
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new InvestmentController();
