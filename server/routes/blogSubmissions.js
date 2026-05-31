const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/blogSubmissionsController');

const router = express.Router();

// Cover-image upload — same disk-storage convention as blogController.upload
const coverUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/blogs'),
    filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPEG/PNG/WEBP images allowed.'), ok);
  }
});

// ── member endpoints (auth + tier gate) ─────────────────────────────────────
router.use(authenticateJWT);

// All member endpoints are gated to B/C/admin (Type A and sub-seats blocked).
router.get('/',           c.requireBcOrAdmin, c.listMine);
router.get('/published',  c.requireBcOrAdmin, c.listMyPublished);
router.post('/',          c.requireBcOrAdmin, c.create);
router.get('/:id',        c.requireBcOrAdmin, c.getOne);
router.put('/:id',        c.requireBcOrAdmin, c.update);

// Submit & retry additionally require not-trial (paid B/C/admin).
router.post('/:id/submit', c.requireSubmitAllowed, c.submit);
router.post('/:id/retry',  c.requireSubmitAllowed, c.retry);

// Image upload (tier-gated; reuses the existing storage convention)
router.post('/upload-image', c.requireBcOrAdmin, coverUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided.' });
  return res.json({ success: true, imageUrl: `/uploads/blogs/${req.file.filename}` });
});

module.exports = router;
