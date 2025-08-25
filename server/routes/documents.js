const express = require('express');
const router = express.Router();
const passport = require('passport');
const { validateInput, validateObjectId } = require('../middleware/validation');
const documentController = require('../controllers/documentController');
const { generateDocument } = require('../controllers/documentGeneratorController');
const { authenticateJWT } = require('../middleware/auth');

// Authentication middleware
const authMiddleware = passport.authenticate('jwt', { session: false });

// Middleware to get DB instance
router.use((req, res, next) => {
    req.db = req.app.locals.db;
    next();
});

// --- Document Management Routes ---
router.get('/', authMiddleware, documentController.getAllDocuments);
router.get('/:id', authMiddleware, validateObjectId('id'), documentController.getDocumentById);
router.delete('/:id', authMiddleware, validateObjectId('id'), documentController.deleteDocument);

// --- Document Generation Routes ---
// Generic document generation route
router.post('/generate', authenticateJWT, generateDocument);

module.exports = router;
