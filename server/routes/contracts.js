// Contract Management System v1 — routes (tasks/cms-v1-plan.md §4).
// Mounted at /api/contracts behind subscriptionGuard (server.js) — CMS is a
// Basic-tier tool, not credit-metered. authenticateJWT establishes req.user.

const express = require('express');
const multer = require('multer');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const contractController = require('../controllers/contractController');

const router = express.Router();

const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(docx|pdf)$/i.test(file.originalname);
    cb(ok ? null : new Error('Дозволени се само .docx и .pdf датотеки.'), ok);
  }
});

router.use(authenticateJWT);

// Admin: manual reminder run (testing / catch-up). Registered before /:id
// patterns; no POST /:id route exists so there is no capture conflict.
router.post('/_run-reminders', isAdmin, async (req, res) => {
  try {
    const result = await req.app.locals.contractReminderService.evaluateAndSend(new Date());
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[contracts] manual reminder run failed:', err);
    res.status(500).json({ success: false });
  }
});

router.get('/', contractController.list);
router.get('/upcoming', contractController.upcoming);
router.post('/', contractController.create);
router.post('/from-share/:shareToken', contractController.fromShare);
router.post('/upload', uploadFile.single('file'), contractController.upload);
router.get('/:id', contractController.get);
router.patch('/:id', contractController.update);
router.delete('/:id', contractController.remove);
router.post('/:id/obligations', contractController.addObligation);
router.patch('/:id/obligations/:oid', contractController.updateObligation);
router.get('/:id/download', contractController.download);

module.exports = router;
