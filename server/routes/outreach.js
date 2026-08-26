'use strict';

/**
 * Outreach routes — admin-only. Mounted by server.js as:
 *   app.use('/api/admin/outreach', outreachRoutes(outreachController))
 */

const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

module.exports = function outreachRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT, isAdmin);

  // Lists (audiences)
  router.get('/lists',            (req, res) => controller.getLists(req, res));
  router.post('/lists',           (req, res) => controller.createList(req, res));
  router.put('/lists/:id',        (req, res) => controller.updateList(req, res));
  router.delete('/lists/:id',     (req, res) => controller.deleteList(req, res));
  router.post('/lists/merge',     (req, res) => controller.mergeLists(req, res));
  router.get('/export',           (req, res) => controller.exportCsv(req, res));

  // Contacts within a list
  router.get('/lists/:id/contacts',    (req, res) => controller.getContacts(req, res));
  router.post('/lists/:id/contacts',   (req, res) => controller.addContact(req, res));
  router.post('/lists/:id/import',     (req, res) => controller.importContacts(req, res));
  router.put('/contacts/:contactId',   (req, res) => controller.updateContact(req, res));
  router.delete('/contacts/:contactId',(req, res) => controller.deleteContact(req, res));

  // Drip settings + control (pause/resume/run-now)
  router.get('/drip',         (req, res) => controller.getSettings(req, res));
  router.put('/drip',         (req, res) => controller.updateSettings(req, res));
  router.post('/drip/enabled',(req, res) => controller.setEnabled(req, res));
  router.post('/drip/run-now',(req, res) => controller.runNow(req, res));

  return router;
};
