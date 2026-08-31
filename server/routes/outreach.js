'use strict';

/**
 * Outreach routes — admin-only. Mounted by server.js as:
 *   app.use('/api/admin/outreach', outreachRoutes(outreachController))
 */

const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

// Late-bound router: mounted synchronously at startup (so the route always
// exists the moment the server accepts connections), but the controller is
// resolved from app.locals PER REQUEST. Before services finish initializing
// the controller is absent, so we answer 503 (retryable) instead of leaving
// the route unmounted — which previously surfaced as a misleading 404 during
// Railway cold starts / partial deploys.
const router = express.Router();
router.use(authenticateJWT, isAdmin);

// Resolve the controller or short-circuit with 503 while the app is warming up.
router.use((req, res, next) => {
  const controller = req.app.locals.outreachController;
  if (!controller) {
    return res.status(503).json({
      success: false,
      code: 'OUTREACH_INITIALIZING',
      message: 'Модулот се вчитува. Обидете се повторно за неколку секунди.',
    });
  }
  req.outreach = controller;
  next();
});

// Lists (audiences)
router.get('/lists',            (req, res) => req.outreach.getLists(req, res));
router.post('/lists',           (req, res) => req.outreach.createList(req, res));
router.put('/lists/:id',        (req, res) => req.outreach.updateList(req, res));
router.delete('/lists/:id',     (req, res) => req.outreach.deleteList(req, res));
router.post('/lists/merge',     (req, res) => req.outreach.mergeLists(req, res));
router.get('/export',           (req, res) => req.outreach.exportCsv(req, res));

// Contacts within a list
router.get('/lists/:id/contacts',    (req, res) => req.outreach.getContacts(req, res));
router.post('/lists/:id/contacts',   (req, res) => req.outreach.addContact(req, res));
router.post('/lists/:id/import',     (req, res) => req.outreach.importContacts(req, res));
router.put('/contacts/:contactId',   (req, res) => req.outreach.updateContact(req, res));
router.delete('/contacts/:contactId',(req, res) => req.outreach.deleteContact(req, res));

// Drip settings + control (pause/resume/run-now)
router.get('/drip',         (req, res) => req.outreach.getSettings(req, res));
router.put('/drip',         (req, res) => req.outreach.updateSettings(req, res));
router.post('/drip/enabled',(req, res) => req.outreach.setEnabled(req, res));
router.post('/drip/run-now',(req, res) => req.outreach.runNow(req, res));

module.exports = router;
