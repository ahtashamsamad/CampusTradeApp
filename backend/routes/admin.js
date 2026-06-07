const express = require('express');
const router = express.Router();
const { decodeToken } = require('./authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

router.use(decodeToken);
router.use(requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/activity', adminController.getActivity);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users/:id/action', adminController.userAction);

router.get('/listings', adminController.getListings);
router.post('/listings/:id/action', adminController.listingAction);

router.get('/reports', adminController.getReports);
router.post('/reports/:id/action', adminController.reportAction);

router.get('/verifications', adminController.getVerifications);
router.post('/verifications/:id/action', adminController.verificationAction);

module.exports = router;
