const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { clearCache } = require('../middleware/cache');
const SocialController = require('../controllers/socialController');

// Create instance of the SocialController
const socialController = new SocialController();

// Get newsfeed
router.get('/newsfeed', socialController.getNewsfeed);

// Get user's social posts
router.get('/user', authenticateJWT, socialController.getUserPosts);

// Create new social post
router.post('/posts', authenticateJWT, (req, res, next) => {
  socialController.createPost(req, res).then(() => {
    // Clear newsfeed cache after successful post creation
    clearCache('newsfeed');
  }).catch(next);
});

// Get single post by ID
router.get('/posts/:id', socialController.getPostById);

// Update post (only by author)
router.put('/posts/:id', authenticateJWT, (req, res, next) => {
  socialController.updatePost(req, res).then(() => {
    // Clear newsfeed cache after successful post update
    clearCache('newsfeed');
  }).catch(next);
});

// Delete post (only by author)
router.delete('/posts/:id', authenticateJWT, (req, res, next) => {
  socialController.deletePost(req, res).then(() => {
    // Clear newsfeed cache after successful post deletion
    clearCache('newsfeed');
  }).catch(next);
});

// Like/unlike post
router.post('/posts/:id/like', authenticateJWT, (req, res, next) => {
  socialController.likePost(req, res).then(() => {
    // Clear newsfeed cache after like/unlike
    clearCache('newsfeed');
  }).catch(next);
});

// Add comment to post
router.post('/posts/:id/comments', authenticateJWT, (req, res, next) => {
  socialController.commentOnPost(req, res).then(() => {
    // Clear newsfeed cache after new comment
    clearCache('newsfeed');
  }).catch(next);
});

module.exports = router;