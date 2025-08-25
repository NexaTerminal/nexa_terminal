const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const blogController = require('../controllers/blogController');

// Get all blog posts
router.get('/', blogController.getAllBlogs);

// Get single blog post by ID
router.get('/:id', blogController.getBlogById);

// Create new blog post (admin only)
router.post('/', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.createBlog);

// Update blog post (admin only)
router.put('/:id', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.updateBlog);

// Delete blog post (admin only)
router.delete('/:id', authenticateJWT, isAdmin, blogController.deleteBlog);

// Upload image for blog
router.post('/upload', authenticateJWT, isAdmin, blogController.upload.single('image'), blogController.uploadImage);

// Get all categories
router.get('/meta/categories', blogController.getCategories);

// Get all tags
router.get('/meta/tags', blogController.getTags);

module.exports = router;