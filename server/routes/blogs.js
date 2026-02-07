const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const blogController = require('../controllers/blogController');

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

// Create new blog post (admin only)
router.post('/', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.createBlog);

// Update blog post (admin only)
router.put('/:id', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.updateBlog);

// Delete blog post (admin only)
router.delete('/:id', authenticateJWT, isAdmin, blogController.deleteBlog);

// Like/unlike blog post (authenticated users)
router.post('/:id/like', authenticateJWT, blogController.likeBlog);

// Upload image for blog
router.post('/upload', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.uploadImage);

// Get all categories
router.get('/meta/categories', blogController.getCategories);

// Get all tags
router.get('/meta/tags', blogController.getTags);

module.exports = router;