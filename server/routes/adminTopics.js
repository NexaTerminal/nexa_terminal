const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/topicsController');

const router = express.Router();
router.use(authenticateJWT);
router.use(c.requireAdmin);

// Worklist
router.get('/worklist',                          c.adminWorklistList);
router.post('/worklist',                         c.adminWorklistCreate);
router.get('/worklist/:id',                      c.adminWorklistGet);
router.put('/worklist/:id',                      c.adminWorklistUpdate);
router.post('/worklist/:id/archive',             c.adminWorklistArchive);

// Submissions queue
router.get('/submissions',                       c.adminSubmissionsList);
router.post('/submissions/:id/approve',          c.adminSubmissionApproveRequest);
router.post('/submissions/:id/decline',          c.adminSubmissionDecline);
router.post('/submissions/:id/return',           c.adminSubmissionReturn);
router.post('/submissions/:id/accept',           c.adminSubmissionAccept);
router.post('/submissions/:id/reject',           c.adminSubmissionReject);
router.post('/submissions/:id/force-release',    c.adminSubmissionForceRelease);
router.post('/submissions/:id/publish',          c.adminSubmissionPublish);

module.exports = router;
