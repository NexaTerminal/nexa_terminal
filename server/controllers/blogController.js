const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class BlogController {
  constructor() {
    // Configure multer for image uploads
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, 'public/uploads/blogs');
        },
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        }
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.'));
        }
      }
    });

    // Bind methods to preserve 'this' context
    this.getAllBlogs = this.getAllBlogs.bind(this);
    this.getBlogById = this.getBlogById.bind(this);
    this.getPublicBlogs = this.getPublicBlogs.bind(this);
    this.getPublicBlogById = this.getPublicBlogById.bind(this);
    this.createBlog = this.createBlog.bind(this);
    this.updateBlog = this.updateBlog.bind(this);
    this.deleteBlog = this.deleteBlog.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.getCategories = this.getCategories.bind(this);
    this.getTags = this.getTags.bind(this);
  }

  // Helper method to format content into proper paragraphs
  formatContentToParagraphs(content) {
    if (!content) return '';

    // If already has HTML tags, return as is
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<br>')) {
      return content;
    }

    // First, normalize line endings to \n
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split content by double line breaks first (explicit paragraph separators)
    let paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());

    // If we found double line breaks, use those as paragraph separators
    if (paragraphs.length > 1) {
      // For each paragraph, replace single line breaks with spaces (within paragraph)
      paragraphs = paragraphs.map(p =>
        p.replace(/\n/g, ' ')
         .replace(/\s+/g, ' ')
         .trim()
      ).filter(p => p);
    } else {
      // If no double line breaks, check for single line breaks
      const singleBreakParagraphs = content.split(/\n/).filter(p => p.trim());

      if (singleBreakParagraphs.length > 1) {
        // Use single line breaks as paragraph separators
        paragraphs = singleBreakParagraphs.map(p => p.trim()).filter(p => p);
      } else {
        // No line breaks at all - split by sentences for very long content
        if (content.length > 500) {
          const sentences = content.split(/(?<=[.!?])\s+(?=[А-ЯЀЁЂЃЄЅІЇЈЉЊЋЌЎЏA-Z])/);

          paragraphs = [];
          let currentParagraph = [];
          const sentencesPerParagraph = Math.max(2, Math.ceil(sentences.length / 4));

          sentences.forEach((sentence, index) => {
            currentParagraph.push(sentence.trim());

            if (currentParagraph.length >= sentencesPerParagraph || index === sentences.length - 1) {
              const paragraphText = currentParagraph.join(' ').trim();
              if (paragraphText) {
                paragraphs.push(paragraphText);
              }
              currentParagraph = [];
            }
          });
        } else {
          // Short content without line breaks - keep as single paragraph
          paragraphs = [content.trim()];
        }
      }
    }

    // Wrap each paragraph in <p> tags and preserve spacing
    return paragraphs
      .map(p => `<p>${p.trim()}</p>`)
      .join('\n\n');
  }

  // Get all blogs with filtering and pagination
  async getAllBlogs(req, res) {
    try {
      const { page = 1, limit = 10, category, tag, search, language } = req.query;

      // Build query based on filters
      let query = {};

      if (category) {
        query.category = category;
      }

      if (tag) {
        query.tags = { $in: [tag] };
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }

      if (language) {
        query.language = language;
      }

      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      // Execute query with pagination
      const totalBlogs = await blogsCollection.countDocuments(query);
      const blogs = await blogsCollection.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .toArray();

      // Transform blogs for response
      const transformedBlogs = blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        category: blog.category,
        tags: blog.tags || [],
        language: blog.contentLanguage || blog.language || 'en',
        featuredImage: blog.featuredImage,
        author: blog.author || { name: 'Unknown Author' },
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        status: blog.status || 'published',
        views: blog.views || 0,
        likes: blog.likes || 0
      }));

      res.json({
        blogs: transformedBlogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalBlogs,
          pages: Math.ceil(totalBlogs / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.status(500).json({ message: 'Error fetching blogs' });
    }
  }

  // Get single blog post by ID
  async getBlogById(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');
      
      const blog = await blogsCollection.findOne({ _id: id });
      
      if (!blog) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      // Transform old blog structure to new format
      let transformedBlog = blog;
      if (blog.summary && !blog.excerpt) {
        transformedBlog = {
          _id: blog._id,
          title: blog.title,
          content: blog.content,
          excerpt: blog.summary, // Map summary to excerpt
          category: blog.category || 'General', // Default category
          tags: blog.tags || [],
          contentLanguage: blog.language || 'en', // Map language to contentLanguage
          featuredImage: blog.featuredImage || null,
          status: blog.status || 'published',
          author: blog.author ? {
            id: blog.author,
            name: blog.author
          } : {
            id: 'unknown',
            name: 'Unknown Author'
          },
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt || blog.createdAt,
          views: blog.views || 0,
          likes: blog.likes || 0
        };
      }
      
      res.json(transformedBlog);
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new blog post
  async createBlog(req, res) {
    try {
      const {
        title,
        content,
        excerpt,
        category,
        tags,
        language,
        featuredImage,
        status = 'published'
      } = req.body;

      // Validation
      if (!title || !content || !category || !language) {
        return res.status(400).json({ 
          message: 'Title, content, category, and language are required' 
        });
      }

      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      // Get user ID - handle both req.user.id (from JWT payload) and req.user._id (from database object)
      const userId = req.user.id || req.user._id;

      // Create blog object - use contentLanguage instead of language to avoid MongoDB text index conflicts
      const formattedContent = this.formatContentToParagraphs(content);

      const newBlog = {
        _id: uuidv4(),
        title: title.trim(),
        content: formattedContent,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        tags: tags || [],
        contentLanguage: language, // Changed from 'language' to 'contentLanguage'
        featuredImage: featuredImage || null,
        status,
        author: {
          id: userId,
          name: req.user.email || req.user.username
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        likes: 0
      };

      // Insert blog
      await blogsCollection.insertOne(newBlog);

      // Note: No longer creating social posts since all content is now in blogs collection

      res.status(201).json({
        message: 'Blog post created successfully',
        blog: newBlog
      });
    } catch (error) {
      console.error('Error creating blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update blog post
  async updateBlog(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.author;
      delete updateData.createdAt;

      // Handle language field conversion
      if (updateData.language) {
        updateData.contentLanguage = updateData.language;
        delete updateData.language;
      }

      // Format content into proper paragraphs if content is being updated
      if (updateData.content) {
        updateData.content = this.formatContentToParagraphs(updateData.content);
      }

      // Add updated timestamp
      updateData.updatedAt = new Date();

      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      const result = await blogsCollection.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      res.json({
        message: 'Blog post updated successfully',
        blog: result.value
      });
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete blog post
  async deleteBlog(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      // Find and delete the blog
      const result = await blogsCollection.findOneAndDelete({ _id: id });

      if (!result.value) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      // Delete associated image if it exists
      if (result.value.featuredImage) {
        try {
          const imagePath = path.join(__dirname, '..', 'public', result.value.featuredImage);
          await fs.unlink(imagePath);
        } catch (imageError) {
          // Image file deletion failed silently
        }
      }

      res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Upload image for blog
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const imageUrl = `/uploads/blogs/${req.file.filename}`;
      res.json({
        message: 'Image uploaded successfully',
        imageUrl
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all categories
  async getCategories(req, res) {
    try {
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      const categories = await blogsCollection.distinct('category');
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all tags
  async getTags(req, res) {
    try {
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      const tags = await blogsCollection.distinct('tags');
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // PUBLIC METHODS - No authentication required for external Next.js apps

  // Get all published blogs (public access)
  async getPublicBlogs(req, res) {
    try {
      const { page = 1, limit = 10, category, tag, search, language } = req.query;

      // Build query - only published posts
      let query = { status: 'published' };

      if (category) {
        query.category = category;
      }

      if (tag) {
        query.tags = { $in: [tag] };
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } }
        ];
      }

      if (language) {
        query.contentLanguage = language;
      }

      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      // Execute query with pagination
      const totalBlogs = await blogsCollection.countDocuments(query);
      const blogs = await blogsCollection.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .toArray();

      // Transform blogs for public response (remove sensitive data)
      const transformedBlogs = blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        category: blog.category,
        tags: blog.tags,
        language: blog.contentLanguage,
        featuredImage: blog.featuredImage,
        author: blog.author ? {
          name: blog.author.name || 'Unknown Author'
        } : { name: 'Unknown Author' },
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        views: blog.views || 0,
        likes: blog.likes || 0
      }));

      // Set CORS headers for cross-domain access
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');

      res.json({
        blogs: transformedBlogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalBlogs,
          pages: Math.ceil(totalBlogs / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching public blogs:', error);
      res.status(500).json({ message: 'Error fetching blogs' });
    }
  }

  // Get single published blog post by ID (public access)
  async getPublicBlogById(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const blogsCollection = db.collection('blogs');

      const blog = await blogsCollection.findOne({
        _id: id,
        status: 'published'
      });

      if (!blog) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      // Transform for public response (remove sensitive data)
      const transformedBlog = {
        id: blog._id,
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        category: blog.category,
        tags: blog.tags || [],
        language: blog.contentLanguage || blog.language || 'en',
        featuredImage: blog.featuredImage || null,
        author: blog.author ? {
          name: blog.author.name || 'Unknown Author'
        } : { name: 'Unknown Author' },
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt || blog.createdAt,
        views: blog.views || 0,
        likes: blog.likes || 0
      };

      // Optional: Increment view count
      try {
        await blogsCollection.updateOne(
          { _id: id },
          { $inc: { views: 1 } }
        );
      } catch (viewError) {
        console.warn('Could not increment view count:', viewError);
      }

      // Set CORS headers for cross-domain access
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');

      res.json(transformedBlog);
    } catch (error) {
      console.error('Error fetching public blog:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new BlogController();
