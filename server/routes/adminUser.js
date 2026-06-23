/**
 * Admin-user routes — `/api/admin-user/...`
 * Used by paying Admin-plan accounts to manage their team.
 */

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const requireAdminUser = require('../middleware/requireAdminUser');
const requireSeatManager = require('../middleware/requireSeatManager');

module.exports = function buildAdminUserRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT);

  // Pro dashboard summary — Pro (admin_user) only.
  router.get('/me', requireAdminUser, (req, res) => controller.getSummary(req, res));

  // Sub-user (seat) management — both tiers (Basic co-workers / Pro clients).
  // The seat TYPE is derived from the caller's role inside SubSeatService.
  router.get('/seats',                     requireSeatManager, (req, res) => controller.listSeats(req, res));
  router.post('/seats',                    requireSeatManager, (req, res) => controller.inviteSeat(req, res));
  router.delete('/seats/:id',              requireSeatManager, (req, res) => controller.revokeSeat(req, res));
  router.post('/seats/:id/reactivate',     requireSeatManager, (req, res) => controller.reactivateSeat(req, res));
  router.post('/seats/:id/reset-password', requireSeatManager, (req, res) => controller.resetSeatPassword(req, res));

  return router;
};
