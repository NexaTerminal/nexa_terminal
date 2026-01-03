/**
 * Document Preview Routes
 * Public routes for previewing document content before generation
 */

const express = require('express');
const router = express.Router();

function initializeDocumentPreviewRoutes(documentPreviewController) {
  /**
   * POST /api/document-preview/:documentType
   * Generate HTML preview of document
   * PUBLIC - No authentication required
   */
  router.post('/:documentType', async (req, res) => {
    await documentPreviewController.generatePreview(req, res);
  });

  return router;
}

module.exports = initializeDocumentPreviewRoutes;
