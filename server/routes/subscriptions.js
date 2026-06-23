/**
 * Subscription routes — user-facing + admin-facing.
 *
 * Mounted by server.js as:
 *   app.use('/api/subscription',       subscriptionRoutes.user(controller))
 *   app.use('/api/admin/subscriptions', subscriptionRoutes.admin(controller))
 *
 * Gated by feature flag `adminUserPlan` at the mount site.
 */

const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

function userRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT);
  router.get('/me',                (req, res) => controller.getMine(req, res));
  router.post('/request-approval', (req, res) => controller.requestApproval(req, res));
  router.post('/request-invoice',  (req, res) => controller.requestInvoice(req, res));
  router.post('/redeem-code',      (req, res) => controller.redeemCode(req, res));
  return router;
}

function adminRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT, isAdmin);
  router.get('/pending',              (req, res) => controller.listPending(req, res));
  router.get('/',                     (req, res) => controller.listAll(req, res));
  router.post('/:userId/approve',     (req, res) => controller.approve(req, res));
  router.post('/:userId/reject',      (req, res) => controller.reject(req, res));
  router.post('/:userId/extend',      (req, res) => controller.extend(req, res));
  router.post('/:userId/suspend',     (req, res) => controller.suspend(req, res));
  // Promo / sales codes. Static paths are registered BEFORE the `:userId`
  // routes above only matter for collisions; `/codes` does not collide with
  // `/:userId/*`, so ordering is safe.
  router.get('/codes',                  (req, res) => controller.listCodes(req, res));
  router.post('/codes',                 (req, res) => controller.createCode(req, res));
  router.post('/codes/send-invite',     (req, res) => controller.sendInvite(req, res));
  router.post('/codes/:code/deactivate',(req, res) => controller.deactivateCode(req, res));
  return router;
}

module.exports = { userRoutes, adminRoutes };
