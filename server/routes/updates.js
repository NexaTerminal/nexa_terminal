const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const c = require('../controllers/updatesController');

// Member feed — any logged-in user.
router.get('/', authenticateJWT, c.list);
router.get('/:id', authenticateJWT, c.getOne);

// Engagement — any logged-in user can like / comment.
router.post('/:id/like',                authenticateJWT, c.toggleLike);
router.post('/:id/comments',            authenticateJWT, c.addComment);
router.delete('/:id/comments/:commentId', authenticateJWT, c.deleteComment);

// Admin authoring console.
router.get('/admin/all', authenticateJWT, isAdmin, c.adminList);
router.post('/',         authenticateJWT, isAdmin, c.create);
router.put('/:id',       authenticateJWT, isAdmin, c.update);
router.delete('/:id',    authenticateJWT, isAdmin, c.remove);

module.exports = router;
