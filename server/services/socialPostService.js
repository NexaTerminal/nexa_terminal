// Native MongoDB SocialPost Service
// Replaces Mongoose SocialPost model with native MongoDB operations

const { ObjectId } = require('mongodb');
const { SocialPostIndexes, validateSocialPost, sanitizeSocialPost } = require('../models/SocialPost');

class SocialPostService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('socialposts');
    this.setupIndexes();
  }

  // Setup database indexes for efficient querying
  async setupIndexes() {
    try {
      // Create indexes based on SocialPost model definition
      for (const index of SocialPostIndexes) {
        await this.collection.createIndex(index.key, { name: index.name });
      }
      
    } catch (error) {
      // Index creation error handled silently
    }
  }

  // Create a new social post
  async createPost(postData) {
    // Validate post data
    const validation = validateSocialPost(postData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize and prepare post data
    const sanitizedPost = sanitizeSocialPost(postData);

    const result = await this.collection.insertOne(sanitizedPost);
    return { ...sanitizedPost, _id: result.insertedId };
  }

  // Find post by ID
  async findById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  // Get all posts with filtering and pagination
  async getAllPosts(options = {}) {
    const {
      page = 1,
      limit = 20,
      filter = {},
      sort = { createdAt: -1 },
      populateAuthor = false
    } = options;

    const skip = (page - 1) * limit;
    const query = { ...filter };

    let posts;
    if (populateAuthor) {
      posts = await this.collection.aggregate([
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
                  companyInfo: 1,
                  profileImage: 1,
                  email: 1,
                  isVerified: 1
                }
              }
            ]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
      ]).toArray();
    } else {
      posts = await this.collection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
    }

    const total = await this.collection.countDocuments(query);
    return { posts, total, page: parseInt(page), limit: parseInt(limit) };
  }

  // Get posts by author
  async getPostsByAuthor(authorId, options = {}) {
    const { page = 1, limit = 20 } = options;
    return await this.getAllPosts({
      ...options,
      filter: { author: new ObjectId(authorId) }
    });
  }

  // Update post
  async updatePost(id, updateData) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid post ID');
    }

    const updateDoc = {
      ...updateData,
      updatedAt: new Date()
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Delete post
  async deletePost(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid post ID');
    }

    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Like/Unlike post
  async toggleLike(postId, userId) {
    if (!ObjectId.isValid(postId) || !ObjectId.isValid(userId)) {
      throw new Error('Invalid post or user ID');
    }

    const post = await this.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const userObjectId = new ObjectId(userId);
    const isLiked = post.likes.some(like => like.user.toString() === userId);

    let updateDoc;
    if (isLiked) {
      // Remove like
      updateDoc = {
        $pull: { likes: { user: userObjectId } },
        $set: { updatedAt: new Date() }
      };
    } else {
      // Add like
      updateDoc = {
        $push: { likes: { user: userObjectId, likedAt: new Date() } },
        $set: { updatedAt: new Date() }
      };
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      updateDoc,
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Add comment to post
  async addComment(postId, commentData) {
    if (!ObjectId.isValid(postId)) {
      throw new Error('Invalid post ID');
    }

    const comment = {
      _id: new ObjectId(),
      user: new ObjectId(commentData.userId),
      comment: commentData.comment?.trim(),
      commentedAt: new Date()
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { 
        $push: { comments: comment },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Remove comment from post
  async removeComment(postId, commentId) {
    if (!ObjectId.isValid(postId) || !ObjectId.isValid(commentId)) {
      throw new Error('Invalid post or comment ID');
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { 
        $pull: { comments: { _id: new ObjectId(commentId) } },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Approve/Reject post
  async updateApprovalStatus(postId, isApproved) {
    return await this.updatePost(postId, { isApproved });
  }

  // Get post statistics
  async getPostStats(authorId = null) {
    const matchStage = authorId ? { author: new ObjectId(authorId) } : {};

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          approvedPosts: { $sum: { $cond: ['$isApproved', 1, 0] } },
          pendingPosts: { $sum: { $cond: [{ $not: '$isApproved' }, 1, 0] } },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
        }
      }
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return result[0] || {
      totalPosts: 0,
      approvedPosts: 0,
      pendingPosts: 0,
      totalLikes: 0,
      totalComments: 0
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

module.exports = SocialPostService;
