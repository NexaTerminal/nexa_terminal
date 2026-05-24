/**
 * Admin-user routes — `/api/admin-user/...`
 * Used by paying Admin-plan accounts to manage their team.
 */

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const requireAdminUser = require('../middleware/requireAdminUser');

module.exports = function buildAdminUserRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT, requireAdminUser);

  router.get('/me',                     (req, res) => controller.getSummary(req, res));
  router.get('/seats',                  (req, res) => controller.listSeats(req, res));
  router.post('/seats',                 (req, res) => controller.inviteSeat(req, res));
  router.delete('/seats/:id',             (req, res) => controller.revokeSeat(req, res));
  router.post('/seats/:id/reactivate',    (req, res) => controller.reactivateSeat(req, res));
  router.post('/seats/:id/reset-password',(req, res) => controller.resetSeatPassword(req, res));

  return router;
};
