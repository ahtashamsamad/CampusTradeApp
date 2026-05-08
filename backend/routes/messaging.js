const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { decodeToken } = require('./authMiddleware');

// All messaging routes are protected in production, but handled gracefully in dev
router.use(decodeToken);

// Endpoints matching frontend calls
router.get('/:userId/conversations', messagingController.getUserChats);
router.get('/:chatId/messages', messagingController.getMessages);
router.post('/send', messagingController.sendMessage);

// Standard REST-ish endpoints (keep for compatibility if needed)
router.get('/chats', messagingController.getUserChats);
router.get('/chats/:chatId/messages', messagingController.getMessages);
router.post('/chats/:chatId/messages', messagingController.sendMessage);

module.exports = router;
