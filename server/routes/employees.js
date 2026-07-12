// HR module — routes for „Регистар на вработени".
// Mounted at /api/employees behind subscriptionGuard (server.js) — a
// Basic-tier tool like contracts, not credit-metered. authenticateJWT
// establishes req.user.

const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const c = require('../controllers/employeeController');

const router = express.Router();

router.use(authenticateJWT);

// Admin: manual HR reminder run (testing / catch-up). Registered before /:id
// patterns; no POST /:id route exists so there is no capture conflict.
router.post('/_run-reminders', isAdmin, async (req, res) => {
  try {
    const result = await req.app.locals.hrReminderService.evaluateAndSend(new Date());
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[employees] manual reminder run failed:', err);
    res.status(500).json({ success: false });
  }
});

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.get);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/leave', c.addLeaveRecord);
router.delete('/:id/leave/:lid', c.removeLeaveRecord);

module.exports = router;
