const express = require('express');
const router = express.Router();
// Public blog routes - no authentication required

/**
 * GET /api/blog
 * Public route - Get all published blog posts (excerpt only, for SEO)
 * Returns: Array of blog posts with excerpt, not full content
 */
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Fetch all published blogs, sorted by newest first
    const blogs = await db.collection('blogs')
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .project({
        _id: 1,
        title: 1,
        excerpt: 1,
        featuredImage: 1,
        category: 1,
        tags: 1,
        createdAt: 1,
        'author.name': 1,
        views: 1
        // NOTE: Explicitly exclude 'content' for public API
      })
      .toArray();

    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      error: 'Failed to fetch blogs',
      message: error.message
    });
  }
});

/**
 * GET /api/blog/:id
 * Public route - Get single blog post by ID (excerpt only, for SEO)
 * Returns: Blog post with excerpt, NOT full content
 *
 * IMPORTANT: Full content only available in /terminal/blogs/:id (authenticated route)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    // Fetch blog by ID (public fields only)
    const blog = await db.collection('blogs')
      .findOne(
        { _id: id, status: 'published' },
        {
          projection: {
            _id: 1,
            title: 1,
            excerpt: 1,
            featuredImage: 1,
            category: 1,
            tags: 1,
            createdAt: 1,
            updatedAt: 1,
            author: 1,
            views: 1,
            likes: 1,
            contentLanguage: 1
            // NOTE: Explicitly exclude 'content' - only for authenticated users
          }
        }
      );

    if (!blog) {
      return res.status(404).json({
        error: 'Blog post not found',
        message: `No published blog found with ID: ${id}`
      });
    }

    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      error: 'Failed to fetch blog post',
      message: error.message
    });
  }
});

module.exports = router;
