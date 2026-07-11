const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { authenticateJWT } = require('../middleware/auth');
const subscriptionGuard = require('../middleware/subscriptionGuard');
const c = require('../controllers/newsletterAdsController');

const router = express.Router();

// Banner upload — disk-storage convention shared with blog covers, but its
// own directory (created here; unlike uploads/blogs it doesn't exist yet).
// JPG/PNG only: WEBP renders inconsistently in email clients.
const UPLOAD_DIR = 'public/uploads/newsletter-ads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const bannerUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png'].includes(file.mimetype);
    cb(ok ? null : new Error('Дозволени се само JPG или PNG слики.'), ok);
  }
});

// Any ACTIVE subscriber (Basic or Pro) may use the feature; the guard returns
// 402 for trial/suspended/cancelled and the client shows the SubscriptionGate.
router.use(authenticateJWT);
router.use(subscriptionGuard);
router.use(c.blockSubSeats);

router.get('/availability', c.availability);
router.get('/mine',         c.mine);
router.post('/',            bannerUpload.single('image'), c.book);

module.exports = router;
