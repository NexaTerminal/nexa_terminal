const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const c = require('../controllers/casesController');

const router = express.Router();
router.use(authenticateJWT);
router.use(c.requireProOrAdmin);

// Full Excel report — must precede '/:id' so "export" isn't read as an id.
router.get('/export',  c.exportXlsx);

// Case CRUD
router.get('/',        c.list);
router.post('/',       c.create);
router.get('/:id',     c.get);
router.put('/:id',     c.update);
router.delete('/:id',  c.remove);
router.put('/:id/public', c.setPublic);

// AI brief helper
router.post('/:id/ai-brief', c.aiBrief);

// Deadlines (рокови)
router.post('/:id/deadlines',                 c.addDeadline);
router.put('/:id/deadlines/:deadlineId',      c.updateDeadline);
router.delete('/:id/deadlines/:deadlineId',   c.removeDeadline);

// Timeline (дневник)
router.post('/:id/timeline',            c.addEntry);
router.put('/:id/timeline/:entryId',    c.updateEntry);
router.delete('/:id/timeline/:entryId', c.removeEntry);

module.exports = router;
