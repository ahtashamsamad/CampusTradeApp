const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { decodeToken } = require('./authMiddleware');

// Notification routes
router.get('/', notificationsController.getNotifications);
router.post('/read-all', notificationsController.markAllAsRead);
router.post('/:id/read', notificationsController.markAsRead);
router.delete('/:id', notificationsController.dismissNotification);
router.delete('/', notificationsController.clearAllNotifications);

module.exports = router;
