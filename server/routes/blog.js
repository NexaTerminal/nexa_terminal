const express = require('express');
const router = express.Router();
const { optionalAuthJWT } = require('../middleware/auth');
const newsletterToken = require('../utils/blogNewsletterToken');
// Public blog routes - no authentication required.
// Full article text is a member benefit: anonymous readers get a teaser unless
// they arrive via a signed newsletter link (?nl=). See tasks/blog-members-gate-plan.md

const TEASER_RATIO = 0.35;
const TEASER_MIN_BLOCKS = 2;

// Cut HTML to the first ~35% of its top-level blocks (paragraphs, headings, lists...).
function buildTeaser(html) {
  const blocks = html.match(/[\s\S]*?<\/(p|h[1-6]|ul|ol|blockquote|table|figure|div)>/gi) || [];
  if (blocks.length <= TEASER_MIN_BLOCKS) return { teaser: blocks[0] || '', locked: blocks.length > 1 };
  const keep = Math.max(TEASER_MIN_BLOCKS, Math.ceil(blocks.length * TEASER_RATIO));
  return { teaser: blocks.slice(0, keep).join(''), locked: keep < blocks.length };
}

function readingMinutes(html) {
  const words = (html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

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
        views: 1,
        membersOnly: 1
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
 * Public route - Get single blog post by slug or ID.
 * Full content for logged-in users or a valid newsletter token (?nl=);
 * otherwise members-only posts return a teaser with `locked: true`.
 */
router.get('/:id', optionalAuthJWT, async (req, res) => {
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
      focusKeyword: 1,
      membersOnly: 1
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
    const content = formatTextToParagraphs(blog.content);
    const formattedBlog = {
      ...blog,
      content,
      excerpt: formatTextToParagraphs(blog.excerpt),
      promotedTool: blog.promotedTool || 'legal_health_check', // Default to legal health check
      readingTime: readingMinutes(content),
      locked: false,
      unlockedVia: null
    };

    // Missing flag = members-only (default on for all posts).
    if (blog.membersOnly !== false) {
      if (req.user) {
        formattedBlog.unlockedVia = 'member';
      } else if (req.query.nl && newsletterToken.verify(blog._id, String(req.query.nl))) {
        formattedBlog.unlockedVia = 'newsletter';
      } else {
        const { teaser, locked } = buildTeaser(content);
        if (locked) {
          formattedBlog.content = teaser;
          formattedBlog.locked = true;
        }
      }
    }

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
