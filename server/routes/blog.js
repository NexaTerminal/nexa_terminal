const express = require('express');
const router = express.Router();
// Public blog routes - no authentication required

/**
 * Helper function to format plain text into HTML paragraphs
 * Converts line breaks into proper <p> tags for better readability
 */
function formatTextToParagraphs(text) {
  if (!text) return '';

  // If already has HTML paragraph tags, return as-is
  if (text.includes('<p>') || text.includes('<div>') || text.includes('<br') || text.includes('<h')) {
    return text;
  }

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by double line breaks (paragraph separators)
  let paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

  if (paragraphs.length > 1) {
    // Multiple paragraphs found - wrap each in <p> tags
    paragraphs = paragraphs.map(p =>
      p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
    ).filter(p => p);
  } else {
    // Check for single line breaks
    const singleBreakParagraphs = text.split(/\n/).filter(p => p.trim());

    if (singleBreakParagraphs.length > 1) {
      paragraphs = singleBreakParagraphs.map(p => p.trim()).filter(p => p);
    } else {
      // No line breaks - keep as single paragraph
      paragraphs = [text.trim()];
    }
  }

  return paragraphs.map(p => `<p>${p}</p>`).join('\n');
}

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
        slug: 1,
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

    // Format excerpts to ensure proper paragraph structure
    const formattedBlogs = blogs.map(blog => ({
      ...blog,
      excerpt: formatTextToParagraphs(blog.excerpt)
    }));

    res.json(formattedBlogs);
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
 * Public route - Get single blog post by ID with FULL content
 * Returns: Blog post with full content and promotedTool for banner display
 *
 * NOTE: Full content now publicly available - promotional banner shows at end
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    const projection = {
      _id: 1,
      slug: 1,
      title: 1,
      content: 1,
      excerpt: 1,
      featuredImage: 1,
      category: 1,
      tags: 1,
      createdAt: 1,
      updatedAt: 1,
      author: 1,
      views: 1,
      likes: 1,
      contentLanguage: 1,
      promotedTool: 1,
      metaTitle: 1,
      metaDescription: 1,
      focusKeyword: 1
    };

    // Try to find by slug first, then fall back to _id
    let blog = await db.collection('blogs')
      .findOne({ slug: id, status: 'published' }, { projection });

    if (!blog) {
      blog = await db.collection('blogs')
        .findOne({ _id: id, status: 'published' }, { projection });
    }

    if (!blog) {
      return res.status(404).json({
        error: 'Blog post not found',
        message: `No published blog found with ID: ${id}`
      });
    }

    // Increment view count
    try {
      await db.collection('blogs').updateOne(
        { _id: blog._id },
        { $inc: { views: 1 } }
      );
    } catch (viewError) {
      console.warn('Could not increment view count:', viewError);
    }

    // Format content and excerpt to ensure proper paragraph structure
    const formattedBlog = {
      ...blog,
      content: formatTextToParagraphs(blog.content),
      excerpt: formatTextToParagraphs(blog.excerpt),
      promotedTool: blog.promotedTool || 'legal_health_check' // Default to legal health check
    };

    res.json(formattedBlog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      error: 'Failed to fetch blog post',
      message: error.message
    });
  }
});

module.exports = router;
