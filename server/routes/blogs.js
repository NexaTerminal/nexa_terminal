const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const blogController = require('../controllers/blogController');
const newsletterToken = require('../utils/blogNewsletterToken');

// PUBLIC ROUTES - No authentication required for external access
// Get all published blog posts (public)
router.get('/public', blogController.getPublicBlogs);

// Get single published blog post by ID (public)
router.get('/public/:id', blogController.getPublicBlogById);

// AUTHENTICATED ROUTES
// Get all blog posts (authenticated users can view)
router.get('/', authenticateJWT, blogController.getAllBlogs);

// Get single blog post by ID (authenticated users can view)
router.get('/:id', authenticateJWT, blogController.getBlogById);

// Signed newsletter link that unlocks a members-only post for 30 days (admin only)
router.get('/:id/newsletter-link', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const blog = await req.app.locals.db.collection('blogs')
      .findOne({ _id: req.params.id }, { projection: { _id: 1, slug: 1 } });
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });
    const { token, expiresAt } = newsletterToken.sign(blog._id);
    res.json({ path: `/blog/${blog.slug || blog._id}?nl=${token}`, expiresAt });
  } catch (error) {
    console.error('Error creating newsletter link:', error);
    res.status(500).json({ message: 'Failed to create newsletter link' });
  }
});

// Create new blog post (admin only)
router.post('/', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.createBlog);

// Update blog post (admin only)
router.put('/:id', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.updateBlog);

// Delete blog post (admin only)
router.delete('/:id', authenticateJWT, isAdmin, blogController.deleteBlog);

// Like/unlike blog post (authenticated users)
router.post('/:id/like', authenticateJWT, blogController.likeBlog);

// Dislike/un-dislike blog post (authenticated users)
router.post('/:id/dislike', authenticateJWT, blogController.dislikeBlog);

// Upload image for blog
router.post('/upload', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.uploadImage);

// Get all categories
router.get('/meta/categories', blogController.getCategories);

// Get all tags
router.get('/meta/tags', blogController.getTags);

module.exports = router;