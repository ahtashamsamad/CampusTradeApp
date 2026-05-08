const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { decodeToken } = require('./authMiddleware');

// Route to submit email for verification
// Using decodeToken to ensure whoever is verifying has an account first
router.post('/', decodeToken, verificationController.verifyUniversityEmail);

module.exports = router;
