const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');

/**
 * Shared Documents Routes
 *
 * Provides both authenticated (for document owners) and public (for third parties)
 * endpoints for managing and accessing shareable documents.
 *
 * Public endpoints are rate-limited to prevent abuse.
 */

// Rate limiting for public endpoints
// More aggressive than general API to prevent abuse of file downloads
const publicRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 100, // Max 100 requests per hour per IP
  message: {
    success: false,
    message: 'Премногу барања од оваа IP адреса. Обидете се повторно подоцна.'
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => {
    // Skip rate limiting in development for easier testing
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Initialize routes with controller
 * Controller instance is attached to app.locals in server.js
 */
const initializeRoutes = (sharedDocumentsController) => {
  // ==========================================
  // AUTHENTICATED ROUTES (for document owners)
  // ==========================================

  /**
   * Create a shareable link
   * POST /api/shared-documents/create
   * Auth: Required (JWT)
   *
   * Note: This endpoint is not typically called directly from frontend.
   * Instead, baseDocumentController automatically creates share links
   * when documents are generated.
   */
  router.post('/create',
    authenticateJWT,
    sharedDocumentsController.createShareableLink
  );

  /**
   * List user's shared documents
   * GET /api/shared-documents/my-documents?page=1&limit=20
   * Auth: Required (JWT)
   */
  router.get('/my-documents',
    authenticateJWT,
    sharedDocumentsController.listMySharedDocuments
  );

  /**
   * Revoke a shareable link
   * DELETE /api/shared-documents/:shareToken/revoke
   * Auth: Required (JWT)
   */
  router.delete('/:shareToken/revoke',
    authenticateJWT,
    sharedDocumentsController.revokeShareableLink
  );

  // ==========================================
  // PUBLIC ROUTES (no authentication required)
  // ==========================================

  /**
   * Get shared document metadata
   * GET /api/shared-documents/:shareToken
   * Auth: None (public access)
   * Rate Limit: 100 requests per hour per IP
   */
  router.get('/:shareToken',
    publicRateLimit,
    sharedDocumentsController.getSharedDocument
  );

  /**
   * Download shared document
   * GET /api/shared-documents/:shareToken/download
   * Auth: None (public access)
   * Rate Limit: 100 requests per hour per IP
   */
  router.get('/:shareToken/download',
    publicRateLimit,
    sharedDocumentsController.downloadSharedDocument
  );

  /**
   * Confirm/approve shared document
   * POST /api/shared-documents/:shareToken/confirm
   * Auth: None (public access)
   * Rate Limit: 100 requests per hour per IP
   * Body: { confirmedBy: "Name or Email" }
   */
  router.post('/:shareToken/confirm',
    publicRateLimit,
    sharedDocumentsController.confirmSharedDocument
  );

  /**
   * Add comment to shared document
   * POST /api/shared-documents/:shareToken/comment
   * Auth: None (public access)
   * Rate Limit: 100 requests per hour per IP
   * Body: { name: "...", email: "...", comment: "..." }
   */
  router.post('/:shareToken/comment',
    publicRateLimit,
    sharedDocumentsController.addCommentToSharedDocument
  );

  return router;
};

// Export as function that takes controller
module.exports = initializeRoutes;
