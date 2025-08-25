const express = require('express');
const router = express.Router();
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const investmentController = require('../controllers/investmentController');

// Get all investments
router.get('/', investmentController.getAllInvestments);

// Get single investment by ID
router.get('/:id', investmentController.getInvestmentById);

// Create new investment (admin only)
router.post('/', authenticateJWT, isAdmin, investmentController.createInvestment);

// Update investment (admin only)
router.put('/:id', authenticateJWT, isAdmin, investmentController.updateInvestment);

// Delete investment (admin only)
router.delete('/:id', authenticateJWT, isAdmin, investmentController.deleteInvestment);

// Get investment sectors
router.get('/meta/sectors', investmentController.getSectors);

// Get investment locations
router.get('/meta/locations', investmentController.getLocations);

module.exports = router;