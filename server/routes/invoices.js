'use strict';

/**
 * Invoices routes — user-facing + admin-facing.
 *
 * Mount points:
 *   app.use('/api/invoices',       routes.userRoutes(controller))
 *   app.use('/api/admin/invoices', routes.adminRoutes(controller))
 */

const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

function userRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT);
  router.get('/me', (req, res) => controller.listMine(req, res));
  return router;
}

function adminRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT, isAdmin);
  router.get('/user/:userId',  (req, res) => controller.listForUser(req, res));
  router.post('/user/:userId', (req, res) => controller.create(req, res));
  router.put('/:invoiceId',    (req, res) => controller.update(req, res));
  router.delete('/:invoiceId', (req, res) => controller.remove(req, res));
  return router;
}

module.exports = { userRoutes, adminRoutes };
