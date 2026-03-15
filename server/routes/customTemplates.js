const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateJWT } = require('../middleware/auth');
const { requireVerifiedCompany } = require('../middleware/verificationMiddleware');
const { checkCredits, deductCredits } = require('../middleware/creditMiddleware');
const controller = require('../controllers/customTemplateController');
const historyController = require('../controllers/generationHistoryController');

const auth = [authenticateJWT, requireVerifiedCompany];

// Bulk data file upload (in-memory for xlsx parsing)
const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Static routes BEFORE parameterized ones
router.post('/suggest-fields', ...auth, controller.suggestFields);
router.get('/categories', ...auth, controller.getCategories);
router.get('/public/browse', ...auth, controller.listPublicTemplates);
router.get('/history', ...auth, historyController.listHistory);

// List user's templates
router.get('/', ...auth, controller.listTemplates);

// CRUD
router.post('/upload', ...auth, controller.upload.single('file'), controller.uploadTemplate);
router.post('/', ...auth, controller.createTemplate);

// Public template actions
router.post('/public/:id/clone', ...auth, controller.clonePublicTemplate);

// History routes (before :id param routes)
router.get('/history/:recordId/download', ...auth, historyController.downloadGenerated);
router.delete('/history/:recordId', ...auth, historyController.deleteRecord);

// Single template routes
router.get('/:id', ...auth, controller.getTemplate);
router.put('/:id', ...auth, controller.updateTemplate);
router.delete('/:id', ...auth, controller.deleteTemplate);

// Template actions
router.post('/:id/duplicate', ...auth, controller.duplicateTemplate);
router.post('/:id/generate', ...auth, checkCredits(1), deductCredits('DOCUMENT_GENERATION'), controller.generateDocument);
router.post('/:id/bulk-generate', ...auth, bulkUpload.single('dataFile'), controller.bulkGenerate);
router.post('/:id/publish', ...auth, controller.publishTemplate);
router.post('/:id/unpublish', ...auth, controller.unpublishTemplate);

// Version routes
router.get('/:id/versions', ...auth, controller.listVersions);
router.post('/:id/versions/:versionId/rollback', ...auth, controller.rollbackToVersion);

// Template-scoped history
router.get('/:id/history', ...auth, historyController.getTemplateHistory);

module.exports = router;
