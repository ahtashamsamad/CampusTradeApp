const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listingsController');
const { decodeToken } = require('./authMiddleware');

// Public routes
router.get('/', listingsController.getAllListings);
router.get('/saved', listingsController.getSavedListings);
router.get('/my', decodeToken, listingsController.getMyListings);
router.get('/search', listingsController.searchListings);
router.get('/:id', listingsController.getListingById);

// Protected routes (require valid Firebase token)
router.post('/', decodeToken, listingsController.createListing);

// You can add PUT and DELETE routes later following the same pattern
// router.put('/:id', decodeToken, listingsController.updateListing);
router.delete('/:id', decodeToken, listingsController.deleteListing);

module.exports = router;
