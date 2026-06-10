'use strict';

const express = require('express');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

function userRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT);
  router.get('/me',                (req, res) => controller.listMine(req, res));
  router.get('/:id/download',      (req, res) => controller.downloadMine(req, res));
  return router;
}

function adminRoutes(controller) {
  const router = express.Router();
  router.use(authenticateJWT, isAdmin);
  router.get('/',              (req, res) => controller.listAll(req, res));
  // Numbering control — literal paths registered before /:id params.
  router.get('/counter',       (req, res) => controller.getCounter(req, res));
  router.put('/counter',       (req, res) => controller.setCounter(req, res));
  router.post('/resequence',   (req, res) => controller.resequence(req, res));
  router.patch('/:id/status',  (req, res) => controller.updateStatus(req, res));
  router.delete('/:id',        (req, res) => controller.remove(req, res));
  return router;
}

module.exports = { userRoutes, adminRoutes };
