const UserService = require('../services/userService');
const { ObjectId } = require('mongodb');

class SocialController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getNewsfeed = this.getNewsfeed.bind(this);
    this.createPost = this.createPost.bind(this);
    this.updatePost = this.updatePost.bind(this);
    this.deletePost = this.deletePost.bind(this);
    this.likePost = this.likePost.bind(this);
    this.commentOnPost = this.commentOnPost.bind(this);
    this.getUserPosts = this.getUserPosts.bind(this);
    this.getPostById = this.getPostById.bind(this);
  }

  // Get all posts for newsfeed
  async getNewsfeed(req, res) {
    try {
      const { page = 1, limit = 20, filter = 'all' } = req.query;
      const skip = (page - 1) * limit;

      let matchCondition = { isApproved: true };

      // Apply filters
      if (filter === 'posts') {
        matchCondition.postType = 'user_post';
      } else if (filter === 'investments') {
        matchCondition.postType = 'admin_investment';
      } else if (filter === 'blogs') {
        matchCondition.postType = 'admin_blog';
      }

      const db = req.app.locals.db;
      const socialPostsCollection = db.collection('socialposts');

      // Performance optimization: Use aggregation pipeline for better performance
      const aggregationPipeline = [
        { $match: matchCondition },
        { $sort: { createdAt: -1 } },
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
                  email: 1
                }
              }
            ]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ['$likes', []] } },
            commentsCount: { $size: { $ifNull: ['$comments', []] } }
          }
        }
      ];

      const posts = await socialPostsCollection.aggregate(aggregationPipeline).toArray();

      // Get total count for pagination
      const totalPosts = await socialPostsCollection.countDocuments(matchCondition);

      res.json({
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: skip + posts.length < totalPosts,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching newsfeed:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create a new post
  async createPost(req, res) {
    try {
      const { content, postType = 'user_post', image, title } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Content is required' });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const socialPostsCollection = db.collection('socialposts');

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;
      if (!userId) {
        return res.status(401).json({ message: 'User authentication error' });
      }

      // Get user info
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const newPost = {
        content: content.trim(),
        postType,
        title: title || null,
        author: new ObjectId(userId),
        image: image || null,
        likes: [],
        comments: [],
        isApproved: true, // All posts are auto-approved now
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await socialPostsCollection.insertOne(newPost);
      
      // Get the created post with populated author information (like in newsfeed)
      const aggregationPipeline = [
        { $match: { _id: result.insertedId } },
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
                  email: 1
                }
              }
            ]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ['$likes', []] } },
            commentsCount: { $size: { $ifNull: ['$comments', []] } }
          }
        }
      ];

      const [createdPost] = await socialPostsCollection.aggregate(aggregationPipeline).toArray();

      res.status(201).json({
        message: 'Post created successfully',
        post: createdPost
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update a post
  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { content, title, image } = req.body;

      const db = req.app.locals.db;
      const socialPostsCollection = db.collection('socialposts');

      // Find the post
      const post = await socialPostsCollection.findOne({ _id: new ObjectId(id) });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;
      
      // Check if user owns the post or is admin
      if (post.author.toString() !== userId.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'You can only edit your own posts' });
      }

      const updateData = {
        updatedAt: new Date()
      };

      if (content !== undefined) updateData.content = content.trim();
      if (title !== undefined) updateData.title = title;
      if (image !== undefined) updateData.image = image;

      const result = await socialPostsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      res.json({
        message: 'Post updated successfully',
        post: result.value
      });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete a post
  async deletePost(req, res) {
    try {
      const { id } = req.params;

      const db = req.app.locals.db;
      const socialPostsCollection = db.collection('socialposts');

      // Find the post
      const post = await socialPostsCollection.findOne({ _id: new ObjectId(id) });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;
      
      // Check if user owns the post or is admin
      if (post.author.toString() !== userId.toString() && !req.user.isAdmin) {
        return res.status(403).json({ message: 'You can only delete your own posts' });
      }

      await socialPostsCollection.deleteOne({ _id: new ObjectId(id) });

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Like/unlike a post
  async likePost(req, res) {
    try {
      const { id } = req.params;
      
      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = new ObjectId(req.user.id || req.user._id);

      const db = req.app.locals.db;
      const socialPostsCollection = db.collection('socialposts');

      // Find the post
      const post = await socialPostsCollection.findOne({ _id: new ObjectId(id) });
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const likes = post.likes || [];
      const userLikedIndex = likes.findIndex(like => like.toString() === userId.toString());

      let updateOperation;
      let message;

      if (userLikedIndex > -1) {
        // User already liked, so unlike
        updateOperation = { $pull: { likes: userId } };
        message = 'Post unliked successfully';
      } else {
        // User hasn't liked, so like
        updateOperation = { $addToSet: { likes: userId } };
        message = 'Post liked successfully';
      }

      const result = await socialPostsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        updateOperation,
        { returnDocument: 'after' }
      );

      res.json({
        message,
        likesCount: result.value.likes ? result.value.likes.length : 0,
        isLiked: userLikedIndex === -1
      });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Comment on a post
  async commentOnPost(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Comment content is required' });
      }

      const db = req.app.locals.db;
      const userService = new UserService(db);
      const socialPostsCollection = db.collection('socialposts');

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;
      
      // Get user info
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const comment = {
        _id: new ObjectId(),
        content: content.trim(),
        author: {
          id: new ObjectId(userId),
          email: user.email || user.username,
          profileImage: user.profileImage || ''
        },
        createdAt: new Date()
      };

      const result = await socialPostsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $push: { comments: comment } },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.json({
        message: 'Comment added successfully',
        comment,
        commentsCount: result.value.comments ? result.value.comments.length : 0
      });
    } catch (error) {
      console.error('Error commenting on post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get user's posts
  async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const db = req.app.locals.db;
      const socialPostsCollection = db.collection('socialposts');

      const posts = await socialPostsCollection
        .find({ author: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      const totalPosts = await socialPostsCollection.countDocuments({ author: new ObjectId(userId) });

      res.json({
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: skip + posts.length < totalPosts,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get single post by ID
  async getPostById(req, res) {
    try {
      const { id } = req.params;

      const db = req.app.locals.db;
      const socialPostsCollection = db.collection('socialposts');

      const aggregationPipeline = [
        { $match: { _id: new ObjectId(id) } },
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
                  email: 1
                }
              }
            ]
          }
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ['$likes', []] } },
            commentsCount: { $size: { $ifNull: ['$comments', []] } }
          }
        }
      ];

      const posts = await socialPostsCollection.aggregate(aggregationPipeline).toArray();
      const post = posts[0];

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = SocialController;
