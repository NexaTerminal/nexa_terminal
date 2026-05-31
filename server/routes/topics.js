const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/topicsController');

const router = express.Router();
router.use(authenticateJWT);
router.use(c.requireCOrAdmin);

router.get('/worklist',                  c.listOpenWorklist);
router.get('/worklist/:id',              c.getWorklistItem);
router.post('/worklist/:id/request',     c.requestToOpen);

router.get('/submissions',               c.listMineSubmissions);
router.get('/submissions/:id',           c.getSubmission);
router.put('/submissions/:id',           c.saveDraft);
router.post('/submissions/:id/submit',   c.submitForReview);
router.post('/submissions/:id/release',  c.release);

router.get('/published-mine',            c.listMinePublished);

module.exports = router;
