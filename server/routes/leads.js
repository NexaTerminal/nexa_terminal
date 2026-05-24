/**
 * Lead routes — three families:
 *
 *   public (HMAC):          POST /api/leads/inbound
 *   admin (JWT + isAdmin):  /api/admin/leads/*
 *   admin_user (JWT + role): /api/admin-user/leads/*
 *
 * Each family is exported as a factory taking the controller instance.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const requireAdminUser = require('../middleware/requireAdminUser');
const leadWebhookHmac = require('../middleware/leadWebhookHmac');

// Tight rate limit for the inbound webhook to deter abuse.
const inboundLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 60,                  // 60 requests per IP per window
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

function publicRoutes(controller) {
  const router = express.Router();
  router.post('/inbound', inboundLimiter, leadWebhookHmac, (req, res) => controller.inbound(req, res));
  return router;
}

function adminRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT, isAdmin);
  router.get('/',                  (req, res) => controller.listAdmin(req, res));
  router.get('/candidates',        (req, res) => controller.listCandidates(req, res));
  router.get('/:id',               (req, res) => controller.getOneAdmin(req, res));
  router.post('/:id/assign',       (req, res) => controller.assignAdmin(req, res));
  router.post('/:id/offer',        (req, res) => controller.offerAdmin(req, res));
  router.post('/:id/dismiss',      (req, res) => controller.dismissAdmin(req, res));
  return router;
}

function adminUserRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT, requireAdminUser);
  router.get('/',           (req, res) => controller.listMine(req, res));
  router.get('/available',  (req, res) => controller.listAvailableMine(req, res));
  router.post('/:id/claim', (req, res) => controller.claimMine(req, res));
  router.patch('/:id',      (req, res) => controller.updateMine(req, res));
  return router;
}

module.exports = { publicRoutes, adminRoutes, adminUserRoutes };
